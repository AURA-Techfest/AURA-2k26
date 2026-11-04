import express from "express";
import {
  verifyRegistrationCredentials,
  requestOtp,
  verifyOtp,
  getRsvpDetails,
  submitRsvp,
  adminGetRsvps,
  adminVerifyRsvp,
  requireRsvpAuth,
} from "../controllers/rsvp.controller.js";
import { uploadRsvpScreenshot } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public verification endpoints
router.post("/verify", verifyRegistrationCredentials);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

// Authenticated Team Leader endpoints
router.get("/details", requireRsvpAuth, getRsvpDetails);
router.post("/submit", requireRsvpAuth, uploadRsvpScreenshot, submitRsvp);

// Admin review endpoints
router.get("/admin/list", adminGetRsvps);
router.patch("/admin/verify/:id", adminVerifyRsvp);

export default router;
