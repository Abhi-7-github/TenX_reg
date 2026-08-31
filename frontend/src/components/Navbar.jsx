import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-50 bg-black/80 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-8 md:px-12 py-2.5 sm:py-3 shadow-[0_4px_30px_rgba(0,0,0,0.9)] select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand Logos */}
        <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
          <img src="/Club_logo.png" alt="Campus Creative" className="h-6 sm:h-8 w-auto object-contain" />
          <img src="/threadathon-logo.png" alt="THREADATHON" className="h-6 sm:h-8 md:h-9 w-auto object-contain" />
        </Link>

        {/* Right: Solid Action Register / Home Button (hidden on '/') */}
        <div>
          {currentPath !== "/" && (
            <Link 
              to="/" 
              className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg bg-[#880A45] hover:bg-[#9E0D52] text-white font-['Montserrat'] text-[11px] sm:text-xs font-bold tracking-wider transition-all duration-200 shadow-sm inline-block"
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
