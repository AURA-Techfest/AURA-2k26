import VotingSession from "../models/VotingSession.js";
import AudienceVote from "../models/AudienceVote.js";
import Prize from "../models/Prize.js";
import Registration from "../models/Registration.js";
import Voter from "../models/Voter.js";

export const MIN_VOTING_MINUTES = 10;
export const MAX_VOTING_MINUTES = 20;
const TOP_PRIZE_TYPES = ["first", "second", "third"];

const getEligibleCandidates = async () => {
  // Teams that have already won a top prize (1st / 2nd / 3rd) are not eligible
  // for the Audience Choice vote.
  const winners = await Prize.find({
    prizeType: { $in: TOP_PRIZE_TYPES },
  }).select("registrationId");

  const excludedIds = winners
    .map((w) => String(w.registrationId || "").trim().toUpperCase())
    .filter(Boolean);

  const filter = excludedIds.length
    ? { registrationId: { $nin: excludedIds } }
    : {};

  const candidates = await Registration.find(filter)
    .select("registrationId teamName teamSize projectTitle")
    .sort({ teamName: 1 })
    .lean();

  return candidates;
};

export const normalizeVoterKey = (registrationId, participantName) =>
  `${String(registrationId || "")
    .trim()
    .toUpperCase()}::${String(participantName || "")
    .trim()
    .toLowerCase()}`;

const getTimeRemainingSeconds = (session) => {
  if (!session) return 0;
  const endsAtMs = new Date(session.endsAt).getTime();
  if (isNaN(endsAtMs)) return 0;
  return Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
};

const closeSessionIfExpired = async (session) => {
  if (
    session &&
    session.status === "active" &&
    new Date(session.endsAt).getTime() < Date.now()
  ) {
    session.status = "closed";
    session.closedAt = new Date();
    await session.save();
    return { ...session.toObject(), autoClosed: true };
  }
  return session;
};

export const buildTally = (votes = []) => {
  const tallyMap = new Map();

  for (const vote of votes) {
    const key = vote.candidateRegistrationId;
    if (!tallyMap.has(key)) {
      tallyMap.set(key, {
        candidateRegistrationId: key,
        candidateTeamName: vote.candidateTeamName,
        votes: 0,
      });
    }
    tallyMap.get(key).votes += 1;
  }

  const results = Array.from(tallyMap.values())
    .map((entry) => ({
      ...entry,
      percentage: votes.length
        ? Number(((entry.votes / votes.length) * 100).toFixed(2))
        : 0,
    }))
    .sort((a, b) => b.votes - a.votes);

  const leader = results.length
    ? results.reduce((best, current) =>
        current.votes > best.votes ? current : best,
      )
    : null;

  return {
    results,
    leader,
    winner: leader && leader.votes > 0 ? leader : null,
    votesCast: votes.length,
  };
};

/**
 * Admin: Start a new Audience Choice voting session.
 * Duration must be an integer between 10 and 20 minutes (decided on spot).
 */
export const adminStartVotingSession = async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_VOTING_KEY;

    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        message: "Admin voting key is not configured on the server.",
      });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. A valid admin key is required.",
      });
    }

    const durationMinutes = Number(req.body?.durationMinutes);
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < MIN_VOTING_MINUTES ||
      durationMinutes > MAX_VOTING_MINUTES
    ) {
      return res.status(400).json({
        success: false,
        message: `durationMinutes must be an integer between ${MIN_VOTING_MINUTES} and ${MAX_VOTING_MINUTES}.`,
      });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // Close any previously active session
    await VotingSession.updateMany(
      { status: "active" },
      { status: "closed", closedAt: now },
    );

    const session = await VotingSession.create({
      status: "active",
      durationMinutes,
      startsAt: now,
      endsAt,
      createdBy: "admin",
    });

    const candidates = await getEligibleCandidates();

    return res.status(201).json({
      success: true,
      message: "Audience Choice voting session started.",
      session,
      durationMinutes,
      candidates,
      timeRemainingSeconds: durationMinutes * 60,
    });
  } catch (error) {
    console.error("Error in adminStartVotingSession:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start Audience Choice voting session.",
      error: error.message,
    });
  }
};

/**
 * Public: Get the current voting session status, candidates and live tally.
 */
export const getCurrentVotingSession = async (req, res) => {
  try {
    const session = await VotingSession.findOne({
      status: "active",
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(200).json({
        success: true,
        session: null,
        message: "No active Audience Choice voting session.",
      });
    }

    const activeSession = await closeSessionIfExpired(session);
    const candidates = await getEligibleCandidates();
    const votes = await AudienceVote.find({
      sessionId: activeSession._id,
    });

    const tally = buildTally(votes);

    return res.status(200).json({
      success: true,
      session: activeSession,
      timeRemainingSeconds: getTimeRemainingSeconds(activeSession),
      candidates,
      votesCast: tally.votesCast,
      results: tally.results,
      leader: tally.leader,
      winner: tally.winner,
    });
  } catch (error) {
    console.error("Error in getCurrentVotingSession:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current voting session.",
      error: error.message,
    });
  }
};

/**
 * Public: Register an on-the-spot voter (spectator / volunteer) for Audience Choice voting.
 * Used when participants / volunteers / spectators do not have a registration record.
 */
export const createVoter = async (req, res) => {
  try {
    const { name, phone, email, type, registrationId } = req.body || {};
    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Voter name is required.",
      });
    }

    const crypto = await import("crypto");
    const voterId = `AURA-V-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Deduplicate on-spot voters by contact (phone or email) so the same
    // person cannot register multiple voter identities (e.g. fake/different names).
    const filter = {};
    if (phone) {
      filter.phone = String(phone).trim();
    } else if (email) {
      filter.email = String(email).trim().toLowerCase();
    }

    let voter;
    if (Object.keys(filter).length > 0) {
      voter = await Voter.findOne({ ...filter });
    }

    if (voter) {
      return res.status(200).json({
        success: true,
        message: "Voter already registered.",
        voter,
      });
    }

    voter = await Voter.create({
      voterId,
      name: trimmedName,
      phone: phone ? String(phone).trim() : undefined,
      email: email ? String(email).trim().toLowerCase() : undefined,
      type: type || "spectator",
      registrationId: registrationId
        ? String(registrationId).trim().toUpperCase()
        : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Voter registered successfully for on-spot voting.",
      voter,
    });
  } catch (error) {
    console.error("Error in createVoter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register voter for on-spot voting.",
      error: error.message,
    });
  }
};

/**
 * Admin: List voters (spectators / volunteers) registered for Audience Choice voting.
 */
export const adminListVoters = async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_VOTING_KEY;

    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        message: "Admin voting key is not configured on the server.",
      });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. A valid admin key is required.",
      });
    }

    const { type, search } = req.query;
    const query = {};
    if (type) query.type = type;

    const voters = await Voter.find(query).sort({ createdAt: -1 });

    if (search) {
      const regex = new RegExp(String(search).trim(), "i");
      voters.data = voters.data.filter(
        (v) =>
          v.name.toLowerCase().includes(String(search).trim().toLowerCase()) ||
          v.voterId.toLowerCase().includes(String(search).trim().toLowerCase()) ||
          (v.phone || "").toLowerCase().includes(String(search).trim().toLowerCase())
      );
    }

    return res.status(200).json({
      success: true,
      count: voters.data.length,
      voters: voters.data,
    });
  } catch (error) {
    console.error("Error in adminListVoters:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list voters.",
      error: error.message,
    });
  }
};

/**
 * Admin: Close an Audience Choice voting session manually.
 */
export const adminCloseSession = async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_VOTING_KEY;

    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        message: "Admin voting key is not configured on the server.",
      });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. A valid admin key is required.",
      });
    }

    const { id } = req.params;
    const session = await VotingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Voting session not found.",
      });
    }

    session.status = "closed";
    session.closedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Voting session closed manually.",
      session,
    });
  } catch (error) {
    console.error("Error in adminCloseSession:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to close voting session.",
      error: error.message,
    });
  }
};

/**
 * Public: Cast a single Audience Choice vote.
 * Rules:
 * - Session must be active and within the voting window.
 * - Voter (participant / on-spot voter) can cast only one vote per session.
 * - Candidate must not have already won a top prize (1st/2nd/3rd).
 */
export const castAudienceVote = async (req, res) => {
  try {
    const { id } = req.params;
    const { voterId, registrationId, participantName, candidateRegistrationId } =
      req.body || {};

    const trimmedVoterId = String(voterId || "").trim();
    const voterContext = {};

    if (trimmedVoterId) {
      // Voter mode: volunteer / spectator registered on spot
      const voter = await Voter.findOne({ voterId: trimmedVoterId });
      if (!voter) {
        return res.status(404).json({
          success: false,
          message:
            "Voter not found. Please complete on-spot registration before voting.",
        });
      }
      voterContext.voterKey = voter.voterId;
      voterContext.registrationId = voter.registrationId || voter.voterId;
      voterContext.participantName = voter.name;
      voterContext.teamName = voter.registrationId || voter.name;
    } else {
      if (!registrationId || !participantName || !candidateRegistrationId) {
        return res.status(400).json({
          success: false,
          message:
            "registrationId, participantName and candidateRegistrationId are required.",
        });
      }
      voterContext.voterKey = normalizeVoterKey(registrationId, participantName);
      voterContext.registrationId = String(registrationId || "").trim().toUpperCase();
      voterContext.participantName = String(participantName || "").trim();
      voterContext.teamName = String(req.body?.teamName || "").trim();
    }

    const session = await VotingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Voting session not found.",
      });
    }

    const activeSession = await closeSessionIfExpired(session);
    if (activeSession.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Voting is not active for this session.",
      });
    }

    const endsAtMs = new Date(activeSession.endsAt).getTime();
    if (endsAtMs < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "The Audience Choice voting window has ended.",
      });
    }

    // Candidate eligibility: exclude teams that already won 1st/2nd/3rd
    const candidate = await Registration.findOne({
      registrationId: String(candidateRegistrationId || "")
        .trim()
        .toUpperCase(),
    }).select("registrationId teamName teamSize projectTitle");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "The selected candidate team was not found.",
      });
    }

    const winnerRecord = await Prize.findOne({
      registrationId: candidate.registrationId,
      prizeType: { $in: TOP_PRIZE_TYPES },
    });

    if (winnerRecord) {
      return res.status(400).json({
        success: false,
        message:
          "This team has already won a top prize and is not eligible for the Audience Choice vote.",
      });
    }

    // One vote per participant / voter per session
    const existingVote = await AudienceVote.findOne({
      sessionId: activeSession._id,
      voterKey: voterContext.voterKey,
    });

    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: "This participant has already cast a vote in this session.",
      });
    }

    const vote = await AudienceVote.create({
      sessionId: activeSession._id,
      voterKey: voterContext.voterKey,
      registrationId: String(voterContext.registrationId || "").trim().toUpperCase(),
      participantName: String(voterContext.participantName || "").trim(),
      teamName: String(voterContext.teamName || candidate.teamName || "").trim(),
      candidateRegistrationId: candidate.registrationId,
      candidateTeamName: candidate.teamName,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Vote cast successfully!",
      receipt: {
        voteId: vote._id,
        voterKey: vote.voterKey,
        candidateRegistrationId: vote.candidateRegistrationId,
        candidateTeamName: vote.candidateTeamName,
        createdAt: vote.createdAt,
      },
      vote,
    });
  } catch (error) {
    console.error("Error in castAudienceVote:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cast Audience Choice vote.",
      error: error.message,
    });
  }
};

/**
 * Admin: Record podium prizes (1st / 2nd / 3rd) decided on spot.
 * Teams recorded here automatically become ineligible for the Audience Choice vote.
 */
export const adminRecordPodiumPrizes = async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_VOTING_KEY;

    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        message: "Admin voting key is not configured on the server.",
      });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. A valid admin key is required.",
      });
    }

    const { prizes } = req.body || {};

    if (!Array.isArray(prizes) || prizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "A non-empty 'prizes' array is required.",
      });
    }

    const cleanPrizes = prizes
      .map((p) => ({
        registrationId: String(p?.registrationId || "")
          .trim()
          .toUpperCase(),
        teamName: String(p?.teamName || "").trim(),
        prizeType: String(p?.prizeType || "")
          .trim()
          .toLowerCase(),
        rank: Number(p?.rank) || 0,
      }))
      .filter((p) => p.registrationId && p.teamName);

    if (cleanPrizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid prize entry is required.",
      });
    }

    const savedPrizes = [];
    for (const p of cleanPrizes) {
      const saved = await Prize.findOneAndUpdate(
        { registrationId: p.registrationId, prizeType: p.prizeType },
        {
          registrationId: p.registrationId,
          teamName: p.teamName,
          prizeType: p.prizeType,
          rank: p.rank,
          awardedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      savedPrizes.push(saved);
    }

    return res.status(201).json({
      success: true,
      message: "Podium prizes recorded successfully.",
      prizes: savedPrizes,
    });
  } catch (error) {
    console.error("Error in adminRecordPodiumPrizes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record podium prizes.",
      error: error.message,
    });
  }
};

/**
 * Admin: Delete a podium prize record (cleanup / corrections).
 */
export const adminDeletePodiumPrize = async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_VOTING_KEY;

    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        message: "Admin voting key is not configured on the server.",
      });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. A valid admin key is required.",
      });
    }

    const { registrationId, prizeType } = req.params;

    if (!registrationId || !prizeType) {
      return res.status(400).json({
        success: false,
        message: "registrationId and prizeType are required.",
      });
    }

    const deleted = await Prize.findOneAndDelete({
      registrationId: String(registrationId || "").trim().toUpperCase(),
      prizeType: String(prizeType || "").trim().toLowerCase(),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Prize record not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Podium prize deleted successfully.",
      prize: deleted,
    });
  } catch (error) {
    console.error("Error in adminDeletePodiumPrize:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete podium prize.",
      error: error.message,
    });
  }
};

/**
 * Admin: Record the Audience Choice winner for a voting session and close it.
 */
export const adminRecordAudienceChoiceWinner = async (req, res) => {
  try {
    const adminKey = req.headers["x-admin-key"];
    const expectedKey = process.env.ADMIN_VOTING_KEY;

    if (!expectedKey) {
      return res.status(500).json({
        success: false,
        message: "Admin voting key is not configured on the server.",
      });
    }

    if (!adminKey || adminKey !== expectedKey) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. A valid admin key is required.",
      });
    }

    const { id } = req.params;
    const { candidateRegistrationId, candidateTeamName, participantName } =
      req.body || {};

    const session = await VotingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Voting session not found.",
      });
    }

    const activeSession = await closeSessionIfExpired(session);

    if (activeSession.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Voting session is not active. Start a new session to re-open voting.",
      });
    }

    const candidate = await Registration.findOne({
      registrationId: String(candidateRegistrationId || "")
        .trim()
        .toUpperCase(),
    }).select("registrationId teamName");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "The selected candidate team was not found.",
      });
    }

    // Record the Audience Choice win
    const prize = await Prize.findOneAndUpdate(
      { registrationId: candidate.registrationId },
      {
        registrationId: candidate.registrationId,
        teamName: candidate.teamName,
        prizeType: "audience_choice",
        rank: 0,
        awardedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // Close the session after winner declaration
    activeSession.status = "closed";
    activeSession.closedAt = new Date();
    await activeSession.save();

    return res.status(200).json({
      success: true,
      message: "Audience Choice winner recorded successfully!",
      prize,
      session: activeSession,
    });
  } catch (error) {
    console.error("Error in adminRecordAudienceChoiceWinner:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record Audience Choice winner.",
      error: error.message,
    });
  }
};

/**
 * Public: Get live results / tally for a voting session.
 */
export const getVotingResults = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await VotingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Voting session not found.",
      });
    }

    const activeSession = await closeSessionIfExpired(session);
    const votes = await AudienceVote.find({
      sessionId: activeSession._id,
    });

    const tally = buildTally(votes);

    return res.status(200).json({
      success: true,
      session: activeSession,
      votesCast: tally.votesCast,
      results: tally.results,
      leader: tally.leader,
      winner: tally.winner,
    });
  } catch (error) {
    console.error("Error in getVotingResults:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch voting results.",
      error: error.message,
    });
  }
};
