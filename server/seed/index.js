const mongoose = require("mongoose");
require("dotenv").config();

// Skip seeding in production
if (process.env.NODE_ENV === "production") {
  console.log("Production environment detected. Skipping seeding.");
  process.exit(0);
}

// Import individual seed functions
const seedGrandPrix = require("./seedGrandPrix");
const seedRacers = require("./seedRacers");
const seedHeats = require("./seedHeats");
const seedRandomScoring = require("./seedRandomScoring");
// const seedBrackets = require("./seedBrackets");

async function runSeeds() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding");
    
    // Seed a single Grand Prix event
    const grandPrixId = await seedGrandPrix();
    
    // Seed racers and associate them with the Grand Prix
    await seedRacers(grandPrixId);
    
    // Generate heats for racers from the seeded event
    await seedHeats(grandPrixId);
    
    // Apply random scoring to the generated heats
    await seedRandomScoring();
    
    console.log("Seeding complete");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    mongoose.disconnect();
  }
}

runSeeds();
