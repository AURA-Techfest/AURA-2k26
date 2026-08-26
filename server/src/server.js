import "./config/env.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import registrationRouter from "./routes/registration.routes.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AURA backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy",
  });
});

// Routes
app.use("/api/registrations", registrationRouter);

connectDB();

app.listen(PORT, () => {
  console.log(`AURA backend running on http://localhost:${PORT}`);
});