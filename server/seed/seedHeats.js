const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

async function seedHeats(grandPrixId) {
  // Clear existing heats to avoid duplication
  await Heat.deleteMany({});
  console.log("Cleared existing heats");

  // Retrieve racers associated with the specified Grand Prix
  const racers = await Racer.find({ grandPrix: grandPrixId }).sort({ lastName: 1, firstName: 1 });
  
  if (racers.length < 1) {
    throw new Error("No racers available to generate heats.");
  }

  const totalRounds = 4; // Each racer races once per round.
  let allHeats = [];

  // For each round, assign lanes and group racers into heats
  for (let round = 0; round < totalRounds; round++) {
    // Create lane assignments: each racer gets a lane based on (round + index) mod 4.
    const roundAssignments = racers.map((racer, index) => ({
      racerId: racer._id,
      lane: (round + index) % 4
    }));

    // Group the assignments into heats of 4 racers (last heat may have fewer than 4 racers)
    for (let i = 0; i < roundAssignments.length; i += 4) {
      const heatGroup = roundAssignments.slice(i, i + 4);
      const heatRacerIds = heatGroup.map(item => item.racerId);
      
      // Create a new Heat document with racer IDs, lane assignments, round, and event association
      const newHeat = new Heat({
        racers: heatRacerIds,
        laneAssignments: heatGroup,
        round: round + 1,
        grandPrix: grandPrixId
      });
      
      await newHeat.save();
      allHeats.push(newHeat);
    }
  }
  
  console.log(`Generated ${allHeats.length} heats.`);
}

module.exports = seedHeats;
