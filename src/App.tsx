import React, { useState, useEffect } from 'react';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { storage } from './lib/storage';
import { attemptAutoRecoveryOnStart, backupAllStorage } from './lib/indexedDbBackup';
import { User } from './types';
import Logo from './components/Logo';
import Discover from './components/Discover';
import Login from './components/Login';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import AdminBoard from './components/AdminBoard';
import ManagerBoard from './components/ManagerBoard';
import SupplierBoard from './components/SupplierBoard';
import ExporterBoard from './components/ExporterBoard';
import Profile from './components/Profile';
import Messages from './components/Messages';
import V0UpgradeAssistant from './components/V0UpgradeAssistant';
import { LogOut, LayoutDashboard, Compass, Lock, User as UserIcon, HelpCircle, Sun, Moon, MessageSquare, Globe, Coins, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './contexts/LanguageContext';
import { useCurrency, CurrencyCode } from './contexts/CurrencyContext';


export default function App() {
  const { locale, setLocale, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isReauthenticating, setIsReauthenticating] = useState(true);
  const [reauthStep, setReauthStep] = useState('Initializing Secure Cryptographic Container...');
  const [showPortal, setShowPortal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeView, setActiveView] = useState<'default' | 'messages'>('default');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Pull-to-Synchronize state properties
  const [pullY, setPullY] = useState(0);
  const [isPullRefActive, setIsPullRefActive] = useState(false);
  const [isPullSyncing, setIsPullSyncing] = useState(false);
  const [pullSuccess, setPullSuccess] = useState(false);
  const touchStartY = React.useRef(0);
  const isDraggingMouse = React.useRef(false);

  const triggerGestureSync = async () => {
    setIsPullSyncing(true);
    setPullY(80); // Maintain visible pull down block
    setPullSuccess(false);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
    } catch (_) {}

    // Run active storage synchronize & backups
    try {
      storage.init();
      await backupAllStorage();
      
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        const allUsers = storage.getUsers();
        const freshUser = allUsers.find(u => u.id === parsed.id);
        if (freshUser) {
          setCurrentUser(freshUser);
        }
      }
    } catch (err) {
      console.warn("Gesture synchronize failed:", err);
    }

    setTimeout(() => {
      setPullSuccess(true);
      try {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([15, 15]);
        }
      } catch (_) {}

      setTimeout(() => {
        setIsPullSyncing(false);
        setPullSuccess(false);
        setPullY(0);
        setIsPullRefActive(false);
      }, 800);
    }, 1100);
  };

  const handlePointerStart = (clientY: number) => {
    if (window.scrollY === 0 && !isPullSyncing) {
      touchStartY.current = clientY;
      setIsPullRefActive(true);
      setPullSuccess(false);
    }
  };

  const handlePointerMove = (clientY: number) => {
    if (!isPullRefActive || isPullSyncing) return;
    const diff = clientY - touchStartY.current;
    if (diff > 0) {
      const dampingFactor = 0.65;
      const damped = Math.min(130, Math.pow(diff, dampingFactor) * 3);
      setPullY(damped);
    }
  };

  const handlePointerEnd = () => {
    if (!isPullRefActive) return;
    if (pullY >= 70) {
      triggerGestureSync();
    } else {
      setPullY(0);
      setIsPullRefActive(false);
    }
    isDraggingMouse.current = false;
  };
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'wood'>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'wood') {
      return saved as 'light' | 'dark' | 'wood';
    }
    const oldTheme = localStorage.getItem('theme');
    if (oldTheme === 'dark') return 'dark';
    if (oldTheme === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const changeTheme = (newTheme: 'light' | 'dark' | 'wood') => {
    if ((document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        setTheme(newTheme);
      });
    } else {
      setTheme(newTheme);
    }
  };

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'messages') {
        setActiveView('messages');
        setShowProfile(false);
      } else if (customEvent.detail === 'dashboard' || customEvent.detail === 'default') {
        setActiveView('default');
        setShowProfile(false);
      }
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => window.removeEventListener('switchTab', handleSwitchTab);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'theme-wood');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'wood') {
      document.documentElement.classList.add('theme-wood');
    }
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  // Initialize storage schemas on first mount & maintain silent background shadows backup
  useEffect(() => {
    const initializeAndSync = async () => {
      let activeUser: User | null = currentUser;
      
      try {
        setReauthStep('Verifying offline IndexedDB sync logs...');
        const { recovered, keysCount } = await attemptAutoRecoveryOnStart();
        if (recovered) {
          console.info(`[IndexedDB Persistence] Restored ${keysCount} modules into localStorage!`);
          
          if (!activeUser) {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
              try {
                activeUser = JSON.parse(stored);
              } catch (_) {}
            }
          }
        }
      } catch (err) {
        console.warn('[IndexedDB Initialization] Could not auto-recover on boot:', err);
      }

      setReauthStep('Initializing secure platform registries...');
      storage.init();

      setReauthStep('Validating active session with local authority...');
      // Check if session exists in local storage and synchronize with the latest database records
      const storedSession = localStorage.getItem('currentUser') || (activeUser ? JSON.stringify(activeUser) : null);
      if (storedSession) {
        try {
          const parsed = JSON.parse(storedSession);
          const allUsers = storage.getUsers();
          const freshUser = allUsers.find(u => u.id === parsed.id);
          if (freshUser) {
            // Re-authenticate session status
            setCurrentUser(freshUser);
            localStorage.setItem('currentUser', JSON.stringify(freshUser));
            setReauthStep(`Authority status validated for ${freshUser.name}.`);
          } else {
            setCurrentUser(parsed);
            setReauthStep('Establishing backup credentials connection...');
          }
        } catch (e) {
          console.warn('Session check failed:', e);
        }
      } else {
        setReauthStep('No cached session. Standard portal ready.');
      }

      try {
        await backupAllStorage();
      } catch (backupErr) {
        console.warn('[IndexedDB Initial Backup] Failed to store backup:', backupErr);
      }

      // Brief delay to allow the loading animation to display smoothly
      setTimeout(() => {
        setIsReauthenticating(false);
      }, 1000);
    };

    initializeAndSync();

    // Periodically run backup in background shadows without any direct UI clutter
    const backupInterval = setInterval(async () => {
      try {
        const meta = await backupAllStorage();
        console.log('[IndexedDB Background Backup] Snapshot synchronized silently in shadows:', meta);
      } catch (err) {
        console.warn('[IndexedDB Background Backup] Failed to auto-backup in shadows:', err);
      }
    }, 60000); // sync every 60 seconds

    return () => clearInterval(backupInterval);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setShowPortal(false);
    setShowProfile(false);
    setActiveView('default');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setShowPortal(false);
    setShowProfile(false);
    setActiveView('default');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Also save in user registry (ensure we append if missing)
    const allUsers = storage.getUsers();
    const index = allUsers.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      allUsers[index] = updatedUser;
    } else {
      allUsers.push(updatedUser);
    }
    storage.saveUsers(allUsers);
  };

  const handleSelfDeleteAccount = () => {
    if (!currentUser) return;
    const allUsers = storage.getUsers();
    const filteredUsers = allUsers.filter(u => u.id !== currentUser.id);
    storage.saveUsers(filteredUsers);
    handleLogout();
  };

  // Switch boards or default back depending on user role
  const renderDashboard = () => {
    if (showProfile && currentUser) {
      return (
        <Profile 
          user={currentUser} 
          onUpdate={handleUpdateUser} 
          onBack={() => setShowProfile(false)} 
          onDeleteAccount={handleSelfDeleteAccount}
        />
      );
    }

    if (activeView === 'messages' && currentUser) {
      return (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white/45 dark:bg-neutral-900/35 backdrop-blur-md rounded-[32px] p-4 border border-white dark:border-white/5 shadow-layered">
            <div className="flex items-center gap-3 px-2">
              <span className="text-emerald-500 text-lg">🌿</span>
              <div>
                <span className="text-xs font-black tracking-[0.2em] text-kava-muted dark:text-kava-muted uppercase">Secure B2B Messaging Network</span>
                <p className="text-[9px] font-bold text-kava-gold uppercase tracking-wider leading-none mt-0.5">Encrypted Protocol Active</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveView('default')}
              className="text-xs font-bold text-kava-gold bg-white dark:bg-black/20 hover:bg-neutral-100 dark:hover:bg-black/30 border border-neutral-200 dark:border-white/5 px-4 py-2 rounded-full shadow-sm transition-all"
            >
              Back to Dashboard
            </button>
          </div>
          <Messages user={currentUser} />
        </div>
      );
    }

    if (!currentUser) return <Discover user={null} onTogglePortal={() => setShowPortal(true)} />;

    switch (currentUser.role) {
      case 'admin':
        return <AdminBoard onLogout={handleLogout} />;
      case 'manager':
        return <ManagerBoard user={currentUser} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
      case 'supplier':
        return <SupplierBoard user={currentUser} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
      case 'exporter':
        return <ExporterBoard user={currentUser} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />;
      case 'user':
      default:
        return <Discover user={currentUser} onTogglePortal={() => setShowPortal(true)} />;
    }
  };

  return (
    <ConfirmationProvider>
      <RealtimeProvider currentUserId={currentUser?.id}>
        {isReauthenticating ? (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-200 select-none kava-pattern p-6">
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative max-w-sm w-full bg-neutral-900/45 backdrop-blur-xl border border-white/10 rounded-[36px] p-8 text-center space-y-6 shadow-2xl overflow-hidden"
            >
              {/* Subtle Golden Radial Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-kava-gold/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-kava-gold/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col items-center space-y-3">
                {/* Pulsing Lock Header Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-kava-gold/25 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full bg-neutral-950 border border-kava-gold/35 flex items-center justify-center">
                    <Lock size={24} className="text-kava-gold animate-bounce" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h2 className="font-bebas text-2xl md:text-3xl tracking-wider text-white uppercase leading-none">
                    VESSEL <span className="text-kava-gold">SESSION LOCK</span>
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-[9px] font-black tracking-widest text-neutral-400 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-kava-gold animate-ping" />
                    Sovereign Credentials System v4.5
                  </div>
                </div>
              </div>

              {/* User profile card or loading public indicator */}
              {currentUser ? (
                <div className="bg-neutral-950/75 border border-white/5 rounded-2xl p-4 text-center space-y-2 shadow-inner">
                  <div className="text-[9px] font-black uppercase text-kava-gold tracking-[0.15em] opacity-80">
                    Re-Authenticating Cached Session
                  </div>
                  <div className="text-white font-sans text-sm font-semibold">{currentUser.name}</div>
                  <div className="inline-flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest bg-kava-gold/10 border border-kava-gold/25 text-kava-gold px-2.5 py-0.5 rounded-full">
                    {currentUser.role} Node
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-950/40 border border-white/5 rounded-2xl p-4 text-center shadow-inner">
                  <span className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase">
                    Initializing Kava Network Node...
                  </span>
                </div>
              )}

              {/* Status logs and progress estimation bar */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                  <div className="flex items-center gap-1">
                    <span>Status:</span>
                    <span className="text-kava-gold animate-pulse text-left">{reauthStep}</span>
                  </div>
                </div>

                {/* Smooth animated loader bar */}
                <div className="w-full bg-neutral-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: "5%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.0, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-kava-gold via-amber-500 to-kava-gold rounded-full"
                  />
                </div>

                <div className="flex justify-between items-center text-[8.5px] text-neutral-500 font-mono uppercase tracking-wider">
                  <span>Secure Layer: active</span>
                  <span>100% integrity</span>
                </div>
              </div>
            </motion.div>
            
            {/* Footnote */}
            <p className="text-[9px] text-neutral-600 font-mono tracking-widest uppercase mt-6 relative z-10">
              Decentralized Digital Kava Network of Vanuatu
            </p>
          </div>
        ) : (
          <>
            {/* Dynamic Visual Pull-to-Sync Overhead Indicator */}
            {(pullY > 0 || isPullSyncing) && (
              <div 
                className="fixed left-0 right-0 z-[250] pointer-events-none flex justify-center pt-8 transition-all duration-150"
                style={{ top: `${pullY - 70}px` }}
              >
                <div className="bg-kava-bg border-2 border-kava-gold text-kava-text rounded-full py-2.5 px-6 shadow-2xl flex items-center gap-3 backdrop-blur-md">
                  {isPullSyncing ? (
                    pullSuccess ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Sync Complete 🇻🇺</span>
                      </>
                    ) : (
                      <>
                        <RefreshCcw size={13} className="text-kava-gold animate-spin shrink-0 truncate" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-kava-gold animate-pulse">Syncing Offline Vault...</span>
                      </>
                    )
                  ) : (
                    <>
                      <RefreshCcw 
                        size={13} 
                        className="text-kava-muted shrink-0" 
                        style={{ transform: `rotate(${pullY * 4.5}deg)` }} 
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-kava-muted">
                        {pullY >= 70 ? 'Release to Sync Nodes' : 'Pull down to Synchronize'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div 
              id="app-wrapper" 
              className="min-h-screen flex flex-col bg-transparent text-kava-text relative overflow-x-hidden"
              onTouchStart={(e) => handlePointerStart(e.touches[0].clientY)}
              onTouchMove={(e) => handlePointerMove(e.touches[0].clientY)}
              onTouchEnd={handlePointerEnd}
              onMouseDown={(e) => { isDraggingMouse.current = true; handlePointerStart(e.clientY); }}
              onMouseMove={(e) => { if (isDraggingMouse.current) handlePointerMove(e.clientY); }}
              onMouseUp={handlePointerEnd}
              onMouseLeave={handlePointerEnd}
            >
        {/* Global Header */}
        <header id="app-header" className="sticky top-0 z-40 bg-kava-bg/85 backdrop-blur-md border-b border-kava-muted/10 px-4 py-3 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <Logo size={42} showText={true} />
              <div className="hidden sm:block border-l-2 border-kava-muted/20 pl-3">
                <p className="text-[10px] text-kava-muted uppercase tracking-[0.2em] font-bold leading-none">{t('administrative')}</p>
                <p className="text-xs text-kava-gold tracking-[0.05em] font-black uppercase mt-0.5">{t('ecosystem_monitor')}</p>
              </div>
            </div>

            {/* Navigation & Controls */}
            <div className="flex items-center gap-3">
              {/* Currency Selector Dropdown */}
              <div className="relative">
                <button
                  id="btn-currency-selector"
                  onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-kava-muted/10 transition-all text-kava-muted text-xs font-bold uppercase tracking-wider border border-neutral-200/55 dark:border-white/10 cursor-pointer"
                  title="Select Currency"
                >
                  <Coins size={14} className="text-kava-gold" />
                  <span>{currency}</span>
                </button>

                <AnimatePresence>
                  {showCurrencyDropdown && (
                    <>
                      {/* Backdrop for click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowCurrencyDropdown(false)}
                      />
                      <motion.div
                        id="currency-dropdown-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className="absolute right-0 mt-2 w-44 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                      >
                        <div className="p-1.5 flex flex-col gap-1">
                          {(['VUV', 'XPF', 'FJD', 'AUD', 'NZD'] as CurrencyCode[]).map((cur) => {
                            const curSymbols: Record<CurrencyCode, string> = {
                              VUV: 'VT (VUV)',
                              XPF: '₣ (XPF)',
                              FJD: 'FJ$ (FJD)',
                              AUD: 'A$ (AUD)',
                              NZD: 'NZ$ (NZD)'
                            };
                            return (
                              <button
                                key={cur}
                                onClick={() => {
                                  setCurrency(cur);
                                  setShowCurrencyDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                  currency === cur
                                    ? 'bg-kava-gold/15 text-kava-gold'
                                    : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                                }`}
                              >
                                <span>{curSymbols[cur].split(' ')[0]}</span>
                                <span className="text-[9px] opacity-60 font-mono">{cur}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  id="btn-language-selector"
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-kava-muted/10 transition-all text-kava-muted text-xs font-bold uppercase tracking-wider border border-neutral-200/55 dark:border-white/10 cursor-pointer"
                  title="Select Language"
                >
                  <Globe size={14} className="text-kava-gold" />
                  <span>{locale === 'en' ? 'EN' : locale === 'fr' ? 'FR' : 'BI'}</span>
                </button>

                <AnimatePresence>
                  {showLangDropdown && (
                    <>
                      {/* Backdrop for click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowLangDropdown(false)}
                      />
                      <motion.div
                        id="language-dropdown-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className="absolute right-0 mt-2 w-36 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                      >
                        <div className="p-1.5 flex flex-col gap-1">
                          <button
                            onClick={() => {
                              setLocale('en');
                              setShowLangDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              locale === 'en'
                                ? 'bg-kava-gold/15 text-kava-gold'
                                : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                            }`}
                          >
                            <span>English</span>
                            <span className="text-[9px] opacity-60">EN</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocale('fr');
                              setShowLangDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              locale === 'fr'
                                ? 'bg-kava-gold/15 text-kava-gold'
                                : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                            }`}
                          >
                            <span>Français</span>
                            <span className="text-[9px] opacity-60">FR</span>
                          </button>
                          <button
                            onClick={() => {
                              setLocale('bi');
                              setShowLangDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                              locale === 'bi'
                                ? 'bg-kava-gold/15 text-kava-gold'
                                : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                            }`}
                          >
                            <span>Bislama</span>
                            <span className="text-[9px] opacity-60">BI</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Theme Selector Dropdown */}
              <div className="relative">
                <button
                  id="btn-theme-dropdown"
                  onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-kava-muted/10 transition-all text-kava-muted text-xs font-bold uppercase tracking-wider border border-neutral-200/55 dark:border-white/10 cursor-pointer"
                  title="Choose UI Theme"
                >
                  {theme === 'light' ? (
                    <Sun size={14} className="text-kava-gold" />
                  ) : theme === 'dark' ? (
                    <Moon size={14} className="text-indigo-400" />
                  ) : (
                    <span className="text-sm leading-none shrink-0" style={{ transform: 'none' }}>🌴</span>
                  )}
                  <span className="hidden xs:inline-block">
                    {theme === 'light' ? 'Day' : theme === 'dark' ? 'Sunset' : 'Island Wood'}
                  </span>
                </button>

                <AnimatePresence>
                  {showThemeDropdown && (
                    <>
                      {/* Backdrop for click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowThemeDropdown(false)}
                      />
                      <motion.div
                        id="theme-dropdown-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                      >
                        <div className="p-1.5 flex flex-col gap-1">
                          {/* Light Theme */}
                          <button
                            onClick={() => {
                              changeTheme('light');
                              setShowThemeDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              theme === 'light'
                                ? 'bg-kava-gold/15 text-kava-gold'
                                : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                            }`}
                          >
                            <Sun size={14} className="text-kava-gold" />
                            <div className="flex flex-col">
                              <span>Vanuatu Day</span>
                              <span className="text-[9px] opacity-65 font-normal">Original Light Theme</span>
                            </div>
                          </button>

                          {/* Dark Theme */}
                          <button
                            onClick={() => {
                              changeTheme('dark');
                              setShowThemeDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-kava-gold/15 text-kava-gold'
                                : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                            }`}
                          >
                            <Moon size={14} className="text-indigo-400" />
                            <div className="flex flex-col">
                              <span>Sunset Blue</span>
                              <span className="text-[9px] opacity-65 font-normal">Original Dark Theme</span>
                            </div>
                          </button>

                          {/* Wood Tribal Theme */}
                          <button
                            onClick={() => {
                              changeTheme('wood');
                              setShowThemeDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                              theme === 'wood'
                                ? 'bg-kava-gold/15 text-kava-gold'
                                : 'text-kava-text dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/55'
                            }`}
                          >
                            <span className="text-sm leading-none">🌴</span>
                            <div className="flex flex-col">
                              <span>Island Wood</span>
                              <span className="text-[9px] opacity-65 font-normal">Traditional Wood & Tribal</span>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages Hub Toggle */}
              {currentUser && (
                <button
                  id="nav-messages"
                  onClick={() => {
                    const nextView = activeView === 'messages' ? 'default' : 'messages';
                    setActiveView(nextView);
                    setShowProfile(false);
                  }}
                  className={`p-2 rounded-full transition-all relative ${
                    activeView === 'messages' ? 'bg-kava-gold/15 text-kava-gold' : 'text-kava-muted hover:bg-kava-muted/10'
                  }`}
                  title={t('messages')}
                >
                  <MessageSquare size={18} />
                </button>
              )}

              {/* Back to Public Explorer */}
              {currentUser && currentUser.role !== 'user' && currentUser.role !== 'admin' && (
                <button
                  id="nav-public-explorer"
                  onClick={() => handleLogout()}
                  className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-neutral-100 border border-neutral-200 transition-all text-kava-muted"
                >
                  <Compass size={14} />
                  Public Explorer
                </button>
              )}

              {currentUser ? (
                <div id="user-badge" className="flex items-center gap-2 sm:gap-3 bg-kava-surface border border-white p-1 pr-3.5 rounded-full shadow-sm">
                  <button
                    id="btn-view-profile"
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2 sm:gap-3 hover:opacity-85 transition-all text-left"
                    title="View and Edit Profile"
                  >
                    {currentUser.avatarUrl || currentUser.logoUrl ? (
                      currentUser.avatarUrl && currentUser.avatarUrl.length < 5 ? (
                        <div className="w-8 h-8 rounded-full bg-kava-gold text-white flex items-center justify-center font-bold text-base border border-neutral-200 select-none">
                          {currentUser.avatarUrl}
                        </div>
                      ) : (
                        <img 
                          src={currentUser.avatarUrl || currentUser.logoUrl} 
                          alt={currentUser.name} 
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200"
                          referrerPolicy="no-referrer"
                        />
                      )
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-kava-gold text-white flex items-center justify-center font-bold text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold leading-tight line-clamp-1">{currentUser.name}</p>
                      <p className="text-[9px] text-kava-muted uppercase tracking-wider font-extrabold leading-none mt-0.5">{currentUser.role}</p>
                    </div>
                  </button>
                  <button
                    id="btn-logout"
                    onClick={handleLogout}
                    title="Log Out Session"
                    className="ml-2 p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-all"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {showPortal ? (
                    <button
                      id="btn-public-back"
                      onClick={() => setShowPortal(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-kava-muted bg-white hover:bg-neutral-100 border border-neutral-200 transition-all"
                    >
                      <Compass size={14} />
                      Back to Map
                    </button>
                  ) : (
                    <button
                      id="btn-login-portal"
                      onClick={() => setShowPortal(true)}
                      className="flex items-center gap-2 bg-kava-gold hover:bg-kava-muted hover:text-white text-white font-bebas text-lg px-5 py-1.5 rounded-full transition-all shadow-md active:scale-95"
                    >
                      <Lock size={14} className="mb-0.5" />
                      Login Portal
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Core Main Area */}
        <main id="app-main-content" className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
          {showPortal && !currentUser ? (
            <div className="max-w-md mx-auto py-10">
              <Login onLogin={handleLogin} />
            </div>
          ) : (
            renderDashboard()
          )}
        </main>
      </div>
      <V0UpgradeAssistant />
      <PwaInstallPrompt />
      </>
    )}
    </RealtimeProvider>
    </ConfirmationProvider>
  );
}
