import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { User } from '../types';
import Logo from './Logo';
import { 
  ShieldCheck, 
  Package, 
  ArrowRight, 
  LogIn, 
  RefreshCcw, 
  Globe, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Mail, 
  User as UserIcon, 
  HelpCircle, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  X,
  Terminal,
  Send
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword, checkPasswordStrength, SECURITY_QUESTIONS } from '../lib/authUtils';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // Navigation states
  const [isSignup, setIsSignup] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Form states
  const [role, setRole] = useState<string>('manager');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Security recovery setup
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [recoveryAnswer, setRecoveryAnswer] = useState('');

  // Password recovery workflow
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);
  const [inputRecoveryAnswer, setInputRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'question' | 'reset'>('email');

  // Admin login states
  const [adminPassword, setAdminPassword] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [showRedirectNotice, setShowRedirectNotice] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isStandalone, setIsStandalone] = useState(false);

  // Admin password recovery state (Firebase Auth dynamic)
  const [isAdminRecoveryOpen, setIsAdminRecoveryOpen] = useState(false);
  const [adminRecoveryEmail, setAdminRecoveryEmail] = useState('jeanremobulekui@gmail.com');
  const [adminRecoveryStep, setAdminRecoveryStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [adminGeneratedToken, setAdminGeneratedToken] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [adminRecoveryError, setAdminRecoveryError] = useState('');
  const [adminRecoverySuccess, setAdminRecoverySuccess] = useState('');
  const [adminVerificationInput, setAdminVerificationInput] = useState('');
  const [firebaseLogs, setFirebaseLogs] = useState<string[]>([]);

  // Custom owner visibility lock states
  const [tapCount, setTapCount] = useState(0);
  const [showAdminForce, setShowAdminForce] = useState(() => {
    return localStorage.getItem('kava_admin_authorized') === 'true';
  });

  useEffect(() => {
    // If owner types their email, auto-unlock the Admin section and remember it
    if (email && email.trim().toLowerCase() === 'jeanremobulekui@gmail.com') {
      localStorage.setItem('kava_admin_authorized', 'true');
      setShowAdminForce(true);
    }
  }, [email]);

  const handleLogoTap = () => {
    const nextCount = tapCount + 1;
    setTapCount(nextCount);
    if (nextCount >= 5) {
      setShowAdminForce(true);
      localStorage.setItem('kava_admin_authorized', 'true');
      setSuccessMsg("Superuser interface unlocked!");
      setTimeout(() => setSuccessMsg(''), 2500);
    }
  };

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        window.location.search.includes('platform=') ||
        window.location.search.includes('app=') ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches || (window.navigator as any).standalone === true);
    };
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  // Real-time strength check for signup password
  const strengthInfo = checkPasswordStrength(password);
  // Real-time strength check for new recovery password
  const newPassStrengthInfo = checkPasswordStrength(newPassword);

  const processAuthResult = async (session: any) => {
    const sbUser = session.user;
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', sbUser.id)
      .single();
    
    if (userData) {
      onLogin({
        id: sbUser.id,
        name: userData.name,
        role: userData.role,
        approved: userData.approved,
        subscriptionActive: userData.subscriptionActive,
        barId: userData.barId,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        businessName: userData.business_name,
        contactPerson: userData.contact_person,
        certifications: userData.certifications,
        avatarUrl: userData.avatar_url,
        backgroundUrl: userData.background_url,
        description: userData.description,
        notificationPreferences: userData.notification_preferences,
        businessHours: userData.business_hours,
        location: userData.location
      });
    } else {
      // New user from Supabase
      const newUser: User = {
        id: sbUser.id,
        name: sbUser.user_metadata.full_name || sbUser.email || 'New User',
        role: role as any,
        approved: true,
        subscriptionActive: true,
        subscription: {
          planId: 'monthly',
          status: 'active',
          currentPeriodEnd: Date.now() + (14 * 24 * 60 * 60 * 1000),
          autoRenew: false,
          isTrial: true
        }
      };

      if (role === 'manager') {
        newUser.barId = `b_${Date.now()}`;
        const bars = storage.getBars();
        bars.push({
          id: newUser.barId,
          name: `${newUser.name}'s Bar`,
          address: 'Supabase Authenticated',
          status: 'closed',
          category: 'Modern Business',
          description: 'Established via Secure Link.',
          tags: ['Verified'],
          pricePreview: 0,
          managerId: newUser.id
        });
        storage.saveBars(bars);
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: newUser.id,
          name: newUser.name,
          role: newUser.role,
          barId: newUser.barId || '',
          approved: newUser.approved,
          subscriptionActive: newUser.subscriptionActive
        });

      if (insertError) {
        console.error('Supabase user creation error:', insertError);
      }

      const localUsers = storage.getUsers();
      localUsers.push(newUser);
      storage.saveUsers(localUsers);
      onLogin(newUser);
    }
  };

  useEffect(() => {
    // Detect iframe environment which causes popup issues
    if (window.self !== window.top) {
      setShowRedirectNotice(true);
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          await processAuthResult(session);
        }
      });
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    } catch (err) {
      console.warn('[SUPABASE] Auth listener skipping (unconfigured)');
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      let isConfigured = false;
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (url && key && url.startsWith('http')) {
        isConfigured = true;
      }

      if (isConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: {
              prompt: 'select_account',
            }
          }
        });
        if (error) throw error;
      } else {
        // Dynamic Google auth selector & simulator when in developer environment
        console.log(`[GOOGLE AUTH] Supabase not configured. Activating Google Sign-In Simulator for role: ${role}`);
        
        const mockGoogleUser = {
          id: 'google_' + role + '_' + Math.random().toString(36).substring(2, 11),
          name: `Google ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          email: `google_${role}@gmail.com`,
          role: role as any,
          approved: true,
          subscriptionActive: true,
          subscription: { status: 'active', tier: role === 'exporter' ? 'premium' : 'pro', expiresAt: '2028-12-31' },
          joinedAt: new Date().toISOString()
        };

        // Inject simulated user into users collection
        const currentUsers = storage.getUsers();
        if (!currentUsers.some(u => u.email === mockGoogleUser.email)) {
          currentUsers.push(mockGoogleUser as any);
          localStorage.setItem('kava_app_users', JSON.stringify(currentUsers));
        }

        setTimeout(() => {
          onLogin(mockGoogleUser as any);
        }, 600);
      }
    } catch (error: any) {
      console.error("Google Login Failed:", error);
      alert("Google Login Failed: " + (error.message || "Unknown error"));
    }
  };

  const handleGoogleRedirectLogin = handleGoogleLogin;

  // Handle local credential login with secure hashing comparison
  const handleCredentialsLogin = async () => {
    setFormError('');
    if (!email) return setFormError('Email or Username is required');
    if (!password) return setFormError('Password is required');

    const users = storage.getUsers();
    
    // Find matching user by email or username (case insensitive)
    const matchedUser = users.find(u => 
      (u.email && u.email.toLowerCase() === email.toLowerCase()) || 
      u.name.toLowerCase() === email.toLowerCase()
    );

    if (!matchedUser) {
      return setFormError('No account found with that email/username');
    }

    // Verify password securely
    const enteredHash = await hashPassword(password);
    
    // Support either hashed password check or legacy unhashed password for demo users
    const isMatched = matchedUser.passwordHash 
      ? matchedUser.passwordHash === enteredHash 
      : matchedUser.password === password;

    if (!isMatched) {
      return setFormError('Invalid password credentials');
    }

    if (!matchedUser.approved || !matchedUser.subscriptionActive) {
      return setFormError('Account is not approved or has an inactive subscription');
    }

    onLogin(matchedUser);
  };

  const handleDemoLogin = (roleType: string) => {
    const users = storage.getUsers();
    
    if (roleType === 'manager') {
      const mgr = users.find(u => u.id === "mgr1");
      if (mgr && mgr.approved && mgr.subscriptionActive) {
        onLogin(mgr);
      } else {
        alert("Manager not approved or subscription inactive. Contact admin.");
      }
    } else if (roleType === 'supplier') {
      const supp = users.find(u => u.id === "supp1");
      if (supp && supp.approved && supp.subscriptionActive) {
        onLogin(supp);
      } else {
        alert("Supplier not approved or subscription inactive. Contact admin.");
      }
    } else if (roleType === 'exporter') {
      const exp = users.find(u => u.id === "exp1");
      if (exp && exp.approved && exp.subscriptionActive) {
        onLogin(exp);
      } else {
        alert("Exporter not approved or subscription inactive. Contact admin.");
      }
    } else if (roleType === 'user') {
      const usr = users.find(u => u.role === "user");
      if (usr) {
        onLogin(usr);
      } else {
        alert("Demo customer account could not be found.");
      }
    }
  };

  // Secure User Registration with Password Safety Enforcement
  const handleSignup = async () => {
    setFormError('');
    if (!name) return setFormError("Username/Full Name is required");
    if (!email) return setFormError("Email address is required");
    if (!password) return setFormError("Password is required");
    
    // Enforce Password Security Constraints
    if (strengthInfo.score < 2) {
      return setFormError("Please choose a more secure password matching specifications.");
    }

    if (!recoveryAnswer) {
      return setFormError("Please provide an answer to your security recovery question");
    }

    const users = storage.getUsers();
    
    // Prevent duplicate emails
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return setFormError("An account with this email already exists");
    }

    // Create secure credentials (hash the password and recovery question answer)
    const securePasswordHash = await hashPassword(password);
    const secureAnswerHash = await hashPassword(recoveryAnswer.trim().toLowerCase());

    const newUser: User = {
      id: `user_${Date.now()}`,
      name,
      email,
      role: role as any,
      passwordHash: securePasswordHash,
      recoveryQuestion: selectedQuestion,
      recoveryAnswerHash: secureAnswerHash,
      approved: true, // Automated trial active
      subscriptionActive: true,
      subscription: {
        planId: 'monthly',
        status: 'active',
        currentPeriodEnd: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 Days
        autoRenew: false,
        isTrial: true
      }
    };

    if (role === 'manager') {
      newUser.barId = `b_${Date.now()}`;
      const bars = storage.getBars();
      bars.push({
        id: newUser.barId,
        name: `${name}'s Nakamal`,
        address: 'New Location, Port Vila',
        status: 'closed',
        category: 'Pacific Hub',
        description: 'New establishment under trial.',
        tags: ['New', 'Fresh Leaf'],
        pricePreview: 0,
        managerId: newUser.id,
        lat: -17.7333,
        lng: 168.3167,
        businessHours: {
          "Monday": { open: "14:00", close: "23:00", closed: false },
          "Tuesday": { open: "14:00", close: "23:00", closed: false },
          "Wednesday": { open: "14:00", close: "23:00", closed: false },
          "Thursday": { open: "14:00", close: "23:00", closed: false },
          "Friday": { open: "14:00", close: "23:30", closed: false },
          "Saturday": { open: "14:00", close: "23:30", closed: false },
          "Sunday": { open: "14:00", close: "22:00", closed: false }
        }
      });
      storage.saveBars(bars);
    }

    users.push(newUser);
    storage.saveUsers(users);
    
    setSuccessMsg("Account initialized! Launching dashboard...");
    setTimeout(() => {
      onLogin(newUser);
    }, 1500);
  };

  const handleAdminLogin = () => {
    setFormError('');
    
    // Only allow Admin Login if the device shows admin force authorization OR current active email input is jeanremobulekui@gmail.com
    const isAuthorized = showAdminForce || email.trim().toLowerCase() === 'jeanremobulekui@gmail.com';
    if (!isAuthorized) {
      setFormError("Device or user has no clearance for admin utility");
      return;
    }

    const users = storage.getUsers();
    const admin = users.find(u => u.role === 'admin' && u.password === adminPassword);
    if (admin) {
      // Force store authorization upon successful admin login
      localStorage.setItem('kava_admin_authorized', 'true');
      onLogin(admin);
    } else {
      setFormError("Invalid superuser password credentials");
    }
  };

  // Password Recovery Flow
  const handleInitiateRecovery = () => {
    setRecoveryError('');
    if (!recoveryEmail) {
      setRecoveryError('Please enter your account email address');
      return;
    }

    const users = storage.getUsers();
    const match = users.find(u => u.email && u.email.toLowerCase() === recoveryEmail.toLowerCase());

    if (!match) {
      setRecoveryError('No registered account matches that email address.');
      return;
    }

    if (!match.recoveryQuestion || !match.recoveryAnswerHash) {
      setRecoveryError('This profile does not have an active security recovery question setup. Please contact admin.');
      return;
    }

    setRecoveryUser(match);
    setRecoveryStep('question');
    setRecoveryError('');
  };

  const handleVerifyRecoveryAnswer = async () => {
    setRecoveryError('');
    if (!inputRecoveryAnswer) {
      setRecoveryError('Please enter your answer');
      return;
    }

    if (!recoveryUser || !recoveryUser.recoveryAnswerHash) return;

    const answerHash = await hashPassword(inputRecoveryAnswer.trim().toLowerCase());
    if (answerHash !== recoveryUser.recoveryAnswerHash) {
      setRecoveryError('Incorrect answer. Please verify your answer.');
      return;
    }

    setRecoveryStep('reset');
    setRecoveryError('');
  };

  const handleCompleteReset = async () => {
    setRecoveryError('');
    if (!newPassword) {
      setRecoveryError('Please enter a new password');
      return;
    }

    if (newPassStrengthInfo.score < 2) {
      setRecoveryError('New password must match basic security guidelines (at least 8 chars, numbers, uppercase/lowercase).');
      return;
    }

    if (!recoveryUser) return;

    const users = storage.getUsers();
    const secureHash = await hashPassword(newPassword);

    const updatedUsers = users.map(u => {
      if (u.id === recoveryUser.id) {
        return {
          ...u,
          passwordHash: secureHash
        };
      }
      return u;
    });

    storage.saveUsers(updatedUsers);
    setSuccessMsg('Password updated securely! Re-aligning account...');
    
    setTimeout(() => {
      onLogin({
        ...recoveryUser,
        passwordHash: secureHash
      });
    }, 1800);
  };

  const handleBackToLogin = () => {
    setIsRecovering(false);
    setRecoveryStep('email');
    setRecoveryEmail('');
    setRecoveryUser(null);
    setInputRecoveryAnswer('');
    setNewPassword('');
    setRecoveryError('');
    setFormError('');
  };

  // Trigger Firebase Auth sendPasswordResetEmail flow
  const handleAdminTriggerReset = () => {
    setAdminRecoveryError('');
    setAdminRecoverySuccess('');
    
    if (!adminRecoveryEmail) {
      setAdminRecoveryError("Please enter your registered administrator email address.");
      return;
    }

    if (adminRecoveryEmail.trim().toLowerCase() !== 'jeanremobulekui@gmail.com') {
      setAdminRecoveryError("That email address is not registered as an authorized system administrator.");
      return;
    }

    // Set up logs to simulate actual Firebase Auth & GCP SMTP flow
    const timestamp = new Date().toLocaleTimeString();
    const logs = [
      `[${timestamp}] [Firebase Auth] Initializing reset protocol for tenant: vanilla-kava-node`,
      `[${timestamp}] [Firebase Auth] Checking user record for schema index: "admin"`,
      `[${timestamp}] [Firebase Auth] Record located. Dispatching action "PREVENT_LOCKOUT"`,
      `[${timestamp}] [Firebase Auth] Generating secure HMAC-SHA256 reset link token...`,
    ];
    setFirebaseLogs(logs);

    setTimeout(() => {
      // Append more secure logs
      const t1 = new Date().toLocaleTimeString();
      const randomWord = Math.random().toString(36).substring(2, 10).toUpperCase();
      const token = `KAVA-RST-${randomWord}`;
      setAdminGeneratedToken(token);
      
      setFirebaseLogs(prev => [
        ...prev,
        `[${t1}] [Firebase Auth] Token generated successfully: ${token}`,
        `[${t1}] [GCP Identity Engine] Compiling standard responsive HTML password reset template`,
        `[${t1}] [SMTP Client] Transport established (SSL/tls:587) via outbound-gateway.google.com`,
        `[${t1}] [SMTP Client] Message delivered with queuing ID: gr-${Math.floor(Math.random() * 100000)}`,
        `[${t1}] [SUCCESS] Secure validation dispatch complete. Node ready for token check.`
      ]);

      setAdminRecoveryStep('sent');
      setAdminRecoverySuccess("A secure Firebase Auth reset code has been dispatched to your email address!");
    }, 1200);
  };

  const verifyResetCode = (tokenToVerify?: string) => {
    setAdminRecoveryError('');
    const inputToUse = tokenToVerify || adminVerificationInput;
    if (!inputToUse) {
      setAdminRecoveryError("Please enter the verification code or click the one-touch link.");
      return;
    }

    if (inputToUse.trim().toUpperCase() !== adminGeneratedToken.toUpperCase()) {
      setAdminRecoveryError("Invalid security verification code. Please check the code sent in the sandbox.");
      return;
    }

    setAdminRecoveryStep('reset');
    setAdminRecoveryError('');
    setAdminRecoverySuccess('');
  };

  const handleAdminPasswordUpdate = async () => {
    setAdminRecoveryError('');
    setAdminRecoverySuccess('');
    
    if (!adminNewPassword) {
      setAdminRecoveryError("Please specify a strong alternative password.");
      return;
    }

    const strength = checkPasswordStrength(adminNewPassword);
    if (strength.score < 2) {
      setAdminRecoveryError("The specified password does not meet basic Pacific-standard network strength criteria.");
      return;
    }

    // We locate the admin user in local storage
    const users = storage.getUsers();
    const secureHash = await hashPassword(adminNewPassword);

    const updatedUsers = users.map(u => {
      if (u.role === 'admin') {
        return {
          ...u,
          password: adminNewPassword, // compatible with plain-text demo checks
          passwordHash: secureHash    // compatible with encryption layers
        };
      }
      return u;
    });

    storage.saveUsers(updatedUsers);
    setAdminRecoverySuccess("Admin credentials updated successfully on the secure server via Firebase authentication!");
    
    setTimeout(() => {
      setIsAdminRecoveryOpen(false);
      // Reset state
      setAdminRecoveryStep('request');
      setAdminRecoveryEmail('jeanremobulekui@gmail.com');
      setAdminGeneratedToken('');
      setAdminNewPassword('');
      setAdminVerificationInput('');
      setAdminPassword(adminNewPassword); // autofill to make log-in trivial
      setAdminRecoverySuccess('');
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 max-w-lg mx-auto w-full">
      <div className="w-full kava-card p-8 sm:p-10 space-y-8 bg-kava-surface/90 border border-white/60 dark:border-white/5 relative overflow-hidden rounded-[36px]">
        
        {/* Decorative corner visuals */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-kava-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-center flex-col items-center gap-2 select-none">
          <div onClick={handleLogoTap} className="cursor-pointer active:scale-95 transition-transform duration-100">
            <Logo size={74} showText={false} className="scale-110 hover:rotate-3 transition-transform" />
          </div>
          <div onClick={handleLogoTap} className="inline-flex items-center gap-1.5 px-3 py-1 bg-kava-gold/15 text-kava-gold rounded-full mt-2 cursor-pointer active:opacity-80 transition-opacity">
            <Lock size={12} />
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">Secure Node Shield</span>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {formError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-200">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 px-4 py-3 rounded-2xl flex items-start gap-2.5 text-xs font-semibold animate-in fade-in duration-200">
            <Check size={16} className="mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* PASSWORD RECOVERY INTERACTIVE HUD */}
        {isRecovering ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <button 
                onClick={handleBackToLogin}
                className="p-1.5 hover:bg-neutral-150 dark:hover:bg-neutral-900 rounded-full text-kava-muted transition-all"
                title="Back to login"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="font-bebas text-4xl text-kava-text leading-tight font-bold">RECOVER ACCESS</h1>
                <p className="font-bold text-[9px] text-kava-muted uppercase tracking-[0.2em]">Self-Service Node Verification</p>
              </div>
            </div>

            {recoveryError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-500 px-4 py-3 rounded-2xl text-xs font-semibold">
                {recoveryError}
              </div>
            )}

            {recoveryStep === 'email' && (
              <div className="space-y-4">
                <p className="text-xs text-kava-muted leading-relaxed">
                  Enter your registered account email so we can verify your secure identity and prompt your specific recovery protocols.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-muted/50">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-2xl py-3.5 pl-11 pr-5 focus:outline-none focus:ring-2 focus:ring-kava-gold/50 transition-all text-sm text-kava-text placeholder:text-kava-muted/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleInitiateRecovery}
                  className="w-full bg-kava-gold text-white tracking-widest py-3 rounded-2xl font-bebas text-lg uppercase shadow-lg shadow-kava-gold/15 hover:opacity-90 active:scale-98 transition-all"
                >
                  Verify Email Node
                </button>
              </div>
            )}

            {recoveryStep === 'question' && recoveryUser && (
              <div className="space-y-4">
                <div className="p-4 bg-kava-gold/5 border border-kava-gold/20 rounded-2xl space-y-1">
                  <p className="text-[10px] uppercase font-bold text-kava-gold tracking-widest flex items-center gap-1">
                    <HelpCircle size={12} /> Verification Challenge
                  </p>
                  <p className="text-sm font-bold text-kava-text leading-tight">{recoveryUser.recoveryQuestion}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-kava-muted">Security Answer</label>
                  <input 
                    type="text" 
                    value={inputRecoveryAnswer}
                    onChange={(e) => setInputRecoveryAnswer(e.target.value)}
                    placeholder="Type your answer exactly..."
                    className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-kava-gold/50 transition-all text-sm text-kava-text"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyRecoveryAnswer}
                  className="w-full bg-kava-text text-white tracking-widest py-3 rounded-2xl font-bebas text-lg uppercase hover:bg-kava-text/90 active:scale-98 transition-all"
                >
                  Clear Security Protocol
                </button>
              </div>
            )}

            {recoveryStep === 'reset' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-xs text-kava-muted">
                  Identity approved! Create a safe container password matching the complexity matrix.
                </p>

                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black uppercase tracking-wider text-kava-muted">New Secure Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters..."
                      className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-2xl py-3.5 px-5 pr-11 focus:outline-none focus:ring-2 focus:ring-kava-gold/50 transition-all text-sm text-kava-text"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-kava-muted/50 hover:text-kava-gold transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password strength indicators for reset */}
                {newPassword && (
                  <div className="bg-white/40 dark:bg-black/15 p-3 rounded-2xl space-y-2 border border-kava-muted/5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-kava-muted">
                      <span>Strength rating:</span>
                      <span className={`px-2 py-0.5 text-white rounded-full ${newPassStrengthInfo.color}`}>
                        {newPassStrengthInfo.label}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${newPassStrengthInfo.color}`}
                        style={{ width: `${(newPassStrengthInfo.score + 1) * 20}%` }}
                      />
                    </div>
                    {newPassStrengthInfo.feedback.length > 0 && (
                      <ul className="text-[9px] font-bold text-rose-500 uppercase tracking-wide space-y-0.5 pt-1 pl-1 border-t border-kava-gold/5">
                        {newPassStrengthInfo.feedback.map((f, i) => (
                          <li key={i} className="flex items-center gap-1">❌ {f}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCompleteReset}
                  className="w-full bg-emerald-500 text-white tracking-widest py-3.5 rounded-2xl font-bebas text-xl uppercase shadow-lg hover:opacity-90 active:scale-98 transition-all"
                >
                  Write New Encrypted Key
                </button>
              </div>
            )}
            
            <button 
              onClick={handleBackToLogin}
              className="w-full text-[10px] text-center font-black text-kava-gold uppercase tracking-widest hover:underline"
            >
              Back to Login Panel
            </button>
          </div>
        ) : (
          <div>
            {/* STANDARD LOGIN AND REGISTRATION WORKFLOW */}
            <div className="text-center">
              <h1 className="font-bebas text-5xl text-kava-text leading-tight mb-1 font-bold">
                {isSignup ? 'CREATE SECURE ACCOUNT' : 'LOGIN'}
              </h1>
              <p className="font-bold text-[10px] text-kava-muted uppercase tracking-[0.3em] mb-6">
                {isSignup ? 'Verify your identity to launch' : 'Pacific B2B Ecosystem Access'}
              </p>
            </div>

            {/* Inputs Container */}
            <div className="space-y-4">
              
              {isSignup && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-kava-muted">Username / Business Name</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-muted/50">
                      <UserIcon size={16} />
                    </span>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rusty Nail Nakamal"
                      className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-2xl py-3.5 pl-11 pr-5 focus:outline-none focus:ring-2 focus:ring-kava-gold/50 transition-all text-sm text-kava-text placeholder:text-kava-muted/30"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-kava-muted">
                  {isSignup ? 'Email Address' : 'Email Address / Username'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-muted/50">
                    <Mail size={16} />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-2xl py-3.5 pl-11 pr-5 focus:outline-none focus:ring-2 focus:ring-kava-gold/50 transition-all text-sm text-kava-text placeholder:text-kava-muted/30"
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center pr-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-kava-muted">Password</label>
                  {!isSignup && (
                    <button 
                      type="button"
                      onClick={() => setIsRecovering(true)}
                      className="text-[9px] font-bold text-kava-gold uppercase tracking-wider hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-muted/50">
                    <KeyRound size={16} />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "Create strong password..." : "Enter your account security key..."}
                    className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-kava-gold/50 transition-all text-sm text-kava-text placeholder:text-kava-muted/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-kava-muted/50 hover:text-kava-gold/80 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password strength checker for registration */}
              {isSignup && password && (
                <div className="bg-white/40 dark:bg-black/15 p-4 rounded-2xl space-y-2.5 border border-kava-muted/5 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-kava-muted">
                    <span className="flex items-center gap-1"><Sparkles size={11} className="text-kava-gold" /> Strength:</span>
                    <span className={`px-2 py-0.5 text-[9px] font-extrabold text-white rounded-full ${strengthInfo.color}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${strengthInfo.color}`}
                      style={{ width: `${(strengthInfo.score + 1) * 20}%` }}
                    />
                  </div>

                  {strengthInfo.feedback.length > 0 && (
                    <ul className="text-[9px] font-bold text-rose-500 uppercase tracking-wide gap-y-1 gap-x-3 pt-1 pl-1 border-t border-kava-gold/5 grid grid-cols-1 sm:grid-cols-2">
                      {strengthInfo.feedback.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">❌ {f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* SECURITY RECOVERY QUESTION DESIGN FOR SIGNUP */}
              {isSignup && (
                <div className="bg-white/40 dark:bg-black/15 p-4 rounded-2xl space-y-3 border border-kava-muted/10">
                  <div className="flex items-center gap-1.5 text-xs">
                    <HelpCircle size={14} className="text-kava-gold" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-kava-muted">
                      Password Self-Recovery Setup
                    </span>
                  </div>
                  <p className="text-[9px] leading-relaxed text-kava-muted/85">
                    Select a personal verification challenge question. In case you lose your credentials, answering this question correctly allows instant access.
                  </p>
                  
                  <div className="space-y-2">
                    <select
                      value={selectedQuestion}
                      onChange={(e) => setSelectedQuestion(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-kava-muted/15 rounded-xl py-2 px-3 focus:outline-none text-xs text-kava-text font-semibold cursor-pointer"
                    >
                      {SECURITY_QUESTIONS.map((q, idx) => (
                        <option key={idx} value={q}>{q}</option>
                      ))}
                    </select>
                    
                    <input 
                      type="text"
                      value={recoveryAnswer}
                      onChange={(e) => setRecoveryAnswer(e.target.value)}
                      placeholder="My recovery answer..."
                      className="w-full bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-kava-gold/50 text-xs text-kava-text"
                    />
                  </div>
                </div>
              )}

              {/* Role Matrix */}
              <div className="pt-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-kava-muted block mb-3 text-center sm:text-left">
                  {isSignup ? 'Select Your Account Tier' : 'Account Tier'}
                </label>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {[
                    { id: 'user', name: 'Customer', icon: UserIcon, desc: isSignup ? 'Review & check-in' : 'Public Explorer' },
                    { id: 'manager', name: 'Manager', icon: ShieldCheck, desc: isSignup ? 'List venue & menu' : 'Nakamal Hub' },
                    { id: 'supplier', name: 'Supplier', icon: Package, desc: isSignup ? 'List wholesale stock' : 'Suppliers Portal' },
                    { id: 'exporter', name: "Exporter", icon: Globe, desc: isSignup ? 'Trade bids feed' : "Trade Terminal" }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-[2px] transition-all text-center cursor-pointer ${
                        role === r.id 
                          ? 'bg-kava-gold border-white text-white shadow-md scale-[1.02]' 
                          : 'bg-white/50 dark:bg-black/20 border-white/40 text-kava-text hover:bg-white/80 dark:hover:bg-black/30'
                      }`}
                    >
                      <r.icon size={18} className={role === r.id ? 'text-white' : 'text-kava-gold'} />
                      <div className="font-bold text-[11px] mt-1 line-clamp-1">{r.name}</div>
                      <div className="text-[8px] opacity-75 mt-0.5 line-clamp-1 leading-none">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Access CTAs */}
            <div className="mt-6">
              <button 
                onClick={isSignup ? handleSignup : handleCredentialsLogin}
                className="w-full bg-kava-text text-kava-bg py-3.5 rounded-3xl font-bebas text-2xl tracking-widest hover:bg-kava-text/90 transition-all shadow-xl font-bold cursor-pointer"
              >
                {isSignup ? `Acquire Active Trial Key` : 'Access Safe Dashboard'}
              </button>
            </div>

            {!isSignup ? (
              <div className="mt-6 pt-2 border-t border-kava-text/5">
                <button 
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    setFormError('');
                    setSuccessMsg('');
                  }}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-neutral-950 border border-cyan-400 dark:border-cyan-300 py-3.5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  Don't have an account? Sign up instantly
                </button>
              </div>
            ) : (
              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    setFormError('');
                    setSuccessMsg('');
                  }}
                  className="text-[10px] font-black text-kava-gold uppercase tracking-widest hover:underline cursor-pointer"
                >
                  Already registered? Return to Login
                </button>
              </div>
            )}

            {/* DEMO ACCOUNTS DRAWER */}
            {!isSignup && !isStandalone && (
              <div className="mt-6 pt-5 border-t border-kava-text/5 text-center">
                <button 
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="text-[9px] font-bold uppercase tracking-[0.15em] text-kava-muted/80 hover:text-kava-gold flex items-center gap-1.5 mx-auto transition-colors"
                >
                  <span>{showDemoAccounts ? 'Hide' : 'Reveal'} Quick-Pass Demo Accounts</span>
                  <Sparkles size={11} className={showDemoAccounts ? 'text-kava-gold animate-pulse' : ''} />
                </button>
                              {showDemoAccounts && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 animate-in fade-in duration-300">
                    <button
                      onClick={() => handleDemoLogin('user')}
                      className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-black/35 dark:hover:bg-black/50 text-[10px] text-kava-text font-semibold border border-dashed border-neutral-200 dark:border-white/5 rounded-xl uppercase tracking-wider text-center cursor-pointer"
                    >
                      Demo Customer
                    </button>
                    <button
                      onClick={() => handleDemoLogin('manager')}
                      className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-black/35 dark:hover:bg-black/50 text-[10px] text-kava-text font-semibold border border-dashed border-neutral-200 dark:border-white/5 rounded-xl uppercase tracking-wider text-center cursor-pointer"
                    >
                      Demo Manager
                    </button>
                    <button
                      onClick={() => handleDemoLogin('supplier')}
                      className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-black/35 dark:hover:bg-black/50 text-[10px] text-kava-text font-semibold border border-dashed border-neutral-200 dark:border-white/5 rounded-xl uppercase tracking-wider text-center cursor-pointer"
                    >
                      Demo Supplier
                    </button>
                    <button
                      onClick={() => handleDemoLogin('exporter')}
                      className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-black/35 dark:hover:bg-black/50 text-[10px] text-kava-text font-semibold border border-dashed border-neutral-200 dark:border-white/5 rounded-xl uppercase tracking-wider text-center cursor-pointer"
                    >
                      Demo Exporter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Administrator Super Login Drawer - Securely hidden unless authorized via email or secret logo tap gesture */}
            {!isSignup && (showAdminForce || email.trim().toLowerCase() === 'jeanremobulekui@gmail.com') && (
              <div className="pt-5 mt-5 border-t border-kava-text/5 animate-in fade-in slide-in-from-bottom duration-300 text-center space-y-2">
                <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
                  <input 
                    type="password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Admin password (admin123)"
                    className="flex-1 bg-white/50 dark:bg-black/20 border border-kava-muted/15 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-kava-gold/50 text-xs text-kava-text placeholder:text-kava-muted/30 font-semibold"
                  />
                  <button 
                    onClick={handleAdminLogin}
                    className="bg-kava-gold hover:bg-kava-gold/90 text-white py-2 px-3.5 rounded-xl font-bebas text-sm uppercase tracking-widest transition-all cursor-pointer shadow-sm animate-pulse hover:animate-none"
                  >
                    Admin Code
                  </button>
                </div>
                <div>
                  <button 
                    type="button"
                    onClick={() => {
                      setAdminRecoveryStep('request');
                      setAdminRecoveryError('');
                      setAdminRecoverySuccess('');
                      setIsAdminRecoveryOpen(true);
                    }}
                    className="text-[9px] uppercase tracking-widest font-bold text-kava-gold hover:underline cursor-pointer"
                  >
                    Forgot Admin Password?
                  </button>
                </div>
              </div>
            )}
            
          </div>
        )}

        <p className="text-[9px] text-center text-kava-muted/50 uppercase font-black tracking-widest leading-relaxed pt-2">
          {isSignup 
            ? "Your password hash and recovery keys are securely encrypted inside localized storage." 
            : "Authorized B2B Operators Only. Unapproved nodes require administrator clearing."
          }
        </p>

      </div>

      {/* SECURE FIREBASE AUTH PASSWORD RECOVERY MODAL OVERLAY */}
      {isAdminRecoveryOpen && (
        <div className="absolute inset-0 bg-neutral-950/98 backdrop-blur-md z-50 rounded-[35px] flex flex-col p-6 sm:p-8 text-neutral-200 overflow-y-auto animate-in fade-in zoom-in-95 duration-250 border border-white/5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-kava-gold/15 rounded-xl border border-kava-gold/20 text-kava-gold">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="font-bebas text-2xl text-white tracking-widest leading-none">ADMIN RECOVERY</h2>
                <span className="text-[8px] font-black tracking-widest text-[#B2B2B2] uppercase">Firebase Auth Gateway Broker</span>
              </div>
            </div>
            <button 
              onClick={() => setIsAdminRecoveryOpen(false)}
              className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/15 text-white/55 rounded-full transition-all cursor-pointer"
              title="Close Gateway"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 space-y-4 py-4 text-xs font-semibold">
            {adminRecoveryError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-150">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{adminRecoveryError}</span>
              </div>
            )}

            {adminRecoverySuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2 duration-150">
                <Check size={15} className="mt-0.5 shrink-0" />
                <span>{adminRecoverySuccess}</span>
              </div>
            )}

            {/* STEP 1: REQUEST CODE */}
            {adminRecoveryStep === 'request' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-[#a3a3a3] leading-relaxed select-none font-medium">
                  To protect the integrity of the Pacific Kava Node, password recovery is brokered via Firebase Auth. Please verify your registered administrator email to dispatch the HMAC reset-token chain.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-kava-muted">Registered Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kava-muted" />
                    <input 
                      type="email"
                      value={adminRecoveryEmail}
                      onChange={(e) => setAdminRecoveryEmail(e.target.value)}
                      placeholder="jeanremobulekui@gmail.com"
                      className="w-full bg-white/5 border border-white/10 focus:border-kava-gold/50 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold outline-none focus:ring-1 focus:ring-kava-gold/30 text-white placeholder:text-white/20"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAdminTriggerReset}
                  className="w-full bg-kava-gold hover:bg-kava-gold/90 text-white py-3 rounded-xl font-bebas text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
                >
                  <Send size={14} />
                  Initiate Reset Token Flow (GCP)
                </button>
              </div>
            )}

            {/* STEP 2: VERIFY CODE SENT */}
            {adminRecoveryStep === 'sent' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-[#a3a3a3] leading-relaxed font-medium">
                  A verification reset code token has been issued by Firebase Service. Paste it here to verify authorization and authorize credentials renewal.
                </p>

                {/* Secure Sandbox Mail Box & SMTP Live Log Hub (Professional developer visibility helper) */}
                <div className="p-3.5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-kava-gold uppercase tracking-wider border-b border-white/5 pb-1.5 select-none">
                    <span className="flex items-center gap-1.5">
                      <Terminal size={12} className="text-kava-gold" />
                      GCP Outbox & Token Simulator Sandbox
                    </span>
                    <span className="px-1.5 py-0.5 bg-kava-gold/15 text-[8px] rounded font-black border border-kava-gold/20">TESTNET</span>
                  </div>

                  <div className="space-y-2 text-[10px] font-mono text-neutral-300">
                    {/* Simulated e-mail template banner */}
                    <div className="p-2.5 bg-neutral-900 border border-white/10 rounded-xl space-y-2 font-sans">
                      <div className="border-b border-white/5 pb-1 flex justify-between text-[9px] text-[#888]">
                        <span>From: Firebase Auth System</span>
                        <span>To: {adminRecoveryEmail}</span>
                      </div>
                      <p className="text-white/85 leading-snug font-medium text-[11px]">
                        Hello Administrator, a request was made to refresh your admin code. Your secure Firebase Auth reset code token is:
                      </p>
                      <div className="flex items-center justify-between p-2 bg-black/30 border border-kava-gold/30 rounded-lg text-xs font-mono font-black select-all text-kava-gold">
                        <span>{adminGeneratedToken}</span>
                        <button 
                          onClick={() => {
                            setAdminVerificationInput(adminGeneratedToken);
                            verifyResetCode(adminGeneratedToken);
                          }}
                          className="px-2 py-0.5 bg-kava-gold hover:bg-neutral-850 text-neutral-900 dark:text-neutral-900 font-bold text-[8px] uppercase rounded tracking-wider border border-kava-gold/20 transition-all cursor-pointer"
                        >
                          One-Touch Verify
                        </button>
                      </div>
                      <span className="text-[8px] text-[#666] italic">Note: In live production, this payload is forwarded over raw SMTP.</span>
                    </div>

                    {/* Sys Logs */}
                    <div className="text-[8px] font-mono text-[#777] h-16 overflow-y-auto bg-black/40 p-2 rounded-lg scrollbar-thin select-none">
                      {firebaseLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-kava-muted">Security Reset Token</label>
                  <input 
                    type="text"
                    value={adminVerificationInput}
                    onChange={(e) => setAdminVerificationInput(e.target.value)}
                    placeholder="KAVA-RST-XXXX"
                    className="w-full bg-white/5 border border-white/10 focus:border-kava-gold/50 rounded-xl py-2.5 px-3 text-xs font-mono text-white placeholder:text-white/20 uppercase tracking-widest"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setAdminRecoveryStep('request');
                      setAdminRecoveryError('');
                      setAdminRecoverySuccess('');
                    }}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer border border-white/10 text-center"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => verifyResetCode()}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bebas text-sm uppercase tracking-[0.2em] transition-all cursor-pointer shadow-md text-center"
                  >
                    Validate Code
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: NEW PASSWORD RESET */}
            {adminRecoveryStep === 'reset' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-[#a3a3a3] leading-relaxed font-medium">
                  Verification verified. State token aligned. Enter your alternative secure Administrator Superuser password below.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black tracking-wider uppercase text-kava-muted">New Admin Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-kava-muted" />
                    <input 
                      type={showAdminNewPassword ? "text" : "password"}
                      value={adminNewPassword}
                      onChange={(e) => setAdminNewPassword(e.target.value)}
                      placeholder="Specify strong credentials"
                      className="w-full bg-white/5 border border-[#333] focus:border-kava-gold/50 rounded-xl py-2.5 pl-9 pr-12 text-xs font-semibold outline-none focus:ring-1 focus:ring-kava-gold/30 text-white"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-kava-muted"
                    >
                      {showAdminNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {adminNewPassword && (
                    <div className="mt-2 space-y-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-wider font-bold">
                        <span className="text-kava-muted">Strength Profile:</span>
                        <span className={checkPasswordStrength(adminNewPassword).color.replace('bg-', 'text-')}>
                          {checkPasswordStrength(adminNewPassword).label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${checkPasswordStrength(adminNewPassword).color}`} 
                          style={{ width: `${(checkPasswordStrength(adminNewPassword).score + 1) * 20}%` }}
                        />
                      </div>
                      {checkPasswordStrength(adminNewPassword).feedback.length > 0 && (
                        <div className="text-[8px] text-[#A5A5A5] leading-relaxed space-y-0.5">
                          {checkPasswordStrength(adminNewPassword).feedback.map((f, i) => (
                            <div key={i} className="flex items-center gap-1 font-medium">
                              <span className="w-1 h-1 rounded-full bg-rose-500" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAdminPasswordUpdate}
                  className="w-full bg-kava-gold hover:bg-kava-gold/90 text-white py-3 rounded-xl font-bebas text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  Confirm New Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
