const express = require("express");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix"); // Import GrandPrix model

const router = express.Router();

// Register a new racer
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, club, grandPrix, grandPrixName } = req.body;
    if (!firstName || !lastName || !club) {
      return res.status(400).json({ message: "First name, Last name, and club are required" });
    }

    let grandPrixId = grandPrix;
    // If grandPrix id is not provided but grandPrixName is,
    // look up the event by name.
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
    res.status(500).json({ message: "Error registering racer", error });
  }
});

module.exports = router;
