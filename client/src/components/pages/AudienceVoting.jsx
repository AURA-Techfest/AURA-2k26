import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  KeyRound,
  ArrowLeft,
  Timer,
  Loader2,
  Copy,
  Check,
  Share2,
  ScanLine,
  Medal,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import QrScanner from "../QrScanner";
import { qrDataUrl } from "../ticketQr";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  rawApiUrl && rawApiUrl !== "undefined"
    ? rawApiUrl.replace(/\/$/, "")
    : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

const VOTE_POLL_INTERVAL_MS = 5000;

const formatCountdown = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// Percentage display for the leaderboard: whole numbers stay clean (50),
// fractional ones drop trailing zeros (33.33 -> 33.3).
const formatPct = (pct) => {
  const n = Number(pct) || 0;
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1)));
};

// Pull an AURA voter ID out of a scanned QR payload — either a bare
// AURA-V-XXXXXXXX or our deep link (.../voting?voterId=AURA-V-XXXXXXXX).
const extractVoterId = (raw) => {
  const text = String(raw || "").trim();
  const direct = text.match(/AURA-V-[0-9A-F]{8}/i);
  if (direct) return direct[0].toUpperCase();
  try {
    const url = new URL(text, window.location.origin);
    const param = (url.searchParams.get("voterId") || "").trim();
    const match = param.match(/^AURA-V-[0-9A-F]{8}$/i);
    if (match) return match[0].toUpperCase();
  } catch {
    /* not a URL — bare text we don't recognize */
  }
  return null;
};

const TICKET_STORAGE_KEY = "aura2k26_voter_ticket";

// The voter's ticket survives a refresh or a dead battery so they can
// resume in one tap instead of re-registering (or hunting their QR).
const readSavedTicket = () => {
  try {
    return JSON.parse(localStorage.getItem(TICKET_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

export default function AudienceVoting() {
  const [session, setSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [leader, setLeader] = useState(null);
  const [winner, setWinner] = useState(null);
  const [votesCast, setVotesCast] = useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Voter form state
  const [registrationId, setRegistrationId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [voterId, setVoterId] = useState("");
  const [voterName, setVoterName] = useState("");
  const [voterPhone, setVoterPhone] = useState("");
  const [candidateRegistrationId, setCandidateRegistrationId] =
    useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteSuccessMessage, setVoteSuccessMessage] = useState("");

  // Registration wizard: pick who you are first, then vote.
  //   choose -> register | existing | participant -> vote
  const [step, setStep] = useState("choose");
  const [identityMode, setIdentityMode] = useState(null); // "voter" | "participant"

  // Ticket QR scanner + copy-to-clipboard feedback
  const [scannerOpen, setScannerOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(""); // "id" | "link"

  // Auto-submit registration once name + 10-digit phone are complete:
  // refs always hold the latest input so the pending timer can't fire on
  // stale/edited values, and only one timer may be armed at a time.
  const nameRef = useRef("");
  const phoneRef = useRef("");
  const autoTimerRef = useRef(null);
  nameRef.current = voterName;
  phoneRef.current = voterPhone;

  // Saved ticket (localStorage) + locally generated QR image
  const [savedTicket, setSavedTicket] = useState(null);
  const [ticketQr, setTicketQr] = useState("");



  const fetchCurrent = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/voting/sessions/current`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load voting session.");
      }

      setSession(data.session || null);
      setCandidates(data.candidates || []);
      setVotesCast(data.votesCast || 0);
      setResults(data.results || []);
      setLeader(data.leader || null);
      setWinner(data.winner || null);
      setTimeRemainingSeconds(data.timeRemainingSeconds ?? 0);
      setErrorMessage("");
    } catch (err) {
      console.error("Failed to fetch voting session:", err);
      setErrorMessage(err.message || "Failed to load voting session.");
      // Deliberately NOT clearing the session: one failed poll (Render cold
      // start, venue WiFi blip) must not collapse a live voting page back to
      // "not started". On initial load the session is already null — the
      // status card then offers a Try again button instead.
    } finally {
      setLoading(false);
    }
  }, []);

  // Load voting session on mount
  useEffect(() => {
    fetchCurrent();
  }, [fetchCurrent]);

  // Support deep-linking via QR (?voterId=... for spectators, ?mode=participant&regId=...&name=... for participants)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const voterIdParam = params.get("voterId");
    const modeParam = params.get("mode");
    const regIdParam = params.get("regId");
    const nameParam = params.get("name");

    // Restore a previously saved ticket (deep-link QR wins if both exist).
    const saved = readSavedTicket();
    if (saved) setSavedTicket(saved);

    if (voterIdParam) {
      setVoterId(voterIdParam);
      setIdentityMode("voter");
      setStep("vote");
    } else if (modeParam === "participant" && regIdParam && nameParam) {
      setRegistrationId(regIdParam);
      setParticipantName(nameParam);
      setIdentityMode("participant");
      setStep("vote");
    }
  }, []);

  // Poll live session while active
  useEffect(() => {
    if (!session || session.status !== "active") return;

    const interval = setInterval(() => {
      fetchCurrent();
    }, VOTE_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [session, fetchCurrent]);

  // Local countdown ticker while active
  useEffect(() => {
    if (!session || session.status !== "active") return;

    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (!prev || prev <= 0) {
          fetchCurrent();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, fetchCurrent]);

  const displayStatus = !session
    ? "not_started"
    : session.status === "closed"
    ? "closed"
    : timeRemainingSeconds > 0
    ? "active"
    : "closed";

  const voteResultsMap = React.useMemo(() => {
    const map = new Map();
    results.forEach((r) => map.set(r.candidateRegistrationId, r));
    return map;
  }, [results]);

  // Final standings for the closing board: every team that received votes
  // (already ranked by the server), followed by finalists with zero votes —
  // so the board always shows the whole field, not just the voted teams.
  const leaderboard = React.useMemo(() => {
    const seen = new Set(results.map((r) => r.candidateRegistrationId));
    const zeros = candidates
      .filter((c) => !seen.has(c.registrationId))
      .sort((a, b) =>
        String(a.teamName || "").localeCompare(String(b.teamName || "")),
      )
      .map((c) => ({
        candidateRegistrationId: c.registrationId,
        candidateTeamName: c.teamName,
        votes: 0,
        percentage: 0,
      }));
    return [...results, ...zeros];
  }, [results, candidates]);

  const ticketLink = voterId.trim()
    ? `${window.location.origin}/voting?voterId=${encodeURIComponent(
        voterId.trim(),
      )}`
    : "";

  const copyText = async (text, field) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? "" : current));
      }, 1600);
    } catch {
      setErrorMessage("Couldn't copy automatically — long-press the text to copy it.");
    }
  };

  const shareTicket = async () => {
    if (!ticketLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AURA voting ticket",
          url: ticketLink,
        });
      } catch {
        /* dismissed by the user — do nothing */
      }
      return;
    }
    await copyText(ticketLink, "link");
  };

  const cancelAutoRegister = () => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  };

  // Arm a single one-shot timer once both fields are complete; every
  // keystroke either re-arms (fields incomplete) or leaves it alone, so a
  // failed submission never loops on its own — only a fresh edit retries.
  const scheduleAutoRegister = () => {
    const digits = phoneRef.current.replace(/\D/g, "");
    if (digits.length !== 10 || !nameRef.current.trim()) return;
    if (autoTimerRef.current) return;
    autoTimerRef.current = window.setTimeout(() => {
      autoTimerRef.current = null;
      handleRegisterVoter();
    }, 600);
  };

  // Never let a pending auto-register fire after leaving the register step.
  useEffect(() => {
    if (step !== "register") cancelAutoRegister();
  }, [step]);
  useEffect(() => () => cancelAutoRegister(), []);

  // Render the ticket QR locally whenever a voter ID is on the vote step.
  useEffect(() => {
    let alive = true;
    const id = voterId.trim();
    if (!id || step !== "vote") {
      setTicketQr("");
      return () => {
        alive = false;
      };
    }
    qrDataUrl(
      `${window.location.origin}/voting?voterId=${encodeURIComponent(id)}`,
      180,
    )
      .then((url) => {
        if (alive) setTicketQr(url);
      })
      .catch(() => {
        if (alive) setTicketQr("");
      });
    return () => {
      alive = false;
    };
  }, [voterId, step]);

  // Persist the current identity so a refresh / dead battery doesn't cost
  // the voter their place. hasVoted is scoped to the session it happened in.
  const persistTicket = (overrides = {}) => {
    try {
      const base = readSavedTicket() || {};
      localStorage.setItem(
        TICKET_STORAGE_KEY,
        JSON.stringify({
          ...base,
          mode: identityMode,
          voterId: voterId.trim(),
          voterName: voterName.trim(),
          registrationId: registrationId.trim().toUpperCase(),
          participantName: participantName.trim(),
          sessionId: session?._id || null,
          hasVoted: false,
          ...overrides,
        }),
      );
    } catch {
      /* storage unavailable (private mode) — non-fatal */
    }
  };

  const resumeTicket = () => {
    if (!savedTicket) return;
    setErrorMessage("");
    if (savedTicket.mode === "participant") {
      setRegistrationId(savedTicket.registrationId || "");
      setParticipantName(savedTicket.participantName || "");
      setIdentityMode("participant");
    } else {
      setVoterId(savedTicket.voterId || "");
      setVoterName(savedTicket.voterName || "");
      setIdentityMode("voter");
    }
    // "Already voted" only counts within the session it was cast in —
    // a fresh session (or a pre-event reset) starts them clean.
    const sameSession =
      savedTicket.sessionId && session && savedTicket.sessionId === session._id;
    if (sameSession && savedTicket.hasVoted) {
      setHasVoted(true);
      setVoteSuccessMessage(
        "You've already voted — thank you! Your vote is counted.",
      );
    }
    setStep("vote");
  };

  // Scanner result: accept a real ticket (stops the camera), otherwise show
  // feedback in the overlay and keep scanning.
  const handleTicketScan = (raw) => {
    const scannedId = extractVoterId(raw);
    if (!scannedId) {
      return "That doesn't look like an AURA ticket — point at your own ticket QR.";
    }
    setVoterId(scannedId);
    setIdentityMode("voter");
    persistTicket({ mode: "voter", voterId: scannedId, hasVoted: false });
    setStep("vote");
    setErrorMessage("");
    setScannerOpen(false);
    return true;
  };

  const handleRegisterVoter = async () => {
    const trimmedName = voterName.trim();
    const phoneDigits = voterPhone.replace(/\D/g, "");
    if (!trimmedName) {
      setErrorMessage("Please enter your name to register.");
      return;
    }
    if (phoneDigits.length !== 10) {
      setErrorMessage(
        "Please enter a valid 10-digit phone number — it is used to make sure each person registers only once."
      );
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");
    setVoteSuccessMessage("");
    try {
      const res = await fetch(`${API_URL}/api/voting/voters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          phone: phoneDigits,
          type: "spectator",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to register voter.");
      }
      setVoterId(data.voter.voterId);
      // Registration done — jump straight to voting with the identity set.
      // The Voter ID chip on the next screen is the confirmation.
      setIdentityMode("voter");
      persistTicket({
        mode: "voter",
        voterId: data.voter.voterId,
        voterName: trimmedName,
        hasVoted: false,
      });
      setStep("vote");
      setErrorMessage("");
      await fetchCurrent();
    } catch (err) {
      console.error("Failed to register voter:", err);
      setErrorMessage(err.message || "Failed to register voter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (e) => {
    e?.preventDefault();
    if (!session) return;

    const trimmedCandidateId = candidateRegistrationId.trim().toUpperCase();

    if (!trimmedCandidateId) {
      setErrorMessage("Please select a candidate team to vote for.");
      return;
    }
    if (!identityMode) {
      setErrorMessage("Choose how you want to vote first.");
      setStep("choose");
      return;
    }
    if (identityMode === "voter" && !voterId.trim()) {
      setErrorMessage("Enter your Voter ID first.");
      setStep("existing");
      return;
    }
    if (
      identityMode === "participant" &&
      (!registrationId.trim() || !participantName.trim())
    ) {
      setErrorMessage("Enter your Team Registration ID and name first.");
      setStep("participant");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setVoteSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/api/voting/sessions/${session._id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          identityMode === "voter"
            ? {
                voterId: voterId.trim(),
                candidateRegistrationId: trimmedCandidateId,
              }
            : {
                registrationId: registrationId.trim().toUpperCase(),
                participantName: participantName.trim(),
                candidateRegistrationId: trimmedCandidateId,
              },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to cast vote.");
      }

      setHasVoted(true);
      setVoteSuccessMessage(
        "Vote counted! Your vote for the Audience Choice prize has been recorded."
      );
      persistTicket({ hasVoted: true, sessionId: session._id });
      await fetchCurrent();
    } catch (err) {
      console.error("Failed to cast vote:", err);
      const msg = String(err.message || "Failed to cast vote.");
      // A duplicate attempt (refresh, second device, saved ticket) is not a
      // failure — show the thank-you state instead of a red error.
      if (msg.includes("already cast a vote")) {
        setHasVoted(true);
        setVoteSuccessMessage(
          "You've already voted — thank you! Your vote is already counted.",
        );
        await fetchCurrent();
      } else {
        setErrorMessage(msg);
        // Send the user back to the step where they can fix their details.
        if (msg.includes("Voter not found")) {
          setStep("register");
        } else if (
          msg.includes("Registration ID not found") ||
          msg.includes("does not match any member")
        ) {
          setStep("participant");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-white" size={40} />
        </div>
      );
    }

    if (displayStatus === "not_started") {
      return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center max-w-xl mx-auto">
          <Clock className="mx-auto mb-4 text-white/60" size={40} />
          <h3 className="text-2xl font-bold mb-2">Audience Choice Voting</h3>
          {errorMessage ? (
            <>
              {/* Distinguish "server unreachable" from "window not open" —
                  telling a voter "not started yet" when the server merely
                  timed out would send them away from an open vote. */}
              <p className="text-white/60">
                Couldn't reach the voting server — your connection may have
                dropped. Voting may already be open.
              </p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchCurrent();
                }}
                className="mt-5 bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-white/90 transition"
              >
                Try again
              </button>
            </>
          ) : (
            <p className="text-white/60">
              The Audience Choice voting window has not started yet. The
              organizing committee will open voting shortly.
            </p>
          )}
        </div>
      );
    }

    if (displayStatus === "closed") {
      const scoredTeams = results.filter((r) => r.votes > 0).length;
      const winnerEntry = winner
        ? results.find(
            (r) =>
              r.candidateRegistrationId === winner.candidateRegistrationId,
          ) || null
        : null;
      const winnerPct = winnerEntry?.percentage ?? 0;

      return (
        <div className="max-w-3xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center mb-8"
          >
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-300 border border-amber-400/30 bg-amber-400/10 rounded-full px-4 py-1.5 mb-4">
              <Sparkles size={13} /> Voting closed · Final results
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Audience Choice Leaderboard
            </h3>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <span className="text-xs font-semibold bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 tabular-nums">
                {votesCast} vote{votesCast === 1 ? "" : "s"} cast
              </span>
              <span className="text-xs font-semibold bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 tabular-nums">
                {scoredTeams} of {candidates.length || leaderboard.length}{" "}
                teams scored
              </span>
              <span className="text-xs font-semibold bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5">
                1 vote per person
              </span>
            </div>
          </motion.div>

          {votesCast > 0 ? (
            <>
              {/* Winner hero */}
              {winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-b from-amber-300/90 via-amber-500/40 to-amber-500/10 mb-8"
                >
                  <div className="pointer-events-none absolute -top-28 left-1/2 h-64 w-72 -translate-x-1/2 rounded-full bg-amber-400/25 blur-3xl" />
                  <div className="relative rounded-3xl bg-[#121010] px-6 py-10 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-amber-500 shadow-[0_0_45px_rgba(251,191,36,0.55)]">
                      <Trophy
                        className="text-black"
                        size={30}
                        strokeWidth={2.5}
                      />
                    </div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.35em] text-amber-300">
                      Audience Choice Winner
                    </p>
                    <h4 className="text-3xl sm:text-5xl font-extrabold tracking-tight break-words">
                      {winner.candidateTeamName}
                    </h4>
                    <div className="mt-6 flex items-center justify-center gap-5 sm:gap-8">
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums">
                          {winner.votes}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">
                          votes
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/15" />
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums text-amber-300">
                          {formatPct(winnerPct)}%
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">
                          of all votes
                        </p>
                      </div>
                      <div className="h-8 w-px bg-white/15" />
                      <div>
                        <p className="text-2xl font-extrabold tabular-nums">
                          {scoredTeams}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-white/50">
                          teams scored
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Full standings */}
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-lg font-bold">
                  <Medal size={18} className="text-amber-300" /> Full standings
                </h4>
                <p className="text-xs text-white/50 tabular-nums">
                  {leaderboard.length} team{leaderboard.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="space-y-2.5">
                {leaderboard.map((r, idx) => {
                  const pct = Number(r.percentage) || 0;
                  const isZero = r.votes <= 0;
                  const isWinnerRow =
                    winner?.candidateRegistrationId ===
                    r.candidateRegistrationId;
                  // Gold / silver / bronze badges — only for teams that
                  // actually scored (a zero-vote row never inherits a medal).
                  const rankBadge = isZero
                    ? "bg-white/10 text-white/50"
                    : idx === 0
                    ? "bg-gradient-to-br from-yellow-200 via-amber-300 to-amber-500 text-black shadow-[0_0_14px_rgba(251,191,36,0.45)]"
                    : idx === 1
                    ? "bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-black"
                    : idx === 2
                    ? "bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700 text-white"
                    : "bg-white/10 text-white/60";
                  return (
                    <motion.div
                      key={r.candidateRegistrationId}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(0.15 + idx * 0.05, 0.6),
                      }}
                      className={`rounded-xl border px-4 py-3.5 sm:px-5 ${
                        isWinnerRow
                          ? "border-amber-400/60 bg-amber-400/[0.07] ring-1 ring-amber-400/30"
                          : isZero
                          ? "border-white/10 bg-white/[0.02]"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black tabular-nums ${rankBadge}`}
                        >
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex items-center gap-2">
                            <p
                              className={`truncate font-semibold ${
                                isZero ? "text-white/45" : "text-white"
                              }`}
                            >
                              {r.candidateTeamName}
                            </p>
                            {isWinnerRow && (
                              <span className="shrink-0 rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black tracking-widest text-black">
                                WINNER
                              </span>
                            )}
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              className={`h-full rounded-full ${
                                idx === 0 && !isZero
                                  ? "bg-gradient-to-r from-amber-300 to-amber-500"
                                  : isZero
                                  ? "bg-white/20"
                                  : "bg-amber-400/50"
                              }`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${isZero ? 0 : Math.max(pct, 1.5)}%`,
                              }}
                              transition={{
                                duration: 0.8,
                                delay: Math.min(0.3 + idx * 0.06, 0.8),
                                ease: "easeOut",
                              }}
                            />
                          </div>
                        </div>

                        <div className="w-16 shrink-0 text-right sm:w-20">
                          <p
                            className={`text-xl font-extrabold tabular-nums ${
                              isZero ? "text-white/35" : "text-white"
                            }`}
                          >
                            {formatPct(pct)}
                            <span className="text-sm font-bold text-white/45">
                              %
                            </span>
                          </p>
                          <p className="text-[11px] tabular-nums text-white/50">
                            {r.votes} vote{r.votes === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Window closed without a single vote */
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <Trophy className="mx-auto mb-3 text-white/25" size={44} />
              <p className="mb-1 text-lg font-semibold">
                No votes were cast
              </p>
              <p className="text-sm text-white/50">
                The Audience Choice window has closed without any votes.
              </p>
            </div>
          )}

          <p className="mx-auto mt-8 max-w-xl text-center text-xs leading-relaxed text-white/40">
            Decided by the audience alone — one vote per person. Teams that
            take 1st, 2nd or 3rd place are not eligible for Audience Choice.
          </p>
        </div>
      );
    }

    // Active voting view
    return (
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Countdown + status */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center sticky top-24">
            <Timer className="mx-auto mb-4 text-white/70" size={40} />
            <p className="text-sm uppercase tracking-widest text-white/50 mb-2">
              Voting closes in
            </p>
            <p className="text-5xl font-extrabold tabular-nums mb-4">
              {formatCountdown(timeRemainingSeconds)}
            </p>
            <p className="text-white/60 text-sm">
              Votes cast so far:{" "}
              <span className="text-white font-semibold">{votesCast}</span>
            </p>
          </div>
        </div>

        {/* Voting panel */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
            {voteSuccessMessage ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="text-emerald-400 mb-4" size={48} />
                <p className="text-lg font-semibold">{voteSuccessMessage}</p>
              </div>
            ) : step === "choose" ? (
              <>
                <h3 className="text-2xl font-bold mb-2">Who's voting?</h3>
                <p className="text-white/60 mb-6">
                  Pick the option that fits you — new voters register in about
                  10 seconds.
                </p>
                {savedTicket && (
                  <div className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-emerald-300">
                        {savedTicket.sessionId &&
                        session &&
                        savedTicket.sessionId === session._id &&
                        savedTicket.hasVoted
                          ? "You've already voted ✓"
                          : "Welcome back!"}
                      </p>
                      <p className="text-sm text-white/60 truncate">
                        {savedTicket.mode === "participant" ? (
                          <>
                            {savedTicket.participantName} ·{" "}
                            <span className="font-mono">
                              {savedTicket.registrationId}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-mono">
                              {savedTicket.voterId}
                            </span>
                            {savedTicket.voterName
                              ? ` · ${savedTicket.voterName}`
                              : ""}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={resumeTicket}
                        className="bg-white text-black text-sm font-bold rounded-lg px-4 py-2 hover:bg-white/90 transition"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setStep("register");
                    }}
                    className="text-left rounded-xl border border-white/15 bg-black/30 p-5 hover:border-white/40 hover:bg-white/10 transition"
                  >
                    <UserPlus className="text-amber-300 mb-2" size={24} />
                    <p className="font-bold mb-1">I'm new — register</p>
                    <p className="text-sm text-white/60">
                      Name + phone → instant Voter ID
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setStep("existing");
                    }}
                    className="text-left rounded-xl border border-white/15 bg-black/30 p-5 hover:border-white/40 hover:bg-white/10 transition"
                  >
                    <KeyRound className="text-amber-300 mb-2" size={24} />
                    <p className="font-bold mb-1">I have a Voter ID</p>
                    <p className="text-sm text-white/60">
                      Registered earlier or got a ticket QR?
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setStep("participant");
                    }}
                    className="text-left rounded-xl border border-white/15 bg-black/30 p-5 hover:border-white/40 hover:bg-white/10 transition"
                  >
                    <Users className="text-amber-300 mb-2" size={24} />
                    <p className="font-bold mb-1">Team participant</p>
                    <p className="text-sm text-white/60">
                      Vote with your Team Registration ID
                    </p>
                  </button>
                </div>
              </>
            ) : step === "register" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setStep("choose");
                  }}
                  className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-4"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <h3 className="text-2xl font-bold mb-2">Register to vote</h3>
                <p className="text-white/60 mb-6">
                  Takes 10 seconds — you'll get your Voter ID immediately.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRegisterVoter();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={voterName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setVoterName(v);
                        nameRef.current = v;
                        if (!v.trim()) cancelAutoRegister();
                        else scheduleAutoRegister();
                      }}
                      autoComplete="name"
                      placeholder="Your name"
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={voterPhone}
                      onChange={(e) => {
                        const v = e.target.value;
                        setVoterPhone(v);
                        phoneRef.current = v;
                        if (v.replace(/\D/g, "").length !== 10) {
                          cancelAutoRegister();
                        } else {
                          scheduleAutoRegister();
                        }
                      }}
                      autoComplete="tel"
                      enterKeyHint="go"
                      placeholder="10-digit phone number"
                      maxLength={15}
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                    />
                    <p className="text-[11px] text-white/40 mt-1">
                      Used to make sure each person gets only one vote.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition"
                  >
                    {isSubmitting ? "Registering…" : "Get my Voter ID"}
                  </button>
                  <p className="text-[11px] text-white/40 text-center">
                    Registers by itself once your name and 10-digit phone are
                    filled in.
                  </p>
                </form>
              </>
            ) : step === "existing" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setStep("choose");
                  }}
                  className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-4"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <h3 className="text-2xl font-bold mb-2">Enter your Voter ID</h3>
                <p className="text-white/60 mb-5">
                  It's on your registration confirmation, or scan the ticket QR
                  you were given.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setScannerOpen(true);
                  }}
                  className="w-full mb-4 bg-white/10 border border-white/20 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition"
                >
                  <ScanLine size={18} /> Scan ticket QR instead
                </button>
                <input
                  type="text"
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  placeholder="AURA-V-XXXXXX"
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!voterId.trim()) {
                      setErrorMessage("Enter your Voter ID to continue.");
                      return;
                    }
                    setErrorMessage("");
                    setIdentityMode("voter");
                    persistTicket({
                      mode: "voter",
                      voterId: voterId.trim(),
                      hasVoted: false,
                    });
                    setStep("vote");
                  }}
                  className="mt-6 w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-white/90 transition"
                >
                  Continue →
                </button>
                <p className="text-sm text-white/50 mt-4">
                  Don't have one?{" "}
                  <button
                    type="button"
                    onClick={() => setStep("register")}
                    className="underline text-white hover:text-amber-300"
                  >
                    Register in 10 seconds
                  </button>
                </p>
              </>
            ) : step === "participant" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setStep("choose");
                  }}
                  className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-4"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <h3 className="text-2xl font-bold mb-2">Team participant</h3>
                <p className="text-white/60 mb-6">
                  Use your Team Registration ID and your name exactly as it
                  appears in the team's registration.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Team Registration ID
                    </label>
                    <input
                      type="text"
                      value={registrationId}
                      onChange={(e) => setRegistrationId(e.target.value)}
                      placeholder="AURA2K26-XXXXXX"
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Participant Full Name
                    </label>
                    <input
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Full name as registered"
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!registrationId.trim() || !participantName.trim()) {
                      setErrorMessage(
                        "Enter both your Team Registration ID and your full name."
                      );
                      return;
                    }
                    setErrorMessage("");
                    setIdentityMode("participant");
                    persistTicket({ mode: "participant", hasVoted: false });
                    setStep("vote");
                  }}
                  className="mt-6 w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-white/90 transition"
                >
                  Continue →
                </button>
                <p className="text-sm text-white/50 mt-4">
                  Not on a team?{" "}
                  <button
                    type="button"
                    onClick={() => setStep("register")}
                    className="underline text-white hover:text-amber-300"
                  >
                    Register as a spectator
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                  <div className="bg-black/40 border border-white/15 rounded-lg px-4 py-2 flex items-center gap-3 flex-wrap">
                    {identityMode === "voter" ? (
                      <p className="text-sm text-white/70">
                        Voting as{" "}
                        <span className="font-mono font-bold text-white">
                          {voterId.trim()}
                        </span>
                        {voterName.trim() && (
                          <span className="text-white/50">
                            {" "}
                            · {voterName.trim()}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-white/70">
                        Voting as{" "}
                        <span className="font-bold text-white">
                          {participantName.trim()}
                        </span>
                        <span className="font-mono text-white/50">
                          {" "}
                          · {registrationId.trim().toUpperCase()}
                        </span>
                      </p>
                    )}
                    {identityMode === "voter" && voterId.trim() && (
                      <button
                        type="button"
                        onClick={() => copyText(voterId.trim(), "id")}
                        className="shrink-0 inline-flex items-center gap-1 text-xs border border-white/20 text-white/70 hover:text-white hover:border-white/50 rounded-md px-2 py-1"
                      >
                        {copiedField === "id" ? (
                          <>
                            <Check size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy ID
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setStep("choose");
                    }}
                    className="text-sm border border-white/20 text-white/70 hover:text-white hover:border-white/50 rounded-lg px-3 py-1.5"
                  >
                    Change
                  </button>
                </div>
                <h3 className="text-2xl font-bold mb-2">Cast your vote</h3>
                <p className="text-white/60">
                  Pick a team in the list below, then press{" "}
                  <span className="text-white font-semibold">Cast Vote</span>.
                  One vote per person.
                </p>
                {identityMode === "voter" && voterId.trim() && (
                  <div className="flex flex-col items-center gap-3 pt-6">
                    <p className="text-xs text-white/50">
                      Save this QR — scanning it reopens your voting ticket
                    </p>
                    {ticketQr ? (
                      <img
                        src={ticketQr}
                        alt="Voter QR code"
                        className="w-40 h-40 rounded-lg border border-white/15 bg-white p-2"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-lg border border-white/15 bg-white/10 flex items-center justify-center">
                        <Loader2
                          className="animate-spin text-white/60"
                          size={22}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(ticketLink, "link")}
                        className="inline-flex items-center gap-1 text-xs border border-white/20 text-white/70 hover:text-white hover:border-white/50 rounded-md px-3 py-1.5"
                      >
                        {copiedField === "link" ? (
                          <>
                            <Check size={12} /> Copied
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copy link
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={shareTicket}
                        className="inline-flex items-center gap-1 text-xs border border-white/20 text-white/70 hover:text-white hover:border-white/50 rounded-md px-3 py-1.5"
                      >
                        <Share2 size={12} /> Share
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Candidate list — only shown once identity is confirmed */}
          {step === "vote" && (
            <>
          <div className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Users size={20} /> Eligible teams for Audience Choice
            </h3>
            {candidates.length === 0 ? (
              <p className="text-white/50">No eligible teams are currently available.</p>
            ) : (
              candidates.map((c) => {
                const tally = voteResultsMap.get(c.registrationId);
                const isSelected = candidateRegistrationId === c.registrationId;
                return (
                  <button
                    key={c.registrationId}
                    type="button"
                    disabled={displayStatus !== "active" || hasVoted}
                    onClick={() => setCandidateRegistrationId(c.registrationId)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-white bg-white/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    } ${displayStatus !== "active" || hasVoted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold text-lg">{c.teamName}</p>
                        {c.projectTitle && <p className="text-sm text-white/60">{c.projectTitle}</p>}
                        {c.teamSize && <p className="text-xs text-white/40 mt-1">Team size: {c.teamSize}</p>}
                      </div>
                      {tally && (
                        <div className="text-right">
                          <p className="font-bold text-lg">{tally.votes}</p>
                          <p className="text-xs text-white/50">{tally.percentage}% of votes</p>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

              {!voteSuccessMessage && (
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={
                    isSubmitting ||
                    !candidateRegistrationId ||
                    hasVoted ||
                    displayStatus !== "active"
                  }
                  className="mt-6 w-full bg-white text-black font-bold py-4 rounded-lg text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition"
                >
                  {isSubmitting
                    ? "Casting vote…"
                    : candidateRegistrationId
                    ? `Cast Vote for ${
                        candidates.find(
                          (c) => c.registrationId === candidateRegistrationId,
                        )?.teamName || "selected team"
                      }`
                    : "Select a team to vote"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0909] text-white">
      {scannerOpen && (
        <QrScanner
          onScan={handleTicketScan}
          onClose={() => setScannerOpen(false)}
        />
      )}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8"
        >
          <ArrowLeft size={18} /> Back to Home
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Audience Choice Voting</h1>
          <p className="text-white/60">
            {displayStatus === "closed"
              ? "Voting has closed — here are the final standings."
              : "Vote for the Audience Choice prize winner among eligible teams."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-8 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">
            <AlertCircle size={18} /> {errorMessage}
          </div>
        )}

        {renderStatusContent()}
      </div>
    </div>
  );
}
