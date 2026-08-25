import express from "express";
import {
  createRegistration,
} from "../controllers/registration.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.single("paymentScreenshot"),
  createRegistration
);

export default router;