const express = require("express");
const GrandPrix = require("../models/GrandPrix");

const router = express.Router();

// Create a new Grand Prix event
router.post("/", async (req, res) => {
  try {
    const { name, description, date, location } = req.body;
    const newEvent = new GrandPrix({ name, description, date, location });
    await newEvent.save();
    res.status(201).json({ message: "Grand Prix event created", grandPrix: newEvent });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Error creating event", error });
  }
});

// Get all Grand Prix events
router.get("/", async (req, res) => {
  try {
    // Populate the virtual "racersList" field
    const events = await GrandPrix.find()
      .sort({ createdAt: -1 })
      .populate("racersList", "firstName lastName club");

    res.status(200).json({ message: "Events retrieved", grandPrix: events });
  } catch (error) {
    console.error("Error retrieving events:", error);
    res.status(500).json({ message: "Error retrieving events", error });
  }
});

// Get a specific Grand Prix event with populated fields
router.get("/:id", async (req, res) => {
  try {
    const event = await GrandPrix.findById(req.params.id)
      .populate("racersList", "firstName lastName club") // Updated to populate virtual field
      .populate("heats")
      .populate("bracket");
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event retrieved", grandPrix: event });
  } catch (error) {
    console.error("Error retrieving event:", error);
    res.status(500).json({ message: "Error retrieving event", error });
  }
});

// Update a Grand Prix event
router.put("/:id", async (req, res) => {
  try {
    const updatedEvent = await GrandPrix.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event updated", grandPrix: updatedEvent });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ message: "Error updating event", error });
  }
});

// Delete a Grand Prix event
router.delete("/:id", async (req, res) => {
  try {
    const deletedEvent = await GrandPrix.findByIdAndDelete(req.params.id);
    if (!deletedEvent) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(200).json({ message: "Event deleted", grandPrix: deletedEvent });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ message: "Error deleting event", error });
  }
});

module.exports = router;
