const mongoose = require("mongoose");

const RacerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  points: { type: Number, default: 0 }, // Total points from heat races
  heats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Heat" }], // Track assigned heats
  seed: { type: Number, default: null } // Seeding for the bracket
});

module.exports = mongoose.model("Racer", RacerSchema);
