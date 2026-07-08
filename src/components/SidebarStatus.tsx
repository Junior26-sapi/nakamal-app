import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, RefreshCw, Wifi, WifiOff, HardDrive, ShieldCheck, Zap, Server, X } from 'lucide-react';
import { getFromIndexedDB, backupAllStorage } from '../lib/indexedDbBackup';
import { useRealtime } from '../contexts/RealtimeContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarStatusProps {
  onClose?: () => void;
}

export default function SidebarStatus({ onClose }: SidebarStatusProps) {
  const { t } = useLanguage();
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [backupKeysCount, setBackupKeysCount] = useState<number>(0);
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'disconnected' | 'mocked'>('checking');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const { isConnected: isWsConnected } = useRealtime();

  // Load baseline on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const meta = await getFromIndexedDB('backup_metadata');
        if (meta) {
          setLastSyncTime(meta.timestamp);
          setBackupKeysCount(meta.keysCount || 0);
        }
      } catch (err) {
        console.warn('[SidebarStatus] Failed to load backup meta:', err);
      }
    };

    fetchMetadata();
    checkSupabaseConnection();

    // Listen to real-time events from our backup coordinator
    const handleSyncEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setLastSyncTime(customEvent.detail.timestamp);
        setBackupKeysCount(customEvent.detail.keysCount || 0);
      }
    };

    window.addEventListener('indexeddb-sync', handleSyncEvent);
    
    // Periodically verification intervals
    const interval = setInterval(() => {
      checkSupabaseConnection();
    }, 15000);

    return () => {
      window.removeEventListener('indexeddb-sync', handleSyncEvent);
      clearInterval(interval);
    };
  }, []);

  const checkSupabaseConnection = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const isMock = !supabaseUrl || 
                   !supabaseAnonKey || 
                   supabaseUrl === 'placeholder' ||
                   supabaseUrl === '';
                   
    if (isMock) {
      setSupabaseStatus('mocked');
      return;
    }
    
    try {
      // Execute a quick, light query to verify Supabase schema access
      const { error } = await supabase.from('bars').select('id').limit(1);
      if (error && error.message && error.message.includes('Supabase unconfigured')) {
        setSupabaseStatus('mocked');
      } else if (error && (error as any).status !== 401 && (error as any).status !== 403) {
        // Status code is a database permission or table issue, which means connection roundtrip is alive
        setSupabaseStatus('connected');
      } else {
        // Successful response is perfect
        setSupabaseStatus('connected');
      }
    } catch (e) {
      setSupabaseStatus('disconnected');
    }
  };

  const handleManualBackup = async () => {
    setIsSyncing(true);
    setSyncFeedback('Saving Snapshots...');
    try {
      const meta = await backupAllStorage();
      if (meta.status === 'operational') {
        setLastSyncTime(meta.timestamp);
        setBackupKeysCount(meta.keysCount);
        setSyncFeedback('Ecosystem Saved!');
      } else {
        setSyncFeedback('Sync Warning!');
      }
    } catch (e) {
      setSyncFeedback('Auto Backup Failed');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  const formatTime = (time: number | null) => {
    if (!time) return 'Never';
    return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
      className="absolute right-0 mt-3 w-80 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl rounded-[28px] border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col z-50 text-left"
    >
      {/* Header Area */}
      <div className="p-4 flex items-center justify-between border-b border-kava-muted/5 bg-neutral-50/50 dark:bg-neutral-900/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-kava-gold/15 rounded-xl text-kava-gold shrink-0">
            <Database size={16} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-kava-text dark:text-neutral-200 uppercase tracking-widest leading-none">{t('vessel_node')}</h4>
            <p className="text-[8px] font-bold text-kava-gold uppercase tracking-wider leading-none mt-1">{t('ecosystem_monitor')}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-kava-muted hover:text-kava-gold transition-all cursor-pointer"
            title="Close Monitor"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 space-y-4">
        {/* Supabase Connection Status Module */}
        <div className="space-y-1.5">
          <h5 className="text-[8px] font-black uppercase text-kava-muted dark:text-neutral-400 tracking-widest px-1">{t('cloud_pipeline')}</h5>
          <div className="flex items-center gap-3 p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100/50 dark:border-neutral-800/10" title="Supabase Connection">
            <div className="relative shrink-0 flex items-center justify-center">
              {supabaseStatus === 'connected' ? (
                <>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute" />
                  <Wifi size={14} className="text-emerald-500 relative" />
                </>
              ) : supabaseStatus === 'disconnected' ? (
                <WifiOff size={14} className="text-rose-500" />
              ) : supabaseStatus === 'mocked' ? (
                <Server size={14} className="text-amber-500" />
              ) : (
                <RefreshCw size={14} className="text-neutral-400 animate-spin" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-kava-text dark:text-neutral-200 uppercase tracking-wide block">Supabase Client</span>
              <span className={`text-[8px] font-bold uppercase block leading-none mt-1 ${
                supabaseStatus === 'connected' ? 'text-emerald-500' :
                supabaseStatus === 'disconnected' ? 'text-rose-500' :
                supabaseStatus === 'mocked' ? 'text-amber-500' : 'text-neutral-400'
              }`}>
                {supabaseStatus === 'connected' ? 'Connected' :
                 supabaseStatus === 'disconnected' ? 'Offline' :
                 supabaseStatus === 'mocked' ? 'Local Sandbox' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>

        {/* WebSocket Server Connection Module */}
        <div className="space-y-1.5">
          <h5 className="text-[8px] font-black uppercase text-kava-muted dark:text-neutral-400 tracking-widest px-1">{t('network_hub')}</h5>
          <div className="flex items-center gap-3 p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100/50 dark:border-neutral-800/10" title="WebSocket Synchronization Link">
            <div className="relative shrink-0 flex items-center justify-center">
              {isWsConnected ? (
                <>
                  <span className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-ping absolute" />
                  <Zap size={14} className="text-sky-400 relative" />
                </>
              ) : (
                <Zap size={14} className="text-neutral-400" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-kava-text dark:text-neutral-200 uppercase tracking-wide block">WS Broadcast IP</span>
              <span className={`text-[8px] font-bold uppercase block leading-none mt-1 ${isWsConnected ? 'text-emerald-500' : 'text-neutral-400'}`}>
                {isWsConnected ? t('active_signal') : t('standby')}
              </span>
            </div>
          </div>
        </div>

        {/* IndexedDB Local Persistence Module */}
        <div className="space-y-1.5">
          <h5 className="text-[8px] font-black uppercase text-kava-muted dark:text-neutral-400 tracking-widest px-1">{t('safe_storage')}</h5>
          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-100/50 dark:border-neutral-800/10 relative overflow-hidden" title="IndexedDB Auto Replication">
            <div className="flex items-start gap-2.5">
              <HardDrive size={14} className="text-kava-gold mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-kava-text dark:text-neutral-200 uppercase tracking-wide block">IndexedDB Mirror</span>
                <p className="text-[8px] text-kava-muted dark:text-neutral-400 font-bold leading-normal mt-1">
                  {t('replicate')} <strong className="text-kava-text dark:text-neutral-200">{backupKeysCount} modules</strong>
                </p>
                <div className="mt-2 pt-2 border-t border-kava-muted/5 flex flex-col gap-0.5">
                  <span className="text-[7.5px] font-extrabold uppercase text-kava-muted tracking-wider block">{t('last_snapshot')}:</span>
                  <span className="text-[9px] font-black text-kava-gold uppercase tracking-widest block">{formatTime(lastSyncTime)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                disabled={isSyncing}
                onClick={handleManualBackup}
                className="w-full py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 font-black text-[8px] uppercase tracking-widest rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-700 text-kava-text dark:text-neutral-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
                {t('force_sync')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert Overlay */}
      <AnimatePresence>
        {syncFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-10 left-3 right-3 p-2 bg-neutral-950 border border-white/10 rounded-xl flex items-center gap-2 shadow-xl z-20"
          >
            <ShieldCheck size={11} className="text-kava-gold animate-bounce shrink-0" />
            <span className="text-[8.5px] font-black uppercase text-white tracking-widest leading-none">{syncFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer static sync indicator */}
      <div className="p-3 bg-neutral-50/50 dark:bg-neutral-900/10 border-t border-kava-muted/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            supabaseStatus === 'connected' || isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
          }`} />
          <span className="text-[8px] font-black uppercase text-kava-muted tracking-wider">
            {supabaseStatus === 'connected' ? 'Secure Node' : 'Sandbox Node'}
          </span>
        </div>
        <span className="text-[7.5px] text-kava-muted font-bold opacity-60">
          v1.0.4-ledger
        </span>
      </div>
    </motion.div>
  );
}
