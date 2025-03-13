const mongoose = require("mongoose");

const MatchupSchema = new mongoose.Schema({
  racer1: { type: mongoose.Schema.Types.ObjectId, ref: "Racer" },
  racer2: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
  loser: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null }
});

const RoundSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  matchups: [MatchupSchema]
});

const BracketSchema = new mongoose.Schema({
  grandPrix: { type: mongoose.Schema.Types.ObjectId, ref: "GrandPrix" },
  winnersBracket: [RoundSchema],
  losersBracket: [RoundSchema],
  finals: {
    championship: {
      match: MatchupSchema
    },
    thirdPlace: {
      match: MatchupSchema
    }
  }
});

module.exports = mongoose.model("Bracket", BracketSchema);
