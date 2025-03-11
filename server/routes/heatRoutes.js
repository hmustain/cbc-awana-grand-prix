const express = require("express");
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    // Fetch all racers, sorted consistently (e.g., by lastName then firstName)
    let racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
    
    if (racers.length < 1) {
      return res.status(400).json({ message: "No racers available to generate heats." });
    }

    const totalRounds = 4; // Each racer races once per round, total 4 races per racer.
    let allHeats = [];

    // For each round, assign lanes and partition racers into heats.
    for (let round = 0; round < totalRounds; round++) {
      // For each racer, assign a lane using (round + index) mod 4.
      let roundAssignments = racers.map((racer, index) => ({
        racerId: racer._id,
        lane: (round + index) % 4
      }));

      // Partition roundAssignments into chunks of 4.
      for (let i = 0; i < roundAssignments.length; i += 4) {
        let heatGroup = roundAssignments.slice(i, i + 4);
        // Create a new heat with these racers and their lane assignments.
        const newHeat = new Heat({
          racers: heatGroup.map(entry => entry.racerId),
          laneAssignments: heatGroup, // Each item: { racerId, lane }
          round: round + 1  // Round number (1 to 4)
        });
        await newHeat.save();
        allHeats.push(newHeat);
      }
    }

    res.status(201).json({ message: "Heats generated successfully", heats: allHeats });
  } catch (error) {
    console.error("Error generating heats:", error);
    res.status(500).json({ message: "Error generating heats", error });
  }
});

module.exports = router;
