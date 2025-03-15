// server/routes/bracketgeneration.js
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
 * Generates a dynamic bracket mapping for any number of racers.
 * Returns an array of rounds, where each round is an array of match objects.
 * Each match object includes:
 *  - matchId
 *  - seed1 and seed2 (or null if bye)
 *  - nextMatchIdIfWin and nextMatchSlot (for future updating)
 */
function getDynamicSeedMapping(n) {
  const p = nextPowerOfTwo(n);
  const seedingOrder = generateSeeding(p); // e.g., for p=16: [1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]
  
  // Build Round 1 matchups: pairs of seeds from seedingOrder
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
      nextMatchSlot: null
    });
  }
  rounds.push(round1);

  // Build subsequent rounds dynamically by pairing winners sequentially.
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
        nextMatchSlot: null
      });
    }
    rounds.push(nextRound);
    currentRoundCount = nextRound.length;
    roundNum++;
  }
  
  // Assign nextMatchIdIfWin and nextMatchSlot for each match (except in the final round)
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((match, i) => {
      const nextRoundMatch = rounds[r + 1][Math.floor(i / 2)];
      match.nextMatchIdIfWin = nextRoundMatch.matchId;
      // Even-indexed match winner goes to seed1, odd-indexed to seed2
      match.nextMatchSlot = (i % 2 === 0) ? "seed1" : "seed2";
    });
  }
  
  return rounds;
}

// ------------------------------------------
// Losers Bracket Computation
// ------------------------------------------
function computeLosersBracket(winnersBracket) {
  const losersRounds = [];
  
  // Losers Round 1: from winners round 1.
  let L1Entries = [];
  const wb1 = winnersBracket[0];
  wb1.matchups.forEach((matchup, idx) => {
    if (matchup.racer2 !== null) {
      L1Entries.push({ source: "WB1", matchIndex: idx });
    }
  });
  
  let L1Matches = [];
  for (let i = 0; i < L1Entries.length; i += 2) {
    if (i + 1 < L1Entries.length) {
      L1Matches.push({
        matchupId: `L1-match${Math.floor(i / 2) + 1}`,
        participants: [L1Entries[i], L1Entries[i + 1]],
        winner: null,
        loser: null,
        meta: { sources: [L1Entries[i].source, L1Entries[i + 1].source] }
      });
    } else {
      L1Matches.push({
        matchupId: `L1-match${Math.floor(i / 2) + 1}`,
        participants: [L1Entries[i], null],
        winner: null,
        loser: null,
        meta: { sources: [L1Entries[i].source] }
      });
    }
  }
  if (L1Matches.length > 0) {
    losersRounds.push({ round: 1, matchups: L1Matches });
  }
  
  let previousLosersWinners = L1Matches.map(() => null);
  
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
      if (i + 1 < combined.length) {
        currentLosersMatches.push({
          matchupId: `L${r + 1}-match${Math.floor(i / 2) + 1}`,
          participants: [combined[i], combined[i + 1]],
          winner: null,
          loser: null,
          meta: {}
        });
      } else {
        currentLosersMatches.push({
          matchupId: `L${r + 1}-match${Math.floor(i / 2) + 1}`,
          participants: [combined[i], null],
          winner: null,
          loser: null,
          meta: {}
        });
      }
    }
    losersRounds.push({ round: r + 1, matchups: currentLosersMatches });
    previousLosersWinners = currentLosersMatches.map(() => null);
  }
  
  return losersRounds;
}

// ------------------------------------------
// Bracket Generation Route (Dynamic for Any Number of Racers)
// ------------------------------------------
router.post("/generateFull", async (req, res) => {
  try {
    const { grandPrixId } = req.body;
    if (!grandPrixId) {
      return res.status(400).json({ message: "grandPrixId is required" });
    }

    // Retrieve racers sorted by seed ascending (1 is top seed)
    const racers = await Racer.find({ grandPrix: grandPrixId }).sort({ seed: 1 });
    const n = racers.length;
    if (n < 2) {
      return res.status(400).json({ message: "Not enough racers to generate a bracket" });
    }

    // Create dynamic mapping based on the number of racers.
    const roundsMapping = getDynamicSeedMapping(n);

    // Build winners bracket using the dynamic mapping.
    const winnersBracket = roundsMapping.map((roundMatches, roundIndex) => {
      const matchups = roundMatches.map(match => {
        const team1 = match.seed1 ? racers.find(r => r.seed === match.seed1) : null;
        const team2 = match.seed2 ? racers.find(r => r.seed === match.seed2) : null;
        return {
          matchId: match.matchId,
          racer1: team1 ? team1._id : null,
          racer2: team2 ? team2._id : null,
          // If one team is missing, auto-advance that team (bye)
          winner: (team1 && !team2) ? team1._id : (team2 && !team1) ? team2._id : null,
          loser: null,
          nextMatchIdIfWin: match.nextMatchIdIfWin,
          nextMatchSlot: match.nextMatchSlot
        };
      });
      return { round: roundIndex + 1, matchups };
    });

    // Compute losers bracket from winners bracket.
    const losersBracket = computeLosersBracket(winnersBracket);

    // Finals structure remains as before.
    const finals = {
      championship: {
        match: {
          racer1: null,
          racer2: null,
          winner: null,
          loser: null
        }
      },
      thirdPlace: {
        match: {
          racer1: null,
          racer2: null,
          winner: null,
          loser: null
        }
      }
    };

    const bracket = new Bracket({
      grandPrix: grandPrixId,
      winnersBracket,
      losersBracket,
      finals
    });
    await bracket.save();

    const fullBracket = await Bracket.findById(bracket._id)
      .populate("grandPrix", "name")
      .populate({
        path: "winnersBracket.matchups.racer1",
        select: "firstName lastName club seed"
      })
      .populate({
        path: "winnersBracket.matchups.racer2",
        select: "firstName lastName club seed"
      });

    const formattedWinners = fullBracket.winnersBracket.map(round => {
      const formattedMatchups = round.matchups.map((matchup, index) => ({
        ...matchup.toObject(),
        matchName: `Round ${round.round} - Match ${index + 1}`
      }));
      return { round: round.round, matchups: formattedMatchups };
    });

    const responseBracket = {
      grandPrix: fullBracket.grandPrix,
      winnersBracket: formattedWinners,
      losersBracket: losersBracket,
      finals: fullBracket.finals
    };

    res.status(201).json({
      message: "Full bracket generated successfully (Dynamic mode)",
      bracket: responseBracket
    });
  } catch (error) {
    console.error("Error generating full bracket:", error);
    res.status(500).json({ message: "Error generating full bracket", error });
  }
});

module.exports = router;
