import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Loader2,
  Play,
  Square,
  Users,
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  rawApiUrl && rawApiUrl !== "undefined"
    ? rawApiUrl.replace(/\/$/, "")
    : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

const formatTime = (totalSeconds) => {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

const PRIZE_LABELS = {
  first: "1st Place",
  second: "2nd Place",
  third: "3rd Place",
  audience_choice: "Audience Choice",
};

const TOP_TYPES = ["first", "second", "third"];

export default function AdminPage() {
  // Auth
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Session / data
  const [duration, setDuration] = useState(15);
  const [session, setSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [votesCast, setVotesCast] = useState(0);
  const [voters, setVoters] = useState([]);
  const [prizes, setPrizes] = useState([]);

  // Action flags
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Podium
  const [podiumQuery, setPodiumQuery] = useState("");
  const [podiumResults, setPodiumResults] = useState([]);
  const [podiumRank, setPodiumRank] = useState("first");
  const [podiumSelected, setPodiumSelected] = useState(null);

  const adminFetch = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
        ...(options.headers || {}),
      },
    });
    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    return { status: res.status, data };
  };

  const ok = (msg) => {
    setErrorMessage("");
    setSuccessMessage(msg);
  };
  const fail = (msg) => {
    setSuccessMessage("");
    setErrorMessage(msg);
  };

  const loadCurrent = async () => {
    try {
      const res = await fetch(`${API_URL}/api/voting/sessions/current`);
      const data = await res.json();
      if (res.ok) {
        setSession(data.session || null);
        setTimeRemaining(data.timeRemainingSeconds || 0);
        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
        setResults(Array.isArray(data.results) ? data.results : []);
        setVotesCast(Number(data.votesCast) || 0);
      }
    } catch {
      /* network hiccup — keep last known data */
    }
  };

  const loadVoters = async () => {
    try {
      const { status, data } = await adminFetch("/api/voting/voters");
      if (status === 200) setVoters(data.voters || []);
    } catch {
      /* ignore */
    }
  };

  const loadPrizes = async () => {
    try {
      const { status, data } = await adminFetch("/api/voting/prizes");
      if (status === 200) setPrizes(data.prizes || []);
    } catch {
      /* ignore */
    }
  };

  const loadAll = () => {
    loadCurrent();
    loadVoters();
    loadPrizes();
  };

  // ---------------- Auth ----------------
  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    if (!adminKey.trim()) {
      setErrorMessage("Please enter the admin key.");
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const { status } = await adminFetch("/api/voting/voters");
      if (status === 200 || status >= 500) {
        // 500 (e.g. cold start) — let them in; each action still verifies the key.
        setAuthed(true);
      } else if (status === 401) {
        setErrorMessage("Invalid admin key.");
      } else {
        setAuthed(true);
      }
    } catch {
      // Network hiccup — allow entry so a slow backend doesn't block the panel.
      setAuthed(true);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Session actions ----------------
  const startSession = async () => {
    setStarting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch("/api/voting/sessions", {
        method: "POST",
        body: JSON.stringify({ durationMinutes: Number(duration) || 15 }),
      });
      if (status === 201) {
        setSession(data.session || null);
        setSelectedWinner(null);
        ok("Voting session started!");
        loadCurrent();
      } else {
        fail(data.message || "Failed to start voting session.");
      }
    } catch {
      fail("Failed to start voting session.");
    } finally {
      setStarting(false);
    }
  };

  const saveSession = async () => {
    if (!session?._id) {
      fail("No session to save. Start a voting session first.");
      return;
    }
    if (session.status !== "active") {
      fail("This session is already closed. Start a new session to change the duration.");
      return;
    }
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch(`/api/voting/sessions/${session._id}`, {
        method: "PATCH",
        body: JSON.stringify({ durationMinutes: Number(duration) || 15 }),
      });
      if (status === 200) {
        setSession(data.session || null);
        setTimeRemaining(data.timeRemainingSeconds || 0);
        ok(data.message || "Session saved.");
      } else {
        fail(data.message || "Failed to save session.");
      }
    } catch {
      fail("Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  const closeSession = async () => {
    if (!session?._id) {
      fail("No active session found.");
      return;
    }
    setClosing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch(`/api/voting/sessions/${session._id}/close`, {
        method: "POST",
      });
      if (status === 200) {
        setSession(data.session || null);
        ok("Voting session ended.");
      } else {
        fail(data.message || "Failed to end voting session.");
      }
    } catch {
      fail("Failed to end voting session.");
    } finally {
      setClosing(false);
    }
  };

  // ---------------- Audience Choice winner (decided by votes only) ----------------
  // No manual selection: the server records the current vote leader.
  const recordVoteLeader = async () => {
    if (!session?._id) {
      fail("Start a voting session first.");
      return;
    }
    if (!votesCast) {
      fail("No votes yet — the winner is decided once the audience votes.");
      return;
    }
    setRecording(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch(
        `/api/voting/sessions/${session._id}/winner`,
        { method: "POST", body: JSON.stringify({}) },
      );
      if (status === 200) {
        const teamName = cleanName(data?.prize?.teamName || "");
        ok(
          teamName
            ? `Audience Choice winner recorded: ${teamName}`
            : data.message || "Audience Choice winner recorded.",
        );
        loadCurrent();
        loadPrizes();
      } else {
        fail(data.message || "Failed to record winner.");
      }
    } catch {
      fail("Failed to record winner.");
    } finally {
      setRecording(false);
    }
  };

  // ---------------- Podium ----------------
  // Some registered team names contain stray quotes/spaces (e.g. "TECHWALK") —
  // strip them so search and display work predictably.
  const cleanName = (s) =>
    String(s || "")
      .replace(/^[\s"'`]+/, "")
      .replace(/[\s"'`]+$/, "");

  const runPodiumSearch = (qOverride) => {
    const q = cleanName(qOverride ?? podiumQuery ?? "").toLowerCase();
    // Recorded holders stay visible (at the top of the list) so they can be
    // re-selected or re-assigned even though prize winners are excluded from
    // the eligible candidates.
    const holderRows = (prizes || [])
      .filter((p) => TOP_TYPES.includes(p.prizeType))
      .map((p) => ({
        registrationId: p.registrationId,
        teamName: p.teamName,
        heldRank: p.prizeType,
      }));
    const pool = [...holderRows, ...(candidates || [])];
    const list = pool.filter(
      (c) =>
        !q ||
        cleanName(c.teamName).toLowerCase().startsWith(q) ||
        String(c.registrationId || "").toLowerCase().startsWith(q),
    );
    setPodiumResults(list);
  };

  const assignPodiumPrize = async () => {
    if (!podiumSelected) {
      fail("Search and select a team from the list first.");
      return;
    }
    const rankValue = podiumRank === "first" ? 1 : podiumRank === "second" ? 2 : 3;
    setRecording(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch("/api/voting/prizes", {
        method: "POST",
        body: JSON.stringify({
          prizes: [
            {
              registrationId: String(podiumSelected.registrationId || "").trim().toUpperCase(),
              teamName: cleanName(podiumSelected.teamName),
              prizeType: podiumRank,
              rank: rankValue,
            },
          ],
        }),
      });
      if (status === 201) {
        const prevHolder = topPrizes.find(
          (p) =>
            p.prizeType === podiumRank &&
            p.registrationId !== podiumSelected.registrationId,
        );
        ok(
          `${PRIZE_LABELS[podiumRank]} → ${cleanName(podiumSelected.teamName)}` +
            (prevHolder ? ` (replaced ${cleanName(prevHolder.teamName)})` : ""),
        );
        setPodiumSelected(null);
        setPodiumQuery("");
        setPodiumResults([]);
        loadCurrent();
        loadPrizes();
        // Repopulate dropdown with updated eligible candidates
        setTimeout(() => runPodiumSearch(""), 300);
      } else {
        fail(data.message || "Failed to record podium prize.");
      }
    } catch {
      fail("Failed to record podium prize.");
    } finally {
      setRecording(false);
    }
  };

  const removeTopPrize = async (holder) => {
    if (!holder) return;
    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch(
        `/api/voting/prizes/${encodeURIComponent(holder.registrationId)}/${holder.prizeType}`,
        { method: "DELETE" },
      );
      if (status === 200) {
        ok(
          `${PRIZE_LABELS[holder.prizeType] || holder.prizeType} removed from ${cleanName(holder.teamName)}.`,
        );
        if (podiumSelected?.registrationId === holder.registrationId) {
          setPodiumSelected(null);
        }
        loadPrizes();
        loadCurrent();
      } else {
        fail(data.message || "Failed to remove prize.");
      }
    } catch {
      fail("Failed to remove prize.");
    } finally {
      setDeleting(false);
    }
  };

  const removeAudiencePrize = async () => {
    if (!audiencePrize) return;
    setDeleting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch(
        `/api/voting/prizes/${encodeURIComponent(audiencePrize.registrationId)}/audience_choice`,
        { method: "DELETE" },
      );
      if (status === 200) {
        ok("Audience Choice winner record removed.");
        loadPrizes();
        loadCurrent();
      } else {
        fail(data.message || "Failed to remove Audience Choice winner.");
      }
    } catch {
      fail("Failed to remove Audience Choice winner.");
    } finally {
      setDeleting(false);
    }
  };

  // ---------------- Data loading ----------------
  useEffect(() => {
    if (!authed) return;
    loadAll();
    const poll = setInterval(() => loadCurrent(), 10000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // Live countdown while a session is active
  useEffect(() => {
    if (!authed || session?.status !== "active" || !session?.endsAt) return;
    const tick = () => {
      const ms = new Date(session.endsAt).getTime() - Date.now();
      setTimeRemaining(Math.max(0, Math.ceil(ms / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [authed, session?.status, session?.endsAt]);

  // Auto-populate podium candidate list once candidates load
  useEffect(() => {
    if (authed && Array.isArray(candidates)) {
      runPodiumSearch(podiumQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, candidates, prizes]);

  // ---------------- Derived ----------------
  const sessionStatus = !session
    ? "No Session Yet"
    : session.status === "active"
    ? `LIVE · ${formatTime(timeRemaining)} left`
    : "Session Closed";

  const topPrizes = (prizes || []).filter((p) => p.prizeType !== "audience_choice");
  const audiencePrize = (prizes || []).find((p) => p.prizeType === "audience_choice");

  // ---------------- Login screen ----------------
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0b0909] text-white">
        <div className="max-w-xl mx-auto px-6 py-24">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8">
            ← Back to Home
          </Link>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <ShieldCheck className="mb-4 text-white/70" size={40} />
            <h1 className="text-3xl font-extrabold mb-2">AURA Admin — Voting</h1>
            <p className="text-white/60 mb-6">
              Enter the admin key to manage the Audience Choice voting session.
            </p>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Admin Key</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin key"
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? "Hide key" : "Preview key"}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/50 hover:text-white"
                  >
                    {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {errorMessage && <div className="text-red-400 text-sm">{errorMessage}</div>}
              <button
                type="submit"
                disabled={loading || !adminKey}
                className="w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Unlock Admin"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Admin panel ----------------
  return (
    <div className="min-h-screen bg-[#0b0909] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">
            AURA Admin — Audience Choice Voting
          </h1>
          <button
            onClick={() => {
              setAuthed(false);
              setAdminKey("");
              setSuccessMessage("");
              setErrorMessage("");
            }}
            className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:text-white"
          >
            Lock
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg px-4 py-3">
            {successMessage}
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Session</p>
            <p
              className={`text-xl font-bold ${
                session?.status === "active" ? "text-emerald-400" : "text-white/80"
              }`}
            >
              {sessionStatus}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Candidates</p>
            <p className="text-xl font-bold">{candidates.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-white/50 mb-1">Votes</p>
            <p className="text-xl font-bold">{votesCast}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Session control */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Play size={22} /> Voting Session Control
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">
                  Duration (minutes, 10–20)
                </label>
                <input
                  type="number"
                  min={10}
                  max={20}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 15)}
                  className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40"
                />
              </div>
              <button
                onClick={startSession}
                disabled={starting}
                className="w-full bg-white text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {starting ? <Loader2 className="animate-spin" size={20} /> : <Play size={18} />}
                Start Voting Session
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={saveSession}
                  disabled={saving || !session}
                  className="bg-white/10 border border-white/20 text-white font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Save Session"}
                </button>
                <button
                  onClick={closeSession}
                  disabled={closing || !session || session.status !== "active"}
                  className="bg-red-500/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {closing ? <Loader2 className="animate-spin" size={20} /> : <Square size={16} />}
                  End Session
                </button>
              </div>
              <p className="text-white/50 text-sm">
                Save Session applies the duration above to the running session (from now).
                The public voting page updates automatically.
              </p>
            </div>
          </div>

          {/* Voters */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users size={22} /> Registered Voters ({voters.length})
            </h2>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {voters.length === 0 && <p className="text-white/50">No voters registered yet.</p>}
              {voters.map((v) => (
                <div
                  key={v.voterId}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-4 py-2"
                >
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-xs text-white/50">
                      {v.voterId} · {v.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audience Choice Winner */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy size={22} /> Audience Choice Winner
          </h2>

          <div className="max-h-72 overflow-y-auto space-y-2 mb-4">
            {results.length === 0 && (
              <p className="text-white/50">
                No votes yet — the winner will be decided by the audience's votes.
              </p>
            )}
            {results.map((r) => (
              <div
                key={r.candidateRegistrationId}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-4 py-2"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-semibold truncate">{cleanName(r.candidateTeamName)}</p>
                  <p className="text-xs text-white/50">{r.candidateRegistrationId}</p>
                </div>
                <p className="shrink-0 text-sm font-bold text-amber-300">
                  {r.votes} vote{r.votes === 1 ? "" : "s"} · {r.percentage}%
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
            <p className="text-sm text-white/60">
              The winner is decided only by votes — this records the current vote leader.
            </p>
            <button
              onClick={recordVoteLeader}
              disabled={recording || !session || !votesCast}
              className="px-6 py-3 bg-amber-400 text-black font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {recording ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Record Audience Choice Winner"
              )}
            </button>
          </div>

          {/* Official Audience Choice winner */}
          <div className="bg-black/30 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-white/70 mb-2">Official Audience Choice winner</p>
            {audiencePrize ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-white/80">
                  <span className="text-emerald-300 font-semibold">
                    {cleanName(audiencePrize.teamName)}
                  </span>{" "}
                  <span className="text-white/40">({audiencePrize.registrationId})</span>
                </p>
                <button
                  onClick={removeAudiencePrize}
                  disabled={deleting}
                  className="shrink-0 text-xs border border-red-500/40 text-red-400 hover:text-red-300 rounded px-2 py-1 disabled:opacity-40"
                >
                  {deleting ? "…" : "Remove"}
                </button>
              </div>
            ) : (
              <p className="text-white/50 text-sm">
                Not recorded yet — it is decided by the vote tally above.
              </p>
            )}
          </div>
        </div>

        {/* Podium */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy size={22} /> Audience Choice Podium — Pick Winning Teams
          </h2>

          {/* Podium slots — who holds each rank right now (click = choose rank, ✕ = remove) */}
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {TOP_TYPES.map((type) => {
              const holder = topPrizes.find((p) => p.prizeType === type);
              const isSel = podiumRank === type;
              return (
                <div
                  key={type}
                  onClick={() => setPodiumRank(type)}
                  role="button"
                  tabIndex={0}
                  className={`relative rounded-xl border p-4 cursor-pointer ${
                    isSel
                      ? "border-amber-400/60 bg-amber-400/10"
                      : "border-white/10 bg-black/30 hover:border-white/30"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
                    {PRIZE_LABELS[type]}
                    {isSel && <span className="ml-2 text-amber-300">· assigning here</span>}
                  </p>
                  {holder ? (
                    <>
                      <p className="font-bold truncate pr-6">{cleanName(holder.teamName)}</p>
                      <p className="text-xs text-white/40 truncate">{holder.registrationId}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTopPrize(holder);
                        }}
                        disabled={deleting}
                        aria-label={`Remove ${PRIZE_LABELS[type]}`}
                        title={`Remove ${PRIZE_LABELS[type]}`}
                        className="absolute top-2 right-2 px-1 text-white/40 hover:text-red-400 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <p className="text-white/40 font-semibold">Vacant</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm text-white/70 mb-1">Rank</label>
              <select
                value={podiumRank}
                onChange={(e) => setPodiumRank(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 mb-4"
              >
                <option value="first">1st Place</option>
                <option value="second">2nd Place</option>
                <option value="third">3rd Place</option>
              </select>

              <label className="block text-sm text-white/70 mb-1">Search team</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={podiumQuery}
                  onChange={(e) => {
                    setPodiumQuery(e.target.value);
                    runPodiumSearch(e.target.value);
                  }}
                  placeholder="Type team name to filter (e.g. T…)"
                  className="flex-1 bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                />
                <button
                  onClick={() => runPodiumSearch(podiumQuery)}
                  className="px-4 py-3 bg-white text-black font-bold rounded-lg"
                >
                  Search
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {podiumResults.length === 0 && <p className="text-white/50">No teams found.</p>}
                {podiumResults.map((c) => (
                  <button
                    key={c.registrationId}
                    onClick={() => setPodiumSelected(c)}
                    className={`w-full text-left rounded-lg border px-4 py-2 ${
                      podiumSelected?.registrationId === c.registrationId
                        ? "border-amber-400/50 bg-amber-400/10"
                        : "border-white/10 bg-black/30 hover:border-white/30"
                    }`}
                  >
                    <p className="font-semibold flex items-center gap-2 flex-wrap">
                      <span className="truncate">{cleanName(c.teamName)}</span>
                      {c.heldRank && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-400/15 text-amber-300 border border-amber-400/40 rounded px-1.5 py-0.5">
                          Holds {PRIZE_LABELS[c.heldRank]}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-white/50">{c.registrationId}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-white/70 mb-2">Selected winner</p>
              <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-4">
                {podiumSelected ? (
                  <>
                    <p className="font-bold">{cleanName(podiumSelected.teamName)}</p>
                    <p className="text-xs text-white/50">{podiumSelected.registrationId}</p>
                    {podiumSelected.heldRank && (
                      <p className="text-xs text-amber-300 mt-1">
                        Currently holds {PRIZE_LABELS[podiumSelected.heldRank]}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-white/50">No team selected yet.</p>
                )}
              </div>
              <button
                onClick={assignPodiumPrize}
                disabled={recording || !podiumSelected}
                className="w-full bg-amber-400/90 text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {recording ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  `Assign to ${PRIZE_LABELS[podiumRank]}`
                )}
              </button>
              <p className="text-white/50 text-sm mt-4">
                One team per rank — assigning replaces the previous holder automatically. Use ✕ on
                a slot above to remove a prize. Winners become ineligible for Audience Choice votes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
