const mongoose = require("mongoose");
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

async function seedRandomScoring() {
  try {
    // Find all heats that have no results
    const heats = await Heat.find({ results: { $size: 0 } });
    console.log(`Found ${heats.length} heats to score.`);
    
    for (const heat of heats) {
      const numRacers = heat.racers.length;
      // Create an array of placements [1, 2, ..., numRacers] and shuffle it
      let placements = Array.from({ length: numRacers }, (_, i) => i + 1);
      placements.sort(() => Math.random() - 0.5);
      
      // For each racer in the heat, assign a random placement and explicitly create an ObjectId
      const results = heat.racers.map((racerId, index) => ({
        racer: new mongoose.Types.ObjectId(racerId),
        placement: placements[index]
      }));
      
      heat.results = results;
      await heat.save();
      
      // Points assignment logic: points = numRacers - (placement - 1)
      for (const result of results) {
        const pointsAwarded = numRacers - (result.placement - 1);
        await Racer.findByIdAndUpdate(result.racer, { $inc: { points: pointsAwarded } });
      }
      
      console.log(`Heat ${heat._id} scored with results:`, results);
    }
    
    console.log("Random scoring simulation complete.");
  } catch (error) {
    console.error("Error during random scoring simulation:", error);
  }
}

module.exports = seedRandomScoring;
