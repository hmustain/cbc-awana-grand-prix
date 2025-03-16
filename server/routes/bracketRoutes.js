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
  const right = left.map(seed => p + 1 - seed);
  return [...left, ...right];
}

/**
 * Generic dynamic seeding mapping.
 * For n teams, determine p = nextPowerOfTwo(n) and create matchups for Round 1 with byes.
 * IMPORTANT: We now generate nextMatchSlot as "racer1" or "racer2" (to match the model fields).
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
      nextMatchSlot: (i % 2 === 0) ? "racer1" : "racer2"
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
        nextMatchSlot: (i % 2 === 0) ? "racer1" : "racer2"
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
 * Custom seeding mapping for 12 teams.
 * Use special mapping if exactly 12 racers.
 */
function getSeedMappingFor12() {
  return {
    winnersBracket: [
      // Round 1: Only teams 5–12
      [
        { matchId: "WB-R1-M1", seed1: 5, seed2: 12, nextMatchIdIfWin: "WB-R2-M2", nextMatchSlot: "racer2" },
        { matchId: "WB-R1-M2", seed1: 8, seed2: 9,  nextMatchIdIfWin: "WB-R2-M1", nextMatchSlot: "racer2" },
        { matchId: "WB-R1-M3", seed1: 6, seed2: 11, nextMatchIdIfWin: "WB-R2-M3", nextMatchSlot: "racer2" },
        { matchId: "WB-R1-M4", seed1: 7, seed2: 10, nextMatchIdIfWin: "WB-R2-M4", nextMatchSlot: "racer2" }
      ],
      // Round 2: Insert bye seeds (1–4)
      [
        { matchId: "WB-R2-M1", seed1: 1, seed2: null, nextMatchIdIfWin: "WB-R3-M1", nextMatchSlot: "racer1" },
        { matchId: "WB-R2-M2", seed1: 4, seed2: null, nextMatchIdIfWin: "WB-R3-M1", nextMatchSlot: "racer2" },
        { matchId: "WB-R2-M3", seed1: 3, seed2: null, nextMatchIdIfWin: "WB-R3-M2", nextMatchSlot: "racer1" },
        { matchId: "WB-R2-M4", seed1: 2, seed2: null, nextMatchIdIfWin: "WB-R3-M2", nextMatchSlot: "racer2" }
      ],
      // Round 3
      [
        { matchId: "WB-R3-M1", seed1: null, seed2: null, nextMatchIdIfWin: "WB-R4-M1", nextMatchSlot: "racer1" },
        { matchId: "WB-R3-M2", seed1: null, seed2: null, nextMatchIdIfWin: "WB-R4-M1", nextMatchSlot: "racer2" }
      ],
      // Round 4: Final
      [
        { matchId: "WB-R4-M1", seed1: null, seed2: null }
      ]
    ]
  };
}

/**
 * Compute a dynamic losers bracket from the winners bracket.
 * This simplified algorithm creates an initial losers round from winners round 1 (only for matches that had two racers)
 * then creates subsequent losers rounds by combining previous losers winners with new losers.
 */
function computeLosersBracket(winnersBracket) {
  const losersRounds = [];

  // Losers Round 1: from winners round 1 matchups (only those with both racers)
  let L1Entries = [];
  const wb1 = winnersBracket[0].matchups;
  wb1.forEach((matchup, idx) => {
    if (matchup.racer2 !== null) {
      L1Entries.push({ source: "WB1", matchIndex: idx });
    }
  });
  
  let L1Matches = [];
  for (let i = 0; i < L1Entries.length; i += 2) {
    L1Matches.push({
      matchId: `L1-M${Math.floor(i / 2) + 1}`,
      racer1: null,
      racer2: null,
      winner: null,
      loser: null,
      meta: { sources: L1Entries.slice(i, i + 2).map(e => e.source) }
    });
  }
  if (L1Matches.length > 0) {
    losersRounds.push({ round: 1, matchups: L1Matches });
  }
  
  let previousLosersWinners = L1Matches.map(() => null);

  // For each subsequent winners round, generate a losers round.
  for (let r = 1; r < winnersBracket.length; r++) {
    let currentWBLosers = [];
    winnersBracket[r].matchups.forEach((matchup, idx) => {
      if (matchup.racer2 !== null) {
        currentWBLosers.push({ source: `WB${r + 1}`, matchIndex: idx });
      }
    });
    
    const combined = previousLosersWinners.concat(currentWBLosers);
    let currentLosersMatches = [];
    for (let i = 0; i < combined.length; i += 2) {
      currentLosersMatches.push({
        matchId: `L${r + 1}-M${Math.floor(i / 2) + 1}`,
        racer1: null,
        racer2: null,
        winner: null,
        loser: null,
        meta: {}
      });
    }
    losersRounds.push({ round: r + 1, matchups: currentLosersMatches });
    previousLosersWinners = currentLosersMatches.map(() => null);
  }
  
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
    if (n === 12) {
      winnersBracketMapping = getSeedMappingFor12().winnersBracket;
    } else {
      winnersBracketMapping = getDynamicSeedMapping(n);
    }
    
    // Build winners bracket: replace seed numbers with racer IDs.
    const winnersBracket = winnersBracketMapping.map((roundMatches, roundIndex) => {
      return {
        round: roundIndex + 1,
        matchups: roundMatches.map((match, i) => {
          let team1 = match.seed1 ? racers.find(r => r.seed === match.seed1) : null;
          let team2 = match.seed2 ? racers.find(r => r.seed === match.seed2) : null;
          return {
            matchId: match.matchId || `R${roundIndex + 1}-M${i + 1}`,
            racer1: team1 ? team1._id : null,
            racer2: team2 ? team2._id : null,
            winner: null,
            loser: null,
            nextMatchIdIfWin: match.nextMatchIdIfWin || null,
            nextMatchSlot: match.nextMatchSlot || null
          };
        })
      };
    });
    
    // Compute losers bracket dynamically
    const losersBracket = computeLosersBracket(winnersBracket);
    
    // Finals structure
    const finals = {
      championship: { match: { racer1: null, racer2: null, winner: null, loser: null } },
      thirdPlace: { match: { racer1: null, racer2: null, winner: null, loser: null } }
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
      finals
    });
    await bracket.save();
    
    // Populate references for a full response
    const fullBracket = await Bracket.findById(bracket._id)
      .populate("grandPrix", "name")
      .populate({
        path: "winnersBracket.matchups.racer1 winnersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      })
      .populate({
        path: "losersBracket.matchups.racer1 losersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      });
    
    res.status(201).json({
      message: "Full bracket generated successfully",
      bracket: fullBracket
    });
  } catch (error) {
    console.error("Error generating full bracket:", error);
    res.status(500).json({ message: "Error generating full bracket", error });
  }
});

/**
 * POST /api/bracket/:bracketId/matchResult
 * Updates a match result by setting the winner (and loser) and moving the winner
 * to the next match based on nextMatchIdIfWin and nextMatchSlot.
 * Also, if the match is in winners bracket round 1, assign the loser to the corresponding losers bracket match.
 */
router.post("/:bracketId/matchResult", async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { matchId, winnerId, loserId, nextMatchIdIfWin, nextMatchSlot } = req.body;

    const bracket = await Bracket.findById(bracketId).populate({
      path: "winnersBracket.matchups.racer1 winnersBracket.matchups.racer2",
      select: "firstName lastName club seed"
    });
    if (!bracket) {
      return res.status(404).json({ message: "Bracket not found" });
    }

    let matchFound = false;
    let matchRound = null;
    let matchIndex = null;
    // Update winners bracket match (using for-loops to exit early)
    for (let r = 0; r < bracket.winnersBracket.length; r++) {
      for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
        let currMatch = bracket.winnersBracket[r].matchups[m];
        if (currMatch.matchId === matchId) {
          matchFound = true;
          matchRound = r + 1;
          matchIndex = m;
          currMatch.winner = winnerId;
          currMatch.loser = loserId || null;
          break;
        }
      }
      if (matchFound) break;
    }
    // If not found in winners, update losers bracket
    if (!matchFound) {
      for (let r = 0; r < bracket.losersBracket.length; r++) {
        for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
          let currMatch = bracket.losersBracket[r].matchups[m];
          if (currMatch.matchId === matchId) {
            matchFound = true;
            currMatch.winner = winnerId;
            currMatch.loser = loserId || null;
            break;
          }
        }
        if (matchFound) break;
      }
    }
    if (!matchFound) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Move winner to the next match if applicable
    if (nextMatchIdIfWin && nextMatchSlot) {
      let slot = nextMatchSlot; // should be "racer1" or "racer2"
      let nextFound = false;
      for (let r = 0; r < bracket.winnersBracket.length; r++) {
        for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
          let nextMatch = bracket.winnersBracket[r].matchups[m];
          if (nextMatch.matchId === nextMatchIdIfWin) {
            nextFound = true;
            nextMatch[slot] = winnerId;
            break;
          }
        }
        if (nextFound) break;
      }
      if (!nextFound) {
        for (let r = 0; r < bracket.losersBracket.length; r++) {
          for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
            let nextMatch = bracket.losersBracket[r].matchups[m];
            if (nextMatch.matchId === nextMatchIdIfWin) {
              nextMatch[slot] = winnerId;
              nextFound = true;
              break;
            }
          }
          if (nextFound) break;
        }
      }
    }

    // For losers bracket assignment:
    // If this match is in winners bracket round 1, drop the loser to losers bracket.
    if (matchRound === 1 && loserId) {
      // Determine the target losers match based on the index.
      const targetIndex = Math.floor(matchIndex / 2);
      // Find losers bracket round 1 match with matchId "L1-M{targetIndex+1}"
      for (let r = 0; r < bracket.losersBracket.length; r++) {
        if (bracket.losersBracket[r].round === 1) {
          for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
            let lMatch = bracket.losersBracket[r].matchups[m];
            if (lMatch.matchId === `L1-M${targetIndex + 1}`) {
              // Assign loser to first empty slot
              if (!lMatch.racer1) {
                lMatch.racer1 = loserId;
              } else if (!lMatch.racer2) {
                lMatch.racer2 = loserId;
              }
              break;
            }
          }
          break;
        }
      }
    }

    await bracket.save();

    const updatedBracket = await Bracket.findById(bracketId)
      .populate("grandPrix", "name")
      .populate({
        path: "winnersBracket.matchups.racer1 winnersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      })
      .populate({
        path: "losersBracket.matchups.racer1 losersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      });

    res.status(200).json({ message: "Match result updated", bracket: updatedBracket });
  } catch (error) {
    console.error("Error updating match result:", error);
    res.status(500).json({ message: "Error updating match result", error });
  }
});

/**
 * DELETE /api/bracket/:bracketId/matchResult
 * Body: { matchId: string }
 * Reverts a match result by clearing the winner/loser and removing the advanced racer from the next match.
 * Only reverts the match that is clicked.
 */
router.delete("/:bracketId/matchResult", async (req, res) => {
  try {
    const { bracketId } = req.params;
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ message: "matchId is required in the body" });
    }

    const bracket = await Bracket.findById(bracketId).populate({
      path: "winnersBracket.matchups.racer1 winnersBracket.matchups.racer2",
      select: "firstName lastName club seed"
    });
    if (!bracket) {
      return res.status(404).json({ message: "Bracket not found" });
    }

    let matchFound = false;
    let nextMatchInfo = null;
    // Revert match in winners bracket using for-loops
    for (let r = 0; r < bracket.winnersBracket.length; r++) {
      for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
        let currMatch = bracket.winnersBracket[r].matchups[m];
        if (currMatch.matchId === matchId) {
          matchFound = true;
          nextMatchInfo = { nextMatchIdIfWin: currMatch.nextMatchIdIfWin, nextMatchSlot: currMatch.nextMatchSlot };
          currMatch.winner = null;
          currMatch.loser = null;
          break;
        }
      }
      if (matchFound) break;
    }
    if (!matchFound) {
      for (let r = 0; r < bracket.losersBracket.length; r++) {
        for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
          let currMatch = bracket.losersBracket[r].matchups[m];
          if (currMatch.matchId === matchId) {
            matchFound = true;
            currMatch.winner = null;
            currMatch.loser = null;
            break;
          }
        }
        if (matchFound) break;
      }
    }
    if (!matchFound) {
      return res.status(404).json({ message: "Match not found in bracket" });
    }

    // Remove advanced racer from next match slot if applicable
    if (nextMatchInfo && nextMatchInfo.nextMatchIdIfWin && nextMatchInfo.nextMatchSlot) {
      let nextMatchFound = false;
      for (let r = 0; r < bracket.winnersBracket.length; r++) {
        for (let m = 0; m < bracket.winnersBracket[r].matchups.length; m++) {
          let nextMatch = bracket.winnersBracket[r].matchups[m];
          if (nextMatch.matchId === nextMatchInfo.nextMatchIdIfWin) {
            nextMatchFound = true;
            nextMatch[nextMatchInfo.nextMatchSlot] = null;
            break;
          }
        }
        if (nextMatchFound) break;
      }
      if (!nextMatchFound) {
        for (let r = 0; r < bracket.losersBracket.length; r++) {
          for (let m = 0; m < bracket.losersBracket[r].matchups.length; m++) {
            let nextMatch = bracket.losersBracket[r].matchups[m];
            if (nextMatch.matchId === nextMatchInfo.nextMatchIdIfWin) {
              nextMatch[nextMatchInfo.nextMatchSlot] = null;
              break;
            }
          }
        }
      }
    }

    await bracket.save();

    const updatedBracket = await Bracket.findById(bracketId)
      .populate("grandPrix", "name")
      .populate({
        path: "winnersBracket.matchups.racer1 winnersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      })
      .populate({
        path: "losersBracket.matchups.racer1 losersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      });

    res.status(200).json({ message: "Match result reverted", bracket: updatedBracket });
  } catch (error) {
    console.error("Error reverting match result:", error);
    res.status(500).json({ message: "Error reverting match result", error });
  }
});

module.exports = router;
