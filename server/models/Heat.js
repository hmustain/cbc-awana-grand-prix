const mongoose = require("mongoose");

const HeatSchema = new mongoose.Schema({
  racers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Racer" }], // 4 racers per heat
  results: [{ racer: mongoose.Schema.Types.ObjectId, place: Number }] // Store placements (1st, 2nd, 3rd, 4th)
});

module.exports = mongoose.model("Heat", HeatSchema);
