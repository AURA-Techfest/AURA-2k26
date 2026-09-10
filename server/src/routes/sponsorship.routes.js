import express from "express";
import {
  createSponsorship,
  checkSponsorEmail,
  exportSponsorships,
} from "../controllers/sponsorship.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.single("paymentScreenshot"),
  createSponsorship
);

router.get("/check", checkSponsorEmail);

router.get("/export", exportSponsorships);

export default router;
