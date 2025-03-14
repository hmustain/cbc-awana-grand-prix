const express = require("express");
const mongoose = require("mongoose");
const Racer = require("../models/Racer");
const Heat = require("../models/Heat");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Aggregate from Heat: unwind the "racers" array to count how many heats each racer appears in
    const heatsCount = await Heat.aggregate([
      { $unwind: "$racers" },
      { $group: { _id: "$racers", heatsRan: { $sum: 1 } } }
    ]);

    // Create a map for quick lookup of heats count per racer
    const heatsMap = {};
    heatsCount.forEach(doc => {
      heatsMap[doc._id.toString()] = doc.heatsRan;
    });

    // Get all racers (or you could filter by a GrandPrix if needed)
    const racers = await Racer.find();

    // Combine each racer's stored points with the count of heats they've participated in
    const standings = racers.map(racer => {
      const racerId = racer._id.toString();
      const heatsRan = heatsMap[racerId] || 0;
      const totalPoints = racer.points || 0;
      const averagePoints = heatsRan > 0 ? totalPoints / heatsRan : 0;
      return {
        racerId,
        name: `${racer.firstName} ${racer.lastName.charAt(0)}`, // e.g., "John D"
        club: racer.club,
        totalPoints,
        heatsRan,
        averagePoints
      };
    });

    // Sort standings by totalPoints descending, then by averagePoints descending
    standings.sort((a, b) =>
      b.totalPoints - a.totalPoints || b.averagePoints - a.averagePoints
    );

    res.status(200).json({
      message: "Standings retrieved successfully",
      standings
    });
  } catch (error) {
    console.error("Error retrieving standings:", error);
    res.status(500).json({ message: "Error retrieving standings", error });
  }
});

module.exports = router;
