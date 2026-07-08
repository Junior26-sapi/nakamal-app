import React, { useState, useEffect, useCallback } from 'react';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { User, Bar, MenuItem, BarUpdate, Product, Task, TaskPriority } from '../types';
import { productService } from '../services/productService';
import { chatService, ChatMessage } from '../services/chatService';
import { barService } from '../services/barService';
import { taskService } from '../services/taskService';
import { feedbackService } from '../services/feedbackService';
import { Edit3, Plus, Trash2, Save, Power, Info, Camera, Calendar, Megaphone, MapPin, Tag as TagIcon, Navigation, Clock, Store, Facebook, Instagram, MessageCircle, Share2, Link, Volume2, VolumeX, CreditCard, AlertTriangle, X, Upload, ShoppingCart, Package, Send, LayoutDashboard, UtensilsCrossed, Zap, Truck, Settings, CheckCircle, Globe, Phone, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BusinessMap from './BusinessMap';
import BillingDashboard from './BillingDashboard';
import FinanceDashboard from './FinanceDashboard';
import ImageDropZone from './ImageDropZone';
import NeonWaveStatus from './NeonWaveStatus';
import VenueQRCode from './VenueQRCode';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ManagerBoardProps {
  user: User;
  onUpdateUser?: (updatedUser: User) => void;
  onLogout?: () => void;
}

const receiveSound = typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3') : null;
const sendSound = typeof Audio !== 'undefined' ? new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3') : null;

if (receiveSound) receiveSound.volume = 0.3;
if (sendSound) sendSound.volume = 0.2;

function playSound(type: 'send' | 'receive', isMuted: boolean) {
  if (isMuted) return;
  const sound = type === 'send' ? sendSound : receiveSound;
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.log("Audio play blocked", e));
  }
}

export default function ManagerBoard({ user, onUpdateUser, onLogout }: ManagerBoardProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { confirm } = useConfirmation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'venue' | 'inventory' | 'engagement' | 'logistics' | 'tasks' | 'finance'>(() => {
    return (localStorage.getItem('manager_active_tab') as any) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('manager_active_tab', activeTab);
  }, [activeTab]);
  const [bar, setBar] = useState<Bar | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [updates, setUpdates] = useState<BarUpdate[]>([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isEditingMapLocation, setIsEditingMapLocation] = useState(false);
  const [tempBar, setTempBar] = useState<Bar | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  
  // High-precision automated GPS registry states
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');
  const [showGpsBanner, setShowGpsBanner] = useState(false);
  const [newUpdate, setNewUpdate] = useState({
    type: 'notice' as 'product' | 'event' | 'notice',
    title: '',
    description: '',
    imageUrl: '',
    adImageUrl: '',
    visibility: 'public' as 'public' | 'business'
  });
  const [venuePhotos, setVenuePhotos] = useState<string[]>([]);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [adFilePreview, setAdFilePreview] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [fbImportUrl, setFbImportUrl] = useState('');
  const [importSource, setImportSource] = useState<'facebook' | 'instagram' | 'whatsapp'>('facebook');
  const [socialImportUrl, setSocialImportUrl] = useState('');
  
  // Advanced Ecosystem Social Import/Export Hub States
  const [socialConfigs, setSocialConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('nakamal_social_configs_v0');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error(e); }
    return {
      facebook: { connected: true, pageName: 'Green Lagoon Nakamal Official', pageUrl: 'facebook.com/GreenLagoonNakamal', autoPush: true, autoImport: true, secretToken: '••••••••••••••••••••••••••••••••••••' },
      instagram: { connected: true, handle: '@LagoonNakamal', autoPush: true, autoImport: false, hashtag: 'LagoonNakamal' },
      whatsapp: { connected: false, groupLink: '', phone: '', autoPush: false, autoImport: true }
    };
  });

  const [connectingPlatform, setConnectingPlatform] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([
    'SYSTEM: Initialized. Waiting for network link handshake triggers...'
  ]);

  const [simulatedFeed, setSimulatedFeed] = useState<any[]>(() => {
    return [
      {
        id: 'sim_1',
        source: 'facebook' as const,
        author: 'George Pentecost Kava Supporter',
        authorAvatar: 'G',
        title: '🌴 Fresh Stone-Ground Pentecost Brew!',
        description: 'Direct from the source! Fresh stone-ground Pentecost strong root brew is active tonight. Bring your own cup or buy a coconut shell. First shell starts at 5:00 PM VT. Price: 150VT per cup! #LagoonNakamal',
        imageUrl: 'https://images.unsplash.com/photo-1541535881962-e668f28d3596?auto=format&fit=crop&q=80&w=1000',
        timestamp: Date.now() - 3600000,
        pending: true
      }
    ];
  });
  
  // Real-time Social Transmitter States (Export Simulation to connected accounts)
  const [activeTransmitterUpdate, setActiveTransmitterUpdate] = useState<BarUpdate | null>(null);
  const [transmitterPlatform, setTransmitterPlatform] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null);
  const [transmitterProgress, setTransmitterProgress] = useState(0);
  const [transmitterState, setTransmitterState] = useState<'idle' | 'transmitting' | 'done'>('idle');

  const [marketUpdates, setMarketUpdates] = useState<BarUpdate[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [isEditingUpdate, setIsEditingUpdate] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('kava_muted') === 'true');
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isSyncingHours, setIsSyncingHours] = useState(false);
  const [hoursSyncSuccess, setHoursSyncSuccess] = useState(false);

  // Offline service worker notification states
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isNotificationSupported, setIsNotificationSupported] = useState(typeof window !== 'undefined' && 'Notification' in window);
  const [notificationPermission, setNotificationPermission] = useState(typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default');
  const [simulatedOffline, setSimulatedOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

  const triggerOfflineNotification = useCallback((status: 'open' | 'closed') => {
    const offlineModeActive = !isOnline || simulatedOffline;
    if (offlineModeActive) {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'MONITOR_OFFLINE_CHANGE',
          title: `Offline Venue Status Alert 📡`,
          body: `Venue "${bar?.name || 'Nakamal Bar'}" automatically switched to ${status.toUpperCase()} while operating in disconnected mode.`,
          icon: '/src/assets/images/kava_logo_gold_1779574911856.png',
          url: '/manager'
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`Offline Venue Status Alert (Local)`, {
          body: `Venue "${bar?.name || 'Nakamal Bar'}" automatically switched to ${status.toUpperCase()} while operating in disconnected mode.`,
          icon: '/src/assets/images/kava_logo_gold_1779574911856.png'
        });
      }
    }
  }, [bar, isOnline, simulatedOffline]);

  // Supplier Selection for Chat
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const typingControllerRef = React.useRef<{ setTyping: (v: boolean) => void, unsubscribe: () => void } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isAnalyzingMsg, setIsAnalyzingMsg] = useState(false);
  const [msgAnalysis, setMsgAnalysis] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [newTask, setNewTask] = useState<{ title: string, description: string, priority: TaskPriority, dueDate?: string }>({
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: ''
  });

  const prevMarketCount = React.useRef(marketUpdates.length);

  // Locked State Check
  if (!user.approved || !user.subscriptionActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-10 p-4 md:p-10 text-center animate-in fade-in duration-700">
        <div className="w-full max-w-xl p-10 bg-kava-surface backdrop-blur-2xl rounded-[48px] border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative flex flex-col items-center">
            <div className="p-6 bg-rose-500/10 rounded-3xl mb-6 border border-rose-500/20">
              <AlertTriangle size={64} className="text-rose-500 animate-pulse" />
            </div>
             <h2 className="font-bebas text-6xl text-kava-text leading-tight mb-3">{t('access_suspended')}</h2>
            <p className="text-kava-muted font-bold text-[10px] uppercase tracking-[0.3em] max-w-sm mb-8 leading-relaxed">
              {t('access_suspended_desc')}
            </p>
            
            <div className="w-full bg-black/5 rounded-3xl p-6 mb-8 border border-black/5">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">{t('requirement')}</p>
              <p className="text-sm font-medium text-kava-text">{t('requirement_desc')}</p>
            </div>

            <button 
              onClick={() => setIsBillingOpen(true)}
              className="w-full py-5 bg-kava-gold text-white rounded-3xl font-bebas text-2xl tracking-[0.2em] shadow-xl shadow-kava-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {t('secure_renewal')}
            </button>
          </div>
        </div>

        <section className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest">
          {t('data_preserved')}
        </section>

        <AnimatePresence>
          {isBillingOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBillingOpen(false)}
                className="absolute inset-0 bg-kava-bg/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-5xl"
              >
                <div className="absolute top-8 right-8 z-50">
                  <button onClick={() => setIsBillingOpen(false)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-kava-text backdrop-blur-md border border-white/40 transition-all">
                    <X size={24} />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[90vh] custom-scrollbar rounded-[48px] bg-kava-bg border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                  <BillingDashboard user={user} onUpdateUser={onUpdateUser} onClose={() => setIsBillingOpen(false)} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Notification Sound Effect
  useEffect(() => {
    if (marketUpdates.length > prevMarketCount.current) {
      playSound('receive', isMuted);
    }
    prevMarketCount.current = marketUpdates.length;
  }, [marketUpdates.length, isMuted]);

  useEffect(() => {
    localStorage.setItem('kava_muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    const loadMarket = () => {
      const all = storage.getBarUpdates();
      // Show all business posts or direct posts from suppliers
      setMarketUpdates(all.filter(u => u.visibility === 'business').sort((a,b) => b.timestamp - a.timestamp));
    };
    loadMarket();
    const interval = setInterval(loadMarket, 10000);

    // Live subscription to all products for the catalog
    const unsubscribeProd = productService.listenToProducts(null, (allProducts) => {
      setSupplierProducts(allProducts);
    });

    // Listen to chats for unread counts
    const unsubscribeChats = chatService.listenToChats(user.id, (chats) => {
      const counts: Record<string, number> = {};
      chats.forEach(chat => {
        const otherParticipant = chat.participants.find(p => p !== user.id);
        if (otherParticipant) {
          // For simplicity, we count if last message is not from us
          // In real implementation, markAsRead would manage this precisely
          if (chat.lastMessage && chat.lastMessage.senderId !== user.id) {
            counts[otherParticipant] = (counts[otherParticipant] || 0) + 1;
          }
        }
      });
      setUnreadCounts(counts);
    });

    let unsubscribeTasks: (() => void) | undefined;
    if (user.barId) {
      const sub = taskService.subscribeToTasks({ barId: user.barId }, (updatedTasks) => {
        setTasks(updatedTasks);
      });
      unsubscribeTasks = sub.unsubscribe;
    }

    return () => {
      clearInterval(interval);
      unsubscribeProd();
      unsubscribeChats();
      if (unsubscribeTasks) unsubscribeTasks();
    };
  }, [user.id]);

  useEffect(() => {
    if (!activeChatId) {
      setChatHistory([]);
      return;
    }

    const unsubscribeMessages = chatService.listenToMessages(activeChatId, (messages) => {
      setChatHistory(messages);
      
      // Mark as read
      const unreadIds = messages
        .filter(m => m.senderId !== user.id && !m.readBy?.includes(user.id))
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        chatService.markAsRead(activeChatId, user.id, unreadIds);
      }
    });

    const typingSub = chatService.subscribeToTyping(activeChatId, user.id, (typingUsers) => {
      setIsPartnerTyping(typingUsers.length > 0);
    });
    typingControllerRef.current = typingSub;

    return () => {
      unsubscribeMessages();
      typingSub.unsubscribe();
      typingControllerRef.current = null;
    };
  }, [activeChatId, user.id]);

  const selectSupplier = async (supplierId: string) => {
    setMsgAnalysis(null);
    setActiveSupplierId(supplierId);
    const chatId = await chatService.getOrCreateDirectChat(user.id, supplierId);
    setActiveChatId(chatId);
  };

  const sendSupplierMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !chatText.trim()) return;
    
    const text = chatText.trim();
    setChatText('');
    playSound('send', isMuted);

    // Reset typing state
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingControllerRef.current?.setTyping(false);

    await chatService.sendMessage(activeChatId, user.id, text);
  };

  const analyzeMessage = async () => {
    if (chatHistory.length === 0) return;
    const lastMsg = chatHistory[chatHistory.length - 1];
    setIsAnalyzingMsg(true);
    setMsgAnalysis(null);
    try {
      const response = await fetch('/api/ai/b2b-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: lastMsg.senderId,
          toId: lastMsg.senderId === user.id ? (activeSupplierId || '') : user.id,
          text: lastMsg.text,
          type: lastMsg.type || 'text',
          timestamp: lastMsg.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze message');
      }

      const data = await response.json();
      if (data && data.aiAnalysis) {
        setMsgAnalysis(data.aiAnalysis);
      }
    } catch (err) {
      console.error('Error analyzing message:', err);
      alert('Failed to generate AI logistical analysis.');
    } finally {
      setIsAnalyzingMsg(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bar || !newTask.title.trim()) return;

    const dueDateTimestamp = newTask.dueDate ? new Date(newTask.dueDate).getTime() : undefined;
    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    const tempTask: Task = {
      id: tempId,
      barId: bar.id,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'Pending',
      dueDate: dueDateTimestamp,
      createdAt: Date.now()
    };

    // Optimistically prepend new task to local array
    setTasks(prev => [tempTask, ...prev]);
    setNewTask({ title: '', description: '', priority: 'Medium', dueDate: '' });
    setIsTaskFormOpen(false);

    try {
      await taskService.createTask({
        barId: bar.id,
        title: tempTask.title,
        description: tempTask.description,
        priority: tempTask.priority,
        status: 'Pending',
        dueDate: tempTask.dueDate
      });
    } catch (err) {
      console.error('Failed to save task database backing:', err);
      // Revert optimism if failed
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    if (newStatus === 'Completed') {
      feedbackService.vibrate('success');
      if (!isMuted) feedbackService.playSound('success');
    } else {
      feedbackService.vibrate('tap');
      if (!isMuted) feedbackService.playSound('tap');
    }

    // Optimistically toggle task status in local state array instantly
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await taskService.updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update task status in DB:', err);
      // Revert optimism on failure
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      const originalTasks = [...tasks];
      // Optimistically remove the requested task from local view state immediately
      setTasks(prev => prev.filter(t => t.id !== id));

      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error('Failed to delete task from DB:', err);
        // Rollback on database failure
        setTasks(originalTasks);
      }
    }
  };

  const handleTyping = () => {
    if (!typingControllerRef.current) return;
    typingControllerRef.current.setTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingControllerRef.current?.setTyping(false);
    }, 3000);
  };

  const isCurrentlyOpen = useCallback((hours: any) => {
    if (!hours) return false;
    const now = new Date();
    const day = DAYS[now.getDay()];
    const dayHours = hours[day];
    if (!dayHours || dayHours.closed) return false;

    // Convert everything to minutes since midnight for comparison
    const [h, m] = dayHours.open.split(':').map(Number);
    const [ch, cm] = dayHours.close.split(':').map(Number);
    
    const start = h * 60 + m;
    const end = ch * 60 + cm;
    const current = now.getHours() * 60 + now.getMinutes();

    if (end < start) { // Over midnight case (e.g., 10:00 PM to 02:00 AM)
      return current >= start || current <= end;
    }
    return current >= start && current <= end;
  }, []);

  const recordStatusChange = useCallback((newStatus: 'open' | 'closed') => {
    setBar(prev => {
      if (!prev) return null;
      const historyEntry = { status: newStatus as "open" | "closed", timestamp: Date.now() };
      const updatedHistory = [historyEntry, ...(prev.statusHistory || [])].slice(0, 50); // Keep last 50
      const updatedBar: Bar = { ...prev, status: newStatus as "open" | "closed", statusHistory: updatedHistory };
      
      const bars = storage.getBars();
      const updatedBars = bars.map(b => b.id === prev.id ? updatedBar : b);
      storage.saveBars(updatedBars as Bar[]);

      // Push to Supabase so others see the real-time update
      barService.updateBar(prev.id, { 
        status: newStatus, 
        statusHistory: updatedHistory 
      }).catch(err => console.error('Failed to sync automatic status:', err));

      return updatedBar;
    });
    setTempBar(prev => prev ? { ...prev, status: newStatus as "open" | "closed" } : null);
    
    // Alert user if offline via Service Worker
    triggerOfflineNotification(newStatus);
  }, [triggerOfflineNotification]);

  const updateStatusAutomatically = useCallback(() => {
    if (!bar || !bar.businessHours) return;
    
    const shouldBeOpen = isCurrentlyOpen(bar.businessHours);
    const targetStatus = shouldBeOpen ? 'open' : 'closed';
    
    if (bar.status !== targetStatus) {
      recordStatusChange(targetStatus);
    }
  }, [bar, isCurrentlyOpen, recordStatusChange]);

  useEffect(() => {
    updateStatusAutomatically();
    const interval = setInterval(updateStatusAutomatically, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [updateStatusAutomatically]);

  useEffect(() => {
    const loadBarData = async () => {
      // First try Supabase
      let myBar = await barService.getBarByManager(user.id);
      
      // Fallback to local storage if not in Supabase yet
      if (!myBar) {
        const bars = storage.getBars();
        myBar = bars.find(b => b.id === user.barId) || null;
      }

      if (myBar) {
        // Initialize business hours if missing
        if (!myBar.businessHours) {
          myBar.businessHours = DAYS.reduce((acc, d) => ({
            ...acc,
            [d]: { open: '09:00', close: '22:00', closed: false }
          }), {});
        }
        
        setBar(myBar);
        setTempBar(myBar);
        setVenuePhotos(myBar.photos || []);
        setTagsInput(myBar.tags.join(', '));
        
        // Check if GPS coordinates are default (0 or equivalent) to auto-open locator assistant
        if (!myBar.lat || !myBar.lng || Math.abs(myBar.lat) < 0.1 || Math.abs(myBar.lng) < 0.1) {
          setShowGpsBanner(true);
        }
        
        // Load Menu
        const supabaseMenu = await barService.getMenu(myBar.id);
        if (supabaseMenu.length > 0) {
          setMenu(supabaseMenu);
        } else {
          const menus = storage.getMenus();
          setMenu(menus[myBar.id] || []);
        }
        
        // Load Updates
        const supabaseUpdates = await barService.getBarUpdates(myBar.id);
        if (supabaseUpdates.length > 0) {
          setUpdates(supabaseUpdates);
        } else {
          const allUpdates = storage.getBarUpdates();
          setUpdates(allUpdates.filter(u => u.barId === myBar!.id).sort((a,b) => b.timestamp - a.timestamp));
        }
      }
    };

    loadBarData();
  }, [user.id, user.barId]);

  // Real-time Bar Sync
  useEffect(() => {
    if (!bar?.id) return;
    
    const subscription = barService.subscribeToBar(bar.id, (updates) => {
      // Only update if not currently editing to avoid clobbering local changes
      if (!isEditingInfo) {
        setBar(prev => prev ? { ...prev, ...updates } : null);
        setTempBar(prev => {
          if (!prev) return null;
          const next = { ...prev, ...updates };
          // If we are in the middle of editing but some external change happened (unlikely for manager but possible)
          // we should be careful. But generally Managers are the only ones editing their own bar.
          return next;
        });
        
        // Update tags input if tags changed (though tags aren't in the partial updates currently, 
        // they could be added to barService.subscribeToBar if needed)
        if (updates.tags) {
          setTagsInput(updates.tags.join(', '));
        }
      }
    });
      
    return () => {
      subscription.unsubscribe();
    };
  }, [bar?.id, isEditingInfo]);

  const toggleStatus = async () => {
    if (!bar) return;
    const newStatus: 'open' | 'closed' = bar.status === 'open' ? 'closed' : 'open';
    const historyEntry = { status: newStatus as "open" | "closed", timestamp: Date.now() };
    const updatedHistory = [historyEntry, ...(bar.statusHistory || [])].slice(0, 50);
    
    setBar(prev => prev ? { ...prev, status: newStatus, statusHistory: updatedHistory } : null);
    
    // Alert user if offline via Service Worker
    triggerOfflineNotification(newStatus);

    // Persist to Supabase
    await barService.updateBar(bar.id, { 
      status: newStatus, 
      statusHistory: updatedHistory 
    }).catch(err => console.error('Failed to sync toggle status:', err));
    
    // Fallback to storage
    const bars = storage.getBars();
    const updatedBars = bars.map(b => b.id === bar.id ? { ...b, status: newStatus, statusHistory: updatedHistory } as Bar : b);
    storage.saveBars(updatedBars as Bar[]);
  };

  const persistBusinessHours = async (newHours: any) => {
    if (!bar) return;
    setIsSyncingHours(true);
    setHoursSyncSuccess(false);
    try {
      // 1. Direct persistence to 'bars' table in Supabase
      await barService.updateBusinessHours(bar.id, newHours);

      // 2. State & Fallback updating
      const updatedBar: Bar = { ...bar, businessHours: newHours };
      setBar(updatedBar);
      if (tempBar) {
        setTempBar(prev => prev ? { ...prev, businessHours: newHours } : null);
      }

      const bars = storage.getBars();
      const updatedBars = bars.map(b => b.id === bar.id ? updatedBar : b);
      storage.saveBars(updatedBars);

      // 3. Confirm success
      setHoursSyncSuccess(true);
      setTimeout(() => setHoursSyncSuccess(false), 4000);
    } catch (err) {
      console.error('[SUPABASE] Direct schedule persistence failed:', err);
    } finally {
      setIsSyncingHours(false);
    }
  };

  const saveInfo = async () => {
    if (!tempBar || !bar) return;
    const finalTags = tagsInput.split(',').map(s => s.trim()).filter(s => s !== '');
    const finalBar = { 
      ...tempBar, 
      tags: finalTags,
      lat: Number(tempBar.lat) || 0,
      lng: Number(tempBar.lng) || 0,
      photos: venuePhotos
    };

    setBar(finalBar);
    setIsEditingInfo(false);

    // Persist to Supabase
    await barService.updateBar(bar.id, finalBar);

    // Fallback to storage
    const bars = storage.getBars();
    const updatedBars = bars.map(b => b.id === finalBar.id ? finalBar : b);
    storage.saveBars(updatedBars);
  };

  const handleAutoLocateGPS = async () => {
    setGpsDetecting(true);
    setGpsErrorMsg('');
    setGpsSuccessMsg('');
    if (!navigator.geolocation) {
      setGpsErrorMsg("Your browser/device doesn't support geolocation.");
      setGpsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (tempBar) {
          const latVal = Number(latitude.toFixed(6));
          const lngVal = Number(longitude.toFixed(6));
          const updated = {
            ...tempBar,
            lat: latVal,
            lng: lngVal
          };
          setTempBar(updated);
          setBar(updated);
          
          await barService.updateBar(bar?.id || updated.id, updated);
          const barsObj = storage.getBars();
          storage.saveBars(barsObj.map(b => b.id === updated.id ? updated : b));
          
          setGpsSuccessMsg(`Successfully registered GPS: Lat ${latVal}, Lng ${lngVal}`);
          setGpsDetecting(false);
          setShowGpsBanner(false);
          setTimeout(() => setGpsSuccessMsg(''), 6000);
        } else {
          setGpsErrorMsg("No bar selected to register.");
          setGpsDetecting(false);
        }
      },
      (error) => {
        console.error("GPS error", error);
        let errorMsg = "Could not retrieve coordinates. Please allow location permissions.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access denied. Please enable GPS permissions for this app.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "GPS signal lost or unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out.";
        }
        setGpsErrorMsg(errorMsg);
        setGpsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const addMenuItem = () => {
    const newItem: MenuItem = { 
      name: "New Item", 
      price: 0, 
      promotionPrice: undefined,
      description: "",
      imageUrl: "",
      status: 'In Stock'
    };
    const updatedMenu = [...menu, newItem];
    setMenu(updatedMenu);
    saveMenu(updatedMenu);
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string | number) => {
    const updatedMenu = [...menu];
    updatedMenu[index] = { ...updatedMenu[index], [field]: value };
    setMenu(updatedMenu);
  };

  const removeMenuItem = async (index: number) => {
    const item = menu[index];
    const confirmed = await confirm({
      title: 'Remove Menu Item',
      message: `Are you sure you want to remove "${item?.name || 'this item'}" from the menu?`,
      confirmText: 'Remove Item',
      cancelText: 'Keep Item',
      isDanger: true
    });

    if (confirmed) {
      const updatedMenu = menu.filter((_, i) => i !== index);
      setMenu(updatedMenu);
      saveMenu(updatedMenu);
    }
  };

  const saveMenu = (updatedMenu: MenuItem[]) => {
    if (!bar) return;
    const menus = storage.getMenus();
    menus[bar.id] = updatedMenu;
    storage.saveMenus(menus);
  };

  const addToPhotos = (base64: string) => {
    setVenuePhotos(prev => [...prev, base64]);
  };

  const removeFromPhotos = (index: number) => {
    setVenuePhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFilePreview(base64);
        setNewUpdate(prev => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
      // Reset input value to allow re-uploading same file
      e.target.value = '';
    }
  };

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bar || !newUpdate.title) return;

    let finalTimestamp = Date.now();
    if (newUpdate.type === 'event') {
      finalTimestamp = new Date(eventDate).getTime();
    }

    if (isEditingUpdate) {
      const allUpdates = storage.getBarUpdates();
      const updatedUpdates = allUpdates.map(u => u.id === isEditingUpdate ? {
        ...u,
        ...newUpdate,
        timestamp: finalTimestamp,
        isApproved: u.isApproved // keep existing approval status
      } : u);
      storage.saveBarUpdates(updatedUpdates);
      setUpdates(updatedUpdates.filter(u => u.barId === bar.id).sort((a,b) => b.timestamp - a.timestamp));
      setIsEditingUpdate(null);
    } else {
      const update: BarUpdate = {
        id: 'u' + Date.now(),
        barId: bar.id,
        ...newUpdate,
        timestamp: finalTimestamp,
        isApproved: false
      };

      const currentAll = storage.getBarUpdates();
      const allUpdates = [update, ...currentAll];
      storage.saveBarUpdates(allUpdates);
      setUpdates([update, ...updates].sort((a, b) => b.timestamp - a.timestamp));
    }

    setNewUpdate({ type: 'notice', title: '', description: '', imageUrl: '', adImageUrl: '', visibility: 'public' });
    setFilePreview(null);
    setAdFilePreview(null);
  };

  const editUpdate = (upd: BarUpdate) => {
    setIsEditingUpdate(upd.id);
    setNewUpdate({
      type: upd.type,
      title: upd.title,
      description: upd.description,
      imageUrl: upd.imageUrl || '',
      adImageUrl: upd.adImageUrl || '',
      visibility: upd.visibility || 'public'
    });
    setFilePreview(upd.imageUrl || null);
    setAdFilePreview(upd.adImageUrl || null);
    if (upd.type === 'event') {
      setEventDate(new Date(upd.timestamp).toISOString().split('T')[0]);
    }
  };

  const removeUpdate = (id: string) => {
    const filtered = updates.filter(u => u.id !== id);
    setUpdates(filtered);
    const all = storage.getBarUpdates().filter(u => u.id !== id);
    storage.saveBarUpdates(all);
  };

  const shareToFacebook = (upd: BarUpdate) => {
    const url = window.location.href; // In real app, this would be the post URL
    const text = `${upd.title}\n\n${upd.description}`;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(fbUrl, '_blank');
  };

  const shareToWhatsApp = (upd: BarUpdate) => {
    const text = `*${upd.title}*\n\n${upd.description}\n\nCheck it out on NAKAMAL: ${window.location.href}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const triggerSocialTransmitter = (upd: BarUpdate, platform: 'facebook' | 'instagram' | 'whatsapp') => {
    setActiveTransmitterUpdate(upd);
    setTransmitterPlatform(platform);
    setTransmitterProgress(0);
    setTransmitterState('transmitting');

    let cur = 0;
    const interval = setInterval(() => {
      cur += 15;
      if (cur >= 100) {
        cur = 100;
        setTransmitterProgress(100);
        setTransmitterState('done');
        clearInterval(interval);
      } else {
        setTransmitterProgress(cur);
      }
    }, 150);
  };

  const handleSocialImport = (source: 'facebook' | 'instagram' | 'whatsapp') => {
    const presets = {
      facebook: {
        title: '🌴 FR-1: Fresh Stone-Ground Pentecost Brew!',
        description: 'Direct from the source! Fresh stone-ground Pentecost strong root brew is active tonight. Bring your own cup or buy a coconut shell. First shell starts at 5:00 PM VT. Price: 150VT per cup!',
        imageUrl: 'https://images.unsplash.com/photo-1541535881962-e668f28d3596?auto=format&fit=crop&q=80&w=1000'
      },
      instagram: {
        title: '🧉 INT-2: Sunset Custom Shell Ritual',
        description: 'Nothing compares to the deep earthiness of real Vanuatu stone-ground lateral roots at dusk. Slow down, breathe in, and experience the ancient custom shell brew with our custom community.',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1000'
      },
      whatsapp: {
        title: '📢 WA-3: Premium Custom Dry Roots Batch',
        description: '[KAVA EXPRESS ECOSYSTEM] - 500KG of organic, sun-dried Pentecost kava lateral roots processed, certificate certified, and bagged in Vila. Ready for dispatch.',
        imageUrl: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=1000'
      }
    };

    const selected = presets[source];
    setNewUpdate({
      type: 'notice',
      title: selected.title,
      description: selected.description,
      imageUrl: selected.imageUrl,
      adImageUrl: '',
      visibility: 'public'
    });
    setFilePreview(selected.imageUrl);
    setIsImporting(false);
    setSocialImportUrl('');
  };

  const handleFacebookImport = () => {
    if (!fbImportUrl) return;
    setFbImportUrl('');
    handleSocialImport('facebook');
  };

  const saveSocialConfigs = (updated: any) => {
    setSocialConfigs(updated);
    localStorage.setItem('nakamal_social_configs_v0', JSON.stringify(updated));
  };

  const triggerHandshake = (platform: 'facebook' | 'instagram' | 'whatsapp', params: any) => {
    setConnectingPlatform(platform);
    setConnectionProgress(0);
    const logs = [
      `[SECURITY] Initiating OAuth secure handshake with ${platform.toUpperCase()} graph nodes...`,
      `[NETWORK] Enrolling edge listener on https://nakamal.vercel.app/api/webhooks/${platform}`,
      `[RESOLVING] Accessing security scope 'pages_manage_posts, instagram_basic, whatsapp_business_messaging'...`
    ];
    setConnectionLogs(logs);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setConnectionProgress(100);
        setTimeout(() => {
          setConnectingPlatform(null);
          const updated = {
            ...socialConfigs,
            [platform]: {
              ...socialConfigs[platform],
              ...params,
              connected: true
            }
          };
          saveSocialConfigs(updated);
          feedbackService.trigger('success');
        }, 800);
      } else {
        setConnectionProgress(progress);
        let newLog = '';
        if (progress === 20) newLog = `[SSL] Handshake accepted by client verified cert.`;
        if (progress === 40) newLog = `[API] Authorized access to live webhooks. Status: ACTIVE.`;
        if (progress === 60) newLog = `[DATA] Synced account metadata: "${params.pageName || params.handle || params.groupLink || 'Active Node'}"`;
        if (progress === 80) newLog = `[DAEMON] SSE WebSocket duplex signal loop established securely on port :3000`;
        if (newLog) {
          setConnectionLogs(prev => [...prev, newLog]);
        }
      }
    }, 450);
  };

  const triggerSimulatedIncomingPost = (platform?: 'facebook' | 'instagram' | 'whatsapp') => {
    const platforms = ['facebook', 'instagram', 'whatsapp'] as const;
    const targetPlatform = platform || platforms[Math.floor(Math.random() * platforms.length)];
    
    // Check if configured to import
    const textPresets = {
      facebook: {
        author: 'George Pentecost Kava Supporter',
        title: '🌴 Facebook Page Sync: Premium Pentecost Lateral Roots Grounded!',
        description: 'Just stopped by Green Lagoon Nakamal! They just opened a fresh batch of lateral roots from Pentecost. The numbing effect is incredibly clean and powerful. Grab yours quick! 🥥 Mate, the shell is smooth! #LagoonNakamal',
        imageUrl: 'https://images.unsplash.com/photo-1541535881962-e668f28d3596?auto=format&fit=crop&q=80&w=1000'
      },
      instagram: {
        author: '@KavaAdventuresVanuatu',
        title: '📸 Instagram Sync: Beautiful Sunset Shell Session tonight!',
        description: 'Vanuatu sunset paired with Pentecost stone-ground lateral roots at Green Lagoon Nakamal. Clean bowl style! Highly recommended experience! ✨🥥 #LagoonNakamal #VanuatuKava',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1000'
      },
      whatsapp: {
        author: 'Pentecost Growers Coop',
        title: '💬 WhatsApp Group alert: 300KG Select Ground Roots Dispatched!',
        description: '[GROWERS DIRECT] - 300KG premium dried organic roots ready for dispatch at Green Lagoon Nakamal. Moisture is down to 8%, zero fiber content. Verified excellent! 🧉🌿',
        imageUrl: 'https://images.unsplash.com/photo-1596524430615-b46475ddff6e?auto=format&fit=crop&q=80&w=1000'
      }
    };

    const preset = textPresets[targetPlatform];
    const newPost = {
      id: 'sim_' + Date.now(),
      source: targetPlatform,
      author: preset.author,
      authorAvatar: preset.author.charAt(0),
      title: preset.title,
      description: preset.description,
      imageUrl: preset.imageUrl,
      timestamp: Date.now(),
      pending: true
    };

    // Check if the platform is connected AND autoImport is turned on
    const isConnected = socialConfigs[targetPlatform]?.connected;
    const isAutoImport = socialConfigs[targetPlatform]?.autoImport;

    if (isConnected && isAutoImport) {
      // Auto-import straight into the updates board!
      if (!bar) return;
      
      const update: BarUpdate = {
        id: 'u_sync_' + Date.now(),
        barId: bar.id,
        type: 'product',
        title: `[Synced ${targetPlatform.toUpperCase()}] ${preset.title}`,
        description: preset.description,
        imageUrl: preset.imageUrl,
        timestamp: Date.now(),
        isApproved: true, // auto-sync accepts immediately
        visibility: 'public'
      };

      const currentAll = storage.getBarUpdates();
      storage.saveBarUpdates([update, ...currentAll]);
      setUpdates(prev => [update, ...prev].sort((a,b) => b.timestamp - a.timestamp));
      feedbackService.trigger('success');
    } else {
      // Put in the pending quarantine list
      setSimulatedFeed(prev => [newPost, ...prev]);
      feedbackService.trigger('notify');
    }
  };

  const importSimulatedPost = (simId: string) => {
    const item = simulatedFeed.find(x => x.id === simId);
    if (!item || !bar) return;

    const update: BarUpdate = {
      id: 'u_sync_' + Date.now(),
      barId: bar.id,
      type: 'product',
      title: `[Synced ${item.source.toUpperCase()}] ${item.title}`,
      description: item.description,
      imageUrl: item.imageUrl,
      timestamp: Date.now(),
      isApproved: true,
      visibility: 'public'
    };

    const currentAll = storage.getBarUpdates();
    storage.saveBarUpdates([update, ...currentAll]);
    setUpdates(prev => [update, ...prev].sort((a,b) => b.timestamp - a.timestamp));
    
    // Remove from simulated feed quarantine
    setSimulatedFeed(prev => prev.filter(x => x.id !== simId));
    feedbackService.trigger('success');
  };

  const dismissSimulatedPost = (simId: string) => {
    setSimulatedFeed(prev => prev.filter(x => x.id !== simId));
  };

  if (!bar || !tempBar) return <div className="text-center p-20 font-bebas text-3xl opacity-20 tracking-widest">Loading Bar Data...</div>;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Supplier Chat Drawer */}
      <AnimatePresence>
        {activeSupplierId && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-kava-surface backdrop-blur-2xl border-l-4 border-white shadow-[-20px_0_60px_rgba(0,0,0,0.3)] z-[120] flex flex-col"
          >
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/60">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-kava-gold rounded-2xl flex items-center justify-center font-bebas text-3xl text-white shadow-lg">
                      {storage.getUsers().find(u => u.id === activeSupplierId)?.name.charAt(0) || 'S'}
                    </div>
                    <div>
                      <h4 className="font-bebas text-3xl text-kava-text tracking-tight mb-0.5">Supplier Line</h4>
                      <p className="text-[10px] font-bold text-kava-muted uppercase tracking-[3px]">
                        Partner: {storage.getUsers().find(u => u.id === activeSupplierId)?.name || 'Direct Contact'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setActiveSupplierId(null); setActiveChatId(null); }}
                    className="p-3 bg-kava-text/5 hover:bg-kava-text/10 rounded-2xl transition-all self-start"
                  >
                    <X size={20} className="text-kava-muted" />
                  </button>
                </div>

                {(() => {
                  const supp = storage.getUsers().find(u => u.id === activeSupplierId);
                  if (!supp) return null;
                  const links = [
                    supp.phone && { label: 'Phone', value: supp.phone, href: `tel:${supp.phone}`, color: 'bg-kava-gold/10 text-kava-gold border-kava-gold/20' },
                    supp.website && { label: 'Website', value: supp.website, href: supp.website.startsWith('http') ? supp.website : `https://${supp.website}`, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
                    supp.whatsapp && { label: 'WhatsApp', value: supp.whatsapp, href: supp.whatsapp.startsWith('http') ? supp.whatsapp : `https://${supp.whatsapp}`, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
                    supp.facebook && { label: 'Facebook', value: supp.facebook, href: supp.facebook.startsWith('http') ? supp.facebook : `https://${supp.facebook}`, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
                  ].filter(Boolean) as any[];

                  if (links.length === 0) return null;

                  return (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-kava-text/5">
                      {links.map((link, lIdx) => (
                        <a 
                          key={lIdx}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${link.color}`}
                        >
                          {link.label === 'Phone' && <Phone size={8} />}
                          {link.label === 'Website' && <Globe size={8} />}
                          {link.label === 'WhatsApp' && <MessageCircle size={8} />}
                          {link.label === 'Facebook' && <Facebook size={8} />}
                          {link.label}
                        </a>
                      ))}
                    </div>
                  );
                })()}

                {chatHistory.length > 0 && (
                  <button
                    onClick={analyzeMessage}
                    disabled={isAnalyzingMsg}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-kava-gold text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-kava-gold/90 transition-all disabled:opacity-50"
                  >
                    ✨ {isAnalyzingMsg ? 'Analyzing...' : 'Genkit AI Analysis'}
                  </button>
                )}
              </div>
            </div>

            {msgAnalysis && (
              <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/20 flex items-start gap-2.5">
                <span className="text-sm mt-0.5">✨</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700">Genkit Interpretation</span>
                    <button 
                      onClick={() => setMsgAnalysis(null)}
                      className="text-[8px] font-bold text-emerald-700/60 hover:text-emerald-700 uppercase"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[10px] font-semibold text-kava-text/80 leading-normal">{msgAnalysis}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {chatHistory.length > 0 ? chatHistory.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] space-y-1.5`}>
                    <div className={`p-5 rounded-[28px] text-sm font-medium shadow-sm leading-relaxed border border-white/40 ${
                      msg.senderId === user.id 
                        ? 'bg-kava-text text-white rounded-tr-none' 
                        : 'bg-white text-kava-text rounded-tl-none border border-white shadow-kava-text/5'
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-2 px-2 text-[8px] font-black uppercase tracking-widest text-kava-muted/30 ${
                      msg.senderId === user.id ? 'justify-end' : 'justify-start'
                    }`}>
                      <Clock size={10} />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-6 text-center px-10">
                  <div className="p-10 bg-kava-text/5 rounded-[40px] border border-white">
                    <MessageCircle size={64} strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bebas text-4xl uppercase tracking-widest leading-none text-kava-text">Secure Hub</p>
                    <p className="text-[9px] font-bold uppercase tracking-[4px] leading-relaxed">
                      Initialize a direct B2B transmission to establish logistical sync with this supplier node.
                    </p>
                  </div>
                </div>
              )}
              {isPartnerTyping && (
                 <div className="flex justify-start">
                    <div className="bg-white/40 backdrop-blur-md px-4 py-3 rounded-2xl flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1 h-1 bg-kava-gold rounded-full animate-bounce"></span>
                        <span className="w-1 h-1 bg-kava-gold rounded-full animate-bounce delay-100"></span>
                        <span className="w-1 h-1 bg-kava-gold rounded-full animate-bounce delay-200"></span>
                      </div>
                      <span className="text-[8px] font-black text-kava-gold uppercase tracking-widest">Supplier typing...</span>
                    </div>
                 </div>
              )}
            </div>

            <form onSubmit={sendSupplierMessage} className="p-8 border-t border-white/10 bg-white/60 backdrop-blur-lg">
              <div className="flex gap-4">
                <input 
                  value={chatText}
                  onChange={(e) => {
                    setChatText(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Draft logistics request..."
                  className="flex-1 bg-white border border-white rounded-2xl py-4 px-6 text-sm font-medium text-kava-text focus:ring-2 focus:ring-kava-gold/30 outline-none transition-all shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!chatText.trim()}
                  className="p-4 bg-kava-gold text-white rounded-2xl hover:bg-kava-gold/80 transition-all disabled:opacity-30 shadow-xl shadow-kava-gold/20 active:scale-90"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Expiry Notification */}
      {user.subscription?.currentPeriodEnd && (
        <AnimatePresence>
          {Date.now() > user.subscription.currentPeriodEnd - (3 * 24 * 60 * 60 * 1000) && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               className="bg-rose-500 text-white rounded-[24px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-rose-500/20"
             >
               <div className="flex items-center gap-3">
                 <AlertTriangle size={20} className="animate-pulse" />
                 <div>
                   <p className="text-xs font-black uppercase tracking-widest leading-none">Subscription Action Required</p>
                   <p className="text-[10px] opacity-80 font-bold mt-1 uppercase tracking-tight">
                     {Date.now() > user.subscription.currentPeriodEnd 
                       ? "Your account has expired. Please renew to restore visibility." 
                       : `Your ${user.subscription.isTrial ? 'trial' : 'subscription'} ends in ${Math.ceil((user.subscription.currentPeriodEnd - Date.now()) / (24 * 60 * 60 * 1000))} days.`}
                   </p>
                 </div>
               </div>
               <button 
                 onClick={() => setIsBillingOpen(true)}
                 className="px-6 py-2 bg-white text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
               >
                 Renew Now
               </button>
             </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Hero Header */}
      <div className="kava-card relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 w-64 h-64 bg-kava-gold/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold text-xs uppercase tracking-[4px] text-kava-gold">{t('Management Portal')}</span>
              <div className="h-[2px] w-8 bg-kava-gold/30" />
            </div>
            <h2 className="font-bebas text-7xl text-kava-text leading-none tracking-tighter mb-2">{bar.name}</h2>
            <p className="text-kava-muted flex items-center gap-2 font-medium">
              <Info size={16} />
              {bar.address}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Audio Mute Toggle */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-[20px] border transition-all shadow-sm ${isMuted ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-kava-bg border-white/20 text-kava-muted hover:text-kava-gold'}`}
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>

            {/* Billing Button */}
            <button 
              onClick={() => setIsBillingOpen(true)}
              className="p-4 rounded-[20px] border border-white/20 bg-kava-bg text-kava-muted hover:text-kava-gold transition-all shadow-sm flex items-center gap-2"
              title="Subscriptions & Billing"
            >
              <CreditCard size={24} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">{t('Billing')}</span>
            </button>

            {onLogout && (
              <button 
                onClick={onLogout}
                className="p-4 rounded-[20px] border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2"
                title="Log Out Session"
              >
                <Power size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">{t('Logout')}</span>
              </button>
            )}

            <NeonWaveStatus 
              status={bar.status} 
              onClick={toggleStatus} 
            />
          </div>
        </div>
      </div>

     {/* Tab Navigation */}
     <div className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar sticky top-0 z-50 bg-kava-bg/80 backdrop-blur-md pt-2">
       {[
         { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
         { id: 'finance', label: 'Finance Ledger', icon: DollarSign },
         { id: 'venue', label: 'Venue Node', icon: Store },
         { id: 'inventory', label: 'Inventory', icon: UtensilsCrossed },
         { id: 'engagement', label: 'Marketing', icon: Megaphone },
         { id: 'logistics', label: 'Logistics', icon: Truck },
         { id: 'tasks', label: 'Tasks', icon: CheckCircle },
       ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`flex items-center gap-3 px-8 py-4 rounded-[24px] whitespace-nowrap font-bebas text-2xl tracking-[0.1em] transition-all border shadow-sm ${
            activeTab === tab.id 
              ? 'bg-kava-text text-white border-kava-text' 
              : 'bg-white text-kava-muted border-white hover:border-kava-gold/30'
          }`}
        >
          <tab.icon size={20} />
          {t(tab.label)}
        </button>
      ))}
    </div>

    {activeTab === 'finance' && (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <FinanceDashboard role="manager" />
      </div>
    )}

    {activeTab === 'dashboard' && (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Automatic GPS Location Registry Banner */}
        {showGpsBanner && (
          <div className="bg-gradient-to-br from-[#3e220f] to-[#251205] border-4 border-amber-500 text-white rounded-[32px] p-6 shadow-2xl flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-4 bg-amber-500 text-black rounded-2xl animate-bounce">
                <MapPin size={28} />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="font-bebas text-3xl text-amber-400 tracking-wide">🗺️ REGISTER NAKAMAL BUSINESS COORDINATES</h4>
                <p className="text-[10.5px] font-semibold text-neutral-300">
                  Allow local kava shell seekers, suppliers, and exporters to discover your exact location. Populating coordinates makes your Nakamal 100% visible across the kava platform map.
                </p>
                {gpsErrorMsg && (
                  <p className="text-red-400 text-[10px] font-bold mt-1 font-mono uppercase bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                    ❌ {gpsErrorMsg}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 shrink-0 w-full md:w-auto">
              <button 
                onClick={handleAutoLocateGPS}
                disabled={gpsDetecting}
                className="flex-1 md:flex-none px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {gpsDetecting ? 'Detecting GPS Satellite...' : '🎯 Auto-Register GPS'}
              </button>
              <button 
                onClick={() => {
                  setActiveTab('venue');
                  setIsEditingInfo(true);
                }}
                className="flex-1 md:flex-none px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
              >
                Pin on Map
              </button>
            </div>
          </div>
        )}

        {gpsSuccessMsg && (
          <div className="bg-emerald-950 border-2 border-emerald-500 text-emerald-300 rounded-[24px] p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-emerald-500" />
              <p className="text-[11px] font-bold uppercase tracking-wider">{gpsSuccessMsg}</p>
            </div>
            <button onClick={() => setGpsSuccessMsg('')} className="text-[10px] font-black underline uppercase tracking-widest cursor-pointer">dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 kava-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">{t('Live Feed')}</h3>
              <Zap size={24} className="text-kava-gold" />
            </div>
            <div className="space-y-4">
              {updates.slice(0, 3).map(upd => (
                <div key={upd.id} className="flex gap-4 p-4 bg-white/40 rounded-2xl border-2 border-white shadow-sm">
                  <div className="w-16 h-16 rounded-xl bg-kava-text/5 overflow-hidden shrink-0">
                    {upd.imageUrl && <img src={upd.imageUrl} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-kava-text">{upd.title}</h4>
                    <p className="text-[10px] text-kava-muted line-clamp-2">{upd.description}</p>
                  </div>
                </div>
              ))}
              {updates.length === 0 && (
                <div className="text-center py-10 opacity-20 italic text-[10px] uppercase tracking-widest font-bold">{t('No recent transmissions')}</div>
              )}
            </div>
          </div>
          <div className="kava-card">
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider mb-6">{t('Quick Actions')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('venue')} className="p-6 bg-kava-gold/10 rounded-3xl text-kava-gold hover:bg-kava-gold hover:text-white transition-all flex flex-col items-center gap-2">
                <Camera size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('Photos')}</span>
              </button>
              <button onClick={() => setActiveTab('inventory')} className="p-6 bg-emerald-500/10 rounded-3xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex flex-col items-center gap-2">
                <Plus size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('Add Item')}</span>
              </button>
              <button onClick={() => setActiveTab('engagement')} className="p-6 bg-blue-500/10 rounded-3xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex flex-col items-center gap-2">
                <Megaphone size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('Post')}</span>
              </button>
              <button onClick={() => setIsBillingOpen(true)} className="p-6 bg-purple-500/10 rounded-3xl text-purple-500 hover:bg-purple-500 hover:text-white transition-all flex flex-col items-center gap-2">
                <CreditCard size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('Billing')}</span>
              </button>
            </div>
          </div>
        </div>
        <section className="kava-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Clock size={24} />
              </div>
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">{t('Operations History')}</h3>
            </div>
            <div className="space-y-3">
              {bar.statusHistory?.slice(0, 5).map((log, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/40 p-4 rounded-2xl border-2 border-white shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${log.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="font-bold text-kava-text uppercase tracking-widest text-[10px]">
                      {log.status.toUpperCase()} AT {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-kava-muted">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
              {(!bar.statusHistory || bar.statusHistory.length === 0) && (
                <div className="text-center py-10 opacity-20 italic text-[10px] uppercase tracking-widest font-bold">No history available</div>
              )}
            </div>
        </section>
      </div>
    )}

    {activeTab === 'venue' && (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Map Section */}
        <section className="kava-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Navigation size={24} />
              </div>
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Business Location</h3>
              <span className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest">
                {tempBar?.lat && tempBar?.lng && !isNaN(Number(tempBar.lat)) && !isNaN(Number(tempBar.lng)) ? `${Number(tempBar.lat).toFixed(4)}, ${Number(tempBar.lng).toFixed(4)}` : 'Location not set'}
              </span>
            </div>

            <div className="flex gap-2">
              {!isEditingMapLocation && !isEditingInfo ? (
                <button
                  type="button"
                  onClick={() => setIsEditingMapLocation(true)}
                  className="px-5 py-2.5 bg-kava-gold hover:bg-kava-gold/90 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  Edit Map Location Pin
                </button>
              ) : isEditingMapLocation ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (tempBar && bar) {
                        const updatedBar = {
                          ...bar,
                          lat: Number(tempBar.lat) || 0,
                          lng: Number(tempBar.lng) || 0
                        };
                        setBar(updatedBar);
                        setTempBar(updatedBar);
                        await barService.updateBar(bar.id, updatedBar);
                        const bars = storage.getBars();
                        storage.saveBars(bars.map(b => b.id === updatedBar.id ? updatedBar : b));
                      }
                      setIsEditingMapLocation(false);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Save Selected Position
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (bar && tempBar) {
                        setTempBar({
                          ...tempBar,
                          lat: bar.lat,
                          lng: bar.lng
                        });
                      }
                      setIsEditingMapLocation(false);
                    }}
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-kava-text rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer border border-neutral-300 dark:border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider">
                  Editing Full Profile
                </span>
              )}
            </div>
          </div>
          <BusinessMap 
            center={{ lat: Number(tempBar?.lat) || -17.7333, lng: Number(tempBar?.lng) || 168.3270 }} 
            title={tempBar?.name || ''} 
            address={tempBar?.address || ''} 
            isEditable={isEditingInfo || isEditingMapLocation}
            onChangeCoordinates={(lat, lng) => {
              if (tempBar) {
                setTempBar({
                  ...tempBar,
                  lat: Number(lat.toFixed(6)),
                  lng: Number(lng.toFixed(6))
                });
              }
            }}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Venue Information */}
          <section className="kava-card space-y-8 transition-colors">
          <div className="flex justify-between items-center">
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Venue Information</h3>
            <div className="flex gap-2">
              {isEditingInfo && (
                <button 
                  onClick={() => {
                    setTempBar(bar);
                    setTagsInput(bar?.tags.join(', ') || '');
                    setIsEditingInfo(false);
                  }}
                  className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
                >
                  Discard
                </button>
              )}
              <button 
                onClick={() => isEditingInfo ? saveInfo() : setIsEditingInfo(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white/50 text-kava-muted rounded-2xl hover:bg-kava-gold hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
              >
                {isEditingInfo ? <Save size={16} /> : <Edit3 size={16} />}
                {isEditingInfo ? 'Save Changes' : 'Edit Identity'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Venue Name</label>
                <input 
                  disabled={!isEditingInfo}
                  value={tempBar.name}
                  onChange={(e) => setTempBar({...tempBar, name: e.target.value})}
                  className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 px-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Category</label>
                <input 
                  disabled={!isEditingInfo}
                  value={tempBar.category}
                  onChange={(e) => setTempBar({...tempBar, category: e.target.value})}
                  className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 px-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Latitude</label>
                <input 
                  type="text"
                  disabled={!isEditingInfo}
                  value={tempBar.lat ?? ''}
                  placeholder="0.0000"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || val === '-' || !isNaN(Number(val))) {
                      setTempBar({...tempBar, lat: val as any});
                    }
                  }}
                  className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 px-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Longitude</label>
                <input 
                  type="text"
                  disabled={!isEditingInfo}
                  value={tempBar.lng ?? ''}
                  placeholder="0.0000"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || val === '-' || !isNaN(Number(val))) {
                      setTempBar({...tempBar, lng: val as any});
                    }
                  }}
                  className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 px-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
                />
              </div>
            </div>

            {isEditingInfo && (
              <div className="bg-white/10 p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="text-[10.5px] font-semibold text-kava-muted">
                  📍 Click below to immediately fetch high-precision coordinates using your phone/device GPS.
                </div>
                <button 
                  type="button"
                  onClick={handleAutoLocateGPS}
                  disabled={gpsDetecting}
                  className="w-full sm:w-auto px-6 py-3 bg-kava-gold text-white hover:bg-white hover:text-kava-text rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-55"
                >
                  {gpsDetecting ? "Acquiring Coordinates..." : "🎯 Use My Live Device GPS"}
                </button>
              </div>
            )}

            {isEditingInfo && (
              <p className="text-[10px] font-bold text-kava-gold uppercase tracking-wider px-4 flex items-center gap-2 animate-pulse">
                <span>📍 TIP: Drag the marker or click directly on the interactive map above to pin your geographic coordinates visually!</span>
              </p>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">
                Entry / Starting Price (VUV) {tempBar.pricePreview ? `[ ≈ ${formatPrice(tempBar.pricePreview)} ]` : ''}
              </label>
              <input 
                type="number"
                disabled={!isEditingInfo}
                value={tempBar.pricePreview || ''}
                onChange={(e) => setTempBar({...tempBar, pricePreview: parseInt(e.target.value) || 0})}
                className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 px-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Address</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-kava-muted/30" size={16} />
                <input 
                  disabled={!isEditingInfo}
                  value={tempBar.address}
                  onChange={(e) => setTempBar({...tempBar, address: e.target.value})}
                  className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 pl-14 pr-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Atmosphere Tags (Comma separated)</label>
                <div className="relative">
                  <TagIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-kava-muted/30" size={16} />
                  <input 
                    disabled={!isEditingInfo}
                    value={tagsInput}
                    placeholder="e.g. Rooftop, Live Music, Craft Beer"
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-3xl py-4 pl-14 pr-6 focus:outline-none transition-all font-bold text-kava-text disabled:opacity-60"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 px-4 min-h-[24px]">
                {tagsInput.split(',').map(s => s.trim()).filter(s => s !== '').map((tag, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 px-3 py-1 bg-kava-gold/10 text-kava-gold border border-kava-gold/20 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-kava-gold/20"
                  >
                    <span>{tag}</span>
                  </div>
                ))}
                {(tagsInput.trim() === '') && (
                  <span className="text-[10px] font-bold text-kava-muted/30 uppercase tracking-widest italic">No tags defined for this venue</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-4">Story & Atmosphere</label>
              <textarea 
                disabled={!isEditingInfo}
                value={tempBar.description}
                rows={3}
                onChange={(e) => setTempBar({...tempBar, description: e.target.value})}
                className="w-full bg-white/20 border-2 border-transparent focus:border-kava-gold/30 rounded-[32px] py-4 px-6 focus:outline-none transition-all font-medium text-kava-text/80 disabled:opacity-60 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Venue Photos - New Section */}
        <section className="kava-card space-y-8 flex flex-col transition-colors">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Camera size={24} />
              </div>
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Venue Photos</h3>
            </div>
            <div className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">
              {venuePhotos.length} / 12 PHOTOS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {venuePhotos.map((photo, idx) => (
                 <div key={idx} className="relative aspect-square rounded-[32px] overflow-hidden group border border-white/40 shadow-sm">
                   <img src={photo} alt={`Venue ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => removeFromPhotos(idx)}
                        className="p-3 bg-rose-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl"
                      >
                        <Trash2 size={20} />
                      </button>
                   </div>
                 </div>
               ))}
               {venuePhotos.length < 12 && (
                 <div className="aspect-square">
                   <ImageDropZone 
                     id="venue-photos-upload"
                     imageUrl={null}
                     onImageChange={(base64) => addToPhotos(base64)}
                     onImageRemove={() => {}}
                     label="Add Highlights"
                     className="h-full rounded-[32px] border-dashed"
                   />
                 </div>
               )}
            </div>
          </div>
          
          <div className="bg-kava-gold/5 p-6 rounded-[32px] border border-kava-gold/10">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-kava-gold shrink-0 mt-0.5" />
              <p className="text-[10px] text-kava-muted/60 font-medium leading-relaxed">
                Add high-quality photos of your atmosphere, seating, and unique features. These will be prominently 
                displayed to Explorers in the discovery feed.
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Operating Schedule - Separate Clean Card */}
        <section className="kava-card space-y-8 transition-colors flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Clock size={20} />
              </div>
              <div>
                <h4 className="font-bebas text-3xl text-kava-text tracking-wider uppercase leading-none">Operating Schedule</h4>
                <p className="text-[8px] font-black text-kava-muted/40 uppercase tracking-widest mt-1">Automatic sync across all navigation nodes</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isEditingSchedule && (
                <button 
                  type="button"
                  onClick={() => {
                    if (bar?.businessHours) {
                      setTempBar(prev => prev ? { ...prev, businessHours: bar.businessHours } : null);
                    }
                    setIsEditingSchedule(false);
                  }}
                  className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
                >
                  Discard
                </button>
              )}
              <button 
                type="button"
                onClick={async () => {
                  if (isEditingSchedule) {
                    if (tempBar?.businessHours) {
                      await persistBusinessHours(tempBar.businessHours);
                    }
                    setIsEditingSchedule(false);
                  } else {
                    setIsEditingSchedule(true);
                  }
                }}
                disabled={isSyncingHours}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                  isEditingSchedule 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-md active:scale-95' 
                    : 'bg-white/50 text-kava-muted hover:bg-kava-gold hover:text-white'
                }`}
              >
                {isSyncingHours ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : hoursSyncSuccess ? (
                  <>
                    <CheckCircle size={16} className="text-white" />
                    <span>Cloud Synced!</span>
                  </>
                ) : (
                  <>
                    {isEditingSchedule ? <Save size={16} /> : <Edit3 size={16} />}
                    {isEditingSchedule ? 'Save & Sync' : 'Edit Schedule'}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {DAYS.map(day => {
              const dayData = tempBar?.businessHours?.[day] || { open: '09:00', close: '22:00', closed: false };
              return (
                <motion.div 
                  key={day} 
                  whileHover={{ scale: 1.01 }}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[34px] border transition-all ${
                    dayData.closed ? 'bg-rose-50/10 border-rose-500/20 shadow-inner' : 'bg-white border-white shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bebas text-xl ${
                      dayData.closed ? 'bg-rose-500 text-white' : 'bg-kava-text text-white'
                    }`}>
                      {day.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <span className={`text-xs font-black uppercase tracking-[0.2em] ${dayData.closed ? 'text-rose-500' : 'text-kava-text'}`}>{day}</span>
                      <p className="text-[10px] text-kava-muted/40 font-bold uppercase tracking-widest">{dayData.closed ? 'Day of Rest' : 'Active Channel'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    {!dayData.closed ? (
                      <div className="flex items-center gap-4 bg-kava-text/5 p-2 px-4 rounded-2xl border border-white/50 shadow-inner">
                        <div className="flex flex-col">
                          <label className="text-[8px] font-black text-kava-muted/40 uppercase mb-1">Open</label>
                          <input 
                            type="time"
                            disabled={!isEditingSchedule}
                            value={dayData.open}
                            onChange={(e) => {
                              if (tempBar) {
                                const newHours = { ...tempBar.businessHours, [day]: { ...dayData, open: e.target.value } };
                                setTempBar({ ...tempBar, businessHours: newHours });
                              }
                            }}
                            className="bg-transparent border-none text-sm font-bebas text-kava-gold focus:ring-0 p-0"
                          />
                        </div>
                        <div className="h-4 w-[1px] bg-kava-text/10" />
                        <div className="flex flex-col">
                          <label className="text-[8px] font-black text-kava-muted/40 uppercase mb-1">Close</label>
                          <input 
                            type="time"
                            disabled={!isEditingSchedule}
                            value={dayData.close}
                            onChange={(e) => {
                              if (tempBar) {
                                const newHours = { ...tempBar.businessHours, [day]: { ...dayData, close: e.target.value } };
                                setTempBar({ ...tempBar, businessHours: newHours });
                              }
                            }}
                            className="bg-transparent border-none text-sm font-bebas text-kava-gold focus:ring-0 p-0"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-2 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sanctuary Closed</span>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!isEditingSchedule}
                      onClick={() => {
                        if (tempBar) {
                          const newHours = { ...tempBar.businessHours, [day]: { ...dayData, closed: !dayData.closed } };
                          setTempBar({ ...tempBar, businessHours: newHours });
                        }
                      }}
                      className={`p-3.5 rounded-2xl transition-all shadow-md active:scale-90 ${
                        dayData.closed 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                          : 'bg-rose-500 text-white shadow-rose-500/20'
                      } disabled:opacity-40 disabled:grayscale`}
                    >
                      {dayData.closed ? <Plus size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Right column stacking Operations & History + QR Code Distribution Hub */}
        <div className="space-y-10">
          {/* Operations & History */}
          <section className="kava-card flex flex-col space-y-8 transition-colors h-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Clock size={24} />
              </div>
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Operations History</h3>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              <div className="space-y-3">
                {bar.statusHistory?.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/30 p-4 rounded-2xl border border-white/40">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${log.status === 'open' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                      <span className="font-bold text-kava-text uppercase tracking-widest text-[10px]">
                        Bar {log.status === 'open' ? 'Opened' : 'Closed'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-kava-text">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      <p className="text-[8px] font-bold text-kava-muted opacity-40 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {(!bar.statusHistory || bar.statusHistory.length === 0) && (
                  <div className="text-center py-10 opacity-20 italic font-bebas text-2xl tracking-widest">
                    No Status History Recorded
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* QR Code Distribution Hub */}
          {bar && (
            <VenueQRCode venueId={bar.id} venueName={bar.name} />
          )}
        </div>
      </div>
    </div>
    )}

    {activeTab === 'engagement' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        {/* Real-time Ecosystem Social Connections Hub [v0 Engine] */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 duration-500 animate-in fade-in slide-in-from-bottom-2">
          {/* Connection Configs Panel */}
          <div className="bg-neutral-950 text-neutral-200 border border-white/10 rounded-[38px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2.5 bg-kava-gold/10 text-kava-gold rounded-full font-mono text-[8px] font-black tracking-widest uppercase border border-kava-gold/20">
                    v0 core-api
                  </div>
                  <div>
                    <h3 className="font-bebas text-2xl text-white tracking-wider">Ecosystem Social Handshakes</h3>
                    <p className="text-[8.5px] font-black uppercase tracking-widest text-neutral-400 text-left">Save & Connect Custom Channels</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8.5px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Webhook Listening</span>
                </div>
              </div>

              {/* HANDSHAKE OVERLAY ANIMATION */}
              {connectingPlatform && (
                <div className="absolute inset-0 bg-neutral-950/95 z-55 flex flex-col justify-center p-8 space-y-4">
                  <div className="text-center space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-kava-gold block animate-pulse">Establishing Signal Link...</span>
                    <h4 className="font-bebas text-2xl tracking-wide text-white uppercase">Registering {connectingPlatform.toUpperCase()} Node</h4>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10 relative">
                    <motion.div 
                      className={`h-full ${
                        connectingPlatform === 'facebook' ? 'bg-[#1877F2]' :
                        connectingPlatform === 'instagram' ? 'bg-pink-500' :
                        'bg-[#25D366]'
                      }`}
                      style={{ width: `${connectionProgress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-3xl font-mono text-[9px] text-neutral-400 h-28 overflow-y-auto space-y-1.5 custom-scrollbar">
                    {connectionLogs.map((log, i) => (
                      <div key={i} className="leading-relaxed text-left">
                        <span className="text-neutral-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTEGRATION SLOTS CONTAINER */}
              <div className="space-y-4">
                {/* 1. Facebook Page Slot */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#1877F2]/10 text-[#1877F2] rounded-xl border border-[#1877F2]/20">
                        <Facebook size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[11px] font-black text-white hover:text-[#1877F2] transition-all uppercase tracking-wider">Facebook Customer Page</h4>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${socialConfigs.facebook.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border border-white/5'}`}>
                            {socialConfigs.facebook.connected ? '🟢 Connected' : 'White Not Linked'}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-widest text-left">Auto propagation & webhook scraper</p>
                      </div>
                    </div>
                  </div>

                  {/* Config settings if connected/connecting */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wider block text-left">Custom Page URL</label>
                      <input 
                        type="text" 
                        value={socialConfigs.facebook.pageUrl}
                        onChange={(e) => {
                          const updated = { ...socialConfigs };
                          updated.facebook.pageUrl = e.target.value;
                          saveSocialConfigs(updated);
                        }}
                        placeholder="facebook.com/mykavabar" 
                        className="bg-neutral-900 border border-white/5 rounded-xl text-[10px] w-full px-3 py-1.5 focus:border-[#1877F2] outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wider block text-left">Page Verified Name</label>
                      <input 
                        type="text" 
                        value={socialConfigs.facebook.pageName}
                        onChange={(e) => {
                          const updated = { ...socialConfigs };
                          updated.facebook.pageName = e.target.value;
                          saveSocialConfigs(updated);
                        }}
                        placeholder="Page Name" 
                        className="bg-neutral-900 border border-white/5 rounded-xl text-[10px] w-full px-3 py-1.5 focus:border-[#1877F2] outline-none font-bold text-white uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 font-bold uppercase tracking-wide">
                        <input 
                          type="checkbox"
                          checked={socialConfigs.facebook.autoPush}
                          onChange={(e) => {
                            const updated = { ...socialConfigs };
                            updated.facebook.autoPush = e.target.checked;
                            saveSocialConfigs(updated);
                          }}
                          className="rounded border-white/10 bg-neutral-900 text-[#1877F2] focus:ring-[#1877F2]" 
                        />
                        <span>Auto Push</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 font-bold uppercase tracking-wide">
                        <input 
                          type="checkbox"
                          checked={socialConfigs.facebook.autoImport}
                          onChange={(e) => {
                            const updated = { ...socialConfigs };
                            updated.facebook.autoImport = e.target.checked;
                            saveSocialConfigs(updated);
                          }}
                          className="rounded border-white/10 bg-neutral-900 text-[#1877F2] focus:ring-[#1877F2]" 
                        />
                        <span>Realtime Import</span>
                      </label>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        if (socialConfigs.facebook.connected) {
                          const updated = { ...socialConfigs };
                          updated.facebook.connected = false;
                          saveSocialConfigs(updated);
                        } else {
                          triggerHandshake('facebook', { pageName: socialConfigs.facebook.pageName || 'Vanuatu Kava Cave', pageUrl: socialConfigs.facebook.pageUrl || 'facebook.com/pentecost_kava' });
                        }
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-widest cursor-pointer px-4 py-1.5 rounded-xl border transition-all ${
                        socialConfigs.facebook.connected 
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                          : 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/25'
                      }`}
                    >
                      {socialConfigs.facebook.connected ? 'Disconnect' : 'Connect & Save Page'}
                    </button>
                  </div>
                </div>

                {/* 2. Instagram Slot */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-pink-500/10 text-pink-500 rounded-xl border border-pink-500/20">
                        <Instagram size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[11px] font-black text-white hover:text-pink-500 transition-all uppercase tracking-wider">Instagram Business Handle</h4>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${socialConfigs.instagram.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border border-white/5'}`}>
                            {socialConfigs.instagram.connected ? '🟢 Connected' : 'White Not Linked'}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-widest text-left">Story synchronization & hashtag monitors</p>
                      </div>
                    </div>
                  </div>

                  {/* Config settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wider block text-left">Bio IG Handle</label>
                      <input 
                        type="text" 
                        value={socialConfigs.instagram.handle}
                        onChange={(e) => {
                          const updated = { ...socialConfigs };
                          updated.instagram.handle = e.target.value;
                          saveSocialConfigs(updated);
                        }}
                        placeholder="@kava_bar_vanuatu" 
                        className="bg-neutral-900 border border-white/5 rounded-xl text-[10px] w-full px-3 py-1.5 focus:border-pink-500 outline-none font-mono font-bold text-white shadow-inner"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wider block text-left">Tracking Hashtag</label>
                      <input 
                        type="text" 
                        value={socialConfigs.instagram.hashtag}
                        onChange={(e) => {
                          const updated = { ...socialConfigs };
                          updated.instagram.hashtag = e.target.value;
                          saveSocialConfigs(updated);
                        }}
                        placeholder="LagoonNakamal" 
                        className="bg-neutral-900 border border-white/5 rounded-xl text-[10px] w-full px-3 py-1.5 focus:border-pink-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 font-bold uppercase tracking-wide">
                        <input 
                          type="checkbox"
                          checked={socialConfigs.instagram.autoPush}
                          onChange={(e) => {
                            const updated = { ...socialConfigs };
                            updated.instagram.autoPush = e.target.checked;
                            saveSocialConfigs(updated);
                          }}
                          className="rounded border-white/10 bg-neutral-900 text-pink-600 focus:ring-pink-500" 
                        />
                        <span>Auto Push</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 font-bold uppercase tracking-wide">
                        <input 
                          type="checkbox"
                          checked={socialConfigs.instagram.autoImport}
                          onChange={(e) => {
                            const updated = { ...socialConfigs };
                            updated.instagram.autoImport = e.target.checked;
                            saveSocialConfigs(updated);
                          }}
                          className="rounded border-white/10 bg-neutral-900 text-pink-600 focus:ring-pink-500" 
                        />
                        <span>Realtime Import</span>
                      </label>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        if (socialConfigs.instagram.connected) {
                          const updated = { ...socialConfigs };
                          updated.instagram.connected = false;
                          saveSocialConfigs(updated);
                        } else {
                          triggerHandshake('instagram', { handle: socialConfigs.instagram.handle || '@LagoonNakamal', hashtag: socialConfigs.instagram.hashtag || 'LagoonNakamal' });
                        }
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-widest cursor-pointer px-4 py-1.5 rounded-xl border transition-all ${
                        socialConfigs.instagram.connected 
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                          : 'bg-pink-600/10 text-pink-600 border-pink-500/20 hover:bg-pink-600/25'
                      }`}
                    >
                      {socialConfigs.instagram.connected ? 'Disconnect' : 'Connect & Save Handle'}
                    </button>
                  </div>
                </div>

                {/* 3. WhatsApp Group Broadcast slot */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                        <Phone size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[11px] font-black text-white hover:text-emerald-500 transition-all uppercase tracking-wider">WhatsApp Broadcast Node</h4>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${socialConfigs.whatsapp.connected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border border-white/5'}`}>
                            {socialConfigs.whatsapp.connected ? '🟢 Connected' : '⚪ Not Linked'}
                          </span>
                        </div>
                        <p className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-widest text-left">Synchronize supplier chats & bulk stock alerts</p>
                      </div>
                    </div>
                  </div>

                  {/* Config settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wider block text-left">Group Invite Link</label>
                      <input 
                        type="text" 
                        value={socialConfigs.whatsapp.groupLink}
                        onChange={(e) => {
                          const updated = { ...socialConfigs };
                          updated.whatsapp.groupLink = e.target.value;
                          saveSocialConfigs(updated);
                        }}
                        placeholder="chat.whatsapp.com/KavaGroup" 
                        className="bg-neutral-900 border border-white/5 rounded-xl text-[10px] w-full px-3 py-1.5 focus:border-emerald-500 outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8.5px] text-neutral-500 font-bold uppercase tracking-wider block text-left">Linked Admin Phone</label>
                      <input 
                        type="text" 
                        value={socialConfigs.whatsapp.phone}
                        onChange={(e) => {
                          const updated = { ...socialConfigs };
                          updated.whatsapp.phone = e.target.value;
                          saveSocialConfigs(updated);
                        }}
                        placeholder="+678 554 1234" 
                        className="bg-neutral-900 border border-white/5 rounded-xl text-[10px] w-full px-3 py-1.5 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 font-bold uppercase tracking-wide">
                        <input 
                          type="checkbox"
                          checked={socialConfigs.whatsapp.autoPush}
                          onChange={(e) => {
                            const updated = { ...socialConfigs };
                            updated.whatsapp.autoPush = e.target.checked;
                            saveSocialConfigs(updated);
                          }}
                          className="rounded border-white/10 bg-neutral-900 text-emerald-600 focus:ring-emerald-500" 
                        />
                        <span>Auto Push</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[9px] text-neutral-400 font-bold uppercase tracking-wide">
                        <input 
                          type="checkbox"
                          checked={socialConfigs.whatsapp.autoImport}
                          onChange={(e) => {
                            const updated = { ...socialConfigs };
                            updated.whatsapp.autoImport = e.target.checked;
                            saveSocialConfigs(updated);
                          }}
                          className="rounded border-white/10 bg-neutral-900 text-emerald-600 focus:ring-emerald-500" 
                        />
                        <span>Auto Import</span>
                      </label>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        if (socialConfigs.whatsapp.connected) {
                          const updated = { ...socialConfigs };
                          updated.whatsapp.connected = false;
                          saveSocialConfigs(updated);
                        } else {
                          triggerHandshake('whatsapp', { groupLink: socialConfigs.whatsapp.groupLink || 'chat.whatsapp.com/KavaLagoonEcosystem', phone: socialConfigs.whatsapp.phone || '+678 554 1234' });
                        }
                      }}
                      className={`text-[9.5px] font-black uppercase tracking-widest cursor-pointer px-4 py-1.5 rounded-xl border transition-all ${
                        socialConfigs.whatsapp.connected 
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' 
                          : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-600/25'
                      }`}
                    >
                      {socialConfigs.whatsapp.connected ? 'Disconnect' : 'Connect Broadcast'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Bidirectional Webhook Signals Console & Pending imports queue */}
          <div className="bg-neutral-950 text-neutral-200 border border-white/10 rounded-[38px] p-6 shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h3 className="font-bebas text-2xl text-white tracking-wider">WebSocket Inbound Stream</h3>
                    <p className="text-[8.5px] font-black uppercase tracking-widest text-[#25D366]">The Way Around (Social ➔ Nakamal)</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => triggerSimulatedIncomingPost()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  📡 Simulate social post
                </button>
              </div>

              {/* Terminal activity Log */}
              <div className="bg-black/60 border border-white/5 p-4 rounded-3xl font-mono text-[9px] text-[#25D366] h-32 overflow-y-auto space-y-2.5 shadow-inner">
                <div className="text-neutral-500 font-bold border-b border-white/5 pb-1 flex justify-between uppercase tracking-widest text-[8px]">
                  <span>Daemon SSE Live Listeners log</span>
                  <span className="animate-pulse">● System Streaming</span>
                </div>
                <div className="leading-relaxed text-left">
                  <span className="text-neutral-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  <span className="text-neutral-200">[WS_CONNECTED]</span> Duplex web socket registered on port 3000. Listening...
                </div>
                {socialConfigs.facebook.connected && (
                  <div className="leading-relaxed text-blue-400 text-left">
                    <span className="text-neutral-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span>[FB_DAEMON]</span> Subscribed page events for "{socialConfigs.facebook.pageName}" with filter #{socialConfigs.facebook.hashtag || 'LagoonNakamal'}
                  </div>
                )}
                {socialConfigs.instagram.connected && (
                  <div className="leading-relaxed text-pink-400 text-left">
                    <span className="text-neutral-500 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    <span>[IG_DAEMON]</span> Syncing handle "{socialConfigs.instagram.handle}" feed with hashtag track #{socialConfigs.instagram.hashtag || 'LagoonNakamal'}
                  </div>
                )}
                {updates.slice(0, 1).map((x, i) => (
                  <div key={i} className="leading-relaxed text-neutral-400 italic text-left">
                    <span className="text-neutral-500 mr-2">[{new Date(x.timestamp).toLocaleTimeString()}]</span>
                    <span>[OUTBOUND_BROADCAST]</span> Dispatched news post ID: {x.id} to connected social ecosystems.
                  </div>
                ))}
              </div>

              {/* Pending incoming quarantine card list */}
              <div className="space-y-3 flex-1 flex flex-col justify-between pt-2">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block border-b border-white/5 pb-2 text-left">
                    📥 PENDING WEBHOOK IMPORTS ({simulatedFeed.length})
                  </h4>

                  <div className="max-h-[185px] overflow-y-auto space-y-3 pr-2 custom-scrollbar mt-2">
                    {simulatedFeed.map((post) => (
                      <motion.div 
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-neutral-900 border border-white/10 p-3.5 rounded-2xl relative overflow-hidden"
                      >
                        {/* Brand Tag Top right */}
                        <div className="absolute top-2.5 right-3 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest leading-none">
                          {post.source === 'facebook' && <span className="text-[#1877F2]">Facebook Page</span>}
                          {post.source === 'instagram' && <span className="text-pink-500">Instagram Handle</span>}
                          {post.source === 'whatsapp' && <span className="text-[#25D366]">WhatsApp Chat</span>}
                        </div>

                        <div className="flex gap-3">
                          {post.imageUrl && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-neutral-950">
                              <img src={post.imageUrl} alt={post.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="space-y-1.5 flex-1 select-none text-left">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-[8px]">
                                {post.authorAvatar}
                              </div>
                              <span className="text-[10px] uppercase font-black tracking-wider text-white leading-none block">{post.author}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-normal line-clamp-2 italic">
                              "{post.description}"
                            </p>

                            <div className="flex gap-2.5 pt-1 border-t border-white/5 mt-1">
                              <button
                                type="button"
                                onClick={() => importSimulatedPost(post.id)}
                                className="text-[9px] font-black uppercase text-emerald-400 hover:text-emerald-300 tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                🚀 Sync Webhook feed
                              </button>
                              <button
                                type="button"
                                onClick={() => dismissSimulatedPost(post.id)}
                                className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400 tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                [Dismiss]
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {simulatedFeed.length === 0 && (
                      <div className="text-center py-5 border border-dashed border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        No pending webhook messages. Click "Simulate social post" above!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Pulse / Photos & Notices */}
        <section className="kava-card flex flex-col space-y-8 transition-colors">
          <div className="flex justify-between items-center">
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">
              {isEditingUpdate ? 'Refine Post' : 'Engagement Pulse'}
            </h3>
            {isEditingUpdate && (
              <button 
                onClick={() => {
                  setIsEditingUpdate(null);
                  setNewUpdate({ type: 'notice', title: '', description: '', imageUrl: '', adImageUrl: '', visibility: 'public' });
                  setFilePreview(null);
                  setAdFilePreview(null);
                }}
                className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handlePostUpdate} className="bg-white/50 rounded-[32px] p-6 space-y-4 border border-white/40 shadow-sm">
            <div className="flex gap-2">
              {(['notice', 'event', 'product'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewUpdate({...newUpdate, type})}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    newUpdate.type === type ? 'bg-kava-gold text-white shadow-md' : 'bg-kava-text/5 text-kava-muted'
                  }`}
                >
                  {type === 'notice' && <Megaphone size={12} className="inline mr-1" />}
                  {type === 'event' && <Calendar size={12} className="inline mr-1" />}
                  {type === 'product' && <Camera size={12} className="inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black uppercase text-kava-gold tracking-widest block ml-1 select-none">
                  📢 CUSTOM SOCIAL POSTER HEADER & HEADLINE BROADCAST TITLE
                </label>
                <input 
                  placeholder="Ex: SPECIAL PENTECOST STONE-GROUND LATERAL BREW TONIGHT"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
                  className="w-full bg-white/55 border border-white/80 rounded-2xl py-3.5 px-4 focus:ring-2 focus:ring-kava-gold/30 text-xs font-black uppercase tracking-wider shadow-sm"
                />
              </div>
              
              {newUpdate.type === 'event' && (
                <div className="flex items-center gap-3 bg-white/30 p-2 px-4 rounded-2xl border border-white/20">
                  <span className="text-[10px] font-bold text-kava-muted uppercase tracking-widest">Event Date</span>
                  <input 
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs font-bold text-kava-text focus:ring-0 p-0"
                  />
                </div>
              )}

              <textarea 
                placeholder="Tell your story or share details..."
                value={newUpdate.description}
                rows={2}
                onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                className="w-full bg-white/50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 text-sm font-medium resize-none shadow-sm"
              />
            </div>

            <div className="flex gap-2">
              {(['public', 'business'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setNewUpdate({...newUpdate, visibility: v})}
                  className={`flex-1 py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                    newUpdate.visibility === v 
                      ? 'bg-kava-text text-white border-kava-text shadow-md' 
                      : 'bg-transparent text-kava-muted border-kava-text/5 hover:border-kava-text/10'
                  }`}
                >
                   {v === 'business' ? '🔒 Market Feed' : '🌐 Explorer Feed'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-[0.2em] ml-2">Main Transmission Hub Visual</label>
                <ImageDropZone 
                  id="manager-photo-upload"
                  imageUrl={filePreview}
                  onImageChange={(base64) => { setFilePreview(base64); setNewUpdate({...newUpdate, imageUrl: base64}); }}
                  onImageRemove={() => { setFilePreview(null); setNewUpdate({...newUpdate, imageUrl: ''}); }}
                  label="Primary post image"
                  className="h-44"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-[0.2em] ml-2">Advertising or Posters Advertising</label>
                <ImageDropZone 
                  id="manager-ad-photo-upload"
                  imageUrl={adFilePreview}
                  onImageChange={(base64) => { setAdFilePreview(base64); setNewUpdate({...newUpdate, adImageUrl: base64}); }}
                  onImageRemove={() => { setAdFilePreview(null); setNewUpdate({...newUpdate, adImageUrl: ''}); }}
                  label="Add poster / ad visual"
                  className="h-44"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-kava-text text-white rounded-2xl font-bebas text-2xl tracking-widest hover:bg-kava-gold transition-all shadow-lg active:scale-[0.98]"
            >
              {isEditingUpdate ? 'Save Update' : 'Post to Feed'}
            </button>
          </form>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {updates.map((upd) => (
              <div key={upd.id} className="group bg-white/30 rounded-3xl overflow-hidden border border-white/40 flex h-28 hover:shadow-md transition-all">
                <div className="flex shrink-0">
                  {upd.imageUrl && (
                    <div className="w-28 bg-kava-text/10">
                      <img src={upd.imageUrl} alt={upd.title} className="w-full h-full object-cover border-r border-white/10" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  {upd.adImageUrl && (
                    <div className="w-28 bg-kava-text/10">
                      <img src={upd.adImageUrl} alt="Ad" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-bold text-kava-gold uppercase tracking-[2px]">{upd.type}</span>
                        <span className={`text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                          upd.isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {upd.isApproved ? 'Live' : 'Pending'}
                        </span>
                        {upd.type === 'event' && (
                          <span className="text-[8px] font-bold text-kava-muted opacity-40 uppercase tracking-widest">
                            {new Date(upd.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-kava-text leading-tight truncate text-sm">{upd.title}</h4>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editUpdate(upd)} className="p-1.5 text-kava-muted/40 hover:text-kava-gold transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => removeUpdate(upd.id)} className="p-1.5 text-kava-muted/40 hover:text-rose-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-kava-text/5">
                    <p className="text-[10px] text-kava-muted/80 line-clamp-1 leading-relaxed font-medium flex-1 mr-4">{upd.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button 
                        onClick={() => triggerSocialTransmitter(upd, 'facebook')}
                        className="flex items-center gap-1 px-2 py-1 bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-lg transition-all text-[8px] font-black uppercase tracking-widest border border-[#1877F2]/20 cursor-pointer"
                        title="Transmit to Facebook Page"
                      >
                        <Facebook size={10} />
                        FB Export
                      </button>
                      <button 
                        onClick={() => triggerSocialTransmitter(upd, 'instagram')}
                        className="flex items-center gap-1 px-2 py-1 bg-pink-600/10 hover:bg-pink-600 text-pink-600 hover:text-white rounded-lg transition-all text-[8px] font-black uppercase tracking-widest border border-pink-500/20 cursor-pointer"
                        title="Transmit to Instagram Feed"
                      >
                        <Instagram size={10} />
                        IG Export
                      </button>
                      <button 
                        onClick={() => triggerSocialTransmitter(upd, 'whatsapp')}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg transition-all text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 cursor-pointer"
                        title="Transmit to WhatsApp Broadcast"
                      >
                        <Phone size={10} />
                        WA Export
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {updates.length === 0 && <div className="text-center py-10 text-kava-muted/40 text-[10px] font-bold uppercase tracking-widest italic">No updates posted yet</div>}
          </div>
        </section>
      </div>
    )}

    {activeTab === 'tasks' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
        <div className="flex justify-between items-center">
            <h3 className="font-bebas text-5xl text-kava-text uppercase tracking-wider">Operational Tasks</h3>
            <button 
              onClick={() => setIsTaskFormOpen(true)}
              className="flex items-center gap-3 px-8 py-4 bg-kava-gold text-white rounded-[24px] font-bebas text-2xl tracking-[0.2em] shadow-xl shadow-kava-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus size={24} />
              New Task
            </button>
        </div>

        {/* Context-Aware "Alive" Ecosystem Health Monitor Dashboard */}
        {(() => {
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.status === 'Completed').length;
          const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
          
          // Shifting dynamic glowing state
          const dynamicGlow = completionRate === 1
            ? 'from-emerald-500/20 to-teal-500/20 shadow-[0_0_80px_rgba(16,185,129,0.3)] border-emerald-500/30'
            : completionRate > 0.4
            ? 'from-amber-500/15 to-emerald-500/15 shadow-[0_0_60px_rgba(245,158,11,0.2)] border-amber-500/20'
            : 'from-kava-gold/10 to-transparent shadow-[0_0_40px_rgba(230,160,23,0.1)] border-kava-gold/15';

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden p-8 rounded-[38px] border-2 bg-gradient-to-br transition-all duration-700 ${dynamicGlow} kava-glass flex flex-col md:flex-row items-center justify-between gap-6`}
            >
              {/* Dynamic decorative backdrop shape */}
              <div 
                className="absolute -right-16 -top-16 w-72 h-72 rounded-full blur-3xl opacity-25 mix-blend-screen animate-pulse bg-gradient-to-tr from-kava-gold to-emerald-400" 
                style={{ animationDuration: '6s', transform: `scale(${1 + completionRate * 0.3})` }} 
              />
              
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-kava-muted/80">Operations Intelligence Matrix</span>
                </div>
                <h4 className="font-bebas text-4xl text-kava-text leading-tight">
                  {completionRate === 1 ? "ECOSYSTEM OPTIMIZED" : completionRate > 0 ? "COGNITIVE TASK FLOW: MERGING" : "STANDBY ENGINE ONLINE"}
                </h4>
                <p className="text-xs font-semibold text-kava-muted/80 mt-1 max-w-xl leading-relaxed">
                  The interface context shifts fluidly based on task compliance. Resolve active items to balance the node's performance metrics and keep the nakamal running optimally.
                </p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-black/25 border border-white/60 dark:border-white/5 rounded-3xl min-w-[180px] shadow-lg shadow-black/5">
                <div className="relative mb-3 flex items-center justify-center">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-r transition-all duration-500 flex items-center justify-center ${
                    completionRate === 1 ? 'from-emerald-400 to-teal-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 
                    completionRate > 0.4 ? 'from-amber-400 to-emerald-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
                    'from-kava-gold to-amber-500'
                  }`}>
                    <CheckCircle size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <span className="font-bebas text-4xl text-kava-text block leading-none">{completedTasks} / {totalTasks}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-kava-muted/70 block mt-1">Resolution ({Math.round(completionRate * 100)}%)</span>
                </div>
              </div>
            </motion.div>
          );
        })()}

        <section className="kava-holographic-glass p-8 rounded-[40px] min-h-[600px] flex flex-col relative z-15">
          <div className="space-y-4 flex-1">
            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {tasks.map(task => (
                    <motion.div 
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94, y: 15 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -15 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
                      className={`group p-6 rounded-[32px] border-2 transition-all duration-300 kava-holographic-glass relative overflow-hidden ${
                        task.status === 'Completed' 
                          ? 'border-emerald-500/30' 
                          : task.priority === 'High'
                            ? 'border-rose-500 bg-gradient-to-br from-rose-500/[0.03] to-transparent dark:from-rose-500/[0.01] shadow-2xl shadow-rose-500/10'
                            : 'border-white dark:border-white/5 shadow-xl shadow-kava-text/5'
                      }`}
                    >
                      {task.priority === 'High' && task.status !== 'Completed' && (
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 animate-pulse z-10" />
                      )}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => toggleTaskStatus(task)}
                              className={`p-2.5 rounded-2xl transition-all duration-200 active:scale-90 ${
                                task.status === 'Completed' 
                                  ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.4)]' 
                                  : 'bg-kava-text/5 text-kava-muted hover:bg-emerald-500/10 hover:text-emerald-500'
                              }`}
                            >
                              <CheckCircle size={18} />
                            </button>
                            <h4 className={`font-bold text-base leading-tight transition-all duration-300 ${
                              task.status === 'Completed' ? 'text-kava-text/40 line-through decoration-emerald-500/40 opacity-70' : 'text-kava-text'
                            }`}>
                              {task.title}
                            </h4>
                          </div>
                          {task.priority === 'High' && task.status !== 'Completed' && (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest animate-pulse w-fit ml-12">
                              <AlertTriangle size={10} className="stroke-[3]" /> Urgent Logistics Needs
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all duration-300 ${
                            task.priority === 'High' ? 'bg-rose-500 text-white border-rose-600 shadow-[0_2px_8px_rgba(244,63,94,0.3)]' :
                            task.priority === 'Medium' ? 'bg-amber-500 text-white border-amber-600 shadow-[0_2px_8px_rgba(245,158,11,0.2)]' :
                            'bg-emerald-500 text-white border-emerald-600'
                          }`}>
                            {task.priority}
                          </span>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-kava-muted opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {task.description && (
                        <p className={`text-xs font-semibold leading-relaxed mb-4 px-1 transition-all duration-300 ${
                          task.status === 'Completed' ? 'text-kava-muted opacity-30 italic' : 'text-kava-muted'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-kava-text/5 flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-[8px] font-black text-kava-muted/30 uppercase tracking-widest font-mono">
                          <Clock size={10} />
                          Added {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                        {task.dueDate && (
                          <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-widest font-mono ${
                            task.status === 'Completed'
                              ? 'text-kava-muted/30'
                              : Date.now() > task.dueDate
                                ? 'text-rose-500 animate-pulse'
                                : 'text-amber-500'
                          }`}>
                            <Calendar size={10} />
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-8 py-40">
                <div className="p-10 bg-kava-text/5 rounded-[60px] animate-pulse">
                  <CheckCircle size={80} strokeWidth={1} />
                </div>
                <div className="text-center">
                  <p className="font-bebas text-5xl uppercase tracking-[0.2em]">Operational Zero</p>
                  <p className="text-[10px] font-bold uppercase tracking-[4px]">No active tasks detected in this node</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Task Modal */}
        <AnimatePresence>
          {isTaskFormOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsTaskFormOpen(false)}
                className="absolute inset-0 bg-kava-bg/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative z-10 w-full max-w-xl bg-kava-surface rounded-[48px] border-[3px] border-white shadow-2xl p-10"
              >
                <div className="flex justify-between items-center mb-10">
                  <h3 className="font-bebas text-5xl text-kava-text">Create Task</h3>
                  <button onClick={() => setIsTaskFormOpen(false)} className="p-3 hover:bg-black/5 rounded-2xl transition-all">
                    <X size={24} className="text-kava-muted" />
                  </button>
                </div>

                <form onSubmit={handleAddTask} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Task Title</label>
                    <input 
                      autoFocus
                      required
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="e.g. Refill Shell Inventory"
                      className="w-full bg-white border border-white rounded-[32px] py-6 px-10 text-xl font-bold text-kava-text focus:ring-4 focus:ring-kava-gold/10 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Description (Optional)</label>
                    <textarea 
                      value={newTask.description}
                      onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                      placeholder="Details and operational notes..."
                      className="w-full bg-white border border-white rounded-[32px] py-6 px-10 text-base font-medium text-kava-text focus:ring-4 focus:ring-kava-gold/10 outline-none transition-all resize-none h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Priority Level</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['Low', 'Medium', 'High'].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTask({...newTask, priority: p as TaskPriority})}
                          className={`py-4 rounded-[24px] font-bold text-[10px] uppercase tracking-widest border-2 transition-all ${
                            newTask.priority === p 
                              ? (p === 'High' ? 'bg-rose-500 border-rose-500 text-white' : 
                                 p === 'Medium' ? 'bg-amber-500 border-amber-500 text-white' : 
                                 'bg-emerald-500 border-emerald-500 text-white')
                              : 'bg-white border-white text-kava-muted'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Due Date (Optional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-kava-muted">
                        <Calendar size={18} />
                      </div>
                      <input 
                        type="date"
                        value={newTask.dueDate || ''}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        className="w-full bg-white border border-white rounded-[32px] py-6 pl-20 pr-10 text-base font-medium text-kava-text focus:ring-4 focus:ring-kava-gold/10 outline-none transition-all cursor-pointer"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-6 bg-kava-gold text-white rounded-[32px] font-bebas text-3xl tracking-[0.2em] shadow-xl shadow-kava-gold/20 hover:scale-[1.02] active:scale-95 transition-all mt-6"
                  >
                    Authorize Task
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    )}

    {activeTab === 'logistics' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* B2B Market Feed */}
        <section className="kava-card flex flex-col space-y-8 transition-colors">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Store size={24} />
              </div>
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Market Pulse</h3>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Megaphone size={14} className="text-kava-gold" />
                  <h4 className="text-[10px] font-black text-kava-muted uppercase tracking-widest">Global Announcements</h4>
                </div>
                <div className="h-[1px] flex-1 bg-kava-text/5 mx-4" />
              </div>
              {marketUpdates.map((upd) => (
                <div key={upd.id} className="bg-white/30 rounded-3xl overflow-hidden border border-white/40 flex flex-col hover:shadow-md transition-all">
                  <div className="flex bg-kava-text/10">
                    {upd.imageUrl && (
                      <div className="h-32 flex-1">
                        <img src={upd.imageUrl} alt={upd.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {upd.adImageUrl && (
                      <div className="h-32 flex-1 border-l border-white/10">
                        <img src={upd.adImageUrl} alt="Ad" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-[2px]">{upd.type}</span>
                         <span className="text-[8px] font-bold text-kava-muted opacity-40 uppercase tracking-widest">{new Date(upd.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <h4 className="font-bold text-kava-text leading-tight text-sm">{upd.title}</h4>
                    <p className="text-[10px] text-kava-muted/80 line-clamp-3 leading-relaxed font-medium">{upd.description}</p>
                  </div>
                </div>
              ))}
              {marketUpdates.length === 0 && (
                <div className="text-center py-10 opacity-20 italic text-[10px] font-bold uppercase tracking-widest">No market updates</div>
              )}

              <div className="flex items-center justify-between px-2 pt-4 border-t border-kava-text/5">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-kava-gold" />
                  <h4 className="text-[10px] font-black text-kava-muted uppercase tracking-widest">Supplier Catalog</h4>
                </div>
                <div className="h-[1px] flex-1 bg-kava-text/5 mx-4" />
              </div>
              <div className="grid grid-cols-2 gap-4 pb-4">
                {supplierProducts.map((prod) => (
                  <div key={prod.id} className="bg-white/20 rounded-[32px] border border-white/40 overflow-hidden flex flex-col group/prod hover:border-kava-gold/30 transition-all shadow-sm">
                    {prod.imageUrl ? (
                      <div className="h-32 overflow-hidden relative">
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/prod:opacity-100 transition-opacity" />
                        {unreadCounts[prod.supplierId] > 0 && (
                          <div className="absolute top-3 right-3 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                        )}
                      </div>
                    ) : (
                      <div className="h-32 bg-kava-text/5 flex items-center justify-center text-kava-muted/20">
                        <Package size={32} />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h5 className="text-xs font-bold text-kava-text truncate leading-tight">{prod.name}</h5>
                      {(() => {
                        const supp = storage.getUsers().find(u => u.id === prod.supplierId);
                        return (
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-kava-muted/80 uppercase tracking-wide truncate">
                              {supp?.name || 'Kava Supplier'}
                            </span>
                            {supp?.supplierTitle && (
                              <span className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${
                                supp.supplierTitle === 'Green Kava' ? 'text-emerald-500' :
                                supp.supplierTitle === 'Sun-Dried Kava (Powder)' ? 'text-amber-500' :
                                'text-blue-500'
                              }`}>
                                🌿 {supp.supplierTitle}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-between">
                        <span className="font-bebas text-xl text-kava-gold tracking-widest">{formatPrice(prod.price)}</span>
                        <button 
                          onClick={() => selectSupplier(prod.supplierId)}
                          className="p-2.5 bg-kava-text text-white rounded-xl hover:bg-kava-gold transition-all shadow-lg active:scale-90"
                          title="Contact Supplier"
                        >
                          <MessageCircle size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {supplierProducts.length === 0 && (
                <div className="text-center py-10 opacity-20 italic text-[10px] font-bold uppercase tracking-widest">No products in catalog</div>
              )}
            </div>
          </div>
        </section>
      </div>
    )}

    {activeTab === 'inventory' && (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Menu Management */}
        <section className="kava-card flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Inventory Menu</h3>
            <button 
              onClick={addMenuItem}
              className="p-3 bg-kava-gold text-white rounded-2xl hover:bg-kava-gold/80 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-kava-gold/20"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {menu.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-6 bg-white/30 p-6 rounded-[32px] border border-white/40 hover:border-kava-gold/30 transition-all group relative shadow-sm">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Item Photo & Status */}
                  <div className="w-full md:w-32 space-y-3">
                    <ImageDropZone 
                      id={`menu-item-photo-${idx}`}
                      imageUrl={item.imageUrl}
                      onImageChange={(base64) => {
                        updateMenuItem(idx, 'imageUrl', base64);
                        saveMenu([...menu.slice(0, idx), { ...item, imageUrl: base64 }, ...menu.slice(idx + 1)]);
                      }}
                      onImageRemove={() => {
                        updateMenuItem(idx, 'imageUrl', '');
                        saveMenu([...menu.slice(0, idx), { ...item, imageUrl: '' }, ...menu.slice(idx + 1)]);
                      }}
                      className="aspect-square rounded-2xl"
                      label="Img"
                    />
                    <select 
                      value={item.status || 'In Stock'}
                      onChange={(e) => {
                        updateMenuItem(idx, 'status', e.target.value as any);
                        saveMenu([...menu.slice(0, idx), { ...item, status: e.target.value as any }, ...menu.slice(idx + 1)]);
                      }}
                      className="w-full bg-kava-text/5 border-none rounded-xl px-3 py-2 text-[10px] font-bold text-kava-text focus:ring-1 focus:ring-kava-gold/30 cursor-pointer text-center uppercase tracking-widest"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Low Stock">Low</option>
                      <option value="Out of Stock">Out</option>
                    </select>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-kava-muted/40 uppercase tracking-widest ml-2">Display Name</label>
                        <input 
                          value={item.name}
                          onChange={(e) => updateMenuItem(idx, 'name', e.target.value)}
                          onBlur={() => saveMenu(menu)}
                          placeholder="e.g. Fresh Green Kava"
                          className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-sm font-bold text-kava-text focus:ring-2 focus:ring-kava-gold/30"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-1.5 ml-2">
                          <span className="text-[7.5px] font-black text-kava-muted/50 uppercase mr-1 self-center">Suggest:</span>
                          {["Borogu Kava", "Melo Melo Kava", "Morning Fresh Kava"].map(suggestion => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                updateMenuItem(idx, 'name', suggestion);
                                saveMenu([
                                  ...menu.slice(0, idx),
                                  { ...item, name: suggestion },
                                  ...menu.slice(idx + 1)
                                ]);
                              }}
                              className="text-[8.5px] font-black uppercase text-kava-gold bg-kava-gold/10 hover:bg-kava-gold/20 hover:scale-105 border border-kava-gold/20 px-2 py-0.5 rounded-full transition-all cursor-pointer"
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeMenuItem(idx)}
                        className="p-2 text-kava-muted/20 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-kava-muted/40 uppercase tracking-widest ml-2">Category</label>
                        <select 
                          value={item.category || 'Kava'}
                          onChange={(e) => {
                            updateMenuItem(idx, 'category', e.target.value);
                            saveMenu([...menu.slice(0, idx), { ...item, category: e.target.value }, ...menu.slice(idx + 1)]);
                          }}
                          className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-[10px] font-bold text-kava-text focus:ring-2 focus:ring-kava-gold/30"
                        >
                          {['Kava', 'Chasers', 'Food', 'Craft Beer', 'Soft Drinks', 'Tobacco'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-kava-muted/40 uppercase tracking-widest ml-2">Description</label>
                        <input 
                          value={item.description || ''}
                          onChange={(e) => updateMenuItem(idx, 'description', e.target.value)}
                          onBlur={() => saveMenu(menu)}
                          placeholder="Short tagline or notes..."
                          className="w-full bg-white/50 border-none rounded-xl px-4 py-2 text-[10px] font-medium text-kava-text focus:ring-2 focus:ring-kava-gold/30"
                        />
                      </div>
                    </div>

                    <div className="flex items-end gap-6 pt-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-kava-gold uppercase tracking-widest ml-2">
                          Standard Price (VUV) {item.price ? `[ ≈ ${formatPrice(item.price)} ]` : ''}
                        </label>
                        <div className="flex items-center gap-2 bg-kava-gold/5 rounded-xl px-4 py-1.5 border border-kava-gold/10">
                          <input 
                            type="number"
                            value={item.price}
                            onChange={(e) => updateMenuItem(idx, 'price', parseInt(e.target.value) || 0)}
                            onBlur={() => saveMenu(menu)}
                            className="bg-transparent border-none focus:ring-0 font-bebas text-2xl text-kava-gold w-full text-center"
                          />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="text-[8px] font-black text-rose-500 uppercase tracking-widest ml-2">Promotion (Optional)</label>
                        <div className={`flex items-center gap-2 rounded-xl px-4 py-1.5 border transition-all ${item.promotionPrice ? 'bg-rose-500 border-rose-600 text-white shadow-lg' : 'bg-kava-text/5 border-transparent'}`}>
                          <input 
                            type="number"
                            placeholder="Sale Price"
                            value={item.promotionPrice ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                              updateMenuItem(idx, 'promotionPrice', val as any);
                            }}
                            onBlur={() => saveMenu(menu)}
                            className={`bg-transparent border-none focus:ring-0 font-bebas text-2xl w-full text-center placeholder:text-current placeholder:opacity-30 ${item.promotionPrice ? 'text-white' : 'text-kava-gold'}`}
                          />
                        </div>
                        {item.promotionPrice !== undefined && item.promotionPrice >= item.price && (
                          <div className="flex items-center gap-2 mt-1 px-2 py-0.5 bg-rose-500/10 rounded-lg">
                            <AlertTriangle size={10} className="text-rose-500" />
                            <p className="text-[7px] font-black text-rose-500 uppercase tracking-widest">Price Alert: Promo is higher than Standard</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {menu.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-kava-muted/30 py-20 space-y-4">
                <div className="font-bebas text-4xl uppercase opacity-20 italic">Empty Inventory</div>
                <p className="text-xs font-bold uppercase tracking-widest">Click plus to add your first craft item</p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-kava-text/5 text-center">
            <p className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest">Changes are saved automatically to the collective store</p>
          </div>
        </section>
      </div>
    )}

    <AnimatePresence>
      {isBillingOpen && (
        <BillingDashboard 
          user={user} 
          onUpdateUser={onUpdateUser!} 
          onClose={() => setIsBillingOpen(false)} 
          />
      )}
    </AnimatePresence>

    {/* Real-Time Social Ecosystem Transmitter Broadcast Console Modal */}
    <AnimatePresence>
      {activeTransmitterUpdate && transmitterPlatform && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-neutral-950 text-neutral-200 w-full max-w-lg rounded-[40px] border border-white/10 overflow-hidden shadow-2xl p-6 relative"
          >
            {/* Ambient Background Glow */}
            <div className={`absolute -inset-10 opacity-10 pointer-events-none blur-3xl transition-all ${
              transmitterPlatform === 'facebook' ? 'bg-blue-600' :
              transmitterPlatform === 'instagram' ? 'bg-pink-600' :
              'bg-emerald-600'
            }`} />

            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl text-white ${
                  transmitterPlatform === 'facebook' ? 'bg-[#1877F2]' :
                  transmitterPlatform === 'instagram' ? 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' :
                  'bg-[#25D366]'
                }`}>
                  {transmitterPlatform === 'facebook' && <Facebook size={18} />}
                  {transmitterPlatform === 'instagram' && <Instagram size={18} />}
                  {transmitterPlatform === 'whatsapp' && <Phone size={18} />}
                </div>
                <div>
                  <h4 className="font-bebas text-2xl text-white tracking-widest uppercase mb-0.5">Social Edge Transmitter</h4>
                  <p className="text-[9px] font-black uppercase text-kava-gold/80 tracking-[3.5px]">API Node Broadcaster</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTransmitterUpdate(null)}
                className="p-2 hover:bg-white/5 rounded-full text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 relative z-10">
              {/* Progress and status */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  <span>Status: {transmitterState === 'done' ? '🚀 TRANSMISSION SUCCESS' : '📡 ATOMIZING PAYLOAD...'}</span>
                  <span>{transmitterProgress}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${
                      transmitterPlatform === 'facebook' ? 'bg-[#1877F2]' :
                      transmitterPlatform === 'instagram' ? 'bg-pink-500' :
                      'bg-[#25D366]'
                    }`}
                    style={{ width: `${transmitterProgress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Status checklist stepper */}
              <div className="space-y-2.5 bg-white/5 p-4 rounded-3xl border border-white/5 text-[10px] font-mono leading-normal text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className={transmitterProgress >= 25 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                    {transmitterProgress >= 25 ? "✓" : "⚡"}
                  </span>
                  <span>API Authentication handshake verified [OAuth Token Client Active]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={transmitterProgress >= 60 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                    {transmitterProgress >= 60 ? "✓" : "⚡"}
                  </span>
                  <span>Rendering custom graphic metadata headers (REAL-TIME POSTER)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={transmitterProgress >= 100 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                    {transmitterProgress >= 100 ? "✓" : "⚡"}
                  </span>
                  <span>Broadcast symmetric synchronization completed across Edge nodes</span>
                </div>
              </div>

              {/* Once completed, show visual mock of post! */}
              {transmitterState === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 bg-neutral-900 border border-white/10 rounded-3xl p-5 overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-[9px] font-black tracking-widest uppercase text-neutral-500">Live Client Mock Preview</span>
                    <span className="text-[8px] px-2 py-0.5 border border-emerald-500/20 text-emerald-400 rounded-full font-black uppercase tracking-widest animate-pulse">Published Live</span>
                  </div>

                  {/* Header/Title poster block */}
                  <div className="bg-neutral-950 p-4 rounded-2xl space-y-3.5 border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-kava-gold flex items-center justify-center font-bebas text-lg text-white">
                        {bar.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black text-white leading-none uppercase tracking-wide">{bar.name}</h5>
                        <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest">Sponsored Edge Node</p>
                      </div>
                    </div>

                    {/* Social Poster Headline is styled prominently inside the mockup */}
                    <div className="space-y-2">
                      <div className="bg-kava-gold/10 border-l-4 border-kava-gold p-2.5 rounded-r-xl">
                        <span className="text-[8px] font-black uppercase tracking-widest text-kava-gold block mb-0.5">Poster Graphic Title / Banner:</span>
                        <h6 className="text-[11px] font-bold text-white tracking-wide leading-snug uppercase">
                          {activeTransmitterUpdate.title}
                        </h6>
                      </div>

                      {activeTransmitterUpdate.imageUrl && (
                        <div className="rounded-xl overflow-hidden aspect-video border border-white/10 relative">
                          <img 
                            src={activeTransmitterUpdate.imageUrl} 
                            alt={activeTransmitterUpdate.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <p className="text-[10.5px] text-neutral-400 leading-normal font-sans italic">
                        "{activeTransmitterUpdate.description}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {transmitterState === 'done' && (
                <button
                  onClick={() => setActiveTransmitterUpdate(null)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/10 cursor-pointer"
                >
                  Dismiss & Return to Dashboard
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}
