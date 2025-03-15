// server/routes/bracketgeneration.js
const express = require("express");
const Racer = require("../models/Racer");
const GrandPrix = require("../models/GrandPrix");

// Import the JSON storage and BracketsManager from the new packages
const { JsonDatabase } = require("brackets-json-db");
const { BracketsManager } = require("brackets-manager");

const storage = new JsonDatabase();
const manager = new BracketsManager(storage);

const router = express.Router();

// Helper: calculate next power of two (we no longer use it to pad manually)
function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

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
    
    // Build seeding array from actual racers (do NOT pad manually)
    const seeding = racers.map(r => `${r.firstName} ${r.lastName}`);
    console.log("Seeding array:", seeding);
    
    // Convert grandPrixId to number if possible (brackets-manager examples use numeric IDs)
    const tournamentId = Number(grandPrixId) || grandPrixId;
    
    // Create a double elimination stage using brackets-manager.
    await manager.create.stage({
      tournamentId,
      name: "Double Elimination Stage",
      type: "double_elimination",
      seeding, // Pass the natural seeding array
      settings: { grandFinal: "double" },
    });
    
    // Retrieve stage data; this returns an object with keys:
    // { participant, stage, match, match_game }
    const stageData = await manager.get.stageData({ tournamentId });
    
    // Map keys to what brackets-viewer expects:
    const bracketData = {
      participants: stageData.participant || [],
      stages: stageData.stage || [],
      matches: stageData.match || [],
      matchGames: stageData.match_game || [],
    };
    
    res.status(201).json({
      message: "Bracket generated successfully",
      bracket: bracketData,
    });
  } catch (error) {
    console.error("Error generating full bracket:", error);
    res.status(500).json({ message: "Error generating full bracket", error });
  }
});

module.exports = router;
