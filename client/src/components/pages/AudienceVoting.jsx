import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

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
      setSession(null);
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
      await fetchCurrent();
    } catch (err) {
      console.error("Failed to cast vote:", err);
      setErrorMessage(err.message || "Failed to cast vote.");
      // Send the user back to the step where they can fix their details.
      const msg = String(err.message || "");
      if (msg.includes("Voter not found")) {
        setStep("register");
      } else if (
        msg.includes("Registration ID not found") ||
        msg.includes("does not match any member")
      ) {
        setStep("participant");
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
          <p className="text-white/60">
            The Audience Choice voting window has not started yet. The
            organizing committee will open voting shortly.
          </p>
        </div>
      );
    }

    if (displayStatus === "closed") {
      return (
        <div>
          {/* Results */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="text-amber-400" size={32} />
              <h3 className="text-2xl font-bold">Audience Choice Results</h3>
            </div>
            <p className="text-white/60 mb-6">
              Total votes cast: <span className="text-white font-semibold">{votesCast}</span>
            </p>

            {winner ? (
              <div className="bg-amber-400/10 border border-amber-400/40 rounded-xl p-6 text-center">
                <Trophy className="mx-auto mb-3 text-amber-400" size={44} />
                <p className="text-sm uppercase tracking-widest text-amber-300 mb-2">
                  Audience Choice Winner
                </p>
                <h4 className="text-3xl font-extrabold">{winner.candidateTeamName}</h4>
                <p className="text-white/60 mt-2">{winner.votes} votes</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                <p className="text-white/60">No votes were cast in this session.</p>
              </div>
            )}
          </div>

          {/* Tally list */}
          <div className="space-y-3">
            {results.map((r, idx) => (
              <div
                key={r.candidateRegistrationId}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  winner?.candidateRegistrationId === r.candidateRegistrationId
                    ? "border-amber-400/50 bg-amber-400/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{r.candidateTeamName}</p>
                    <p className="text-xs text-white/50">{r.votes} votes</p>
                  </div>
                </div>
                <span className="text-white/80 font-medium">{r.percentage}%</span>
              </div>
            ))}
          </div>
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
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
                      onChange={(e) => setVoterPhone(e.target.value)}
                      placeholder="10-digit phone number"
                      maxLength={15}
                      className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                    />
                    <p className="text-[11px] text-white/40 mt-1">
                      Used to make sure each person gets only one vote.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRegisterVoter}
                  disabled={isSubmitting}
                  className="mt-6 w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition"
                >
                  {isSubmitting ? "Registering…" : "Get my Voter ID"}
                </button>
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
                <p className="text-white/60 mb-6">
                  It's on your registration confirmation, or scan the ticket QR
                  you were given.
                </p>
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
                  <div className="bg-black/40 border border-white/15 rounded-lg px-4 py-2">
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
                  <div className="flex flex-col items-center gap-2 pt-6">
                    <p className="text-xs text-white/50">
                      Save this QR — scanning it reopens your voting ticket
                    </p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        `${window.location.origin}${window.location.pathname}?voterId=${voterId.trim()}`,
                      )}`}
                      alt="Voter QR code"
                      className="w-40 h-40 rounded-lg border border-white/15 bg-white p-2"
                    />
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
            Vote for the Audience Choice prize winner among eligible teams.
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
