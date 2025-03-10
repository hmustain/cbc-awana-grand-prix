const mongoose = require("mongoose");

const BracketSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  matchups: [
    {
      racer1: { type: mongoose.Schema.Types.ObjectId, ref: "Racer" },
      racer2: { type: mongoose.Schema.Types.ObjectId, ref: "Racer" },
      winner: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null },
      loser: { type: mongoose.Schema.Types.ObjectId, ref: "Racer", default: null }
    }
  ]
});

module.exports = mongoose.model("Bracket", BracketSchema);
