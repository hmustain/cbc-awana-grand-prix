const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const racerRoutes = require("./routes/racerRoutes");
const heatRoutes = require("./routes/heatRoutes");
const grandPrixRoutes = require("./routes/grandPrixRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/racers", racerRoutes);
app.use("/api/heats", heatRoutes);
app.use("/api/grandprix", grandPrixRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB Connected...");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1); // Exit process with failure
  });

// Default route for health check
app.get("/", (req, res) => {
  res.send("Awana Grand Prix API is running...");
});
