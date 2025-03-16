// models/Bracket.js
const mongoose = require("mongoose");

const MatchupSchema = new mongoose.Schema({
  matchId: { type: String, default: null }, // e.g. "R1-M1", "WB-R2-M3", etc.
  
  racer1: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  racer2: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  loser: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  
  // For bracket progression: which match the winner goes to next
  nextMatchIdIfWin: { type: String, default: null },
  nextMatchSlot: { type: String, default: null } // e.g. "racer1" or "racer2"
});

const RoundSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  matchups: [MatchupSchema]
});

/**
 * FinalsMatchSchema:
 * Optionally includes matchId, nextMatchIdIfWin, nextMatchSlot if you want to treat finals
 * exactly like other matches. For a simpler approach, you can omit them.
 */
const FinalsMatchSchema = new mongoose.Schema({
  matchId: { type: String, default: null },

  racer1: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  racer2: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  loser: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },

  // If you want the finals to feed into an if-necessary match, you can store them here:
  nextMatchIdIfWin: { type: String, default: null },
  nextMatchSlot: { type: String, default: null }
});

const BracketSchema = new mongoose.Schema({
  grandPrix: { type: mongoose.Schema.Types.ObjectId, ref: "GrandPrix" },
  
  winnersBracket: [RoundSchema],
  losersBracket: [RoundSchema],
  
  finals: {
    championship: {
      match: FinalsMatchSchema
    },
    ifNecessary: {
      match: FinalsMatchSchema
    },
    thirdPlace: {
      match: FinalsMatchSchema
    }
  }
});

module.exports = mongoose.model("Bracket", BracketSchema);
