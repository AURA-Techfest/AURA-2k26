import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import registrationRoutes from "./routes/registrationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
await connectDB();

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "AURA-2K26 API is running",
  });
});

// Registration routes
app.use("/api", registrationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`AURA-2K26 API running on http://localhost:${PORT}`);
});