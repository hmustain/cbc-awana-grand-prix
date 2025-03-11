const Racer = require("../models/Racer");

const sampleRacers = [
  { firstName: "Barrett", lastName: "Mustain", club: "Sparks" },
  { firstName: "Romy", lastName: "Mustain", club: "Sparks" },
  { firstName: "Kheri", lastName: "Bunn", club: "Sparks" },
  { firstName: "Maddox", lastName: "Starks", club: "Sparks" },
  { firstName: "Pheonix", lastName: "Starks", club: "Sparks" },
  { firstName: "Zander", lastName: "Forte", club: "Sparks" },
  { firstName: "Mara", lastName: "Green", club: "Sparks" },
  { firstName: "Aislyn", lastName: "Ferrell", club: "T&T" },
  { firstName: "Hadleigh", lastName: "Bunn", club: "T&T" },
  { firstName: "Rhett", lastName: "Robbins", club: "Cubbies" },
  { firstName: "Lane", lastName: "Hicks", club: "Cubbies" },
  { firstName: "Haven", lastName: "Ferrell", club: "Cubbies" },
  { firstName: "Brooks", lastName: "Taylor", club: "Cubbies" },
  { firstName: "Hunter", lastName: "Mustain", club: "Adults" },
  { firstName: "Amy", lastName: "Mustain", club: "Adults" },
  { firstName: "Julie", lastName: "Ferrell", club: "Adults" },
  { firstName: "Lindsay", lastName: "Hicks", club: "Adults" },
  { firstName: "Clark", lastName: "Hicks", club: "Adults" },
  { firstName: "Megan", lastName: "McMahon", club: "Adults" },
  { firstName: "Mandy", lastName: "Gibson", club: "Adults" },
  { firstName: "Samantha", lastName: "Gibson", club: "Adults" },
  { firstName: "Lori", lastName: "Silvey", club: "Adults" }
];

async function seedRacers() {
  // Clear existing racers
  await Racer.deleteMany({});
  console.log("Cleared existing racers");

  // Insert sample racers
  const createdRacers = await Racer.insertMany(sampleRacers);
  console.log("Seeded racers:", createdRacers.length);
}

module.exports = seedRacers;
