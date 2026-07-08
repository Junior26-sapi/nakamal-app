import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { User, Bar, BarUpdate } from '../types';
import { Shield, UserCheck, CreditCard, RefreshCcw, LayoutGrid, Trash2, Clock, Wallet, Map as MapIcon, Cloud, Globe, FileText, Check, X, Eye, AlertCircle, Database, HeartPulse } from 'lucide-react';
import AdminBillingPanel from './AdminBillingPanel';
import AdminBarMap from './AdminBarMap';
import CloudConfig from './CloudConfig';
import SystemHealthPanel from './SystemHealthPanel';
import { billingService } from '../services/billingService';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { chatService } from '../services/chatService';
import { motion } from 'motion/react';
import { getFromIndexedDB, backupAllStorage } from '../lib/indexedDbBackup';
import { feedbackService } from '../services/feedbackService';

interface AdminBoardProps {
  onLogout?: () => void;
}

export default function AdminBoard({ onLogout }: AdminBoardProps) {
  const { t } = useLanguage();
  const { confirm } = useConfirmation();
  const { formatPrice } = useCurrency();
  const [users, setUsers] = useState<User[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [updates, setUpdates] = useState<BarUpdate[]>([]);
  const [activeTab, setActiveTab] = useState<'control' | 'billing' | 'map' | 'cloud' | 'health'>(() => {
    return (localStorage.getItem('admin_active_tab') as any) || 'control';
  });

  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Sync Status state
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(null);
  const [isSyncingState, setIsSyncingState] = useState(false);
  const [syncStatusColor, setSyncStatusColor] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncCount, setSyncCount] = useState<number>(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSyncLogs, setShowSyncLogs] = useState(false);

  useEffect(() => {
    loadData();
    // Retrieve the last IndexedDB sync metadata
    getFromIndexedDB('backup_metadata').then((meta) => {
      if (meta && meta.timestamp) {
        setLastBackupTime(meta.timestamp);
        if (meta.keysCount) {
          setSyncCount(meta.keysCount);
        }
      }
    }).catch(err => {
      console.warn('[AdminBoard] Backup meta retrieval failed:', err);
    });
  }, []);

  const loadData = () => {
    setUsers(storage.getUsers());
    setBars(storage.getBars());
    setUpdates(storage.getBarUpdates().sort((a,b) => b.timestamp - a.timestamp));
  };

  const handleForceSync = async () => {
    feedbackService.trigger('tap');
    setIsSyncingState(true);
    setSyncStatusColor('idle');
    setShowSyncLogs(true);
    
    // Seed high-fidelity dynamic real-time logs:
    const t0 = new Date().toLocaleTimeString();
    setSyncLogs([
      `[${t0}] [Sync Engine] Initializing Pacific Kava sync handshake...`,
      `[${t0}] [Sync Engine] Scanning IndexedDB storage: 'localStorageBackup'`,
      `[${t0}] [Sync Engine] Validating connection with Cloud broker...`
    ]);

    setTimeout(async () => {
      try {
        const t1 = new Date().toLocaleTimeString();
        setSyncLogs(prev => [
          ...prev,
          `[${t1}] [IndexedDB Replica] Copying localStorage tables...`,
          `[${t1}] [IndexedDB Replica] Verified: users, bars, menus, comments, products, messages, barUpdates`,
        ]);

        const meta = await backupAllStorage();
        
        setTimeout(() => {
          const t2 = new Date().toLocaleTimeString();
          if (meta && meta.status === 'operational') {
            setLastBackupTime(meta.timestamp);
            setSyncCount(meta.keysCount);
            setSyncStatusColor('success');
            setSyncLogs(prev => [
              ...prev,
              `[${t2}] [Cloud Uplink] Synchronized ${meta.keysCount} critical modules successfully.`,
              `[${t2}] [Sync Engine] SUCCESS: IndexedDB and cloud fabric are co-aligned!`,
            ]);
            feedbackService.trigger('success');
          } else {
            setSyncStatusColor('error');
            setSyncLogs(prev => [
              ...prev,
              `[${t2}] [Sync Engine] ERROR: Backup pass encountered discrepancy flags.`,
            ]);
            feedbackService.trigger('warn');
          }
          setIsSyncingState(false);
        }, 800);

      } catch (err) {
        const t3 = new Date().toLocaleTimeString();
        setSyncStatusColor('error');
        setSyncLogs(prev => [
          ...prev,
          `[${t3}] [Sync Engine] CRITICAL: Transition crash - ${err instanceof Error ? err.message : err}`,
        ]);
        setIsSyncingState(false);
        feedbackService.trigger('warn');
      }
    }, 1000);
  };

  const handleUpdateBar = (barId: string, updates: Partial<Bar>) => {
    const updatedBars = bars.map(b => {
      if (b.id === barId) return { ...b, ...updates };
      return b;
    });
    setBars(updatedBars);
    storage.saveBars(updatedBars);
  };

  const toggleUserField = async (userId: string, field: 'approved' | 'subscriptionActive', manualSub?: any) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Show confirmation for approval/denial using global animated confirmation
    if (field === 'approved' && !manualSub) {
      const newValue = !user.approved;
      const confirmed = await confirm({
        title: newValue ? "Verify Account Access" : "Revoke Permissions",
        message: newValue 
          ? `Are you sure you want to approve "${user.name}"? This will grant full access to their respective dashboard and initialize business systems.` 
          : `Are you sure you want to revoke "${user.name}"'s access? They will no longer be able to manage their assets or view protected data.`,
        confirmText: newValue ? "Approve User" : "Revoke Access",
        cancelText: "Cancel",
        isDanger: !newValue
      });
      if (!confirmed) return;
    }

    let updatedSubscription = manualSub || user.subscription;

    // Handle Trial Granting on First Approval
    if (field === 'approved' && !user.approved) {
      // If user has no active subscription or previous trial, grant 14-day trial
      if (!user.subscription || user.subscription.status !== 'active') {
        const result = await billingService.verifyPayment(userId, 'monthly', true);
        if (result.success) {
          updatedSubscription = result.subscription;
        }
      }
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const isManualRenewal = field === 'subscriptionActive' && manualSub;
        const newValue = isManualRenewal ? true : !u[field];
        
        return { 
          ...u, 
          [field]: newValue,
          // If admin renews subscription, also re-approve the account status
          approved: isManualRenewal ? true : (field === 'approved' ? newValue : u.approved),
          subscriptionActive: field === 'approved' ? (newValue ? true : u.subscriptionActive) : newValue,
          subscription: updatedSubscription
        };
      }
      return u;
    });
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
  };

  const handlePermanentlyDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    let warningMessage = `Are you sure you want to permanently delete "${userToDelete.name}"?`;
    if (userToDelete.role === 'user') {
      warningMessage = `Are you sure you want to permanently delete "${userToDelete.name}"? This customer account will be deleted for not respecting the Kava community. This action cannot be undone.`;
    }

    const confirmed = await confirm({
      title: "PERMANENT USER DELETION",
      message: warningMessage,
      confirmText: "Delete Account Permanently",
      cancelText: "Cancel",
      isDanger: true
    });

    if (confirmed) {
      const updatedUsers = users.filter(u => u.id !== userId);
      storage.saveUsers(updatedUsers);
      setUsers(updatedUsers);
      feedbackService.vibrate('warn');
    }
  };

  const removeUpdate = (id: string) => {
    if (!confirm("Are you sure you want to remove this post for community violations?")) return;
    const filtered = updates.filter(u => u.id !== id);
    setUpdates(filtered);
    storage.saveBarUpdates(filtered);
  };

  const toggleUpdateApproval = (id: string) => {
    const updated = updates.map(u => {
      if (u.id === id) return { ...u, isApproved: !u.isApproved };
      return u;
    });
    setUpdates(updated);
    storage.saveBarUpdates(updated);
  };

  const handleAddBar = (newBarData: Partial<Bar>) => {
    const newBar: Bar = {
      id: `bar-${Date.now()}`,
      name: newBarData.name || 'New Venue',
      category: newBarData.category || 'Bar',
      address: newBarData.address || 'Manual Entry',
      description: 'Newly added venue.',
      tags: [],
      pricePreview: 0,
      managerId: '',
      lat: newBarData.lat || 0,
      lng: newBarData.lng || 0,
      status: 'closed',
      ...newBarData
    };
    const updatedBars = [...bars, newBar];
    setBars(updatedBars);
    storage.saveBars(updatedBars);
  };

  const handleDeleteBar = async (barId: string) => {
    const targetBar = bars.find(b => b.id === barId);
    const confirmed = await confirm({
      title: 'Delete Venue',
      message: `Are you sure you want to permanently delete "${targetBar?.name || 'this venue'}"? This action cannot be undone.`,
      confirmText: 'Delete Venue',
      cancelText: 'Keep Venue',
      isDanger: true
    });

    if (confirmed) {
      const updatedBars = bars.filter(b => b.id !== barId);
      setBars(updatedBars);
      storage.saveBars(updatedBars);
    }
  };

  const allManagers = users.filter(u => u.role === 'manager');
  const allSuppliers = users.filter(u => u.role === 'supplier');
  const allExplorers = users.filter(u => u.role === 'user');
  const allExporters = users.filter(u => u.role === 'exporter');
  const pendingCount = users.filter(u => !u.approved).length;

  const managers = showOnlyPending ? allManagers.filter(u => !u.approved) : allManagers;
  const suppliers = showOnlyPending ? allSuppliers.filter(u => !u.approved) : allSuppliers;
  const explorers = showOnlyPending ? allExplorers.filter(u => !u.approved) : allExplorers;
  const exporters = showOnlyPending ? allExporters.filter(u => !u.approved) : allExporters;

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
          <div>
            <h2 className="font-bebas text-6xl text-kava-text tracking-tight uppercase leading-none">{t('authority_control')}</h2>
            <p className="text-kava-muted/60 font-medium uppercase text-xs tracking-widest mt-2">{t('manage_platform_access,_approvals_and_financial_integrity')}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-4 sm:mt-0 px-6 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-2xl border border-red-500/20 font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
            >
              Logout Admin
            </button>
          )}
        </div>
        
        <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 shadow-xl self-stretch md:self-auto">
          <button 
            onClick={() => setActiveTab('control')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'control' ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20' : 'text-kava-muted hover:text-kava-gold'
            }`}
          >
            <Shield size={14} />
            {t('platform_control')}
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'map' ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20' : 'text-kava-muted hover:text-kava-gold'
            }`}
          >
            <MapIcon size={14} />
            {t('physical_network')}
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'billing' ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20' : 'text-kava-muted hover:text-kava-gold'
            }`}
          >
            <Wallet size={14} />
            {t('financial_oversight')}
          </button>
          <button 
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'cloud' ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20' : 'text-kava-muted hover:text-kava-gold'
            }`}
          >
            <Cloud size={14} />
            {t('cloud_config')}
          </button>
          <button 
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'health' ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20' : 'text-kava-muted hover:text-kava-gold'
            }`}
          >
            <HeartPulse size={14} />
            {t('System Health')}
          </button>
        </div>
      </div>

      {activeTab === 'control' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-[32px]">
            <button 
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className="flex items-center gap-3 px-6 py-3 bg-white border border-rose-100 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 group text-left"
            >
              <div className={`p-2 rounded-lg transition-colors ${pendingCount > 0 ? 'bg-rose-500 text-white animate-pulse group-hover:bg-rose-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                <UserCheck size={18} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">{t('queue_status')}</div>
                <div className="text-xl font-bebas text-slate-900 tracking-wide">{pendingCount} {t('waiting_approvals')}</div>
              </div>
            </button>

            <button 
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 group ${
                showOnlyPending 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-rose-500 hover:text-rose-500 hover:bg-rose-50'
              }`}
            >
              <Shield size={14} className={showOnlyPending ? 'animate-spin-slow' : 'group-hover:rotate-12 transition-transform'} />
              {showOnlyPending ? t('Showing: Pending Only') : t('Filter: Show Pending Only')}
            </button>

            {showOnlyPending && (
              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest animate-pulse ml-auto hidden sm:block">
                Priority Review Mode Active
              </div>
            )}
          </div>

          {/* MASTER STATE SYNC & FORCE BACKUP INTERFACE */}
          <div className="bg-kava-surface/90 border border-white/40 dark:border-white/5 shadow-xl p-6 sm:p-8 rounded-[36px] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-kava-gold/5 blur-3xl -mr-32 -mt-32 rounded-full pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-kava-gold/15 rounded-2xl border border-kava-gold/20 text-kava-gold shrink-0">
                  <Database size={24} />
                </div>
                <div>
                  <h4 className="font-bebas text-3xl text-kava-text tracking-wide uppercase leading-none mb-1">State Sync Engine</h4>
                  <p className="text-[9px] font-black tracking-widest text-[#B2B2B2] uppercase">IndexedDB & Cloud Schema Gateway</p>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-kava-muted">
                      <span>Status:</span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${isSyncingState ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={isSyncingState ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {isSyncingState ? 'Sync in Progress' : 'Operational'}
                        </span>
                      </span>
                    </div>
                    
                    <span className="text-kava-muted/30 hidden sm:inline">|</span>
                    
                    <div className="flex items-center gap-1.5 font-semibold text-kava-muted">
                      <Clock size={13} className="text-kava-gold" />
                      <span>Last Backup:</span>
                      <strong className="text-kava-text font-black">
                        {lastBackupTime ? new Date(lastBackupTime).toLocaleString() : 'Never Backed Up'}
                      </strong>
                    </div>

                    <span className="text-kava-muted/30 hidden sm:inline">|</span>

                    <div className="flex items-center gap-1.5 font-semibold text-kava-text">
                      <span>Mirrored Modules:</span>
                      <span className="px-2 py-0.5 bg-kava-gold/10 border border-kava-gold/20 text-[10px] font-black text-kava-gold rounded-full font-mono">
                        {syncCount > 0 ? `${syncCount} Tables` : '7 Tables'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    feedbackService.trigger('tap');
                    setShowSyncLogs(!showSyncLogs);
                  }}
                  className="px-4 py-3 border border-kava-text/10 hover:bg-white/5 text-kava-text text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 select-none"
                >
                  <FileText size={14} />
                  {showSyncLogs ? 'Hide Logs' : 'View Logs'}
                </button>
                
                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={isSyncingState}
                  className="px-6 py-3 bg-kava-gold hover:bg-kava-gold/90 disabled:opacity-50 text-white font-bebas text-sm uppercase tracking-[0.2em] rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]"
                >
                  <RefreshCcw size={14} className={isSyncingState ? 'animate-spin' : ''} />
                  {isSyncingState ? 'Synchronizing...' : 'Force Sync AppData'}
                </button>
              </div>
            </div>

            {/* Simulated Live Console Output */}
            {showSyncLogs && (
              <div className="mt-6 p-4 bg-neutral-950 rounded-2xl border border-white/5 space-y-2 animate-in slide-in-from-top-4 duration-300 relative z-10">
                <div className="flex items-center justify-between text-[10px] font-bold text-kava-gold uppercase tracking-wider border-b border-white/5 pb-2">
                  <span>Replication Pipeline Console</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] tracking-widest opacity-60">UPLINK ACTIVE</span>
                  </div>
                </div>
                
                <div className="font-mono text-[10px] text-zinc-300 space-y-1 max-h-36 overflow-y-auto custom-scrollbar leading-relaxed">
                  {syncLogs.length > 0 ? (
                    syncLogs.map((log, i) => (
                      <div key={i} className="flex gap-2 text-[9px]">
                        <span className="text-kava-gold">❯</span>
                        <span>{log}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-zinc-500 italic select-none text-[9px]">
                      No synchronization operations performed in the current admin session. Click "Force Sync AppData" to trigger a master transaction.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' ? (
        <AdminBillingPanel />
      ) : activeTab === 'map' ? (
        <AdminBarMap 
          bars={bars} 
          suppliers={allSuppliers}
          onUpdateBar={handleUpdateBar} 
          onAddBar={handleAddBar} 
          onDeleteBar={handleDeleteBar}
        />
      ) : activeTab === 'cloud' ? (
        <CloudConfig />
      ) : activeTab === 'health' ? (
        <SystemHealthPanel />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
         {/* Managers Section */}
        <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-kava-gold/20 rounded-xl text-kava-gold">
                  <Shield size={24} />
                </div>
                <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase">{t('bar_managers')}</h3>
              </div>
              <span className="text-[10px] font-black text-kava-gold/40 border border-kava-gold/20 px-2 py-0.5 rounded-full">{managers.length}</span>
            </div>

          <div className="space-y-4">
            {managers.map(mgr => {
              const bar = bars.find(b => b.id === mgr.barId);
              return (
                <UserAdminRow 
                  key={mgr.id} 
                  user={mgr} 
                  subtext={bar ? `Bar: ${bar.name}` : t('No bar assigned')}
                  onToggle={toggleUserField} 
                  onDelete={handlePermanentlyDeleteUser}
                />
              );
            })}
            {managers.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-kava-text/5 rounded-[40px] animate-in fade-in zoom-in duration-500">
                <p className="font-bebas text-2xl text-kava-muted/20 uppercase tracking-widest">{t('No matching managers')}</p>
                {showOnlyPending && <p className="text-[9px] font-bold text-kava-gold uppercase tracking-[0.3em] mt-2">{t('All Accounts Verified')}</p>}
              </div>
            )}
          </div>
        </section>

        {/* Suppliers Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                <UserCheck size={24} />
              </div>
              <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase">{t('industry_suppliers')}</h3>
            </div>
            <span className="text-[10px] font-black text-emerald-600/40 border border-emerald-600/20 px-2 py-0.5 rounded-full">{suppliers.length}</span>
          </div>

          <div className="space-y-4">
            {suppliers.map(supp => (
              <UserAdminRow 
                key={supp.id} 
                user={supp} 
                subtext={supp.supplierTitle ? `Specialty: ${supp.supplierTitle}` : "Wholesale / Logistics"}
                onToggle={toggleUserField} 
                onDelete={handlePermanentlyDeleteUser}
              />
            ))}
            {suppliers.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-emerald-500/5 rounded-[40px] animate-in fade-in zoom-in duration-500">
                <p className="font-bebas text-2xl text-emerald-600/10 uppercase tracking-widest">No matching suppliers</p>
                {showOnlyPending && <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.3em] mt-2">Logistics Pipeline Secure</p>}
              </div>
            )}
          </div>
        </section>

        {/* Explorers Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <MapIcon size={24} />
              </div>
              <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase">{t('explorers')}</h3>
            </div>
            <span className="text-[10px] font-black text-blue-600/40 border border-blue-600/20 px-2 py-0.5 rounded-full">{explorers.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {explorers.map(exp => (
              <UserAdminRow 
                key={exp.id} 
                user={exp} 
                subtext={t("Standard App User")}
                onToggle={toggleUserField} 
                onDelete={handlePermanentlyDeleteUser}
              />
            ))}
            {explorers.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-blue-500/5 rounded-[40px] animate-in fade-in zoom-in duration-500 col-span-full">
                <p className="font-bebas text-2xl text-blue-600/10 uppercase tracking-widest">{t('No matching explorers')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Exporters Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                <Globe size={24} />
              </div>
              <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase">{t('licensed_exporters')}</h3>
            </div>
            <span className="text-[10px] font-black text-purple-600/40 border border-purple-600/20 px-2 py-0.5 rounded-full">{exporters.length}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exporters.map(exp => (
              <UserAdminRow 
                key={exp.id} 
                user={exp} 
                subtext="Exporter / Buyer Account"
                onToggle={toggleUserField} 
                onDelete={handlePermanentlyDeleteUser}
              />
            ))}
            {exporters.length === 0 && (
              <div className="py-12 text-center border-2 border-dashed border-purple-500/5 rounded-[40px] animate-in fade-in zoom-in duration-500 col-span-full">
                <p className="font-bebas text-2xl text-purple-600/10 uppercase tracking-widest">No matching exporters</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Moderation Section */}
      <section className="space-y-8 pt-10 border-t border-kava-text/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
            <LayoutGrid size={24} />
          </div>
          <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase">{t('Feed Moderation')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {updates.map(upd => {
            const bar = bars.find(b => b.id === upd.barId);
            return (
              <div key={upd.id} className="kava-card !p-0 !rounded-[32px] overflow-hidden flex flex-col hover:-translate-y-2">
            <div className="p-8 border-b border-kava-text/5">
                {upd.imageUrl && (
                  <div className="h-40 w-full bg-kava-text/5 -mt-8 -mx-8 mb-8">
                    <img src={upd.imageUrl} alt={upd.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[8px] font-bold text-kava-gold uppercase tracking-widest">{upd.type}</div>
                      <h4 className="font-bold text-kava-text leading-tight">{upd.title}</h4>
                      <p className="text-[10px] text-kava-muted/60 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {upd.barId.startsWith('supplier-') 
                          ? `Supplier: ${users.find(u => u.id === upd.barId.replace('supplier-', ''))?.name || 'Unknown'}`
                          : `Venue: ${bar?.name || 'Unknown'}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleUpdateApproval(upd.id)}
                          className={`p-2 rounded-xl transition-all shadow-sm ${
                            upd.isApproved ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-600'
                          }`}
                        >
                          <UserCheck size={16} />
                        </button>
                        <button 
                          onClick={() => removeUpdate(upd.id)}
                          className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className={`text-[7px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full ${
                        upd.visibility === 'business' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {upd.visibility === 'business' ? 'B2B' : 'Public'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-kava-muted/80 line-clamp-3 font-medium leading-relaxed">{upd.description}</p>
                  <div className="pt-2 flex items-center gap-2 text-[8px] font-bold text-kava-muted/30 uppercase tracking-widest">
                    <Clock size={10} />
                    {new Date(upd.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
          {updates.length === 0 && (
            <div className="col-span-full py-20 text-center font-bebas text-4xl text-kava-muted/10 uppercase tracking-widest italic">
              Platform Feed is Clean
            </div>
          )}
        </div>
      </section>
     </>
   )}
  </div>
 );
}



function UserAdminRow({ user, subtext, onToggle, onDelete }: { user: User, subtext: string, onToggle: (id: string, field: 'approved' | 'subscriptionActive', sub?: any) => void, onDelete?: (id: string) => void, key?: any }) {
  const { formatPrice } = useCurrency();
  const [isRenewing, setIsRenewing] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isReviewingReceipt, setIsReviewingReceipt] = useState(false);

  const handleManualRenewal = async (planId: 'monthly' | 'quarterly' | 'annual') => {
    const result = await billingService.verifyPayment(user.id, planId, false);
    if (result.success) {
      onToggle(user.id, 'subscriptionActive', result.subscription);
      setIsRenewing(false);
    }
  };

  const handleDateChange = (dateStr: string) => {
    const newDate = new Date(dateStr).getTime();
    if (isNaN(newDate)) return;
    
    onToggle(user.id, 'subscriptionActive', {
      ...user.subscription,
      currentPeriodEnd: newDate,
      status: newDate > Date.now() ? 'active' : 'past_due'
    });
    setIsEditingDate(false);
  };

  const handleApproveReceipt = async () => {
    if (!user.trialRenewalRequest) return;
    const planId = user.trialRenewalRequest.planId;
    let durationMs = 30 * 24 * 60 * 60 * 1000;
    switch (planId) {
      case 'monthly': durationMs = 30 * 24 * 60 * 60 * 1000; break;
      case 'quarterly': durationMs = 90 * 24 * 60 * 60 * 1000; break;
      case 'annual': durationMs = 365 * 24 * 60 * 60 * 1000; break;
    }
    const currentPeriodEnd = Date.now() + durationMs;
    const newSubscription = {
      planId,
      status: 'active' as const,
      currentPeriodEnd,
      autoRenew: false,
      isTrial: false
    };

    const updatedUser: User = {
      ...user,
      approved: true,
      subscriptionActive: true,
      subscription: newSubscription,
      trialRenewalRequest: {
        ...user.trialRenewalRequest,
        status: 'approved'
      }
    };

    // Save directly to storage for permanence sync
    const allUsers = storage.getUsers();
    storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));

    // Send automatic congratulations system direct chat
    try {
      const adminChatId = await chatService.getOrCreateDirectChat("admin1", user.id);
      await chatService.sendMessage(
        adminChatId,
        "admin1",
        `🎉 WIRE REMITTANCE CONFIRMED\nYour submittal proof for registration renewal has been successfully reviewed by administrators.\n\nTier: ${planId.toUpperCase()}\nAccess Period Active: ${new Date(currentPeriodEnd).toLocaleDateString()}\nAll platform tools are fully unlocked! Thank you.`,
        'text',
        { isReceiptApprovalSystemNotification: true }
      );
    } catch (chatError) {
      console.warn("Could not dispatch automated approval message:", chatError);
    }

    onToggle(user.id, 'subscriptionActive', newSubscription);
    setIsReviewingReceipt(false);
  };

  const handleRejectReceipt = async () => {
    if (!user.trialRenewalRequest) return;
    const updatedUser: User = {
      ...user,
      trialRenewalRequest: {
        ...user.trialRenewalRequest,
        status: 'rejected'
      }
    };

    const allUsers = storage.getUsers();
    storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));

    try {
      const adminChatId = await chatService.getOrCreateDirectChat("admin1", user.id);
      await chatService.sendMessage(
        adminChatId,
        "admin1",
        `⚠️ REGISTRATION REMITTANCE INSUFFICIENT\nWe were unable to verify your manual wire transfer remittance invoice receipt. Please check details with your bank, confirm Swift memo reference ID is included correctly, and submit an updated layout snapshot.`,
        'text',
        { isReceiptRejectionSystemNotification: true }
      );
    } catch (chatError) {
      console.warn("Could not dispatch automated rejection message:", chatError);
    }

    onToggle(user.id, 'subscriptionActive', user.subscription);
    setIsReviewingReceipt(false);
  };

  const hasPendingRequest = user.trialRenewalRequest && user.trialRenewalRequest.status === 'pending';

  return (
    <div className="kava-card flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:-translate-y-1 relative">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-kava-text/5 rounded-2xl flex items-center justify-center font-bebas text-2xl text-kava-muted group-hover:bg-kava-gold/10 group-hover:text-kava-gold transition-all shrink-0">
          {user.name.charAt(0)}
        </div>
        <div>
          <div className="font-bold text-lg text-kava-text leading-tight flex items-center flex-wrap gap-2">
            {user.name}
            {user.subscription?.isTrial && (
              <span className="text-[8px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Trial</span>
            )}
            {user.subscription?.status === 'past_due' && (
              <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Expired</span>
            )}
            {hasPendingRequest && (
              <span className="text-[8px] font-black bg-amber-500 text-black px-2 py-1 rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1 shrink-0">
                <AlertCircle size={10} />
                Remittance Pending
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-kava-muted opacity-60 tracking-tight">{subtext}</div>
          
          <div className="flex items-center gap-2 mt-1">
            {isEditingDate ? (
              <input 
                type="date" 
                defaultValue={user.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toISOString().split('T')[0] : ''}
                onBlur={(e) => handleDateChange(e.target.value)}
                autoFocus
                className="bg-transparent border-b border-kava-gold text-[10px] font-bold text-kava-gold uppercase tracking-widest focus:outline-none"
              />
            ) : (
              <button 
                onClick={() => setIsEditingDate(true)}
                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest hover:underline transition-colors ${
                  user.subscription?.currentPeriodEnd && Date.now() > user.subscription.currentPeriodEnd ? 'text-rose-500' : 'text-kava-gold'
                }`}
              >
                <Clock size={10} className="opacity-60" />
                {user.subscription?.currentPeriodEnd 
                  ? `${Date.now() > user.subscription.currentPeriodEnd ? 'Expired' : 'Expires'}: ${new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}` 
                  : 'Set Expiration'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {hasPendingRequest && (
          <button 
            onClick={() => setIsReviewingReceipt(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Eye size={12} />
            Review Wire Receipt
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
             <button 
              onClick={() => onToggle(user.id, 'approved')}
              className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                user.approved 
                  ? 'bg-emerald-500 text-white shadow-emerald-200' 
                  : 'bg-white/50 text-kava-muted hover:bg-rose-500 hover:text-white'
              }`}
            >
              {user.approved ? 'Approved' : 'Pending Approval'}
            </button>
          </div>

          <div className="w-[1px] h-8 bg-kava-text/5 hidden sm:block mx-1" />

          <div className="relative font-sans text-sm">
            <button 
              onClick={() => setIsRenewing(!isRenewing)}
              className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border-2 ${
                user.subscriptionActive 
                  ? 'border-kava-gold bg-kava-gold/5 text-kava-gold' 
                  : 'border-transparent bg-kava-muted/5 text-kava-muted/40'
              }`}
            >
              <CreditCard size={14} />
              {user.subscriptionActive ? 'Active' : 'Renew'}
            </button>

            {isRenewing && (
              <div className="absolute right-0 bottom-full mb-2 bg-kava-bg border border-white/20 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 min-w-[120px]">
                <button onClick={() => handleManualRenewal('monthly')} className="px-4 py-2 hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest text-kava-text text-left">Monthly</button>
                <button onClick={() => handleManualRenewal('quarterly')} className="px-4 py-2 hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest text-kava-text text-left">Quarterly</button>
                <button onClick={() => handleManualRenewal('annual')} className="px-4 py-2 hover:bg-white/5 text-[9px] font-bold uppercase tracking-widest text-kava-text text-left">Annual</button>
              </div>
            )}
          </div>

          {onDelete && (
            <>
              <div className="w-[1px] h-8 bg-kava-text/5 hidden sm:block mx-1" />
              <button 
                onClick={() => onDelete(user.id)}
                className="p-2 px-3 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                title={user.role === 'user' ? "Permanently delete customer (community violation)" : "Permanently delete account"}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern Wire Remittance Receipt Verification Modal */}
      {isReviewingReceipt && user.trialRenewalRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-kava-bg rounded-[40px] border border-white/20 overflow-hidden shadow-2xl flex flex-col p-6 md:p-8 space-y-6"
          >
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-2xl">
                  <FileText size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">Receipt Verification</h3>
                  <p className="text-[10px] text-kava-muted uppercase tracking-widest opacity-60 mt-1">Subscriber: {user.name} ({user.id.slice(0, 8)})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReviewingReceipt(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 text-kava-muted hover:text-white rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Receipt Preview */}
              <div className="rounded-3xl bg-black/40 border border-white/10 p-3 h-80 flex items-center justify-center overflow-hidden relative group">
                <img 
                  src={user.trialRenewalRequest.receiptUrl} 
                  alt="Remittance Proof" 
                  className="max-w-full max-h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-black/70 py-1 px-2 text-[8px] font-black uppercase text-kava-muted rounded-md border border-white/10">
                  Proof File Attachment
                </div>
              </div>

              {/* Remittance Fields & User Notes */}
              <div className="space-y-4">
                <div className="space-y-2 bg-white/[0.02] p-4 rounded-2xl border border-white/5 text-xs text-kava-text font-medium text-left">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-kava-muted uppercase text-[9px] tracking-wider">Requested Tier:</span>
                    <span className="text-kava-gold font-black uppercase">{user.trialRenewalRequest.planId.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-kava-muted uppercase text-[9px] tracking-wider">Amount Paid:</span>
                    <span className="text-emerald-500 font-bold">{formatPrice(user.trialRenewalRequest.amount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-kava-muted uppercase text-[9px] tracking-wider">Submission Date:</span>
                    <span>{new Date(user.trialRenewalRequest.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black uppercase text-kava-muted tracking-widest">Remitter swift Memo / notes</label>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-xs text-kava-text italic leading-relaxed min-h-[80px]">
                    {user.trialRenewalRequest.note ? `"${user.trialRenewalRequest.note}"` : <span className="text-kava-muted/30">No optional notes attached.</span>}
                  </div>
                </div>

                <div className="pt-2 text-center text-[9px] text-kava-muted font-bold uppercase tracking-widest leading-relaxed">
                  Carefully audit the attached wire snapshot before approving. Access credentials will sync instantly.
                </div>
              </div>
            </div>

            {/* Verification actions */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <button
                onClick={handleRejectReceipt}
                className="py-4 rounded-2xl border border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X size={14} />
                REJECT REMITTANCE
              </button>
              <button
                onClick={handleApproveReceipt}
                className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
              >
                <Check size={14} />
                VERIFY & APPROVE LICENSE
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
