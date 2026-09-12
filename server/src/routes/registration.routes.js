import express from "express";
import {
  createRegistration,
  checkEmailOrTeamName,
} from "../controllers/registration.controller.js";
import { uploadRegistrationFiles } from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  uploadRegistrationFiles,
  createRegistration
);

router.get(
  "/check",
  checkEmailOrTeamName
);

export default router;
