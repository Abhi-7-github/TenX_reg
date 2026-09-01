import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Gem, Users, CreditCard } from 'lucide-react';
import FashionBackground from '../components/FashionBackground';

const Animation = () => {
  const [teamCount, setTeamCount] = useState(0);
  const [maxTeams, setMaxTeams] = useState(50);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const navigate = useNavigate();

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

  const [checkingStatus, setCheckingStatus] = useState(false);

  const handleRegisterClick = async () => {
    setCheckingStatus(true);
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

      const isEnabled = statusData.success ? statusData.enabled : true;
      const currentCount = countData.success ? countData.count : teamCount;
      const currentMax = maxData.success ? maxData.maxTeams : maxTeams;

      setRegistrationEnabled(isEnabled);
      setTeamCount(currentCount);
      setMaxTeams(currentMax);

      if (!isEnabled || currentCount >= currentMax) {
        return;
      }

      navigate('/home');
    } catch (error) {
      console.error('Failed to verify status:', error);
      navigate('/home');
    } finally {
      setCheckingStatus(false);
    }
  };

  const isClosed = teamCount >= maxTeams || !registrationEnabled;
  const progressPercent = Math.min(100, Math.max(0, (teamCount / maxTeams) * 100));
  const slotsRemaining = Math.max(0, maxTeams - teamCount);

  return (
    <div className="min-h-screen bg-black flex flex-col font-['Plus_Jakarta_Sans'] select-none text-white relative overflow-x-hidden">
      {/* Interactive Pitch Black Tech Background with Grid */}
      <FashionBackground />

      {/* Fixed Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-8 md:px-10 lg:px-16 pt-20 sm:pt-24 pb-8 sm:pb-12 relative z-10 min-h-[calc(100vh-80px)]">
        <div className="max-w-7xl w-full mx-auto">
          
          {/* Main 2-Column Responsive Layout for Laptops & Desktops */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-center">
            
            {/* ================= LEFT COLUMN: Typography & Action Console ================= */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="md:col-span-7 flex flex-col justify-center space-y-3.5 sm:space-y-4 text-left order-1"
            >
              {/* Meta Date & Format Pill */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F2A1D] border border-[#6B9071]/50 text-[#E3EED4] font-['Montserrat'] text-[10px] sm:text-xs tracking-wider font-bold">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#6B9071]" />
                  <span>SEPTEMBER 2026 • 24 HOUR AGENT HACKATHON</span>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] sm:text-xs font-['Montserrat'] font-bold ${
                  isClosed
                    ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                    : 'bg-[#375534]/60 border-[#6B9071]/40 text-[#E3EED4]'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-rose-500 animate-pulse' : 'bg-[#6B9071]'}`}></span>
                  <span>{!isClosed ? 'REGISTRATIONS OPEN' : 'REGISTRATIONS FULL'}</span>
                </div>
              </div>

              {/* Headline */}
              <div className="w-full flex items-center gap-4">
                <h1 className="font-['Montserrat'] font-black text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight uppercase text-[#E3EED4] leading-none">
                  10X AGENTHACK <span className="text-[#6B9071]">'26</span>
                </h1>
              </div>

              {/* Mobile-Only Hero Banner */}
              <div className="block md:hidden w-full my-2 rounded-2xl overflow-hidden border border-[#6B9071]/30 shadow-lg">
                <img
                  src="/club_logo.png"
                  alt="10X AGENTHACK '26"
                  className="w-full aspect-[16/10] object-contain p-4 bg-[#0F2A1D]"
                />
              </div>

              {/* Tagline Statement */}
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-[#AEC3B0] font-['Montserrat'] tracking-wide font-medium leading-snug sm:leading-relaxed">
                Build the future.. Deploy intelligent AI Agents.. 10X CLUB KARE
              </p>

              {/* Key Event Highlights Row */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 py-0.5 max-w-lg">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0F2A1D]/90 border border-[#6B9071]/30">
                  <Users className="w-4 h-4 text-[#6B9071] mb-1" />
                  <span className="font-['Montserrat'] text-xs font-bold text-[#E3EED4] block">4 AGENT DEVELOPERS</span>
                  <span className="text-[10px] text-[#AEC3B0]">1 Lead + 3 Members</span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0F2A1D]/90 border border-[#6B9071]/30">
                  <CreditCard className="w-4 h-4 text-[#6B9071] mb-1" />
                  <span className="font-['Montserrat'] text-xs font-bold text-[#E3EED4] block">₹1400</span>
                  <span className="text-[10px] text-[#AEC3B0]">₹350 / Member</span>
                </div>
              </div>

              {/* Live Capacity Tracker */}
              <div className="max-w-lg p-3 sm:p-3.5 rounded-2xl bg-[#0F2A1D]/90 border border-[#6B9071]/30">
                <div className="flex justify-between items-center mb-1.5 text-[11px] sm:text-xs font-['Montserrat'] font-semibold">
                  <span className="text-[#E3EED4] flex items-center gap-1.5">
                    <Gem className="w-3.5 h-3.5 text-[#6B9071]" /> 10X AGENTHACK SLOTS
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full bg-[#07150E] border border-[#6B9071]/30 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-[#375534] via-[#6B9071] to-[#AEC3B0] h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Primary CTA Button */}
              <div className="pt-1 max-w-lg">
                <motion.button
                  whileHover={!isClosed && !checkingStatus ? { scale: 1.02 } : {}}
                  whileTap={!isClosed && !checkingStatus ? { scale: 0.98 } : {}}
                  onClick={handleRegisterClick}
                  disabled={isClosed || checkingStatus}
                  className={`w-full font-['Montserrat'] text-xs sm:text-sm tracking-wider font-bold py-3.5 px-8 rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                    isClosed
                      ? 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-60 border border-white/10'
                      : 'bg-[#0F2A1D] hover:bg-[#375534] text-[#E3EED4] cursor-pointer border border-[#6B9071]/50 shadow-[0_4px_20px_rgba(15,42,29,0.5)]'
                  }`}
                >
                  <span>
                    {checkingStatus
                      ? 'VERIFYING STATUS...'
                      : !registrationEnabled
                      ? 'REGISTRATIONS PAUSED'
                      : teamCount >= maxTeams
                      ? '10X AGENTHACK SLOTS FULL'
                      : 'REGISTER NOW'}
                  </span>
                  {!isClosed && !checkingStatus && <ArrowRight className="w-4 h-4" />}
                </motion.button>
              </div>
            </motion.div>


            {/* ================= RIGHT COLUMN: Logo Card ================= */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="hidden md:flex md:col-span-5 relative order-2 justify-end"
            >
              <div className="relative w-full max-h-[460px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#6B9071]/30 shadow-[0_25px_60px_-15px_rgba(15,42,29,0.9)] group flex flex-col justify-end bg-gradient-to-br from-[#0F2A1D] to-[#07150E] p-6">
                
                {/* Main Logo Display */}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <img
                    src="/club_logo.png"
                    alt="10X AGENTHACK '26 Logo"
                    className="w-full max-h-80 object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
                  />
                </div>

                {/* Ambient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F2A1D]/90 via-transparent to-[#0F2A1D]/30 pointer-events-none" />

                {/* Floating Bottom Card Over Logo */}
                <div className="relative z-10 p-3.5 sm:p-4 rounded-2xl bg-[#0F2A1D]/90 backdrop-blur-xl border border-[#6B9071]/40 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-['Montserrat'] text-xs font-bold tracking-wider text-[#E3EED4]">
                      10X CLUB KARE
                    </span>
                    <span className="text-[10px] font-['Montserrat'] font-bold text-[#AEC3B0] tracking-widest uppercase">
                      OFFICIAL HACKATHON
                    </span>
                  </div>
                  <p className="text-[11px] text-[#AEC3B0] font-normal">
                    AI AGENTS & FUTURE TECHNOLOGIES
                  </p>
                </div>

              </div>
            </motion.div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Animation;