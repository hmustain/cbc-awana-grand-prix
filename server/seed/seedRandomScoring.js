// seedRandomScoring.js
const mongoose = require("mongoose");
require("dotenv").config();
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

async function simulateScoring() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for random scoring");

    // Fetch all heats that have not been scored yet (i.e. results array is empty)
    const heats = await Heat.find({ results: { $size: 0 } });
    
    for (const heat of heats) {
      // Determine number of racers in this heat
      const numRacers = heat.racers.length;
      // Create an array of placements (e.g., [1,2,3,..., numRacers]) and shuffle it
      let placements = Array.from({ length: numRacers }, (_, i) => i + 1);
      placements.sort(() => Math.random() - 0.5);

      const results = heat.racers.map((racerId, index) => ({
        racer: racerId,
        placement: placements[index],
      }));

      // Update the heat document with the simulated results.
      heat.results = results;
      await heat.save();

      // Optionally, update each racer's points based on the scoring logic:
      // Points for placement = numRacers - (placement - 1)
      for (const result of results) {
        const pointsAwarded = numRacers - (result.placement - 1);
        await Racer.findByIdAndUpdate(result.racer, { $inc: { points: pointsAwarded } });
      }
    }
    
    console.log("Random scoring simulation complete.");
    mongoose.disconnect();
  } catch (error) {
    console.error("Error during random scoring simulation:", error);
    mongoose.disconnect();
  }
}

simulateScoring();
