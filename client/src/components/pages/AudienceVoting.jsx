import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
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
  const [adminKey, setAdminKey] = useState("");
  const [startingFromVoting, setStartingFromVoting] = useState(false);
  const [candidateRegistrationId, setCandidateRegistrationId] =
    useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const isVoterMode = voterId.trim().length > 0;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteSuccessMessage, setVoteSuccessMessage] = useState("");

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
    } else if (modeParam === "participant" && regIdParam && nameParam) {
      setRegistrationId(regIdParam);
      setParticipantName(nameParam);
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
    if (!trimmedName) {
      setErrorMessage("Please enter your name to register.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");
    setVoteSuccessMessage("");
    try {
      const res = await fetch(`${API_URL}/api/voting/voters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, type: "spectator" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to register voter.");
      }
      setVoterId(data.voter.voterId);
      setVoteSuccessMessage(
        `Voter registered! Your voter ID is ${data.voter.voterId}. You can now cast your vote.`
      );
      await fetchCurrent();
    } catch (err) {
      console.error("Failed to register voter:", err);
      setErrorMessage(err.message || "Failed to register voter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartSessionFromVoting = async () => {
    setStartingFromVoting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_URL}/api/voting/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ durationMinutes: 15 }),
      });
      const data = await res.json();
      if (res.ok) {
        setSession(data.session || null);
      } else {
        setErrorMessage(data.message || "Failed to start voting session.");
      }
    } catch (err) {
      setErrorMessage("Failed to start voting session.");
    } finally {
      setStartingFromVoting(false);
    }
  };

  const handleVote = async (e) => {
    e?.preventDefault();
    if (!session) return;

    const trimmedVoterCode = voterId.trim();
    const trimmedRegId = registrationId.trim().toUpperCase();
    const trimmedParticipantName = participantName.trim();
    const trimmedCandidateId = candidateRegistrationId.trim().toUpperCase();

    // Determine voting mode: on-spot voter (volunteer / spectator) OR participant
    const isVoterMode = trimmedVoterCode.length > 0;

    if (isVoterMode) {
      if (!trimmedCandidateId) {
        setErrorMessage("Please select a candidate team to vote for.");
        return;
      }
    } else {
      if (!trimmedRegId) {
        setErrorMessage("Please enter the Team Registration ID.");
        return;
      }
      if (!trimmedParticipantName) {
        setErrorMessage("Please enter the participant's full name.");
        return;
      }
      if (!trimmedCandidateId) {
        setErrorMessage("Please select a candidate team to vote for.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setVoteSuccessMessage("");

    try {
      const res = await fetch(`${API_URL}/api/voting/sessions/${session._id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isVoterMode
            ? { voterId: trimmedVoterCode, candidateRegistrationId: trimmedCandidateId }
            : { registrationId: trimmedRegId, participantName: trimmedParticipantName, candidateRegistrationId: trimmedCandidateId }
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
          <button
            onClick={handleStartSessionFromVoting}
            disabled={startingFromVoting}
            className="mt-8 w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {startingFromVoting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Start Voting Session"}
          </button>
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
            <h3 className="text-2xl font-bold mb-2">Cast your vote</h3>
            <p className="text-white/60 mb-6">
              One vote per participant. Voting for a team that has already won
              a top prize is not allowed.
            </p>

            {voteSuccessMessage ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="text-emerald-400 mb-4" size={48} />
                <p className="text-lg font-semibold">{voteSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleVote} className="space-y-4">
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
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Voter ID (volunteers / spectators — from on-spot registration)
                  </label>
                  <input
                    type="text"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    placeholder="AURA-V-XXXXXX"
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Voter Name
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
                    Vote for
                  </label>
                  <select
                    value={candidateRegistrationId}
                    onChange={(e) => setCandidateRegistrationId(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40"
                  >
                    <option value="">Select a team…</option>
                    {candidates.map((c) => (
                      <option
                        key={c.registrationId}
                        value={c.registrationId}
                      >
                        {c.teamName}
                        {c.projectTitle ? ` — ${c.projectTitle}` : ""}
                        {c.teamSize ? ` (Team of ${c.teamSize})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} /> {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRegisterVoter}
                  disabled={isSubmitting}
                  className="w-full bg-white/10 border border-white/20 text-white font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/20 transition"
                >
                  {isSubmitting ? "Registering…" : "Register to get Voter ID"}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !session || session.status !== "active"}
                  className="w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/90 transition"
                >
                  {isSubmitting ? "Casting vote…" : "Cast Vote"}
                </button>

                {voterId.trim() && (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <p className="text-xs text-white/50">Scan to open your voting ticket</p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(voterId.trim())}`}
                      alt="Voter QR code"
                      className="w-40 h-40 rounded-lg border border-white/15 bg-white p-2"
                    />
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Candidate list */}
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
