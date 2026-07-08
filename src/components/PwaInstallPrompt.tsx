import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Smartphone, Info, Smartphone as PhoneIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PwaInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);

  useEffect(() => {
    // 1. Detect platform
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /android/.test(ua);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 2. Listen for native PWA beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Auto trigger banner visibility if not dismissed before
      const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000); // 3 seconds delay for professional look
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback trigger for iOS/Desktop PWA tracking if native event never fires
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';
    if (!isDismissed) {
      // Check if already in standalone (installed) mode or loaded via pwa query
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.matchMedia('(display-mode: fullscreen)').matches ||
                           window.matchMedia('(display-mode: minimal-ui)').matches ||
                           (navigator as any).standalone ||
                           window.location.search.includes('pwa=true') ||
                           window.location.search.includes('standalone=true');
      if (!isStandalone) {
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Install outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsVisible(false);
    } else if (platform === 'ios') {
      // Trigger user guides highlight or instructions
      alert("To install, tap the Share button in Safari, then select 'Add to Home Screen'.");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] w-[90%] max-w-md bg-neutral-900 border-2 border-kava-gold/40 rounded-3xl p-5 shadow-[0_20px_50px_rgba(212,163,89,0.25)] text-left flex flex-col gap-4 overflow-hidden"
      >
        <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-24 h-24 bg-kava-gold/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <img 
              src="/icon.png" 
              alt="Nakamal App" 
              className="w-12 h-12 rounded-xl object-cover border border-kava-gold/30 shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="font-bebas text-xl text-white tracking-widest uppercase">Nakamal App Ecosystem</h4>
              <p className="text-[10px] text-kava-gold font-black uppercase tracking-wider leading-none">Native Device Launcher</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close Smart Banner"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-xs text-neutral-300 leading-relaxed">
          {platform === 'ios' ? (
            <div className="space-y-2">
              <p>Get full native performance on iOS with background sync and zero border constraints:</p>
              <div className="p-2.5 bg-neutral-950/60 rounded-xl border border-white/5 flex items-center gap-2.5 text-[11px] text-neutral-400">
                <Share2 size={13} className="text-kava-gold animate-bounce" />
                <span>Tap <strong className="text-white">Share</strong>, then select <strong className="text-kava-gold font-bold">Add to Home Screen</strong></span>
              </div>
            </div>
          ) : (
            <p>Install the official Nakamal App directly from your browser for premium native features, custom alerts, offline tracking, and rapid response widgets.</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-neutral-300 text-[11px] font-bold uppercase tracking-wider text-center transition-all cursor-pointer"
          >
            Maybe Later
          </button>
          
          {platform === 'ios' ? (
            <button
              onClick={() => {
                alert("Instructions: Tap the Share button in Safari, then select 'Add to Home Screen' to launch this kava app directly with native performance.");
              }}
              className="flex-1 py-2.5 bg-kava-gold hover:opacity-90 text-white text-[11px] font-black uppercase tracking-wider text-center rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Info size={12} />
              How To Install
            </button>
          ) : (
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2.5 bg-kava-gold hover:opacity-90 text-white text-[11px] font-black uppercase tracking-wider text-center rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={12} />
              Install Native App
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
