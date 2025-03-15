const express = require("express");
const Heat = require("../models/Heat");
const Racer = require("../models/Racer");

const router = express.Router();

/**
 * GET: All heats for a specific Grand Prix
 * Returns a "laneInfo" array so the front end can show (racer, lane) vertically.
 */
router.get("/gp/:gpId", async (req, res) => {
  try {
    const { gpId } = req.params;
    const heats = await Heat.find({ grandPrix: gpId }).sort({ round: 1 });

    // Format each heat with laneInfo and a custom heat title
    const formattedHeats = await Promise.all(
      heats.map(async (heat, index) => {
        // Populate racers and results
        const populatedHeat = await Heat.findById(heat._id)
          .populate("racers", "firstName lastName club")
          .populate("results.racer", "firstName lastName club");

        // Build a laneInfo array: each item has { racerId, name, lane }
        const laneInfo = populatedHeat.laneAssignments.map((assignment) => {
          const foundRacer = populatedHeat.racers.find(
            (r) => r._id.toString() === assignment.racerId.toString()
          );
          return {
            racerId: foundRacer?._id,
            name: foundRacer
              ? `${foundRacer.firstName} ${foundRacer.lastName.charAt(0)} - ${foundRacer.club}`
              : "Unknown Racer",
            lane: assignment.lane,
          };
        });

        // Format results for scoring display (optional)
        const numRacers = populatedHeat.racers?.length || 0;
        const formattedResults = populatedHeat.results.map((r) => {
          if (!r.racer) {
            return {
              racer: null,
              formattedName: "Unknown Racer",
              placement: r.placement,
              pointsReceived: 0,
            };
          }
          const racer = r.racer;
          const formattedName = `${racer.firstName} ${racer.lastName.charAt(0)} - ${racer.club}`;
          const pointsReceived = numRacers - (r.placement - 1);
          return { racer: racer._id, formattedName, placement: r.placement, pointsReceived };
        });

        return {
          // "Round X - Heat Y" style title
          heatName: `Round ${populatedHeat.round} - Heat ${index + 1}`,
          round: populatedHeat.round,
          _id: populatedHeat._id,
          laneInfo, // Array for the front end's vertical table
          results: formattedResults,
          // For convenience, we can keep an array of racer strings too if you want
          racers: populatedHeat.racers.map(
            (r) => `${r.firstName} ${r.lastName.charAt(0)} - ${r.club}`
          ),
          grandPrix: populatedHeat.grandPrix,
        };
      })
    );

    res.status(200).json({
      message: "Heats retrieved successfully",
      heats: formattedHeats,
    });
  } catch (error) {
    console.error("Error retrieving heats for GP:", error);
    res.status(500).json({ message: "Error retrieving heats", error });
  }
});

/**
 * POST: Generate heats for a specific Grand Prix
 * Logic ensures each racer gets 4 heats, each time in a different lane (0..3).
 */
router.post("/generate", async (req, res) => {
  try {
    const { grandPrix } = req.body;
    if (!grandPrix) {
      return res
        .status(400)
        .json({ message: "Grand Prix ID is required to generate heats." });
    }

    // Fetch only the racers for this Grand Prix
    const racers = await Racer.find({ grandPrix }).sort({
      lastName: 1,
      firstName: 1,
    });
    if (racers.length < 1) {
      return res.status(400).json({
        message: "No racers available in this Grand Prix to generate heats.",
      });
    }

    // 4 total rounds, 4 lanes each round
    const totalRounds = 4;
    const allHeats = [];

    // For each round, each racer is assigned a lane:
    // Lane = (round + index) % 4 => ensures each racer cycles through lanes 0..3
    for (let round = 0; round < totalRounds; round++) {
      // Build roundAssignments: an array of { racerId, lane }
      const roundAssignments = racers.map((racer, index) => ({
        racerId: racer._id,
        lane: (round + index) % 4,
      }));

      // Chunk every 4 assignments into a new Heat
      for (let i = 0; i < roundAssignments.length; i += 4) {
        const heatGroup = roundAssignments.slice(i, i + 4);
        const heatRacerIds = heatGroup.map((item) => item.racerId);

        const newHeat = new Heat({
          racers: heatRacerIds,
          laneAssignments: heatGroup,
          round: round + 1,
          grandPrix,
        });
        await newHeat.save();
        allHeats.push(newHeat);
      }
    }

    // Return a user-friendly response with basic info
    const formattedHeats = await Promise.all(
      allHeats.map(async (heat, index) => {
        const populatedHeat = await Heat.findById(heat._id).populate(
          "racers",
          "firstName lastName club"
        );
        // Build laneInfo here if you want to see it in the immediate response
        const laneInfo = populatedHeat.laneAssignments.map((assignment) => {
          const foundRacer = populatedHeat.racers.find(
            (r) => r._id.toString() === assignment.racerId.toString()
          );
          return {
            racerId: foundRacer?._id,
            name: foundRacer
              ? `${foundRacer.firstName} ${foundRacer.lastName.charAt(0)} - ${foundRacer.club}`
              : "Unknown Racer",
            lane: assignment.lane,
          };
        });

        return {
          heatName: `Round ${populatedHeat.round} - Heat ${index + 1}`,
          round: populatedHeat.round,
          _id: populatedHeat._id,
          laneInfo,
          racers: populatedHeat.racers.map(
            (r) => `${r.firstName} ${r.lastName.charAt(0)} - ${r.club}`
          ),
          results: populatedHeat.results,
          grandPrix: populatedHeat.grandPrix,
        };
      })
    );

    res.status(201).json({
      message: "Heats generated successfully",
      heats: formattedHeats,
    });
  } catch (error) {
    console.error("Error generating heats:", error);
    res.status(500).json({ message: "Error generating heats", error });
  }
});

/**
 * PUT: Update a heat (manual adjustments if needed)
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedHeat = await Heat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedHeat) {
      return res.status(404).json({ message: "Heat not found" });
    }
    res
      .status(200)
      .json({ message: "Heat updated successfully", heat: updatedHeat });
  } catch (error) {
    console.error("Error updating heat:", error);
    res.status(500).json({ message: "Error updating heat", error });
  }
});

/**
 * POST: Score a heat
 * Example: { heatId, results: [ { racerId, placement }, ... ] }
 */
router.post("/score", async (req, res) => {
  try {
    const { heatId, results } = req.body;

    if (!heatId || !results || !Array.isArray(results)) {
      return res
        .status(400)
        .json({ message: "heatId and results array are required" });
    }

    const heat = await Heat.findById(heatId);
    if (!heat) {
      return res.status(404).json({ message: "Heat not found" });
    }

    // Update results with the raw racer id
    heat.results = results.map((result) => ({
      racer: result.racerId,
      placement: result.placement,
    }));
    await heat.save();

    // Award points
    const placementPoints = { 1: 4, 2: 3, 3: 2, 4: 1 };
    for (const result of results) {
      const pointsAwarded = placementPoints[result.placement] || 0;
      await Racer.findByIdAndUpdate(result.racerId, {
        $inc: { points: pointsAwarded },
      });
    }

    res.status(200).json({ message: "Heat scored successfully", heat });
  } catch (error) {
    console.error("Error scoring heat:", error);
    res.status(500).json({ message: "Error scoring heat", error });
  }
});

module.exports = router;
