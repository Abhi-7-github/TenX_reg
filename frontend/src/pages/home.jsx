import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowLeft, Upload, Check, AlertTriangle, Crown, 
  Users, User, Phone, Hash, Calendar, Building, Layers, 
  Home as HomeIcon, CreditCard, ShieldCheck, ArrowRight, RefreshCw, Eye
} from 'lucide-react';
import FashionBackground from '../components/FashionBackground';

const Home = () => {
  const navigate = useNavigate();
  const initialMemberState = {
    name: '',
    regNo: '',
    gender: '',
    phoneNo: '',
    year: '',
    branch: '',
    section: '',
    residenceType: 'dayScholar',
    hostelName: '',
    roomNo: '',
    wardenName: '',
    wardenPhoneNo: ''
  };

  const initialFormState = {
    teamName: '',
    teamLeader: { ...initialMemberState },
    teamMember1: { ...initialMemberState },
    teamMember2: { ...initialMemberState },
    teamMember3: { ...initialMemberState }
  };

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('teamRegistrationForm');
    if (savedData) {
      return { ...initialFormState, ...JSON.parse(savedData) };
    }
    return initialFormState;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teamCount, setTeamCount] = useState(0);
  const [maxTeams, setMaxTeams] = useState(50);
  const [showPayment, setShowPayment] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [isTxnChecking, setIsTxnChecking] = useState(false);
  const [txnExists, setTxnExists] = useState(false);
  const [txnCheckMessage, setTxnCheckMessage] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [completedTeamName, setCompletedTeamName] = useState('');
  const [completedTeamLeader, setCompletedTeamLeader] = useState('');
  const [submittedTxnId, setSubmittedTxnId] = useState('');
  const [copiedTxn, setCopiedTxn] = useState(false);
  const [teamNameStatus, setTeamNameStatus] = useState({ checking: false, available: null, message: '' });
  const [qrUrl, setQrUrl] = useState('/payment.png');

  useEffect(() => {
    const fetchQrUrl = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payment-qr`);
        const data = await response.json();
        const url = data.url || data.qrUrl;
        if (data.success && url) {
          setQrUrl(url);
        }
      } catch (error) {
        console.error('Failed to fetch QR url:', error);
      }
    };
    fetchQrUrl();
  }, []);

  useEffect(() => {
    if (registrationComplete) {
      localStorage.removeItem('teamRegistrationForm');
      return;
    }
    localStorage.setItem('teamRegistrationForm', JSON.stringify(formData));
  }, [formData, registrationComplete]);

  useEffect(() => {
    const fetchTeamCount = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teams/count`);
        const data = await response.json();
        if (data.success) {
          setTeamCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch team count:', error);
      }
    };

    const fetchRegistrationStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`);
        const data = await response.json();
        if (data.success) {
          setRegistrationEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Failed to fetch registration status:', error);
      }
    };

    const fetchMaxTeams = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/max-teams`);
        const data = await response.json();
        if (data.success) {
          setMaxTeams(data.maxTeams);
        }
      } catch (error) {
        console.error('Failed to fetch max teams:', error);
      }
    };

    fetchTeamCount();
    fetchRegistrationStatus();
    fetchMaxTeams();
  }, []);

  useEffect(() => {
    if (!showPayment) {
      setIsTxnChecking(false);
      setTxnExists(false);
      setTxnCheckMessage('');
      return;
    }

    const trimmed = transactionId.trim();
    if (!trimmed) {
      setIsTxnChecking(false);
      setTxnExists(false);
      setTxnCheckMessage('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsTxnChecking(true);
      setTxnCheckMessage('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/payment-status/${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        if (response.ok) {
          setTxnExists(true);
          setTxnCheckMessage('Transaction ID already exists');
          return;
        }

        if (response.status === 404) {
          setTxnExists(false);
          setTxnCheckMessage('');
          return;
        }

        const data = await response.json().catch(() => null);
        setTxnExists(false);
        setTxnCheckMessage(data?.message || 'Unable to verify transaction ID');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setTxnExists(false);
          setTxnCheckMessage('Unable to verify transaction ID');
        }
      } finally {
        setIsTxnChecking(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [transactionId, showPayment]);

  const handleChange = (e, memberType) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Numerical restriction for phone numbers and registration numbers
    if (name === 'phoneNo' || name === 'wardenPhoneNo') {
      sanitizedValue = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'regNo') {
      sanitizedValue = value.replace(/\D/g, '');
    } else if (name === 'section') {
      sanitizedValue = value.toUpperCase();
    }

    setFormData(prev => ({
      ...prev,
      [memberType]: {
        ...prev[memberType],
        [name]: sanitizedValue
      }
    }));
  };

  const handleTeamNameChange = (e) => {
    const newTeamName = e.target.value;
    setFormData(prev => ({
      ...prev,
      teamName: newTeamName
    }));

    setTeamNameStatus({ checking: true, available: null, message: '' });

    if (window.teamNameCheckTimeout) {
      clearTimeout(window.teamNameCheckTimeout);
    }

    if (!newTeamName.trim()) {
      setTeamNameStatus({ checking: false, available: null, message: '' });
      return;
    }

    window.teamNameCheckTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/check-team-name/${encodeURIComponent(newTeamName.trim())}`
        );
        const data = await response.json();
        setTeamNameStatus({
          checking: false,
          available: data.available,
          message: data.message
        });
      } catch (error) {
        setTeamNameStatus({ checking: false, available: null, message: '' });
      }
    }, 500);
  };

  const handleProceedToPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    const trimmedTeamName = formData.teamName.trim();
    if (!trimmedTeamName) {
      setError('Please enter your team name');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (trimmedTeamName.length < 2) {
      setError('Team name must be at least 2 characters long');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (teamNameStatus.available === false) {
      setError('Team name already exists. Please choose a different team name');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const members = [
      { data: formData.teamLeader, name: 'Team Leader' },
      { data: formData.teamMember1, name: 'Design Associate 1' },
      { data: formData.teamMember2, name: 'Design Associate 2' },
      { data: formData.teamMember3, name: 'Design Associate 3' }
    ];

    for (const member of members) {
      const name = member.data.name.trim();
      const regNo = member.data.regNo.trim();
      const phoneNo = member.data.phoneNo.trim();
      const branch = member.data.branch.trim();
      const section = member.data.section.trim();

      if (!name) {
        setError(`Please enter full name for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (name.length < 2) {
        setError(`Full name for ${member.name} must be at least 2 characters`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!regNo) {
        setError(`Please enter registration number for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!/^[0-9]+$/.test(regNo)) {
        setError(`Registration number for ${member.name} must contain only digits`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!phoneNo) {
        setError(`Please enter phone number for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (phoneNo.length !== 10 || !/^[0-9]{10}$/.test(phoneNo)) {
        setError(`Phone number for ${member.name} must be exactly 10 digits`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!member.data.year) {
        setError(`Please select academic year for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!branch) {
        setError(`Please enter department / branch for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!section) {
        setError(`Please enter section for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!member.data.gender) {
        setError(`Please select gender for ${member.name}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (member.data.residenceType === 'hosteler') {
        const hostelName = (member.data.hostelName || '').trim();
        const roomNo = (member.data.roomNo || '').trim();

        if (!hostelName) {
          setError(`Please enter hostel name for ${member.name}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (!roomNo) {
          setError(`Please enter room number for ${member.name}`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    const regNos = [
      formData.teamLeader.regNo.trim(),
      formData.teamMember1.regNo.trim(),
      formData.teamMember2.regNo.trim(),
      formData.teamMember3.regNo.trim()
    ];
    const uniqueRegNos = new Set(regNos);
    if (uniqueRegNos.size !== regNos.length) {
      setError('Duplicate registration numbers found. Each team member must have a unique ID.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const phoneNos = [
      formData.teamLeader.phoneNo.trim(),
      formData.teamMember1.phoneNo.trim(),
      formData.teamMember2.phoneNo.trim(),
      formData.teamMember3.phoneNo.trim()
    ];
    const uniquePhones = new Set(phoneNos);
    if (uniquePhones.size !== phoneNos.length) {
      setError('Duplicate contact phone numbers found within the team. Each member must provide their own contact number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // On-demand real-time status check on button click (without polling)
    setLoading(true);
    try {
      const [statusRes, countRes, maxRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teams/count`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/max-teams`)
      ]);

      const [statusData, countData, maxData] = await Promise.all([
        statusRes.json(),
        countRes.json(),
        maxRes.json()
      ]);

      if (statusData.success && !statusData.enabled) {
        setRegistrationEnabled(false);
        setError('Registrations have been paused by event administration.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (countData.success && maxData.success) {
        setTeamCount(countData.count);
        setMaxTeams(maxData.maxTeams);
        if (countData.count >= maxData.maxTeams) {
          setError('Hackathon team capacity has just been reached. No new registrations can be accepted.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      setShowPayment(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (statusErr) {
      console.error('Status check error:', statusErr);
      setShowPayment(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();

    const trimmedTxn = transactionId.trim();
    if (!trimmedTxn) {
      setError('Please enter your payment Transaction / UTR ID');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (trimmedTxn.length < 4) {
      setError('Please enter a valid Transaction / UTR ID');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (txnExists) {
      setError('Transaction ID already exists. Please enter a unique transaction ID');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!receiptFile) {
      setError('Please upload your payment receipt screenshot');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (receiptFile.size > 10 * 1024 * 1024) {
      setError('Receipt file size exceeds 10MB limit. Please upload a smaller image.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // On-demand final status validation
      const statusRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registration-status`);
      const statusData = await statusRes.json();
      if (statusData.success && !statusData.enabled) {
        setRegistrationEnabled(false);
        throw new Error('Registration is currently paused by event administration.');
      }

      const formDataUpload = new FormData();
      formDataUpload.append('receipt', receiptFile);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      try {
        const uploadResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/upload-receipt`, {
          method: 'POST',
          body: formDataUpload,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.message || 'Failed to upload payment receipt');
        }

        const submissionData = {
          ...formData,
          payment: {
            transactionId: transactionId,
            receiptUrl: uploadData.url || uploadData.data?.url || '',
            receiptFileName: receiptFile.name
          }
        };

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to submit registration');
        }

        setSuccess('Team registration and payment submitted successfully!');
        setCompletedTeamName(formData.teamName);
        setCompletedTeamLeader(formData.teamLeader.name);
        setSubmittedTxnId(transactionId);
        setRegistrationComplete(true);
        localStorage.removeItem('teamRegistrationForm');
        setFormData(initialFormState);
        setTransactionId('');
        setReceiptFile(null);
        setShowPayment(false);
        setTeamCount(prev => prev + 1);

        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (uploadErr) {
        clearTimeout(timeoutId);
        if (uploadErr.name === 'AbortError') {
          throw new Error('Upload timed out. Please try with a smaller image file.');
        }
        throw uploadErr;
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting registration');
      console.error('Submission error:', err);

      try {
        const countResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/teams/count`);
        const countData = await countResponse.json();
        if (countData.success) {
          setTeamCount(countData.count);
        }
      } catch (countError) {
        console.error('Failed to refresh team count:', countError);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearMember = (memberType) => {
    setFormData(prev => ({
      ...prev,
      [memberType]: { ...initialMemberState }
    }));
  };

  const renderProtocolCard = (stepNum, memberType, title, subtitle, icon) => (
    <div className="relative pl-6 sm:pl-16 pb-8 sm:pb-10">
      {/* Timeline Node Number Circle */}
      <div className="absolute -left-[15px] sm:-left-[19px] top-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#0F2A1D] border-2 border-[#6B9071] flex items-center justify-center text-[10px] sm:text-xs font-['Montserrat'] font-bold text-[#E3EED4] shadow-md z-10">
        {stepNum}
      </div>

      {/* Card Content */}
      <div className="bg-[#0F2A1D]/90 backdrop-blur-2xl border border-[#6B9071]/30 rounded-2xl p-4 sm:p-7 shadow-lg text-left hover:border-[#6B9071]/50 transition-all">
        {/* Header */}
        <div className="flex justify-between items-start mb-5 pb-3 border-b border-[#6B9071]/20 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-[#375534]/50 border border-[#6B9071]/40 text-[#6B9071] shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-['Montserrat'] font-bold text-[#E3EED4] tracking-tight truncate">
                {title}
              </h3>
              <p className="text-[9px] sm:text-[10px] font-['Montserrat'] tracking-widest text-[#AEC3B0] font-semibold uppercase truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleClearMember(memberType)}
            className="px-2.5 py-1 text-[9px] sm:text-[10px] font-['Montserrat'] font-bold text-[#AEC3B0] hover:text-[#E3EED4] border border-[#6B9071]/30 hover:border-[#6B9071] rounded-lg transition-colors cursor-pointer bg-[#375534]/30 shrink-0"
          >
            CLEAR
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <User className="w-3 h-3 text-[#880A45]" /> FULL NAME
            </label>
            <input
              type="text"
              name="name"
              value={formData[memberType].name}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-gray-600 focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium transition"
              placeholder="Enter Your full name"
              required
            />
          </div>

          {/* Registration Number */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-[#880A45]" /> REGISTRATION NUMBER
            </label>
            <input
              type="tel"
              name="regNo"
              value={formData[memberType].regNo}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-gray-600 focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium font-mono transition"
              placeholder="e.g. 99200000000"
              required
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-[#880A45]" /> PHONE NUMBER
            </label>
            <input
              type="tel"
              name="phoneNo"
              maxLength="10"
              value={formData[memberType].phoneNo}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-gray-600 focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium transition"
              placeholder="10 digit mobile number"
              required
            />
          </div>

          {/* Year */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[#880A45]" /> ACADEMIC YEAR
            </label>
            <select
              name="year"
              value={formData[memberType].year}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium cursor-pointer transition"
              required
            >
              <option value="" className="bg-black text-gray-400">Select Year</option>
              <option value="1" className="bg-black text-white">1st Year</option>
              <option value="2" className="bg-black text-white">2nd Year</option>
              <option value="3" className="bg-black text-white">3rd Year</option>
              <option value="4" className="bg-black text-white">4th Year</option>
              <option value="4" className="bg-black text-white">Other</option>
            </select>
          </div>

          {/* Department / Branch */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <Building className="w-3 h-3 text-[#880A45]" /> DEPARTMENT / BRANCH
            </label>
            <input
              type="text"
              name="branch"
              value={formData[memberType].branch}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-gray-600 focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium uppercase transition"
              placeholder="e.g. CSE / ECE / IT"
              required
            />
          </div>

          {/* Section */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#880A45]" /> SECTION
            </label>
            <input
              type="text"
              name="section"
              value={formData[memberType].section}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-gray-600 focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium uppercase transition"
              placeholder="e.g. A / S20"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase">
              GENDER
            </label>
            <select
              name="gender"
              value={formData[memberType].gender}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium cursor-pointer transition"
              required
            >
              <option value="" className="bg-black text-gray-400">Select Gender</option>
              <option value="Male" className="bg-black text-white">Male</option>
              <option value="Female" className="bg-black text-white">Female</option>
              <option value="Other" className="bg-black text-white">Other</option>
            </select>
          </div>

          {/* Residence Type */}
          <div>
            <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1 sm:mb-1.5 uppercase flex items-center gap-1.5">
              <HomeIcon className="w-3 h-3 text-[#880A45]" /> RESIDENCE TYPE
            </label>
            <select
              name="residenceType"
              value={formData[memberType].residenceType}
              onChange={(e) => handleChange(e, memberType)}
              className="w-full h-10 sm:h-11 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white focus:border-[#880A45] focus:bg-black/80 outline-none text-xs font-medium cursor-pointer transition"
              required
            >
              
              <option value="dayScholar" className="bg-black text-white">Day Scholar</option>
              <option value="hosteler" className="bg-black text-white">Hosteler</option>
            </select>
          </div>
        </div>

        {/* Conditional Hosteler Details */}
        {formData[memberType].residenceType === 'hosteler' && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-400 mb-1 uppercase">
                HOSTEL NAME
              </label>
              <input
                type="text"
                name="hostelName"
                value={formData[memberType].hostelName}
                onChange={(e) => handleChange(e, memberType)}
                className="w-full h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[#880A45]"
                placeholder="e.g. MH / LH"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-400 mb-1 uppercase">
                ROOM NUMBER
              </label>
              <input
                type="text"
                name="roomNo"
                value={formData[memberType].roomNo}
                onChange={(e) => handleChange(e, memberType)}
                className="w-full h-10 px-3 bg-black/40 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-[#880A45]"
                placeholder="e.g. 402"
                required
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRegistrationSuccess = () => (
    <div className="min-h-screen bg-[#E3EED4] flex flex-col font-['Plus_Jakarta_Sans'] select-none text-[#0F2A1D] relative overflow-hidden">
      <FashionBackground />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-8 py-16 sm:py-24 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center"
        >
          {/* Success Glowing Icon Badge */}
          <div className="mb-8 relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#0F2A1D] border-2 border-[#6B9071] shadow-lg">
            <Check className="w-12 h-12 sm:w-14 sm:h-14 text-[#E3EED4] stroke-[2.5]" />
          </div>

          {/* Headline Statement */}
          <h1 className="font-['Montserrat'] font-black text-3xl sm:text-5xl md:text-6xl text-[#0F2A1D] tracking-tight uppercase mb-3">
            You're Locked In!
          </h1>
          <p className="font-['Montserrat'] text-sm sm:text-base font-semibold text-[#375534] max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed px-4">
            Your team registration for 10X AGENTHACK '26 is complete. The AI Agent hackathon awaits your creative input.
          </p>

          {/* Registration Details Glass Panel */}
          <div className="w-full bg-[#0F2A1D] border border-[#6B9071]/30 rounded-2xl p-6 sm:p-8 mb-10 sm:mb-12 relative overflow-hidden shadow-lg text-left">
            <h2 className="font-['Montserrat'] text-xs sm:text-sm uppercase tracking-widest text-[#E3EED4] font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#6B9071]" /> REGISTRATION DETAILS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#07150E] border border-[#6B9071]/30">
                <span className="font-['Montserrat'] text-[10px] uppercase tracking-wider text-[#AEC3B0] font-semibold">
                  TEAM NAME
                </span>
                <span className="font-['Montserrat'] font-bold text-[#E3EED4] text-base sm:text-lg truncate">
                  {completedTeamName || 'Registered Team'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#07150E] border border-[#6B9071]/30">
                <span className="font-['Montserrat'] text-[10px] uppercase tracking-wider text-[#AEC3B0] font-semibold">
                  TEAM LEADER NAME
                </span>
                <span className="font-['Montserrat'] font-bold text-[#E3EED4] text-base sm:text-lg truncate">
                  {completedTeamLeader || 'Lead Participant'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-[#07150E] border border-[#6B9071]/30">
                <span className="font-['Montserrat'] text-[10px] uppercase tracking-wider text-[#AEC3B0] font-semibold">
                  TRANSACTION / UTR ID
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[#E3EED4] text-sm sm:text-base font-bold truncate">
                    {submittedTxnId || 'VERIFIED'}
                  </span>
                  {submittedTxnId && (
                    <button 
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(submittedTxnId);
                        setCopiedTxn(true);
                        setTimeout(() => setCopiedTxn(false), 2000);
                      }}
                      className="p-1 rounded-md text-[#AEC3B0] hover:text-[#E3EED4] bg-[#375534]/50 hover:bg-[#375534] transition cursor-pointer"
                      title="Copy Transaction ID"
                    >
                      {copiedTxn ? <Check size={14} className="text-emerald-400" /> : <Layers size={14} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* What's Next Steps - WhatsApp Only */}
          <div className="w-full mb-10 sm:mb-12 max-w-md mx-auto">
            <h3 className="font-['Montserrat'] font-bold text-xl sm:text-2xl text-center mb-6 text-[#0F2A1D] uppercase tracking-tight">
              What's Next?
            </h3>
            
            <a 
              href="https://chat.whatsapp.com/KeLm4xMCa3v5627TmAxyPx?s=qt&p=a&mlu=0" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-[#0F2A1D] border border-[#6B9071]/40 hover:bg-[#375534] transition-all duration-300 shadow-md group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-[#375534] border border-[#6B9071]/50 flex items-center justify-center mb-4 group-hover:bg-[#6B9071] transition-colors">
                <Sparkles className="w-6 h-6 text-[#E3EED4]" />
              </div>
              <h4 className="font-['Montserrat'] text-sm uppercase tracking-wider font-bold text-[#E3EED4] mb-2">
                Join WhatsApp Group
              </h4>
              <p className="text-xs text-[#AEC3B0] font-normal leading-relaxed">
                Join the official WhatsApp group for live updates, announcements, and hackathon information.
              </p>
            </a>
          </div>

          {/* Return Action */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] font-['Montserrat'] text-xs sm:text-sm font-bold uppercase tracking-widest py-3.5 sm:py-4 px-10 rounded-xl transition-all duration-300 shadow-md inline-flex items-center gap-2.5 cursor-pointer border border-[#6B9071]/50"
          >
            <HomeIcon className="w-4 h-4" />
            <span>RETURN HOME</span>
          </motion.button>

        </motion.div>
      </main>
    </div>
  );

  const renderRegistrationClosed = () => (
    <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none text-white relative overflow-hidden">
      <FashionBackground />
      <Navbar />

      <div className="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-[#0B0616]/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
        >
          <div className="mb-5 flex justify-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#880A45]/30 border border-[#880A45]/60 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(136,10,69,0.4)]">
              <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-[#880A45]" />
            </div>
          </div>

          <span className="font-['Cinzel'] text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#880A45] font-bold block mb-1">
            PORTAL STATUS
          </span>
          <h2 className="text-2xl sm:text-3xl font-['Montserrat'] font-black text-white mb-2 leading-tight uppercase">
            {!registrationEnabled ? 'REGISTRATIONS PAUSED' : 'LIST LIMIT REACHED'}
          </h2>

          <p className="text-gray-400 text-xs font-normal mb-6 leading-relaxed">
            {!registrationEnabled
              ? 'The registration portal is currently paused for jury maintenance. Please check back shortly or follow the WhatsApp group for updates.'
              : `All ${maxTeams} team slots have been allocated. Please contact event coordinators for further inquiries.`}
          </p>

          <div className="space-y-3 mb-6 font-['Cinzel'] text-xs font-bold tracking-wider">
            <motion.a
              whileHover={{ scale: 1.01 }}
              href="https://chat.whatsapp.com/LeCwjIg78Fs0SUll0AMWAx"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-[#880A45] to-[#14216F] text-white py-3 rounded-xl shadow-md text-center transition-all font-bold"
            >
              ✦ JOIN HACKATHON UPDATES (WHATSAPP)
            </motion.a>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl text-xs font-['Cinzel'] tracking-widest font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/15 transition-colors cursor-pointer"
          >
            ← RETURN TO HACKATHON HOME
          </motion.button>
        </motion.div>
      </div>
    </div>
  );

  if (registrationComplete) {
    return renderRegistrationSuccess();
  }

  if (!registrationEnabled || (teamCount >= maxTeams && !registrationComplete)) {
    return renderRegistrationClosed();
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none pb-20 text-white relative overflow-x-hidden">
      {/* Interactive Pitch Black Tech Background with Grid */}
      <FashionBackground />

      {/* Fixed Navigation Bar */}
      <Navbar />

      <main className="max-w-4xl mx-auto w-full px-3 sm:px-6 pt-24 sm:pt-28 flex-grow relative z-10">
        
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="font-['Montserrat'] font-black text-3xl sm:text-5xl md:text-6xl tracking-tight uppercase mb-2 sm:mb-3 bg-gradient-to-r from-[#F5F2EB] via-[#E5DFC9] to-[#8A9A5B] bg-clip-text text-transparent">
            Team Registration
          </h1>
          <p className="font-['Playfair_Display'] text-xs sm:text-base italic text-[#D8CFB5] max-w-xl mx-auto leading-relaxed px-2">
            Register your team for 10X AGENTHACK '26. Fill out all member details below and complete the entry payment to secure your hackathon spot.
          </p>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 sm:mb-8 bg-rose-950/80 border border-rose-500/50 rounded-2xl p-3.5 sm:p-4 text-rose-200 font-['Cinzel'] text-xs tracking-wider shadow-lg flex items-center gap-3"
            >
              <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vertical Connected Timeline Form */}
        <div className="relative border-l-2 border-white/15 ml-2.5 sm:ml-8">
          
          {/* Form details wrapper */}
          <div className={`transition-all duration-300 ${showPayment ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* ================= STEP 01: Team Name ================= */}
            <div className="relative pl-6 sm:pl-16 pb-8 sm:pb-10">
            {/* Timeline Node 01 */}
            <div className="absolute -left-[15px] sm:-left-[19px] top-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#0B0616] border-2 border-[#880A45] flex items-center justify-center text-[10px] sm:text-xs font-['Cinzel'] font-bold text-white shadow-[0_0_12px_rgba(136,10,69,0.5)] z-10">
              01
            </div>

            <div className="bg-[#0B0616]/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 sm:p-7 shadow-[0_12px_35px_rgba(0,0,0,0.8)] text-left hover:border-white/25 transition-all">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-5 pb-3 border-b border-white/10">
                <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 text-[#880A45]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-['Montserrat'] font-bold text-white tracking-tight">
                    Team Information
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-['Cinzel'] tracking-widest text-gray-400 font-semibold uppercase">
                    TEAM DETAILS
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-['Cinzel'] tracking-widest font-semibold text-gray-300 mb-1.5 uppercase flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-[#880A45]" /> TEAM NAME
                </label>
                <input
                  type="text"
                  value={formData.teamName}
                  onChange={handleTeamNameChange}
                  className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-black/60 border border-white/15 rounded-xl text-white placeholder:text-gray-600 focus:border-[#880A45] focus:bg-black/80 outline-none text-xs sm:text-sm font-['Montserrat'] font-bold transition"
                  placeholder="e.g. Neon Threads / Cyber Designers"
                  required
                />

                {teamNameStatus.checking && formData.teamName.trim() && (
                  <p className="text-[10px] font-['Cinzel'] text-gray-400 mt-2 tracking-wider flex items-center gap-1.5">
                    <RefreshCw size={12} className="animate-spin" /> CHECKING TEAM NAME AVAILABILITY...
                  </p>
                )}
                {!teamNameStatus.checking && teamNameStatus.available === true && formData.teamName.trim() && (
                  <p className="text-[10px] font-['Cinzel'] text-emerald-400 mt-2 font-bold tracking-wider flex items-center gap-1.5">
                    <Check size={13} /> TEAM NAME AVAILABLE
                  </p>
                )}
                {!teamNameStatus.checking && teamNameStatus.available === false && formData.teamName.trim() && (
                  <p className="text-[10px] font-['Cinzel'] text-rose-400 mt-2 font-bold tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={13} /> TEAM NAME ALREADY TAKEN
                  </p>
                )}
              </div>
            </div>
          </div>


          {/* ================= STEP 02: Team Leader ================= */}
          {renderProtocolCard(
            '02', 
            'teamLeader', 
            'Team Leader', 
            'LEAD PARTICIPANT DETAILS', 
            <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
          )}


          {/* ================= STEP 03: Team Member 1 ================= */}
          {renderProtocolCard(
            '03', 
            'teamMember1', 
            'Team Member 1', 
            'PARTICIPANT DETAILS', 
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          )}


          {/* ================= STEP 04: Team Member 2 ================= */}
          {renderProtocolCard(
            '04', 
            'teamMember2', 
            'Team Member 2', 
            'PARTICIPANT DETAILS', 
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          )}


          {/* ================= STEP 05: Team Member 3 ================= */}
          {renderProtocolCard(
            '05', 
            'teamMember3', 
            'Team Member 3', 
            'PARTICIPANT DETAILS', 
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          )}


          </div>

          {/* ================= STEP 06: Payment & Verification ================= */}
          <div className="relative pl-6 sm:pl-16 pb-6">
            {/* Timeline Node 06 */}
            <div className="absolute -left-[15px] sm:-left-[19px] top-1.5 w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#0B0616] border-2 border-[#880A45] flex items-center justify-center text-[10px] sm:text-xs font-['Cinzel'] font-bold text-white shadow-[0_0_12px_rgba(136,10,69,0.5)] z-10">
              06
            </div>

            <div className="bg-[#0B0616]/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-4 sm:p-7 shadow-[0_12px_35px_rgba(0,0,0,0.8)] text-left hover:border-white/25 transition-all">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-5 pb-3 border-b border-white/10">
                <div className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 text-emerald-400">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-['Montserrat'] font-bold text-white tracking-tight">
                    Payment & Verification
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-['Cinzel'] tracking-widest text-gray-400 font-semibold uppercase">
                    ENTRY FEE DEPOSIT
                  </p>
                </div>
              </div>

              {!showPayment ? (
                /* Pre-Payment Step Trigger */
                <div className="space-y-4">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-['Cinzel'] text-gray-400 tracking-widest block uppercase">
                        ENTRY FEE BREAKDOWN
                      </span>
                      <span className="font-['Montserrat'] text-lg sm:text-xl font-bold text-white">
                        ₹350 × 4 = ₹1400 <span className="text-xs font-normal text-gray-400 font-sans">/ Team Pass</span>
                      </span>
                    </div>

                    <div className="text-[11px] sm:text-xs text-gray-300">
                      Please check that all 4 member details above are correct before proceeding to the payment scanner.
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleProceedToPayment}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-['Montserrat'] font-bold text-xs sm:text-sm tracking-widest bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span>PROCEED TO PAYMENT SCANNER</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                /* Payment QR & UTR Upload */
                <form onSubmit={handleFinalSubmit} className="space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-center">
                    
                    {/* QR Code Scanner Display */}
                    <div className="flex flex-col items-center p-4 sm:p-5 rounded-2xl bg-[#07150E]/80 border border-[#6B9071]/30 text-center">
                      <div className="p-2.5 sm:p-3 bg-white rounded-2xl mb-3 shadow-md">
                        <img 
                          src={qrUrl} 
                          alt="Payment QR" 
                          className="w-36 h-36 sm:w-44 sm:h-44 object-contain mx-auto"
                        />
                      </div>
                      <span className="font-['Montserrat'] text-[11px] sm:text-xs font-bold text-[#E3EED4]">
                        SCAN VIA ANY UPI APP
                      </span>
                    </div>

                    {/* Transaction Details & Upload */}
                    <div className="space-y-3.5 sm:space-y-4">
                      <div>
                        <label className="block text-[10px] font-['Montserrat'] tracking-widest font-semibold text-[#AEC3B0] mb-1.5 uppercase">
                          TRANSACTION / UTR NUMBER
                        </label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className={`w-full h-10 sm:h-11 px-3 sm:px-4 bg-[#07150E]/90 border rounded-xl text-[#E3EED4] font-mono text-xs outline-none transition ${
                            txnExists ? 'border-rose-500' : 'border-[#6B9071]/40 focus:border-[#6B9071]'
                          }`}
                          placeholder="e.g. 328492019482"
                          required
                        />
                        {isTxnChecking && transactionId.trim() && (
                          <p className="text-[10px] font-['Montserrat'] text-[#AEC3B0] mt-1">VERIFYING TRANSACTION ID...</p>
                        )}
                        {!isTxnChecking && txnCheckMessage && (
                          <p className={`text-[10px] font-['Montserrat'] mt-1 flex items-center gap-1 font-bold ${
                            txnExists ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {txnExists ? <AlertTriangle size={12} /> : <Check size={12} />}
                            {txnCheckMessage}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-['Montserrat'] tracking-widest font-semibold text-[#AEC3B0] mb-1.5 uppercase">
                          PAYMENT RECEIPT (SCREENSHOT)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                          className="w-full text-xs text-[#AEC3B0] file:mr-2.5 sm:file:mr-3 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:text-[11px] sm:file:text-xs file:font-['Montserrat'] file:font-bold file:bg-[#0F2A1D] file:text-[#E3EED4] hover:file:bg-[#375534] cursor-pointer bg-[#07150E]/90 border border-[#6B9071]/30 p-1.5 sm:p-2 rounded-xl"
                          required
                        />
                        <p className="text-[10px] font-['Montserrat'] text-[#AEC3B0] mt-1.5 tracking-wider">
                          *MAXIMUM FILE SIZE: 10MB
                        </p>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setShowPayment(false)}
                          className="w-full sm:w-1/3 py-2.5 sm:py-3 rounded-xl font-['Montserrat'] text-xs font-semibold bg-[#AEC3B0]/20 hover:bg-[#AEC3B0]/30 text-[#E3EED4] border border-[#6B9071]/30 cursor-pointer transition-colors"
                        >
                          EDIT TEAM
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={loading}
                          className="w-full sm:w-2/3 py-2.5 sm:py-3 rounded-xl font-['Montserrat'] text-xs font-bold tracking-widest bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] border border-[#6B9071]/50 shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
                        >
                          {loading ? 'SUBMITTING...' : 'COMPLETE REGISTRATION »'}
                        </motion.button>
                      </div>
                    </div>

                  </div>
                </form>
              )}

            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default Home;