import express from "express";
import { requireAdmin } from "../middleware/adminAuth.middleware.js";
import {
  adminStartVotingSession,
  getCurrentVotingSession,
  createVoter,
  castAudienceVote,
  getVotingResults,
  adminRecordAudienceChoiceWinner,
  adminRecordPodiumPrizes,
} from "../controllers/voting.controller.js";

const router = express.Router();

// Admin: start Audience Choice voting session (duration 10-20 min)
router.post("/sessions", requireAdmin, adminStartVotingSession);

// Public: current session status, candidates and tally
router.get("/sessions/current", getCurrentVotingSession);

// Public: register an on-the-spot voter (spectator / volunteer) for Audience Choice voting
router.post("/voters", createVoter);

// Public: cast a vote
router.post("/sessions/:id/votes", castAudienceVote);

// Public: voting results / tally
router.get("/sessions/:id/results", getVotingResults);

// Admin: record Audience Choice winner and close session
router.post("/sessions/:id/winner", requireAdmin, adminRecordAudienceChoiceWinner);

// Admin: record podium prizes (1st / 2nd / 3rd) decided on spot
router.post("/prizes", requireAdmin, adminRecordPodiumPrizes);

export default router;
