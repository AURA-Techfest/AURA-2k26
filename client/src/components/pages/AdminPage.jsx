import React, { useState, useEffect, useCallback, useRef } from "react";
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
  X,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Lock,
} from "lucide-react";
import { qrDataUrl } from "../ticketQr";

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
  const [removingVoterId, setRemovingVoterId] = useState(null);

  // Quick-Issue Desk: register on-spot voters straight from the queue
  const [deskName, setDeskName] = useState("");
  const [deskPhone, setDeskPhone] = useState("");
  const [deskType, setDeskType] = useState("spectator");
  const [deskIssuing, setDeskIssuing] = useState(false);
  const [deskIssued, setDeskIssued] = useState(null); // { voterId, name, phone, type, isNew }
  const [deskCopied, setDeskCopied] = useState(""); // "id" | "link"
  const [deskQr, setDeskQr] = useState("");
  const [resetting, setResetting] = useState(false);

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

  // Delete a voter AND their vote server-side. Confirm first — removing a
  // voter changes the tally, and lets that person register/vote again.
  const removeVoter = async (voter) => {
    const confirmed = window.confirm(
      `Delete voter "${voter.name}" (${voter.voterId})?\n\n` +
        `This also removes their vote from the tally, and the same phone number will be able to register again.`,
    );
    if (!confirmed) return;

    setRemovingVoterId(voter.voterId);
    try {
      const { status, data } = await adminFetch(
        `/api/voting/voters/${encodeURIComponent(voter.voterId)}`,
        { method: "DELETE" },
      );
      if (status === 200) {
        ok(data.message || "Voter deleted.");
        await Promise.all([loadVoters(), loadCurrent()]);
      } else {
        fail(data.message || "Failed to delete voter.");
      }
    } catch {
      fail("Failed to delete voter.");
    } finally {
      setRemovingVoterId(null);
    }
  };

  // Quick-Issue Desk: issue (or look up) a voter ID in one submit. Sends the
  // admin key so an already-registered phone returns its existing ID without
  // needing a name match — the volunteer just reads it out.
  const issueVoter = async (e) => {
    e?.preventDefault();
    const phoneDigits = deskPhone.replace(/\D/g, "");
    const trimmedName = deskName.trim();

    if (!trimmedName) {
      fail("Enter the person's name.");
      return;
    }
    if (!/^\d{7,15}$/.test(phoneDigits)) {
      fail("Enter a valid phone number (7-15 digits).");
      return;
    }

    setDeskIssuing(true);
    try {
      const res = await fetch(`${API_URL}/api/voting/voters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          name: trimmedName,
          phone: phoneDigits,
          type: deskType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.voter) {
        fail(data.message || "Failed to issue Voter ID.");
        return;
      }
      setDeskIssued({
        voterId: data.voter.voterId,
        name: data.voter.name || trimmedName,
        phone: data.voter.phone || phoneDigits,
        type: data.voter.type || deskType,
        isNew: res.status === 201,
      });
      setDeskCopied("");
      ok(
        res.status === 201
          ? `Voter ID ${data.voter.voterId} issued.`
          : `Already registered — showing existing Voter ID ${data.voter.voterId}.`,
      );
      loadVoters();
    } catch {
      fail("Failed to issue Voter ID.");
    } finally {
      setDeskIssuing(false);
    }
  };

  const deskTicketLink = (voterId) =>
    `${window.location.origin}/voting?voterId=${encodeURIComponent(voterId)}`;

  const copyDeskText = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setDeskCopied(field);
      window.setTimeout(() => {
        setDeskCopied((current) => (current === field ? "" : current));
      }, 1600);
    } catch {
      fail("Couldn't copy automatically — long-press the text to copy it.");
    }
  };

  // Clear the desk for the next person in the queue.
  const deskNextPerson = () => {
    setDeskIssued(null);
    setDeskName("");
    setDeskPhone("");
    setDeskCopied("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Generate the desk QR locally — no third-party service on event day.
  useEffect(() => {
    let alive = true;
    if (!deskIssued) {
      setDeskQr("");
      return () => {
        alive = false;
      };
    }
    qrDataUrl(deskTicketLink(deskIssued.voterId), 200)
      .then((url) => {
        if (alive) setDeskQr(url);
      })
      .catch(() => {
        if (alive) setDeskQr("");
      });
    return () => {
      alive = false;
    };
  }, [deskIssued]);

  // Wipe all voting data (pre-event test cleanup). Strong confirm because
  // there is no undo — sessions, votes, voters and prizes are gone.
  const resetVotingData = async () => {
    const confirmed = window.confirm(
      "⚠️ RESET ALL VOTING DATA?\n\nThis permanently deletes:\n• the voting session(s)\n• every vote cast\n• every registered voter\n• all recorded prizes\n\nEligible candidate teams are NOT affected.\n\nUse only BEFORE the real event to clear test data. There is no undo.",
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const { status, data } = await adminFetch("/api/voting/reset", {
        method: "POST",
      });
      if (status === 200) {
        ok("All voting data reset — sessions, votes, voters and prizes cleared.");
        setSelectedWinner(null);
        await Promise.all([loadCurrent(), loadVoters(), loadPrizes()]);
      } else {
        fail(data.message || "Reset failed.");
      }
    } catch {
      fail("Reset failed.");
    } finally {
      setResetting(false);
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
    // Starting while a session exists swaps the live tally (votes belong to
    // their session id) — confirm first so a stray click can never discard
    // votes mid-event.
    if (session) {
      const running = session.status === "active";
      const confirmed = window.confirm(
        running
          ? "⚠️ A voting session is still RUNNING.\n\nStarting a new one ends it immediately and starts a FRESH tally — votes from the current session will not carry over.\n\nStart a new session anyway?"
          : "Start a NEW voting session?\n\nThe previous session's tally will no longer be shown. Record the Audience Choice winner first if you haven't yet.\n\nStart new session?",
      );
      if (!confirmed) return;
    }
    setStarting(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { status, data } = await adminFetch("/api/voting/sessions", {
        method: "POST",
        body: JSON.stringify({
          durationMinutes: Number(duration) || 15,
          ...(session ? { force: true } : {}),
        }),
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
    // One-way action: a closed session cannot be reopened, and continuing
    // later requires a NEW session (fresh tally — current votes don't carry
    // over). Confirm so a stray click can never end the window early.
    const confirmed = window.confirm(
      "⚠️ End voting now?\n\nThe audience will no longer be able to vote. A closed session cannot be reopened — if voting must continue, a NEW session has to be started and the current tally will NOT carry over.\n\nEnd the session?",
    );
    if (!confirmed) return;
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
    // Recording the winner closes the session immediately — confirm while
    // voting is still live so a stray click can't end the window early.
    if (votingLive) {
      const confirmed = window.confirm(
        "⚠️ Voting is still LIVE.\n\nRecording the Audience Choice winner closes the session immediately — no more votes can be cast.\n\nRecord the winner and end voting now?",
      );
      if (!confirmed) return;
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
    // Refresh live data every tick — including the voter list so the
    // "Registered Voters" count never shows stale data.
    const poll = setInterval(() => {
      loadCurrent();
      loadVoters();
    }, 10000);
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
  // Podium is locked while votes can still be cast (podium winners leave
  // the live ballot — server enforces this too; this is the early notice).
  const votingLive = session?.status === "active" && timeRemaining > 0;

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

        {/* Quick-Issue Desk — register on-spot voters from the queue */}
        <div className="bg-white/5 border border-amber-400/25 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus size={22} className="text-amber-300" /> Quick-Issue
              Desk
            </h2>
            <p className="text-sm text-white/50">
              Issue Voter IDs without leaving the panel — one person at a time
            </p>
          </div>

          {deskIssued ? (
            <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/5 p-6 text-center max-w-lg mx-auto">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-1">
                {deskIssued.isNew
                  ? "Voter ID issued"
                  : "Already registered — existing Voter ID"}
              </p>
              <p className="font-mono text-2xl md:text-3xl font-bold text-white mb-1">
                {deskIssued.voterId}
              </p>
              <p className="text-sm text-white/60 mb-4">
                {deskIssued.name} · {deskIssued.phone} · {deskIssued.type}
              </p>
              {deskQr ? (
                <img
                  src={deskQr}
                  alt={`QR for ${deskIssued.voterId}`}
                  className="w-44 h-44 mx-auto rounded-lg border border-white/15 bg-white p-2"
                />
              ) : (
                <div className="w-44 h-44 mx-auto rounded-lg border border-white/15 bg-black/40 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white/60" size={24} />
                </div>
              )}
              <p className="text-xs text-white/50 mt-3">
                Have the person scan this — it opens the voting page with their
                Voter ID already filled in.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => copyDeskText(deskIssued.voterId, "id")}
                  className="inline-flex items-center gap-1 text-sm border border-white/20 text-white/80 hover:text-white hover:border-white/50 rounded-lg px-3 py-2"
                >
                  {deskCopied === "id" ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy ID
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    copyDeskText(deskTicketLink(deskIssued.voterId), "link")
                  }
                  className="inline-flex items-center gap-1 text-sm border border-white/20 text-white/80 hover:text-white hover:border-white/50 rounded-lg px-3 py-2"
                >
                  {deskCopied === "link" ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy ticket link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={deskNextPerson}
                  className="bg-white text-black font-bold text-sm rounded-lg px-4 py-2 hover:bg-white/90 transition"
                >
                  Register next person ✓
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={issueVoter} className="mt-5">
              <div className="grid md:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={deskName}
                    onChange={(e) => setDeskName(e.target.value)}
                    autoComplete="off"
                    placeholder="Person's name"
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={deskPhone}
                    onChange={(e) => setDeskPhone(e.target.value)}
                    autoComplete="off"
                    placeholder="7-15 digits"
                    maxLength={15}
                    className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/40"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">
                    Type
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-white/15">
                    {["spectator", "volunteer", "participant"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setDeskType(t)}
                        className={`px-3 py-3 text-sm capitalize transition ${
                          deskType === t
                            ? "bg-white text-black font-bold"
                            : "bg-black/40 text-white/60 hover:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={deskIssuing}
                  className="bg-amber-400 text-black font-bold rounded-lg px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-300 transition whitespace-nowrap"
                >
                  {deskIssuing ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Issue Voter ID"
                  )}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-3">
                Already registered phone? Submitting again shows their existing
                Voter ID instead of making a new one.
              </p>
            </form>
          )}
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
                  <button
                    type="button"
                    onClick={() => removeVoter(v)}
                    disabled={removingVoterId === v.voterId}
                    title="Delete voter and their vote"
                    className="shrink-0 p-1.5 rounded-md border border-white/15 text-white/50 hover:text-red-400 hover:border-red-400/50 transition disabled:opacity-40"
                  >
                    {removingVoterId === v.voterId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                  </button>
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

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm uppercase tracking-widest text-white/50">
              Live leaderboard
            </p>
            <p className="text-sm text-white/50">
              {votesCast} vote{votesCast === 1 ? "" : "s"} cast
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
            {results.length === 0 && (
              <p className="text-white/50">
                No votes yet — the winner will be decided by the audience's votes.
              </p>
            )}
            {results.map((r, idx) => {
              const pct = Number(r.percentage) || 0;
              const isLeader = idx === 0 && r.votes > 0;
              // Podium holders can never also win Audience Choice — flag it
              // right on the leaderboard so the skip is never a surprise.
              const podiumHold = (prizes || []).find(
                (p) =>
                  TOP_TYPES.includes(p.prizeType) &&
                  String(p.registrationId || "").trim().toUpperCase() ===
                    String(r.candidateRegistrationId || "").trim().toUpperCase(),
              );
              const rankColors =
                idx === 0
                  ? "bg-amber-400 text-black"
                  : idx === 1
                  ? "bg-neutral-300 text-black"
                  : idx === 2
                  ? "bg-orange-700/80 text-white"
                  : "bg-white/10 text-white/60";
              return (
                <div
                  key={r.candidateRegistrationId}
                  className={`rounded-xl border px-4 py-3 ${
                    isLeader
                      ? "border-amber-400/50 bg-amber-400/5"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${rankColors}`}
                      >
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {cleanName(r.candidateTeamName)}
                        </p>
                        <p className="text-xs text-white/50">
                          {r.candidateRegistrationId}
                        </p>
                        {podiumHold && (
                          <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300">
                            Holds {PRIZE_LABELS[podiumHold.prizeType]} — not
                            eligible
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-amber-300">{pct}%</p>
                      <p className="text-xs text-white/50">
                        {r.votes} vote{r.votes === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  {/* Bar length = live vote percentage */}
                  <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLeader ? "bg-amber-400" : "bg-amber-400/40"
                      }`}
                      style={{
                        width: `${r.votes > 0 ? Math.max(pct, 1.5) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
            <p className="text-sm text-white/60">
              Decided only by votes — records the highest-voted team that
              doesn't already hold 1st/2nd/3rd.
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
                Not recorded yet — decided by the vote tally above. Teams that
                hold 1st/2nd/3rd are skipped automatically.
              </p>
            )}
          </div>
        </div>

        {/* Podium */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy size={22} /> Audience Choice Podium — Pick Winning Teams
          </h2>

          {votingLive && (
            <div className="mb-5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200 flex items-center gap-2">
              <Lock size={16} className="shrink-0" />
              Voting is LIVE — the podium is locked until voting closes
              (podium winners leave the live ballot).
            </div>
          )}

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
                        disabled={deleting || votingLive}
                        aria-label={`Remove ${PRIZE_LABELS[type]}`}
                        title={
                          votingLive
                            ? "Locked while voting is live"
                            : `Remove ${PRIZE_LABELS[type]}`
                        }
                        className="absolute top-2 right-2 px-1 text-white/40 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
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
                disabled={recording || !podiumSelected || votingLive}
                className="w-full bg-amber-400/90 text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {recording ? (
                  <Loader2 className="animate-spin mx-auto" size={20} />
                ) : (
                  `Assign to ${PRIZE_LABELS[podiumRank]}`
                )}
              </button>
              <p className="text-white/50 text-sm mt-4">
                Order: close voting first — the podium unlocks once the window
                ends (podium winners leave the live ballot). One team per rank —
                assigning replaces the previous holder; use ✕ on a slot above to
                remove. Podium winners automatically give up Audience Choice (no
                team can hold both).
              </p>
            </div>
          </div>
        </div>

        {/* Danger zone — pre-event test cleanup */}
        <div className="bg-white/5 border border-red-500/25 rounded-2xl p-8 mt-8">
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-300">
            <Trash2 size={20} /> Danger zone
          </h2>
          <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
            <p className="text-sm text-white/60 max-w-xl">
              Reset wipes every session, vote, voter and prize so test data
              never reaches the real event — candidate teams stay untouched.
              There is no undo.
            </p>
            <button
              onClick={resetVotingData}
              disabled={resetting}
              className="bg-red-500/90 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {resetting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Trash2 size={18} />
              )}
              Reset All Voting Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
