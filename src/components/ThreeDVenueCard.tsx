import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { Lightbulb, CheckCircle2, MapPin, Tag, Sparkles, ArrowUpRight, Clock, HelpCircle, Undo2, Compass } from 'lucide-react';
import { Bar } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface ThreeDVenueCardProps {
  key?: any;
  bar: Bar;
  latestUpdate: any;
  users: any[];
  onClick: () => void;
}

// Client-side pure Web Audio API synthesis for clean, latency-free water droplet "plop/bloop" sounds
function playWaterDropletSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Primary bubble sound oscillator
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    // Frequency sweeps up rapidly, creating the characteristic "plop" water drop sound
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(1150, now + 0.11);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.45, now + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Micro secondary reflection splash (delayed by 40ms) for an ultra-realistic acoustic bubble profile
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1350, ctx.currentTime + 0.07);

        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.004);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.09);
      } catch (e) {}
    }, 38);

  } catch (err) {
    console.warn("Web Audio API blocked or not supported on client:", err);
  }
}

export default function ThreeDVenueCard({ bar, latestUpdate, users, onClick }: ThreeDVenueCardProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  // Flip State for front-vs-back transition
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Interactive ripples array
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Mouse tilt tracking values (applied to the outer container for perfect independent animations)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Transform mouse values into 3D rotations (gentle, eye-safe, and professional)
  const rotateX = useTransform(mouseY, [-180, 180], [8, -8]);
  const rotateY = useTransform(mouseX, [-180, 180], [-8, 8]);

  // Transform mouse values to simulate ambient light reflection position
  const reflexTranslateX = useTransform(mouseX, [-180, 180], [-20, 20]);
  const reflexTranslateY = useTransform(mouseY, [-180, 180], [-20, 20]);
  const reflexOpacity = useTransform(mouseX, [-180, 0, 180], [0.25, 0.05, 0.25]);

  // Handle tracking within the card boundaries
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Relative coordinates from core center of card (-width/2 to +width/2)
    const x = event.clientX - rect.left - width / 2;
    const y = event.clientY - rect.top - height / 2;
    
    mouseX.set(x);
    mouseY.set(y);
  };

  // Gracefully return to balance when pointer exits
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Handle touch/click trigger with synthesized water splash sound and visual ripple propagation
  const handleCardInteract = (event: React.MouseEvent<HTMLDivElement>) => {
    // 1. Synthesize droplet acoustics
    playWaterDropletSound();

    // 2. Spawn concentric droplet ripples at local coordinate
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = {
      id: Date.now() + Math.random(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Cleanup ripple after animation concludes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);

    // 3. Flip the card face state
    setIsFlipped(prev => !prev);
  };

  // Safe wrapper for details-side action triggers to prevent double-flipping the card
  const handleActionClick = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation(); // Prevent card from flipping back
    playWaterDropletSound();
    action();
  };

  const isVerified = users.find(u => u.id === bar.managerId)?.subscription?.status === 'active';
  const isOpen = bar.status === 'open';

  return (
    <div 
      className="relative select-none w-full h-[530px] cursor-pointer"
      style={{ perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardInteract}
    >
      {/* 1. Fluid Ambient Backlighting Glow */}
      <motion.div 
        className={`absolute -inset-1.5 rounded-[38px] blur-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0 ${
          isOpen 
            ? 'bg-gradient-to-r from-emerald-500/10 via-kava-gold/5 to-emerald-500/10' 
            : 'bg-gradient-to-r from-amber-500/10 via-neutral-900/40 to-amber-500/10'
        }`}
        style={{
          transformStyle: "preserve-3d",
          translateZ: "-10px"
        }}
      />

      {/* 2. Main Floating & Rotating Container Card */}
      <motion.div
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: [-2.5, 2.5, -2.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-full h-full relative"
      >
        {/* Flippable 3D Core Layer */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-full h-full relative"
        >
          {/* Active Water Droplet Ripple Animation Render Node */}
          <div className="droplet-ripple-outer">
            {ripples.map((ripple) => (
              <React.Fragment key={ripple.id}>
                <div 
                  className="droplet-ripple droplet-ripple-1" 
                  style={{ left: ripple.x, top: ripple.y }} 
                />
                <div 
                  className="droplet-ripple droplet-ripple-2" 
                  style={{ left: ripple.x, top: ripple.y }} 
                />
              </React.Fragment>
            ))}
          </div>

          {/* =======================================================
              A: FRONT CARD FACE (Title, image, minimal stats)
              ======================================================= */}
          <div 
            className="kava-card absolute inset-0 group flex flex-col justify-between overflow-hidden !p-0 border-2 border-transparent hover:border-kava-gold/30 transition-shadow duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.5)] bg-neutral-950 rounded-3xl"
            style={{ 
              backfaceVisibility: "hidden", 
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0px)" 
            }}
          >
            {/* Gloss Refraction overlay reflecting mouse movement */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay"
              style={{
                transform: "translateZ(25px)",
                translateX: reflexTranslateX,
                translateY: reflexTranslateY,
                opacity: reflexOpacity
              }}
            />

            {/* Pre-shining diagonal glass ray */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none z-30" />

            {/* Top Cover Photo Section */}
            <div 
              className="relative h-44 bg-neutral-900 overflow-hidden flex-shrink-0"
              style={{ transform: "translateZ(8px)" }}
            >
              {bar.photos && bar.photos.length > 0 ? (
                <img 
                  src={bar.photos[0]} 
                  alt={`${bar.name} cover`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none" 
                  referrerPolicy="no-referrer"
                />
              ) : bar.logoUrl ? (
                <img 
                  src={bar.logoUrl} 
                  alt={`${bar.name} cover`} 
                  className="w-full h-full object-cover opacity-20 blur-sm scale-110 select-none" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-kava-gold/10 to-neutral-950 flex items-center justify-center">
                  <span className="font-bebas text-6xl tracking-[0.2em] text-white/5">{bar.name.charAt(0)}</span>
                </div>
              )}
              
              {/* Subtle overlay gradient & status categorization flag */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              <div 
                className="absolute bottom-4 left-6 flex items-center gap-1"
                style={{ transform: "translateZ(15px)" }}
              >
                <span className="bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest text-kava-gold uppercase border border-white/5">
                  {t(bar.category)}
                </span>
              </div>
            </div>

            {/* Main Card Body with Interactive Content */}
            <div 
              className="p-6 flex flex-col justify-between flex-1 relative z-25 bg-neutral-950/40 backdrop-blur-sm"
              style={{ transform: "translateZ(12px)" }}
            >
              <div className="space-y-4">
                
                {/* Title line with Live Glow lightbulb and Verified Checkmark */}
                <div className="flex justify-between items-start">
                  <div 
                    className="flex flex-col gap-1"
                    style={{ transform: "translateZ(14px)" }}
                  >
                    <h3 className="font-bebas text-3xl text-white leading-none pr-4 flex items-center gap-2">
                      <Lightbulb className={`w-5 h-5 shrink-0 ${
                        isOpen 
                          ? 'text-emerald-500 fill-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse' 
                          : 'text-rose-500 fill-rose-950/40 opacity-70'
                      }`} strokeWidth={2.5} />
                      {t(bar.name)}
                      {isVerified && (
                        <span className="inline-flex items-center justify-center bg-blue-500 text-white p-0.5 rounded-full shadow-sm" title="Verified Pro Venue">
                          <CheckCircle2 size={11} strokeWidth={3} />
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  {/* Distinct Badge for Open vs Closed details */}
                  <div 
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                      isOpen 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                    style={{ transform: "translateZ(15px)" }}
                  >
                    {t(bar.status)}
                  </div>
                </div>
                
                {/* Real Address Localization label */}
                <div 
                  className="flex items-start gap-2 text-sm text-neutral-400"
                  style={{ transform: "translateZ(10px)" }}
                >
                  <MapPin size={16} className="mt-0.5 shrink-0 text-kava-gold" />
                  <span className="leading-snug text-left truncate-2-lines">{t(bar.address)}</span>
                </div>

                {/* Invite to interact prompt */}
                <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 rounded-2xl text-[9px] text-blue-400 font-bold uppercase tracking-widest border border-blue-500/20 animate-pulse">
                  <span>💧 Tap card for detailed info & hours</span>
                </div>

                {/* Micro Tags mapping */}
                <div 
                  className="flex flex-wrap gap-2"
                  style={{ transform: "translateZ(8px)" }}
                >
                  {bar.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="bg-white/5 text-neutral-300 border border-white/5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Tag size={9} className="text-kava-gold" />
                      {t(tag)}
                    </span>
                  ))}
                  {bar.tags.length > 2 && (
                    <span className="bg-white/5 text-neutral-400 border border-white/5 px-2.5 py-1 rounded-full text-[9px] font-bold">
                      +{bar.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Action line containing Lowest Price estimate and Expand trigger pointer */}
              <div 
                className="mt-4 flex items-center justify-between border-t border-white/5 pt-3.5 text-left"
                style={{ transform: "translateZ(15px)" }}
              >
                <div>
                  <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none">{t('Entry starting from')}</div>
                  <div className="font-bebas text-2xl text-kava-gold tracking-widest mt-0.5">{formatPrice(bar.pricePreview)}</div>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all flex items-center justify-center shadow-inner">
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </div>
          </div>


          {/* =======================================================
              B: BACK CARD FACE (Details, Operational schedule, updates)
              ======================================================= */}
          <div 
            className="kava-card absolute inset-0 flex flex-col justify-between overflow-hidden !p-0 border-2 border-kava-gold/40 shadow-[0_15px_35px_rgba(0,0,0,0.35)] bg-neutral-950 rounded-3xl"
            style={{ 
              backfaceVisibility: "hidden", 
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg) translateZ(1px)"
            }}
          >
            {/* Gloss reflection for flipped state */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent pointer-events-none z-10" />

            {/* Back face card header */}
            <div className="p-6 pb-2 border-b border-white/5 bg-neutral-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Compass size={16} className="animate-spin duration-3000" />
                </div>
                <div>
                  <h4 className="font-bebas text-xl text-white tracking-wider leading-none">{t(bar.name)}</h4>
                  <p className="text-[8px] font-black uppercase tracking-widest text-kava-gold mt-0.5">{t('Node Details')}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                isOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {t(bar.status)}
              </span>
            </div>

            {/* Scrollable details container */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4 text-left">
              
              {/* Detailed Operational schedule */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  <Clock size={11} className="text-kava-gold" />
                  <span>{t('Operational Availability')}</span>
                </div>
                {bar.businessHours ? (
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-1 text-[10px]">
                    {Object.entries(bar.businessHours).slice(0, 3).map(([day, val]: [string, any]) => (
                      <div key={day} className="flex justify-between text-neutral-300">
                        <span className="font-semibold">{t(day)}</span>
                        <span>{val?.closed ? t('Closed') : `${val?.open} - ${val?.close}`}</span>
                      </div>
                    ))}
                    {Object.keys(bar.businessHours).length > 3 && (
                      <div className="text-[9px] text-neutral-500 text-center pt-1 italic">
                        + {Object.keys(bar.businessHours).length - 3} more days set in system
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-[10px] text-neutral-400 text-center">
                    🕒 {t('Default sunset hours apply')} (4:00 PM - 10:00 PM)
                  </div>
                )}
              </div>

              {/* Exact Address Localization */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  <MapPin size={11} className="text-kava-gold" />
                  <span>{t('Geographic Location')}</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-[10px] text-neutral-300 leading-relaxed">
                  {t(bar.address)}
                  <div className="text-[8px] text-neutral-500 font-mono mt-1">
                    GPS: {bar.lat?.toFixed(4)}, {bar.lng?.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  <Tag size={11} className="text-kava-gold" />
                  <span>{t('Atmospheric Vibe')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bar.tags.map(tag => (
                    <span key={tag} className="bg-white/5 text-neutral-300 px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase border border-white/5">
                      {t(tag)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Announcement check if present */}
              {latestUpdate && (
                <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-2.5 rounded-xl border border-blue-500/15 space-y-1 text-left">
                  <div className="flex items-center gap-1 text-[8px] text-blue-400 font-black uppercase tracking-widest">
                    <Sparkles size={8} />
                    <span>{latestUpdate.type === 'event' ? t('EVENT') : t('UPDATE')}</span>
                  </div>
                  <h5 className="font-bebas text-sm text-white truncate leading-none">{t(latestUpdate.title)}</h5>
                </div>
              )}
            </div>

            {/* Interactive Action triggers */}
            <div className="p-6 pt-3 bg-neutral-900/40 border-t border-white/5 flex gap-3">
              <button 
                onClick={(e) => handleActionClick(e, () => setIsFlipped(false))}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white/5 hover:bg-white/10 active:scale-95 text-[10px] text-neutral-300 font-black uppercase tracking-widest rounded-2xl transition-all border border-white/10 flex-1"
              >
                <Undo2 size={12} />
                {t('Flip back')}
              </button>
              
              <button 
                onClick={(e) => handleActionClick(e, onClick)}
                className="flex items-center justify-center gap-1.5 px-5 py-3 bg-gradient-to-r from-kava-gold to-amber-500 hover:brightness-110 active:scale-95 text-[10px] text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg flex-1"
              >
                <span>{t('Open Menu')}</span>
                <ArrowUpRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
