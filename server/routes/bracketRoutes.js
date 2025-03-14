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

    // Standard byes = nextPowerOfTwo(n) - n, but cap at 4
    const standardByes = nextPowerOfTwo(n) - n;
    const byes = Math.min(standardByes, 4);
    console.log(`Total racers: ${n}, Standard byes: ${standardByes}, Capped byes: ${byes}`);

    let round1Matchups = [];
    // Assign byes to the top 'byes' seeds:
    for (let i = 0; i < byes; i++) {
      round1Matchups.push({
        racer1: racers[i]._id,
        racer2: null,
        winner: racers[i]._id, // auto-advance
        loser: null
      });
    }
    // Pair the remaining racers sequentially:
    const remaining = racers.slice(byes);
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

    // Losers bracket: We'll leave this empty for now
    const losersBracket = [];

    // Finals placeholders:
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

    // Add a custom match name to each matchup.
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
      losersBracket: fullBracket.losersBracket, // Likely empty for now.
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
