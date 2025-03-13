const express = require("express");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix"); // <-- Added import for GrandPrix

const router = express.Router();

// Register a new racer
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, club, grandPrix, grandPrixName } = req.body;
    if (!firstName || !lastName || !club) {
      return res.status(400).json({ message: "First name, Last name, and club are required" });
    }

    let grandPrixId = grandPrix;
    // If a Grand Prix ID is not provided but a grandPrixName is, look it up.
    if (!grandPrixId && grandPrixName) {
      const event = await GrandPrix.findOne({ name: grandPrixName });
      if (event) {
        grandPrixId = event._id;
      } else {
        return res.status(404).json({ message: "Grand Prix event not found with that name" });
      }
    }

    const newRacer = new Racer({ firstName, lastName, club, grandPrix: grandPrixId });
    await newRacer.save();
    res.status(201).json(newRacer);
  } catch (error) {
    console.error("Error registering racer:", error);
    res.status(500).json({ message: "Error registering racer", error });
  }
});

// Get all racers
router.get("/", async (req, res) => {
  try {
    const racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
    res.json(racers);
  } catch (error) {
    console.error("Error fetching racers:", error);
    res.status(500).json({ message: "Error fetching racers", error });
  }
});

module.exports = router;
