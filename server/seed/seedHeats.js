const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

async function seedHeats() {
  // Retrieve all racers, sorted consistently
  const racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
  
  if (racers.length < 1) {
    throw new Error("No racers available to generate heats.");
  }

  const totalRounds = 4; // Each racer will race once per round.
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
      
      // Create a new Heat document with the racer IDs and lane assignments
      const newHeat = new Heat({
        racers: heatRacerIds,             // This is critical for population later!
        laneAssignments: heatGroup,
        round: round + 1
      });
      
      await newHeat.save();
      allHeats.push(newHeat);
    }
  }
  
  console.log(`Generated ${allHeats.length} heats.`);
}

module.exports = seedHeats;
