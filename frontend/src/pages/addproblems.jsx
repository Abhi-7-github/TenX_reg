import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, AlertTriangle, FileText, Check, Plus, RotateCw, Trash2, Edit3, Users, Eye, Download, LogOut } from "lucide-react";
import FashionBackground from "../components/FashionBackground";

const VIEW_MODES = {
  problems: "problems",
  students: "students",
};

const ADMIN_KEY_STORAGE = "adminConsole.adminKey";
const ADMIN_VIEW_STORAGE = "adminConsole.viewMode";
const MAX_TEAMS_PER_PROBLEM = 7;

const AddProblems = () => {
  const [password, setPassword] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [viewMode, setViewMode] = useState(VIEW_MODES.problems);

  const [didRestoreKey, setDidRestoreKey] = useState(false);
  const [didAutoVerify, setDidAutoVerify] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_KEY_STORAGE);
    const normalized = (stored || "").trim();
    if (normalized) setPassword(normalized);
    const storedView = (localStorage.getItem(ADMIN_VIEW_STORAGE) || "").trim();
    if (storedView && Object.values(VIEW_MODES).includes(storedView)) {
      setViewMode(storedView);
    }
    setDidRestoreKey(true);
  }, []);

  useEffect(() => {
    if (!didRestoreKey) return;
    localStorage.setItem(ADMIN_VIEW_STORAGE, viewMode);
  }, [viewMode, didRestoreKey]);

  useEffect(() => {
    if (!didRestoreKey) return;
    if (didAutoVerify) return;
    if (isVerified) return;

    const normalized = password.trim();
    if (!normalized) return;

    setDidAutoVerify(true);
    setIsVerifying(true);
    setVerifyError("");
    setSaveMessage("");

    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: normalized }),
          },
        );
        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          setVerifyError(data?.message || "Invalid admin key.");
          setIsVerified(false);
          return;
        }

        localStorage.setItem(ADMIN_KEY_STORAGE, normalized);
        setIsVerified(true);
      } catch {
        setVerifyError("Unable to connect to the server.");
        setIsVerified(false);
      } finally {
        setIsVerifying(false);
      }
    })();
  }, [didRestoreKey, didAutoVerify, isVerified, password]);

  const [activeModal, setActiveModal] = useState(null); // null | create | edit

  const [title, setTitle] = useState("");
  const [themePng, setThemePng] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [limit, setLimit] = useState(7);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [problemsEnabled, setProblemsEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState("");

  const [problems, setProblems] = useState([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [problemsLoadError, setProblemsLoadError] = useState("");

  const [editingProblemId, setEditingProblemId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editThemePng, setEditThemePng] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");
  const [editFullDescription, setEditFullDescription] = useState("");
  const [editLimit, setEditLimit] = useState(7);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsLoadError, setTeamsLoadError] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [studentProblemPopup, setStudentProblemPopup] = useState(null);
  const [manageSubmissionsPopup, setManageSubmissionsPopup] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyError("");
    setSaveMessage("");

    const normalized = password.trim();
    if (!normalized) {
      setVerifyError("Please enter the administrator key.");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: normalized }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setVerifyError(data?.message || "Invalid administrator passcode.");
        return;
      }

      localStorage.setItem(ADMIN_KEY_STORAGE, normalized);
      setIsVerified(true);
    } catch {
      setVerifyError("Unable to connect to the server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setIsVerified(false);
    setPassword("");
    setVerifyError("");
  };

  const loadConfigAndProblems = async () => {
    setIsLoadingProblems(true);
    setProblemsLoadError("");

    try {
      const [configRes, problemsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/config/problems-enabled`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/problems?password=${encodeURIComponent(password.trim())}`),
      ]);

      const [configData, problemsData] = await Promise.all([
        configRes.json().catch(() => null),
        problemsRes.json().catch(() => null),
      ]);

      if (configRes.ok && configData?.success) {
        setProblemsEnabled(Boolean(configData?.enabled));
      }

      if (!problemsRes.ok || !problemsData?.success) {
        setProblemsLoadError(problemsData?.message || "Failed to load design briefs.");
        return;
      }

      setProblems(Array.isArray(problemsData?.data) ? problemsData.data : []);
    } catch {
      setProblemsLoadError("Unable to connect to the server.");
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const loadSelectedTeams = async () => {
    setIsLoadingTeams(true);
    setTeamsLoadError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/selected?password=${encodeURIComponent(
          password.trim(),
        )}`,
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setTeamsLoadError(data?.message || "Failed to load team lists.");
        return;
      }

      setSelectedTeams(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setTeamsLoadError("Unable to connect to the server.");
    } finally {
      setIsLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (!isVerified) return;
    if (viewMode === VIEW_MODES.problems) {
      loadConfigAndProblems();
    } else if (viewMode === VIEW_MODES.students) {
      loadSelectedTeams();
    }
  }, [isVerified, viewMode]);

  const showProblems = () => setViewMode(VIEW_MODES.problems);
  const showStudents = () => setViewMode(VIEW_MODES.students);

  const handleToggleProblems = async (nextEnabled) => {
    setIsToggling(true);
    setToggleError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/config/problems-enabled`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            enabled: nextEnabled,
          }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setToggleError(data?.message || "Failed to update portal availability.");
        return;
      }

      setProblemsEnabled(Boolean(data?.enabled));
    } catch {
      setToggleError("Unable to connect to the server.");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async (problemId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete this hackathon design brief?",
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/problems/${encodeURIComponent(
          problemId,
        )}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        alert(data?.message || "Failed to delete brief.");
        return;
      }

      setProblems((prev) => prev.filter((p) => p._id !== problemId));
    } catch {
      alert("Unable to connect to the server.");
    }
  };

  const openCreate = () => {
    setActiveModal("create");
    setSaveError("");
    setSaveMessage("");
    setTitle("");
    setThemePng("");
    setShortDescription("");
    setFullDescription("");
    setLimit(7);
  };

  const closeCreate = () => {
    setActiveModal(null);
    setSaveError("");
  };

  const startEditing = (p) => {
    setActiveModal("edit");
    setEditingProblemId(p._id);
    setEditTitle(p.title || "");
    setEditThemePng(p.themePng || "");
    setEditShortDescription(p.shortDescription || "");
    setEditFullDescription(p.fullDescription || "");
    setEditLimit(p.limit || 7);
    setUpdateError("");
  };

  const cancelEditing = () => {
    setActiveModal(null);
    setEditingProblemId(null);
    setUpdateError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingProblemId) return;

    setIsUpdating(true);
    setUpdateError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/problems/${encodeURIComponent(
          editingProblemId,
        )}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            title: editTitle.trim(),
            themePng: editThemePng.trim(),
            shortDescription: editShortDescription.trim(),
            fullDescription: editFullDescription.trim(),
            limit: Number(editLimit || 7),
          }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setUpdateError(data?.message || "Failed to update problem statement.");
        return;
      }

      await loadConfigAndProblems();
      cancelEditing();
    } catch {
      setUpdateError("Unable to connect to the server.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetProblem = async (teamId, teamName) => {
    const confirmReset = window.confirm(
      `Are you sure you want to unlock the design brief for "${teamName}"?`,
    );
    if (!confirmReset) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${encodeURIComponent(
          teamId,
        )}/reset-problem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        alert(data?.message || "Failed to reset brief selection.");
        return;
      }

      await loadSelectedTeams();
    } catch {
      alert("Unable to connect to the server.");
    }
  };

  const handleAddFormSlot = async () => {
    if (!manageSubmissionsPopup) return;
    try {
      const teamName = manageSubmissionsPopup.teamName;
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${encodeURIComponent(teamName)}/add-form`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        alert(data?.message || "Failed to append submission slot.");
        return;
      }
      setManageSubmissionsPopup(data.data);
      setSelectedTeams((prev) => prev.map((t) => (t._id === data.data._id ? data.data : t)));
    } catch {
      alert("Unable to connect to the server.");
    }
  };

  const handleResetForm = async (idx) => {
    if (!manageSubmissionsPopup) return;
    const confirmReset = window.confirm(`Unlock Submission Slot #${idx + 1} for this team?`);
    if (!confirmReset) return;
    try {
      const teamName = manageSubmissionsPopup.teamName;
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${encodeURIComponent(teamName)}/reset-form/${idx}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        alert(data?.message || "Failed to unlock submission.");
        return;
      }
      setManageSubmissionsPopup(data.data);
      setSelectedTeams((prev) => prev.map((t) => (t._id === data.data._id ? data.data : t)));
    } catch {
      alert("Unable to connect to the server.");
    }
  };

  const handleRemoveForm = async (idx) => {
    if (!manageSubmissionsPopup) return;
    const confirmRemove = window.confirm(`Permanently remove Submission Slot #${idx + 1}?`);
    if (!confirmRemove) return;
    try {
      const teamName = manageSubmissionsPopup.teamName;
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/${encodeURIComponent(teamName)}/remove-form/${idx}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: password.trim() }),
        }
      );
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        alert(data?.message || "Failed to remove submission.");
        return;
      }
      setManageSubmissionsPopup(data.data);
      setSelectedTeams((prev) => prev.map((t) => (t._id === data.data._id ? data.data : t)));
    } catch {
      alert("Unable to connect to the server.");
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportSubmissionsToCSV = async (targetTeams = null) => {
    setIsExporting(true);
    try {
      let teamsToExport = Array.isArray(targetTeams) && targetTeams.length > 0 ? targetTeams : selectedTeams;

      if (!teamsToExport || teamsToExport.length === 0) {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/teams/selected?password=${encodeURIComponent(
            password.trim(),
          )}`,
        );
        const data = await response.json().catch(() => null);
        if (response.ok && data?.success && Array.isArray(data?.data)) {
          teamsToExport = data.data;
          setSelectedTeams(data.data);
        }
      }

      if (!teamsToExport || teamsToExport.length === 0) {
        alert("No registered team records found to export.");
        return;
      }

      const headers = [
        "Team Name",
        "Selected Fashion Design Brief",
        "Submission Links",
        "Design Notes"
      ];

      const cleanVal = (val) => {
        if (val === null || val === undefined || val === "") return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = teamsToExport.map((t) => {
        const teamName = t?.teamName || "-";
        const problemTitle =
          t?.selectedProblemStatement?.title ||
          t?.selectedProblemStatement?.name ||
          "Not Selected";

        const submissions = Array.isArray(t?.submissions) ? t.submissions : [];

        const linksArr = submissions
          .map((sub, i) => {
            const link = (sub?.canvaFigmaLink || "").trim();
            if (!link) return null;
            return submissions.length > 1 ? `Form #${i + 1}: ${link}` : link;
          })
          .filter(Boolean);

        const notesArr = submissions
          .map((sub, i) => {
            const note = (sub?.note || "").trim();
            if (!note) return null;
            return submissions.length > 1 ? `Form #${i + 1}: ${note}` : note;
          })
          .filter(Boolean);

        const submissionLink = linksArr.length ? linksArr.join(" | ") : "No Link";
        const submissionNote = notesArr.length ? notesArr.join(" | ") : "No Note";

        return [
          cleanVal(teamName),
          cleanVal(problemTitle),
          cleanVal(submissionLink),
          cleanVal(submissionNote)
        ].join(",");
      });

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        [headers.map(h => cleanVal(h)).join(","), ...rows].join("\r\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `team_submissions_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to generate CSV export.");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return selectedTeams;
    return selectedTeams.filter((t) => {
      const name = String(t?.teamName || "").toLowerCase();
      const leader = String(t?.teamLeader?.name || "").toLowerCase();
      const problem = String(
        t?.selectedProblemStatement?.title ||
        t?.selectedProblemStatement?.name ||
        "",
      ).toLowerCase();
      return name.includes(q) || leader.includes(q) || problem.includes(q);
    });
  }, [selectedTeams, teamSearch]);

  const canSave = Boolean(title.trim() && shortDescription.trim());

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveMessage("");

    if (!canSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/problems`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: password.trim(),
            title: title.trim(),
            themePng: themePng.trim(),
            shortDescription: shortDescription.trim(),
            fullDescription: fullDescription.trim(),
            limit: Number(limit || 7),
          }),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setSaveError(data?.message || "Failed to save problem statement.");
        return;
      }

      setSaveMessage("Design brief added successfully.");
      setTitle("");
      setThemePng("");
      setShortDescription("");
      setFullDescription("");
      setLimit(7);

      await loadConfigAndProblems();
      setActiveModal(null);
    } catch {
      setSaveError("Unable to connect to the server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-16 text-[#fdf3f7] relative overflow-x-hidden">
      {/* Pitch Black Fashion Tech Background */}
      <FashionBackground />

      <Navbar />

      <div className="flex-grow w-full px-4 sm:px-8 md:px-12 pt-24 sm:pt-28 relative z-10">

        {/* Password Accreditation Gate */}
        {!isVerified ? (
          <div className="min-h-[calc(100vh-260px)] flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-lg bg-[#0B0616]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.95)] text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-[#0F2A1D] hover:bg-[#375534] text-white border-b border-l border-white/20 px-4 py-1.5 font-['Cinzel'] text-xs tracking-widest font-bold rounded-tr-3xl shadow-sm">
                ADMIN CONSOLE
              </div>

              <div className="relative text-center mt-3 flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl font-['Montserrat'] font-black text-white tracking-tight uppercase leading-none mb-2">
                  ADMINISTRATIVE LOGIN
                </h1>
                <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed font-normal">
                  Provide validation credentials to manage hackathon collections and design briefs.
                </p>
              </div>

              <form onSubmit={handleVerify} className="relative mt-6 space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                    ADMINISTRATOR PASSCODE
                  </label>
                  <input
                    type="password"
                    className="w-full h-11 bg-black/60 backdrop-blur-md text-white border border-white/15 rounded-xl px-4 focus:border-[#880A45] focus:bg-black/80 outline-none transition font-medium text-xs shadow-xs"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <AnimatePresence>
                  {verifyError && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-xl border border-rose-500/40 bg-rose-950/80 p-3 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm flex items-center gap-2"
                    >
                      <AlertTriangle size={16} className="text-rose-400" />
                      <span>{verifyError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isVerifying}
                  className="w-full h-12 rounded-xl font-['Cinzel'] font-bold text-xs tracking-widest bg-[#0F2A1D] hover:bg-[#375534] text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 uppercase"
                >
                  {isVerifying ? "AUTHENTICATING..." : "ENTER JURY ARENA »"}
                </motion.button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Main console view */
          <div className="space-y-6">

            {/* TopHeader Bar with [#880A45] -> [#14216F] Glow */}
            <header className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.85)] text-left">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#880A45]/30 rounded-full blur-[90px] pointer-events-none" />
              <div className="absolute -bottom-20 right-0 w-72 h-72 bg-[#14216F]/30 rounded-full blur-[90px] pointer-events-none" />

              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-['Montserrat'] font-black tracking-tight uppercase mb-1 text-white">
                  COLLECTIONS CONSOLE DECK
                </h1>
                <p className="bg-gradient-to-r from-pink-300 via-rose-200 to-indigo-300 bg-clip-text text-transparent font-['Cinzel'] text-xs tracking-widest font-bold uppercase">
                  MANAGE HACKATHON BRIEFS & TEAM SELECTIONS
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0 relative z-10 font-['Cinzel'] text-xs font-bold">
                {viewMode === VIEW_MODES.problems ? (
                  <>
                    <button
                      type="button"
                      onClick={openCreate}
                      className="px-4 sm:px-5 py-2 rounded-xl bg-[#0F2A1D] hover:bg-[#375534] hover:opacity-90 text-white transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-[#880A45]/50"
                    >
                      <Plus size={14} /> ADD DESIGN BRIEF
                    </button>
                    <button
                      type="button"
                      onClick={showStudents}
                      className="px-4 sm:px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users size={14} /> TEAM LISTS
                    </button>
                    <button
                      type="button"
                      onClick={loadConfigAndProblems}
                      disabled={isLoadingProblems}
                      className="px-4 sm:px-5 py-2 rounded-xl bg-[#880A45] hover:bg-[#9E0D52] text-white transition-all shadow-sm uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-[#880A45]/40"
                    >
                      <RotateCw size={12} className={isLoadingProblems ? "animate-spin" : ""} /> REFRESH
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={showProblems}
                      className="px-4 sm:px-5 py-2 rounded-xl bg-[#0F2A1D] hover:bg-[#375534] hover:opacity-90 text-white transition-all shadow-md uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-[#880A45]/50"
                    >
                      <FileText size={14} /> DESIGN BRIEFS VAULT
                    </button>
                    <button
                      type="button"
                      onClick={loadSelectedTeams}
                      disabled={isLoadingTeams}
                      className="px-4 sm:px-5 py-2 rounded-xl bg-[#880A45] hover:bg-[#9E0D52] text-white transition-all shadow-sm uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border border-[#880A45]/40"
                    >
                      <RotateCw size={12} className={isLoadingTeams ? "animate-spin" : ""} /> REFRESH
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 transition-colors uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={12} /> LOGOUT
                </button>
              </div>
            </header>

            {/* Global Error Banners */}
            <AnimatePresence>
              {problemsLoadError && (
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-5 bg-rose-950/80 border border-rose-500/40 rounded-2xl p-4 text-rose-200 font-['Cinzel'] text-xs tracking-wide shadow-md flex items-center gap-2 text-left"
                >
                  <AlertTriangle size={18} className="text-rose-400" />
                  <span>{problemsLoadError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ----------------- PROBLEMS TAB ----------------- */}
            {viewMode === VIEW_MODES.problems && (
              <div className="space-y-6">

                {/* Enable toggle control widget */}
                <div className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.85)] relative text-left">
                  <div className="absolute -top-3 left-6 bg-[#0F2A1D] hover:bg-[#375534] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
                    Brief Access Control
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
                    <div>
                      <h3 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-white uppercase">TEAM SELECTION PORTAL</h3>
                      <p className="text-xs text-gray-300 font-normal">Toggle whether design briefs are publicly visible for teams to claim.</p>
                    </div>

                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <span className="font-['Cinzel'] font-bold text-xs tracking-wider text-white">
                        {problemsEnabled ? "PORTAL ACTIVE" : "PORTAL SUSPENDED"}
                      </span>
                      <button
                        type="button"
                        disabled={isToggling}
                        onClick={() => handleToggleProblems(!problemsEnabled)}
                        className={`relative inline-flex h-8 w-16 items-center rounded-full border transition cursor-pointer ${
                          problemsEnabled ? "bg-emerald-950 border-emerald-500" : "bg-gray-800 border-white/20"
                        }`}
                        aria-label="Toggle problem statements"
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            problemsEnabled ? "translate-x-8" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </label>
                  </div>

                  {toggleError && (
                    <div className="mt-3 bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-sm">
                      💥 {toggleError}
                    </div>
                  )}
                </div>

                {/* List of Problem Statements */}
                <div className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.85)] relative text-left">
                  <div className="absolute -top-3 left-6 bg-[#0F2A1D] hover:bg-[#375534] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
                    Collections Directory
                  </div>

                  <h3 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-white mb-5 mt-1 uppercase">
                    PUBLISHED FASHION DESIGN BRIEFS
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {problems.length ? (
                      problems.map((p) => {
                        const problemLimit = p.limit || MAX_TEAMS_PER_PROBLEM;
                        const slotsLeft = problemLimit - (p.slotsTaken || 0);

                        return (
                          <div
                            key={p._id}
                            className="bg-black/60 border border-white/15 rounded-2xl p-5 shadow-md hover:border-[#880A45]/50 transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-2 text-left">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-['Cinzel'] text-[10px] font-bold bg-[#880A45]/30 border border-[#880A45]/50 text-pink-300 px-2.5 py-0.5 rounded-full">
                                  SLOTS AVAILABLE: {slotsLeft} / {problemLimit}
                                </span>
                              </div>

                              <h4 className="font-['Montserrat'] text-base sm:text-lg font-bold text-white leading-tight border-b border-white/10 pb-2 uppercase">
                                {p.title}
                              </h4>

                              {p.themePng && (
                                <div className="w-full h-32 border border-white/10 rounded-xl overflow-hidden my-2 bg-black/80 p-1">
                                  <img src={p.themePng} alt={p.title} className="w-full h-full object-cover rounded-lg" />
                                </div>
                              )}

                              <p className="text-xs text-gray-300 leading-relaxed font-normal line-clamp-3 mb-3">
                                {p.shortDescription}
                              </p>
                            </div>

                            {/* Edit / Delete Action buttons */}
                            <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-white/10 font-['Cinzel'] text-xs font-bold">
                              <button
                                type="button"
                                onClick={() => startEditing(p)}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 rounded-xl py-2 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition uppercase"
                              >
                                <Edit3 size={12} /> EDIT BRIEF
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(p._id)}
                                className="flex-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl py-2 shadow-sm cursor-pointer flex items-center justify-center gap-1.5 transition uppercase"
                              >
                                <Trash2 size={12} /> DELETE BRIEF
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 border border-dashed border-white/15 rounded-2xl p-8 text-center bg-black/40">
                        <p className="font-['Montserrat'] font-bold text-base text-white uppercase">NO FASHION DESIGN BRIEFS LOGGED</p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">Click "ADD DESIGN BRIEF" above to register a new collection problem statement.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------- TEAMS TAB ----------------- */}
            {viewMode === VIEW_MODES.students && (
              <div className="bg-[#0B0616]/90 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.85)] relative text-left">
                <div className="absolute -top-3 left-6 bg-[#0F2A1D] hover:bg-[#375534] text-white px-3.5 py-0.5 rounded-lg text-[10px] font-['Cinzel'] font-bold uppercase tracking-widest border border-white/20 shadow-[0_0_15px_rgba(136,10,69,0.4)]">
                  Team Lists
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mb-5 mt-1">
                  <div>
                    <h3 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-white uppercase">REGISTERED TEAM ASSIGNMENTS</h3>
                    <p className="text-xs text-gray-300 font-normal">Review team selection logs, design links, and submission files.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => exportSubmissionsToCSV()}
                      disabled={isExporting}
                      className="bg-[#0F2A1D] hover:bg-[#375534] text-white rounded-xl px-4 py-2 font-['Cinzel'] text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-md hover:opacity-90 transition uppercase"
                      title="Download all teams and submissions as CSV"
                    >
                      <Download size={14} className={isExporting ? "animate-spin" : ""} />
                      {isExporting ? "GENERATING CSV..." : "EXPORT ALL TEAMS (CSV)"}
                    </button>
                    <div className="font-['Cinzel'] text-xs font-bold bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-pink-300">
                      TOTAL TEAMS: {selectedTeams.length}
                    </div>
                  </div>
                </div>

                {/* Team Search filter */}
                <div className="mb-5">
                  <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                    SEARCH REGISTERED TEAMS
                  </label>
                  <input
                    className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                    placeholder="Search by team title or lead designer..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    autoComplete="off"
                  />
                  <div className="mt-1.5 text-xs text-gray-400 font-mono">
                    Showing {filteredTeams.length} of {selectedTeams.length} registered teams
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-white/15 rounded-xl bg-black/40">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/70 text-gray-300 font-['Cinzel'] text-xs tracking-wider border-b border-white/15">
                        <th className="px-4 py-3 text-left border-r border-white/10">TEAM NAME</th>
                        <th className="px-4 py-3 text-left border-r border-white/10">TEAM LEADER</th>
                        <th className="px-4 py-3 text-left border-r border-white/10">SELECTED DESIGN BRIEF</th>
                        <th className="px-4 py-3 text-center border-r border-white/10">TIME LOCKED</th>
                        <th className="px-4 py-3 text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeams.length ? (
                        filteredTeams.map((t) => {
                          const problemTitle =
                            t?.selectedProblemStatement?.title ||
                            t?.selectedProblemStatement?.name ||
                            "Not Selected";
                          return (
                            <tr
                              key={t._id}
                              className="border-b border-white/10 hover:bg-white/5 text-white transition-colors"
                            >
                              <td className="px-4 py-3.5 border-r border-white/10 font-['Montserrat'] font-bold text-sm text-white">{t.teamName}</td>
                              <td className="px-4 py-3.5 border-r border-white/10 font-medium text-gray-200">{t?.teamLeader?.name || "-"}</td>
                              <td className="px-4 py-3.5 border-r border-white/10 font-medium text-xs text-gray-300">{problemTitle}</td>
                              <td className="px-4 py-3.5 border-r border-white/10 text-center text-[11px] text-gray-400 font-mono">
                                {t?.selectedProblemSelectedAt
                                  ? new Date(t.selectedProblemSelectedAt).toLocaleString()
                                  : "-"}
                              </td>
                              <td className="px-4 py-3.5 text-center font-['Cinzel'] text-[10px] font-bold">
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const problem = t?.selectedProblemStatement;
                                      if (!problem || typeof problem !== "object") return;
                                      setStudentProblemPopup({
                                        teamName: t?.teamName || "",
                                        leaderName: t?.teamLeader?.name || "",
                                        selectedAt: t?.selectedProblemSelectedAt || null,
                                        problem,
                                      });
                                    }}
                                    className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 rounded-lg px-2.5 py-1 cursor-pointer inline-flex items-center gap-1 transition uppercase"
                                  >
                                    <Eye size={11} /> VIEW BRIEF
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResetProblem(t._id, t.teamName)}
                                    className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-lg px-2.5 py-1 cursor-pointer inline-flex items-center gap-1 transition uppercase"
                                  >
                                    <RotateCw size={11} /> RESET
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setManageSubmissionsPopup(t)}
                                    className="bg-[#0F2A1D] hover:bg-[#375534] text-white rounded-lg px-2.5 py-1 cursor-pointer inline-flex items-center gap-1 transition shadow-sm uppercase"
                                  >
                                    <FileText size={11} /> SUBMISSIONS ({t.submissions?.length || 0})
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-400 font-['Cinzel'] text-xs font-semibold tracking-wider uppercase">
                            {isLoadingTeams
                              ? "LOADING TEAM LISTS..."
                              : selectedTeams.length
                                ? "NO TEAMS FOUND MATCHING CRITERIA"
                                : "NO TEAMS HAVE LOCKED A BRIEF YET"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 1. Team problem statement details modal */}
      <AnimatePresence>
        {viewMode === VIEW_MODES.students && studentProblemPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm"
              onClick={() => setStudentProblemPopup(null)}
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
                    TEAM ASSIGNMENT: {studentProblemPopup.teamName}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-['Montserrat'] font-bold text-white leading-tight">
                    {studentProblemPopup.problem?.title || "Design Brief"}
                  </h3>
                  {studentProblemPopup.leaderName && (
                    <p className="text-xs text-gray-400 mt-1 font-normal">Team Leader: {studentProblemPopup.leaderName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStudentProblemPopup(null)}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 font-['Cinzel'] font-bold rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-normal">
                <div className="bg-black/60 border border-white/10 p-4 rounded-xl">
                  <span className="font-['Cinzel'] text-[10px] text-pink-300 font-bold block mb-1 uppercase tracking-wider">
                    COLLECTION SUMMARY
                  </span>
                  <p>{studentProblemPopup.problem.shortDescription}</p>
                </div>
                {studentProblemPopup.problem.fullDescription && (
                  <div className="bg-black/40 border border-white/10 p-4 rounded-xl">
                    <span className="font-['Cinzel'] text-[10px] text-gray-400 font-bold block mb-1 uppercase tracking-wider">
                      FULL DESIGN SPECIFICATIONS & GUIDELINES
                    </span>
                    <p className="whitespace-pre-wrap">{studentProblemPopup.problem.fullDescription}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end font-['Cinzel'] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setStudentProblemPopup(null)}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl px-5 py-2.5 transition cursor-pointer uppercase"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Admin Create/Edit Modal */}
      <AnimatePresence>
        {viewMode === VIEW_MODES.problems && activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm"
              onClick={() => (activeModal === "edit" ? cancelEditing() : closeCreate())}
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
                    HACKATHON BRIEFS MANAGEMENT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-['Montserrat'] font-bold text-white leading-tight uppercase">
                    {activeModal === "edit" ? "EDIT DESIGN BRIEF" : "CREATE NEW DESIGN BRIEF"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => (activeModal === "edit" ? cancelEditing() : closeCreate())}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 font-['Cinzel'] font-bold rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {activeModal === "create" ? (
                <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      DESIGN BRIEF TITLE
                    </label>
                    <input
                      className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Avant-Garde Sustainable Silk Eveningwear"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      THEME PNG / COVER IMAGE URL
                    </label>
                    <input
                      className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                      value={themePng}
                      onChange={(e) => setThemePng(e.target.value)}
                      placeholder="e.g. https://images.unsplash.com/... or /fashion_tech_hero.jpg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      TEAM SELECTION LIMIT (MAX TEAMS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-bold text-xs text-white"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      COLLECTION SUMMARY (SHOWN ON BRIEF CARDS)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 focus:border-[#880A45] outline-none font-medium text-xs text-white resize-none"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      placeholder="A concise summary of aesthetic and technical design objectives..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      FULL INSTRUCTION SHEET & SPECIFICATIONS
                    </label>
                    <textarea
                      rows={5}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 focus:border-[#880A45] outline-none font-medium text-xs text-white resize-none"
                      value={fullDescription}
                      onChange={(e) => setFullDescription(e.target.value)}
                      placeholder="Detailed hackathon criteria, fabric specifications, presentation deliverables..."
                    />
                  </div>

                  {saveError && (
                    <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 text-rose-200 font-['Cinzel'] text-xs">
                      💥 {saveError}
                    </div>
                  )}

                  {saveMessage && (
                    <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-3 text-emerald-200 font-['Cinzel'] text-xs">
                      ✓ {saveMessage}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 font-['Cinzel'] text-xs font-bold pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={closeCreate}
                      className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 rounded-xl px-5 py-2.5 transition cursor-pointer uppercase"
                    >
                      CANCEL
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!canSave}
                      className={`rounded-xl px-6 py-2.5 transition-all cursor-pointer uppercase ${
                        canSave ? "bg-[#0F2A1D] hover:bg-[#375534] text-white shadow-md" : "bg-gray-800 text-gray-400 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      {isSaving ? "SAVING BRIEF..." : "✓ CREATE DESIGN BRIEF"}
                    </motion.button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleUpdate} className="space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      DESIGN BRIEF TITLE
                    </label>
                    <input
                      className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      THEME PNG / COVER IMAGE URL
                    </label>
                    <input
                      className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-medium text-xs text-white"
                      value={editThemePng}
                      onChange={(e) => setEditThemePng(e.target.value)}
                      placeholder="e.g., https://example.com/cover.png"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      TEAM SELECTION LIMIT (MAX TEAMS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full h-11 bg-black/60 border border-white/15 rounded-xl px-4 focus:border-[#880A45] outline-none font-bold text-xs text-white"
                      value={editLimit}
                      onChange={(e) => setEditLimit(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      COLLECTION SUMMARY (SHOWN ON BRIEF CARDS)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 focus:border-[#880A45] outline-none font-medium text-xs text-white resize-none"
                      value={editShortDescription}
                      onChange={(e) => setEditShortDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-['Cinzel'] font-semibold tracking-widest text-gray-300 mb-1.5 uppercase">
                      FULL INSTRUCTION SHEET & SPECIFICATIONS
                    </label>
                    <textarea
                      rows={5}
                      className="w-full rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 focus:border-[#880A45] outline-none font-medium text-xs text-white resize-none"
                      value={editFullDescription}
                      onChange={(e) => setEditFullDescription(e.target.value)}
                    />
                  </div>

                  {updateError && (
                    <div className="bg-rose-950/80 border border-rose-500/40 rounded-xl p-3 text-rose-200 font-['Cinzel'] text-xs">
                      💥 {updateError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 font-['Cinzel'] text-xs font-bold pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 rounded-xl px-5 py-2.5 transition cursor-pointer uppercase"
                    >
                      CANCEL
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isUpdating}
                      className="bg-[#0F2A1D] hover:bg-[#375534] text-white rounded-xl px-6 py-2.5 shadow-md transition-all cursor-pointer uppercase"
                    >
                      {isUpdating ? "SAVING CHANGES..." : "✓ SAVE CHANGES"}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Manage Submissions Modal */}
      <AnimatePresence>
        {manageSubmissionsPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black backdrop-blur-sm"
              onClick={() => setManageSubmissionsPopup(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0B0616]/95 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto text-left"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 mb-4">
                <div>
                  <span className="font-['Cinzel'] text-[10px] text-pink-300 font-bold uppercase tracking-widest block mb-1">
                    TEAM SUBMISSIONS MANAGEMENT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-['Montserrat'] font-bold text-white leading-tight uppercase">
                    TEAM: {manageSubmissionsPopup.teamName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setManageSubmissionsPopup(null)}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 font-['Cinzel'] font-bold rounded-full w-8 h-8 flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-300 font-normal">Review links, designer moodboards, or append submission slots.</span>
                <button
                  type="button"
                  onClick={handleAddFormSlot}
                  className="bg-[#0F2A1D] hover:bg-[#375534] text-white rounded-xl px-4 py-1.5 font-['Cinzel'] text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-md uppercase"
                >
                  <Plus size={12} /> ADD SUBMISSION SLOT
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {(!manageSubmissionsPopup.submissions || manageSubmissionsPopup.submissions.length === 0) ? (
                  <div className="border border-dashed border-white/15 rounded-2xl p-6 text-center bg-black/60">
                    <span className="font-['Montserrat'] font-bold text-sm text-white uppercase">NO SUBMISSION FORMS LOGGED</span>
                    <p className="text-xs text-gray-400 mt-1 font-mono">Click "ADD SUBMISSION SLOT" above to generate a new submission form for this team.</p>
                  </div>
                ) : (
                  manageSubmissionsPopup.submissions.map((sub, idx) => (
                    <div key={idx} className="border border-white/15 p-4 sm:p-5 rounded-2xl bg-black/60">
                      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                        <span className="font-['Cinzel'] font-bold text-xs text-white">FORM #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-['Cinzel'] font-bold px-2.5 py-0.5 rounded-full ${
                            sub.isSubmitted ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' : 'bg-[#880A45]/30 text-pink-300 border border-[#880A45]/50'
                          }`}>
                            {sub.isSubmitted ? '✓ SUBMITTED' : 'PENDING'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 text-left">
                        <div>
                          <label className="block text-[10px] font-['Cinzel'] font-bold tracking-wider text-gray-400 mb-1 uppercase">
                            CANVA / FIGMA PROJECT URL
                            {sub.canvaFigmaLink && (
                              <a
                                href={sub.canvaFigmaLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-pink-300 hover:underline font-medium"
                              >
                                [OPEN PROJECT ↗]
                              </a>
                            )}
                          </label>
                          <input
                            type="text"
                            readOnly
                            className="w-full h-9 bg-black/60 border border-white/15 rounded-xl px-3 font-medium text-xs text-gray-200 cursor-default"
                            value={sub.canvaFigmaLink || "No design link submitted yet."}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-['Cinzel'] font-bold tracking-wider text-gray-400 mb-1 uppercase">
                            DESIGN NOTES / REMARKS
                          </label>
                          <textarea
                            rows={2}
                            readOnly
                            className="w-full rounded-xl border border-white/15 bg-black/60 px-3 py-2 font-medium text-xs text-gray-200 cursor-default resize-none"
                            value={sub.note || "No design notes provided."}
                          />
                        </div>

                        <div className="flex items-center justify-end pt-2 border-t border-white/10 gap-2 font-['Cinzel'] text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleResetForm(idx)}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 rounded-lg px-3 py-1 cursor-pointer transition uppercase"
                          >
                            RESET (UNLOCK)
                          </button>
                          <button
                            type="button"
                            disabled={manageSubmissionsPopup.submissions.length <= 1}
                            onClick={() => handleRemoveForm(idx)}
                            className={`rounded-lg px-3 py-1 cursor-pointer transition uppercase ${
                              manageSubmissionsPopup.submissions.length <= 1
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed opacity-50"
                                : "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40"
                            }`}
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end font-['Cinzel'] text-xs font-bold border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setManageSubmissionsPopup(null)}
                  className="bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl px-5 py-2.5 transition cursor-pointer uppercase"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddProblems;
