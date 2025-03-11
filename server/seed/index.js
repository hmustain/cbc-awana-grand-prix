const mongoose = require("mongoose");
require("dotenv").config();

// Skip seeding in production
if (process.env.NODE_ENV === 'production') {
  console.log("Production environment detected. Skipping seeding.");
  process.exit(0);
}

// Import individual seed functions
const seedRacers = require("./seedRacers");
// const seedHeats = require("./seedHeats");
// const seedBrackets = require("./seedBrackets");

async function runSeeds() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding");

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
