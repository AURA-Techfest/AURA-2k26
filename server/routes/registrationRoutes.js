import express from "express";
import Registration from "../models/Registration.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// POST /api/register -> save a new registration with payment screenshot
router.post("/register", upload.single("paymentScreenshot"), async (req, res) => {
  try {
    const { teamName, college, phone, email } = req.body;

    // teamMembers arrives as JSON string from FormData, or as separate fields
    let teamMembers = req.body.teamMembers;
    if (typeof teamMembers === "string") {
      teamMembers = JSON.parse(teamMembers);
    }

    if (!teamName || !college || !phone || !email || !teamMembers) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Payment screenshot is required" });
    }

    const registration = await Registration.create({
      teamName,
      teamMembers,
      college,
      phone,
      email,
      paymentScreenshot: `/uploads/${req.file.filename}`,
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error("Error saving registration:", error.message);
    res.status(500).json({ error: error.message || "Server error" });
  }
});

// GET /api/register -> list all registrations
router.get("/register", async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;