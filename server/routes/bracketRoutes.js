// server/routes/bracketgeneration.js
const express = require("express");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix");

// Import the new brackets-manager and its JSON storage adapter.
const { JsonDatabase } = require("brackets-json-db");
const { BracketsManager } = require("brackets-manager");

const storage = new JsonDatabase();
const manager = new BracketsManager(storage);

const router = express.Router();

// POST /api/bracket/generateFull
router.post("/generateFull", async (req, res) => {
  try {
    const { grandPrixId } = req.body;
    if (!grandPrixId) {
      return res.status(400).json({ message: "grandPrixId is required" });
    }

    // Retrieve racers sorted by seed (ascending)
    const racers = await Racer.find({ grandPrix: grandPrixId }).sort({ seed: 1 });
    if (racers.length < 2) {
      return res.status(400).json({ message: "Not enough racers to generate a bracket" });
    }

    // Build an array of team names (or IDs) in seeding order.
    // The brackets-manager library will internally determine the proper power‑of‑2 bracket
    // and assign BYEs to higher seeds.
    const seeding = racers.map(r => `${r.firstName} ${r.lastName}`);

    // Create a stage (for example, a double elimination stage).
    // The settings option (e.g., grandFinal: 'double') can be customized per your requirements.
    await manager.create.stage({
      tournamentId: grandPrixId,
      name: "Double Elimination Stage",
      type: "double_elimination",
      seeding: seeding,
      settings: { grandFinal: "double" }
    });

    // Retrieve the stage bracket from the manager.
    const stageBracket = await manager.get.stage({ tournamentId: grandPrixId });

    // Return the bracket data.
    return res.status(201).json({
      message: "Bracket generated successfully",
      bracket: stageBracket
    });
  } catch (error) {
    console.error("Error generating full bracket:", error);
    return res.status(500).json({ message: "Error generating full bracket", error });
  }
});

module.exports = router;
