import React, { useEffect, useState, useRef, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Search, Plus, Filter, RotateCw, Trophy, AlertTriangle, Check, Sparkles, Gem, Award, LogOut, Edit3 } from 'lucide-react';
import FashionBackground from '../components/FashionBackground';

function Marks() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [outOfByRound, setOutOfByRound] = useState({});
  const [selectedRound, setSelectedRound] = useState('');
  const [newRound, setNewRound] = useState('');
  const [newRoundOutOf, setNewRoundOutOf] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRound, setEditingRound] = useState('');
  const [editRoundName, setEditRoundName] = useState('');
  const [editRoundOutOf, setEditRoundOutOf] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ALL');
  const [allProblemStatements, setAllProblemStatements] = useState([]);
  const updateTimeoutRef = useRef(null);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminPassword('');
    setAuthError('');
  };

  const handlePasswordSubmit = async () => {
    if (!adminPassword.trim()) {
      setAuthError('Please enter jury passcode');
      return;
    }

    setAuthenticating(true);
    setAuthError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/verify-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminPassword })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid jury passcode');
      }

      setIsAuthenticated(true);
      setLoading(true);
      setAdminPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthenticating(false);
    }
  };

  const fetchMarksBoard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks-board`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch marks board');
      }

      const availableRounds = data.rounds || [];
      setRounds(availableRounds);
      setOutOfByRound(data.outOfByRound || {});
      setAllProblemStatements(data.problemStatements || []);
      setTeams(data.data || []);
      setSelectedRound((prev) => {
        if (prev && availableRounds.includes(prev)) {
          return prev;
        }
        return availableRounds[0] || '';
      });
    } catch (err) {
      setError(err.message || 'Unable to load marks board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMarksBoard();
    }
  }, [isAuthenticated]);

  const handleCreateRound = async () => {
    if (!newRound.trim()) {
      setError('Round title is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const numericOutOf = Number(newRoundOutOf);
    if (!numericOutOf || numericOutOf <= 0) {
      setError('Please provide a valid maximum score for this round');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rounds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roundName: newRound.trim(),
          outOf: numericOutOf
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create round');
      }

      setRounds((prev) => [...prev, newRound.trim()]);
      setOutOfByRound((prev) => ({
        ...prev,
        [newRound.trim()]: numericOutOf
      }));
      setSelectedRound(newRound.trim());
      setNewRound('');
      setNewRoundOutOf('');
      setShowModal(false);
      setMessage('New evaluation round created successfully');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError(err.message || 'Unable to create round');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEditRound = async () => {
    if (!editRoundName.trim()) {
      setError('Round title is required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const numericOutOf = Number(editRoundOutOf);
    if (!numericOutOf || numericOutOf <= 0) {
      setError('Please provide a valid maximum score');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/rounds/${encodeURIComponent(editingRound)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newRoundName: editRoundName.trim(),
          outOf: numericOutOf
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update round');
      }

      setRounds((prev) => prev.map(r => r === editingRound ? editRoundName.trim() : r));

      setOutOfByRound((prev) => {
        const updated = { ...prev };
        if (editingRound !== editRoundName.trim()) {
          delete updated[editingRound];
        }
        updated[editRoundName.trim()] = numericOutOf;
        return updated;
      });

      setTeams((prev) =>
        prev.map((team) => {
          if (editingRound !== editRoundName.trim()) {
            const updatedRoundMarks = { ...team.roundMarks };
            if (updatedRoundMarks[editingRound] !== undefined) {
              updatedRoundMarks[editRoundName.trim()] = updatedRoundMarks[editingRound];
              delete updatedRoundMarks[editingRound];
            }
            return {
              ...team,
              roundMarks: updatedRoundMarks
            };
          }
          return team;
        })
      );

      if (selectedRound === editingRound) {
        setSelectedRound(editRoundName.trim());
      }

      setMessage('Evaluation round updated successfully');
      setTimeout(() => setMessage(''), 2000);
      setShowEditModal(false);
      setEditingRound('');
      setEditRoundName('');
      setEditRoundOutOf('');
    } catch (err) {
      setError(err.message || 'Unable to update round');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkChange = (teamName, roundName, value) => {
    const mark = value === '' ? 0 : Number(value);
    if (!Number.isFinite(mark)) {
      return;
    }

    const roundOutOf = Number(outOfByRound?.[roundName]);
    const maxMark = Number.isFinite(roundOutOf) && roundOutOf > 0 ? roundOutOf : Infinity;
    const normalizedMark = Math.max(0, Math.min(mark, maxMark));

    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamName === teamName) {
          const updatedRoundMarks = {
            ...team.roundMarks,
            [roundName]: normalizedMark
          };
          const total = Object.values(updatedRoundMarks).reduce((sum, val) => sum + val, 0);
          return {
            ...team,
            roundMarks: updatedRoundMarks,
            total
          };
        }
        return team;
      })
    );

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      setError('');

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/marks`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ teamName, roundName, mark: normalizedMark })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to update score');
        }
      } catch (err) {
        setError(err.message || 'Unable to update score');
        setTimeout(() => setError(''), 3000);
      } finally {
        setSaving(false);
      }
    }, 3000);
  };

  const selectedRoundOutOf = Number(outOfByRound?.[selectedRound]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => (b.total || 0) - (a.total || 0));
  }, [teams]);

  const themesList = useMemo(() => {
    const set = new Set(allProblemStatements);
    teams.forEach((t) => {
      const th = t.theme || t.selectedProblemStatement?.title;
      if (th) set.add(th);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [teams, allProblemStatements]);

  const filteredTeams = useMemo(() => {
    return sortedTeams.filter((team) => {
      const matchesSearch = team.teamName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const teamTheme = team.theme || team.selectedProblemStatement?.title || "Unassigned";
      const matchesTheme =
        selectedTheme === "ALL" || teamTheme === selectedTheme;
      return matchesSearch && matchesTheme;
    });
  }, [sortedTeams, searchQuery, selectedTheme]);

  const podium = useMemo(() => {
    return filteredTeams.slice(0, 3);
  }, [filteredTeams]);

  const getRankMedal = (rankIndex) => {
    if (rankIndex === 0) return { label: "👑 GRAND DESIGNER (1ST)", color: "bg-gradient-to-r from-[#556B2F] to-[#708238] text-white font-bold" };
    if (rankIndex === 1) return { label: "✦ PREMIER HACKATHON (2ND)", color: "bg-white/10 text-white border border-white/20 font-bold" };
    if (rankIndex === 2) return { label: "✦ 2ND RUNNER UP (3RD)", color: "bg-white/5 text-gray-300 border border-white/10 font-bold" };
    return null;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-16 text-[#fdf3f7] relative overflow-x-hidden">
        {/* Pitch Black Fashion Tech Grid Background */}
        <FashionBackground />

        <Navbar />
        <div className="flex-grow flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-28 relative z-10">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-lg bg-[#0B0616]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#556B2F] to-[#708238] text-white border-b border-l border-white/20 px-4 py-1.5 font-['Cinzel'] text-xs tracking-widest font-bold rounded-tr-3xl shadow-sm">
              JURY AUTHENTICATION
            </div>

            <div className="relative text-center mt-3 flex flex-col items-center">
              <h1 className="text-2xl sm:text-3xl font-['Montserrat'] font-black text-white tracking-tight uppercase leading-none mb-2">
                JURY SCORING BOARD
              </h1>
              <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed font-normal">
                Authenticate your jury access key to evaluate competition rounds and update scoreboards.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePasswordSubmit();
              }}
              className="relative mt-6 space-y-4 text-left"
            >
              <div>
                <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                  JURY ACCESS KEY
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full h-11 bg-black/60 backdrop-blur-md text-white border border-white/15 rounded-xl px-4 focus:border-[#880A45] focus:bg-black/80 outline-none transition font-medium text-xs shadow-xs"
                  placeholder="Enter jury passcode"
                  required
                />
              </div>

              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/80 p-3 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm flex items-center gap-2"
                  >
                    <AlertTriangle size={16} className="text-rose-400" />
                    <span>{authError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={authenticating}
                className="w-full h-12 rounded-xl font-['Cinzel'] font-bold text-xs tracking-widest bg-gradient-to-r from-[#556B2F] to-[#708238] text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase"
              >
                {authenticating ? "OPENING JURY VAULT..." : "ENTER JURY ARENA »"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-16 text-[#fdf3f7] justify-center items-center relative overflow-hidden">
        <FashionBackground />
        <p className="relative z-10 font-['Cinzel'] text-base sm:text-xl text-gray-200 tracking-widest font-bold drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          SYNCHRONIZING HACKATHON SCOREBOARDS...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-16 text-[#fdf3f7] relative overflow-x-hidden">
      {/* Interactive Pitch Black Tech Background with Grid */}
      <FashionBackground />

      <Navbar />

      {/* Full-Page Expanded Main Canvas */}
      <div className="flex-grow w-full px-4 sm:px-8 md:px-12 pt-24 sm:pt-28 relative z-10">

        {/* TopHeader Bar with [#880A45] -> [#14216F] Ambient Glow */}
        <header className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.85)] text-left">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#880A45]/30 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-20 right-0 w-72 h-72 bg-[#14216F]/30 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-['Montserrat'] font-black tracking-tight uppercase mb-1 text-white">
              HACKATHON JURY LEADERBOARD
            </h1>
            <p className="bg-gradient-to-r from-pink-300 via-rose-200 to-indigo-300 bg-clip-text text-transparent font-['Cinzel'] text-xs tracking-widest font-bold uppercase">
              Evaluation Scoring Matrix & Team Standings
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 relative z-10 font-['Cinzel'] text-xs font-bold">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 sm:px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 transition-colors uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
            <button
              type="button"
              onClick={fetchMarksBoard}
              disabled={loading}
              className="px-4 sm:px-5 py-2 rounded-xl bg-[#880A45] hover:bg-[#9E0D52] text-white transition-all shadow-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-[#880A45]/40"
              title="Sync & Refresh Leaderboard"
            >
              <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#556B2F] to-[#708238] hover:opacity-90 text-white transition-all shadow-md uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-[#880A45]/50"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Round
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-500/40 rounded-2xl p-4 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm mb-6 flex items-center gap-2 text-left">
            <AlertTriangle size={16} className="text-rose-400" />
            <span>{error}</span>
          </div>
        )}
        {/* Global Success Banner */}
        {message && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 text-emerald-200 font-['Cinzel'] text-xs tracking-wider shadow-sm mb-6 flex items-center gap-2 text-left">
            <Check size={16} className="text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* HACKATHON PODIUM SCOREBOARD */}
        {podium.length > 0 && (
          <div className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.85)] relative mb-8 text-left">
            <div className="absolute -top-3 left-6 bg-gradient-to-r from-[#556B2F] to-[#708238] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
              Hackathon Podium
            </div>

            <h3 className="text-lg sm:text-xl font-['Montserrat'] font-black text-white text-left mb-4 flex items-center gap-2 uppercase tracking-wide mt-1">
              <Crown className="w-5 h-5 text-amber-300" /> HACKATHON LAUREATES
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {podium.map((team, idx) => {
                const medal = getRankMedal(idx);
                const isGrand = idx === 0;

                return (
                  <motion.div
                    key={team._id}
                    whileHover={{ y: -2 }}
                    className={`border rounded-2xl p-4 flex items-center justify-between transition-all backdrop-blur-md ${
                      isGrand
                        ? "bg-[#180D22]/95 border-l-4 border-l-[#880A45] border-t border-r border-b border-[#880A45]/35 shadow-[0_0_20px_rgba(136,10,69,0.18)]"
                        : "bg-white/5 border border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="text-left">
                      {medal && (
                        <span className={`inline-block font-['Cinzel'] text-[9px] font-bold rounded-full px-2.5 py-0.5 mb-1.5 ${medal.color}`}>
                          {medal.label}
                        </span>
                      )}
                      <h4 className="font-['Montserrat'] font-bold text-base text-white leading-tight">
                        {team.teamName}
                      </h4>
                      <p className="text-[10px] font-['Cinzel'] text-pink-300 font-semibold mt-1 flex items-center gap-1">
                        ✦ {team.theme || team.selectedProblemStatement?.title || "Unassigned"}
                      </p>
                    </div>

                    {/* Total Score Badge */}
                    <div className="bg-black/60 border border-white/15 rounded-xl p-2 text-center min-w-[65px] shadow-sm">
                      <span className="font-['Cinzel'] font-bold text-xl text-white block leading-none">{team.total ?? 0}</span>
                      <span className="text-[8px] font-['Cinzel'] font-bold text-pink-300 tracking-widest block leading-none mt-1 uppercase">PTS</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Rounds Selector Tabs */}
        <div className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.85)] mb-8 text-left relative">
          <div className="absolute -top-3 left-6 bg-gradient-to-r from-[#556B2F] to-[#708238] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
            Active Stage Select
          </div>

          <h3 className="text-[10px] font-['Cinzel'] font-bold text-gray-400 tracking-widest uppercase mb-3 mt-1">
            EVALUATION ROUNDS
          </h3>

          {rounds.length === 0 ? (
            <p className="text-gray-400 font-normal italic text-xs">
              No evaluation stages deployed yet. Click "+ CREATE ROUND" above to initialize a judging stage.
            </p>
          ) : (
            <div className="flex gap-2.5 flex-wrap font-['Cinzel'] text-xs font-bold">
              {rounds.map((round) => {
                const isSelected = selectedRound === round;
                return (
                  <div key={round} className="flex gap-1 items-center">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      type="button"
                      onClick={() => setSelectedRound(round)}
                      className={`px-5 py-2 rounded-xl cursor-pointer transition-all uppercase tracking-wider ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#556B2F] to-[#708238] text-white shadow-md border border-[#880A45]/50'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {round.toUpperCase()}
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingRound(round);
                        setEditRoundName(round);
                        setEditRoundOutOf(String(outOfByRound[round] || ''));
                        setShowEditModal(true);
                      }}
                      className="p-2 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition cursor-pointer text-xs"
                      title="Edit stage parameters"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-pink-300" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Table & Controls Section */}
        {teams.length === 0 ? (
          <div className="bg-[#0B0616]/90 border border-dashed border-white/15 rounded-2xl p-8 text-center font-['Cinzel'] text-xs text-gray-400 font-semibold tracking-wider uppercase">
            NO TEAMS ENROLLED IN HACKATHON JURY DATABASE YET.
          </div>
        ) : (
          <>
            {/* Search and Theme filter */}
            <div className="mb-6 bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 p-5 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.85)] relative text-left">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="relative flex-1 w-full flex items-center">
                  <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by team name..."
                    className="w-full h-11 bg-black/60 backdrop-blur-md border border-white/15 rounded-xl pl-10 pr-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                  />
                </div>

                {/* Theme Filter Dropdown */}
                <div className="relative w-full md:w-80 flex items-center">
                  <Filter className="absolute left-3.5 w-4 h-4 text-pink-300 pointer-events-none z-10" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full h-11 bg-black/60 backdrop-blur-md border border-white/15 rounded-xl pl-10 pr-8 focus:border-[#880A45] outline-none font-['Cinzel'] font-bold text-xs text-white appearance-none cursor-pointer"
                  >
                    <option value="ALL">ALL DESIGN BRIEFS ({teams.length})</option>
                    {themesList
                      .filter((t) => t !== "ALL")
                      .map((theme) => {
                        const count = teams.filter(
                          (t) =>
                            (t.theme || t.selectedProblemStatement?.title || "Unassigned") ===
                            theme
                        ).length;
                        return (
                          <option key={theme} value={theme}>
                            {theme.toUpperCase()} ({count})
                          </option>
                        );
                      })}
                  </select>
                  <div className="absolute right-3.5 pointer-events-none text-xs text-pink-300">
                    ▼
                  </div>
                </div>
              </div>

              {/* Quick Theme Filter Chips */}
              {themesList.length > 2 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-3.5 pt-3.5 border-t border-white/10 text-xs">
                  <span className="text-gray-400 font-['Cinzel'] text-[10px] font-bold mr-1 uppercase">FILTER:</span>
                  {themesList.map((theme) => {
                    const isSelected = selectedTheme === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        onClick={() => setSelectedTheme(theme)}
                        className={`px-3 py-1 rounded-full transition-all cursor-pointer font-['Cinzel'] text-[10px] font-bold ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#556B2F] to-[#708238] text-white shadow-sm'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {theme === "ALL" ? "ALL BRIEFS" : theme}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scoreboard Table Glass Card */}
            <div className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.85)] overflow-hidden">
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-black/70 text-gray-300 font-['Cinzel'] text-xs tracking-wider border-b border-white/15">
                      <th className="px-4 py-3.5 text-left border-r border-white/10">TEAM NAME</th>
                      <th className="px-4 py-3.5 text-left border-r border-white/10">DESIGN BRIEF ASSIGNMENT</th>
                      <th className="px-4 py-3.5 text-center border-r border-white/10">
                        {selectedRound
                          ? `${selectedRound.toUpperCase()} (MAX: ${Number.isFinite(selectedRoundOutOf) ? selectedRoundOutOf : '-'})`
                          : 'SELECT ACTIVE STAGE'}
                      </th>
                      <th className="px-4 py-3.5 text-center">GRAND TOTAL SCORE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.map((team, index) => {
                      const roundValue = selectedRound ? team.roundMarks?.[selectedRound] ?? 0 : 0;
                      const rankIdx = teams.findIndex(t => t.teamName === team.teamName);

                      return (
                        <tr
                          key={team._id}
                          className="border-b border-white/10 transition-colors hover:bg-white/5"
                        >
                          <td className="px-4 py-3.5 border-r border-white/10 font-['Montserrat'] font-bold text-sm text-white flex items-center gap-2 text-left">
                            {rankIdx < 3 ? (
                              <span className="text-base leading-none">
                                {rankIdx === 0 ? "🥇" : rankIdx === 1 ? "🥈" : "🥉"}
                              </span>
                            ) : (
                              <span className="font-['Cinzel'] text-[10px] text-gray-400 border border-white/10 rounded px-1.5 min-w-[20px] text-center inline-block">
                                #{rankIdx + 1}
                              </span>
                            )}
                            {team.teamName}
                          </td>

                          <td className="px-4 py-3.5 border-r border-white/10 text-left">
                            <span className="inline-block bg-[#880A45]/30 border border-[#880A45]/50 px-2.5 py-1 rounded-lg font-['Cinzel'] font-bold text-[11px] text-pink-300">
                              ✦ {team.theme || team.selectedProblemStatement?.title || "Unassigned"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 border-r border-white/10 text-center">
                            {selectedRound ? (
                              <div className="inline-flex py-1 px-2.5 bg-black/60 border border-white/15 rounded-xl focus-within:border-[#880A45] transition-all">
                                <input
                                  className="w-14 p-0 bg-transparent border-0 text-center text-white font-['Cinzel'] font-bold text-sm outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  style={{ MozAppearance: 'textfield' }}
                                  type="number"
                                  value={roundValue}
                                  onChange={(e) => handleMarkChange(team.teamName, selectedRound, e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                            ) : (
                              <span className="text-gray-400 font-['Cinzel'] text-xs italic">SELECT ROUND</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-center font-['Cinzel'] font-bold text-base text-white">
                            <motion.div
                              key={team.total}
                              animate={{ scale: [1, 1.05, 1] }}
                              className="inline-block bg-[#880A45]/25 border border-[#880A45]/50 px-4 py-1 rounded-full shadow-sm text-pink-200"
                            >
                              {team.total ?? 0} PTS
                            </motion.div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredTeams.length === 0 && (
                  <div className="p-8 text-center text-gray-400 font-['Cinzel'] text-xs font-semibold tracking-wider uppercase">
                    NO TEAMS FOUND MATCHING "{searchQuery}" {selectedTheme !== "ALL" ? `AND BRIEF "${selectedTheme}"` : ""}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Round Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-[#0B0616]/95 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-[#556B2F] to-[#708238] text-white font-['Cinzel'] text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-lg shadow-sm">
                NEW EVALUATION STAGE
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="absolute -top-3.5 right-4 bg-black/80 text-gray-300 border border-white/20 font-['Cinzel'] text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm cursor-pointer hover:bg-white/10 transition"
              >
                ✕ CLOSE
              </button>

              <h3 className="text-xl font-['Montserrat'] font-bold text-white mb-3.5 mt-2 uppercase">
                ADD HACKATHON EVALUATION ROUND
              </h3>

              <div className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    ROUND TITLE
                  </label>
                  <input
                    type="text"
                    value={newRound}
                    onChange={(e) => setNewRound(e.target.value)}
                    placeholder="e.g. Round 1: Concept & Silhouette"
                    className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !saving) handleCreateRound();
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    MAXIMUM SCORE (OUT OF)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRoundOutOf}
                    onChange={(e) => setNewRoundOutOf(e.target.value)}
                    placeholder="e.g. 50 or 100"
                    className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateRound}
                  disabled={saving}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#556B2F] to-[#708238] text-white font-['Cinzel'] font-bold tracking-widest uppercase transition cursor-pointer shadow-md"
                >
                  {saving ? "INITIALIZING STAGE..." : "ESTABLISH ROUND »"}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Round Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-[#0B0616]/95 backdrop-blur-2xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-[#556B2F] to-[#708238] text-white font-['Cinzel'] text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-lg shadow-sm">
                EDIT STAGE
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute -top-3.5 right-4 bg-black/80 text-gray-300 border border-white/20 font-['Cinzel'] text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm cursor-pointer hover:bg-white/10 transition"
              >
                ✕ CLOSE
              </button>

              <h3 className="text-xl font-['Montserrat'] font-bold text-white mb-3.5 mt-2 uppercase">
                MODIFY EVALUATION STAGE
              </h3>

              <div className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    ROUND TITLE
                  </label>
                  <input
                    type="text"
                    value={editRoundName}
                    onChange={(e) => setEditRoundName(e.target.value)}
                    className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    MAXIMUM EVALUATION SCORE
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editRoundOutOf}
                    onChange={(e) => setEditRoundOutOf(e.target.value)}
                    className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                  />
                </div>
                <div className="flex gap-3 pt-3 border-t border-white/15 font-['Cinzel'] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 rounded-xl py-2.5 transition cursor-pointer uppercase"
                  >
                    CANCEL
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleEditRound}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-[#880A45] to-[#14216F] text-white rounded-xl py-2.5 shadow-md transition cursor-pointer font-bold uppercase"
                  >
                    {saving ? 'UPDATING...' : 'SAVE MODIFICATIONS'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Marks;