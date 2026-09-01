import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Search, Check, RotateCw, AlertTriangle, Shield, FileSpreadsheet, Building2, Home, Users, UserCheck, ArrowDownToLine, Lock } from 'lucide-react';
import FashionBackground from '../components/FashionBackground';

const Download = () => {
  const [tab, setTab] = useState('download'); // 'download' or 'status'
  const [loading, setLoading] = useState(false);
  const [downloadingCategory, setDownloadingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Download states
  const [downloadPassword, setDownloadPassword] = useState('');
  const [isDownloadAuthorized, setIsDownloadAuthorized] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Payment status states
  const [statusPassword, setStatusPassword] = useState('');
  const [allPayments, setAllPayments] = useState(null);
  const [statusEdits, setStatusEdits] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [statusGatePassword, setStatusGatePassword] = useState('');
  const [isStatusAuthorized, setIsStatusAuthorized] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [maxTeams, setMaxTeams] = useState(50);
  const [maxTeamsInput, setMaxTeamsInput] = useState('');
  const [modalImage, setModalImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [qrUrl, setQrUrl] = useState('/payment.png');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment-qr`)
      .then(res => res.json())
      .then(data => {
        const url = data.url || data.qrUrl;
        if (data.success && url) setQrUrl(url);
      })
      .catch(console.error);
  }, []);

  const fetchDownloadStats = async (pwd) => {
    const activePwd = pwd || downloadPassword;
    if (!activePwd) return;

    setIsLoadingStats(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/download-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: activePwd }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUnlockDownloadTools = async (e) => {
    e.preventDefault();

    if (!downloadPassword.trim()) {
      setError('Please enter admin access key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/download-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: downloadPassword.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Invalid administrator key');
      }

      setIsDownloadAuthorized(true);
      setStats(data.stats);
      setSuccess('Registry access granted. Select a category below to export.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCategory = async (category, customFileName) => {
    if (!downloadPassword.trim()) {
      setError('Please authenticate first');
      return;
    }

    setDownloadingCategory(category);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/download-teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: downloadPassword.trim(),
          category: category,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to download Excel registry');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${customFileName}_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`${customFileName} Excel exported successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred while exporting the spreadsheet');
      console.error('Download error:', err);
    } finally {
      setDownloadingCategory(null);
    }
  };

  const handleRefreshPayments = async () => {
    if (!statusPassword) {
      setError('Please enter admin access key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/all-payments?password=${statusPassword}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payments');
      }

      setAllPayments(data);
      setStatusEdits((prev) => {
        const next = { ...prev };
        data.data.forEach((team) => {
          if (!next[team.payment.transactionId]) {
            next[team.payment.transactionId] = team.payment.status;
          }
        });
        return next;
      });

      await fetchRegistrationStatus();
      await fetchMaxTeams();
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Fetch payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockStatusTools = async (e) => {
    e.preventDefault();

    if (!statusGatePassword) {
      setError('Please enter admin access key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/all-payments?password=${statusGatePassword}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid administrator key');
      }

      setStatusPassword(statusGatePassword);
      setIsStatusAuthorized(true);
      setAllPayments(data);

      const initialEdits = {};
      data.data.forEach((team) => {
        initialEdits[team.payment.transactionId] = team.payment.status;
      });
      setStatusEdits(initialEdits);

      await fetchRegistrationStatus();
      await fetchMaxTeams();
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Status unlock error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectUpdateStatus = async (transactionId, newStatus) => {
    if (!statusPassword) {
      setError('Please enter admin access key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/update-payment-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: statusPassword,
            transactionId: transactionId,
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setStatusEdits((prev) => ({
        ...prev,
        [transactionId]: newStatus
      }));

      setAllPayments((prev) => {
        if (!prev) return prev;
        const updated = prev.data.map((team) =>
          team.payment.transactionId === transactionId
            ? { ...team, payment: { ...team.payment, status: newStatus } }
            : team
        );
        const counts = { pending: 0, verified: 0, rejected: 0 };
        updated.forEach((t) => counts[t.payment.status]++);
        return { data: updated, statusCounts: counts };
      });

      setSuccess(`Transaction ${transactionId} updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Update status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`);
      const data = await response.json();
      if (response.ok && data.success) {
        setRegistrationEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Failed to fetch registration status:', err);
    }
  };

  const fetchMaxTeams = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/max-teams`);
      const data = await response.json();
      if (response.ok && data.success) {
        setMaxTeams(data.maxTeams);
        setMaxTeamsInput(data.maxTeams.toString());
      }
    } catch (err) {
      console.error('Failed to fetch max teams:', err);
    }
  };

  const handleUpdateMaxTeams = async () => {
    if (!statusPassword) {
      setError('Please enter admin access key');
      return;
    }

    const newMaxTeams = parseInt(maxTeamsInput);
    if (isNaN(newMaxTeams) || newMaxTeams < 1) {
      setError('Max teams must be a positive number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/update-max-teams`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: statusPassword,
            maxTeams: newMaxTeams
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update max teams');
      }

      setMaxTeams(newMaxTeams);
      setSuccess(`Registration capacity updated to ${newMaxTeams}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Update max teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!statusPassword) {
      setError('Please enter admin access key');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/toggle-registration`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: statusPassword,
            enabled: !registrationEnabled
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle registration');
      }

      setRegistrationEnabled(data.enabled);
      setSuccess(`Registrations ${data.enabled ? 'opened' : 'closed'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Toggle registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQRUpload = async () => {
    if (!statusPassword) return setError('Please enter admin access key');
    if (!qrFile) return setError('Please select a QR code image to upload');
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('password', statusPassword);
    formData.append('qrCode', qrFile);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload-qr`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to upload QR code');
      setSuccess('Payment QR code updated successfully');
      setQrFile(null);
      const url = data.url || data.qrUrl;
      if (url) setQrUrl(url);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'An error occurred during upload');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBubbleStyle = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-bold';
      case 'rejected':
        return 'bg-rose-950/80 text-rose-400 border border-rose-500/40 font-bold';
      case 'pending':
        return 'bg-[#880A45]/30 text-pink-300 border border-[#880A45]/50 font-bold';
      default:
        return 'bg-white/10 text-gray-200 border border-white/15';
    }
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setModalImage(null);
    setIsModalOpen(false);
  };

  // Export categories definition
  const exportCards = [
    {
      id: 'master',
      category: 'master',
      title: 'Master Team Registry',
      fileName: 'Master_Team_Registrations',
      description: 'Complete workbook with all registered teams, member roles, contact details, payment receipts, and timestamps.',
      tag: 'ALL REGISTERED MEMBERS',
      icon: Users,
      count: stats ? `${stats.totalTeams} Teams • ${stats.totalStudents} Students` : null,
      highlight: true,
    },
    {
      id: 'hostel-girls',
      category: 'hostel-girls',
      title: 'Hostel Girls Registry',
      fileName: 'Hostel_Girls_Registrations',
      description: 'Filtered Excel list of all female hosteler students including hostel block, room number, warden name, and warden contact.',
      tag: 'HOSTEL GIRLS',
      icon: Building2,
      count: stats ? `${stats.hostelGirls} Students` : null,
      highlight: false,
    },
    {
      id: 'hostel-boys',
      category: 'hostel-boys',
      title: 'Hostel Boys Registry',
      fileName: 'Hostel_Boys_Registrations',
      description: 'Filtered Excel list of all male hosteler students including hostel block, room number, warden name, and warden contact.',
      tag: 'HOSTEL BOYS',
      icon: Building2,
      count: stats ? `${stats.hostelBoys} Students` : null,
      highlight: false,
    },
    {
      id: 'dayscholar-girls',
      category: 'dayscholar-girls',
      title: 'Day Scholar Girls Registry',
      fileName: 'DayScholar_Girls_Registrations',
      description: 'Filtered Excel list of all female day scholar students with registration numbers, branch, section, and contact info.',
      tag: 'DAY SCHOLAR GIRLS',
      icon: Home,
      count: stats ? `${stats.dayScholarGirls} Students` : null,
      highlight: false,
    },
    {
      id: 'dayscholar-boys',
      category: 'dayscholar-boys',
      title: 'Day Scholar Boys Registry',
      fileName: 'DayScholar_Boys_Registrations',
      description: 'Filtered Excel list of all male day scholar students with registration numbers, branch, section, and contact info.',
      tag: 'DAY SCHOLAR BOYS',
      icon: Home,
      count: stats ? `${stats.dayScholarBoys} Students` : null,
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#E3EED4] flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-16 text-[#0F2A1D] relative overflow-x-hidden">
      {/* Background Component */}
      <FashionBackground />

      <Navbar />

      {/* Image Modal Lightbox */}
      <AnimatePresence>
        {isModalOpen && modalImage && (
          <div className="fixed inset-0 bg-[#0F2A1D]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-xl w-full bg-[#0F2A1D] border border-[#6B9071]/40 p-6 rounded-3xl shadow-2xl text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-3.5 left-6 bg-[#375534] text-[#E3EED4] font-['Montserrat'] text-[10px] font-bold tracking-widest px-3 py-0.5 rounded-lg shadow-sm border border-[#6B9071]/40">
                RECEIPT PROOF
              </div>
              <button
                onClick={closeImageModal}
                className="absolute -top-3.5 right-4 bg-[#07150E] text-[#AEC3B0] border border-[#6B9071]/40 font-['Montserrat'] text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm cursor-pointer hover:bg-[#375534] hover:text-[#E3EED4] transition"
              >
                ✕ CLOSE
              </button>
              <div className="border border-[#6B9071]/30 rounded-2xl overflow-hidden mt-4 bg-[#07150E] p-2 shadow-inner">
                <img
                  src={modalImage}
                  alt="Receipt full view"
                  className="max-w-full max-h-[60vh] object-contain mx-auto rounded-xl"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Page Expanded Main Canvas */}
      <div className="flex-grow w-full px-4 sm:px-8 md:px-12 pt-24 sm:pt-28 relative z-10">

        {/* Top Header Bar */}
        <header className="bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-5 sm:p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden shadow-lg text-left">
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-['Montserrat'] font-extrabold tracking-tight uppercase mb-1 text-[#E3EED4]">
              EXECUTIVE CONSOLE
            </h1>
            <p className="text-[#AEC3B0] font-['Montserrat'] text-xs tracking-widest font-semibold uppercase">
              Categorized Excel Registry Hub & Pass Verification
            </p>
          </div>

          {/* Tab Selector Buttons in Header */}
          <div className="flex flex-wrap gap-2.5 mt-4 md:mt-0 relative z-10 font-['Montserrat'] text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab('download');
                setError('');
                setSuccess('');
              }}
              className={`px-4 sm:px-5 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
                tab === 'download'
                  ? 'bg-[#375534] text-[#E3EED4] shadow-md border border-[#6B9071]/60'
                  : 'bg-[#07150E]/60 text-[#AEC3B0] border border-[#6B9071]/30 hover:bg-[#375534]/50 hover:text-[#E3EED4]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#6B9071]" />
              Excel Export Hub
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('status');
                setError('');
                setSuccess('');
              }}
              className={`px-4 sm:px-5 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5 ${
                tab === 'status'
                  ? 'bg-[#375534] text-[#E3EED4] shadow-md border border-[#6B9071]/60'
                  : 'bg-[#07150E]/60 text-[#AEC3B0] border border-[#6B9071]/30 hover:bg-[#375534]/50 hover:text-[#E3EED4]'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#6B9071]" />
              Verify Passes
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-5 bg-rose-950/90 border border-rose-500/40 rounded-2xl p-4 text-rose-200 font-['Montserrat'] text-xs tracking-wide shadow-md flex items-center gap-2.5 text-left"
            >
              <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Success Banner */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-5 bg-[#375534] border border-[#6B9071]/60 rounded-2xl p-4 text-[#E3EED4] font-['Montserrat'] text-xs tracking-wide shadow-md flex items-center gap-2.5 text-left"
            >
              <Check size={18} className="text-[#6B9071] flex-shrink-0" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- DOWNLOAD / EXCEL EXPORT HUB TAB ----------------- */}
        {tab === 'download' && (
          <div className="space-y-6">

            {/* Authentication Gate for Downloads */}
            {!isDownloadAuthorized ? (
              <div className="bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-6 sm:p-10 shadow-lg relative text-center max-w-xl mx-auto">
                <div className="absolute -top-3 left-6 bg-[#375534] text-[#E3EED4] px-3.5 py-0.5 rounded-lg text-[10px] font-['Montserrat'] font-bold uppercase tracking-widest border border-[#6B9071]/40 shadow-md">
                  Excel Registry Vault
                </div>

                <div className="text-center mb-6 mt-2 flex flex-col items-center">
                  <h2 className="text-xl sm:text-2xl font-['Montserrat'] font-bold text-[#E3EED4] uppercase mb-1">
                    AUTHENTICATE EXCEL HUB
                  </h2>
                  <p className="text-xs text-[#AEC3B0] font-normal">
                    Enter your administrative passcode to unlock categorized student & team Excel downloads.
                  </p>
                </div>

                <form onSubmit={handleUnlockDownloadTools} className="space-y-4 max-w-sm mx-auto text-left">
                  <div>
                    <label className="block text-[10px] font-['Montserrat'] font-semibold tracking-widest text-[#AEC3B0] mb-1.5 uppercase">
                      ADMINISTRATIVE ACCESS KEY
                    </label>
                    <input
                      type="password"
                      value={downloadPassword}
                      onChange={(e) => setDownloadPassword(e.target.value)}
                      className="w-full h-11 bg-[#07150E] border border-[#6B9071]/30 rounded-xl px-4 focus:border-[#6B9071] outline-none transition font-medium text-xs text-[#E3EED4]"
                      placeholder="Enter administrator key"
                      required
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-['Montserrat'] font-bold text-xs tracking-widest bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase"
                  >
                    {loading ? 'AUTHENTICATING...' : 'UNLOCK EXCEL HUB »'}
                  </motion.button>
                </form>
              </div>
            ) : (
              /* Authorized: Categorized Excel Exports Dashboard */
              <div className="space-y-6">

                {/* Top Metrics Banner */}
                {stats && (
                  <div className="bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-5 sm:p-6 shadow-lg relative text-left">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-[#E3EED4] uppercase">
                          STUDENT DEMOGRAPHICS BREAKDOWN
                        </h3>
                        <p className="text-xs text-[#AEC3B0] font-normal">
                          Live counts of registered teams and members across residence & gender categories.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchDownloadStats()}
                        disabled={isLoadingStats}
                        className="px-4 py-1.5 rounded-xl bg-[#375534] hover:bg-[#6B9071] text-[#E3EED4] border border-[#6B9071]/40 text-xs font-['Montserrat'] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <RotateCw size={12} className={isLoadingStats ? 'animate-spin' : ''} />
                        Refresh Counts
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold font-['Montserrat'] text-[#E3EED4]">{stats.totalTeams}</p>
                        <p className="text-[9px] font-['Montserrat'] font-bold text-[#AEC3B0] uppercase tracking-wider">Total Teams</p>
                      </div>
                      <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold font-['Montserrat'] text-[#AEC3B0]">{stats.totalStudents}</p>
                        <p className="text-[9px] font-['Montserrat'] font-bold text-[#AEC3B0] uppercase tracking-wider">Total Members</p>
                      </div>
                      <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold font-['Montserrat'] text-[#E3EED4]">{stats.hostelGirls}</p>
                        <p className="text-[9px] font-['Montserrat'] font-bold text-[#AEC3B0] uppercase tracking-wider">Hostel Girls</p>
                      </div>
                      <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold font-['Montserrat'] text-[#E3EED4]">{stats.hostelBoys}</p>
                        <p className="text-[9px] font-['Montserrat'] font-bold text-[#AEC3B0] uppercase tracking-wider">Hostel Boys</p>
                      </div>
                      <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold font-['Montserrat'] text-[#E3EED4]">{stats.dayScholarGirls}</p>
                        <p className="text-[9px] font-['Montserrat'] font-bold text-[#AEC3B0] uppercase tracking-wider">Day Scholar Girls</p>
                      </div>
                      <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold font-['Montserrat'] text-[#E3EED4]">{stats.dayScholarBoys}</p>
                        <p className="text-[9px] font-['Montserrat'] font-bold text-[#AEC3B0] uppercase tracking-wider">Day Scholar Boys</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5 Distinct Categorized Excel Export Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {exportCards.map((card) => {
                    const isDownloading = downloadingCategory === card.category;
                    const IconComponent = card.icon;

                    return (
                      <div
                        key={card.id}
                        className={`rounded-2xl p-6 flex flex-col justify-between shadow-lg relative transition-all bg-[#0F2A1D] border ${
                          card.highlight
                            ? 'border-2 border-[#6B9071]'
                            : 'border-[#6B9071]/30 hover:border-[#6B9071]/60'
                        }`}
                      >
                        {/* Top Badge */}
                        <div className="flex justify-between items-start mb-3">
                          <span className={`font-['Montserrat'] text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                            card.highlight
                              ? 'bg-[#375534] text-[#E3EED4] shadow-sm'
                              : 'bg-[#375534]/50 text-[#AEC3B0] border border-[#6B9071]/40'
                          }`}>
                            {card.tag}
                          </span>

                          {card.count && (
                            <span className="text-[11px] font-mono font-bold text-[#E3EED4] bg-[#07150E] border border-[#6B9071]/30 px-2.5 py-0.5 rounded-lg">
                              {card.count}
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-2 mb-6">
                          <h3 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-[#E3EED4] uppercase flex items-center gap-2">
                            <IconComponent className="w-5 h-5 text-[#6B9071] flex-shrink-0" />
                            <span>{card.title}</span>
                          </h3>
                          <p className="text-xs text-[#AEC3B0] font-normal leading-relaxed">
                            {card.description}
                          </p>
                        </div>

                        {/* Download CTA Button */}
                        <div>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            disabled={Boolean(downloadingCategory)}
                            onClick={() => handleDownloadCategory(card.category, card.fileName)}
                            className="w-full py-3 px-4 rounded-xl font-['Montserrat'] font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50"
                          >
                            <ArrowDownToLine className={`w-4 h-4 text-[#6B9071] ${isDownloading ? 'animate-bounce' : ''}`} />
                            <span>
                              {isDownloading ? 'EXPORTING EXCEL (.XLSX)...' : 'DOWNLOAD EXCEL (.XLSX) »'}
                            </span>
                          </motion.button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        )}

        {/* ----------------- VERIFICATION PASSES TAB ----------------- */}
        {tab === 'status' && !isStatusAuthorized && (
          <div className="bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-6 sm:p-10 shadow-lg relative text-center max-w-xl mx-auto">
            <div className="absolute -top-3 left-6 bg-[#375534] text-[#E3EED4] px-3.5 py-0.5 rounded-lg text-[10px] font-['Montserrat'] font-bold uppercase tracking-widest border border-[#6B9071]/40 shadow-md">
              Jury Authentication
            </div>

            <div className="text-center mb-6 mt-2 flex flex-col items-center">
              <h2 className="text-xl sm:text-2xl font-['Montserrat'] font-bold text-[#E3EED4] uppercase mb-1">
                RESTRICTED EXECUTIVE ACCESS
              </h2>
              <p className="text-xs text-[#AEC3B0] font-normal">
                Submit jury passcode to access receipt verification and event controls.
              </p>
            </div>

            <form onSubmit={handleUnlockStatusTools} className="space-y-4 max-w-sm mx-auto text-left">
              <div>
                <label className="block text-[10px] font-['Montserrat'] font-semibold tracking-widest text-[#AEC3B0] mb-1.5 uppercase">
                  ADMINISTRATIVE ACCESS KEY
                </label>
                <input
                  type="password"
                  value={statusGatePassword}
                  onChange={(e) => setStatusGatePassword(e.target.value)}
                  className="w-full h-11 bg-[#07150E] border border-[#6B9071]/30 rounded-xl px-4 focus:border-[#6B9071] outline-none transition font-medium text-xs text-[#E3EED4]"
                  placeholder="Enter administrator key"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-['Montserrat'] font-bold text-xs tracking-widest bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 uppercase"
              >
                {loading ? 'AUTHENTICATING...' : 'UNLOCK JURY CONSOLE »'}
              </motion.button>
            </form>
          </div>
        )}

        {/* ----------------- VERIFICATION COMMAND STATION ----------------- */}
        {tab === 'status' && isStatusAuthorized && (
          <div className="space-y-6">

            {/* System controls widget */}
            <div className="bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-5 sm:p-6 shadow-lg relative text-left">
              <div className="absolute -top-3 left-6 bg-[#375534] text-[#E3EED4] px-3.5 py-0.5 rounded-lg text-[10px] font-['Montserrat'] font-bold uppercase tracking-widest border border-[#6B9071]/40 shadow-md">
                Configuration
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-[#E3EED4] uppercase">REGISTRATION PORTAL</h3>
                  <p className="text-xs text-[#AEC3B0] font-normal">Control global registration intake and team limits.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className={`px-3.5 py-1.5 rounded-full font-['Montserrat'] font-bold text-xs ${
                    registrationEnabled ? 'bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                  }`}>
                    {registrationEnabled ? 'PORTAL ACTIVE' : 'PORTAL PAUSED'}
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleRegistration}
                    disabled={loading}
                    className={`px-5 py-2 rounded-xl font-['Montserrat'] font-bold text-xs tracking-wider cursor-pointer transition-all uppercase ${
                      registrationEnabled ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40' : 'bg-[#375534] hover:bg-[#6B9071] text-[#E3EED4] border border-[#6B9071]/50'
                    }`}
                  >
                    {registrationEnabled ? '🔒 PAUSE REGISTRATIONS' : '✓ OPEN REGISTRATIONS'}
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#6B9071]/20">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="w-full sm:max-w-xs">
                    <label className="block text-[10px] font-['Montserrat'] font-semibold tracking-widest text-[#AEC3B0] mb-1.5 uppercase">
                      MAXIMUM LIST CAPACITY
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={maxTeamsInput}
                        onChange={(e) => setMaxTeamsInput(e.target.value)}
                        className="flex-grow h-10 bg-[#07150E] text-[#E3EED4] border border-[#6B9071]/30 rounded-xl px-3 focus:border-[#6B9071] outline-none font-bold text-xs"
                        placeholder="Limit"
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={handleUpdateMaxTeams}
                        disabled={loading}
                        className="bg-[#375534] hover:bg-[#6B9071] text-[#E3EED4] font-['Montserrat'] font-bold text-xs rounded-xl px-4 shadow-md cursor-pointer transition uppercase"
                      >
                        UPDATE
                      </button>
                    </div>
                  </div>
                  <div className="font-['Montserrat'] text-xs text-[#AEC3B0] font-semibold tracking-wider pb-2">
                    CURRENT CAP: <span className="font-bold text-[#E3EED4]">{maxTeams} TEAMS</span>
                  </div>
                </div>
              </div>

              {/* QR Upload Section */}
              <div className="mt-5 pt-4 border-t border-[#6B9071]/20">
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <label className="block text-[10px] font-['Montserrat'] font-semibold tracking-widest text-[#AEC3B0] mb-1.5 uppercase">
                      UPDATE PAYMENT QR CODE
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="flex flex-col gap-2 w-full sm:max-w-md">
                        <input
                          key={qrFile ? qrFile.name : 'empty'}
                          type="file"
                          accept="image/*"
                          onChange={(e) => setQrFile(e.target.files[0])}
                          className="flex-grow h-10 bg-[#07150E] text-[#AEC3B0] border border-[#6B9071]/30 rounded-xl px-3 py-2 outline-none font-medium text-xs file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-['Montserrat'] file:font-bold file:bg-[#375534] file:text-[#E3EED4] hover:file:bg-[#6B9071] transition-all cursor-pointer"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleQRUpload}
                            disabled={loading || !qrFile}
                            className="flex-grow bg-[#0F2A1D] hover:bg-[#375534] disabled:opacity-50 text-[#E3EED4] font-['Montserrat'] font-bold text-xs rounded-xl px-4 py-3 shadow-md cursor-pointer transition uppercase"
                          >
                            UPLOAD QR
                          </button>
                          {qrFile && (
                            <button
                              type="button"
                              onClick={() => setQrFile(null)}
                              disabled={loading}
                              className="bg-[#AEC3B0]/20 hover:bg-[#AEC3B0]/30 border border-[#6B9071]/30 text-[#E3EED4] font-['Montserrat'] font-bold text-xs rounded-xl px-4 py-3 shadow-md cursor-pointer transition uppercase"
                            >
                              CANCEL
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-2 bg-[#07150E] border border-[#6B9071]/30 rounded-xl shadow-md flex-shrink-0">
                        <p className="text-[9px] font-['Montserrat'] text-[#AEC3B0] uppercase tracking-widest mb-1 text-center font-bold">
                          {qrFile ? "PREVIEW" : "CURRENT QR"}
                        </p>
                        <img 
                          src={qrFile ? URL.createObjectURL(qrFile) : qrUrl} 
                          alt="Payment QR" 
                          className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto rounded-lg bg-white p-1.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Table */}
            <div className="bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-5 sm:p-6 shadow-lg relative text-left">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-['Montserrat'] font-bold text-[#E3EED4] uppercase">PASS VERIFICATION</h2>
                  <p className="text-xs text-[#AEC3B0] font-normal">Review and verify incoming team entry payment receipts.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshPayments}
                  disabled={loading}
                  className="bg-[#375534] hover:bg-[#6B9071] border border-[#6B9071]/40 text-[#E3EED4] font-['Montserrat'] font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1.5 cursor-pointer transition uppercase"
                >
                  <RotateCw size={14} className={loading ? "animate-spin" : ""} /> REFRESH LIST
                </button>
              </div>

              {!allPayments ? (
                <div className="text-center font-['Montserrat'] text-[#AEC3B0] py-8 tracking-widest text-xs">
                  RETRIEVING TEAM SUBMISSIONS...
                </div>
              ) : (
                <>
                  {/* Filter Search */}
                  <div className="mb-5">
                    <label className="block text-[10px] font-['Montserrat'] font-semibold tracking-widest text-[#AEC3B0] mb-1.5 uppercase">
                      FILTER BY TEAM NAME OR UTR TRANSACTION ID
                    </label>
                    <input
                      type="text"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full h-11 bg-[#07150E] border border-[#6B9071]/30 rounded-xl px-4 focus:border-[#6B9071] outline-none font-medium text-xs text-[#E3EED4] placeholder:text-[#AEC3B0]/60"
                      placeholder="Type team name or transaction ID to filter..."
                    />
                  </div>

                  {/* Stat Metric Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-['Montserrat'] font-bold text-[#E3EED4] mb-0.5">{allPayments.statusCounts.pending}</p>
                      <p className="text-[10px] font-['Montserrat'] font-bold tracking-widest text-[#AEC3B0] uppercase">PENDING JURY REVIEW</p>
                    </div>

                    <div className="bg-[#07150E] border border-[#6B9071]/30 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-['Montserrat'] font-bold text-emerald-400 mb-0.5">{allPayments.statusCounts.verified}</p>
                      <p className="text-[10px] font-['Montserrat'] font-bold tracking-widest text-emerald-300 uppercase">VERIFIED TEAMS</p>
                    </div>

                    <div className="bg-[#07150E] border border-rose-500/30 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-['Montserrat'] font-bold text-rose-400 mb-0.5">{allPayments.statusCounts.rejected}</p>
                      <p className="text-[10px] font-['Montserrat'] font-bold tracking-widest text-rose-300 uppercase">REJECTED ENTRIES</p>
                    </div>
                  </div>

                  {/* Table List */}
                  <div className="overflow-x-auto border border-[#6B9071]/30 rounded-xl bg-[#07150E]">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0F2A1D] text-[#E3EED4] font-['Montserrat'] text-xs tracking-wider border-b border-[#6B9071]/30">
                          <th className="px-4 py-3 text-left border-r border-[#6B9071]/20">TEAM NAME</th>
                          <th className="px-4 py-3 text-left border-r border-[#6B9071]/20">TRANSACTION UTR</th>
                          <th className="px-4 py-3 text-center border-r border-[#6B9071]/20">RECEIPT</th>
                          <th className="px-4 py-3 text-left border-r border-[#6B9071]/20">SUBMISSION DATE</th>
                          <th className="px-4 py-3 text-center border-r border-[#6B9071]/20">STATUS</th>
                          <th className="px-4 py-3 text-center">JURY DECISION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allPayments.data.filter((team) => {
                          const query = statusFilter.trim().toLowerCase();
                          if (!query) return true;
                          const teamName = team.teamName.toLowerCase();
                          const txn = team.payment.transactionId.toLowerCase();
                          return teamName.includes(query) || txn.includes(query);
                        }).map((team) => {
                          const currentStatus = statusEdits[team.payment.transactionId] || team.payment.status;
                          return (
                            <tr
                              key={team._id}
                              className="border-b border-[#6B9071]/20 hover:bg-[#375534]/20 text-[#E3EED4] transition-colors"
                            >
                              <td className="px-4 py-3.5 border-r border-[#6B9071]/20 font-['Montserrat'] font-bold text-sm text-[#E3EED4]">{team.teamName}</td>
                              <td className="px-4 py-3.5 border-r border-[#6B9071]/20 font-mono text-[11px] text-[#AEC3B0] font-bold select-all">{team.payment.transactionId}</td>
                              <td className="px-4 py-3.5 border-r border-[#6B9071]/20 text-center">
                                {team.payment.receiptUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => openImageModal(team.payment.receiptUrl)}
                                    className="bg-[#375534] hover:bg-[#6B9071] text-[#E3EED4] border border-[#6B9071]/40 rounded-lg px-3 py-1 font-['Montserrat'] text-[10px] font-bold cursor-pointer transition uppercase"
                                  >
                                    VIEW RECEIPT
                                  </button>
                                ) : (
                                  <span className="text-[#AEC3B0]/60 font-['Montserrat'] text-[9px] uppercase">NO RECEIPT</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 border-r border-[#6B9071]/20 text-[11px] text-[#AEC3B0] font-normal">
                                {new Date(team.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                              </td>
                              <td className="px-4 py-3.5 border-r border-[#6B9071]/20 text-center">
                                <div className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-['Montserrat'] ${
                                  currentStatus === 'verified'
                                    ? 'bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50 font-bold'
                                    : currentStatus === 'rejected'
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold'
                                    : 'bg-[#AEC3B0]/20 text-[#E3EED4] border border-[#6B9071]/30 font-bold'
                                }`}>
                                  {currentStatus.toUpperCase()}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center font-['Montserrat'] text-[10px] font-bold">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDirectUpdateStatus(team.payment.transactionId, 'verified')}
                                    disabled={loading || currentStatus === 'verified'}
                                    className={`rounded-lg px-3 py-1 cursor-pointer transition uppercase ${
                                      currentStatus === 'verified'
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                        : 'bg-[#375534] hover:bg-[#6B9071] text-[#E3EED4] border border-[#6B9071]/50'
                                    }`}
                                  >
                                    VERIFY
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectUpdateStatus(team.payment.transactionId, 'rejected')}
                                    disabled={loading || currentStatus === 'rejected'}
                                    className={`rounded-lg px-3 py-1 cursor-pointer transition uppercase ${
                                      currentStatus === 'rejected'
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                        : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40'
                                    }`}
                                  >
                                    REJECT
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Download;
