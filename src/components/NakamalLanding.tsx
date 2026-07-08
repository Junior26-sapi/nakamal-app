import React, { useState, useEffect } from 'react';
import { Sparkles, Map as MapIcon, Search, QrCode, Smartphone, Download, Server, Activity, Cpu, Globe, RefreshCw, CheckCircle2, Terminal, Share2, Award, BookOpen, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { feedbackService } from '../services/feedbackService';

export default function NakamalLanding({ 
  onLaunchMap, 
  onOpenLogin 
}: { 
  onLaunchMap: () => void; 
  onOpenLogin: () => void;
}) {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [downloadedFormat, setDownloadedFormat] = useState<'ios' | 'android' | 'direct' | null>(null);
  const [showEdgeRouterLogs, setShowEdgeRouterLogs] = useState(false);
  
  // Vercel Live Deployment Simulation State Engine
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0);
  const [activeLogs, setActiveLogs] = useState<string[]>([]);
  const [lastBuildTime, setLastBuildTime] = useState<string>("Just now");

  // Educational Slogan & Marketing Selector Engine
  const [activeSloganIndex, setActiveSloganIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [adViews, setAdViews] = useState(1420);
  const [adLikes, setAdLikes] = useState(285);

  const adSlogans = [
    {
      title: "Rooted in Tradition, Connected by Gold",
      description: "Nakamal connects local Vanuatu kava farmers directly with retail consumers. No middlemen, full authenticity, organic Pentecost roots delivered with sub-10ms geographical accuracy.",
      badge: "Traditional Community Heritage",
      accent: "text-kava-gold border-kava-gold/30 bg-kava-gold/10"
    },
    {
      title: "Real-Time Fresh Shell Geolocation Tracker",
      description: "Ever wonder if the kava is ready? Our active digital network keeps you posted with real-time shell presence indicators, menu prices, and operating hours across Vanuatu's top nakamals.",
      badge: "Realtime Geolocation Map",
      accent: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
    },
    {
      title: "Real Financial Business Management",
      description: "Upgrade your kava business with real financial business management tools built for each kava bar business. Track daily shell sales, grind yields, active overhead, and profit analytics with single-click operational exports.",
      badge: "Business Upgrade Suite",
      accent: "text-blue-400 border-blue-500/20 bg-blue-500/10"
    }
  ];

  const handleShareCampaign = () => {
    navigator.clipboard.writeText(`https://nakamal.vercel.app/education?topic=${activeSloganIndex}`);
    setCopiedLink(true);
    setAdViews(prev => prev + 1);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const buildLogs = [
    "▲ Vercel Edge Server: Detected production git repository push...",
    "⚡ Initializing secure virtual environment in AWS-Asia Region...",
    "✓ Verifying dependencies in project manifest configuration...",
    "📦 Compiling full-stack assets for Nakamal.Vercel.app using esbuild...",
    "✓ Hardware satellite GPS integration: Leveraged real-time geolocation hardware tracking & Telemetry HUD overlay on maps...",
    "✓ Clean Dashboards: Dismantled Secure Identity Vault and Browser Persistence Engine block components for premium minimalism...",
    "📢 Ecosystem Social Integration: Deployed triple import-export hooks for Facebook page, Instagram feed, and WhatsApp chats...",
    "✓ Custom Poster Banners: Embedded automatic social graphic builder with bespoke broadcast headlines on supplier/manager announcements...",
    "📡 Synchronizing live Edge router lines across SYD1 (Sydney) and SIN1 (Singapore)...",
    "🎉 Redeployment complete: Nakamal.Vercel.app is now 100% updated and online!"
  ];

  useEffect(() => {
    let interval: any;
    if (isDeploying) {
      setDeployStep(0);
      setActiveLogs([buildLogs[0]]);
      
      interval = setInterval(() => {
        setDeployStep((prev) => {
          const nextStep = prev + 1;
          if (nextStep < buildLogs.length) {
            setActiveLogs((logs) => [...logs, buildLogs[nextStep]]);
            return nextStep;
          } else {
            clearInterval(interval);
            setIsDeploying(false);
            setLastBuildTime(new Date().toLocaleTimeString());
            return prev;
          }
        });
      }, 900); // Realistic pacing for production serverlogs
    }
    return () => clearInterval(interval);
  }, [isDeploying]);

  const triggerVercelRedeploy = () => {
    if (isDeploying) return;
    setIsDeploying(true);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert("This modern Nakamal Web Node functions as a native Progressive Web App (PWA). To download and install on iOS Safari, tap 'Share' then select 'Add to Home Screen'. On Android Chrome, tap the menu and select 'Install app'.");
    }
  };

  return (
    <div className="space-y-16 py-6 pb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Dynamic Hero Section */}
      <div className="relative rounded-[48px] overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-white/10 p-8 md:p-16 text-center space-y-8 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,163,89,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,0,0,0.85))]" />
        
        {/* Ambient Animated Badge */}
        <div className="relative inline-flex items-center gap-2 bg-kava-gold/15 border border-kava-gold/30 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] text-kava-gold animate-bounce">
          <Sparkles size={12} className="stroke-[3]" />
          Sovereign Vanuatu Kava Network
        </div>

        <div className="relative space-y-4 max-w-4xl mx-auto">
          <h1 className="font-bebas text-7xl md:text-9xl text-white tracking-wider uppercase leading-none filter drop-shadow-md">
            NAKAMAL <span className="text-kava-gold">ECOSYSTEM</span>
          </h1>
          <p className="text-sm md:text-lg text-neutral-300 font-medium max-w-2xl mx-auto leading-relaxed">
            The decentralized real-time digital infrastructure coordinating sovereign Vanuatu kava bar discovery, supplier logistics, and audited federal exporting records.
          </p>
        </div>

        {/* Call to Actions */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4">
          <button
            onClick={onLaunchMap}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-5 bg-kava-gold hover:bg-kava-gold/90 text-white rounded-[24px] font-bebas text-2xl tracking-[0.1em] shadow-xl shadow-kava-gold/20 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
          >
            <MapIcon size={20} />
            Explore Live Map
          </button>
          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[24px] border border-white/10 hover:border-white/20 font-bebas text-2xl tracking-[0.1em] hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
          >
            <Search size={20} />
            Launch Portal Sign In
          </button>
        </div>

        {/* Live Network Indicators */}
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-10 border-t border-white/5 font-sans">
          <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5">
            <span className="block text-3xl font-bebas text-[24px] text-kava-gold tracking-wide leading-none">42+ Nodes</span>
            <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">Active Nakamals</span>
          </div>
          <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5">
            <span className="block text-3xl font-bebas text-[24px] text-emerald-500 tracking-wide leading-none">100% Live</span>
            <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">Shell Presence Status</span>
          </div>
          <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5">
            <span className="block text-3xl font-bebas text-[24px] text-white tracking-wide leading-none">Suppliers Sync</span>
            <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">Farmer Logistics</span>
          </div>
          <div className="p-4 bg-white/[0.02] rounded-3xl border border-white/5">
            <span className="block text-3xl font-bebas text-[24px] text-blue-400 tracking-wide leading-none">PWA Enabled</span>
            <span className="block text-[8px] font-black text-neutral-400 uppercase tracking-widest mt-1">Cross-platform Web Mobile</span>
          </div>
        </div>
      </div>

      {/* Collapsible Vercel Edge Deployment Node Integration Console - Runs in the background by default for a clean advertisement layout */}
      <AnimatePresence>
        {showEdgeRouterLogs && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="mx-4 md:mx-0 p-6 md:p-8 rounded-[40px] border border-white/10 bg-neutral-900/45 dark:bg-neutral-950/80 backdrop-blur-2xl shadow-xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/20 via-kava-gold/5 target-to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5">
              <div className="space-y-1.5 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-neutral-950 text-white border border-white/10 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    ▲ Vercel Edge Node
                  </span>
                  <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active production
                  </span>
                  <span className="text-neutral-500 text-[9px] font-bold uppercase tracking-wider">
                    Ref: V0-DEPL-YNT-2026
                  </span>
                </div>
                <h3 className="font-bebas text-3xl md:text-4xl text-white tracking-widest uppercase leading-none">
                  Nakamal.Vercel.app Production Router (Background)
                </h3>
                <p className="text-xs text-neutral-400 leading-snug">
                  Primary Pacific deployment node delivering sub-10ms response times for Vanuatu logistics, crop registration records, and active venue status alerts.
                </p>
              </div>

              <button 
                onClick={triggerVercelRedeploy}
                disabled={isDeploying}
                className={`w-full md:w-auto px-6 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  isDeploying 
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                    : 'bg-white hover:bg-white/90 text-black active:scale-[0.98]'
                }`}
              >
                <RefreshCw size={13} className={`stroke-[3.5] ${isDeploying ? 'animate-spin' : ''}`} />
                {isDeploying ? 'Compiling Live Assets...' : 'Force Vercel Redeploy'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Active stats panel */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-neutral-950/55 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block">Main URL Node</span>
                    <a 
                      href="https://nakamal.vercel.app" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-kava-gold hover:underline flex items-center gap-1"
                    >
                      <Globe size={11} />
                      nakamal.vercel.app
                    </a>
                  </div>
                  
                  <div className="p-4 bg-neutral-950/55 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block">SSL Integrity</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      ✓ Let's Encrypt TLS
                    </span>
                  </div>

                  <div className="p-4 bg-neutral-950/55 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block">Asset Package</span>
                    <span className="text-xs font-bold text-neutral-300">
                      3D Canvas Floating Box
                    </span>
                  </div>

                  <div className="p-4 bg-neutral-950/55 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[9px] text-neutral-500 uppercase font-black tracking-widest block">Last Deployment</span>
                    <span className="text-xs font-bold text-neutral-400">
                      {lastBuildTime}
                    </span>
                  </div>
                </div>

                <div className="p-4.5 bg-neutral-950/30 rounded-3xl border border-white/5 flex gap-4 items-center">
                  <div className="p-3 bg-kava-gold/15 rounded-2xl text-kava-gold">
                    <Cpu size={20} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bebas text-lg text-white tracking-wider uppercase leading-none">v0.app Edge Compiler</h4>
                    <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                      Automatically minifies assets, updates index.html metadata routing configurations, and deploys cache-purged Progressive Web App nodes instantly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Virtual Terminal Log Stream */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-t border-x border-white/10 rounded-t-2xl font-mono text-[9px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={10} className="text-neutral-500" />
                    <span>production-build-terminal.sh</span>
                  </div>
                  <span className="text-[8px] bg-neutral-900 border border-white/10 text-kava-gold px-1.5 py-0.5 rounded tracking-widest">
                    LIVE TERMINAL
                  </span>
                </div>

                <div className="flex-1 min-h-[175px] max-h-[175px] bg-neutral-950 border border-white/10 rounded-b-2xl p-4.5 font-mono text-[10.5px] text-left overflow-y-auto space-y-1.5 text-neutral-300 shadow-inner scrollbar-thin select-all">
                  {activeLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`flex items-start gap-1.5 leading-normal ${
                        log.includes('🎉') || log.includes('✓') 
                          ? 'text-emerald-400 font-bold' 
                          : log.startsWith('▲') 
                            ? 'text-white' 
                            : 'text-neutral-400'
                      }`}
                    >
                      <span className="text-[9px] text-neutral-600 select-none">[{index + 1}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  
                  {!isDeploying && activeLogs.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 py-6 space-y-2">
                      <Terminal size={24} className="opacity-20 animate-pulse text-kava-gold" />
                      <p className="text-[10px] uppercase font-black tracking-widest">Vercel Terminal Standby Mode</p>
                      <p className="text-[9px] max-w-xs leading-normal">Click the "Force Vercel Redeplay" button above to witness the direct build asset sequence compilation live in real-time.</p>
                    </div>
                  )}

                  {isDeploying && (
                    <div className="flex items-center gap-2 pt-2 text-kava-gold/80 text-[10px] font-bold animate-pulse select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-kava-gold animate-ping" />
                      <span>Streaming Node Logs...</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The 4 Pillars of Nakamal Services */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-bebas text-5xl text-kava-text tracking-wide uppercase">Core Network Operations</h2>
          <p className="text-kava-muted/60 text-sm max-w-xl mx-auto font-medium">Authentic, decentralized tools coordinating traditional kava cultivation with modern commercial software tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {/* Pillar 1: Live Space Explorer */}
          <div className="relative group p-6 bg-white/55 dark:bg-neutral-900/40 backdrop-blur-md rounded-[32px] border border-white dark:border-white/5 shadow-layered space-y-4 hover:-translate-y-1 transition-all overflow-hidden select-none">
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.12] dark:opacity-[0.22] transition-transform duration-700 group-hover:scale-110" 
              style={{ backgroundImage: "url('/bg_space_explorer.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 dark:from-neutral-950/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="p-4 bg-kava-gold/10 text-kava-gold rounded-2xl w-fit">
                <MapIcon size={24} />
              </div>
              <h3 className="font-bold text-lg text-kava-text uppercase tracking-tight leading-tight">Live Space Explorer</h3>
              <p className="text-xs text-kava-muted leading-relaxed font-sans">
                Find local kava lounges, verify shell presence, active operating hours, menu selections, prices, and user feedback in Port Vila bounds.
              </p>
            </div>
          </div>

          {/* Pillar 2: Supply Chain Ledger */}
          <div className="relative group p-6 bg-white/55 dark:bg-neutral-900/40 backdrop-blur-md rounded-[32px] border border-white dark:border-white/5 shadow-layered space-y-4 hover:-translate-y-1 transition-all overflow-hidden select-none">
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.12] dark:opacity-[0.22] transition-transform duration-700 group-hover:scale-110" 
              style={{ backgroundImage: "url('/bg_supply_ledger.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 dark:from-neutral-950/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl w-fit">
                <Server size={24} />
              </div>
              <h3 className="font-bold text-lg text-kava-text uppercase tracking-tight leading-tight">Supply Chain Ledger</h3>
              <p className="text-xs text-kava-muted leading-relaxed font-sans">
                Enables local growers & suppliers to list bulk kava lots, execute micro-ledger updates, and synchronize contracts directly with bar owners.
              </p>
            </div>
          </div>

          {/* Pillar 3: Secure Trade Desk */}
          <div className="relative group p-6 bg-white/55 dark:bg-neutral-900/40 backdrop-blur-md rounded-[32px] border border-white dark:border-white/5 shadow-layered space-y-4 hover:-translate-y-1 transition-all overflow-hidden select-none">
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.12] dark:opacity-[0.22] transition-transform duration-700 group-hover:scale-110" 
              style={{ backgroundImage: "url('/bg_secure_desk.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 dark:from-neutral-950/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl w-fit">
                <QrCode size={24} />
              </div>
              <h3 className="font-bold text-lg text-kava-text uppercase tracking-tight leading-tight">Secure Trade Desk</h3>
              <p className="text-xs text-kava-muted leading-relaxed font-sans">
                Maintains federal exporter pricing sheets, customs clearance document tracking, and shipping log transparency across South Pacific lines.
              </p>
            </div>
          </div>

          {/* Pillar 4: Sovereign Web PWA */}
          <div className="relative group p-6 bg-white/55 dark:bg-neutral-900/40 backdrop-blur-md rounded-[32px] border border-white dark:border-white/5 shadow-layered space-y-4 hover:-translate-y-1 transition-all overflow-hidden select-none">
            <div 
              className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.12] dark:opacity-[0.22] transition-transform duration-700 group-hover:scale-110" 
              style={{ backgroundImage: "url('/bg_sovereign_pwa.png')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 dark:from-neutral-950/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl w-fit">
                <Smartphone size={24} />
              </div>
              <h3 className="font-bold text-lg text-kava-text uppercase tracking-tight leading-tight">Sovereign Web PWA</h3>
              <p className="text-xs text-kava-muted leading-relaxed font-sans">
                Zero App Store dependency. Nakamal acts as a fully compliant, self-updating sandboxed utility with offline-first local persistence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NAKAMAL EDUCATIONAL PUBLICITY & NETWORK CENTER */}
      <div className="rounded-[40px] overflow-hidden bg-neutral-900/95 dark:bg-neutral-950 border border-white/10 p-8 md:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.5)] text-left relative space-y-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,163,89,0.05),transparent_60%)] pointer-events-none" />
        
        <div className="space-y-3 max-w-4xl relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-kava-gold tracking-[0.25em] bg-kava-gold/10 px-4 py-1.5 rounded-full border border-kava-gold/30">
            <BookOpen size={11} className="text-kava-gold animate-pulse" />
            Vanuatu Kava Digital Literacy Campaign
          </span>
          <h2 className="font-bebas text-5xl md:text-6xl text-white tracking-wide uppercase leading-none">
            Ecosystem <span className="text-kava-gold">Education Banner</span>
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed font-sans max-w-2xl">
            Empowering local growers, bar master-hosts, and communities through technological inclusion. Discover how real-time logistics can protect agriculture and elevate native hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10 font-sans">
          {/* Left Column: Stunning Premium Graphic Space displaying "nakamal_ad_banner_1781062826939.png" */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 bg-neutral-950/60 rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-kava-gold/5 to-transparent pointer-events-none" />
            
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden aspect-[21/9] lg:aspect-[16/10] border border-white/10 shadow-lg bg-neutral-900">
                <img 
                  src="/nakamal_ad_banner_1781062826939.png" 
                  alt="Vanuatu Nakamal Educational Publicity Poster" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <span className="text-[10px] font-black text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/15 uppercase tracking-widest">
                    Educational Graphic Center
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400 bg-neutral-950/90 px-2 py-0.5 rounded uppercase tracking-wider">
                    Official Banner Asset
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bebas text-3xl text-white tracking-wider uppercase">Sovereign Cultivation Network</h4>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Interactive broadcast poster illustrating standard web integrations designed to secure local Vanuatu supply channels and improve general retail awareness.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-neutral-400 text-xs">
                <div>
                  <span className="block text-[9px] uppercase font-black text-neutral-500 tracking-wider">Active Reach</span>
                  <span className="font-mono text-white text-sm font-bold">{adViews.toLocaleString()} Verified Views</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase font-black text-neutral-500 tracking-wider">Community Likes</span>
                  <span className="font-mono text-kava-gold text-sm font-bold">{adLikes} Endorsements</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    feedbackService.trigger('tap');
                    handleShareCampaign();
                  }}
                  className="px-4 py-2.5 bg-neutral-905 hover:bg-neutral-800 active:scale-95 border border-white/10 rounded-xl text-[10px] font-black text-neutral-300 uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                >
                  <Share2 size={11} />
                  <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    feedbackService.trigger('tap');
                    setAdLikes(prev => prev + 1);
                  }}
                  className="px-5 py-2.5 bg-kava-gold hover:bg-kava-gold/90 active:scale-95 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  👍 Support Poster
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Interactive Slogan Cards with Realistic Navigation */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="space-y-4 flex-grow">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">
                Select Interactive Topic Guide
              </span>
              
              <div className="space-y-3">
                {adSlogans.map((slogan, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      feedbackService.trigger('tap');
                      setActiveSloganIndex(index);
                      setAdViews(v => v + 15);
                    }}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group select-none cursor-pointer ${
                      activeSloganIndex === index 
                        ? 'bg-neutral-900 border-kava-gold/40 shadow-lg' 
                        : 'bg-neutral-950/40 border-white/5 hover:border-white/10 hover:bg-neutral-950/60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <span className={`inline-block text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          activeSloganIndex === index 
                            ? slogan.accent 
                            : 'text-neutral-500 bg-neutral-900'
                        }`}>
                          {slogan.badge}
                        </span>
                        <h4 className="font-medium text-sm text-white group-hover:text-kava-gold transition-colors">
                          {slogan.title}
                        </h4>
                      </div>
                      <span className="text-xs text-neutral-600 font-mono">0{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Topic Full View Canvas with Realistic Button (No Promo Codes or Vouchers!) */}
            <div className="p-6 bg-neutral-950 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col justify-between space-y-4 min-h-[180px]">
              <div className="space-y-2">
                <span className="text-[9px] font-black tracking-widest uppercase text-kava-gold">
                  Topic Deep-Dive Canvas
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {adSlogans[activeSloganIndex].description}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLaunchMap}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[linear-gradient(180deg,#F5C57A_0%,#D4A359_100%)] hover:bg-[linear-gradient(180deg,#F7C986_0%,#E5B26A_100%)] text-neutral-900 font-bebas text-base uppercase tracking-[0.1em] rounded-xl transition-all shadow-[0_4px_12px_rgba(212,163,89,0.15)] active:scale-[0.98] select-none cursor-pointer"
                >
                  <span>Launch Network Map</span>
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NATIVE DESKTOP & MOBILE APPLICATION INSTALLATION CENTER */}
      <div id="pwa-launcher-guide" className="rounded-[40px] overflow-hidden bg-neutral-900/95 dark:bg-neutral-950 border-2 border-kava-gold p-8 md:p-12 shadow-[0_0_50px_rgba(212,163,89,0.12)] text-left relative">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-96 h-96 bg-kava-gold/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-10 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-kava-gold tracking-[0.25em] bg-kava-gold/10 px-4 py-1.5 rounded-full border border-kava-gold/30">
              <Sparkles size={11} className="animate-pulse text-kava-gold" />
              Sovereign Web PWA System • Zero App Store Friction
            </span>
            <h2 className="font-bebas text-5xl md:text-6xl text-white tracking-wide uppercase leading-none">
              Deploy <span className="text-kava-gold animate-pulse">Nakamal App</span>
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed font-sans">
              Add the Vanuatu Nakamal ecosystem direct to your phone's Home Screen for a premium, zero-latency local-first utility. Operates with independent offline persistence, local-to-cloud security syncs, and native-app fidelity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Stunning Premium Graphic Advertisement */}
            <div className="lg:col-span-5 flex flex-col justify-between p-6 bg-neutral-950/60 rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,163,89,0.08),transparent_60%)] pointer-events-none" />
              
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden aspect-video border border-white/10 shadow-lg bg-neutral-900">
                  <img 
                    src="/pwa_install_guide_banner.png" 
                    alt="Premium Nakamal Mobile App Install Poster" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bebas text-2xl text-white tracking-widest uppercase">Verified Mobile Client</h4>
                  <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                    A beautiful, unified digital environment loaded directly from the high-performance Vercel Edge. Highly optimized, sandbox secure, and lightweight on local device resources.
                  </p>
                </div>
              </div>

              {/* Launcher Metadata Indicator */}
              <div className="pt-6 border-t border-white/5 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-12 h-12 rounded-[22.37%] overflow-hidden bg-neutral-900 border border-white/10 shadow-md">
                    <img src="/icon.png" alt="Nakamal Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-white block uppercase tracking-wide">Nakamal PWA</span>
                    <span className="text-[8px] font-bold text-kava-gold uppercase tracking-wider">v2.6.0 Edge Engine</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black tracking-widest text-neutral-500 block uppercase">STATUS</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 capitalize bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse relative" />
                    Operational
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: iOS and Android Interactive Step Guide Cards */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                {/* iOS Apple Guide Card */}
                <div className="p-6 rounded-[28px] bg-neutral-950/70 border border-white/5 hover:border-kava-gold/30 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xl relative group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">
                          🍎
                        </div>
                        <div>
                          <h4 className="font-bebas text-lg text-white tracking-widest uppercase mb-0.5">Apple iOS Safari</h4>
                          <p className="text-[9px] font-black tracking-widest uppercase text-kava-gold">Standard PWA setup</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-[11px] text-neutral-300 font-sans border-t border-white/5 pt-3">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-kava-gold font-black bg-kava-gold/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                        <span className="leading-tight">Launch in standard <strong className="text-white font-semibold">Safari</strong> browser.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-kava-gold font-black bg-kava-gold/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                        <span className="leading-tight">Tap the <strong className="text-white font-semibold flex">Share icon</strong> (box with up arrow).</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-kava-gold font-black bg-kava-gold/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                        <span className="leading-tight">Select <strong className="text-white font-semibold">"Add to Home Screen"</strong> option.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      feedbackService.trigger('tap');
                      setDownloadedFormat('ios');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[linear-gradient(180deg,#F5C57A_0%,#D4A359_100%)] hover:bg-[linear-gradient(180deg,#F7C986_0%,#E5B26A_100%)] text-neutral-900 border border-kava-gold/50 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(212,163,89,0.2)] active:scale-[0.98] select-none cursor-pointer"
                  >
                    Show iOS Guide
                  </button>
                </div>

                {/* Android Chrome Guide Card */}
                <div className="p-6 rounded-[28px] bg-neutral-950/70 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xl relative group">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shadow-inner">
                          🤖
                        </div>
                        <div>
                          <h4 className="font-bebas text-lg text-white tracking-widest uppercase mb-0.5">Android Chrome</h4>
                          <p className="text-[9px] font-black tracking-widest uppercase text-emerald-400 font-sans">Direct engine loader</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-[11px] text-neutral-300 font-sans border-t border-white/5 pt-3">
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-emerald-400 font-black bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                        <span className="leading-tight">Open on official <strong className="text-white">Google Chrome</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-emerald-400 font-black bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                        <span className="leading-tight">Tap the <strong className="text-white font-semibold text-white">three dots menu</strong> at the top right.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="font-mono text-emerald-400 font-black bg-emerald-500/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                        <span className="leading-tight">Tap <strong className="text-white font-semibold text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      feedbackService.trigger('tap');
                      if (installPrompt) {
                        installPrompt.prompt();
                      } else {
                        setDownloadedFormat('android');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[linear-gradient(180deg,#10B981_0%,#059669_100%)] hover:bg-[linear-gradient(180deg,#34D399_0%,#10B981_100%)] text-white border border-emerald-500/50 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_12px_rgba(16,185,129,0.2)] active:scale-[0.98] select-none cursor-pointer"
                  >
                    <Smartphone size={12} strokeWidth={2.5} />
                    Install on Android
                  </button>
                </div>
              </div>

              {/* Direct PWA Installer Console Trigger */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    feedbackService.trigger('tap');
                    if (installPrompt) {
                      installPrompt.prompt();
                    } else {
                      setDownloadedFormat('direct');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[linear-gradient(180deg,#FFFFFF_0%,#E2E8F0_100%)] hover:bg-[linear-gradient(180deg,#FFFFFF_0%,#F1F5F9_100%)] text-zinc-950 font-bebas text-sm uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all border border-zinc-300 active:scale-[0.99] cursor-pointer"
                >
                  <Smartphone size={14} className="text-kava-gold" />
                  Trigger Auto Install Prompt
                </button>

                {/* Walkthrough Detail Interactive Console */}
                <AnimatePresence mode="wait">
                  {downloadedFormat && (
                    <motion.div 
                      key={downloadedFormat}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 bg-neutral-900 border border-white/10 rounded-2xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[9px] font-black text-kava-gold uppercase tracking-[0.15em]">WALKTHROUGH DETAIL MONITOR</span>
                        <button 
                          onClick={() => setDownloadedFormat(null)}
                          className="text-[9.5px] font-bold text-neutral-400 hover:text-white uppercase"
                        >
                          Dismiss
                        </button>
                      </div>

                      {downloadedFormat === 'ios' && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                          🍏 <strong className="text-white font-semibold">iOS Setup Assistant:</strong> Standard iOS disables offline service worker engines inside in-app web views (e.g., inside Instagram, Gmail, or Facebook). Ensure you are inside the native <strong className="text-white font-semibold">Safari Browser</strong>, tap the <span className="text-kava-gold font-bold">Share Icon</span> at the bottom interface, scroll, and choose <strong className="text-white">"Add to Home Screen"</strong>.
                        </p>
                      )}
                      {downloadedFormat === 'android' && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans mt-1">
                          🤖 <strong className="text-white font-semibold">Android Setup Assistant:</strong> Ensure you are using official <strong className="text-white font-semibold">Google Chrome</strong>. Tap the vertical 3-dots option overflow menu in the dynamic browser layout, scroll downwards, and tap <strong className="text-white">"Install app"</strong> to register the compiled worker on your device repository.
                        </p>
                      )}
                      {downloadedFormat === 'direct' && (
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans mt-1">
                          📲 <strong className="text-white font-semibold">Instant Manifest Handshake:</strong> If your runtime environment is compliant, the hardware standard service worker triggers on action. If inside a locked social iframe, copy the URL <code className="bg-neutral-900 border border-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">nakamal.vercel.app</code> and access through your device's native browser!
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div> {/* CLOSE lg:col-span-7 */}
          </div> {/* CLOSE grid grid-cols-1 lg:grid-cols-12 */}

          {/* Premium Mockup Dashboard Widget */}
          <div className="bg-neutral-950/80 border-2 border-white/5 rounded-[36px] p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/85" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/85" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/85" />
              </div>
              <span className="text-[9px] font-sans text-neutral-400 tracking-widest uppercase font-bold">NAKAMAL LIVE NODE</span>
            </div>

            {/* High-Fidelity Perfect-Size Launcher App Icon Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-white/[0.02] rounded-3xl border border-white/5 text-center space-y-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(212,163,89,0.1),transparent_70%)]" />
              
              {/* Perfect, pristine standard app-launcher size icon */}
              <div className="relative w-20 h-20 aspect-square rounded-[22.37%] overflow-hidden bg-neutral-950 shadow-[0_12px_28px_rgba(0,0,0,0.8),0_4px_10px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/10 select-none group-hover:scale-105 transition-all duration-300">
                <img 
                  src="/icon.png" 
                  alt="Nakamal App Icon" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  style={{ imageRendering: 'high-quality' }}
                />
                {/* Physical overlay gloss shine reflection */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] pointer-events-none rounded-[22.37%] opacity-80 mix-blend-overlay" />
                <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/15 to-transparent opacity-60 pointer-events-none" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bebas text-2xl text-white tracking-widest uppercase leading-none">Nakamal PWA</h4>
                <p className="text-[9px] text-kava-gold font-bold uppercase tracking-[0.2em] leading-none">Verified Sovereign Node</p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-xs flex gap-4 items-center">
              <div className="p-3 bg-kava-gold/15 text-kava-gold rounded-xl font-bold">🌿</div>
              <div className="space-y-1 flex-grow text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Sovereign Kava Shells</span>
                  <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
                <p className="text-[10.5px] text-neutral-400">Fresh Pentecost roots ready inside Port Vila channels • Realtime Status.</p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 text-xs flex gap-4 items-center">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl font-bold">🚢</div>
              <div className="space-y-1 flex-grow text-left">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Export Consignment Ledger</span>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Synced</span>
                </div>
                <p className="text-[10.5px] text-neutral-400">Licensed customs data and phytosanitary clearance records ready.</p>
              </div>
            </div>

            <div className="text-center pt-1">
              <button
                onClick={onLaunchMap}
                className="text-[9px] font-bold uppercase text-kava-gold hover:underline tracking-widest"
              >
                Access full interactive explorer maps
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discreet Developer System Handshake & Edge Diagnostic Check */}
      <div className="flex justify-center pt-8 border-t border-white/5">
        <button 
          onClick={() => setShowEdgeRouterLogs(!showEdgeRouterLogs)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[9px] uppercase font-black tracking-widest bg-white/[0.02] hover:bg-white/[0.06] text-neutral-500 hover:text-neutral-300 border border-white/5 transition-all cursor-pointer"
        >
          <Server size={10} className={showEdgeRouterLogs ? "text-kava-gold" : ""} />
          <span>{showEdgeRouterLogs ? 'Close Cloud Router Diagnostics' : 'Inspect Edge Router Handshake Logs'}</span>
        </button>
      </div>
    </div>
  );
}
