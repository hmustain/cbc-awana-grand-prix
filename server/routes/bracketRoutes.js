// server/routes/bracketgeneration.js
const express = require("express");
const Racer = require("../models/Racer");

// Import the JSON DB and manager from the brackets packages
const { JsonDatabase } = require("brackets-json-db");
const { BracketsManager } = require("brackets-manager");

// Create storage with an explicit file path (you can adjust the path as needed)
const storage = new JsonDatabase({ path: "./brackets-db.json" });
const manager = new BracketsManager(storage);

const router = express.Router();

// Helper: calculate next power of two
function nextPowerOfTwo(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

router.post("/generateFull", async (req, res) => {
  try {
    const { grandPrixId } = req.body;
    if (!grandPrixId) {
      return res.status(400).json({ message: "grandPrixId is required" });
    }
    
    // 1) Fetch racers from MongoDB (ensure there are enough racers)
    const racers = await Racer.find({ grandPrix: grandPrixId }).sort({ seed: 1 });
    if (racers.length < 2) {
      console.log("Not enough racers:", racers.length);
      return res.status(400).json({ message: "Not enough racers to generate a bracket" });
    }
    
    // 2) Build a seeding array from racer names and pad with BYEs to a power of two
    let seeding = racers.map(r => `${r.firstName} ${r.lastName}`);
    const currentCount = seeding.length;
    const targetCount = nextPowerOfTwo(currentCount);
    if (currentCount < targetCount) {
      const byesNeeded = targetCount - currentCount;
      for (let i = 1; i <= byesNeeded; i++) {
        seeding.push(`BYE ${i}`);
      }
    }
    console.log("Seeding array:", seeding);

    // Use tournamentId as provided (you can convert it to a number if needed)
    const tournamentId = Number(grandPrixId) || grandPrixId;

    // (Optional) Reset any existing data for this tournament to start clean
    // await manager.reset.tournament({ id: tournamentId });
    // console.log(`Tournament ${tournamentId} reset.`);

    // 3) Create a double elimination stage using the new library.
    // Note: There is no create.tournament(), so we simply create a stage.
    await manager.create.stage({
      tournamentId,
      name: "Double Elimination Stage",
      type: "double_elimination",
      seeding,
      settings: { grandFinal: "double" },
    });
    console.log("Stage created successfully.");

    // 4) Retrieve the stage data using the proper getter.
    const stageData = await manager.get.stageData({ tournamentId });
    console.log("Raw stageData:", JSON.stringify(stageData, null, 2));

    // Map the data to our expected structure for the viewer.
    // (The viewer expects an object with keys: participants, stages, matches, matchGames)
    const bracketData = {
      participants: stageData.participant || [],
      stages: stageData.stage || [],
      matches: stageData.match || [],
      matchGames: stageData.match_game || [],
    };
    console.log("Final bracketData:", JSON.stringify(bracketData, null, 2));

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
