import express from "express";
import { requireAdmin } from "../middleware/adminAuth.middleware.js";
import {
  adminStartVotingSession,
  getCurrentVotingSession,
  castAudienceVote,
  getVotingResults,
  adminRecordAudienceChoiceWinner,
} from "../controllers/voting.controller.js";

const router = express.Router();

// Admin: start Audience Choice voting session (duration 10-20 min)
router.post("/sessions", requireAdmin, adminStartVotingSession);

// Public: current session status, candidates and tally
router.get("/sessions/current", getCurrentVotingSession);

// Public: cast a vote
router.post("/sessions/:id/votes", castAudienceVote);

// Public: voting results / tally
router.get("/sessions/:id/results", getVotingResults);

// Admin: record Audience Choice winner and close session
router.post("/sessions/:id/winner", requireAdmin, adminRecordAudienceChoiceWinner);

export default router;
