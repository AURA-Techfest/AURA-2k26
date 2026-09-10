import express from "express";
import {
  createRegistration,
  checkEmailOrTeamName,
} from "../controllers/registration.controller.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

router.post(
  "/",
  upload.fields([
    { name: "paymentScreenshot", maxCount: 1 },
    { name: "teamLeaderIdCard", maxCount: 1 },
    { name: "member1IdCard", maxCount: 1 },
    { name: "member2IdCard", maxCount: 1 },
    { name: "member3IdCard", maxCount: 1 },
    { name: "abstractPdf", maxCount: 1 },
  ]),
  createRegistration
);

router.get(
  "/check",
  checkEmailOrTeamName
);

export default router;