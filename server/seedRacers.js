const mongoose = require("mongoose");
require("dotenv").config();
const Racer = require("./models/Racer");

// Sample racer data with clubs based on your list
const sampleRacers = [
  // Sparks Club
  { firstName: "Barrett", lastName: "Mustain", club: "Sparks" },
  { firstName: "Romy", lastName: "Mustain", club: "Sparks" },
  { firstName: "Kheri", lastName: "Bunn", club: "Sparks" },
  { firstName: "Maddox", lastName: "Starks", club: "Sparks" },
  { firstName: "Pheonix", lastName: "Starks", club: "Sparks" },
  { firstName: "Zander", lastName: "Forte", club: "Sparks" },
  { firstName: "Mara", lastName: "Green", club: "Sparks" },
  
  // T&T
  { firstName: "Aislyn", lastName: "Ferrell", club: "T&T" },
  { firstName: "Hadleigh", lastName: "Bunn", club: "T&T" },
  
  // Cubbies
  { firstName: "Rhett", lastName: "Robbins", club: "Cubbies" },
  { firstName: "Lane", lastName: "Hicks", club: "Cubbies" },
  { firstName: "Haven", lastName: "Ferrell", club: "Cubbies" },
  { firstName: "Brooks", lastName: "Taylor", club: "Cubbies" },
  
  // Adults
  { firstName: "Hunter", lastName: "Mustain", club: "Adults" },
  { firstName: "Amy", lastName: "Mustain", club: "Adults" },
  { firstName: "Julie", lastName: "Ferrell", club: "Adults" },
  { firstName: "Lindsay", lastName: "Hicks", club: "Adults" },
  { firstName: "Clark", lastName: "Hicks", club: "Adults" },
  { firstName: "Megan", lastName: "Mcmahen", club: "Adults" },
  { firstName: "Mandy", lastName: "Gibson", club: "Adults" },
  { firstName: "Samantha", lastName: "Gibson", club: "Adults" },
  { firstName: "Lori", lastName: "Silvey", club: "Adults" }
];

async function seedRacers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing racers
    await Racer.deleteMany({});
    console.log("✅ Cleared existing racers");

    // Insert sample racers
    const createdRacers = await Racer.insertMany(sampleRacers);
    console.log("✅ Seeded racers:", createdRacers);
    
    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error seeding racers:", error);
    mongoose.disconnect();
  }
}

seedRacers();
