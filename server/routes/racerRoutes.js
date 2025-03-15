const express = require("express");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix");

const router = express.Router();

// Register a new racer
router.post("/", async (req, res) => {
  try {
    const { firstName, lastName, club, grandPrix, grandPrixName } = req.body;
    if (!firstName || !lastName || !club) {
      return res.status(400).json({
        message: "First name, Last name, and club are required",
      });
    }

    let grandPrixId = grandPrix;
    // If a Grand Prix ID is not provided but a grandPrixName is, look it up.
    if (!grandPrixId && grandPrixName) {
      const event = await GrandPrix.findOne({ name: grandPrixName });
      if (event) {
        grandPrixId = event._id;
      } else {
        return res
          .status(404)
          .json({ message: "Grand Prix event not found with that name" });
      }
    }

    const newRacer = new Racer({
      firstName,
      lastName,
      club,
      grandPrix: grandPrixId,
    });
    await newRacer.save();
    res.status(201).json(newRacer);
  } catch (error) {
    console.error("Error registering racer:", error);
    res.status(500).json({ message: "Error registering racer", error });
  }
});

// Get all racers (across all GPs)
router.get("/", async (req, res) => {
  try {
    const racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
    res.json(racers);
  } catch (error) {
    console.error("Error fetching racers:", error);
    res.status(500).json({ message: "Error fetching racers", error });
  }
});

/**
 * GET: All racers for a specific Grand Prix (by gpId)
 * Example request: GET /api/racers/gp/123abc
 */
router.get("/gp/:gpId", async (req, res) => {
  try {
    const { gpId } = req.params;
    // Find all racers assigned to this Grand Prix
    // Sort them by lastName/firstName, or by points if you prefer
    const racers = await Racer.find({ grandPrix: gpId }).sort({
      lastName: 1,
      firstName: 1,
    });
    res.status(200).json({ racers });
  } catch (error) {
    console.error("Error retrieving racers for GP:", error);
    res.status(500).json({ message: "Error retrieving racers for GP", error });
  }
});

// Delete a racer by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedRacer = await Racer.findByIdAndDelete(req.params.id);
    if (!deletedRacer) {
      return res.status(404).json({ message: "Racer not found" });
    }
    res.status(200).json({ message: "Racer deleted", racer: deletedRacer });
  } catch (error) {
    console.error("Error deleting racer:", error);
    res.status(500).json({ message: "Error deleting racer", error });
  }
});

module.exports = router;
