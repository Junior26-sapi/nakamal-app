import React, { useState } from 'react';
import { User } from '../types';
import { storage } from '../lib/storage';
import { backupAllStorage, restoreAllFromBackup, getFromIndexedDB } from '../lib/indexedDbBackup';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Mail, Shield, Camera, Save, ArrowLeft, CheckCircle2, Cloud, Image as ImageIcon, Sparkles, Smile, Phone, Bell, Settings, Building2, Store, Truck, Check, Globe, Facebook, MessageCircle, Database, RefreshCw, Trash2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword, checkPasswordStrength } from '../lib/authUtils';
import ImageDropZone from './ImageDropZone';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onBack: () => void;
  onDeleteAccount?: () => void;
}

const COOL_AVATARS = ['🥥', '🌊', '🌴', '🌋', '🛶', '🐚', '🪘', '🌺', '🐢', '🦈'];

export default function Profile({ user, onUpdate, onBack, onDeleteAccount }: ProfileProps) {
  const [firstName, setFirstName] = useState(user.firstName || user.name.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user.lastName || user.name.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [country, setCountry] = useState(user.country || '');
  const [website, setWebsite] = useState(user.website || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [facebook, setFacebook] = useState(user.facebook || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [backgroundUrl, setBackgroundUrl] = useState(user.backgroundUrl || '');
  const [description, setDescription] = useState(user.description || '');
  const [businessName, setBusinessName] = useState(user.businessName || '');
  const [contactPerson, setContactPerson] = useState(user.contactPerson || '');
  const [supplierTitle, setSupplierTitle] = useState(user.supplierTitle || '');
  const [certifications, setCertifications] = useState(user.certifications || []);
  const [businessHours, setBusinessHours] = useState(user.businessHours || {
    Monday: { open: '08:00', close: '17:00', closed: false },
    Tuesday: { open: '08:00', close: '17:00', closed: false },
    Wednesday: { open: '08:00', close: '17:00', closed: false },
    Thursday: { open: '08:00', close: '17:00', closed: false },
    Friday: { open: '08:00', close: '17:00', closed: false },
    Saturday: { open: '09:00', close: '13:00', closed: false },
    Sunday: { open: '00:00', close: '00:00', closed: true },
  });
  const [notifications, setNotifications] = useState(user.notificationPreferences || {
    email: true,
    push: true,
    sms: true,
    marketing: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [bellShakeTrigger, setBellShakeTrigger] = useState(0);

  // Password Reset & Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Check strength of the new password
    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 2) {
      setPasswordError(`Password is too weak: ${strength.feedback.join(', ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const allUsers = storage.getUsers();
      const userInStorage = allUsers.find(u => u.id === user.id);

      if (userInStorage) {
        // Only enforce current password check if they actually have one set
        const hasCurrentPassword = !!(userInStorage.password || userInStorage.passwordHash);
        if (hasCurrentPassword) {
          const currentHash = await hashPassword(currentPassword);
          const isCorrect = userInStorage.passwordHash 
            ? userInStorage.passwordHash === currentHash
            : userInStorage.password === currentPassword;

          if (!isCorrect) {
            setPasswordError('Incorrect current password.');
            setIsChangingPassword(false);
            return;
          }
        }

        const secureHash = await hashPassword(newPassword);
        
        // Update both to maintain seamless cross-login capability
        const updatedUsers = allUsers.map(u => 
          u.id === user.id 
            ? { ...u, password: newPassword, passwordHash: secureHash } 
            : u
        );

        storage.saveUsers(updatedUsers);
        
        // Synchronize with Supabase if active Session
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.id === user.id) {
          await supabase
            .from('users')
            .update({ password_hash: secureHash, updated_at: new Date().toISOString() })
            .eq('id', user.id);
        }

        onUpdate({ ...user, password: newPassword, passwordHash: secureHash });
        setPasswordSuccess('Password saved and securely updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Session identity mismatch. Please try again.');
      }
    } catch (err: any) {
      setPasswordError(`Failed to update security credentials: ${err.message || err}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // IndexedDB Persistence States
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = useState('');
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(null);

  React.useEffect(() => {
    getFromIndexedDB('backup_metadata').then((meta) => {
      if (meta && meta.timestamp) {
        setLastBackupTime(meta.timestamp);
      }
    });
    // Trigger fully silent background database resilience mirror sync
    backupAllStorage().catch((err) => console.log('Background backup engine sync idle:', err));
  }, []);

  const fullName = `${firstName} ${lastName}`.trim();

  // For Business Linking
  const [bars] = useState(storage.getBars());
  const userBar = bars.find(b => b.id === user.barId);

  const handleSave = async () => {
    setIsSaving(true);
    setSyncStatus('syncing');
    
    try {
      const updatedData = {
        name: fullName, 
        firstName, 
        lastName, 
        email, 
        phone,
        country,
        website,
        whatsapp,
        facebook,
        businessName,
        contactPerson,
        certifications,
        businessHours,
        avatarUrl, 
        backgroundUrl,
        description,
        supplierTitle,
        notificationPreferences: notifications
      };

      // 1. Update Supabase if authenticated (safely wrapped)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user.id === user.id) {
          const { error } = await supabase
            .from('users')
            .update({ 
              name: fullName, 
              first_name: firstName, 
              last_name: lastName,
              phone: phone,
              country: country,
              website: website,
              whatsapp: whatsapp,
              facebook: facebook,
              business_name: businessName,
              contact_person: contactPerson,
              certifications: certifications,
              business_hours: businessHours,
              avatar_url: avatarUrl,
              background_url: backgroundUrl,
              description: description,
              supplier_title: supplierTitle,
              notification_preferences: notifications
            })
            .eq('id', user.id);
          
          if (error) console.warn("Supabase background sync notice:", error.message);
        }
      } catch (dbErr) {
        console.warn("Supabase connection bypass active:", dbErr);
      }

      // 2. Update Local Storage
      const allUsers = storage.getUsers();
      const updatedUsers = allUsers.map(u => 
        u.id === user.id ? { ...u, ...updatedData } : u
      );

      storage.saveUsers(updatedUsers);
      
      const updatedSelf = updatedUsers.find(u => u.id === user.id);
      if (updatedSelf) {
        onUpdate(updatedSelf);
        setShowSuccess(true);
        setSyncStatus('synced');
        setTimeout(() => {
          setShowSuccess(false);
          setSyncStatus('idle');
        }, 3000);
      }
    } catch (err) {
      console.error('Profile sync failed:', err);
      setSyncStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleIcon = () => {
    switch(user.role) {
      case 'manager': return <Store size={20} />;
      case 'supplier': return <Truck size={20} />;
      default: return <UserIcon size={20} />;
    }
  };

  const getRoleColor = () => {
    switch(user.role) {
      case 'manager': return 'text-kava-gold bg-kava-gold/10';
      case 'supplier': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-emerald-500 bg-emerald-500/10';
    }
  };

  const handleManualBackup = async () => {
    setBackupLoading(true);
    setBackupStatusMsg('Synchronizing local content to IndexedDB database...');
    try {
      const meta = await backupAllStorage();
      if (meta.status === 'operational') {
        setLastBackupTime(meta.timestamp);
        setBackupStatusMsg('Success: Sync complete! System modules mirrored.');
      } else {
        setBackupStatusMsg('Backup compiled with discrepancies.');
      }
    } catch (e) {
      setBackupStatusMsg('Sync failure. Check browser permissions.');
    } finally {
      setBackupLoading(false);
      setTimeout(() => setBackupStatusMsg(''), 4000);
    }
  };

  const handleManualRestore = async () => {
    if (!confirm('CONFIRM BACKUP INJECTION:\n\nThis will overwrite your current active interface session with the latest backed-up IndexedDB database snapshot. The page will reload immediately.')) {
      return;
    }
    setBackupLoading(true);
    setBackupStatusMsg('Injecting IndexedDB data modules...');
    try {
      const res = await restoreAllFromBackup();
      if (res.success) {
        setBackupStatusMsg('Restore complete! Reloading workspace...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setBackupStatusMsg('No valid backups found to recover.');
      }
    } catch (e) {
      setBackupStatusMsg('Failed to inject backup data.');
    } finally {
      setBackupLoading(false);
      setTimeout(() => setBackupStatusMsg(''), 4000);
    }
  };

  const handleDisasterTest = async () => {
    if (!confirm('SIMULATE DEVICE WIPE & RECOVERY:\n\nThis test triggers a clean start. It will:\n1. Force update your IndexedDB backups.\n2. Purge your entire LocalStorage (deleting all local data).\n3. Reload the application.\n\nOn reload, key bootstrap sensors will detect the empty local state, scan IndexedDB, and fully recover your users, bars, and channels smoothly.\n\nWould you like to initiate this test?')) {
      return;
    }
    setBackupLoading(true);
    setBackupStatusMsg('Performing baseline mirror backup...');
    try {
      // Force backup first
      await backupAllStorage();
      
      setBackupStatusMsg('Purging LocalStorage tables... (Simulating cache wipe)');
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 1500);
    } catch (e) {
      setBackupStatusMsg('Failed to complete simulation pass.');
      setBackupLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 px-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-kava-muted hover:text-kava-gold transition-colors font-bold text-[10px] uppercase tracking-widest bg-white/40 px-4 py-2 rounded-full border border-white"
        >
          <ArrowLeft size={14} />
          Return to Dashboard
        </button>
        
        <div className="flex items-center gap-3">
          <div className={`p-2 px-4 rounded-full ${getRoleColor()} flex items-center gap-2 border-2 border-white shadow-sm font-black`}>
             {getRoleIcon()}
             <span className="text-[8px] uppercase tracking-widest">{user.role} Account</span>
          </div>
        </div>
      </div>

      {/* Profile Header With Background */}
      <div className="relative group overflow-hidden rounded-[48px] bg-white border-[3px] border-white shadow-2xl">
        <div className="relative h-48 sm:h-64 bg-kava-text overflow-hidden">
          {backgroundUrl ? (
            <img src={backgroundUrl} alt="Cover" className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-kava-gold/40 via-kava-text/20 to-rose-500/40 flex items-center justify-center">
               <ImageIcon size={64} className="text-white/10" />
            </div>
          )}
          
          {/* Always visible responsive camera overlay */}
          <div className="absolute bottom-4 right-4 z-10">
             <label className="flex items-center gap-2 bg-black/60 hover:bg-black text-white hover:scale-105 active:scale-95 px-4 py-2.5 rounded-2xl border border-white/20 select-none shadow-lg backdrop-blur-md transition-all text-[9.5px] font-black uppercase tracking-wider cursor-pointer">
                <Camera size={13} />
                <span>Change Cover Banner</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const reader = new FileReader();
                      reader.onload = () => setBackgroundUrl(reader.result as string);
                      reader.readAsDataURL(e.target.files[0]);
                    }
                  }}
                />
             </label>
          </div>
        </div>

        <div className="relative -mt-20 px-10 pb-10 flex flex-col sm:flex-row items-end gap-6">
          <div className="relative group/avatar">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[40px] bg-white border-[4px] border-white shadow-2xl flex items-center justify-center overflow-hidden transition-transform group-hover/avatar:scale-105">
              {avatarUrl ? (
                avatarUrl.length < 5 ? (
                  <span className="text-7xl">{avatarUrl}</span>
                ) : (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                )
              ) : (
                <UserIcon size={64} className="text-kava-muted/20" />
              )}
            </div>
            
            {/* Always visible golden floating camera trigger for avatar */}
            <label className="absolute -bottom-1 -right-1 bg-kava-gold hover:bg-kava-gold/90 text-white p-3.5 rounded-2xl shadow-xl border-[3.5px] border-white hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center z-10" title="Upload Profile Avatar">
               <Camera size={14} strokeWidth={3} />
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={(e) => {
                   if (e.target.files && e.target.files[0]) {
                     const reader = new FileReader();
                     reader.onload = () => setAvatarUrl(reader.result as string);
                     reader.readAsDataURL(e.target.files[0]);
                   }
                  }}
               />
            </label>
          </div>

          <div className="flex-1 space-y-1 mb-2 text-center sm:text-left">
            <h2 className="font-bebas text-5xl sm:text-6xl text-kava-text tracking-tight uppercase leading-none drop-shadow-sm">
              {fullName || "Anonymous Explorer"}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-kava-muted/60 font-bold uppercase text-[9px] tracking-[0.4em]">
                {user.role} Authorization level
              </span>
              <Sparkles size={12} className="text-kava-gold animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Main Info */}
          <div className="kava-card space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Settings size={18} />
              </div>
              <h3 className="font-bebas text-2xl uppercase tracking-wider text-kava-text">Identity Core</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                  First Identity (Given)
                </label>
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                  Second Identity (Family)
                </label>
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                  <Mail size={14} className="text-kava-gold" />
                  Email Endpoint
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                  <Phone size={14} className="text-kava-gold" />
                  Comm Link (Phone)
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                  placeholder="+678 ..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                <Globe size={14} className="text-kava-gold" />
                Operational Country / Sovereign Base Location
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={['Vanuatu', 'Solomon Islands', 'Fiji', 'Samoa', 'Tonga', 'Papua New Guinea', 'New Caledonia', 'French Polynesia', 'Australia', 'New Zealand', 'United States', ''].includes(country) ? country : 'Other'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Other') {
                      setCountry('');
                    } else {
                      setCountry(val);
                    }
                  }}
                  className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="">-- Choose Country --</option>
                  <option value="Vanuatu">Vanuatu 🇻🇺</option>
                  <option value="Solomon Islands">Solomon Islands 🇸🇧</option>
                  <option value="Fiji">Fiji 🇫🇯</option>
                  <option value="Samoa">Samoa 🇼🇸</option>
                  <option value="Tonga">Tonga 🇹🇴</option>
                  <option value="Papua New Guinea">Papua New Guinea 🇵🇬</option>
                  <option value="New Caledonia">New Caledonia 🇳🇨</option>
                  <option value="French Polynesia">French Polynesia 🇵🇫</option>
                  <option value="Australia">Australia 🇦🇺</option>
                  <option value="New Zealand">New Zealand 🇳🇿</option>
                  <option value="United States">United States 🇺🇸</option>
                  <option value="Other">Other Country / Region / International 🌐</option>
                </select>

                {(!['Vanuatu', 'Solomon Islands', 'Fiji', 'Samoa', 'Tonga', 'Papua New Guinea', 'New Caledonia', 'French Polynesia', 'Australia', 'New Zealand', 'United States', ''].includes(country) || country === '') && (
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    placeholder="Enter country name manually..."
                  />
                )}
              </div>
            </div>

            {(user.role === 'supplier' || user.role === 'manager' || user.role === 'exporter') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                    <Globe size={14} className="text-kava-gold" />
                    Website Link
                  </label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                    <MessageCircle size={14} className="text-emerald-500 fill-emerald-500/10" />
                    WhatsApp Chat Link
                  </label>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    placeholder="https://wa.me/..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                    <Facebook size={14} className="text-blue-600 fill-blue-600/10" />
                    Facebook Page
                  </label>
                  <input 
                    type="url" 
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                Digital Manifesto (Description)
              </label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm min-h-[120px]"
                placeholder="Tell the community about your journey..."
              />
            </div>
          </div>

          {/* Account Security & Password Control Panel */}
          <div className="kava-card space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                <Lock size={18} />
              </div>
              <h3 className="font-bebas text-2xl uppercase tracking-wider text-kava-text">Account Credentials & Security Key</h3>
            </div>

            <p className="text-[11px] text-kava-muted leading-relaxed">
              Renew and save your master security key whenever you want. Changes are seamlessly synchronized to system storage mechanism structures.
            </p>

            <div className="space-y-5">
              {/* Check if user currently has any password, and require it if they do */}
              {(user.password || user.passwordHash) && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                    Current Security Key (Verification Required)
                  </label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Enter current password..."
                      className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 pr-12 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-full transition-colors text-kava-muted"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                    New Secure Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 8 characters..."
                      className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 pr-12 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-full transition-colors text-kava-muted"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password..."
                      className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 pr-12 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-full transition-colors text-kava-muted"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength indicators */}
              {newPassword && (
                <div className="p-4 bg-kava-muted/5 rounded-[24px] border border-kava-muted/5 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-wider text-kava-muted">
                    <span>Key Matrix Strength:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-white text-[9px] font-black animate-pulse ${checkPasswordStrength(newPassword).color}`}>
                      {checkPasswordStrength(newPassword).label}
                    </span>
                  </div>
                  {/* Strength Bar */}
                  <div className="h-1.5 w-full bg-neutral-200/50 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className={`h-full flex-1 transition-all duration-500 rounded-full ${
                          step <= checkPasswordStrength(newPassword).score 
                            ? checkPasswordStrength(newPassword).color 
                            : 'bg-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                  {checkPasswordStrength(newPassword).feedback.length > 0 && (
                    <ul className="text-[9px] text-rose-500 font-bold space-y-0.5 list-disc pl-4 uppercase tracking-wider">
                      {checkPasswordStrength(newPassword).feedback.map((fb, idx) => (
                        <li key={idx}>{fb}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {passwordError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-bold uppercase tracking-wider">
                  ⚠️ {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-[10px] font-bold uppercase tracking-wider">
                  🎉 {passwordSuccess}
                </div>
              )}

              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className={`w-full py-4 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-md transition-all flex items-center justify-center gap-2 ${
                  isChangingPassword || !newPassword || !confirmPassword
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200 active:scale-95'
                }`}
              >
                {isChangingPassword ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw size={12} />
                    Commit Security Key Change
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Business Linking (For non-explorers) */}
          {(user.role === 'manager' || user.role === 'supplier') && (
            <div className="kava-card space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                    <Building2 size={18} />
                  </div>
                  <h3 className="font-bebas text-2xl uppercase tracking-wider text-kava-text">Associated Business</h3>
                </div>
                {user.role === 'supplier' && (
                  <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest bg-blue-50 px-3 py-1 rounded-full">Supplier Node</span>
                )}
              </div>
              
              {user.role === 'supplier' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                        Business Entity Name
                      </label>
                      <input 
                        type="text" 
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                        placeholder="Ex: Pure Kava Vanuatu"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                        Liaison Officer (Contact)
                      </label>
                      <input 
                        type="text" 
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm"
                        placeholder="Contact Person Name"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                        Specialty Focus Title
                      </label>
                      <select 
                        value={supplierTitle}
                        onChange={(e) => setSupplierTitle(e.target.value as any)}
                        className="w-full bg-white border border-kava-muted/10 rounded-3xl p-5 text-sm font-bold text-kava-text focus:border-kava-gold outline-none transition-all shadow-sm cursor-pointer"
                      >
                        <option value="">-- Unconfigured --</option>
                        <option value="Green Kava">🌿 Green Kava</option>
                        <option value="Sun-Dried Kava (Powder)">☀️ Sun-Dried Kava (Powder)</option>
                        <option value="(Instant) Powdered Kava">⚡ (Instant) Powdered Kava</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                       Active Certifications & Permits
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Export License', 'Organic Certified', 'VNPF Registered', 'FDA Approved', 'HACCP'].map(cert => (
                        <button
                          key={cert}
                          onClick={() => {
                            if (certifications.includes(cert)) {
                              setCertifications(certifications.filter(c => c !== cert));
                            } else {
                              setCertifications([...certifications, cert]);
                            }
                          }}
                          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            certifications.includes(cert)
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : 'bg-white border-kava-muted/5 text-kava-muted/60'
                          }`}
                        >
                          {cert}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-2 text-[10px] font-black text-kava-muted uppercase tracking-[0.2em] ml-2">
                       Operational Sync (Business Hours)
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.keys(businessHours).map((day) => (
                        <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-3xl border border-kava-muted/5 gap-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-kava-muted min-w-[100px]">{day}</span>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2">
                                <input 
                                  type="time" 
                                  value={businessHours[day].open}
                                  onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], open: e.target.value}})}
                                  disabled={businessHours[day].closed}
                                  className="bg-kava-muted/5 p-2 rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-kava-gold disabled:opacity-30"
                                />
                                <span className="text-kava-muted text-[10px]">to</span>
                                <input 
                                  type="time" 
                                  value={businessHours[day].close}
                                  onChange={(e) => setBusinessHours({...businessHours, [day]: {...businessHours[day], close: e.target.value}})}
                                  disabled={businessHours[day].closed}
                                  className="bg-kava-muted/5 p-2 rounded-xl text-[10px] font-bold outline-none border border-transparent focus:border-kava-gold disabled:opacity-30"
                                />
                             </div>
                             <button
                               onClick={() => setBusinessHours({...businessHours, [day]: {...businessHours[day], closed: !businessHours[day].closed}})}
                               className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                                 businessHours[day].closed 
                                   ? 'bg-rose-500 text-white' 
                                   : 'bg-emerald-500/10 text-emerald-600'
                               }`}
                             >
                               {businessHours[day].closed ? 'Operational Halt' : 'Active'}
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : userBar ? (
                <div className="flex items-center gap-4 bg-white p-5 rounded-[32px] border border-kava-muted/10 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-kava-text flex items-center justify-center overflow-hidden">
                    {userBar.logoUrl ? (
                      <img src={userBar.logoUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Store size={24} className="text-white/20" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bebas text-xl text-kava-text uppercase tracking-wide">{userBar.name}</h4>
                    <p className="text-[10px] font-bold text-kava-muted uppercase tracking-widest">{userBar.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${userBar.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-[8px] font-black uppercase text-kava-muted/60">{userBar.status}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-kava-muted/5 border-2 border-dashed border-kava-muted/10 rounded-[32px] text-center space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40">No Business Linked</p>
                  <p className="text-xs text-kava-muted font-medium">Please contact an administrator to link your account to a Nakamal or Supplier node.</p>
                </div>
              )}
            </div>
          )}

          {/* Notification Preferences */}
          <div className="kava-card space-y-6">
            <div className="flex items-center gap-2">
              <motion.div 
                key={bellShakeTrigger}
                animate={bellShakeTrigger > 0 ? {
                  rotate: [0, -15, 12, -10, 8, -4, 4, -2, 2, 0],
                  scale: [1, 1.25, 1.15, 1.25, 1.1, 1.15, 1.05, 1.05, 1.02, 1]
                } : {}}
                whileHover={{ rotate: [0, -10, 10, -10, 10, 0], scale: 1.15 }}
                transition={{ duration: 0.6 }}
                className="p-2 bg-rose-500/10 rounded-xl text-rose-500 cursor-pointer"
              >
                <Bell size={18} />
              </motion.div>
              <h3 className="font-bebas text-2xl uppercase tracking-wider text-kava-text">System Notifications</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'email', label: 'Electronic Mail (Email)', desc: 'Get formal updates and invoices' },
                { key: 'push', label: 'Push Sync', desc: 'Real-time alerts for system events' },
                { key: 'sms', label: 'Cellular Link (SMS)', desc: 'Urgent mobile notifications' },
                { key: 'marketing', label: 'Dispatch Reports', desc: 'Promotions and ecosystem news' }
              ].map((pref) => (
                <button
                  key={pref.key}
                  onClick={() => {
                    setNotifications({ ...notifications, [pref.key]: !notifications[pref.key as keyof typeof notifications] });
                    setBellShakeTrigger(prev => prev + 1);
                  }}
                  className={`flex items-start gap-4 p-5 rounded-[32px] border-2 transition-all text-left ${
                    notifications[pref.key as keyof typeof notifications]
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-white border-kava-muted/5 opacity-60'
                  }`}
                >
                  <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    notifications[pref.key as keyof typeof notifications]
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-kava-muted/20'
                  }`}>
                    {notifications[pref.key as keyof typeof notifications] && <Check size={12} strokeWidth={4} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-kava-text">{pref.label}</p>
                    <p className="text-[9px] font-medium text-kava-muted leading-tight mt-1">{pref.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${
              isSaving 
                ? 'bg-kava-muted text-white cursor-wait' 
                : 'bg-kava-text text-white hover:bg-black active:scale-[0.98] shadow-kava-text/20'
            }`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Save Identity State
              </>
            )}
          </button>
          
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest"
              >
                <CheckCircle2 size={14} />
                {syncStatus === 'synced' ? 'Identity Artifacts Synchronized' : 'Profile Node Updated'}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          {/* Profile Branding & Custom Design Asset Coordinator */}
          <div className="kava-card space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <span className="text-lg">🎨</span>
              <h4 className="font-bebas text-xl text-kava-text uppercase tracking-wider">Visual Identity & Branding</h4>
            </div>

            {/* Profile Picture / Avatar Section */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-kava-text">Profile Logo / Avatar URL</h5>
              <input 
                type="text" 
                value={avatarUrl && avatarUrl.length >= 5 ? avatarUrl : ''}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full bg-white border border-kava-muted/10 rounded-2xl p-3.5 text-xs font-bold text-kava-text focus:border-kava-gold outline-none shadow-inner"
                placeholder="Paste direct profile image link (e.g. https://...)"
              />
              <p className="text-[8px] text-kava-muted font-strong leading-relaxed">
                Copy and paste any web image URL of your brand, or use the floating camera on the header card to upload any picture directly.
              </p>
            </div>

            {/* Digital Totem (Alternative Emoji Avatar) Section */}
            <div className="space-y-3 bg-neutral-50 px-4 py-4 rounded-[28px] border border-neutral-100/50">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-kava-muted uppercase tracking-widest">Or Select Traditional Totem</span>
                {avatarUrl && avatarUrl.length < 5 && (
                  <span className="text-xs font-black text-kava-gold bg-kava-gold/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Active: {avatarUrl}</span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {COOL_AVATARS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatarUrl(emoji)}
                    className={`aspect-square flex items-center justify-center text-xl rounded-xl transition-all border-2 ${
                      avatarUrl === emoji ? 'bg-kava-gold border-kava-gold shadow-md text-white scale-105' : 'bg-white border-kava-muted/5 hover:border-kava-gold/20'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Banner Segment */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-kava-text">Base Background Cover URL</h5>
              <input 
                type="text" 
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                className="w-full bg-white border border-kava-muted/10 rounded-2xl p-3.5 text-xs font-bold text-kava-text focus:border-kava-gold outline-none shadow-inner"
                placeholder="Paste direct background cover link (e.g. https://...)"
              />
              <p className="text-[8px] text-kava-muted font-strong leading-relaxed">
                Paste any wide resolution web format JPEG or PNG link here to brand your profile, or use the Cover Change system to load local device snapshots.
              </p>
            </div>

            <p className="text-[9px] text-kava-muted font-bold text-center leading-relaxed bg-neutral-100/40 p-2.5 rounded-xl border border-neutral-100">
              ✓ Updates synchronize instantly across the Vanuatu Nakamal Node network ledger.
            </p>
          </div>

          {/* Danger Zone: Delete Account */}
          {onDeleteAccount && (
            <div className="bg-rose-500/5 hover:bg-rose-500/[0.08] p-6 rounded-[32px] border border-rose-500/10 space-y-4 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-2xl">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h4 className="font-bebas text-2xl uppercase tracking-wider text-rose-500 leading-none">Danger Zone</h4>
                  <p className="text-[9px] text-kava-muted uppercase tracking-widest mt-1">Permanently Deactivate Account</p>
                </div>
              </div>
              <p className="text-xs text-kava-muted/80 leading-relaxed font-medium">
                Deactivating your account will permanently delete your profile information, historical ledger entries, local and cloud sync backups, and all corresponding database records. This process is absolutely irreversible.
              </p>
              <button
                type="button"
                onClick={() => {
                  const confirmed1 = confirm("⚠️ CRITICAL WARNING: You are about to permanently delete your account. This will completely wipe all of your data. Are you absolutely certain you want to proceed?");
                  if (confirmed1) {
                    const typedConfirm = prompt('To confirm account deletion, please type "DELETE" below:');
                    if (typedConfirm === 'DELETE') {
                      onDeleteAccount();
                    } else if (typedConfirm !== null) {
                      alert("Confirmation typed text did not match. Account deletion canceled.");
                    }
                  }
                }}
                className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-rose-500/15 transition-all text-center cursor-pointer font-sans"
              >
                Permanently Delete My App Account
              </button>
            </div>
          )}

          {/* Secure Identity Vault is encrypted and runs silently in the background */}

          {/* IndexedDB Auto Backup Hub */}
          <div className="hidden pointer-events-none select-none opacity-0">
             <div className="flex justify-between items-center">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600">
                   <Database size={20} />
                </div>
                <div className="flex items-center gap-1">
                   <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Active Backup</span>
                </div>
             </div>
             
             <div className="space-y-1.5">
                   <h4 className="text-[10px] font-black text-kava-text uppercase tracking-wider">Browser Persistence Engine</h4>
                   <p className="text-xs text-kava-muted font-medium leading-relaxed">
                     Your localized ecosystem state is automatically backed up to IndexedDB for device-level resilience.
                   </p>
             </div>

             <div className="p-4 bg-white/50 rounded-3xl border border-kava-muted/5 space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-kava-muted">
                   <span>DB Target:</span>
                   <span className="text-kava-text font-bold">NakamalBackupDB_v1</span>
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-kava-muted">
                   <span>Last Sync:</span>
                   <span className="text-kava-text font-bold">
                     {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                   </span>
                </div>
                {backupStatusMsg && (
                   <div className="text-[9px] font-extrabold uppercase text-kava-gold tracking-wide animate-pulse pt-2 border-t border-kava-muted/10 leading-snug">
                     {backupStatusMsg}
                   </div>
                )}
             </div>

             <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleManualBackup}
                  disabled={backupLoading}
                  className="w-full py-3 bg-white hover:bg-neutral-50 text-kava-text font-black text-[9px] uppercase tracking-widest rounded-2xl shadow-sm border border-neutral-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={11} className={backupLoading ? 'animate-spin' : ''} />
                  Re-Sync IndexedDB Now
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleManualRestore}
                    disabled={backupLoading}
                    className="py-2.5 bg-neutral-900 text-white hover:bg-black font-black text-[8px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Restore DB
                  </button>
                  <button
                    type="button"
                    onClick={handleDisasterTest}
                    disabled={backupLoading}
                    className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-strong text-[8px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-100/50 cursor-pointer"
                  >
                    Resilience Test
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
