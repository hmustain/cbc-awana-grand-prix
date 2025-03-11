const mongoose = require("mongoose");
require("dotenv").config();

// Import individual seed functions
const seedRacers = require("./seedRacers");
// const seedHeats = require("./seedHeats"); // Uncomment if available
// const seedBrackets = require("./seedBrackets"); // Uncomment if available

async function runSeeds() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding");

    // Run each seed script in sequence
    await seedRacers();
    // await seedHeats();
    // await seedBrackets();

    console.log("Seeding complete");
  } catch (error) {
    console.error("Error during seeding:", error);
  } finally {
    mongoose.disconnect();
  }
}

runSeeds();
