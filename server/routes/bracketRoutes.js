const express = require("express");
const mongoose = require("mongoose");
const Bracket = require("../models/Bracket");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix"); // For populating event name

const router = express.Router();

// Helper: calculate next power of 2
function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

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
    
    const bracketSize = nextPowerOfTwo(n);
    const byes = bracketSize - n;
    console.log(`Total racers: ${n}, Bracket size: ${bracketSize}, Byes: ${byes}`);
    
    let winnersBracket = [];
    
    // Round 1: Create matchups with byes for top seeds
    let round1Matchups = [];
    // Assign byes to the top seeds:
    for (let i = 0; i < byes; i++) {
      round1Matchups.push({
        racer1: racers[i]._id,
        racer2: null,
        winner: racers[i]._id, // auto-advance
        loser: null
      });
    }
    // Pair the remaining racers (from index 'byes' onward):
    let remaining = racers.slice(byes);
    let i = 0;
    let j = remaining.length - 1;
    while (i < j) {
      round1Matchups.push({
        racer1: remaining[i]._id,
        racer2: remaining[j]._id,
        winner: null,
        loser: null
      });
      i++;
      j--;
    }
    // If there's an odd number remaining, assign a bye:
    if (i === j) {
      round1Matchups.push({
        racer1: remaining[i]._id,
        racer2: null,
        winner: remaining[i]._id,
        loser: null
      });
    }
    
    winnersBracket.push({
      round: 1,
      matchups: round1Matchups
    });
    
    // Generate subsequent rounds for the winners bracket.
    let currentRoundMatchups = round1Matchups;
    let roundNumber = 2;
    while (currentRoundMatchups.length > 1) {
      let nextRoundMatchups = [];
      // Simulate winners from current round:
      let winners = currentRoundMatchups.map(matchup => matchup.winner ? matchup.winner : matchup.racer1);
      // Pair winners for the next round:
      for (let k = 0; k < winners.length; k += 2) {
        if (k + 1 < winners.length) {
          nextRoundMatchups.push({
            racer1: winners[k],
            racer2: winners[k + 1],
            winner: null,
            loser: null
          });
        } else {
          nextRoundMatchups.push({
            racer1: winners[k],
            racer2: null,
            winner: winners[k],
            loser: null
          });
        }
      }
      winnersBracket.push({
        round: roundNumber,
        matchups: nextRoundMatchups
      });
      currentRoundMatchups = nextRoundMatchups;
      roundNumber++;
    }
    
    // Losers bracket: For now, we'll leave this empty or add placeholders.
    let losersBracket = [];
    
    // Finals placeholder:
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
    
    // Create and save the bracket
    const bracket = new Bracket({
      grandPrix: grandPrixId,
      winnersBracket,
      losersBracket,
      finals
    });
    
    await bracket.save();
    
    // Re-query the bracket and populate nested fields for better readability:
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
    
    // Optionally, add a custom "matchName" property to each matchup for clarity:
    const formattedWinners = fullBracket.winnersBracket.map(round => {
      const formattedMatchups = round.matchups.map((matchup, index) => {
        let matchName = `Round ${round.round} - Match ${index + 1}`;
        return { ...matchup.toObject(), matchName };
      });
      return { round: round.round, matchups: formattedMatchups };
    });
    
    // Construct a response with populated Grand Prix and formatted winners bracket.
    const responseBracket = {
      grandPrix: fullBracket.grandPrix, // contains the event name
      winnersBracket: formattedWinners,
      losersBracket: fullBracket.losersBracket, // likely empty for now
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
