import React, { useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';

interface NeonWaveStatusProps {
  status: 'open' | 'closed';
  label?: string;
  onClick?: () => void;
}

export default function NeonWaveStatus({ status, label, onClick }: NeonWaveStatusProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let offset = 0;

    // Pulse intensity for the neon effect
    let pulse = 0;
    let pulseDirection = 1;

    const color = status === 'open' ? '#10b981' : '#f43f5e'; // emerald-500 or rose-500

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update pulse
      pulse += 0.02 * pulseDirection;
      if (pulse > 1 || pulse < 0) pulseDirection *= -1;

      // Draw Wave
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = status === 'open' ? 4 : 2;
      ctx.shadowBlur = (status === 'open' ? 15 : 5) + (pulse * 20);
      ctx.shadowColor = color;
      
      const midY = canvas.height / 2;
      // Vibrant sound pattern when open, calm vignette when closed
      const amplitude = status === 'open' ? 30 : 8; 
      const frequency = status === 'open' ? 0.08 : 0.03;

      ctx.moveTo(0, midY);

      for (let x = 0; x <= canvas.width; x++) {
        // Combinatory waves for organic movement - "sound pattern"
        const y = midY + 
          Math.sin(x * frequency + offset) * amplitude + 
          Math.sin(x * 0.03 + offset * 0.7) * (amplitude / 1.5) +
          Math.sin(x * 0.01 - offset * 0.3) * (amplitude / 3);
        ctx.lineTo(x, y);
      }
      
      ctx.stroke();
      
      // Draw secondary faint wave for depth
      ctx.beginPath();
      ctx.strokeStyle = `${color}33`; 
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.moveTo(0, midY);
      for (let x = 0; x <= canvas.width; x++) {
        const y = midY + Math.cos(x * frequency * 0.6 - offset * 1.2) * (amplitude * 1.2);
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += status === 'open' ? 0.15 : 0.04;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [status]);

  return (
    <div 
      onClick={onClick}
      className={`neon-status group cursor-pointer relative overflow-hidden p-8 rounded-[40px] border-[3px] border-white transition-all duration-700 hover:-translate-y-2 ${
        status === 'open' 
          ? 'bg-emerald-500/10 shadow-[0_20px_50px_rgba(16,185,129,0.2),inset_0_1px_2px_rgba(255,255,255,0.5)]' 
          : 'bg-rose-500/5 shadow-[0_20px_40px_rgba(244,63,94,0.1),inset_0_1px_2px_rgba(255,255,255,0.5)] grayscale-[0.5]'
      }`}
    >
      {/* Background Glow Overlay */}
      <div className={`absolute inset-0 opacity-20 transition-opacity duration-700 ${
        status === 'open' ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-emerald-500' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-rose-500'
      }`} />

      <div id="neon-status" className="flex flex-col items-center relative z-10">
        <div className="status-header mb-4 flex items-center gap-4">
          <div className={`transition-all duration-500 ${
            status === 'open' ? 'text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
          }`}>
            <Heart 
              size={32} 
              className={status === 'open' ? 'animate-heart-pulse-fast' : 'animate-heart-pulse-slow'} 
              fill="currentColor"
            />
          </div>
          
          <div className="relative">
            <span className={`status-text font-bebas text-6xl tracking-[0.25em] transition-all duration-700 ${
              status === 'open' ? 'text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]' : 'text-rose-400 opacity-60'
            }`}>
              {label || status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className={`wave-container w-full h-24 relative overflow-hidden rounded-2xl transition-all duration-700 ${
          status === 'open' ? 'bg-black/20 scale-105' : 'bg-black/10'
        }`}>
          <canvas 
            id="wave-canvas" 
            ref={canvasRef} 
            width={400} 
            height={150} 
            className="w-full h-full" 
          />
        </div>

        <div id="bars" className="bars-container flex gap-2 h-10 items-end mt-6">
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1.5 rounded-t-full transition-all duration-500 ${
                status === 'open' 
                  ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' 
                  : 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.4)] opacity-30'
              }`} 
              style={{ 
                height: `${20 + Math.random() * 80}%`, 
                transitionDelay: `${i * 30}ms`,
                animation: status === 'open' 
                  ? `neon-bar-pulse ${0.5 + Math.random()}s ease-in-out infinite` 
                  : `neon-bar-pulse ${2 + Math.random()}s ease-in-out infinite`
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes neon-bar-pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.4; }
          50% { transform: scaleY(1.8); opacity: 1; }
        }
        @keyframes heart-pulse-fast {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.3); filter: brightness(1.5); }
        }
        @keyframes heart-pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-heart-pulse-fast {
          animation: heart-pulse-fast 0.6s ease-in-out infinite;
        }
        .animate-heart-pulse-slow {
          animation: heart-pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
