const mongoose = require("mongoose");

const HeatSchema = new mongoose.Schema({
  racers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Racer" }],
  laneAssignments: [{
    racerId: { type: mongoose.Schema.Types.ObjectId, ref: "Racer" },
    lane: Number
  }],
  round: { type: Number },
  results: [{
    racer: { type: mongoose.Schema.Types.ObjectId, ref: "Racer" },
    placement: Number
  }],
  grandPrix: { type: mongoose.Schema.Types.ObjectId, ref: "GrandPrix" }
});

module.exports = mongoose.model("Heat", HeatSchema);
