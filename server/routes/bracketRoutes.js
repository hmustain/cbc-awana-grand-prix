const express = require("express");
const mongoose = require("mongoose");
const Bracket = require("../models/Bracket");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix");

const router = express.Router();

// Helper: calculate next power of 2
function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

// ------------------------------------------
// Losers Bracket Computation
// ------------------------------------------
// This function computes the losers bracket rounds based on the winners bracket.
// It uses the following logic:
// 1. In winners round 1, every matchup that actually played (i.e. no bye)
//    produces one loser that drops to losers bracket round 1.
// 2. In subsequent winners rounds, the losers drop down and are combined with
//    the winners from the previous losers round. They are then paired for the next losers round.
// 3. No byes are introduced in the losers bracket (if an odd number occurs, we auto-advance).
function computeLosersBracket(winnersBracket) {
  const losersRounds = [];
  
  // Losers Round 1: Collect losers from winners bracket round 1.
  let L1Entries = [];
  const wb1 = winnersBracket[0];
  wb1.matchups.forEach(matchup => {
    // If matchup was played (racer2 exists) and a winner is determined, add the loser.
    if (matchup.racer2 !== null && matchup.winner) {
      let loser;
      if (matchup.winner.toString() === matchup.racer1.toString()) {
        loser = matchup.racer2;
      } else {
        loser = matchup.racer1;
      }
      L1Entries.push({ source: "WB1", loser });
    }
  });
  
  // Pair L1Entries into matches
  let L1Matches = [];
  for (let i = 0; i < L1Entries.length; i += 2) {
    if (i + 1 < L1Entries.length) {
      L1Matches.push({
        matchupId: `L1-match${Math.floor(i / 2) + 1}`,
        participants: [L1Entries[i].loser, L1Entries[i + 1].loser],
        winner: null,
        loser: null,
        sources: [L1Entries[i].source, L1Entries[i + 1].source]
      });
    } else {
      // If odd (should rarely happen if bracket is seeded traditionally), auto-advance.
      L1Matches.push({
        matchupId: `L1-match${Math.floor(i / 2) + 1}`,
        participants: [L1Entries[i].loser, null],
        winner: L1Entries[i].loser,
        loser: null,
        sources: [L1Entries[i].source]
      });
    }
  }
  if (L1Matches.length > 0) {
    losersRounds.push({ round: 1, matchups: L1Matches });
  }
  
  // For subsequent rounds in the winners bracket (round 2 onward),
  // drop their losers and combine with the winners from the previous losers round.
  // We'll use previousLosers to track advancing entries from the last losers round.
  // (For simulation purposes, if winners from losers matches are not determined,
  // we use placeholders. You can later update these with actual match results.)
  let previousLosersWinners = L1Matches.map(match => ({
    participant: match.winner ? match.winner : null,
    source: match.matchupId
  }));
  
  // Iterate over winners rounds 2..R (index 1 onward)
  for (let r = 1; r < winnersBracket.length; r++) {
    let currentWBLosers = [];
    winnersBracket[r].matchups.forEach(matchup => {
      if (matchup.racer2 !== null && matchup.winner) {
        let loser;
        if (matchup.winner.toString() === matchup.racer1.toString()) {
          loser = matchup.racer2;
        } else {
          loser = matchup.racer1;
        }
        currentWBLosers.push({ source: `WB${r + 1}`, loser });
      }
    });
    
    // Combine losers from current winners round with previous losers winners.
    const combined = [];
    previousLosersWinners.forEach(entry => {
      if (entry.participant) combined.push(entry.participant);
    });
    currentWBLosers.forEach(entry => {
      combined.push(entry.loser);
    });
    
    // Form the current losers round matches from the combined list.
    let currentLosersMatches = [];
    for (let i = 0; i < combined.length; i += 2) {
      if (i + 1 < combined.length) {
        currentLosersMatches.push({
          matchupId: `L${r + 1}-match${Math.floor(i / 2) + 1}`,
          participants: [combined[i], combined[i + 1]],
          winner: null,
          loser: null
        });
      } else {
        currentLosersMatches.push({
          matchupId: `L${r + 1}-match${Math.floor(i / 2) + 1}`,
          participants: [combined[i], null],
          winner: combined[i],
          loser: null
        });
      }
    }
    losersRounds.push({ round: r + 1, matchups: currentLosersMatches });
    
    // Set previousLosersWinners for the next iteration.
    previousLosersWinners = currentLosersMatches.map(match => ({
      participant: match.winner ? match.winner : null,
      source: match.matchupId
    }));
  }
  
  return losersRounds;
}

// ------------------------------------------
// Bracket Generation Route
// ------------------------------------------
router.post("/generateFull", async (req, res) => {
  try {
    const { grandPrixId } = req.body;
    if (!grandPrixId) {
      return res.status(400).json({ message: "grandPrixId is required" });
    }

    // Retrieve racers for the event, sorted by points descending (higher seed first)
    const racers = await Racer.find({ grandPrix: grandPrixId }).sort({ points: -1 });
    const n = racers.length;
    if (n < 2) {
      return res.status(400).json({ message: "Not enough racers to generate a bracket" });
    }

    // Traditional bye calculation: nextPowerOfTwo(n) - n
    const standardByes = nextPowerOfTwo(n) - n;
    console.log(`Total racers: ${n}, Standard byes: ${standardByes}`);

    let round1Matchups = [];
    // Assign byes to the top 'byes' seeds:
    for (let i = 0; i < standardByes; i++) {
      round1Matchups.push({
        racer1: racers[i]._id,
        racer2: null,
        winner: racers[i]._id, // auto-advance
        loser: null
      });
    }
    // Pair the remaining racers sequentially:
    const remaining = racers.slice(standardByes);
    for (let i = 0; i < remaining.length; i += 2) {
      if (i + 1 < remaining.length) {
        round1Matchups.push({
          racer1: remaining[i]._id,
          racer2: remaining[i + 1]._id,
          winner: null,
          loser: null
        });
      } else {
        // If there's an odd number, assign a bye for the last racer.
        round1Matchups.push({
          racer1: remaining[i]._id,
          racer2: null,
          winner: remaining[i]._id,
          loser: null
        });
      }
    }

    // Build the winners bracket rounds.
    let winnersBracket = [];
    winnersBracket.push({ round: 1, matchups: round1Matchups });

    let currentRoundMatchups = round1Matchups;
    let roundNumber = 2;
    while (currentRoundMatchups.length > 1) {
      let nextRoundMatchups = [];
      // Simulate winners from current round (assume bye or racer1 wins by default)
      let winners = currentRoundMatchups.map(matchup => matchup.winner ? matchup.winner : matchup.racer1);
      // Pair winners for the next round sequentially:
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          nextRoundMatchups.push({
            racer1: winners[i],
            racer2: winners[i + 1],
            winner: null,
            loser: null
          });
        } else {
          nextRoundMatchups.push({
            racer1: winners[i],
            racer2: null,
            winner: winners[i],
            loser: null
          });
        }
      }
      winnersBracket.push({ round: roundNumber, matchups: nextRoundMatchups });
      currentRoundMatchups = nextRoundMatchups;
      roundNumber++;
    }

    // Compute the losers bracket using our custom function.
    const losersBracket = computeLosersBracket(winnersBracket);

    // Finals placeholders: winners bracket champion vs. losers bracket champion,
    // with the possibility of a reset match.
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

    // Create and save the bracket document.
    const bracket = new Bracket({
      grandPrix: grandPrixId,
      winnersBracket,
      losersBracket,
      finals
    });
    await bracket.save();

    // Re-query the bracket and populate nested fields for easier reading.
    const fullBracket = await Bracket.findById(bracket._id)
      .populate("grandPrix", "name")
      .populate({
        path: "winnersBracket.matchups.racer1",
        select: "firstName lastName club"
      })
      .populate({
        path: "winnersBracket.matchups.racer2",
        select: "firstName lastName club"
      });

    // Add a custom match name to each matchup in the winners bracket.
    const formattedWinners = fullBracket.winnersBracket.map(round => {
      const formattedMatchups = round.matchups.map((matchup, index) => ({
        ...matchup.toObject(),
        matchName: `Round ${round.round} - Match ${index + 1}`
      }));
      return { round: round.round, matchups: formattedMatchups };
    });

    const responseBracket = {
      grandPrix: fullBracket.grandPrix, // Contains the event name.
      winnersBracket: formattedWinners,
      losersBracket: losersBracket, // Computed losers bracket.
      finals: fullBracket.finals
    };

    res.status(201).json({
      message: "Full bracket generated successfully",
      bracket: responseBracket
    });
  } catch (error) {
    console.error("Error generating full bracket:", error);
    res.status(500).json({ message: "Error generating full bracket", error });
  }
});

module.exports = router;
