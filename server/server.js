const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const racerRoutes = require("./routes/racerRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// Connect API routes
app.use("/api/racers", racerRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected...");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
