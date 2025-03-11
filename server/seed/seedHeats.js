const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

async function seedHeats() {
  // Fetch all racers, sorted consistently (e.g., by lastName then firstName)
  let racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
  
  if (racers.length < 1) {
    throw new Error("No racers available to generate heats.");
  }

  const totalRounds = 4; // Each racer races once per round, so 4 rounds total.
  let allHeats = [];

  // For each round, assign lanes deterministically so that each racer runs on a different lane.
  for (let round = 0; round < totalRounds; round++) {
    // For each racer, assign a lane using (round + index) mod 4.
    let roundAssignments = racers.map((racer, index) => ({
      racerId: racer._id,
      lane: (round + index) % 4
    }));

    // Partition roundAssignments into heats of 4 (the last heat may have fewer than 4 racers)
    for (let i = 0; i < roundAssignments.length; i += 4) {
      let heatGroup = roundAssignments.slice(i, i + 4);
      const heatRacerIds = heatGroup.map(item => item.racerId);

      // Create a new heat with these racers and their lane assignments.
      const newHeat = new Heat({
        racers: heatRacerIds,
        laneAssignments: heatGroup, // Each item: { racerId, lane }
        round: round + 1  // Round number (1 to 4)
      });
      await newHeat.save();
      allHeats.push(newHeat);
    }
  }
  console.log(`Generated ${allHeats.length} heats.`);
}

module.exports = seedHeats;
