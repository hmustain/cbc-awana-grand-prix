const mongoose = require("mongoose");

const RacerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  club: { type: String, required: true },
  points: { type: Number, default: 0 },
  heats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Heat" }],
  seed: { type: Number, default: null },
  grandPrix: { type: mongoose.Schema.Types.ObjectId, ref: "GrandPrix" }
});

module.exports = mongoose.model("Racer", RacerSchema);
