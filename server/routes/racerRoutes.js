const express = require("express");
const Racer = require("../models/Racer");

const router = express.Router();

// Register a new racer
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First and Last Name are required" });
    }

    const newRacer = new Racer({ firstName, lastName });
    await newRacer.save();
    res.status(201).json(newRacer);
  } catch (error) {
    res.status(500).json({ message: "Error registering racer", error });
  }
});

// Get all racers
router.get("/", async (req, res) => {
  try {
    const racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
    res.json(racers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching racers", error });
  }
});

module.exports = router;
