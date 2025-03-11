const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

async function seedRandomScoring() {
  try {
    // Find all heats that have no results
    const heats = await Heat.find({ results: { $size: 0 } });
    console.log(`Found ${heats.length} heats to score.`);
    
    for (const heat of heats) {
      const numRacers = heat.racers.length;
      // Generate placements array and shuffle it
      let placements = Array.from({ length: numRacers }, (_, i) => i + 1);
      placements.sort(() => Math.random() - 0.5);

      // Create results array mapping each racer to a random placement
      const results = heat.racers.map((racerId, index) => ({
        racer: racerId,
        placement: placements[index]
      }));

      heat.results = results;
      await heat.save();

      // Update each racer's total points.
      // Using points logic: points = (number of racers in heat) - (placement - 1)
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
