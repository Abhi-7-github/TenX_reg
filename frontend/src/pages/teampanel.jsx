import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Check, Users, Gem, Scissors, AlertTriangle, Sparkles, RotateCw, LogOut, ExternalLink, FileText } from "lucide-react";
import FashionBackground from "../components/FashionBackground";

const TEAM_KEY_STORAGE = "teamPanel.teamKey";
const MAX_TEAMS_PER_PROBLEM = 10;

const TeamPanel = () => {
  const [teamKey, setTeamKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [team, setTeam] = useState(null);
  const [view, setView] = useState("access"); // access | dashboard
  const [didRestore, setDidRestore] = useState(false);
  const [problems, setProblems] = useState([]);
  const [didLoadProblems, setDidLoadProblems] = useState(false);
  const [areProblemsDisabled, setAreProblemsDisabled] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState(null);
  const [detailsProblemId, setDetailsProblemId] = useState(null);
  const [isSelectedExpanded, setIsSelectedExpanded] = useState(false);
  const [problemsError, setProblemsError] = useState("");
  const [zoomedImage, setZoomedImage] = useState(null);

  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionSuccess, setSubmissionSuccess] = useState("");

  const handleSubmissionChange = (idx, field, value) => {
    setTeam((prev) => {
      if (!prev) return prev;
      const nextSubmissions = prev.submissions ? [...prev.submissions] : [];
      while (nextSubmissions.length <= idx) {
        nextSubmissions.push({ canvaFigmaLink: "", note: "", isSubmitted: false, submittedAt: null });
      }
      nextSubmissions[idx] = { ...nextSubmissions[idx], [field]: value };
      return { ...prev, submissions: nextSubmissions };
    });
  };

  const handleSubmitSubmission = async (idx) => {
    setSubmissionError("");
    setSubmissionSuccess("");

    const subs = team?.submissions || [];
    const sub = subs[idx] || { canvaFigmaLink: "", note: "" };

    const link = (sub.canvaFigmaLink || "").trim();
    const note = (sub.note || "").trim();

    if (!link) {
      setSubmissionError("Canva / Figma design project URL is required.");
      return;
    }

    const confirmSubmit = window.confirm(
      "Are you sure you want to submit your design link? Once submitted, it cannot be edited."
    );
    if (!confirmSubmit) return;

    setIsSubmittingForm(true);
    try {
      const teamName = String(team?.teamName || "").trim();
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(teamName)}/submit-form/${idx}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            canvaFigmaLink: link,
            note: note,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setSubmissionError(data?.message || "Failed to submit design project.");
        return;
      }

      setSubmissionSuccess(`Design submission #${idx + 1} logged successfully!`);
      setTeam(data.data);
    } catch {
      setSubmissionError("Unable to connect to the server.");
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const teamSubmissions = useMemo(() => {
    if (team?.submissions && team.submissions.length > 0) {
      return team.submissions;
    }
    return [{ canvaFigmaLink: "", note: "", isSubmitted: false, submittedAt: null }];
  }, [team?.submissions]);

  const refreshTeamData = async () => {
    const key = String(team?.teamName || teamKey || "").trim();
    if (!key) return;
    setIsLoading(true);
    try {
      const [teamRes, probRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(key)}`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/problems`)
      ]);
      const [teamData, probData] = await Promise.all([
        teamRes.json().catch(() => null),
        probRes.json().catch(() => null)
      ]);
      if (teamData?.success && teamData.data) {
        setTeam(teamData.data);
        const dbSelected = String(teamData.data.selectedProblemStatement || "").trim();
        if (dbSelected) setSelectedProblemId(dbSelected);
      }
      if (probData?.success && Array.isArray(probData.data)) {
        const normalized = probData.data
          .map((p) => ({
            id: String(p._id || ""),
            title: p.title || "",
            themePng: p.themePng || "",
            shortDescription: p.shortDescription || "",
            fullDescription: p.fullDescription || "",
            slotsTaken: Number(p.slotsTaken || 0),
            limit: Number(p.limit || 7),
          }))
          .filter((p) => p.id && p.title && p.shortDescription);
        setProblems(normalized);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (didRestore) return;
    setDidRestore(true);

    const storedKey = localStorage.getItem(TEAM_KEY_STORAGE);
    const normalized = (storedKey || "").trim();
    if (!normalized) return;

    setTeamKey(normalized);
    setIsLoading(true);
    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(normalized)}`,
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          localStorage.removeItem(TEAM_KEY_STORAGE);
          return;
        }

        setTeam(data.data);
        const dbSelected = String(
          data?.data?.selectedProblemStatement || "",
        ).trim();
        if (dbSelected) {
          setSelectedProblemId(dbSelected);
        }
        setView("dashboard");
      } catch {
        // keep user on access screen
      } finally {
        setIsLoading(false);
      }
    })();
  }, [didRestore]);

  useEffect(() => {
    let cancelled = false;
    setProblemsError("");
    setDidLoadProblems(false);
    setAreProblemsDisabled(false);
    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/problems`,
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success || !Array.isArray(data?.data)) {
          return;
        }

        if (data?.disabled && !cancelled) {
          setAreProblemsDisabled(true);
          setProblems([]);
          return;
        }

        if (!cancelled) setAreProblemsDisabled(false);

        const normalized = data.data
          .map((p) => ({
            id: String(p._id || ""),
            title: p.title || "",
            themePng: p.themePng || "",
            shortDescription: p.shortDescription || "",
            fullDescription: p.fullDescription || "",
            slotsTaken: Number(p.slotsTaken || 0),
            limit: Number(p.limit || 7),
          }))
          .filter((p) => p.id && p.title && p.shortDescription);

        if (!cancelled) {
          setProblems(normalized);
        }
      } catch {
        if (!cancelled) setProblemsError("");
      } finally {
        if (!cancelled) setDidLoadProblems(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!didLoadProblems) return;
    if (!selectedProblemId) return;
    if (areProblemsDisabled) return;
    const exists = problems.some((p) => p.id === selectedProblemId);
    if (exists) return;

    setSelectedProblemId(null);
  }, [didLoadProblems, problems, selectedProblemId, areProblemsDisabled]);

  const selectedProblem = useMemo(() => {
    return problems.find((p) => p.id === selectedProblemId) || null;
  }, [problems, selectedProblemId]);

  const detailsProblem = useMemo(() => {
    return problems.find((p) => p.id === detailsProblemId) || null;
  }, [problems, detailsProblemId]);

  const visibleProblems = useMemo(() => {
    if (selectedProblemId) return problems;
    return problems.filter((p) => (p.slotsTaken || 0) < (p.limit || MAX_TEAMS_PER_PROBLEM));
  }, [problems, selectedProblemId]);

  const members = useMemo(() => {
    if (!team) return [];

    const safe = (m) =>
      m
        ? {
          name: m.name || "",
          regNo: m.regNo ?? "",
          gender: m.gender || "",
          phoneNo: m.phoneNo || "",
          year: m.year || "",
          branch: m.branch || "",
          section: m.section || "",
          residenceType: m.residenceType || "dayScholar",
          hostelName: m.hostelName || "",
          roomNo: m.roomNo || "",
          wardenName: m.wardenName || "",
          wardenPhoneNo: m.wardenPhoneNo || "",
        }
        : null;

    return [
      { role: "Lead", label: "Lead", ...safe(team.teamLeader) },
      { role: "Associate 1", label: "Associate 1", ...safe(team.teamMember1) },
      { role: "Associate 2", label: "Associate 2", ...safe(team.teamMember2) },
      { role: "Associate 3", label: "Associate 3", ...safe(team.teamMember3) },
    ].filter((m) => m && m.name);
  }, [team]);

  const handleSubmitKey = async (e) => {
    e.preventDefault();
    setError("");

    const normalized = teamKey.trim();
    if (!normalized) {
      setError("Please enter your registered Team Name / Key.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(normalized)}`,
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message || "Invalid Team Key.");
        return;
      }

      setTeam(data.data);
      const dbSelected = String(
        data?.data?.selectedProblemStatement || "",
      ).trim();
      if (dbSelected) {
        setSelectedProblemId(dbSelected);
      }
      localStorage.setItem(TEAM_KEY_STORAGE, normalized);
      setView("dashboard");
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setTeam(null);
    setTeamKey("");
    setError("");
    setSelectedProblemId(null);
    setDetailsProblemId(null);
    setIsSelectedExpanded(false);
    localStorage.removeItem(TEAM_KEY_STORAGE);
    setView("access");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-16 text-[#fdf3f7] relative overflow-x-hidden">
      {/* Interactive Pitch Black Tech Background with Grid */}
      <FashionBackground />

      <Navbar />

      {/* Full-Page Expanded Main Canvas */}
      <div className="flex-grow w-full px-4 sm:px-8 md:px-12 pt-24 sm:pt-28 relative z-10">
        {view === "access" ? (
          /* Team Access Screen */
          <div className="min-h-[calc(100vh-180px)] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-lg bg-[#0B0616]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#880A45] to-[#14216F] text-white border-b border-l border-white/20 px-4 py-1.5 font-['Cinzel'] text-xs tracking-widest font-bold rounded-tr-3xl shadow-sm">
                TEAM PORTAL
              </div>

              <div className="relative text-center mt-3 flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl font-['Montserrat'] font-black text-white tracking-tight uppercase leading-none mb-2">
                  TEAM LOGIN
                </h1>
                <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed font-normal">
                  Enter your registered Team Name to access your fashion tech hackathon console.
                </p>
              </div>

              <form onSubmit={handleSubmitKey} className="relative mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    TEAM NAME / KEY
                  </label>
                  <input
                    type="text"
                    value={teamKey}
                    onChange={(e) => setTeamKey(e.target.value)}
                    placeholder="e.g. Neon Weavers"
                    className="w-full h-11 bg-black/60 backdrop-blur-md text-white border border-white/15 rounded-xl px-4 focus:border-[#880A45] focus:bg-black/80 outline-none transition font-medium text-xs shadow-xs"
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-xl border border-rose-500/40 bg-rose-950/80 p-3 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm flex items-center gap-2"
                    >
                      <AlertTriangle size={16} className="text-rose-400" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-['Cinzel'] font-bold text-xs tracking-widest bg-gradient-to-r from-[#880A45] to-[#14216F] text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase"
                >
                  {isLoading ? "AUTHENTICATING..." : "ENTER TEAM CONSOLE »"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Full-Page Expanded Team Dashboard View */
          <div className="w-full">
            
            {/* TopHeader Bar with Gradient Accent */}
            <header className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.85)] text-left">
              {/* Background ambient glow matching [#880A45] -> [#14216F] */}
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#880A45]/30 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-20 right-0 w-72 h-72 bg-[#14216F]/30 rounded-full blur-[90px] pointer-events-none" />
              
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-['Montserrat'] font-black tracking-tight uppercase mb-1 text-white">
                  Team Design Console
                </h1>
                <p className="bg-gradient-to-r from-pink-300 via-rose-200 to-indigo-300 bg-clip-text text-transparent font-['Cinzel'] text-xs tracking-widest font-bold uppercase">
                  Fashion Tech Hackathon Headquarters
                </p>
              </div>

              <div className="flex gap-3 mt-4 md:mt-0 relative z-10 font-['Cinzel'] text-xs font-bold">
                <button 
                  onClick={handleLogout}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 transition-colors uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
                <button 
                  onClick={refreshTeamData}
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#880A45] hover:bg-[#9E0D52] text-white transition-all shadow-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-[#880A45]/40"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </header>

            {/* Main Content Full-Page Grid: Left Column 4 / Right Column 8 */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              
              {/* ================= LEFT COLUMN: Team Members (lg:col-span-4) ================= */}
              <div className="lg:col-span-4 flex flex-col gap-8 text-left">
                <section className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 relative shadow-[0_12px_35px_rgba(0,0,0,0.85)]">
                  {/* Top Badge with [#880A45] to [#14216F] Gradient */}
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-[#880A45] to-[#14216F] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
                    Team Members
                  </div>

                  {/* Team Name Header */}
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10 mt-1">
                    <div>
                      <p className="text-[10px] font-['Cinzel'] text-gray-400 uppercase tracking-widest mb-1 font-semibold">
                        TEAM NAME
                      </p>
                      <p className="text-xl sm:text-2xl font-bold font-['Montserrat'] text-white">
                        {team?.teamName || "—"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#880A45] to-[#14216F] border border-white/20 flex items-center justify-center text-white shadow-sm">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="space-y-3.5">
                    {members.map((m, idx) => {
                      const isLead = m.role === "Lead";
                      const initialLetter = m.name ? m.name.charAt(0).toUpperCase() : "M";

                      return (
                        <div
                          key={`${m.role}-${m.regNo}-${idx}`}
                          className={`rounded-xl p-3.5 border transition-all flex items-center gap-3.5 relative overflow-hidden ${
                            isLead
                              ? "bg-[#180D22]/95 border-l-4 border-l-[#880A45] border-t border-r border-b border-[#880A45]/35 shadow-[0_0_20px_rgba(136,10,69,0.18)]"
                              : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            isLead 
                              ? "bg-gradient-to-r from-[#880A45] to-[#14216F] text-white border border-white/25 shadow-sm" 
                              : "bg-white/10 text-gray-300 border border-white/15"
                          }`}>
                            {initialLetter}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                                {m.name}
                              </h4>
                              <span className={`text-[9px] font-['Cinzel'] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isLead 
                                  ? "bg-gradient-to-r from-[#880A45] to-[#14216F] text-white shadow-xs" 
                                  : "bg-white/10 text-gray-300 border border-white/15"
                              }`}>
                                {m.label}
                              </span>
                            </div>

                            <div className="text-[11px] text-gray-400 font-mono space-y-0.5">
                              <p className="truncate">
                                ID: {m.regNo} • {m.gender || "—"} • YR {m.year || "—"} • {m.branch} {m.section ? `(${m.section})` : ""}
                              </p>
                              <p className="flex items-center gap-1.5 text-[10px]">
                                {m.residenceType === "hosteler" ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                                    <span>Hosteler ({m.hostelName || "Hostel"} - Rm {m.roomNo || "—"})</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                                    <span>Day Scholar</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>


              {/* ================= RIGHT COLUMN: Hackathon Collection Briefs (lg:col-span-8) ================= */}
              <div className="lg:col-span-8 flex flex-col text-left">
                <section className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-7 relative flex-1 flex flex-col shadow-[0_12px_35px_rgba(0,0,0,0.85)]">
                  {/* Top Badge with [#880A45] to [#14216F] Gradient */}
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-[#880A45] to-[#14216F] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
                    {selectedProblemId ? "Locked Design Brief" : "Hackathon Collection Briefs"}
                  </div>

                  <div className="mt-2 mb-5">
                    <p className="text-xs text-gray-300 font-normal leading-relaxed">
                      {selectedProblemId
                        ? "Your team has claimed a collection brief. Submit your Figma or Canva project URL below."
                        : `Browse available design briefs below and claim your collection folder. Limit is ${MAX_TEAMS_PER_PROBLEM} teams per brief.`}
                    </p>
                  </div>

                  {problemsError && (
                    <div className="mb-4 bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm flex items-center gap-2">
                      <AlertTriangle size={14} className="text-rose-400" />
                      <span>{problemsError}</span>
                    </div>
                  )}

                  {/* Selected & Locked Brief Panel */}
                  {selectedProblem ? (
                    <div className="space-y-6">
                      <div className="border border-white/15 rounded-2xl bg-black/60 p-6 relative shadow-inner">
                        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-[#880A45] to-[#14216F] text-white font-['Cinzel'] text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                          LOCKED COLLECTION BRIEF
                        </div>

                        <div className="space-y-3 text-center">
                          <h3 className="font-['Montserrat'] text-xl sm:text-2xl font-bold text-white uppercase">
                            {selectedProblem.title}
                          </h3>
                          {selectedProblem.themePng && (
                            <div
                              onClick={() => setZoomedImage(selectedProblem.themePng)}
                              className="mx-auto w-36 h-36 border border-white/20 rounded-2xl overflow-hidden bg-black/80 shadow-md my-3 cursor-pointer hover:scale-105 transition-all p-1"
                            >
                              <img src={selectedProblem.themePng} alt={selectedProblem.title} className="w-full h-full object-cover rounded-xl" />
                            </div>
                          )}
                          <p className="mx-auto max-w-2xl text-xs text-gray-300 leading-relaxed font-normal">
                            {isSelectedExpanded
                              ? selectedProblem.fullDescription || selectedProblem.shortDescription
                              : selectedProblem.shortDescription}
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsSelectedExpanded((v) => !v)}
                            className="font-['Cinzel'] text-xs text-pink-300 font-semibold underline hover:text-white transition cursor-pointer"
                          >
                            {isSelectedExpanded ? "COLLAPSE SPECIFICATIONS" : "EXPAND FULL DESIGN SPECIFICATIONS"}
                          </button>
                        </div>

                        <div className="mt-5 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setDetailsProblemId(selectedProblem.id)}
                            className="bg-gradient-to-r from-[#880A45] to-[#14216F] hover:opacity-90 text-white font-['Cinzel'] text-xs font-bold tracking-wider border border-white/20 rounded-xl px-5 py-2 transition cursor-pointer shadow-md"
                          >
                            VIEW FULL BRIEF MODAL
                          </button>
                        </div>
                      </div>

                      {/* Project Submissions Form Card */}
                      <div className="bg-black/60 border border-white/15 rounded-2xl p-5 sm:p-6 relative text-left shadow-inner">
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
                          <span className="font-['Cinzel'] font-bold text-xs text-white uppercase tracking-wider">
                            FASHION DESIGN PROJECT SUBMISSION
                          </span>
                        </div>

                        {submissionError && (
                          <div className="mb-4 bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm flex items-center gap-2">
                            <AlertTriangle size={14} className="text-rose-400" />
                            <span>{submissionError}</span>
                          </div>
                        )}
                        {submissionSuccess && (
                          <div className="mb-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 text-emerald-200 font-['Cinzel'] text-xs tracking-wider shadow-sm flex items-center gap-2">
                            <Check size={14} className="text-emerald-400" />
                            <span>{submissionSuccess}</span>
                          </div>
                        )}

                        {teamSubmissions.map((sub, idx) => (
                          <div key={idx} className="border border-white/10 p-4 sm:p-5 rounded-xl bg-black/40 relative">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-['Cinzel'] font-bold text-xs text-white">
                                SUBMISSION {teamSubmissions.length > 1 ? `#${idx + 1}` : ""}
                              </span>
                              {sub.isSubmitted ? (
                                <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-3 py-0.5 rounded-full font-['Cinzel'] font-bold tracking-wider">
                                  ✓ SUBMITTED & LOCKED
                                </span>
                              ) : (
                                <span className="text-[10px] bg-[#880A45]/30 text-pink-300 border border-[#880A45]/50 px-3 py-0.5 rounded-full font-['Cinzel'] font-bold tracking-wider">
                                  DRAFT PENDING
                                </span>
                              )}
                            </div>

                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 uppercase">
                                  CANVA / FIGMA PROJECT URL
                                </label>
                                <input
                                  type="text"
                                  disabled={sub.isSubmitted}
                                  className="w-full h-10 px-3 bg-black/60 border border-white/15 rounded-xl text-white text-xs outline-none focus:border-[#880A45] disabled:opacity-50 disabled:cursor-not-allowed"
                                  value={sub.canvaFigmaLink || ""}
                                  placeholder="e.g. https://www.figma.com/design/... or https://www.canva.com/design/..."
                                  onChange={(e) => handleSubmissionChange(idx, "canvaFigmaLink", e.target.value)}
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 uppercase">
                                  DESIGN REMARKS / MOODBOARD NOTES
                                </label>
                                <textarea
                                  rows={3}
                                  disabled={sub.isSubmitted}
                                  className="w-full p-3 bg-black/60 border border-white/15 rounded-xl text-white text-xs outline-none focus:border-[#880A45] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                  value={sub.note || ""}
                                  placeholder="Describe your collection concept, fabric choices, and tech integration..."
                                  onChange={(e) => handleSubmissionChange(idx, "note", e.target.value)}
                                />
                              </div>

                              {!sub.isSubmitted && (
                                <div className="pt-2 text-right">
                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="button"
                                    disabled={isSubmittingForm}
                                    onClick={() => handleSubmitSubmission(idx)}
                                    className="bg-gradient-to-r from-[#880A45] to-[#14216F] text-white font-['Cinzel'] font-bold py-2.5 px-6 rounded-xl text-xs tracking-wider shadow-md cursor-pointer uppercase hover:shadow-lg transition-all"
                                  >
                                    {isSubmittingForm ? "SUBMITTING..." : "SUBMIT DESIGN PROJECT »"}
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : problems.length ? (
                    /* Grid of Available Briefs */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-1">
                      {visibleProblems.map((p) => {
                        const problemLimit = p.limit || MAX_TEAMS_PER_PROBLEM;
                        const slotsLeft = problemLimit - p.slotsTaken;

                        return (
                          <div
                            key={p.id}
                            className="bg-black/60 border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-left hover:border-[#880A45]/50 transition-all relative shadow-md"
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-['Cinzel'] text-[10px] font-bold bg-gradient-to-r from-[#880A45]/40 to-[#14216F]/40 text-pink-300 border border-[#880A45]/50 px-2.5 py-0.5 rounded-full">
                                  {slotsLeft} / {problemLimit} SLOTS LEFT
                                </span>
                              </div>

                              <h3 className="font-['Montserrat'] text-base sm:text-lg font-bold text-white leading-tight mb-2">
                                {p.title}
                              </h3>

                              {p.themePng && (
                                <div
                                  onClick={(e) => { e.stopPropagation(); setZoomedImage(p.themePng); }}
                                  className="w-full h-32 border border-white/10 rounded-xl overflow-hidden my-2 bg-black/80 cursor-pointer hover:opacity-90 transition-all p-1"
                                >
                                  <img src={p.themePng} alt={p.title} className="w-full h-full object-cover rounded-lg" />
                                </div>
                              )}

                              <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed mb-4 font-normal">
                                {p.shortDescription}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDetailsProblemId(p.id)}
                              className="w-full bg-gradient-to-r from-[#880A45] to-[#14216F] hover:opacity-90 text-white border border-white/20 font-['Cinzel'] font-bold py-2 rounded-xl text-xs tracking-wider cursor-pointer transition-all uppercase shadow-sm"
                            >
                              VIEW DESIGN BRIEF
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Empty State with [#880A45] to [#14216F] Accents */
                    <div className="flex-1 border-2 border-dashed border-[#880A45]/30 rounded-2xl flex flex-col items-center justify-center p-8 sm:p-12 bg-black/40 relative overflow-hidden text-center min-h-[300px]">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, #880a45 0, #880a45 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />
                      <div className="relative z-10 max-w-lg">
                        <h2 className="text-xl sm:text-2xl font-bold font-['Montserrat'] text-white uppercase tracking-wider mb-3">
                          {areProblemsDisabled ? "Hackathon Briefs Archive Locked" : "No Hackathon Briefs Published"}
                        </h2>
                        <p className="text-gray-400 font-mono text-xs leading-relaxed">
                          {areProblemsDisabled
                            ? "Design brief selection is temporarily paused by event administration."
                            : "Please check back shortly as the jury releases new fashion design statements."}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>

            </main>
          </div>
        )}
      </div>

      {/* Popup Modal for Brief Details & Locking */}
      <AnimatePresence>
        {detailsProblem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm"
              onClick={() => setDetailsProblemId(null)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-[#0B0616]/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                <div>
                  <span className="font-['Cinzel'] text-[10px] text-pink-300 font-bold uppercase tracking-widest block mb-1">
                    DESIGN BRIEF SPECIFICATION
                  </span>
                  <h3 className="text-xl sm:text-2xl font-['Montserrat'] font-bold text-white leading-tight">
                    {detailsProblem.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsProblemId(null)}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 font-['Cinzel'] font-bold rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-normal">
                {detailsProblem.themePng && (
                  <div
                    onClick={() => setZoomedImage(detailsProblem.themePng)}
                    className="w-full h-44 border border-white/15 rounded-2xl overflow-hidden bg-black/60 mb-3 cursor-pointer hover:opacity-90 transition-all p-1"
                  >
                    <img src={detailsProblem.themePng} alt={detailsProblem.title} className="w-full h-full object-cover rounded-xl" />
                  </div>
                )}
                <div className="bg-black/60 border border-white/10 p-4 rounded-xl">
                  <span className="font-['Cinzel'] text-[10px] text-pink-300 font-bold block mb-1 uppercase tracking-wider">
                    COLLECTION OVERVIEW
                  </span>
                  <p>{detailsProblem.shortDescription}</p>
                </div>
                {detailsProblem.fullDescription && (
                  <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                    <span className="font-['Cinzel'] text-[10px] text-gray-400 font-bold block mb-1 uppercase tracking-wider">
                      DETAILED DESIGN REQUIREMENTS & SCOPE
                    </span>
                    <p className="whitespace-pre-wrap">{detailsProblem.fullDescription}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3 items-center justify-end font-['Cinzel'] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDetailsProblemId(null)}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl px-5 py-2.5 transition cursor-pointer"
                >
                  CLOSE
                </button>

                {!selectedProblemId && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={async () => {
                      setProblemsError("");

                      try {
                        const teamName =
                          String(team?.teamName || "").trim() ||
                          String(teamKey || "").trim();
                        if (!teamName) {
                          setProblemsError("Team not available. Please try again.");
                          return;
                        }

                        const response = await fetch(
                          `${import.meta.env.VITE_BACKEND_URL}/api/team/${encodeURIComponent(teamName)}/select-problem`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              problemId: detailsProblem.id,
                            }),
                          },
                        );
                        const data = await response.json().catch(() => null);

                        if (!response.ok || !data?.success) {
                          setProblemsError(
                            data?.message || "Unable to select design brief.",
                          );

                          if (data?.code === "PROBLEM_FULL") {
                            const fullId = detailsProblem.id;
                            setProblems((prev) =>
                              prev.map((p) =>
                                p.id === fullId
                                  ? { ...p, slotsTaken: MAX_TEAMS_PER_PROBLEM }
                                  : p,
                              ),
                            );
                            setDetailsProblemId(null);
                          }
                          return;
                        }

                        setSelectedProblemId(detailsProblem.id);
                        setTeam((t) =>
                          t ? { ...t, selectedProblemStatement: detailsProblem.id } : t,
                        );
                        setIsSelectedExpanded(false);
                        setDetailsProblemId(null);
                      } catch {
                        setProblemsError("Unable to connect to the server.");
                      }
                    }}
                    className="bg-gradient-to-r from-[#880A45] to-[#14216F] text-white rounded-xl px-6 py-2.5 shadow-md cursor-pointer hover:shadow-lg transition-all uppercase tracking-wider"
                  >
                    LOCK THIS BRIEF »
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Zoomed Image Modal */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black cursor-zoom-out"
              onClick={() => setZoomedImage(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10 pointer-events-none"
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 bg-black/80 text-white border border-white/20 font-['Cinzel'] text-sm rounded-full w-9 h-9 flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition pointer-events-auto"
              >
                ✕
              </button>
              <div
                className="bg-black/90 p-3 rounded-2xl border border-white/20 shadow-2xl overflow-hidden max-h-[80vh] pointer-events-auto cursor-zoom-out"
                onClick={() => setZoomedImage(null)}
              >
                <img
                  src={zoomedImage}
                  alt="Expanded theme PNG"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamPanel;
