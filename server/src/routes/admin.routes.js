import express from "express";
import {
  loginAdmin,
  verifySession,
  getAllRegistrations,
  getRegistrationById,
  getDashboardStats,
  exportRegistrationsCsv,
} from "../controllers/admin.controller.js";
import { verifyAdminToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public Admin Auth Route
router.post("/login", loginAdmin);

// Protected Admin Routes
router.get("/verify", verifyAdminToken, verifySession);
router.get("/stats", verifyAdminToken, getDashboardStats);
router.get("/registrations", verifyAdminToken, getAllRegistrations);
router.get("/registrations/:id", verifyAdminToken, getRegistrationById);
router.get("/export/csv", verifyAdminToken, exportRegistrationsCsv);

export default router;
