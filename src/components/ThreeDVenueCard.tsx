import React from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Lightbulb, CheckCircle2, MapPin, Tag, Sparkles, ArrowUpRight } from 'lucide-react';
import { Bar, MenuItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface ThreeDVenueCardProps {
  key?: any;
  bar: Bar;
  latestUpdate: any;
  users: any[];
  onClick: () => void;
}

export default function ThreeDVenueCard({ bar, latestUpdate, users, onClick }: ThreeDVenueCardProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  // Mouse tilt tracking values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Transform mouse values into 3D rotations (gentle, eye-safe, and professional)
  const rotateX = useTransform(mouseY, [-180, 180], [10, -10]);
  const rotateY = useTransform(mouseX, [-180, 180], [-10, 10]);

  // Transform mouse values to simulate ambient light reflection position
  const reflexTranslateX = useTransform(mouseX, [-180, 180], [-25, 25]);
  const reflexTranslateY = useTransform(mouseY, [-180, 180], [-25, 25]);
  const reflexOpacity = useTransform(mouseX, [-180, 0, 180], [0.3, 0.1, 0.3]);

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

  const isVerified = users.find(u => u.id === bar.managerId)?.subscription?.status === 'active';
  const isOpen = bar.status === 'open';

  return (
    <div 
      className="relative select-none"
      style={{ perspective: 1200 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Fluid Ambient Backlighting Glow */}
      <motion.div 
        className={`absolute -inset-1 rounded-[36.5px] blur-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0 ${
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
        layoutId={`bar-${bar.id}`}
        onClick={onClick}
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
        className="kava-card cursor-pointer group flex flex-col justify-between overflow-hidden !p-0 border-2 border-transparent hover:border-kava-gold/30 transition-shadow duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.5)] bg-neutral-950 rounded-3xl"
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

        {/* 3. Pre-shining diagonal glass ray */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none z-30" />

        {/* 4. Top Cover Photo Section */}
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

        {/* 5. Main Card Body with Interactive Content */}
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
              <span className="leading-snug text-left">{t(bar.address)}</span>
            </div>

            {/* Micro Tags mapping */}
            <div 
              className="flex flex-wrap gap-2"
              style={{ transform: "translateZ(8px)" }}
            >
              {bar.tags.map(tag => (
                <span key={tag} className="bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all">
                  <Tag size={10} className="text-kava-gold" />
                  {t(tag)}
                </span>
              ))}
            </div>

            {/* 6. High-Perspective Float Layer for Manager Announcement update if present */}
            {latestUpdate && (
              <motion.div 
                className="mt-3 p-4 bg-gradient-to-r from-white/[0.04] to-white/[0.01] rounded-2xl border border-white/5 space-y-2 relative"
                style={{ 
                  transform: "translateZ(20px)",
                  boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-kava-gold bg-kava-gold/10 px-2 py-0.5 rounded-full border border-kava-gold/20 flex items-center gap-1">
                    <Sparkles size={8} className="animate-spin duration-1000" />
                    {latestUpdate.type === 'event' ? t('LATEST EVENT') : t('MANAGER PULSE')}
                  </span>
                  <span className="text-[8px] text-neutral-500 font-bold">
                    {new Date(latestUpdate.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex gap-3 text-left">
                  {(latestUpdate.adImageUrl || latestUpdate.imageUrl) && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm relative">
                      <img 
                        src={latestUpdate.adImageUrl || latestUpdate.imageUrl} 
                        alt={t(latestUpdate.title)} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bebas text-lg text-white truncate leading-snug">{t(latestUpdate.title)}</h5>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed opacity-80">
                      {t(latestUpdate.description)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 7. Bottom Action line containing Lowest Price estimate and Expand trigger pointer */}
          <div 
            className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-left"
            style={{ transform: "translateZ(15px)" }}
          >
            <div>
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest leading-none">{t('Entry / Menu starting from')}</div>
              <div className="font-bebas text-2xl text-kava-gold tracking-widest mt-1">{formatPrice(bar.pricePreview)}</div>
            </div>
            <div className="bg-kava-gold/10 p-2.5 rounded-full text-kava-gold group-hover:bg-kava-gold group-hover:text-black transition-all flex items-center justify-center shadow-inner">
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
