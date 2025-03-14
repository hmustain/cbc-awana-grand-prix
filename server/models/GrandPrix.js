const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GrandPrixSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    location: { type: String },
    racers: [{ type: Schema.Types.ObjectId, ref: "Racer" }],
    heats: [{ type: Schema.Types.ObjectId, ref: "Heat" }],
    bracket: { type: Schema.Types.ObjectId, ref: "Bracket" }
  },
  { timestamps: true }
);

// Virtual for racers (using the Racer model's grandPrix field)
GrandPrixSchema.virtual('racersList', {
  ref: 'Racer',
  localField: '_id',
  foreignField: 'grandPrix'
});

// Ensure virtual fields are included when converting to JSON or Objects
GrandPrixSchema.set('toObject', { virtuals: true });
GrandPrixSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("GrandPrix", GrandPrixSchema);
