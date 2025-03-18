const express = require("express");
const Bracket = require("../models/Bracket");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix");

const router = express.Router();

// Helper: calculate next power of 2
function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

// Recursive function to generate standard seeding for a bracket of size p (p must be a power of 2)
function generateSeeding(p) {
  if (p === 1) return [1];
  const half = p / 2;
  const left = generateSeeding(half);
  const right = left.map((seed) => p + 1 - seed);
  return [...left, ...right];
}

/**
 * Generic dynamic seeding mapping (for non-12-team brackets).
 * For n teams, determine p = nextPowerOfTwo(n) and create matchups for Round 1 with byes.
 */
function getDynamicSeedMapping(n) {
  const p = nextPowerOfTwo(n);
  const seedingOrder = generateSeeding(p);

  let rounds = [];
  let round1 = [];
  for (let i = 0; i < p; i += 2) {
    const s1 = seedingOrder[i] <= n ? seedingOrder[i] : null;
    const s2 = seedingOrder[i + 1] <= n ? seedingOrder[i + 1] : null;
    round1.push({
      matchId: `R1-M${i / 2 + 1}`,
      seed1: s1,
      seed2: s2,
      nextMatchIdIfWin: null,
      nextMatchSlot: i % 2 === 0 ? "racer1" : "racer2",
    });
  }
  rounds.push(round1);

  let currentRoundCount = round1.length;
  let roundNum = 2;
  while (currentRoundCount > 1) {
    let nextRound = [];
    for (let i = 0; i < currentRoundCount; i += 2) {
      nextRound.push({
        matchId: `R${roundNum}-M${Math.floor(i / 2) + 1}`,
        seed1: null,
        seed2: null,
        nextMatchIdIfWin: null,
        nextMatchSlot: i % 2 === 0 ? "racer1" : "racer2",
      });
    }
    rounds.push(nextRound);
    currentRoundCount = nextRound.length;
    roundNum++;
  }

  // Set pointers for winners to advance
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((match, i) => {
      const nextRoundMatch = rounds[r + 1][Math.floor(i / 2)];
      match.nextMatchIdIfWin = nextRoundMatch.matchId;
    });
  }

  return rounds;
}

/**
 * Custom seeding mapping for 12 teams (Winners bracket).
 */
function getSeedMappingFor12() {
  return {
    winnersBracket: [
      // Round 1: seeds 5–12
      [
        {
          matchId: "WB-R1-M1",
          seed1: 5,
          seed2: 12,
          nextMatchIdIfWin: "WB-R2-M2",
          nextMatchSlot: "racer2",
        },
        {
          matchId: "WB-R1-M2",
          seed1: 8,
          seed2: 9,
          nextMatchIdIfWin: "WB-R2-M1",
          nextMatchSlot: "racer2",
        },
        {
          matchId: "WB-R1-M3",
          seed1: 6,
          seed2: 11,
          nextMatchIdIfWin: "WB-R2-M3",
          nextMatchSlot: "racer2",
        },
        {
          matchId: "WB-R1-M4",
          seed1: 7,
          seed2: 10,
          nextMatchIdIfWin: "WB-R2-M4",
          nextMatchSlot: "racer2",
        },
      ],
      // Round 2: insert bye seeds (1–4)
      [
        {
          matchId: "WB-R2-M1",
          seed1: 1,
          seed2: null,
          nextMatchIdIfWin: "WB-R3-M1",
          nextMatchSlot: "racer1",
        },
        {
          matchId: "WB-R2-M2",
          seed1: 4,
          seed2: null,
          nextMatchIdIfWin: "WB-R3-M1",
          nextMatchSlot: "racer2",
        },
        {
          matchId: "WB-R2-M3",
          seed1: 3,
          seed2: null,
          nextMatchIdIfWin: "WB-R3-M2",
          nextMatchSlot: "racer1",
        },
        {
          matchId: "WB-R2-M4",
          seed1: 2,
          seed2: null,
          nextMatchIdIfWin: "WB-R3-M2",
          nextMatchSlot: "racer2",
        },
      ],
      // Round 3
      [
        {
          matchId: "WB-R3-M1",
          seed1: null,
          seed2: null,
          nextMatchIdIfWin: "WB-R4-M1",
          nextMatchSlot: "racer1",
        },
        {
          matchId: "WB-R3-M2",
          seed1: null,
          seed2: null,
          nextMatchIdIfWin: "WB-R4-M1",
          nextMatchSlot: "racer2",
        },
      ],
      // Round 4: final of winners bracket
      [
        {
          matchId: "WB-R4-M1",
          seed1: null,
          seed2: null,
          nextMatchIdIfWin: "F1-M1",
          nextMatchSlot: "racer1",
        },
      ],
    ],
  };
}

/**
 * Custom losers-bracket for 12 teams, with 5 LB rounds.
 * Now includes nextMatchIdIfWin/nextMatchSlot so winners auto-advance in LB.
 */
function computeLosersBracketFor12(winnersBracket) {
  // === Round 1 (LB1) ===
  // 4 matches, each fed by losers of WB R1 (racer1) & WB R2 (racer2)
  const wb1 = winnersBracket[0].matchups; // 4 matches in WB R1
  const LB1Matches = wb1.map((_, idx) => ({
    matchId: `L1-M${idx + 1}`,
    racer1: null,
    racer2: null,
    winner: null,
    loser: null,
    nextMatchIdIfWin: null,
    nextMatchSlot: null,
    meta: {},
  }));

  // === Round 2 (LB2) ===
  // 2 matches, each has 2 winners from LB1
  const LB2Matches = [];
  for (let i = 0; i < LB1Matches.length; i += 2) {
    LB2Matches.push({
      matchId: `L2-M${Math.floor(i / 2) + 1}`,
      racer1: null,
      racer2: null,
      winner: null,
      loser: null,
      nextMatchIdIfWin: null,
      nextMatchSlot: null,
      meta: {},
    });
  }

  // === Round 3 (LB3) ===
  // 2 matches: each LB2 winner meets a WB round 3 loser
  const LB3Matches = [];
  for (let i = 0; i < LB2Matches.length; i++) {
    LB3Matches.push({
      matchId: `L3-M${i + 1}`,
      racer1: null,
      racer2: null,
      winner: null,
      loser: null,
      nextMatchIdIfWin: null,
      nextMatchSlot: null,
      meta: {},
    });
  }

  // === Round 4 (LB4) ===
  // 1 match: winners of LB3 face each other
  const LB4Matches = [
    {
      matchId: "L4-M1",
      racer1: null,
      racer2: null,
      winner: null,
      loser: null,
      nextMatchIdIfWin: null,
      nextMatchSlot: null,
      meta: {},
    },
  ];

  // === Round 5 (LB5) ===
  // 1 match: LB4 winner faces WB round 4 loser
  // Then winner of LB5 goes to "F1-M1" (championship) as racer2
  const LB5Matches = [
    {
      matchId: "L5-M1",
      racer1: null,
      racer2: null,
      winner: null,
      loser: null,
      nextMatchIdIfWin: "F1-M1",
      nextMatchSlot: "racer2",
      meta: {},
    },
  ];

  // Link LB1 → LB2
  LB1Matches[0].nextMatchIdIfWin = "L2-M1";
  LB1Matches[0].nextMatchSlot = "racer1";
  LB1Matches[1].nextMatchIdIfWin = "L2-M1";
  LB1Matches[1].nextMatchSlot = "racer2";
  LB1Matches[2].nextMatchIdIfWin = "L2-M2";
  LB1Matches[2].nextMatchSlot = "racer1";
  LB1Matches[3].nextMatchIdIfWin = "L2-M2";
  LB1Matches[3].nextMatchSlot = "racer2";

  // Link LB2 → LB3
  LB2Matches[0].nextMatchIdIfWin = "L3-M1";
  LB2Matches[0].nextMatchSlot = "racer1";
  if (LB2Matches[1]) {
    LB2Matches[1].nextMatchIdIfWin = "L3-M2";
    LB2Matches[1].nextMatchSlot = "racer1";
  }

  // Link LB3 → LB4
  LB3Matches[0].nextMatchIdIfWin = "L4-M1";
  LB3Matches[0].nextMatchSlot = "racer1";
  if (LB3Matches[1]) {
    LB3Matches[1].nextMatchIdIfWin = "L4-M1";
    LB3Matches[1].nextMatchSlot = "racer2";
  }

  // Link LB4 → LB5
  LB4Matches[0].nextMatchIdIfWin = "L5-M1";
  LB4Matches[0].nextMatchSlot = "racer1";

  return [
    { round: 1, matchups: LB1Matches },
    { round: 2, matchups: LB2Matches },
    { round: 3, matchups: LB3Matches },
    { round: 4, matchups: LB4Matches },
    { round: 5, matchups: LB5Matches },
  ];
}

/**
 * Generic losers bracket for non-12-team formats (simpler approach).
 */
function computeLosersBracket(winnersBracket) {
  const losersRounds = [];
  // ... (unchanged or simpler logic for other bracket sizes)
  return losersRounds;
}

/**
 * POST /api/bracket/generateFull
 * Generates a full bracket (winners, losers, finals) for a given Grand Prix.
 */
router.post("/generateFull", async (req, res) => {
  try {
    const { grandPrixId } = req.body;
    if (!grandPrixId) {
      return res.status(400).json({ message: "grandPrixId is required" });
    }

    // Retrieve racers sorted by seed (ascending)
    const racers = await Racer.find({ grandPrix: grandPrixId }).sort({ seed: 1 });
    const n = racers.length;
    if (n < 2) {
      return res.status(400).json({ message: "Not enough racers to generate a bracket" });
    }

    let winnersBracketMapping;
    let winnersBracket;
    let losersBracket;

    if (n === 12) {
      winnersBracketMapping = getSeedMappingFor12().winnersBracket;
      winnersBracket = winnersBracketMapping.map((roundMatches, roundIndex) => ({
        round: roundIndex + 1,
        matchups: roundMatches.map((match, i) => {
          let team1 = match.seed1 ? racers.find((r) => r.seed === match.seed1) : null;
          let team2 = match.seed2 ? racers.find((r) => r.seed === match.seed2) : null;
          return {
            matchId: match.matchId || `R${roundIndex + 1}-M${i + 1}`,
            racer1: team1 ? team1._id : null,
            racer2: team2 ? team2._id : null,
            winner: null,
            loser: null,
            nextMatchIdIfWin: match.nextMatchIdIfWin || null,
            nextMatchSlot: match.nextMatchSlot || null,
          };
        }),
      }));
      losersBracket = computeLosersBracketFor12(winnersBracket);
    } else {
      winnersBracketMapping = getDynamicSeedMapping(n);
      winnersBracket = winnersBracketMapping.map((roundMatches, roundIndex) => ({
        round: roundIndex + 1,
        matchups: roundMatches.map((match, i) => {
          let team1 = match.seed1 ? racers.find((r) => r.seed === match.seed1) : null;
          let team2 = match.seed2 ? racers.find((r) => r.seed === match.seed2) : null;
          return {
            matchId: match.matchId || `R${roundIndex + 1}-M${i + 1}`,
            racer1: team1 ? team1._id : null,
            racer2: team2 ? team2._id : null,
            winner: null,
            loser: null,
            nextMatchIdIfWin: match.nextMatchIdIfWin || null,
            nextMatchSlot: match.nextMatchSlot || null,
          };
        }),
      }));
      losersBracket = computeLosersBracket(winnersBracket);
    }

    // Finals structure:
    // - "F1-M1": the main championship match
    // - "F2-M1": the if-necessary final (triggered if the previously undefeated WB champion loses F1-M1)
    // - "thirdPlace": as desired
    const finals = {
      championship: {
        match: {
          matchId: "F1-M1",
          racer1: null, // WB champion
          racer2: null, // LB champion
          winner: null,
          loser: null,
          nextMatchIdIfWin: "F2-M1",
          nextMatchSlot: "racer2",
        },
      },
      ifNecessary: {
        match: {
          matchId: "F2-M1",
          racer1: null,
          racer2: null,
          winner: null,
          loser: null,
        },
      },
      thirdPlace: {
        match: {
          matchId: "T1-M1",
          racer1: null,
          racer2: null,
          winner: null,
          loser: null,
        },
      },
    };

    // Remove any existing bracket for this GP before creating a new one.
    let existing = await Bracket.findOne({ grandPrix: grandPrixId });
    if (existing) {
      await existing.deleteOne();
    }

    const bracket = new Bracket({
      grandPrix: grandPrixId,
      winnersBracket,
      losersBracket,
      finals,
    });
    await bracket.save();

    // Populate references for a full response
    const fullBracket = await Bracket.findById(bracket._id)
      .populate("grandPrix", "name")
      .populate({
        path: "winnersBracket.matchups.racer1 winnersBracket.matchups.racer2",
        select: "firstName lastName club seed",
      })
      .populate({
        path: "losersBracket.matchups.racer1 losersBracket.matchups.racer2",
        select: "firstName lastName club seed",
      });

    res.status(201).json({
      message: "Full bracket generated successfully",
      bracket: fullBracket,
    });
  } catch (error) {
    console.error("Error generating full bracket:", error);
    res.status(500).json({ message: "Error generating full bracket", error });
  }
});

/**
 * POST /api/bracket/:bracketId/matchResult
 * Updates a match result by setting the winner (and loser) and moving the winner
 * to the next match based on nextMatchIdIfWin / nextMatchSlot.
 * Also assigns losers from WB to LB according to the bracket design.
 * Includes logic for if-necessary final.
 */
router.post("/:bracketId/matchResult", async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { matchId, winnerId, loserId, nextMatchIdIfWin, nextMatchSlot } = req.body;

    const bracket = await Bracket.findById(bracketId)
      .populate("grandPrix", "name")
      .populate("winnersBracket.matchups.racer1 winnersBracket.matchups.racer2")
      .populate("losersBracket.matchups.racer1 losersBracket.matchups.racer2")
      .populate("finals.championship.match.racer1 finals.championship.match.racer2")
      .populate("finals.ifNecessary.match.racer1 finals.ifNecessary.match.racer2")
      .populate("finals.thirdPlace.match.racer1 finals.thirdPlace.match.racer2");
    if (!bracket) {
      return res.status(404).json({ message: "Bracket not found" });
    }

    let matchFound = false;
    let matchRound = null; // For WB rounds: 1,2,3,4; for LB rounds, we use "L1", etc.
    let matchIndex = null;
    let localNextMatchIdIfWin = null;
    let localNextMatchSlot = null;

    // 1) Try winners bracket
    outerWB: for (let r = 0; r < bracket.winnersBracket.length; r++) {
      for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
        let currMatch = bracket.winnersBracket[r].matchups[m];
        if (currMatch.matchId === matchId) {
          matchFound = true;
          matchRound = r + 1; // e.g. 1..4 for 12-team
          matchIndex = m;     // 0-based index of match within the round
          currMatch.winner = winnerId;
          currMatch.loser = loserId || null;
          localNextMatchIdIfWin = currMatch.nextMatchIdIfWin;
          localNextMatchSlot = currMatch.nextMatchSlot;

          // --- Loser-to-LB assignment ---
          // Only assign if a loser is provided.
          if (loserId) {
            if (matchRound === 1) {
              // WB Round 1 → LB Round 1, slot racer1
              const targetMatchId = `L1-M${matchIndex + 1}`;
              for (let lr = 0; lr < bracket.losersBracket.length; lr++) {
                if (bracket.losersBracket[lr].round === 1) {
                  for (let lm = 0; lm < bracket.losersBracket[lr].matchups.length; lm++) {
                    if (bracket.losersBracket[lr].matchups[lm].matchId === targetMatchId) {
                      bracket.losersBracket[lr].matchups[lm].racer1 = loserId;
                      break;
                    }
                  }
                  break;
                }
              }
            } else if (matchRound === 2) {
              // WB Round 2 → LB Round 1, slot racer2
              const targetMatchId = `L1-M${matchIndex + 1}`;
              for (let lr = 0; lr < bracket.losersBracket.length; lr++) {
                if (bracket.losersBracket[lr].round === 1) {
                  for (let lm = 0; lm < bracket.losersBracket[lr].matchups.length; lm++) {
                    if (bracket.losersBracket[lr].matchups[lm].matchId === targetMatchId) {
                      bracket.losersBracket[lr].matchups[lm].racer2 = loserId;
                      break;
                    }
                  }
                  break;
                }
              }
            } else if (matchRound === 3) {
              // WB Round 3 → LB Round 3, slot racer2
              const targetMatchId = `L3-M${matchIndex + 1}`;
              for (let lr = 0; lr < bracket.losersBracket.length; lr++) {
                if (bracket.losersBracket[lr].round === 3) {
                  for (let lm = 0; lm < bracket.losersBracket[lr].matchups.length; lm++) {
                    if (bracket.losersBracket[lr].matchups[lm].matchId === targetMatchId) {
                      bracket.losersBracket[lr].matchups[lm].racer2 = loserId;
                      break;
                    }
                  }
                  break;
                }
              }
            } else if (matchRound === 4) {
              // WB Round 4 → LB Round 5, slot racer2
              const targetMatchId = `L5-M1`;
              for (let lr = 0; lr < bracket.losersBracket.length; lr++) {
                if (bracket.losersBracket[lr].round === 5) {
                  for (let lm = 0; lm < bracket.losersBracket[lr].matchups.length; lm++) {
                    if (bracket.losersBracket[lr].matchups[lm].matchId === targetMatchId) {
                      bracket.losersBracket[lr].matchups[lm].racer2 = loserId;
                      break;
                    }
                  }
                  break;
                }
              }
            }
          }
          // --- End loser-to-LB ---
          break outerWB;
        }
      }
    }

    // 2) If not found, try losers bracket
    if (!matchFound) {
      outerLB: for (let r = 0; r < bracket.losersBracket.length; r++) {
        for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
          let currMatch = bracket.losersBracket[r].matchups[m];
          if (currMatch.matchId === matchId) {
            matchFound = true;
            matchRound = `L${r + 1}`; // e.g., "L1", "L2", etc.
            matchIndex = m;
            currMatch.winner = winnerId;
            currMatch.loser = loserId || null;
            localNextMatchIdIfWin = currMatch.nextMatchIdIfWin;
            localNextMatchSlot = currMatch.nextMatchSlot;
            break outerLB;
          }
        }
      }
    }

    // 3) If not found, try finals
    if (!matchFound) {
      const champMatch = bracket.finals.championship.match;
      if (champMatch && champMatch.matchId === matchId) {
        matchFound = true;
        champMatch.winner = winnerId;
        champMatch.loser = loserId || null;
        localNextMatchIdIfWin = champMatch.nextMatchIdIfWin; // e.g. "F2-M1"
        localNextMatchSlot = champMatch.nextMatchSlot;       // e.g. "racer2"
      }
      const ifNecMatch = bracket.finals.ifNecessary.match;
      if (!matchFound && ifNecMatch && ifNecMatch.matchId === matchId) {
        matchFound = true;
        ifNecMatch.winner = winnerId;
        ifNecMatch.loser = loserId || null;
      }
      const thirdPlaceMatch = bracket.finals.thirdPlace.match;
      if (!matchFound && thirdPlaceMatch && thirdPlaceMatch.matchId === matchId) {
        matchFound = true;
        thirdPlaceMatch.winner = winnerId;
        thirdPlaceMatch.loser = loserId || null;
      }
    }

    if (!matchFound) {
      return res.status(404).json({ message: "Match not found in any bracket" });
    }

    // 4) Move winner to the next match if needed
    const actualNextMatchId = localNextMatchIdIfWin || nextMatchIdIfWin;
    const actualNextSlot = localNextMatchSlot || nextMatchSlot;
    if (actualNextMatchId && actualNextSlot && winnerId) {
      let assigned = false;
      // Check winners bracket
      for (let r = 0; r < bracket.winnersBracket.length; r++) {
        for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
          let nm = bracket.winnersBracket[r].matchups[m];
          if (nm.matchId === actualNextMatchId) {
            nm[actualNextSlot] = winnerId;
            assigned = true;
            break;
          }
        }
        if (assigned) break;
      }
      // Check losers bracket
      if (!assigned) {
        for (let r = 0; r < bracket.losersBracket.length; r++) {
          for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
            let nm = bracket.losersBracket[r].matchups[m];
            if (nm.matchId === actualNextMatchId) {
              nm[actualNextSlot] = winnerId;
              assigned = true;
              break;
            }
          }
          if (assigned) break;
        }
      }
      // Check finals
      if (!assigned) {
        const fChamp = bracket.finals.championship.match;
        if (fChamp && fChamp.matchId === actualNextMatchId) {
          fChamp[actualNextSlot] = winnerId;
          assigned = true;
        }
        const fIfNec = bracket.finals.ifNecessary.match;
        if (!assigned && fIfNec && fIfNec.matchId === actualNextMatchId) {
          fIfNec[actualNextSlot] = winnerId;
          assigned = true;
        }
        const fThird = bracket.finals.thirdPlace.match;
        if (!assigned && fThird && fThird.matchId === actualNextMatchId) {
          fThird[actualNextSlot] = winnerId;
          assigned = true;
        }
      }
    }

    // 5) If the match was the Championship match (F1-M1) and the LB racer (racer2) won,
    // trigger the if-necessary final.
    const champMatch = bracket.finals.championship.match;
    if (champMatch && champMatch.matchId === matchId) {
      if (champMatch.racer2 && String(champMatch.winner) === String(champMatch.racer2._id)) {
        bracket.finals.ifNecessary.match.racer1 = champMatch.racer1 ? champMatch.racer1._id : null;
        bracket.finals.ifNecessary.match.racer2 = champMatch.racer2 ? champMatch.racer2._id : null;
      } else {
        bracket.finals.ifNecessary.match.racer1 = null;
        bracket.finals.ifNecessary.match.racer2 = null;
        bracket.finals.ifNecessary.match.winner = null;
        bracket.finals.ifNecessary.match.loser = null;
      }
    }

    await bracket.save();

    const updatedBracket = await Bracket.findById(bracketId)
      .populate("grandPrix", "name")
      .populate("winnersBracket.matchups.racer1 winnersBracket.matchups.racer2")
      .populate("losersBracket.matchups.racer1 losersBracket.matchups.racer2")
      .populate("finals.championship.match.racer1 finals.championship.match.racer2")
      .populate("finals.ifNecessary.match.racer1 finals.ifNecessary.match.racer2")
      .populate("finals.thirdPlace.match.racer1 finals.thirdPlace.match.racer2");

    res.status(200).json({ message: "Match result updated", bracket: updatedBracket });
  } catch (error) {
    console.error("Error updating match result:", error);
    res.status(500).json({ message: "Error updating match result", error });
  }
});

/**
 * DELETE /api/bracket/:bracketId/matchResult
 * Reverts a match result by clearing the winner/loser and removing the advanced racer from the next match.
 */
router.delete("/:bracketId/matchResult", async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ message: "matchId is required in the body" });
    }

    const bracket = await Bracket.findById(bracketId)
      .populate("winnersBracket.matchups.racer1 winnersBracket.matchups.racer2")
      .populate("losersBracket.matchups.racer1 losersBracket.matchups.racer2")
      .populate("finals.championship.match.racer1 finals.championship.match.racer2")
      .populate("finals.ifNecessary.match.racer1 finals.ifNecessary.match.racer2")
      .populate("finals.thirdPlace.match.racer1 finals.thirdPlace.match.racer2");
    if (!bracket) {
      return res.status(404).json({ message: "Bracket not found" });
    }

    let matchFound = false;
    let localNextMatchIdIfWin = null;
    let localNextMatchSlot = null;

    // Revert in winners bracket
    for (let r = 0; r < bracket.winnersBracket.length; r++) {
      for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
        let curr = bracket.winnersBracket[r].matchups[m];
        if (curr.matchId === matchId) {
          matchFound = true;
          localNextMatchIdIfWin = curr.nextMatchIdIfWin;
          localNextMatchSlot = curr.nextMatchSlot;
          curr.winner = null;
          curr.loser = null;
          break;
        }
      }
      if (matchFound) break;
    }

    // Revert in losers bracket
    if (!matchFound) {
      for (let r = 0; r < bracket.losersBracket.length; r++) {
        for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
          let curr = bracket.losersBracket[r].matchups[m];
          if (curr.matchId === matchId) {
            matchFound = true;
            localNextMatchIdIfWin = curr.nextMatchIdIfWin;
            localNextMatchSlot = curr.nextMatchSlot;
            curr.winner = null;
            curr.loser = null;
            break;
          }
        }
        if (matchFound) break;
      }
    }

    // Revert in finals
    if (!matchFound) {
      const champMatch = bracket.finals.championship.match;
      if (champMatch && champMatch.matchId === matchId) {
        matchFound = true;
        localNextMatchIdIfWin = champMatch.nextMatchIdIfWin;
        localNextMatchSlot = champMatch.nextMatchSlot;
        champMatch.winner = null;
        champMatch.loser = null;
      }
      const ifNec = bracket.finals.ifNecessary.match;
      if (!matchFound && ifNec && ifNec.matchId === matchId) {
        matchFound = true;
        ifNec.winner = null;
        ifNec.loser = null;
      }
      const third = bracket.finals.thirdPlace.match;
      if (!matchFound && third && third.matchId === matchId) {
        matchFound = true;
        third.winner = null;
        third.loser = null;
      }
    }

    if (!matchFound) {
      return res.status(404).json({ message: "Match not found in bracket" });
    }

    // Remove advanced racer from the next match
    if (localNextMatchIdIfWin && localNextMatchSlot) {
      let removed = false;
      // Check winners bracket
      for (let r = 0; r < bracket.winnersBracket.length; r++) {
        for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
          let nm = bracket.winnersBracket[r].matchups[m];
          if (nm.matchId === localNextMatchIdIfWin) {
            nm[localNextMatchSlot] = null;
            removed = true;
            break;
          }
        }
        if (removed) break;
      }
      // Check losers bracket
      if (!removed) {
        for (let r = 0; r < bracket.losersBracket.length; r++) {
          for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
            let nm = bracket.losersBracket[r].matchups[m];
            if (nm.matchId === localNextMatchIdIfWin) {
              nm[localNextMatchSlot] = null;
              removed = true;
              break;
            }
          }
          if (removed) break;
        }
      }
      // Check finals
      if (!removed) {
        const fChamp = bracket.finals.championship.match;
        if (fChamp && fChamp.matchId === localNextMatchIdIfWin) {
          fChamp[localNextMatchSlot] = null;
          removed = true;
        }
        const fIfNec = bracket.finals.ifNecessary.match;
        if (!removed && fIfNec && fIfNec.matchId === localNextMatchIdIfWin) {
          fIfNec[localNextMatchSlot] = null;
          removed = true;
        }
        const fThird = bracket.finals.thirdPlace.match;
        if (!removed && fThird && fThird.matchId === localNextMatchIdIfWin) {
          fThird[localNextMatchSlot] = null;
        }
      }
    }

    await bracket.save();

    const updatedBracket = await Bracket.findById(bracketId)
      .populate("grandPrix", "name")
      .populate("winnersBracket.matchups.racer1 winnersBracket.matchups.racer2")
      .populate("losersBracket.matchups.racer1 losersBracket.matchups.racer2")
      .populate("finals.championship.match.racer1 finals.championship.match.racer2")
      .populate("finals.ifNecessary.match.racer1 finals.ifNecessary.match.racer2")
      .populate("finals.thirdPlace.match.racer1 finals.thirdPlace.match.racer2");

    res.status(200).json({ message: "Match result reverted", bracket: updatedBracket });
  } catch (error) {
    console.error("Error reverting match result:", error);
    res.status(500).json({ message: "Error reverting match result", error });
  }
});

// GET /api/bracket/gp/:grandPrixId
router.get("/gp/:grandPrixId", async (req, res) => {
  try {
    const bracket = await Bracket.findOne({ grandPrix: req.params.grandPrixId })
      .populate("grandPrix", "name")
      .populate("winnersBracket.matchups.racer1 winnersBracket.matchups.racer2")
      .populate("losersBracket.matchups.racer1 losersBracket.matchups.racer2")
      .populate("finals.championship.match.racer1 finals.championship.match.racer2")
      .populate("finals.ifNecessary.match.racer1 finals.ifNecessary.match.racer2");
    if (!bracket) {
      return res.status(404).json({ message: "Bracket not found" });
    }
    res.status(200).json(bracket);
  } catch (error) {
    console.error("Error fetching bracket:", error);
    res.status(500).json({ message: "Error fetching bracket", error });
  }
});



module.exports = router;
