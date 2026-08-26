import express from "express";
import {
  createRegistration,
  checkEmailOrTeamName,
} from "../controllers/registration.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.single("paymentScreenshot"),
  createRegistration
);

router.get(
  "/check",
  checkEmailOrTeamName
);

export default router;