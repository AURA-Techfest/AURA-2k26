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
  adminDeletePodiumPrize,
  adminResetVotingData,
  adminListPrizes,
  adminUpdateVotingSession,
  adminListVoters,
  adminCloseSession,
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

// Admin: list voters (spectators / volunteers) registered for Audience Choice voting
router.get("/voters", requireAdmin, adminListVoters);

// Admin: close an Audience Choice voting session manually
router.post("/sessions/:id/close", requireAdmin, adminCloseSession);

// Admin: save/update the duration of the active voting session
router.patch("/sessions/:id", requireAdmin, adminUpdateVotingSession);

// Admin: list all recorded prizes (podium 1st/2nd/3rd + Audience Choice)
router.get("/prizes", requireAdmin, adminListPrizes);

// Admin: record Audience Choice winner and close session
router.post("/sessions/:id/winner", requireAdmin, adminRecordAudienceChoiceWinner);

// Admin: record podium prizes (1st / 2nd / 3rd) decided on spot
router.post("/prizes", requireAdmin, adminRecordPodiumPrizes);

// Admin: delete podium prize record (cleanup / corrections)
router.delete("/prizes/:registrationId/:prizeType", requireAdmin, adminDeletePodiumPrize);

// Admin: reset all voting data (cleanup before the real event)
router.post("/reset", requireAdmin, adminResetVotingData);

export default router;
