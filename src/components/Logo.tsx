import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = '', size = 48, showText = true }: LogoProps) {
  // Motion values for interactive 3D parallax tilt effect on hover to enhance physical realism
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map mouse positions to detailed 3D rotational values (subtle, natural parallax)
  const rotateX = useTransform(y, [-30, 30], [12, -12]);
  const rotateY = useTransform(x, [-30, 30], [-12, 12]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      {/* 3D Perspective Wrapper */}
      <div 
        className="relative cursor-pointer"
        style={{ perspective: 1000 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Soft, immersive double golden aura radiating beneath the icon frame for extra warmth and glowing realism */}
        <motion.div 
          className="absolute inset-0 rounded-[22.37%] bg-[#ffd740]/15 blur-xl pointer-events-none"
          animate={{
            scale: [0.9, 1.15, 0.9],
            opacity: [0.4, 0.75, 0.4],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Master Scaled Render Container carrying the high-resolution device icon */}
        <motion.div
          className="relative overflow-hidden flex items-center justify-center rounded-[22.37%] bg-[#121314] transition-all duration-300 ease-out"
          /* Professional multiple realistic shadows simulating true physical floating elevation depth */
          style={{
            width: size,
            height: size,
            rotateX: rotateX,
            rotateY: rotateY,
            transformStyle: "preserve-3d",
            boxShadow: `
              0 4px 6px -1px rgba(0, 0, 0, 0.5),
              0 10px 20px -2px rgba(0, 0, 0, 0.75), 
              0 20px 40px -5px rgba(0, 0, 0, 0.9),
              inset 0 1px 2px rgba(255, 255, 255, 0.15)
            `,
            border: '1.5px solid rgba(255, 215, 64, 0.15)'
          }}
          animate={{
            y: [-2, 2, -2],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Pristine high-resolution device-compatible PNG render with enhanced rendering contrast properties */}
          <img 
            src="/icon.png" 
            alt="Nakamal" 
            className="w-full h-full object-cover select-none pointer-events-none rounded-[22.37%]"
            style={{ 
              imageRendering: 'high-quality',
              backfaceVisibility: 'hidden',
              filter: 'brightness(1.03) contrast(1.05)'
            }}
            referrerPolicy="no-referrer"
          />

          {/* Premium physiological lighting layer for realistic 3D glass sheen and curved screen depth */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none rounded-[22.37%] opacity-75 mix-blend-overlay" />
          
          {/* Precise thin gold bezel edge ring of high-fidelity smartphone launch screens */}
          <div className="absolute inset-0 rounded-[22.37%] border border-white/5 pointer-events-none" />
        </motion.div>
      </div>

      {showText && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col text-left font-sans"
        >
          <span className="font-bebas text-3xl md:text-4xl text-white tracking-widest leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] font-bold">
            NAKAMAL
          </span>
          <span className="text-[9px] font-sans font-bold text-[#ffd740] tracking-[0.3em] uppercase mt-0.5 opacity-90 leading-none">
            Pacific Ecosystem
          </span>
        </motion.div>
      )}
    </div>
  );
}
