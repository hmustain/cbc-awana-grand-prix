const express = require("express");
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

const router = express.Router();

// GET: All heats for a specific Grand Prix
router.get("/gp/:gpId", async (req, res) => {
  try {
    const { gpId } = req.params;
    const heats = await Heat.find({ grandPrix: gpId }).sort({ round: 1 });
    
    const formattedHeats = await Promise.all(
      heats.map(async (heat, index) => {
        const populatedHeat = await Heat.findById(heat._id)
          .populate("racers", "firstName lastName club")
          .populate("results.racer", "firstName lastName club");
        
        const numRacers = populatedHeat.racers?.length || 0;
        const formattedResults = populatedHeat.results.map((r) => {
          if (!r.racer) return { formattedName: "Unknown Racer", placement: r.placement, pointsReceived: 0 };
          const racer = r.racer;
          const formattedName = `${racer.firstName} ${racer.lastName.charAt(0)} - ${racer.club}`;
          const pointsReceived = numRacers - (r.placement - 1);
          return { formattedName, placement: r.placement, pointsReceived };
        });
        
        return {
          heatName: `Heat ${index + 1}`,
          round: populatedHeat.round,
          _id: populatedHeat._id,
          results: formattedResults,
          racers: populatedHeat.racers.map(racer =>
            `${racer.firstName} ${racer.lastName.charAt(0)} - ${racer.club}`
          ),
          grandPrix: populatedHeat.grandPrix
        };
      })
    );
    
    res.status(200).json({ message: "Heats retrieved successfully", heats: formattedHeats });
  } catch (error) {
    console.error("Error retrieving heats for GP:", error);
    res.status(500).json({ message: "Error retrieving heats", error });
  }
});

// POST: Generate heats for a specific Grand Prix
router.post("/generate", async (req, res) => {
  try {
    const { grandPrix } = req.body;
    if (!grandPrix) {
      return res.status(400).json({ message: "Grand Prix ID is required to generate heats." });
    }
    
    // Fetch only the racers for this Grand Prix
    let racers = await Racer.find({ grandPrix }).sort({ lastName: 1, firstName: 1 });
    if (racers.length < 1) {
      return res.status(400).json({ message: "No racers available in this Grand Prix to generate heats." });
    }
    
    const totalRounds = 4;
    let allHeats = [];
    
    for (let round = 0; round < totalRounds; round++) {
      let roundAssignments = racers.map((racer, index) => ({
        racerId: racer._id,
        lane: (round + index) % 4
      }));
      
      for (let i = 0; i < roundAssignments.length; i += 4) {
        let heatGroup = roundAssignments.slice(i, i + 4);
        const heatRacerIds = heatGroup.map(item => item.racerId);
        const newHeat = new Heat({
          racers: heatRacerIds,
          laneAssignments: heatGroup,
          round: round + 1,
          grandPrix // Store the GP ID here
        });
        await newHeat.save();
        allHeats.push(newHeat);
      }
    }
    
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
          round: populatedHeat.round,
          results: populatedHeat.results,
          grandPrix: populatedHeat.grandPrix
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

// PUT: Update a heat (for manual adjustments)
router.put("/:id", async (req, res) => {
  try {
    const updatedHeat = await Heat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedHeat) {
      return res.status(404).json({ message: "Heat not found" });
    }
    res.status(200).json({ message: "Heat updated successfully", heat: updatedHeat });
  } catch (error) {
    console.error("Error updating heat:", error);
    res.status(500).json({ message: "Error updating heat", error });
  }
});

// POST: Score a heat
router.post("/score", async (req, res) => {
  try {
    const { heatId, results } = req.body;
    
    if (!heatId || !results || !Array.isArray(results)) {
      return res.status(400).json({ message: "heatId and results array are required" });
    }
    
    const heat = await Heat.findById(heatId);
    if (!heat) {
      return res.status(404).json({ message: "Heat not found" });
    }
    
    heat.results = results.map(result => ({
      racer: result.racerId,
      placement: result.placement
    }));
    
    await heat.save();
    
    const placementPoints = { 1: 4, 2: 3, 3: 2, 4: 1 };
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
