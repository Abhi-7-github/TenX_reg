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
    <div className="fixed inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden bg-black select-none">
      {/* Pure Pitch Black Base */}
      <div className="absolute inset-0 bg-[#000000]" />

      {/* Subtle Ambient Radial Lighting in Theme Colors (#880A45 & #14216F) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_top_right,rgba(136,10,69,0.18)_0%,transparent_60%),radial-gradient(ellipse_80%_60%_at_bottom_left,rgba(20,33,111,0.20)_0%,transparent_60%)]" />

      {/* Base Grid Layer (Subtle Ambient Visibility) */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Interactive Mouse Hover Spotlight Glow */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `
            radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(136, 10, 69, 0.22), rgba(20, 33, 111, 0.18), transparent 75%)
          `
        }}
      />

      {/* Interactive Illuminated Grid (Revealed prominently around the cursor) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.22) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`,
          WebkitMaskImage: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 80%)`
        }}
      />

      {/* Gentle Edge Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
    </div>
  );
};

export default FashionBackground;
