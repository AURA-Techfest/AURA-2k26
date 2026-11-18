import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Loader2, Play, Square, Users, Trophy, Eye, EyeOff } from "lucide-react";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL =
  rawApiUrl && rawApiUrl !== "undefined"
    ? rawApiUrl.replace(/\/$/, "")
    : import.meta.env.DEV
    ? "http://localhost:5000"
    : "";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [duration, setDuration] = useState(15);
  const [session, setSession] = useState(null);
  const [voters, setVoters] = useState([]);
  const [results, setResults] = useState([]);
  const [starting, setStarting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [podiumQuery, setPodiumQuery] = useState("");
  const [podiumResults, setPodiumResults] = useState([]);
  const [podiumRank, setPodiumRank] = useState("first");
  const [podiumSelected, setPodiumSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const adminFetch = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  const loadVoters = async () => {
    const { status, data } = await adminFetch("/api/voting/voters");
    if (status === 200) {
      setVoters(data.voters || []);
    }
  };

  const loadCurrent = async () => {
    const res = await fetch(`${API_URL}/api/voting/sessions/current`);
    const data = await res.json();
    if (res.ok) {
      setSession(data.session || null);
      setResults(data.results || []);
    }
  };

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
      if (status === 200) {
        setAuthed(true);
      } else if (status === 401) {
        setErrorMessage("Invalid admin key.");
      } else {
        // 500 (e.g. cold start) — let them in, actions will still verify the key.
        setAuthed(true);
      }
    } catch (err) {
      // Network hiccup — allow entry so a slow backend doesn't block the panel.
      setAuthed(true);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    setStarting(true);
    setErrorMessage("");
    try {
      const { status, data } = await adminFetch("/api/voting/sessions", {
        method: "POST",
        body: JSON.stringify({ durationMinutes: Number(duration) || 15 }),
      });
      if (status === 201) {
        setSession(data.session || null);
        alert("Voting session started!");
      } else {
        setErrorMessage(data.message || "Failed to start voting session.");
      }
    } catch (err) {
      setErrorMessage("Failed to start voting session.");
    } finally {
      setStarting(false);
    }
  };

  const closeSession = async () => {
    if (!session?._id) {
      setErrorMessage("No active session found.");
      return;
    }
    setClosing(true);
    setErrorMessage("");
    try {
      const { status, data } = await adminFetch(`/api/voting/sessions/${session._id}/close`, {
        method: "POST",
      });
      if (status === 200) {
        setSession(data.session || null);
        alert("Voting session closed manually.");
      } else {
        setErrorMessage(data.message || "Failed to close voting session.");
      }
    } catch (err) {
      setErrorMessage("Failed to close voting session.");
    } finally {
      setClosing(false);
    }
  };

  const recordWinner = async () => {
    const leader = results?.[0];
    if (!leader) {
      setErrorMessage("No results available yet.");
      return;
    }
    setRecording(true);
    setErrorMessage("");
    try {
      const { status, data } = await adminFetch(`/api/voting/sessions/${session?._id}/winner`, {
        method: "POST",
        body: JSON.stringify({ candidateRegistrationId: leader.candidateRegistrationId }),
      });
      if (status === 200) {
        setSession(data.session || null);
        // Refresh results/session so the recorded winner is reflected.
        const curRes = await fetch(`${API_URL}/api/voting/sessions/current`);
        const curData = await curRes.json();
        if (curRes.ok) {
          setSession(curData.session || null);
          setCandidates(curData.candidates || []);
          setResults(curData.results || []);
        }
        alert(`Audience Choice winner recorded: ${leader.candidateTeamName}`);
      } else {
        setErrorMessage(data.message || "Failed to record winner.");
      }
    } catch (err) {
      setErrorMessage("Failed to record winner.");
    } finally {
      setRecording(false);
    }
  };

  const runPodiumSearch = (qOverride) => {
    const q = (qOverride ?? podiumQuery ?? "").trim().toLowerCase();
    const list = (candidates || []).filter(
      (c) => !q || String(c.teamName || "").toLowerCase().startsWith(q),
    );
    setPodiumResults(list);
  };

  const assignPodiumPrize = async () => {
    if (!podiumSelected) {
      setErrorMessage("Please search and select a team from the dropdown first.");
      return;
    }
    const rankValue = podiumRank === "first" ? 1 : podiumRank === "second" ? 2 : 3;
    setRecording(true);
    setErrorMessage("");
    try {
      const { status, data } = await adminFetch("/api/voting/prizes", {
        method: "POST",
        body: JSON.stringify({
          prizes: [
            {
              registrationId: String(podiumSelected.registrationId || "").trim().toUpperCase(),
              teamName: String(podiumSelected.teamName || "").trim(),
              prizeType: podiumRank,
              rank: rankValue,
            },
          ],
        }),
      });
      if (status === 201) {
        setPodiumSelected(null);
        setPodiumQuery("");
        setPodiumResults([]);
        alert(`Podium prize recorded: ${podiumSelected.teamName} → ${podiumRank}`);
      } else {
        setErrorMessage(data.message || "Failed to record podium prize.");
      }
    } catch (err) {
      setErrorMessage("Failed to record podium prize.");
    } finally {
      setRecording(false);
    }
  };

  const deletePodiumPrize = async () => {
    if (!podiumSelected) {
      setErrorMessage("Select a team first.");
      return;
    }
    setDeleting(true);
    setErrorMessage("");
    try {
      const { status, data } = await adminFetch(
        `/api/voting/prizes/${encodeURIComponent(podiumSelected.registrationId)}/${podiumRank}`,
        { method: "DELETE" },
      );
      if (status === 200) {
        setPodiumSelected(null);
        setPodiumQuery("");
        setPodiumResults([]);
        alert("Podium prize deleted successfully.");
      } else {
        setErrorMessage(data.message || "Failed to delete podium prize.");
      }
    } catch (err) {
      setErrorMessage("Failed to delete podium prize.");
    } finally {
      setDeleting(false);
    }
  };

  // Load data when authed
  useEffect(() => {
    if (!authed) return;
    const load = async () => {
      const votersRes = await adminFetch("/api/voting/voters");
      if (votersRes.status === 200) setVoters(votersRes.data.voters || []);
      const curRes = await fetch(`${API_URL}/api/voting/sessions/current`);
      const curData = await curRes.json();
      if (curRes.ok) {
        setSession(curData.session || null);
        setCandidates(curData.candidates || []);
        setResults(curData.results || []);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // Auto-populate podium candidate list once candidates load (after unlock).
  useEffect(() => {
    if (authed && Array.isArray(candidates)) {
      runPodiumSearch(podiumQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, candidates]);

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

  return (
    <div className="min-h-screen bg-[#0b0909] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-extrabold">AURA Admin — Audience Choice Voting</h1>
          <button
            onClick={() => {
              setAuthed(false);
              setAdminKey("");
            }}
            className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:text-white"
          >
            Lock
          </button>
        </div>

        {errorMessage && (
          <div className="mb-8 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3">
            {errorMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Start / Close session */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Play size={22} /> Voting Session Control
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Duration (minutes, 10–20)</label>
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
                className="w-full bg-white text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {starting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Start Voting Session"}
              </button>
              <button
                onClick={closeSession}
                disabled={closing || !session}
                className="w-full bg-red-500/90 text-white font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {closing ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Close Voting Session"}
              </button>
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
                <div key={v.voterId} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-4 py-2">
                  <div>
                    <p className="font-semibold">{v.name}</p>
                    <p className="text-xs text-white/50">{v.voterId} · {v.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Podium / winner selection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy size={22} /> Audience Choice Podium — Pick Winning Teams
          </h2>
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
                    <p className="font-semibold">{c.teamName}</p>
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
                    <p className="font-bold">{podiumSelected.teamName}</p>
                    <p className="text-xs text-white/50">{podiumSelected.registrationId}</p>
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
                {recording ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Assign Winner & Record"}
              </button>
              <button
                onClick={deletePodiumPrize}
                disabled={deleting || !podiumSelected}
                className="w-full bg-red-500/90 text-white font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed mt-3"
              >
                {deleting ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Delete This Prize"}
              </button>
              <p className="text-white/50 text-sm mt-4">
                Records the chosen team as the podium winner and marks them ineligible for future Audience Choice votes.
              </p>
            </div>
          </div>
        </div>

        {/* Results / winner */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy size={22} /> Results & Winner
          </h2>
          <button
            onClick={recordWinner}
            disabled={recording || !session}
            className="w-full bg-amber-400/90 text-black font-bold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {recording ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Record Audience Choice Winner"}
          </button>
          <p className="text-white/50 text-sm mt-4">
            Records the current leader as the Audience Choice winner and closes the session.
          </p>
        </div>
      </div>
    </div>
  );
}
