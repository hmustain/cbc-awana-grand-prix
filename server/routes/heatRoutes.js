const express = require("express");
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

const router = express.Router();

// Generate heat races
router.post("/generate", async (req, res) => {
  try {
    // Fetch all racers
    const racers = await Racer.find();
    if (racers.length < 4) {
      return res.status(400).json({ message: "Not enough racers to generate heats (minimum 4 needed)." });
    }

    let heats = [];
    let heatNumber = 1;
    let lanes = [0, 1, 2, 3]; // Four lanes

    // Shuffle racers randomly
    const shuffledRacers = [...racers].sort(() => Math.random() - 0.5);

    // Assign racers to heats, ensuring fair lane distribution
    while (shuffledRacers.length >= 4) {
      let assignedRacers = shuffledRacers.splice(0, 4); // Take the first 4 racers
      let laneAssignments = assignedRacers.map((racer, index) => ({
        racer: racer._id,
        lane: lanes[index], // Assign a lane to each racer
      }));

      const newHeat = new Heat({
        racers: assignedRacers.map(r => r._id),
        results: [],
        heatNumber,
        laneAssignments,
      });

      await newHeat.save();
      heats.push(newHeat);
      heatNumber++;
    }

    res.status(201).json({ message: "Heats generated successfully", heats });
  } catch (error) {
    console.error("Error generating heats:", error);
    res.status(500).json({ message: "Error generating heats", error });
  }
});

module.exports = router;
