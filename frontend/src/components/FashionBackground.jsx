import React, { useState, useEffect } from 'react';

export const FashionBackground = () => {
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden bg-[#0F2A1D] select-none">
      {/* Deep Forest Base */}
      <div className="absolute inset-0 bg-[#0F2A1D]" />

      {/* Subtle Ambient Radial Lighting in Deep Forest & Sage (#375534, #6B9071 & #AEC3B0) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_top_right,rgba(107,144,113,0.22)_0%,transparent_60%),radial-gradient(ellipse_80%_60%_at_bottom_left,rgba(55,85,52,0.28)_0%,transparent_60%)]" />

      {/* Base Grid Layer */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(174, 195, 176, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(174, 195, 176, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '70px 70px'
        }}
      />

      {/* Interactive Mouse Hover Spotlight Glow */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `
            radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(107, 144, 113, 0.22), rgba(55, 85, 52, 0.18), transparent 75%)
          `
        }}
      />

      {/* Interactive Illuminated Grid */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(227, 238, 212, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(227, 238, 212, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '70px 70px',
          maskImage: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`
        }}
      />

      {/* Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,21,14,0.75)_100%)] pointer-events-none" />
    </div>
  );
};

export default FashionBackground;
