const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GrandPrixSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    location: { type: String },
    // Racers registered for this event
    racers: [{ type: Schema.Types.ObjectId, ref: "Racer" }],
    // Generated heats for the event
    heats: [{ type: Schema.Types.ObjectId, ref: "Heat" }],
    // The bracket for the event (could be an ObjectId to a separate Bracket document)
    bracket: { type: Schema.Types.ObjectId, ref: "Bracket" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GrandPrix", GrandPrixSchema);
