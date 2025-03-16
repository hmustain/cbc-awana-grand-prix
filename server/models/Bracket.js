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
  nextMatchSlot: { type: String, default: null }, // e.g. "racer1" or "racer2"
});

const RoundSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  matchups: [MatchupSchema]
});

const FinalsMatchSchema = new mongoose.Schema({
  racer1: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  racer2: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  loser: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null }
});

const BracketSchema = new mongoose.Schema({
  grandPrix: { type: mongoose.Schema.Types.ObjectId, ref: "GrandPrix" },
  
  winnersBracket: [RoundSchema],
  losersBracket: [RoundSchema],
  
  finals: {
    championship: {
      match: FinalsMatchSchema
    },
    thirdPlace: {
      match: FinalsMatchSchema
    }
  }
});

module.exports = mongoose.model("Bracket", BracketSchema);
