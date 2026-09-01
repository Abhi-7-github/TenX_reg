import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-[#0F2A1D]/90 backdrop-blur-2xl border-b border-[#AEC3B0]/20 px-4 sm:px-8 md:px-12 py-2.5 sm:py-3 shadow-[0_4px_25px_rgba(15,42,29,0.4)] select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 sm:gap-4 group">
          <img src="/club_logo.png" alt="10X CLUB KARE" className="h-8 sm:h-10 md:h-11 w-auto object-contain rounded-full border border-[#6B9071]/40 group-hover:scale-105 transition-transform duration-300 shadow-md" />
          <div className="flex flex-col">
            <span className="text-[#E3EED4] font-['Montserrat'] font-extrabold text-sm sm:text-lg tracking-wider group-hover:text-[#AEC3B0] transition-colors leading-none">
              10X AGENTHACK <span className="text-[#6B9071]">'26</span>
            </span>
            <span className="text-[#AEC3B0]/80 font-['Montserrat'] text-[9px] sm:text-[10px] tracking-widest font-semibold uppercase">
              10X CLUB KARE
            </span>
          </div>
        </Link>

        {/* Right: Action Button */}
        <div>
          {currentPath !== "/" && (
            <Link 
              to="/" 
              className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl bg-[#375534] hover:bg-[#6B9071] text-[#E3EED4] font-['Montserrat'] text-[11px] sm:text-xs font-bold tracking-wider transition-all duration-200 shadow-md border border-[#6B9071]/40 inline-block"
            >
              HOME
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
