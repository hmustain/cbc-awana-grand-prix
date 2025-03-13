const GrandPrix = require("../models/GrandPrix");

async function seedGrandPrix() {
  // Clear existing events (optional)
  await GrandPrix.deleteMany({});
  
  const event = new GrandPrix({
    name: "CBC Awana Grand Prix",
    description: "CBC Awana Grand Prix Event",
    date: new Date(),
    location: "CBC Speedway"
  });
  
  await event.save();
  console.log("Seeded Grand Prix event:", event);
  return event._id; // Return the event ObjectId for association
}

module.exports = seedGrandPrix;
