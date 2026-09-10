import "./config/env.js";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import registrationRouter from "./routes/registration.routes.js";
import sponsorshipRouter from "./routes/sponsorship.routes.js";

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',           // local dev, always allowed
  process.env.FRONTEND_URL,          // deployed frontend, from env
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));

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
app.use("/api/sponsorships", sponsorshipRouter);

connectDB();

app.listen(PORT, () => {
  console.log(`AURA backend running on http://localhost:${PORT}`);
});

