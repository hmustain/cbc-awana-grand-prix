const express = require("express");
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

const router = express.Router();

// GET all heats
router.get("/", async (req, res) => {
    try {
      // Retrieve all heats sorted by round
      const heats = await Heat.find().sort({ round: 1 });
      
      // For each heat, populate both the racers and the results.racer fields
      const formattedHeats = await Promise.all(
        heats.map(async (heat, index) => {
          const populatedHeat = await Heat.findById(heat._id)
            .populate("racers", "firstName lastName club")
            .populate("results.racer", "firstName lastName club");
          
          const numRacers = populatedHeat.racers.length;
          
          // Format each result with racer's name, placement, and points received.
          const formattedResults = populatedHeat.results.map(result => {
            if (!result.racer) {
              // If racer data is missing, return a placeholder.
              return {
                formattedName: "Unknown Racer",
                placement: result.placement,
                pointsReceived: 0
              };
            }
            const racer = result.racer;
            const formattedName = `${racer.firstName} ${racer.lastName.charAt(0)} - ${racer.club}`;
            const pointsReceived = numRacers - (result.placement - 1);
            return {
              formattedName,
              placement: result.placement,
              pointsReceived
            };
          });
          
          return {
            heatName: `Heat ${index + 1}`,
            round: populatedHeat.round,
            _id: populatedHeat._id,
            results: formattedResults
          };
        })
      );
      
      res.status(200).json({ message: "Heats retrieved successfully", heats: formattedHeats });
    } catch (error) {
      console.error("Error retrieving heats:", error);
      res.status(500).json({ message: "Error retrieving heats", error });
    }
  });
  
// POST: Generate heats
router.post("/generate", async (req, res) => {
  try {
    // Fetch all racers, sorted consistently (e.g., by lastName then firstName)
    let racers = await Racer.find().sort({ lastName: 1, firstName: 1 });
    
    if (racers.length < 1) {
      return res.status(400).json({ message: "No racers available to generate heats." });
    }

    const totalRounds = 4; // Each racer races once per round, so 4 races total.
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

    // After creating the heats, populate racer details and format the response.
    const formattedHeats = await Promise.all(
      allHeats.map(async (heat, index) => {
        const populatedHeat = await Heat.findById(heat._id).populate("racers", "firstName lastName club");
        const formattedRacers = populatedHeat.racers.map(racer =>
          `${racer.firstName} ${racer.lastName.charAt(0)} - ${racer.club}`
        );
        return {
          heatName: `Heat ${index + 1}`,
          racers: formattedRacers,
          _id: populatedHeat._id,
          results: populatedHeat.results
        };
      })
    );

    res.status(201).json({
      message: "Heats generated successfully",
      heats: formattedHeats
    });
  } catch (error) {
    console.error("Error generating heats:", error);
    res.status(500).json({ message: "Error generating heats", error });
  }
});

// POST: Score a heat
router.post("/score", async (req, res) => {
  try {
    const { heatId, results } = req.body;
    
    if (!heatId || !results || !Array.isArray(results)) {
      return res.status(400).json({ message: "heatId and results array are required" });
    }
    
    // Update the heat with the submitted results.
    const heat = await Heat.findById(heatId);
    if (!heat) {
      return res.status(404).json({ message: "Heat not found" });
    }
    
    heat.results = results.map(result => ({
      racer: result.racerId,
      placement: result.placement
    }));
    
    await heat.save();

    // Points assignment logic: for example, 1st: 4 points, 2nd: 3 points, 3rd: 2 points, 4th: 1 point.
    const placementPoints = { 1: 4, 2: 3, 3: 2, 4: 1 };

    // Update each racer's total points.
    for (const result of results) {
      const pointsAwarded = placementPoints[result.placement] || 0;
      await Racer.findByIdAndUpdate(result.racerId, { $inc: { points: pointsAwarded } });
    }
    
    res.status(200).json({ message: "Heat scored successfully", heat });
  } catch (error) {
    console.error("Error scoring heat:", error);
    res.status(500).json({ message: "Error scoring heat", error });
  }
});

module.exports = router;
