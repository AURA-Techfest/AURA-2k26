import VotingSession from "../models/VotingSession.js";
import AudienceVote from "../models/AudienceVote.js";
import Prize from "../models/Prize.js";
import Registration from "../models/Registration.js";
import Voter from "../models/Voter.js";

import {
  voterRegisterLimiter,
  voteCastLimiter,
} from "../middleware/rateLimiter.middleware.js";

// Client IP behind Render's proxy. x-forwarded-for is a comma list: entries
// on the LEFT are client-supplied and spoofable, while the RIGHTMOST entry
// is appended by the nearest trusted proxy — so take the last one. (Taking
// the first would let anyone rotate fake IPs straight past the rate limits
// and the one-vote-per-IP cap.) Falls back to the socket address.
export const clientIpOf = (req) => {
  const hops = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.length
    ? hops[hops.length - 1]
    : req.socket?.remoteAddress || "unknown";
};

// Votes allowed per IP per voting session (env VOTE_IP_SESSION_MAX).
// Default 1 — one network, one vote. "0" disables the cap; invalid or
// empty values fall back to the default instead of disabling protection.
export const resolveIpVoteCap = (raw) => {
  const source = raw === undefined ? process.env.VOTE_IP_SESSION_MAX : raw;
  if (source === undefined || source === null || String(source).trim() === "") {
    return 1;
  }
  const n = Number(source);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1;
};

// Requests carrying the correct admin key come from the trusted desk UI
// (Quick-Issue Desk) and may look voters up by phone alone.
const isTrustedAdmin = (req) => {
  const expectedKey = process.env.ADMIN_VOTING_KEY;
  const providedKey = req.headers["x-admin-key"];
  return Boolean(expectedKey && providedKey && providedKey === expectedKey);
};

export const MIN_VOTING_MINUTES = 10;
export const MAX_VOTING_MINUTES = 20;
const TOP_PRIZE_TYPES = ["first", "second", "third"];

const getEligibleCandidates = async () => {
  // The ballot = teams flagged as finalists (admin panel), EXCLUDING any
  // team that already holds a top prize (1st / 2nd / 3rd) — podium and
  // Audience Choice are mutually exclusive.
  const winners = await Prize.find({
    prizeType: { $in: TOP_PRIZE_TYPES },
  }).select("registrationId");

  const excludedIds = winners
    .map((w) => String(w.registrationId || "").trim().toUpperCase())
    .filter(Boolean);

  const filter = { isFinalist: true };
  if (excludedIds.length) {
    filter.registrationId = { $nin: excludedIds };
  }

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

// Normalize a person's name for matching against registration records:
// lowercase, strip punctuation, collapse whitespace.
export const normalizePersonName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/['’]s\b/g, "") // possessive: "Rahul's" -> "rahul"
    .replace(/[''`´]/g, "") // remaining apostrophes: "O'Brien" -> "obrien"
    .replace(/[.,\-_/()]/g, " ") // other punctuation acts as a space
    .replace(/\s+/g, " ")
    .trim();

// Same-person check used before handing a Voter ID back over the public
// API: names must be non-empty and equal after normalization
// ("Rahul's Kumar" == "rahul kumar", "Rahul  Kumar" == "rahul kumar").
export const namesMatch = (a, b) => {
  const normalizedA = normalizePersonName(a);
  return normalizedA !== "" && normalizedA === normalizePersonName(b);
};

// Strict Indian mobile normalization — the only phone format the voting
// system accepts. Strips separators and international prefixes (+91, 0091,
// leading 0), then requires exactly 10 digits starting with 6-9. Returns the
// bare digits, or null when the input cannot be a real Indian mobile.
// One canonical form means "098765 43210", "+919876543210" and
// "9876543210" all store the same value AND hit the same dedupe check.
export const normalizeIndianMobile = (raw) => {
  let digits = String(raw ?? "").replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("0091")) digits = digits.slice(4);
  if (/^91\d{10}$/.test(digits)) digits = digits.slice(2);
  else if (/^0\d{10}$/.test(digits)) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

// Pure: decide whether a reCAPTCHA v3 siteverify payload passes. `success`
// must be true; a numeric score below minScore fails; a payload without a
// score (non-v3 response) passes on `success` alone.
export const parseSiteVerifyResponse = (payload, minScore = 0.5) => {
  if (!payload || payload.success !== true) return false;
  if (typeof payload.score === "number" && payload.score < minScore) {
    return false;
  }
  return true;
};

// Server-side reCAPTCHA v3 verification against Google's siteverify endpoint.
// Opt-in: returns true immediately when RECAPTCHA_SECRET_KEY is unset, so
// environments without the key behave exactly as before. Fails closed when
// the token is missing/invalid or Google is unreachable — a client controls
// its own network, so a network error must not become a bypass.
export const verifyRecaptcha = async (token) => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token || typeof token !== "string") return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const payload = await resp.json();
    const configured = Number(process.env.RECAPTCHA_MIN_SCORE);
    const minScore = Number.isFinite(configured) ? configured : 0.5;
    return parseSiteVerifyResponse(payload, minScore);
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
};

/**
 * Check whether a typed participant name belongs to a registered team and
 * return the canonical name from the team's records (so the voter key is
 * built from the recorded spelling, not free-typed text).
 *
 * Registration records hold `teamLeaderName` plus `teamMemberDetails` as
 * newline-separated rows of "Member Name | Institution | Dept | Year | Phone".
 */
export const matchTeamMember = (registration, rawName) => {
  const target = normalizePersonName(rawName);
  if (!target) return null;

  const recordedNames = [];
  const leader = String(registration?.teamLeaderName || "").trim();
  if (leader) recordedNames.push(leader);

  for (const line of String(registration?.teamMemberDetails || "").split(/\r?\n/)) {
    const nameSegment = line.split("|")[0];
    if (nameSegment && nameSegment.trim()) recordedNames.push(nameSegment);
  }

  const targetTokens = target.split(" ").filter(Boolean);

  for (const recorded of recordedNames) {
    const normalized = normalizePersonName(recorded);
    if (!normalized) continue;
    if (normalized === target) return recorded.trim();

    // Tolerate minor variations ("Rahul Sharma" vs "Rahul Sharma Maity") but
    // only when BOTH sides are multi-word, so single first names can't be
    // used to sneak in extra votes from the same team.
    const recordedTokens = normalized.split(" ").filter(Boolean);
    if (
      targetTokens.length >= 2 &&
      recordedTokens.length >= 2 &&
      targetTokens.every((token) => recordedTokens.includes(token))
    ) {
      return recorded.trim();
    }
  }

  return null;
};

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
    // Return the mongoose document itself. Returning a plain object here used
    // to break every caller that later calls .save() on the result — most
    // notably recording the Audience Choice winner after the timer expired
    // threw a 500 instead of succeeding.
    return session;
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
 * Pure helper: pick the Audience Choice winner from a tally's results.
 *
 * Rule (event-day, server-enforced): 1st/2nd/3rd and Audience Choice are
 * MUTUALLY EXCLUSIVE — any team already holding a podium prize is skipped,
 * and the highest-voted remaining team wins. Returns null when every team
 * with votes is podiumed (or there are no votes at all).
 */
export const pickAudienceWinner = (results = [], podiumRegIds = []) => {
  const podiumed = new Set(
    (podiumRegIds || []).map((id) => String(id || "").trim().toUpperCase()),
  );
  return (
    (results || []).find(
      (entry) =>
        Number(entry?.votes) > 0 &&
        !podiumed.has(
          String(entry?.candidateRegistrationId || "").trim().toUpperCase(),
        ),
    ) || null
  );
};

/**
 * Pure helper: is this session still accepting votes right now?
 *
 * "Running" = active AND its window has not ended. An expired-but-not-yet-
 * closed session is NOT running (it is closed lazily by other endpoints)
 * and never blocks.
 */
export const isSessionRunning = (session) =>
  !!session &&
  session.status === "active" &&
  Number(new Date(session.endsAt).getTime()) > Date.now();

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

    // Guard against silently discarding a LIVE tally: votes belong to their
    // session id, so starting a new session while one is running resets the
    // public count. Require an explicit force flag (the admin UI confirms
    // with the operator first). An already-EXPIRED session is not "running"
    // — it is closed below and never blocks.
    const activeNow = await VotingSession.findOne({ status: "active" });
    const stillRunning = isSessionRunning(activeNow);
    if (stillRunning && !req.body?.force) {
      return res.status(400).json({
        success: false,
        message:
          "A voting session is already running. Close it first, or pass force: true to start a new one (the current tally will not carry over).",
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
    // Prefer an active session, but fall back to the most recent session so
    // results stay visible after voting ends and a winner can still be recorded.
    let session = await VotingSession.findOne({ status: "active" }).sort({
      createdAt: -1,
    });
    if (!session) {
      session = await VotingSession.findOne().sort({ createdAt: -1 });
    }

    if (!session) {
      // Still return the eligible teams so the admin podium (1st/2nd/3rd)
      // team search works even before a voting session is started.
      const candidates = await getEligibleCandidates();
      return res.status(200).json({
        success: true,
        session: null,
        timeRemainingSeconds: 0,
        candidates,
        votesCast: 0,
        results: [],
        leader: null,
        winner: null,
        message: "No Audience Choice voting session has been started yet.",
      });
    }

    const activeSession = await closeSessionIfExpired(session);
    const candidates = await getEligibleCandidates();
    const votes = await AudienceVote.find({
      sessionId: activeSession._id,
    });

    const tally = buildTally(votes);

    // Surface the officially recorded Audience Choice winner only once the
    // session has ended (so a previous winner isn't shown for a new session).
    let officialWinner = null;
    if (activeSession.status === "closed") {
      const winnerPrize = await Prize.findOne({ prizeType: "audience_choice" }).sort({
        awardedAt: -1,
      });
      if (winnerPrize) {
        officialWinner = {
          candidateRegistrationId: winnerPrize.registrationId,
          candidateTeamName: winnerPrize.teamName,
          votes:
            tally.results.find(
              (r) => r.candidateRegistrationId === winnerPrize.registrationId,
            )?.votes ?? 0,
        };
      }
    }

    return res.status(200).json({
      success: true,
      session: activeSession,
      timeRemainingSeconds: getTimeRemainingSeconds(activeSession),
      candidates,
      votesCast: tally.votesCast,
      results: tally.results,
      leader: tally.leader,
      winner: officialWinner || tally.winner,
    });
  } catch (error) {
    console.error("Error in getCurrentVotingSession:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current voting session.",
    });
  }
};

/**
 * Public: Register an on-the-spot voter (spectator / volunteer) for Audience Choice voting.
 * Used when participants / volunteers / spectators do not have a registration record.
 */
export const createVoter = async (req, res) => {
  // Rate limit first — cheapest possible rejection, no DB round trip.
  const rate = voterRegisterLimiter.consume(clientIpOf(req));
  if (rate.limited) {
    res.set("Retry-After", String(rate.retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please wait a moment and try again.",
    });
  }

  try {
    // Invisible reCAPTCHA v3 — enforced only when RECAPTCHA_SECRET_KEY is
    // configured on the server (Render env var). The Quick-Issue Desk
    // carries the admin key and is trusted, so desk registrations skip it.
    if (!isTrustedAdmin(req)) {
      const captchaOk = await verifyRecaptcha(req.body?.recaptchaToken);
      if (!captchaOk) {
        return res.status(400).json({
          success: false,
          message: "Verification failed — please try again.",
        });
      }
    }

    const { name, phone, email, type, registrationId } = req.body || {};
    const trimmedName = String(name || "").trim();

    // Validate type explicitly — otherwise the mongoose enum error leaks out
    // as a 500 instead of a clean 400.
    const ALLOWED_VOTER_TYPES = ["participant", "volunteer", "spectator"];
    const normalizedType = String(type || "spectator").trim().toLowerCase();
    if (!ALLOWED_VOTER_TYPES.includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${ALLOWED_VOTER_TYPES.join(", ")}.`,
      });
    }

    // Strict Indian mobile format: separators and +91/0091/0 prefixes
    // collapse to bare 10 digits starting with 6-9. One canonical form for
    // storage AND dedupe — the same person cannot register twice by typing
    // the number in two different formats.
    const normalizedPhone = normalizeIndianMobile(phone);
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (String(phone ?? "").trim() && !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit Indian mobile number (starts with 6-9).",
      });
    }

    // One person = one voter identity. A contact detail is required so the
    // same person can't register unlimited voter IDs with fake names.
    if (!normalizedPhone && !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message:
          "A phone number or email is required so each person registers only once.",
      });
    }

    // Deduplicate on-spot voters by contact (phone or email) so the same
    // person cannot register multiple voter identities (e.g. fake/different names).
    const contactFilters = [];
    if (normalizedPhone) contactFilters.push({ phone: normalizedPhone });
    if (normalizedEmail) contactFilters.push({ email: normalizedEmail });

    const existing =
      contactFilters.length > 0
        ? await Voter.findOne({ $or: contactFilters })
        : null;

    if (existing) {
      // The desk (holding the admin key) may look people up by phone alone —
      // a returning voter's ID is read out / re-issued without retyping.
      if (isTrustedAdmin(req)) {
        return res.status(200).json({
          success: true,
          message: "Voter already registered.",
          voter: existing,
        });
      }

      // Public: the Voter ID is the voting credential, so it is only handed
      // back when the caller also gives the name the voter signed up with.
      // (Otherwise anyone who knows a phone number could steal that vote.)
      if (trimmedName && namesMatch(existing.name, trimmedName)) {
        return res.status(200).json({
          success: true,
          message: "Welcome back! Your Voter ID is ready.",
          voter: existing,
        });
      }

      return res.status(409).json({
        success: false,
        message: trimmedName
          ? "This phone number is already registered with a different name. Enter the same name you signed up with to get your Voter ID."
          : "This phone number is already registered. Enter the name you signed up with to get your Voter ID.",
      });
    }

    // New voter — name required (checked after the lookup so a returning
    // phone is resolved above instead of erroring out).
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Voter name is required.",
      });
    }

    // Length cap keeps oversized payloads out of the DB and the admin list.
    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Voter name must be 100 characters or fewer.",
      });
    }

    const crypto = await import("crypto");
    const voterId = `AURA-V-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    const voter = await Voter.create({
      voterId,
      name: trimmedName,
      phone: normalizedPhone || undefined,
      email: normalizedEmail || undefined,
      type: normalizedType,
      registeredIp: clientIpOf(req),
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
    // Unique partial indexes on phone/email: if two registrations for the
    // same person race past the pre-check, the loser gets a duplicate-key
    // error — resolve it to the existing voter (idempotent 200) instead of
    // a 500 or a second voter identity.
    if (error?.code === 11000) {
      try {
        const body = req.body || {};
        const dupPhone = String(body.phone || "").replace(/[\s\-()]/g, "");
        const dupEmail = String(body.email || "").trim().toLowerCase();
        const dupFilters = [];
        if (dupPhone) dupFilters.push({ phone: dupPhone });
        if (dupEmail) dupFilters.push({ email: dupEmail });

        const existing =
          dupFilters.length > 0 ? await Voter.findOne({ $or: dupFilters }) : null;
        if (existing) {
          return res.status(200).json({
            success: true,
            message: "Voter already registered.",
            voter: existing,
          });
        }
      } catch (dupLookupError) {
        console.error("Duplicate-key recovery failed in createVoter:", dupLookupError);
      }
    }
    console.error("Error in createVoter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register voter for on-spot voting.",
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

    let voters = await Voter.find(query).sort({ createdAt: -1 }).lean();

    if (search) {
      const term = String(search).trim().toLowerCase();
      voters = voters.filter(
        (v) =>
          String(v.name || "").toLowerCase().includes(term) ||
          String(v.voterId || "").toLowerCase().includes(term) ||
          String(v.phone || "").toLowerCase().includes(term)
      );
    }

    return res.status(200).json({
      success: true,
      count: voters.length,
      voters,
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
 * Admin: Delete a voter AND their vote in the current tally.
 * Deleting the vote is essential — without it, the same phone could
 * re-register as a "new" voter and vote a second time.
 */
export const adminDeleteVoter = async (req, res) => {
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

    const normalizedVoterId = String(req.params.voterId || "").trim();
    const voter = await Voter.findOne({ voterId: normalizedVoterId });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: "Voter not found.",
      });
    }

    const deletedVotes = await AudienceVote.deleteMany({
      voterKey: voter.voterId,
    });
    await Voter.deleteOne({ _id: voter._id });

    return res.status(200).json({
      success: true,
      message: `Voter ${voter.voterId} deleted${
        deletedVotes.deletedCount > 0
          ? ` along with ${deletedVotes.deletedCount} vote(s) from the tally.`
          : "."
      }`,
      votesRemoved: deletedVotes.deletedCount,
      voter,
    });
  } catch (error) {
    console.error("Error in adminDeleteVoter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete voter.",
    });
  }
};

/**
 * Admin: purge an IP in one click — delete every voter registered from it
 * AND every vote cast from it (participant votes included, matched on the
 * recorded castIp). This is the event-day response to a "different browser,
 * random number" burst: remove the fake voters and their votes together,
 * which also re-opens the one-vote-per-IP slot for that network.
 */
export const adminPurgeIp = async (req, res) => {
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

    const ip = String(req.params.ip || "").trim();
    if (!ip || ip.length > 45) {
      return res.status(400).json({
        success: false,
        message: "A valid IP address is required.",
      });
    }

    const voters = await Voter.find({ registeredIp: ip })
      .select("voterId")
      .lean();
    const voterKeys = voters.map((v) => v.voterId).filter(Boolean);

    // Remove votes cast FROM this IP (any voter type) plus votes belonging
    // to voters REGISTERED from it (they may have voted from elsewhere).
    const voteFilter = { $or: [{ castIp: ip }] };
    if (voterKeys.length) {
      voteFilter.$or.push({ voterKey: { $in: voterKeys } });
    }

    const deletedVotes = await AudienceVote.deleteMany(voteFilter);
    const deletedVoters = await Voter.deleteMany({ registeredIp: ip });

    return res.status(200).json({
      success: true,
      message: `Removed ${deletedVoters.deletedCount} voter(s) and ${deletedVotes.deletedCount} vote(s) from ${ip}.`,
      removedVoters: deletedVoters.deletedCount,
      removedVotes: deletedVotes.deletedCount,
    });
  } catch (error) {
    console.error("Error in adminPurgeIp:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to purge IP.",
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
  // Rate limit first — cheapest possible rejection, no DB round trip.
  const rate = voteCastLimiter.consume(clientIpOf(req));
  if (rate.limited) {
    res.set("Retry-After", String(rate.retryAfterSeconds));
    return res.status(429).json({
      success: false,
      message: "Too many vote attempts. Please wait a moment and try again.",
    });
  }

  try {
    const { id } = req.params;
    const { voterId, registrationId, participantName, candidateRegistrationId } =
      req.body || {};

    // Session gate BEFORE any identity lookups: when voting is closed this is
    // the cheapest correct rejection (and a bogus voter ID against a closed
    // session must report "not active", not "voter not found").
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

      const normalizedRegId = String(registrationId).trim().toUpperCase();

      // The participant must belong to a real registered team…
      const registration = await Registration.findOne({
        registrationId: normalizedRegId,
      }).select("registrationId teamName teamLeaderName teamMemberDetails");

      if (!registration) {
        return res.status(404).json({
          success: false,
          message:
            "Team Registration ID not found. Double-check the ID from your registration confirmation.",
        });
      }

      // …and the typed name must match a member of THAT team. Without this
      // check anyone could vote unlimited times by inventing names on a real
      // team's registration ID.
      const canonicalName = matchTeamMember(registration, participantName);
      if (!canonicalName) {
        return res.status(403).json({
          success: false,
          message:
            "This name does not match any member of the registered team. Enter your exact name as it appears in the team's registration.",
        });
      }

      voterContext.voterKey = normalizeVoterKey(normalizedRegId, canonicalName);
      voterContext.registrationId = normalizedRegId;
      voterContext.participantName = canonicalName;
      voterContext.teamName = registration.teamName;
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

    // One vote per IP per session — stops the "different browser, random
    // number" burst: only the first vote from a network counts, extra
    // voter IDs from the same connection are rejected here. The trusted
    // desk path (admin key) bypasses the cap. Tuned by env
    // VOTE_IP_SESSION_MAX (default 1; 0 disables).
    const castIp = clientIpOf(req);
    if (!isTrustedAdmin(req)) {
      const ipCap = resolveIpVoteCap();
      if (ipCap > 0) {
        const ipVotes = await AudienceVote.countDocuments({
          sessionId: activeSession._id,
          castIp,
        });
        if (ipVotes >= ipCap) {
          return res.status(409).json({
            success: false,
            message:
              "This network has already voted in this session — one vote per network. If that wasn't you, try again on mobile data.",
          });
        }
      }
    }

    const vote = await AudienceVote.create({
      sessionId: activeSession._id,
      voterKey: voterContext.voterKey,
      registrationId: String(voterContext.registrationId || "").trim().toUpperCase(),
      participantName: String(voterContext.participantName || "").trim(),
      teamName: String(voterContext.teamName || candidate.teamName || "").trim(),
      candidateRegistrationId: candidate.registrationId,
      candidateTeamName: candidate.teamName,
      castIp,
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
    // Unique index { sessionId, voterKey }: if two requests from the same
    // voter race each other, the loser gets a duplicate-key error — report
    // it as "already voted" instead of a 500.
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "This participant has already cast a vote in this session.",
      });
    }
    console.error("Error in castAudienceVote:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cast Audience Choice vote.",
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

    // Event-day ordering lock: podium winners leave the LIVE ballot, so the
    // podium cannot be changed while votes are still being cast. Record
    // podium prizes (1st/2nd/3rd) only after the session closes.
    const liveSession = await VotingSession.findOne({ status: "active" });
    if (isSessionRunning(liveSession)) {
      return res.status(400).json({
        success: false,
        message:
          "Voting is still open — podium prizes (1st/2nd/3rd) can only be recorded after the session closes. Podium winners leave the live ballot, so the podium is locked while votes are being cast.",
      });
    }

    const savedPrizes = [];
    const droppedAudience = [];
    for (const p of cleanPrizes) {
      if (!TOP_PRIZE_TYPES.includes(p.prizeType)) {
        return res.status(400).json({
          success: false,
          message: "prizeType must be one of: first, second, third.",
        });
      }

      // Mutual exclusivity: taking a podium slot means this team can no
      // longer hold Audience Choice — drop that record if present.
      const dropped = await Prize.findOneAndDelete({
        registrationId: p.registrationId,
        prizeType: "audience_choice",
      });
      if (dropped) {
        droppedAudience.push(dropped.teamName || p.teamName);
      }

      // Keep the podium unambiguous:
      // 1) Each rank can be held by only ONE team (assigning replaces the old holder).
      await Prize.deleteMany({
        prizeType: p.prizeType,
        registrationId: { $ne: p.registrationId },
      });
      // 2) A team can hold only ONE podium rank (re-assigning moves them).
      await Prize.deleteMany({
        registrationId: p.registrationId,
        prizeType: { $in: TOP_PRIZE_TYPES, $ne: p.prizeType },
      });

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
      message:
        "Podium prizes recorded successfully." +
        (droppedAudience.length
          ? ` Audience Choice was removed from ${droppedAudience.join(", ")} — record the winner again to award the next eligible team.`
          : ""),
      prizes: savedPrizes,
      allPrizes: await Prize.find().sort({ rank: 1, awardedAt: -1 }).lean(),
    });
  } catch (error) {
    console.error("Error in adminRecordPodiumPrizes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record podium prizes.",
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

    const cleanType = String(prizeType || "").trim().toLowerCase();

    // Removing a podium prize re-adds that team to the LIVE ballot — same
    // mutation hazard as assigning one, so it is locked while votes are
    // being cast. Audience Choice removal is unaffected (that record is
    // only displayed publicly after the session ends).
    if (TOP_PRIZE_TYPES.includes(cleanType)) {
      const liveSession = await VotingSession.findOne({ status: "active" });
      if (isSessionRunning(liveSession)) {
        return res.status(400).json({
          success: false,
          message:
            "Voting is still open — podium prizes cannot be changed while votes are being cast. Close the session first.",
        });
      }
    }

    const deleted = await Prize.findOneAndDelete({
      registrationId: String(registrationId || "").trim().toUpperCase(),
      prizeType: cleanType,
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
 * Admin: List all recorded prizes (podium 1st/2nd/3rd + Audience Choice).
 */
export const adminListPrizes = async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ rank: 1, awardedAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      count: prizes.length,
      prizes,
    });
  } catch (error) {
    console.error("Error in adminListPrizes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prizes.",
      error: error.message,
    });
  }
};

// RFC 4180 CSV cell: quote only when the value contains a comma, quote or
// line break; embedded quotes are doubled.
export const csvCell = (value) => {
  const str = value == null ? "" : String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/**
 * Teams export CSV: team name + topic (project title) ONLY — no member
 * names, phone numbers or emails ever leave the server through this file
 * (privacy requirement).
 */
export const teamsCsv = (rows = []) =>
  ["Team Name,Topic"]
    .concat(
      rows.map((t) => `${csvCell(t?.teamName)},${csvCell(t?.projectTitle)}`),
    )
    .join("\r\n") + "\r\n";

export const adminExportTeamsCsv = async (req, res) => {
  try {
    const teams = await Registration.find()
      .select("teamName projectTitle")
      .sort({ teamName: 1 })
      .lean();

    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set(
      "Content-Disposition",
      'attachment; filename="aura2k26-teams.csv"',
    );
    return res.status(200).send(teamsCsv(teams));
  } catch (error) {
    console.error("Error in adminExportTeamsCsv:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export teams CSV.",
    });
  }
};

// Pure: parse/validate a finalist toggle request. Strict boolean — the
// string "true" or 1 must not silently flag a team.
export const parseFinalistUpdate = (body) => {
  const registrationId = String(body?.registrationId || "").trim().toUpperCase();
  const isFinalist = body?.isFinalist;
  if (!registrationId || typeof isFinalist !== "boolean") return null;
  return { registrationId, isFinalist };
};

// Admin: every registered team with its finalist flag (no personal data) —
// powers the admin "Voting finalists" picker.
export const adminListTeams = async (req, res) => {
  try {
    const teams = await Registration.find()
      .select("registrationId teamName projectTitle isFinalist")
      .sort({ teamName: 1 })
      .lean();
    return res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    console.error("Error in adminListTeams:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teams.",
    });
  }
};

// Admin: add/remove a team from the voting options (finalist shortlist).
export const adminSetFinalist = async (req, res) => {
  try {
    const update = parseFinalistUpdate(req.body);
    if (!update) {
      return res.status(400).json({
        success: false,
        message: "registrationId and a boolean isFinalist flag are required.",
      });
    }

    const team = await Registration.findOneAndUpdate(
      { registrationId: update.registrationId },
      { isFinalist: update.isFinalist },
      { new: true },
    ).select("registrationId teamName isFinalist");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found.",
      });
    }

    const finalists = await Registration.find({ isFinalist: true })
      .select("registrationId teamName")
      .sort({ teamName: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: `${team.teamName} ${update.isFinalist ? "added to" : "removed from"} voting options.`,
      team,
      finalists,
    });
  } catch (error) {
    console.error("Error in adminSetFinalist:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update finalist.",
    });
  }
};

/**
 * Admin: Save/update the duration of the ACTIVE voting session.
 * Duration must be an integer between 10 and 20 minutes.
 * The new window is applied from the moment of saving.
 */
export const adminUpdateVotingSession = async (req, res) => {
  try {
    const { id } = req.params;
    const durationMinutes = Number((req.body || {}).durationMinutes);

    if (!Number.isInteger(durationMinutes) || durationMinutes < MIN_VOTING_MINUTES || durationMinutes > MAX_VOTING_MINUTES) {
      return res.status(400).json({
        success: false,
        message: `Duration must be a whole number between ${MIN_VOTING_MINUTES} and ${MAX_VOTING_MINUTES} minutes.`,
      });
    }

    const session = await VotingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Voting session not found.",
      });
    }

    if (session.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a closed session. Start a new session instead.",
      });
    }

    session.durationMinutes = durationMinutes;
    session.endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    await session.save();

    return res.status(200).json({
      success: true,
      message: `Session saved. Voting now ends in ${durationMinutes} minutes.`,
      session,
      timeRemainingSeconds: getTimeRemainingSeconds(session),
    });
  } catch (error) {
    console.error("Error in adminUpdateVotingSession:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save voting session.",
      error: error.message,
    });
  }
};

/**
 * Admin: Reset all voting data (sessions, votes, voters, prizes).
 * Useful to clear test data before the real event. Registrations are untouched.
 */
export const adminResetVotingData = async (req, res) => {
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

    const [sessions, votes, voters, prizes] = await Promise.all([
      VotingSession.deleteMany({}),
      AudienceVote.deleteMany({}),
      Voter.deleteMany({}),
      Prize.deleteMany({}),
    ]);

    return res.status(200).json({
      success: true,
      message: "All voting data has been reset.",
      deleted: {
        sessions: sessions.deletedCount,
        votes: votes.deletedCount,
        voters: voters.deletedCount,
        prizes: prizes.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error in adminResetVotingData:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset voting data.",
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

    const session = await VotingSession.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Voting session not found.",
      });
    }

    const activeSession = await closeSessionIfExpired(session);

    // Winner may be recorded while active OR after the session has ended.
    if (!["active", "closed"].includes(activeSession.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid voting session state.",
      });
    }

    // The Audience Choice winner is decided ONLY by votes: derive the leader
    // from this session's tally — no manual team selection is possible —
    // then skip any team that already holds a podium prize. 1st/2nd/3rd and
    // Audience Choice are mutually exclusive (server-enforced rule).
    const votes = await AudienceVote.find({ sessionId: activeSession._id });
    const tally = buildTally(votes);

    if (!tally.votesCast) {
      return res.status(400).json({
        success: false,
        message:
          "No votes have been cast yet — the Audience Choice winner is decided by the audience's votes.",
      });
    }

    const podiumPrizes = await Prize.find({
      prizeType: { $in: TOP_PRIZE_TYPES },
    }).select("registrationId teamName");

    const winnerPick = pickAudienceWinner(
      tally.results,
      podiumPrizes.map((p) => p.registrationId),
    );

    if (!winnerPick) {
      return res.status(400).json({
        success: false,
        message:
          "Every team with votes already holds a podium prize (1st/2nd/3rd) — there is no eligible Audience Choice winner.",
      });
    }

    const winnerRegistrationId = winnerPick.candidateRegistrationId;

    // Podium teams the raw vote leader would have been (transparency for the
    // operator: "why didn't the top row win?").
    const skippedTeams = podiumPrizes
      .filter((p) =>
        tally.results.some(
          (r) =>
            Number(r.votes) > 0 &&
            String(r.candidateRegistrationId || "").trim().toUpperCase() ===
              String(p.registrationId || "").trim().toUpperCase(),
        ),
      )
      .map((p) => p.teamName);

    const candidate = await Registration.findOne({
      registrationId: String(winnerRegistrationId).trim().toUpperCase(),
    }).select("registrationId teamName");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "The vote leader's team could not be found in registrations.",
      });
    }

    // Exactly one Audience Choice record may exist — clear any previous one
    // before upserting (re-recording after new votes must never duplicate).
    await Prize.deleteMany({ prizeType: "audience_choice" });

    // Record the Audience Choice win
    const prize = await Prize.findOneAndUpdate(
      { registrationId: candidate.registrationId, prizeType: "audience_choice" },
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
      message:
        `Audience Choice winner recorded: ${candidate.teamName} (${winnerPick.votes} vote${winnerPick.votes === 1 ? "" : "s"}).` +
        (skippedTeams.length
          ? ` Podium teams skipped: ${skippedTeams.join(", ")}.`
          : ""),
      prize,
      session: activeSession,
    });
  } catch (error) {
    console.error("Error in adminRecordAudienceChoiceWinner:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record Audience Choice winner.",
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
    });
  }
};
