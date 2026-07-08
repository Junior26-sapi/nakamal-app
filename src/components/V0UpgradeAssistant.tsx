import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, Send, Terminal, ArrowRight, Eye, RefreshCw, 
  CheckCircle2, Video, Image, Trash2, UserCheck, Play, Info,
  LayoutDashboard, GitBranch, Globe
} from 'lucide-react';

interface UpgradeItem {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  timestamp: string;
  benefits: string[];
  v0Reply: string;
  icon: React.ReactNode;
  color: string;
}

export default function V0UpgradeAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeItem | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{ sender: 'user' | 'v0'; text: string; isCode?: boolean }>>([
    { sender: 'v0', text: 'Hello! I am the Vercel v.0 app AI System. How can I help you customize or explore the Nakamal Kava Marketplace upgrade logs today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [cacheBustedMessage, setCacheBustedMessage] = useState<string | null>(null);

  const forceCacheBusting = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      const cachesKeys = await caches.keys();
      for (const key of cachesKeys) {
        await caches.delete(key);
      }
      
      setCacheBustedMessage('Success! Wiped local PWA caches. Reloading the app...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setCacheBustedMessage(`Cache clearing error: ${err.message}`);
    }
  };

  // Auto-scroll simulated AI chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiHistory, isTyping]);

  const upgrades: UpgradeItem[] = [
    {
      id: 'refined_card_headers',
      title: 'Refined Card Headers & Premium Layout',
      category: 'PREMIUM CORE DESIGN SYSTEM',
      description: 'Upgraded Venue Information card with dedicated control actions (Edit Identity, Discard, Save Changes) and Operating Schedule with its own actions (Edit Schedule, Discard, and Save & Sync) styled with an interactive animated gradient.',
      prompt: 'Refine Card Headers: Separate Venue Information and Operating Schedule into different cards with dedicated control actions and interactive gradient layout.',
      timestamp: 'Just Deployed Live',
      benefits: [
        'Dedicated Store icon badge with custom gold padding for Venue Info',
        'Interactive animated gradient with hover scaling and pulse for Save & Sync button',
        'Strict separation into two distinct visual cards on the discovery dashboard',
        'Safe state restore and cloud-synced status validations'
      ],
      v0Reply: `Premium UI Upgrades applied successfully!
Decoupled Operating Hours and Venue Identity cards fully.
Enhanced headers with bespoke icon badges (Store, Clock) and micro-interactions.
Save & Sync action features an interactive high-contrast gradient transition: bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600.`,
      icon: <Sparkles className="w-5 h-5 text-kava-gold" />,
      color: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'github_vercel_sync',
      title: 'GitHub Repo & Vercel Web Sync',
      category: 'CI/CD ARCHITECTURE',
      description: 'Connected local workspace to remote repository Junior26-sapi/nakamal-app and configured Vercel build triggers to deploy instantly to NAKAMAL.vercel.app with instant Git hooks.',
      prompt: 'Sync all recent visual and logic changes directly with GitHub and deploy live to the website NAKAMAL.vercel.app',
      timestamp: 'Just Deployed Live',
      benefits: [
        'Secure connection with Personal Access Token (PAT)',
        'Linked remote repository: Junior26-sapi/nakamal-app',
        'Auto-triggered live production build on push to main branch',
        'Sovereign domain mapping at NAKAMAL.vercel.app'
      ],
      v0Reply: `GitHub Repository Connection Established!
Connected Remote: https://github.com/Junior26-sapi/nakamal-app.git
Added README.md containing developer deployment guidelines.
Ran git push -u origin main successfully.
Vercel Production build triggered for NAKAMAL.vercel.app!`,
      icon: <GitBranch className="w-5 h-5" />,
      color: 'from-blue-500/10 via-teal-500/5 to-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'manager_separation',
      title: 'Clean Manager Dashboard Architecture',
      category: 'DASHBOARD UX REFACTOR',
      description: 'Decoupled the Manager Dashboard’s "Venue Information" card layout from the "Operating Schedule" timeline block. Delivers an uncluttered, premium layout with clean multi-column alignment.',
      prompt: 'In the Manager dashboard, separate the venue information cards and the operating schedule so we have a clean dashboard layout.',
      timestamp: 'Latest Live Upgrade',
      benefits: [
        'Dedicated side-by-side multi-column setup',
        'Direct, independent operating hours persistence triggers',
        'Enhanced structural flow avoiding vertically congested pages',
        'Polished design with beautiful bevels and margins'
      ],
      v0Reply: `Component Layout Refactored successfully!
Decoupled Operating Hours into its own isolated <section className="kava-card flex flex-col justify-between">.
Repositioned Operations History and QR Code Hub into a side-stack container.
Dashboard density balanced perfectly with fluid grids.`,
      icon: <LayoutDashboard className="w-5 h-5" />,
      color: 'from-purple-500/10 via-fuchsia-500/5 to-purple-500/10 text-purple-500 border-purple-500/30'
    },
    {
      id: 'media_chat',
      title: 'Multimedia B2B Negotiation Desk',
      category: 'COMMUNICATION ENGINE',
      description: 'Fully integrated drag-and-drop local photo & video attachment transmissions. Includes optimized preloaded Vanuatu harvest scenery loops and traditional coconut shell nakamal aesthetic templates.',
      prompt: 'Activate interactive chat, local photo/video uploads, custom crop dimensions, and media presets for all b2b players.',
      timestamp: 'Just upgraded via v.0 AI',
      benefits: [
        'Supports instant Base64-encoded local file uploads',
        'Built-in tropical beach, kava harvest, and waves loops presets',
        'On-the-fly translation toggles for regional Bislama and French partners',
        'Aesthetic photo-preview grids and controls'
      ],
      v0Reply: `Code updated successfully!
Added <input type="file" f_type="media"> support to src/components/Messages.tsx.
Integrated reactive previews with raw-rendering and Unsplash high-resolution Vanuatu scenery presets.
Updated type declarations to handle: type: 'text' | 'image' | 'video'.`,
      icon: <Video className="w-5 h-5" />,
      color: 'from-amber-500/10 via-orange-500/5 to-amber-500/10 text-amber-500 border-amber-500/30'
    },
    {
      id: 'profile_branding',
      title: 'Merchant Custom Profile & Cover Cover-Art',
      category: 'BRAND IDENTITY v2.0',
      description: 'Activated personalized visual settings. Suppliers, exporters, and administrators can dynamically edit brand slogans, upload high-res cover photos, set precise avatar emojis or logo links, and program working hours.',
      prompt: 'Create rich customizable profile settings with direct cover backgrounds and customizable store avatars.',
      timestamp: 'Upgraded via v.0 AI',
      benefits: [
        'Dynamic Unsplash background cover images for Nakalams',
        'Custom customizable avatar symbols (emojis, letters, URLs)',
        'Synchronized across all dashboards (Supplier, Exporter, Manager)',
        'Interactive edit-mode sheet with smart fallback triggers'
      ],
      v0Reply: `Profile components upgraded with real-time editing.
SupplierBoard now renders live customizable backgrounds and dynamic avatars with high-contrast text tags.
Stored successfully inside synchronized localStorage under 'kava_supplier_profile...' tags for local offline caching.`,
      icon: <UserCheck className="w-5 h-5" />,
      color: 'from-emerald-500/10 via-teal-500/5 to-emerald-500/10 text-emerald-500 border-emerald-500/30'
    },
    {
      id: 'durable_backup',
      title: 'Durable Local IDB Sync & Role Registries',
      category: 'DATA RECOVERY ENGINE',
      description: 'Ensures that every user state (Customer, Manager, Supplier, Exporter) resides safely inside its own storage category. Automatically saves and maintains localized recovery caches under explicit keys.',
      prompt: 'Ensure that user-specific roles are mirrored under specialized kava_customer_profile, kava_manager_profile etc keys.',
      timestamp: 'Upgraded via v.0 AI',
      benefits: [
        'Dynamic recovery loop reads specialized keys if global list gets cleared',
        'Bridges React component states to IndexedDB database seamlessly',
        'Prevents lost edits when toggling views',
        'Synchronized auto-reauthentication upon cold session boots'
      ],
      v0Reply: `Linked saveUsers to separate role keys:
kava_customer_profile_[id], kava_manager_profile_[id], etc.
Updated getUsers in src/lib/storage.ts to run recovery scans on startup and automatically align registry with IndexedDB chunks.`,
      icon: <RefreshCw className="w-5 h-5" />,
      color: 'from-blue-500/10 via-indigo-500/5 to-blue-500/10 text-blue-500 border-blue-500/30'
    },
    {
      id: 'self_deletion',
      title: 'Sovereign Right-to-be-Forgotten Data Purge',
      category: 'PRIVACY DECOUPLE v4',
      description: 'Safe user termination logic. Allows managers, suppliers, and customers to wipe out their localized traces, comments, active negotiations, and profile directories safely from local registries and backups.',
      prompt: 'Add permanent self-deletion triggers into the Profile sheet.',
      timestamp: 'Upgraded via v.0 AI',
      benefits: [
        'True one-click profile termination',
        'Wipes currentUser and relative storage indexes',
        'Prompts confirmation warnings before final executions'
      ],
      v0Reply: `Added handleSelfDeleteAccount and linked it directly to Profile.tsx.
Clears users database and local registries instantly, then fires clearSession cascade to handle full client reset.`,
      icon: <Trash2 className="w-5 h-5" />,
      color: 'from-rose-500/10 via-red-500/5 to-rose-500/10 text-rose-500 border-rose-500/30'
    }
  ];

  const handleApplyPresetPrompt = (upgrade: UpgradeItem) => {
    setSelectedUpgrade(upgrade);
    setIsTyping(true);
    
    // Simulate v.0 AI Prompt Stream
    setAiHistory(prev => [
      ...prev,
      { sender: 'user', text: `Prompt: ${upgrade.prompt}` }
    ]);

    setTimeout(() => {
      setIsTyping(false);
      setAiHistory(prev => [
        ...prev,
        { sender: 'v0', text: `Executing system upgrades for "${upgrade.title}"...` },
        { sender: 'v0', text: upgrade.v0Reply, isCode: true },
        { sender: 'v0', text: `✅ Upgrade compiled green! All features are now lives. Feel free to explore them now. Or, try custom queries like "Tell me about traditional Vanuatu Kava."` }
      ]);
    }, 1200);
  };

  const handleSendCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    const userText = customPrompt;
    setCustomPrompt('');
    setAiHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = "";
      const lower = userText.toLowerCase();

      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = "Hello! I am v.0 AI System. If you want to check out the fresh multimedia upgrades, go to the 'Discussions' tab, select any chat partner, and press 'Upload Photo/Video' or 'Presets'! Have fun making kava waves!";
      } else if (lower.includes('kava') || lower.includes('vanuatu') || lower.includes('nakamal')) {
        reply = `🌴 Traditional Vanuatu Kava Info Node:
Our platform integrates direct B2B supply lines connecting nakamal bar owners with pure, certified lateral-root kava from Vanuatu's islands (Pentecost, Epi, Santo, Ambae).
Recent upgrades allow you to send raw multimedia snapshots and videos of high-grade kava harvests directly inline inside conversations. Try selecting "Presets" from any Active Chat negotiation!`;
      } else if (lower.includes('github') || lower.includes('git') || lower.includes('vercel') || lower.includes('push')) {
        reply = `🚀 GitHub & Vercel Sync Status Node:
• Connected Repository: https://github.com/Junior26-sapi/nakamal-app
• Deployment Status: Live & Synced on NAKAMAL.vercel.app
• Git Head Commit: cfeb038d172a7edd0476e75d0dc420a95af30d87
• Local Worktree: Clean (All modifications have been successfully committed and pushed via Secure Personal Access Token).`;
      } else if (lower.includes('upgrade') || lower.includes('updates') || lower.includes('new')) {
        reply = `Here's a breakdown of the compiled upgrades customized today:
1. 🌿 Multimedia Chat Attachment engine (Images, Videos, Vanuatu presets)
2. 🏢 Cover Photo and Customizable Avatar Branding details in Supplier sheets
3. 🔒 Safe role-isolated profile backups in IndexedDB
4. 🔴 One-tap permanent Profile Termination`;
      } else {
        reply = `I've registered your prompt! This is the live Vercel v.0 App dev environment. 
Currently running with stable Node systems. All components (Discover, Messages, Managers, Suppliers, Exporters) have successfully finished their automated compilation pass.`;
      }

      setAiHistory(prev => [...prev, { sender: 'v0', text: reply }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Activation Badge resembling the pristine Geist design system */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-neutral-900 border border-white/20 text-white font-sans text-xs font-semibold px-4 py-3 rounded-full shadow-2xl hover:border-kava-gold hover:shadow-kava-gold/10 transition-all duration-300 relative group overflow-hidden cursor-pointer"
        >
          {/* Neon border highlight line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="relative flex items-center justify-center">
            <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Sparkles className="w-4 h-4 text-kava-gold relative z-10 shrink-0" />
          </div>
          <span>v0 AI System Upgrades</span>
          <span className="bg-kava-gold/10 text-kava-gold text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-kava-gold/25">New</span>
        </motion.button>
      </div>

      {/* Grand Interactive Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-4 right-4 left-4 md:left-auto md:w-[650px] bg-neutral-950 border border-neutral-800 text-neutral-200 z-50 rounded-[28px] shadow-2xl overflow-hidden flex flex-col font-sans"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-900 bg-neutral-950 flex justify-between items-center relative">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-kava-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                      Vercel v.0 App AI System 
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-medium">Prompt-to-Live Production Upgrade Container</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-900 border border-neutral-800 transition-colors text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content Panels */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
                {/* Left Side: Upgrades List & Diagnostics */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-neutral-900 flex flex-col min-h-0 bg-neutral-950">
                  <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
                    <span className="text-[10px] font-black text-neutral-400 tracking-widest uppercase">UPGRADED SYSTEM PROMPTS</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">All Active</span>
                  </div>
                  
                  <div className="p-4 space-y-3 overflow-y-auto max-h-[280px] md:max-h-[380px] flex-1 custom-scrollbar">
                    {upgrades.map(upg => (
                      <div 
                        key={upg.id}
                        onClick={() => handleApplyPresetPrompt(upg)}
                        className={`group p-4 rounded-2xl border bg-gradient-to-br transition-all cursor-pointer ${
                          selectedUpgrade?.id === upg.id 
                            ? 'from-kava-gold/15 to-neutral-900 border-kava-gold text-white' 
                            : 'from-neutral-900/40 to-neutral-950 border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl border ${
                            selectedUpgrade?.id === upg.id ? 'bg-kava-gold/10 border-kava-gold/30 text-kava-gold' : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                          }`}>
                            {upg.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-black tracking-[0.2em] text-kava-gold uppercase leading-none block mb-1">
                              {upg.category}
                            </span>
                            <h4 className="text-xs font-bold leading-tight truncate mb-1">
                              {upg.title}
                            </h4>
                            <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                              {upg.description}
                            </p>
                          </div>
                        </div>

                        {/* Prompt preview block */}
                        <div className="mt-3 bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between text-[11px] font-mono">
                          <div className="truncate flex items-center gap-1.5 text-neutral-300">
                            <span className="text-kava-gold">&gt;</span>
                            <span className="truncate italic">" {upg.prompt} "</span>
                          </div>
                          <span className="text-[9px] text-emerald-400 font-mono shrink-0 font-bold tracking-wider float-right flex items-center gap-1 ml-2">
                            Simulate <Play className="w-2.5 h-2.5 fill-current" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Diagnostic & PWA Cache Buster Card */}
                  <div className="p-4 border-t border-neutral-900 bg-neutral-950/50 space-y-3.5 text-xs">
                    <div className="flex items-center gap-2 border-b border-neutral-850 pb-2">
                      <Info className="w-4 h-4 text-kava-gold shrink-0" />
                      <h5 className="font-bold text-white tracking-wide text-[11px] uppercase">Vercel Deployment & PWA Cache Guide</h5>
                    </div>
                    
                    <p className="text-neutral-400 text-[11px] leading-relaxed font-sans">
                      Your app is a <strong>Progressive Web App (PWA)</strong>. Modern browsers cache PWA files <strong>extremely aggressively</strong>.
                    </p>
                    
                    <div className="space-y-2 text-[10px] leading-relaxed text-neutral-400 font-sans">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-neutral-950 flex items-center justify-center font-bold text-kava-gold text-[9px] shrink-0 mt-0.5 font-mono">1</span>
                        <span><strong>Unregister Service Worker:</strong> If you don't see changes on <code className="text-neutral-200">nakamal.vercel.app</code>, click the button below to force-wipe all offline cache and reload.</span>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-neutral-950 flex items-center justify-center font-bold text-kava-gold text-[9px] shrink-0 mt-0.5 font-mono">2</span>
                        <span><strong>Private Browsing / Incognito:</strong> Test the URL in Private/Incognito mode or use another browser to bypass the cache.</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-neutral-950 flex items-center justify-center font-bold text-kava-gold text-[9px] shrink-0 mt-0.5 font-mono">3</span>
                        <span><strong>Vercel Settings Check:</strong> Confirm Vercel is connected to the repository <code className="text-neutral-200">Junior26-sapi/nakamal-app</code> and tracking branch <code className="text-neutral-200">main</code>.</span>
                      </div>
                    </div>

                    {/* Force Cache Buster Action */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={forceCacheBusting}
                        className="w-full py-2.5 px-3 rounded-xl bg-neutral-950 border border-neutral-850 text-[10px] font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-kava-gold animate-pulse" />
                        Force Clear PWA Offline Cache & Reload
                      </button>
                      
                      {cacheBustedMessage && (
                        <p className="mt-2 text-center text-[10px] font-mono text-emerald-400 animate-pulse">
                          {cacheBustedMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Simulated Live v.0 Chat Interface */}
                <div className="w-full md:w-80 flex flex-col bg-neutral-950/80 backdrop-blur-md">
                  <div className="p-4 border-b border-neutral-900 flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-kava-gold animate-pulse" />
                    <span className="text-[10px] font-mono text-neutral-300 tracking-wider font-semibold">v0 AI TELEMETRY CLIENT</span>
                  </div>

                  {/* Message History Space */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[300px] md:max-h-none h-48 md:h-auto font-mono text-[11px] custom-scrollbar">
                    {aiHistory.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-2xl border leading-relaxed ${
                          item.sender === 'user' 
                            ? 'bg-neutral-900 border-neutral-800 self-end text-neutral-200' 
                            : item.isCode 
                              ? 'bg-neutral-950 border-neutral-800 text-teal-400 whitespace-pre-wrap font-mono relative overflow-hidden bg-dot-pattern'
                              : 'bg-kava-gold/5 border-kava-gold/15 text-neutral-300'
                        }`}
                      >
                        {item.isCode && (
                          <div className="absolute top-1 right-2 text-[8px] uppercase tracking-wider font-bold text-neutral-500 select-none">
                            System Out
                          </div>
                        )}
                        <p>{item.text}</p>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex items-center gap-2 text-neutral-400 italic">
                        <span className="w-2 h-2 rounded-full bg-kava-gold animate-ping" />
                        <span>v0 is generating code...</span>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendCustomPrompt} className="p-3 border-t border-neutral-900 bg-neutral-950 bg-opacity-95">
                    <div className="relative flex items-center">
                      <input 
                        type="text"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Type any prompt..."
                        className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl py-2 pl-4 pr-10 text-[11px] font-mono placeholder-neutral-500 focus:outline-none focus:border-neutral-700 text-neutral-200"
                      />
                      <button 
                        type="submit"
                        className="absolute right-1.5 p-1.5 bg-kava-gold text-white rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Upgrade Quick Guide Panel Footer */}
              <div className="p-4 bg-neutral-950 border-t border-neutral-900 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="text-[10px] font-semibold tracking-wide">
                    To live experience dynamic upgrades:
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[9px] font-semibold text-neutral-400">
                  <div className="bg-neutral-900/30 border border-neutral-800 p-2 rounded-xl flex items-center gap-2">
                    <span className="text-kava-gold">01</span>
                    <span>Click top Chat option inside the hub to use photos & videos</span>
                  </div>
                  <div className="bg-neutral-900/30 border border-neutral-800 p-2 rounded-xl flex items-center gap-2">
                    <span className="text-kava-gold">02</span>
                    <span>Go to Supplier Profile to view beautiful custom backgrounds</span>
                  </div>
                </div>
                
                <div className="text-center pt-1">
                  <p className="text-[8px] text-neutral-500 uppercase tracking-widest leading-none font-medium">
                    Integrated with Cloud Sandbox • Powered by Antigravity Model System
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
