import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { User, Product, Bar, BarUpdate, Task, TaskPriority } from '../types';
import { productService } from '../services/productService';
import { chatService, Chat, ChatMessage } from '../services/chatService';
import { barService } from '../services/barService';
import { taskService } from '../services/taskService';
import { Plus, Trash2, Package, Tag, ShoppingCart, Navigation, Clock, Info, Store, Bell, AlertCircle, MessageCircle, ChevronRight, X, Send, Camera, MessageSquare, Settings, Award, FileText, CheckCircle2, Upload, Volume2, VolumeX, CreditCard, AlertTriangle, CheckCircle, Search, Globe, Phone, Facebook, Instagram, Link, MapPin, Pencil, Edit, Calendar, DollarSign, Power, Sprout, TrendingUp, Sliders } from 'lucide-react';
import BusinessMap from './BusinessMap';
import { motion, AnimatePresence } from 'motion/react';
import { feedbackService } from '../services/feedbackService';
import BillingDashboard from './BillingDashboard';
import FinanceDashboard from './FinanceDashboard';
import ImageDropZone from './ImageDropZone';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';

interface SupplierBoardProps {
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

export default function SupplierBoard({ user, onUpdateUser, onLogout }: SupplierBoardProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'estimator' | 'inventory' | 'messages'>(() => {
    return (localStorage.getItem('supplier_active_tab') as any) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('supplier_active_tab', activeTab);
  }, [activeTab]);

  // Farming & Kava Plant Estimator states
  const [estimatedPlants, setEstimatedPlants] = useState<number>(() => {
    const saved = localStorage.getItem('supplier_est_plants');
    return saved ? Number(saved) : 500;
  });
  const [yieldPerPlant, setYieldPerPlant] = useState<number>(() => {
    const saved = localStorage.getItem('supplier_yield_per_plant');
    return saved ? Number(saved) : 1.0;
  });
  const [selectedPricingRegion, setSelectedPricingRegion] = useState<'Luganville' | 'PortVila' | 'Custom'>(() => {
    return (localStorage.getItem('supplier_pricing_region') as any) || 'Luganville';
  });
  const [customPricePerKg, setCustomPricePerKg] = useState<number>(() => {
    const saved = localStorage.getItem('supplier_custom_price');
    return saved ? Number(saved) : 1000;
  });

  useEffect(() => {
    localStorage.setItem('supplier_est_plants', String(estimatedPlants));
  }, [estimatedPlants]);
  useEffect(() => {
    localStorage.setItem('supplier_yield_per_plant', String(yieldPerPlant));
  }, [yieldPerPlant]);
  useEffect(() => {
    localStorage.setItem('supplier_pricing_region', selectedPricingRegion);
  }, [selectedPricingRegion]);
  useEffect(() => {
    localStorage.setItem('supplier_custom_price', String(customPricePerKg));
  }, [customPricePerKg]);

  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('switchTab', handleSwitchTab);
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab);
    };
  }, []);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const query = productSearch.toLowerCase().trim();
    if (!query) {
      setResults(products);
    } else {
      const filtered = products.filter(p => {
        const matchesName = p.name ? p.name.toLowerCase().includes(query) : false;
        const matchesDesc = p.description ? p.description.toLowerCase().includes(query) : false;
        const matchesTags = Array.isArray(p.tags)
          ? p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(query))
          : false;
        return matchesName || matchesDesc || matchesTags;
      });
      setResults(filtered);
    }
  }, [productSearch, products]);
  const [servedBars, setServedBars] = useState<Bar[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<ChatMessage[]>([]);
  const [chatWithBar, setChatWithBar] = useState<Bar | null>(null);
  const [chatText, setChatText] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAnalyzingMsg, setIsAnalyzingMsg] = useState(false);
  const [msgAnalysis, setMsgAnalysis] = useState<string | null>(null);
  const [marketUpdates, setMarketUpdates] = useState<BarUpdate[]>([]);
  const [newUpdate, setNewUpdate] = useState({
    type: 'notice' as 'product' | 'event' | 'notice',
    title: '',
    description: '',
    imageUrl: '',
    adImageUrl: '',
    visibility: 'business' as 'public' | 'business'
  });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [adFilePreview, setAdFilePreview] = useState<string | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importSource, setImportSource] = useState<'facebook' | 'instagram' | 'whatsapp'>('facebook');
  const [socialImportUrl, setSocialImportUrl] = useState('');
  
  // Real-time Social Transmitter States (Supplier Feed Exports)
  const [activeTransmitterUpdate, setActiveTransmitterUpdate] = useState<BarUpdate | null>(null);
  const [transmitterPlatform, setTransmitterPlatform] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null);
  const [transmitterProgress, setTransmitterProgress] = useState(0);
  const [transmitterState, setTransmitterState] = useState<'idle' | 'transmitting' | 'done'>('idle');
  
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isEditingMapLocation, setIsEditingMapLocation] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('kava_muted') === 'true');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const typingControllerRef = React.useRef<{ setTyping: (v: boolean) => void, unsubscribe: () => void } | null>(null);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [newTask, setNewTask] = useState<{ title: string, description: string, priority: TaskPriority }>({
    title: '',
    description: '',
    priority: 'Medium'
  });
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    description: user.description || '',
    certifications: user.certifications ? user.certifications.join(', ') : '',
    businessHours: JSON.parse(JSON.stringify(user.businessHours || {})),
    phone: user.phone || '',
    website: user.website || '',
    whatsapp: user.whatsapp || '',
    facebook: user.facebook || '',
    locationAddress: user.location?.address || '',
    locationLat: user.location?.lat || -17.7333,
    locationLng: user.location?.lng || 168.3167,
    avatarUrl: user.avatarUrl || '',
    backgroundUrl: user.backgroundUrl || '',
  });

  const openProfileEditor = () => {
    setProfileForm({
      name: user.name,
      description: user.description || '',
      certifications: user.certifications ? user.certifications.join(', ') : '',
      businessHours: JSON.parse(JSON.stringify(user.businessHours || {})),
      phone: user.phone || '',
      website: user.website || '',
      whatsapp: user.whatsapp || '',
      facebook: user.facebook || '',
      locationAddress: user.location?.address || '',
      locationLat: user.location?.lat || -17.7333,
      locationLng: user.location?.lng || 168.3167,
      avatarUrl: user.avatarUrl || '',
      backgroundUrl: user.backgroundUrl || '',
    });
    setIsProfileEditing(true);
  };

  const [barFilter, setBarFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [suppliers, setSuppliers] = useState<User[]>([]);
  const [exporters, setExporters] = useState<User[]>([]);

  // Product Editing / Deleting states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [allSystemBars, setAllSystemBars] = useState<Bar[]>([]);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    stockLevel: 0,
    tags: '',
    imageUrl: '',
    barId: ''
  });

  useEffect(() => {
    const allUsers = storage.getUsers();
    setSuppliers(allUsers.filter(u => u.role === 'supplier'));
    setExporters(allUsers.filter(u => u.role === 'exporter'));
    barService.getAllBars().then(bars => setAllSystemBars(bars));
  }, []);

  const [isGeneratingPromos, setIsGeneratingPromos] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
  const [promoConfig, setPromoConfig] = useState({
    title: "Vanuatu Kava Bulk Deal",
    description: "Get 15% off on all raw root orders over 50kg this month. Enhance your supply chain with our premium grade selection.",
    buttonText: "Feature Now",
    type: 'featured' as 'featured' | 'sale' | 'alert'
  });

  const [showTitleSelector, setShowTitleSelector] = useState(!user.supplierTitle);

  // High-precision automated GPS registry states for Suppliers
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');
  const [showGpsBanner, setShowGpsBanner] = useState(() => {
    return !user.location?.lat || !user.location?.lng || Math.abs(user.location.lat) < 0.1 || Math.abs(user.location.lng) < 0.1;
  });

  const prevUnreadCount = React.useRef(0);
  const prevMarketCount = React.useRef(marketUpdates.length);

  const handleSelectTitle = (title: 'Green Kava' | 'Sun-Dried Kava (Powder)' | '(Instant) Powdered Kava') => {
    const updatedUser: User = {
      ...user,
      supplierTitle: title
    };
    const allUsers = storage.getUsers();
    storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setShowTitleSelector(false);
  };

  // Locked State Check
  if (!user.approved || !user.subscriptionActive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-10 p-4 md:p-10 text-center animate-in fade-in duration-700">
        <div className="w-full max-w-xl p-10 bg-kava-surface backdrop-blur-2xl rounded-[48px] border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-kava-gold/5 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="relative flex flex-col items-center">
            <div className="p-6 bg-kava-gold/10 rounded-3xl mb-6">
              <Package size={64} className="text-kava-gold animate-pulse" />
            </div>
            <h2 className="font-bebas text-6xl text-kava-text leading-tight mb-3">LICENSE SUSPENDED</h2>
            <p className="text-kava-muted font-bold text-[10px] uppercase tracking-[0.3em] max-w-sm mb-8 leading-relaxed">
              Distribution rights for your products have been automatically paused because your account reached its expiration date and time.
            </p>
            
            <div className="w-full bg-black/5 rounded-3xl p-6 mb-8 border border-black/5">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Notice</p>
              <p className="text-sm font-medium text-kava-text px-4">Renew your supplier license to resume B2B visibility and inventory management once an admin verifies your payment.</p>
            </div>

            <button 
              onClick={() => setIsBillingOpen(true)}
              className="w-full py-5 bg-kava-text text-white rounded-3xl font-bebas text-2xl tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Renew Supplier License
            </button>
          </div>
        </div>

        <section className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest">
          Products and logistics data are securely archived and will restore upon renewal.
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

          {isFinanceOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFinanceOpen(false)}
                className="absolute inset-0 bg-kava-bg/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-6xl"
              >
                <div className="absolute top-8 right-8 z-50">
                  <button onClick={() => setIsFinanceOpen(false)} className="p-2 bg-white/20 hover:bg-white/45 rounded-full text-kava-text backdrop-blur-md border border-white/40 transition-all cursor-pointer">
                    <X size={24} />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[90vh] custom-scrollbar p-6 md:p-10 rounded-[48px] bg-kava-bg border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="p-3.5 bg-kava-text text-white rounded-3xl animate-pulse">
                      <DollarSign size={32} />
                    </div>
                    <div>
                      <h2 className="font-bebas text-5xl text-kava-text leading-none tracking-wide">Supplier Finance Ledger</h2>
                      <p className="text-[10px] text-kava-gold uppercase font-black tracking-[0.4em] mt-1.5">Wholesale Distribution Cash Flow & Balance</p>
                    </div>
                  </div>
                  <FinanceDashboard role="supplier" />
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
    if (unreadMessagesCount > prevUnreadCount.current) {
      playSound('receive', isMuted);
    }
    prevUnreadCount.current = unreadMessagesCount;
  }, [unreadMessagesCount, isMuted]);

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
      setMarketUpdates(all.filter(u => u.visibility === 'business').sort((a,b) => b.timestamp - a.timestamp));
      const allUsers = storage.getUsers();
      setExporters(allUsers.filter(u => u.role === 'exporter'));
    };
    loadMarket();
    const interval = setInterval(loadMarket, 10000);
    return () => clearInterval(interval);
  }, []);

  // Subscriptions for chat
  useEffect(() => {
    const unsubscribeChats = chatService.listenToChats(user.id, (chats) => {
      setAllChats(chats);
      
      // We'll update unread count and urgent requests based on overall chats
      // For precise unread, we'd need to check every chat's messages, 
      // but for summary we can check the last message.
      const urgent: ChatMessage[] = [];
      let totalUnread = 0;

      chats.forEach(chat => {
        const last = chat.lastMessage;
        if (last && last.senderId !== user.id) {
          // Check for urgent keywords in the latest message summary
          const isUrgent = last.text.toLowerCase().match(/urgent|asap|emergency|crisis|need/);
          if (isUrgent) {
            urgent.push({
              id: chat.id + '-last',
              chatId: chat.id,
              senderId: last.senderId,
              text: last.text,
              type: 'text',
              timestamp: last.timestamp,
              metadata: {},
              readBy: []
            } as ChatMessage);
          }
          // Note: In a full implementation, unread would be tracked per-message
          // For this dashboard, we'll increment if last is from other
          totalUnread++;
        }
      });
      setUrgentRequests(urgent);
      setUnreadMessagesCount(totalUnread);
    });

    return () => {
      unsubscribeChats();
    };
  }, [user.id]);

  useEffect(() => {
    if (!activeChatId) {
      setChatHistory([]);
      return;
    }

    const unsubscribeMessages = chatService.listenToMessages(activeChatId, (messages) => {
      setChatHistory(messages);
      
      // Mark messages as read
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

  // Handle selecting a bar to chat with
  useEffect(() => {
    const initChat = async () => {
      setMsgAnalysis(null);
      if (chatWithBar) {
        const chatId = await chatService.getOrCreateDirectChat(user.id, chatWithBar.managerId);
        setActiveChatId(chatId);
      } else {
        setActiveChatId(null);
      }
    };
    initChat();
  }, [chatWithBar, user.id]);

  useEffect(() => {
    const unsubscribeProd = productService.listenToProducts(null, async (myProducts) => {
      setProducts(myProducts);
      
      // Update served bars based on current products
      const allBars = await barService.getAllBars();
      const servedBarIds = new Set(myProducts.map(p => p.barId).filter((id): id is string => id !== null));
      const myServedBars = allBars.filter(bar => servedBarIds.has(bar.id));
      setServedBars(myServedBars);
    });

    const subTasks = taskService.subscribeToTasks({ supplierId: user.id }, (updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => {
      unsubscribeProd();
      subTasks.unsubscribe();
    };
  }, [user.id]);

  // Real-time Bar Status Synchronization for Client Network
  useEffect(() => {
    const channel = supabase
      .channel('supplier-client-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bars' }, (payload) => {
        const raw = payload.new as any;
        setServedBars(prev => prev.map(bar => 
          bar.id === raw.id ? { 
            ...bar, 
            status: raw.status, 
            businessHours: raw.business_hours,
            statusHistory: raw.status_history 
          } : bar
        ));
        
        // Also update chatWithBar if it's the one being modified
        if (chatWithBar?.id === raw.id) {
          setChatWithBar(prev => prev ? { 
            ...prev, 
            status: raw.status, 
            businessHours: raw.business_hours, 
            statusHistory: raw.status_history 
          } : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatWithBar?.id]);

  const addProduct = async () => {
    await productService.addProduct({
      name: "New Raw Material",
      price: 0,
      supplierId: user.id
    });
  };

  const updateProduct = async (id: string, field: keyof Product, value: string | number | string[]) => {
    await productService.updateProduct(id, { [field]: value });
  };

  const generatePromotions = async () => {
    if (products.length === 0) return;
    setIsGeneratingPromos(true);
    try {
      const response = await fetch('/api/ai/product-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate promotions');
      }

      const data = await response.json();
      if (data && data.promotions) {
        for (const promo of data.promotions) {
          await updateProduct(promo.productId, 'description', promo.promoDescription);
        }
      }
    } catch (err) {
      console.error('Error generating AI promotions:', err);
      alert('Failed to generate AI promotional copies. Please check your system configuration.');
    } finally {
      setIsGeneratingPromos(false);
    }
  };

  const startEditing = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      id: p.id,
      name: p.name || '',
      description: p.description || '',
      price: p.price || 0,
      stockLevel: p.stockLevel || 0,
      tags: (p.tags || []).join(', '),
      imageUrl: p.imageUrl || '',
      barId: p.barId || 'all'
    });
  };

  const saveEditProduct = async () => {
    if (!editForm.name.trim()) {
      alert("Product name cannot be empty.");
      return;
    }
    const tagsArr = editForm.tags.split(',').map(s => s.trim()).filter(s => s !== '');
    
    await updateProduct(editForm.id, 'name', editForm.name);
    await updateProduct(editForm.id, 'description', editForm.description);
    await updateProduct(editForm.id, 'price', editForm.price);
    await updateProduct(editForm.id, 'stockLevel', editForm.stockLevel);
    await updateProduct(editForm.id, 'tags', tagsArr);
    await updateProduct(editForm.id, 'imageUrl', editForm.imageUrl);
    await updateProduct(editForm.id, 'barId', editForm.barId === 'all' ? '' : editForm.barId);
    
    setEditingProduct(null);
  };

  const startDeleting = (p: Product) => {
    setDeletingProduct(p);
  };

  const confirmDeleteProduct = async () => {
    if (deletingProduct) {
      await productService.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    }
  };

  const removeProduct = async (id: string) => {
    const pPrev = products.find(p => p.id === id);
    if (pPrev) {
      startDeleting(pPrev);
    } else {
      await productService.deleteProduct(id);
    }
  };

  const sendB2BMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !chatText.trim()) return;
    
    const textMsg = chatText.trim();
    setChatText('');
    playSound('send', isMuted);
    
    // Reset typing state
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingControllerRef.current?.setTyping(false);
    
    await chatService.sendMessage(activeChatId, user.id, textMsg);
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
          toId: lastMsg.senderId === user.id ? (chatWithBar?.managerId || '') : user.id,
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
    if (!newTask.title.trim()) return;

    const tempId = 'temp-' + Math.random().toString(36).substr(2, 9);
    const tempTask: Task = {
      id: tempId,
      supplierId: user.id,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      status: 'Pending',
      createdAt: Date.now()
    };

    // Optimistically prepend to supplier local active list
    setTasks(prev => [tempTask, ...prev]);
    setNewTask({ title: '', description: '', priority: 'Medium' });
    setIsTaskFormOpen(false);

    try {
      await taskService.createTask({
        supplierId: user.id,
        title: tempTask.title,
        description: tempTask.description,
        priority: tempTask.priority,
        status: 'Pending'
      });
    } catch (err) {
      console.error('Failed to create pipeline task:', err);
      // Revert optimism if failed
      setTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
    
    // Optimistically toggle target status
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      await taskService.updateTask(task.id, { status: newStatus });
    } catch (err) {
      console.error('Failed to toggle task in DB:', err);
      // Rollback status
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm('Delete this logistics task?')) {
      const originalTasks = [...tasks];
      // Optimistically filter task immediately
      setTasks(prev => prev.filter(t => t.id !== id));

      try {
        await taskService.deleteTask(id);
      } catch (err) {
        console.error('Failed to delete logistics task from DB:', err);
        setTasks(originalTasks);
      }
    }
  };
  
  const contactBarManager = async (barId: string | null) => {
    if (!barId) {
      alert("This product is not currently assigned to a specific bar node.");
      return;
    }

    const targetBar = await barService.getBar(barId);
    if (!targetBar || !targetBar.managerId) {
      alert("Could not establish a connection link with the node manager.");
      return;
    }

    const chatId = await chatService.getOrCreateDirectChat(user.id, targetBar.managerId);
    if (chatId) {
      setActiveChatId(chatId);
      setChatWithBar(targetBar);
      
      // Navigate to chat section
      const chatSection = document.getElementById('b2b-chat-hub');
      if (chatSection) {
        chatSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const contactSupplier = async (supplierId: string) => {
    if (supplierId === user.id) return;
    const targetSupplier = suppliers.find(s => s.id === supplierId);
    if (!targetSupplier) {
      alert("Could not locate designated B2B partner in local network.");
      return;
    }
    const chatId = await chatService.getOrCreateDirectChat(user.id, targetSupplier.id);
    if (chatId) {
      alert(`B2B Discussion line established with ${targetSupplier.name}. Switch components to 'Messages' to interact with this supplier!`);
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

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.title) return;

    const update: BarUpdate = {
      id: 'u' + Date.now(),
      barId: 'supplier-' + user.id, // Marker for supplier posts
      ...newUpdate,
      timestamp: Date.now(),
      isApproved: true // Supplier B2B posts are auto-approved for business feed
    };

    const allUpdates = [update, ...storage.getBarUpdates()];
    storage.saveBarUpdates(allUpdates);
    setMarketUpdates([update, ...marketUpdates].sort((a, b) => b.timestamp - a.timestamp));
    setNewUpdate({ type: 'notice', title: '', description: '', imageUrl: '', adImageUrl: '', visibility: 'business' });
    setFilePreview(null);
    setAdFilePreview(null);
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
        title: '🌴 SP-1: Sun-Dried Pentecost Kava Chips Batch ready!',
        description: 'B2B Trade Deal: Sun-dried lateral root kava chips harvested this week in southern Pentecost. Verified high kavalactone content setup. Vacuum bag sealed. Contact us instantly for bulk terms!',
        imageUrl: 'https://images.unsplash.com/photo-1541535881962-e668f28d3596?auto=format&fit=crop&q=80&w=1000'
      },
      instagram: {
        title: '🧉 SP-2: Organic Custom Stone-Ground Noble Powder',
        description: 'Pure, ceremonial-grade stone-ground kava noble powder ready for global export markets. Custom logistics channels setup. Perfect deep sediment texture.',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=1000'
      },
      whatsapp: {
        title: '📢 SP-3: Direct Wholesaler Container Load',
        description: '[VANUATU COCONUT CHIPS CO]: Bulk lateral roots batch processed, certifications clean. Available for direct port loader sync. WhatsApp direct secure deal lines active.',
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
      visibility: 'business'
    });
    setFilePreview(selected.imageUrl);
    setIsImporting(false);
    setSocialImportUrl('');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      name: profileForm.name,
      description: profileForm.description,
      certifications: profileForm.certifications.split(',').map(s => s.trim()).filter(s => s !== ''),
      businessHours: profileForm.businessHours,
      phone: profileForm.phone,
      website: profileForm.website,
      whatsapp: profileForm.whatsapp,
      facebook: profileForm.facebook,
      location: {
        address: profileForm.locationAddress,
        lat: Number(profileForm.locationLat) || -17.7333,
        lng: Number(profileForm.locationLng) || 168.3167
      },
      avatarUrl: profileForm.avatarUrl,
      backgroundUrl: profileForm.backgroundUrl
    };

    const allUsers = storage.getUsers();
    storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
    
    if (onUpdateUser) onUpdateUser(updatedUser);
    setIsProfileEditing(false);

    // Synchronize to Supabase if session exists
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user.id === user.id) {
        await supabase
          .from('users')
          .update({
            name: updatedUser.name,
            description: updatedUser.description,
            certifications: updatedUser.certifications,
            business_hours: updatedUser.businessHours,
            phone: updatedUser.phone,
            website: updatedUser.website,
            whatsapp: updatedUser.whatsapp,
            facebook: updatedUser.facebook,
            location: updatedUser.location,
            avatar_url: updatedUser.avatarUrl,
            background_url: updatedUser.backgroundUrl
          })
          .eq('id', user.id);
      }
    } catch (supabaseErr) {
      console.error('[SUPABASE] Supplier profile sync error:', supabaseErr);
    }
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
        const latVal = Number(latitude.toFixed(6));
        const lngVal = Number(longitude.toFixed(6));
        
        // Update both the react state form and the user profile live database
        setProfileForm(prev => ({
          ...prev,
          locationLat: latVal,
          locationLng: lngVal
        }));

        const updatedUser: User = {
          ...user,
          location: {
            address: profileForm.locationAddress || user.location?.address || "Port Vila Base",
            lat: latVal,
            lng: lngVal
          }
        };

        const allUsers = storage.getUsers();
        storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
        
        if (onUpdateUser) onUpdateUser(updatedUser);

        // Synchronize to Supabase if session exists
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user.id === user.id) {
            await supabase
              .from('users')
              .update({
                location: updatedUser.location
              })
              .eq('id', user.id);
          }
        } catch (supabaseErr) {
          console.error('[SUPABASE] Failed to sync supplier GPS locate:', supabaseErr);
        }

        setGpsSuccessMsg(`Successfully registered Supplier location: Lat ${latVal}, Lng ${lngVal}`);
        setGpsDetecting(false);
        setShowGpsBanner(false);
        setTimeout(() => setGpsSuccessMsg(''), 6000);
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

  const updateProfileHour = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setProfileForm(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Subscription Expiry Notification */}
      {user.subscription?.currentPeriodEnd && (
        <AnimatePresence>
          {Date.now() > user.subscription.currentPeriodEnd - (3 * 24 * 60 * 60 * 1000) && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               className="mx-4 md:mx-0 bg-rose-500 text-white rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-rose-500/20"
             >
               <div className="flex items-center gap-4">
                 <AlertTriangle size={24} className="animate-pulse" />
                 <div>
                   <p className="text-sm font-black uppercase tracking-widest leading-none">Security & Licensing Notice</p>
                   <p className="text-xs opacity-80 font-bold mt-1 uppercase tracking-tight">
                     {Date.now() > user.subscription.currentPeriodEnd 
                       ? "Inventory visibility is disabled due to expired licensing." 
                       : `Your ${user.subscription.isTrial ? 'trial' : 'subscription'} period ends in ${Math.ceil((user.subscription.currentPeriodEnd - Date.now()) / (24 * 60 * 60 * 1000))} days.`}
                   </p>
                 </div>
               </div>
               <button 
                 onClick={() => setIsBillingOpen(true)}
                 className="px-10 py-3 bg-white text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-lg"
               >
                 Renew License
               </button>
             </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* High-Precision GPS Locator Assistant banner for Suppliers */}
      {showGpsBanner && (
        <div className="mx-4 md:mx-0 bg-gradient-to-br from-[#122e1b] to-[#0a180e] border-4 border-emerald-500 text-white rounded-[32px] p-8 shadow-2xl flex flex-col md:flex-row gap-6 items-center justify-between animate-in fade-in duration-500">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-4 bg-emerald-500 text-black rounded-2xl animate-bounce shrink-0">
              <MapPin size={28} />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="font-bebas text-3xl text-emerald-400 tracking-wide">🗺️ REGISTER SUPPLIER OPERATIONAL LOCATION</h4>
              <p className="text-[10.5px] font-semibold text-neutral-300">
                To allow exporters and nakamal managers to arrange kava collection logistics, register your exact operations base. Populating coordinates makes you visible on the platform supply network map.
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
              className="flex-1 md:flex-none px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {gpsDetecting ? 'SATELLITE POSITIONING...' : '🎯 Auto-Register GPS'}
            </button>
            <button 
              onClick={() => {
                openProfileEditor();
              }}
              className="flex-1 md:flex-none px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all whitespace-nowrap"
            >
              Open Profile Edit
            </button>
          </div>
        </div>
      )}

      {gpsSuccessMsg && (
        <div className="mx-4 md:mx-0 bg-emerald-950 border-2 border-emerald-500 text-emerald-300 rounded-[24px] p-5 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-500" />
            <p className="text-[11px] font-bold uppercase tracking-wider">{gpsSuccessMsg}</p>
          </div>
          <button onClick={() => setGpsSuccessMsg('')} className="text-[10px] font-black underline uppercase tracking-widest cursor-pointer">dismiss</button>
        </div>
      )}

      <AnimatePresence>
        {showPromo && (
          <motion.div 
            initial={{ height: 0, opacity: 0, scaleY: 0.8 }}
            animate={{ height: 'auto', opacity: 1, scaleY: 1 }}
            exit={{ height: 0, opacity: 0, scaleY: 0.8 }}
            className="overflow-hidden"
          >
            <div className={`relative rounded-[32px] p-8 border-[2.5px] shadow-2xl overflow-hidden group ${
              promoConfig.type === 'sale' ? 'bg-rose-500 border-rose-400' : 
              promoConfig.type === 'alert' ? 'bg-amber-500 border-amber-400' : 
              'bg-kava-text border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
            }`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-kava-gold/10 rounded-full -ml-10 -mb-10 blur-2xl" />
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-white/10">
                      {promoConfig.type} Opportunity
                    </span>
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Active Partner Initiative</span>
                  </div>
                  <h3 className="font-bebas text-5xl md:text-6xl text-white tracking-tight leading-none uppercase">
                    {promoConfig.title}
                  </h3>
                  <p className="text-white/70 text-lg font-medium max-w-2xl leading-relaxed">
                    {promoConfig.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      const firstProduct = products[0];
                      if (firstProduct) {
                        setBarFilter('all');
                        // Optional: scroll to inventory or focus
                      }
                    }}
                    className="px-10 py-5 bg-white text-kava-text rounded-2xl font-bebas text-2xl tracking-widest hover:bg-kava-gold hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95"
                  >
                    {promoConfig.buttonText}
                  </button>
                  <button 
                    onClick={() => setShowPromo(false)}
                    className="p-5 bg-white/10 text-white hover:bg-white/20 rounded-2xl transition-all border border-white/5"
                    title="Dismiss Notification"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-bebas text-5xl text-kava-text tracking-tight uppercase leading-none">Supply Distribution</h2>
            {user.supplierTitle && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-md ${
                user.supplierTitle === 'Green Kava' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                user.supplierTitle === 'Sun-Dried Kava (Powder)' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>
                🌿 {user.supplierTitle}
              </span>
            )}
          </div>
          <p className="text-kava-muted/60 font-medium mt-1 animate-fadeIn">Manage wholesale inventory and distribution channels</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto md:justify-end">
          {/* Header Secondary Utilities Wrapper */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Audio Mute Toggle */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl border transition-all shadow-sm cursor-pointer ${isMuted ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-kava-surface border-white/20 text-kava-muted hover:text-kava-gold'}`}
              title={isMuted ? "Unmute sounds" : "Mute sounds"}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Billing Button */}
            <button 
              onClick={() => setIsBillingOpen(true)}
              className="p-3 rounded-2xl border border-white/20 bg-kava-surface text-kava-muted hover:text-kava-gold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              title="Subscriptions & Billing"
            >
              <CreditCard size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Billing</span>
            </button>

            {/* Finance Button */}
            <button 
              onClick={() => setIsFinanceOpen(true)}
              className="p-3 rounded-2xl border border-white/20 bg-kava-surface text-kava-muted hover:text-kava-gold transition-all shadow-sm flex items-center gap-2 animate-pulse cursor-pointer"
              title="Finance Ledger & Cash Flow"
            >
              <DollarSign size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Finance Ledger</span>
            </button>

            {/* Profile Settings Button */}
            <button 
              onClick={openProfileEditor}
              className="p-3 bg-kava-surface rounded-2xl border border-white/20 hover:border-kava-gold/30 transition-all shadow-sm text-kava-muted hover:text-kava-gold cursor-pointer"
              title="Business Profile Settings"
            >
              <Settings size={20} />
            </button>

            {onLogout && (
              <button 
                onClick={onLogout}
                className="p-3 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                title="Log Out Session"
              >
                <Power size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">Logout</span>
              </button>
            )}

            {/* Notification Badges */}
            <div className="flex gap-2 sm:gap-3 mr-2">
              <div className="relative group cursor-pointer">
                <div className="p-3 bg-kava-surface rounded-2xl border border-white/20 hover:border-kava-gold/30 transition-all shadow-sm">
                  <MessageCircle size={20} className="text-kava-muted" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-kava-gold text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg badge-unread">
                      {unreadMessagesCount}
                    </span>
                  )}
                </div>
                
                {/* Tooltip/Dropdown for Messages */}
                <div className="absolute top-full right-0 mt-3 w-64 bg-kava-surface backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] p-4 scale-95 group-hover:scale-100 origin-top-right">
                  <h4 className="font-bebas text-xl tracking-widest text-kava-text mb-3 flex items-center gap-2">
                    <MessageCircle size={14} className="text-kava-gold" />
                    Recent Inquiries
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {allChats.some(c => c.lastMessage && c.lastMessage.senderId !== user.id) ? allChats.filter(c => c.lastMessage && c.lastMessage.senderId !== user.id).map(chat => (
                      <div key={chat.id} className="p-3 bg-kava-text/5 rounded-xl border border-white/10 hover:bg-kava-text/10 transition-all cursor-pointer">
                        <p className="text-[10px] font-bold text-kava-text line-clamp-1">{chat.lastMessage?.text}</p>
                        <span className="text-[8px] text-kava-muted/40 uppercase tracking-widest font-black">Conversation Node</span>
                      </div>
                    )) : (
                      <p className="text-[10px] text-kava-muted/40 italic py-2">All quiet in the inbox</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer">
                <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 hover:bg-rose-500/20 transition-all shadow-sm">
                  <AlertCircle size={20} className={`${urgentRequests.length > 0 ? 'text-rose-500 animate-bounce' : 'text-kava-muted/30'}`} />
                  {urgentRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-lg badge-unread">
                      {urgentRequests.length}
                    </span>
                  )}
                </div>

                {/* Tooltip/Dropdown for Urgent */}
                <div className="absolute top-full right-0 mt-3 w-64 bg-kava-surface backdrop-blur-xl border border-rose-500/20 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] p-4 scale-95 group-hover:scale-100 origin-top-right">
                  <h4 className="font-bebas text-xl tracking-widest text-rose-500 mb-3 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Urgent Supply Requests
                  </h4>
                  <div className="space-y-2">
                    {urgentRequests.length > 0 ? urgentRequests.map(m => (
                      <div key={m.id} className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 hover:bg-rose-500/10 transition-all">
                        <p className="text-[10px] font-bold text-kava-text leading-tight mb-1">{m.text}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-rose-500 uppercase tracking-widest font-black">Critical Action</span>
                          <ChevronRight size={10} className="text-rose-500" />
                        </div>
                      </div>
                    )) : (
                      <p className="text-[10px] text-kava-muted/40 italic py-2">No emergency orders pending</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button 
            onClick={addProduct}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-kava-gold text-white rounded-3xl font-bebas text-xl sm:text-2xl tracking-widest hover:bg-kava-gold/95 transition-all shadow-xl shadow-kava-gold/20 cursor-pointer select-none active:scale-95 duration-100"
          >
            <Plus size={20} className="sm:w-6 sm:h-6" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Persisted Tab Navigation Switched Bar */}
      <div className="flex border-b border-kava-text/5 pb-2 flex-wrap gap-2 md:gap-4 px-4 md:px-0">
        {[
          { id: 'dashboard', label: 'Dashboard Base', icon: Store, color: 'text-kava-gold border-kava-gold bg-kava-gold/5' },
          { id: 'estimator', label: '🌿 Kava Plant Estimator', icon: Sprout, color: 'text-emerald-500 border-emerald-500 bg-emerald-500/5' },
          { id: 'inventory', label: 'Wholesale Inventory', icon: Package, color: 'text-blue-500 border-blue-500 bg-blue-500/5' },
          { id: 'messages', label: 'Negotiation Desk', icon: MessageSquare, color: 'text-indigo-500 border-indigo-500 bg-indigo-500/5' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                feedbackService.trigger('tap');
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
                isActive 
                  ? `${tab.color} border-current shadow-sm` 
                  : 'bg-kava-surface border-white/20 text-kava-muted hover:text-kava-gold hover:border-kava-gold/30'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'messages' && unreadMessagesCount > 0 && (
                <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black animate-bounce shrink-0">
                  {unreadMessagesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'estimator' && (
         <motion.div 
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-8 animate-[fadeIn_0.4s_ease-out]"
         >
           {/* Here is the Kava Plant Estimator section */}
           <section className="kava-card bg-kava-surface border border-white/20 p-8 md:p-12 rounded-[48px] relative overflow-hidden flex flex-col space-y-8 shadow-[0_30px_70px_rgba(0,0,0,0.1)]">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-kava-gold/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-3xl border border-emerald-500/20">
                    <Sprout size={36} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bebas text-5xl text-kava-text tracking-tight uppercase leading-none">Green Kava Plant Yield & Value Estimator</h3>
                    <p className="text-kava-muted/60 text-xs font-semibold uppercase tracking-wider mt-1">Predictive crop valuation for South Pacific agricultural suppliers</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shrink-0 self-start md:self-center">
                  ✨ Real-time Exchange Sync
                </div>
              </div>

              {/* Grid Form section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10 pt-4">
                {/* Inputs Pane (7 Cols) */}
                <div className="lg:col-span-7 space-y-8 bg-white/40 p-6 md:p-10 rounded-[36px] border border-white/50">
                   <h4 className="text-sm font-black text-kava-text uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-kava-text/5">
                     <Sliders size={16} className="text-emerald-500" />
                     Agricultural Inputs
                   </h4>

                   {/* Plant count */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black uppercase tracking-wider text-kava-muted">Total Crop Count (Plants)</label>
                        <span className="font-bebas text-3xl text-kava-gold bg-kava-gold/10 px-4 py-1.5 rounded-2xl border border-kava-gold/20 leading-none">
                          {estimatedPlants.toLocaleString()} Plants
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="1"
                          max="10000"
                          step="10"
                          value={estimatedPlants}
                          onChange={(e) => setEstimatedPlants(Number(e.target.value))}
                          className="flex-1 accent-emerald-500 h-2 bg-neutral-200 rounded-lg cursor-pointer appearance-none"
                        />
                        <input 
                          type="number"
                          min="1"
                          value={estimatedPlants}
                          onChange={(e) => setEstimatedPlants(Math.max(1, Number(e.target.value) || 1))}
                          className="w-28 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-center font-bold text-base text-kava-text focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-kava-muted/80 leading-normal">
                        Based on the standard spacing of 2 meters per kava plant in average Vaturasu or Melomelo gardens.
                      </p>
                   </div>

                   {/* Average Weight per Plant */}
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-black uppercase tracking-wider text-kava-muted">Average Yield per Plant (kg/plant)</label>
                        <span className="font-bebas text-3xl text-emerald-600 bg-emerald-500/10 px-4 py-1.5 rounded-2xl border border-emerald-500/20 leading-none">
                          {yieldPerPlant.toFixed(1)} kg/plant
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input 
                          type="range"
                          min="0.1"
                          max="15.0"
                          step="0.1"
                          value={yieldPerPlant}
                          onChange={(e) => setYieldPerPlant(Number(e.target.value))}
                          className="flex-1 accent-emerald-500 h-2 bg-neutral-200 rounded-lg cursor-pointer appearance-none"
                        />
                        <input 
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={yieldPerPlant}
                          onChange={(e) => setYieldPerPlant(Math.max(0.1, Number(e.target.value) || 0.1))}
                          className="w-28 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-center font-bold text-base text-kava-text focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-kava-muted/80 leading-normal">
                        <strong>Standard rule:</strong> 1 typical green kava plant equals 1 kg of commercial yield. Heavy multi-year plants (5+ years) can yield up to 10-15 kg.
                      </p>
                   </div>

                   {/* Price per KG and Region */}
                   <div className="space-y-4 pt-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-kava-muted block">Market Region & Price Target (VT / kg)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                         {[
                           { key: 'Luganville', label: 'Luganville Price', price: 1000, desc: 'Northern Hub Standard' },
                           { key: 'PortVila', label: 'Port Vila Price', price: 1200, desc: 'Central Urban Standard' },
                           { key: 'Custom', label: 'Custom Location', price: customPricePerKg, desc: 'Specify own regional rate' }
                         ].map((loc) => {
                           const isSel = selectedPricingRegion === loc.key;
                           return (
                             <button
                               key={loc.key}
                               type="button"
                               onClick={() => setSelectedPricingRegion(loc.key as any)}
                               className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                                 isSel 
                                   ? 'border-emerald-500 bg-emerald-500/[0.04] text-emerald-950' 
                                   : 'border-neutral-200 bg-white text-kava-text hover:border-neutral-300'
                               }`}
                             >
                               <div>
                                 <span className="text-[10px] font-black uppercase tracking-wider block leading-none mb-1">{loc.label}</span>
                                 <span className="text-[8px] opacity-60 font-medium uppercase tracking-tight block">{loc.desc}</span>
                               </div>
                               <span className="font-bebas text-2xl text-kava-gold leading-none mt-3">
                                 {loc.price.toLocaleString()} VT/kg
                               </span>
                             </button>
                           );
                         })}
                      </div>

                      {selectedPricingRegion === 'Custom' && (
                         <motion.div 
                           initial={{ opacity: 0, height: 0 }}
                           animate={{ opacity: 1, height: 'auto' }}
                           className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 space-y-2 mt-2"
                         >
                            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">Custom Valuation Rate (VUV per kg)</label>
                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-neutral-200">
                               <span className="font-bebas text-xl text-neutral-400">VT</span>
                               <input 
                                 type="number"
                                 min="0"
                                 value={customPricePerKg}
                                 onChange={(e) => setCustomPricePerKg(Math.max(0, parseInt(e.target.value) || 0))}
                                 className="flex-1 bg-transparent border-none focus:ring-0 font-bold p-0 text-kava-text animate-none"
                               />
                               <span className="text-xs font-bold text-neutral-400">/ kg</span>
                            </div>
                         </motion.div>
                      )}
                   </div>
                </div>

                {/* Outputs Panel (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-6">
                   {/* Total yield card */}
                   <div className="bg-gradient-to-br from-emerald-950 to-neutral-950 rounded-3xl p-6 border border-emerald-500/30 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400 block mb-1">TOTAL PREDICTED CROP BIOMASS</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bebas text-6xl text-white tracking-widest">
                          {(estimatedPlants * yieldPerPlant).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                        <span className="font-bebas text-2xl text-emerald-400">KG GREEN</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                         <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                      </div>
                   </div>

                   {/* Total valuation card */}
                   <div className="bg-gradient-to-br from-neutral-950 to-black rounded-3xl p-6 border border-kava-gold/30 text-white shadow-xl relative overflow-hidden">
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-kava-gold block mb-1">CROP COMMERCIAL VALUATION</span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bebas text-5xl text-kava-gold tracking-widest">
                          {(() => {
                            const rate = selectedPricingRegion === 'Luganville' ? 1000 : selectedPricingRegion === 'PortVila' ? 1200 : customPricePerKg;
                            const totalVal = Math.round(estimatedPlants * yieldPerPlant * rate);
                            return totalVal.toLocaleString();
                          })()}
                        </span>
                        <span className="font-bold text-sm text-neutral-400">VUV</span>
                      </div>
                      <p className="text-[9.5px] opacity-60 font-semibold mt-1 uppercase tracking-wider">
                        Based on {selectedPricingRegion === 'Luganville' ? 'Luganville' : selectedPricingRegion === 'PortVila' ? 'Port Vila' : 'Custom'} prices ({selectedPricingRegion === 'Luganville' ? '1,000' : selectedPricingRegion === 'PortVila' ? '1,200' : customPricePerKg.toLocaleString()} VT/kg)
                      </p>
                   </div>

                   {/* Companion Regional Currencies Table */}
                   <div className="bg-white/50 backdrop-blur-md border border-neutral-200/60 rounded-3xl p-6 space-y-4">
                      <h5 className="text-[10px] font-black text-kava-text uppercase tracking-widest flex items-center gap-2 pb-1 border-b border-kava-text/5">
                        <TrendingUp size={12} className="text-emerald-500" />
                        Pacific Export Conversions
                      </h5>
                      <div className="space-y-3">
                         {(() => {
                           const activePriceRate = selectedPricingRegion === 'Luganville' ? 1000 : selectedPricingRegion === 'PortVila' ? 1200 : customPricePerKg;
                           const totalVutu = estimatedPlants * yieldPerPlant * activePriceRate;
                           
                           return [
                             { name: 'Vatu (VUV)', rate: 1.0, value: totalVutu, currencyCode: 'VUV' },
                             { name: 'Franc Pacifique (XPF)', rate: 0.93, value: totalVutu * 0.93, currencyCode: 'XPF' },
                             { name: 'Fiji Dollar (FJD)', rate: 0.019, value: totalVutu * 0.019, currencyCode: 'FJD' },
                             { name: 'Australian Dollar (AUD)', rate: 0.013, value: totalVutu * 0.013, currencyCode: 'AUD' },
                             { name: 'NZ Dollar (NZD)', rate: 0.014, value: totalVutu * 0.014, currencyCode: 'NZD' }
                           ].map((curr) => {
                             let formattedVal = '';
                             if (curr.currencyCode === 'XPF' || curr.currencyCode === 'VUV') {
                               formattedVal = `${Math.round(curr.value).toLocaleString()} ${curr.currencyCode}`;
                             } else if (curr.currencyCode === 'FJD') {
                               formattedVal = `FJ$ ${curr.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                             } else if (curr.currencyCode === 'AUD') {
                               formattedVal = `A$ ${curr.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                             } else {
                               formattedVal = `NZ$ ${curr.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                             }
                             
                             return (
                               <div key={curr.currencyCode} className="flex justify-between items-center py-2 border-b border-neutral-100 last:border-none">
                                  <span className="text-[10px] font-bold text-kava-muted uppercase tracking-wider">{curr.name}</span>
                                  <span className="font-mono text-xs font-black text-kava-text">{formattedVal}</span>
                               </div>
                             );
                           });
                         })()}
                      </div>
                   </div>
                </div>
              </div>

              {/* Physical Crop Harvesting Composition Guide for Green Growers */}
              <div className="relative z-10 pt-4 border-t border-kava-text/5 bg-[#122e1b]/[0.02] p-6 rounded-3xl border border-emerald-500/10">
                 <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   🌿 Crop Component Biomass breakdown
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: 'Waka (Lateral Roots)', ratio: 0.40, color: 'bg-emerald-600', text: 'Premium high-potency roots. Highest quality component traded at the base rate.' },
                      { name: 'Lewena (Stool/Rhizome)', ratio: 0.40, color: 'bg-emerald-500', text: 'Solid heartiest bottom base. Placid component for mild drinking profiles.' },
                      { name: 'Kasa (Stem Nodes)', ratio: 0.20, color: 'bg-emerald-400', text: 'Stems and leaves bases of standard weight. Lowest potency traded separately.' }
                    ].map((comp) => {
                      const computedWeight = estimatedPlants * yieldPerPlant * comp.ratio;
                      return (
                        <div key={comp.name} className="space-y-2 bg-white/60 p-4 rounded-xl border border-white/80">
                           <div className="flex justify-between items-center">
                             <span className="text-[10px] font-black text-kava-text uppercase tracking-tight">{comp.name}</span>
                             <span className="text-[10px] font-black text-emerald-600">{comp.ratio * 100}% of yield</span>
                           </div>
                           <div className="flex items-baseline gap-1">
                             <span className="font-bebas text-3xl text-kava-text leading-none">
                               {computedWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                             </span>
                             <span className="text-[10px] font-bold text-kava-muted uppercase leading-none">KG</span>
                           </div>
                           <div className="h-1 w-full bg-neutral-100 rounded-full overflow-hidden">
                              <div className={`h-full ${comp.color}`} style={{ width: `${comp.ratio * 100}%` }} />
                           </div>
                           <p className="text-[9px] text-kava-muted/80 leading-normal font-medium pt-1">
                             {comp.text}
                           </p>
                        </div>
                      );
                    })}
                 </div>
              </div>

              {/* Processed Commodities Conversion & Exporter Cross-Checker */}
              <div className="relative z-10 pt-6 border-t border-kava-text/5 space-y-6">
                 <div>
                   <h4 className="text-2xl font-bebas text-kava-text tracking-normal uppercase flex items-center gap-2">
                     🌾 Processed Commodities & Exporter Price Cross-Checker
                   </h4>
                   <p className="text-[10px] text-kava-muted/80 leading-normal uppercase tracking-wider font-semibold">
                     Analyze estimated yield weight & market pricing if you dry or grind your crop into premium export-ready processed kava.
                   </p>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     {/* Define three products: Sundried Roots, Dried Chips/Cheaps, Instant Powdered Kava */}
                     {(() => {
                        const totalGreenBiomass = estimatedPlants * yieldPerPlant;

                        // Standard recovery yields from raw green kava:
                        // Sundried Roots: ~25% recovery (4kg green = 1kg dry)
                        // Chips/Cheaps: ~25% recovery (4kg green = 1kg dry)
                        // Instant / Powdered: ~20% recovery (5kg green = 1kg powder)
                        const commodities = [
                          {
                            id: 'sundried_roots',
                            name: 'Sundried Roots',
                            icon: Tag,
                            recoveryRatio: 0.25,
                            localBenchmarkPrice: 2500, // standard VT per kg
                            desc: 'Raw lateral & tap roots completely sun-dried. Traditional premium storage layout.',
                            exporterRateKey: 'sunDriedKavaRoots',
                            defaultExporterRate: 2750
                          },
                          {
                            id: 'cheaps',
                            name: 'Kava Chips / "Cheaps"',
                            icon: Package,
                            recoveryRatio: 0.25,
                            localBenchmarkPrice: 2000, // standard VT per kg
                            desc: 'Kava root stools chopped/sliced into small chips for faster dehydration.',
                            exporterRateKey: 'sunDriedKavaChips',
                            defaultExporterRate: 2200
                          },
                          {
                            id: 'instant',
                            name: 'Instant Powdered Kava',
                            icon: Award,
                            recoveryRatio: 0.20,
                            localBenchmarkPrice: 3500, // standard VT per kg
                            desc: 'Fine cold-water extract or ultra-ground premium powder ready for immediate drinking.',
                            exporterRateKey: 'instantPowder',
                            defaultExporterRate: 3800
                          }
                        ];

                        return commodities.map((item) => {
                           const processedWeight = totalGreenBiomass * item.recoveryRatio;
                           const totalLocalValuation = processedWeight * item.localBenchmarkPrice;

                           return (
                             <div key={item.id} className="bg-white/40 border border-white/60 backdrop-blur-md rounded-3xl p-6 flex flex-col space-y-4 hover:border-emerald-500/20 transition-all">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                     <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                                        <item.icon size={18} />
                                     </div>
                                     <div>
                                        <h5 className="font-bold text-sm text-kava-text leading-none">{item.name}</h5>
                                        <span className="text-[8px] uppercase font-black text-emerald-600 tracking-wider">{(item.recoveryRatio * 100)}% Yield Recovery</span>
                                     </div>
                                  </div>
                                </div>

                                <p className="text-[10px] text-kava-muted/80 leading-relaxed font-medium min-h-[40px]">
                                  {item.desc}
                                </p>

                                {/* Calculated yielding weight */}
                                <div className="bg-emerald-500/[0.03] border border-emerald-500/15 rounded-2xl p-4 flex justify-between items-center">
                                   <div>
                                     <span className="text-[8px] font-black uppercase text-kava-muted tracking-wider block">Estimated Dry Yield</span>
                                     <span className="text-[9px] text-kava-muted font-bold block mt-0.5">Based on {totalGreenBiomass.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg green</span>
                                   </div>
                                   <div className="text-right">
                                     <span className="font-bebas text-3xl text-emerald-600 leading-none">
                                       {processedWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                     </span>
                                     <span className="text-[10px] font-bold text-kava-muted ml-1">KG</span>
                                   </div>
                                </div>

                                {/* Local standard price benchmarks */}
                                <div className="space-y-1.5 pt-1">
                                   <div className="flex justify-between text-[10px] font-bold text-kava-muted uppercase tracking-wider">
                                      <span>Local Benchmark Rate:</span>
                                      <span className="font-semibold text-kava-text">{item.localBenchmarkPrice.toLocaleString()} VT / kg</span>
                                   </div>
                                   <div className="flex justify-between text-xs font-bold text-kava-muted">
                                      <span>Local Standard Total:</span>
                                      <span className="font-mono text-kava-text font-black text-emerald-600">VT {Math.round(totalLocalValuation).toLocaleString()}</span>
                                   </div>
                                </div>

                                {/* Exporter Rates comparison list */}
                                <div className="border-t border-kava-text/5 pt-4 space-y-3 flex-1 flex flex-col justify-end">
                                   <span className="text-[9px] font-black uppercase tracking-wider text-kava-gold flex items-center gap-1.5">
                                     <Globe size={11} className="animate-spin-slow" />
                                     Exporter Cross-Check (Value of his KG)
                                   </span>

                                   <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                      {exporters.map((exp) => {
                                         // Retrieve exporter's rate dynamically
                                         const rate = exp.exporterRates
                                           ? (exp.exporterRates as any)[item.exporterRateKey] || item.defaultExporterRate
                                           : item.defaultExporterRate;

                                         const expTotalValue = processedWeight * rate;
                                         const spreadPercent = Math.round(((rate - item.localBenchmarkPrice) / item.localBenchmarkPrice) * 100);

                                         return (
                                           <div key={exp.id} className="bg-white/80 border border-neutral-100 rounded-2xl p-3 flex flex-col space-y-2 text-xs">
                                              <div className="flex justify-between items-center">
                                                 <div className="font-bold text-[11px] text-kava-text truncate max-w-[120px]">
                                                   {exp.businessName || exp.name}
                                                 </div>
                                                 {spreadPercent > 0 ? (
                                                   <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                                     +{spreadPercent}% premium
                                                   </span>
                                                 ) : spreadPercent < 0 ? (
                                                   <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                                                     {spreadPercent}% vs standard
                                                   </span>
                                                 ) : (
                                                   <span className="text-[8px] font-black bg-neutral-50 text-neutral-500 px-1.5 py-0.5 rounded-full">
                                                     Standard matching
                                                   </span>
                                                 )}
                                              </div>

                                              <div className="flex justify-between items-baseline text-[11px]">
                                                 <div className="text-kava-muted">
                                                   Rate: <span className="font-bold text-kava-text">{rate.toLocaleString()} VT / kg</span>
                                                 </div>
                                                 <div className="text-right flex flex-col">
                                                   <span className="text-[8px] text-right text-kava-muted leading-none font-bold">EST. VAL</span>
                                                   <span className="font-mono font-black text-kava-gold text-[12px] leading-tight text-right">
                                                     VT {Math.round(expTotalValue).toLocaleString()}
                                                   </span>
                                                 </div>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  feedbackService.vibrate('tap');
                                                  feedbackService.playSound('tap');
                                                  const chatId = await chatService.getOrCreateDirectChat(user.id, exp.id);
                                                  const messageText = `Halo ${exp.name}, I used the Crop Estimator. I estimated that my farm can yield about:\n` +
                                                    `- ${processedWeight.toFixed(1)} kg of ${item.name}\n` +
                                                    `Your buyer rate for this is ${rate.toLocaleString()} VT/kg (Total value: VT ${Math.round(expTotalValue).toLocaleString()}).\n` +
                                                    `I would like to discuss a trade deal. Let's coordinate.`;
                                                  await chatService.sendMessage(chatId, user.id, messageText);
                                                  window.dispatchEvent(new CustomEvent('switchTab', { detail: 'messages' }));
                                                }}
                                                className="w-full bg-[#122e1b]/5 hover:bg-kava-gold/15 text-[8.5px] font-black uppercase tracking-wider py-1 rounded-xl text-emerald-950 hover:text-emerald-900 transition-all text-center flex items-center justify-center gap-1 cursor-pointer border border-[#122e1b]/5 hover:border-kava-gold/20"
                                              >
                                                <span>Talk Deals with {exp.name.split(' ')[0]}</span>
                                                <ChevronRight size={10} />
                                              </button>
                                           </div>
                                         );
                                      })}

                                      {exporters.length === 0 && (
                                        <div className="text-center py-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                                           <span className="text-[9px] font-black uppercase text-kava-muted/60 block leading-tight">No active export buyers registered on Vanuatu B2B feed. Standard Estimator rate applies:</span>
                                           <div className="font-mono font-black text-kava-text text-sm mt-1.5 text-center">
                                             VT {(processedWeight * item.defaultExporterRate).toLocaleString()}
                                           </div>
                                           <span className="text-[8px] opacity-70 block mt-1">Based on global benchmark: {item.defaultExporterRate.toLocaleString()} VT/kg</span>
                                        </div>
                                      )}
                                   </div>
                                </div>
                             </div>
                           );
                        });
                     })()}
                 </div>
              </div>
            </section>
         </motion.div>
      )}

      {activeTab === 'dashboard' && (<>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="kava-card flex flex-col relative overflow-hidden group p-0">
          {/* Cover background */}
          <div className="h-44 relative overflow-hidden bg-gradient-to-r from-neutral-800 to-neutral-700">
            {user.backgroundUrl ? (
              <img 
                src={user.backgroundUrl} 
                alt="Business cover" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 animate-in fade-in" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-kava-bg to-kava-bg opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>

          <div className="px-8 pb-3 -mt-16 relative z-10 flex items-end gap-5">
            <div className="w-24 h-24 rounded-3xl bg-neutral-900 border-4 border-white dark:border-neutral-900 flex items-center justify-center text-4xl shadow-xl relative overflow-hidden shrink-0">
              {user.avatarUrl ? (
                user.avatarUrl.length < 5 ? (
                  <span>{user.avatarUrl}</span>
                ) : (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )
              ) : (
                <div className="text-white p-3 bg-kava-text rounded-2xl">
                  <Store size={28} />
                </div>
              )}
            </div>
            <div className="mb-2">
              <h3 className="font-bebas text-4xl md:text-5xl text-white drop-shadow-md uppercase tracking-wider leading-none">{user.name}</h3>
              <p className="text-[9px] font-black text-kava-gold uppercase tracking-[0.3em] mt-1.5 inline-block bg-black/45 px-3 py-1 rounded-full backdrop-blur-md">Verified Merchant Partner</p>
            </div>
          </div>

          <div className="px-8 pb-8 pt-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-kava-muted/40 uppercase tracking-widest">
                <FileText size={12} />
                Business Bio
              </div>
              <p className="text-sm font-medium text-kava-muted leading-relaxed">
                {user.description || 'No business description provided. Update your profile to share your kava expertise with your client network.'}
              </p>
            </div>

            {/* Exporter Links & Communications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-kava-muted/40 uppercase tracking-widest">
                <Globe size={12} />
                Exporter Connections
              </div>
              <div className="flex flex-wrap gap-2">
                {user.phone && (
                  <a 
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-kava-gold/10 text-kava-gold border border-kava-gold/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Phone size={12} />
                    {user.phone}
                  </a>
                )}
                {user.website && (
                  <a 
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Globe size={12} />
                    Website
                  </a>
                )}
                {user.whatsapp && (
                  <a 
                    href={user.whatsapp.startsWith('http') ? user.whatsapp : `https://${user.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </a>
                )}
                {user.facebook && (
                  <a 
                    href={user.facebook.startsWith('http') ? user.facebook : `https://${user.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Facebook size={12} />
                    Facebook
                  </a>
                )}
                {!user.phone && !user.website && !user.whatsapp && !user.facebook && (
                  <span className="text-[10px] font-medium text-kava-muted/30 italic">No communication channels configured</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-kava-muted/40 uppercase tracking-widest">
                <Award size={12} />
                Certifications & Quality Tokens
              </div>
              <div className="flex flex-wrap gap-2">
                {user.certifications && user.certifications.length > 0 ? user.certifications.map((cert, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    {cert}
                  </span>
                )) : (
                  <span className="text-[10px] font-medium text-kava-muted/30 italic">No certifications listed</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-kava-text/5 flex items-center justify-between px-8 pb-8">
             <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-kava-surface bg-kava-text/10 flex items-center justify-center overflow-hidden">
                   <div className="w-full h-full bg-gradient-to-br from-kava-gold to-kava-text opacity-40" />
                 </div>
               ))}
               <div className="w-8 h-8 rounded-full border-2 border-kava-surface bg-white flex items-center justify-center text-[10px] font-black text-kava-gold">+12</div>
             </div>
             <span className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest">Global Trader Rating: 4.9/5</span>
          </div>
        </section>

        <section className="kava-card overflow-hidden transition-colors flex flex-col space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                <Navigation size={24} />
              </div>
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Operational Base</h3>
              <span className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest">
                {user.location && !isNaN(Number(user.location.lat)) && !isNaN(Number(user.location.lng)) ? `${Number(user.location.lat).toFixed(4)}, ${Number(user.location.lng).toFixed(4)}` : 'Coordinates unset'}
              </span>
            </div>

            <div className="flex gap-2">
              {!isEditingMapLocation ? (
                <button
                  type="button"
                  onClick={() => {
                    setTempCoords({ lat: user.location?.lat || -17.7333, lng: user.location?.lng || 168.3167 });
                    setIsEditingMapLocation(true);
                  }}
                  className="px-5 py-2.5 bg-kava-gold hover:bg-kava-gold/90 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-md text-left"
                >
                  Edit Map Location Pin
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (tempCoords) {
                        const updatedUser = {
                          ...user,
                          location: {
                            address: user.location?.address || 'Global Supply',
                            lat: Number(tempCoords.lat.toFixed(6)),
                            lng: Number(tempCoords.lng.toFixed(6))
                          }
                        };
                        const allUsers = storage.getUsers();
                        storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
                        if (onUpdateUser) onUpdateUser(updatedUser);
                        
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (session && session.user.id === user.id) {
                            await supabase
                              .from('users')
                              .update({ location: updatedUser.location })
                              .eq('id', user.id);
                          }
                        } catch (err) {
                          console.error('[SUPABASE] Sync coordinates error:', err);
                        }
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
                      setIsEditingMapLocation(false);
                    }}
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-kava-text rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer border border-neutral-300 dark:border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-[300px] mb-6">
            <BusinessMap 
              center={isEditingMapLocation && tempCoords ? tempCoords : { lat: user.location?.lat || -17.7333, lng: user.location?.lng || 168.3167 }} 
              title={user.name} 
              address={user.location?.address || 'Global Supply'} 
              isEditable={isEditingMapLocation}
              onChangeCoordinates={(lat, lng) => {
                setTempCoords({ lat, lng });
              }}
            />
          </div>
          <div className="bg-kava-text/5 p-5 rounded-3xl border border-white/20 mb-4">
             <div className="flex items-center gap-3 mb-1">
               <Info size={16} className="text-kava-gold" />
               <span className="text-[10px] font-bold text-kava-muted uppercase tracking-widest">Headquarters Address</span>
             </div>
             <p className="font-bold text-kava-text">{user.location?.address || 'Address information unavailable'}</p>
          </div>

          <div className="bg-kava-text/5 p-5 rounded-3xl border border-white/20">
             <div className="flex items-center gap-3 mb-4">
               <Store size={16} className="text-kava-gold" />
               <span className="text-[10px] font-bold text-kava-muted uppercase tracking-widest">Active Client Network</span>
               <span className="ml-auto bg-kava-gold/20 text-kava-gold px-2 py-0.5 rounded-full text-[10px] font-bold">
                 {servedBars.length} Bars
               </span>
             </div>
             
             <div className="space-y-2">
                {servedBars.length > 0 ? servedBars.map(bar => (
                  <div 
                    key={bar.id} 
                    onClick={() => setChatWithBar(bar)}
                    className="flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-white/40 cursor-pointer transition-all group/bar border border-transparent hover:border-white/20 shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-kava-text text-sm group-hover/bar:text-kava-gold transition-colors">{bar.name}</span>
                      <span className="text-[9px] text-kava-muted/40 uppercase tracking-wider">{bar.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative p-2 bg-kava-gold/10 text-kava-gold rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all">
                         <MessageCircle size={14} />
                      </div>
                      <div className={`w-2 h-2 rounded-full ${bar.status === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} title={bar.status} />
                    </div>
                  </div>
                )) : (
                 <p className="text-xs font-medium text-kava-muted/40 italic">No bars currently linked to your supply line</p>
               )}
             </div>
          </div>
        </section>

        <section className="bg-kava-surface backdrop-blur-md rounded-[48px] p-8 border border-white/20 shadow-xl overflow-hidden transition-colors flex flex-col space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
              <Clock size={24} />
            </div>
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Support Hours</h3>
          </div>

          <div className="flex-1 space-y-3 custom-scrollbar overflow-y-auto pr-2">
            {user.businessHours ? (
              Object.entries(user.businessHours).map(([day, hrs]) => (
                <div key={day} className="flex items-center justify-between bg-kava-text/5 rounded-2xl p-4 border border-white/10 group hover:border-kava-gold/20 transition-all">
                  <span className="font-bold text-kava-text uppercase tracking-widest text-[10px] w-20">{day}</span>
                  <div className="flex items-center gap-3">
                    {hrs.closed ? (
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Facility Closed</span>
                    ) : (
                      <>
                        <div className="bg-kava-bg/50 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                          <span className="text-[10px] font-bebas tracking-widest text-kava-gold">{hrs.open}</span>
                        </div>
                        <span className="text-kava-muted/30 font-bold"> - </span>
                        <div className="bg-kava-bg/50 px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                          <span className="text-[10px] font-bebas tracking-widest text-kava-gold">{hrs.close}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4 py-20">
                <Clock size={48} className="text-kava-muted" />
                <p className="font-bebas text-2xl tracking-widest uppercase">Hours not documented</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Logistics Tasks Section */}
      <section className="space-y-8">
        <div className="flex justify-between items-center px-4 md:px-0">
          <div>
            <h3 className="font-bebas text-5xl text-kava-text tracking-tight uppercase leading-none">Logistics Pipeline</h3>
            <p className="text-kava-muted/60 font-medium">Internal operational queue for supply chain management</p>
          </div>
          <button 
            onClick={() => setIsTaskFormOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-kava-text text-white rounded-[24px] font-bebas text-2xl tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={24} />
            Add Pipeline Task
          </button>
        </div>

        {/* Dynamic Context-Aware "Alive" Logistics Pipeline Monitor */}
        {(() => {
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(t => t.status === 'Completed').length;
          const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
          
          // Glowing status and responsive container shifts
          const dynamicGlow = completionRate === 1
            ? 'from-emerald-500/20 to-teal-500/20 shadow-[0_0_80px_rgba(16,185,129,0.3)] border-emerald-500/30'
            : completionRate > 0.4
            ? 'from-amber-500/15 to-emerald-500/15 shadow-[0_0_60px_rgba(245,158,11,0.2)] border-amber-500/20'
            : 'from-kava-gold/10 to-transparent shadow-[0_0_40px_rgba(230,160,23,0.1)] border-kava-gold/15';

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative overflow-hidden p-8 rounded-[38px] border-2 bg-gradient-to-br transition-all duration-700 ${dynamicGlow} kava-glass flex flex-col md:flex-row items-center justify-between gap-6 mx-4 md:mx-0`}
            >
              {/* Pulsing decorative organic backdrop orb */}
              <div 
                className="absolute -right-16 -top-16 w-72 h-72 rounded-full blur-3xl opacity-25 mix-blend-screen animate-pulse bg-gradient-to-bl from-kava-gold to-teal-400" 
                style={{ animationDuration: '8s', transform: `scale(${1 + completionRate * 0.45})` }} 
              />
              
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-kava-gold animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-kava-muted/80">Chain Optimization Diagnostics</span>
                </div>
                <h4 className="font-bebas text-4xl text-kava-text leading-tight">
                  {completionRate === 1 ? "SUPPLY ECOSYSTEM FULLY SATURATED" : completionRate > 0 ? "DISTRIBUTION PIPELINE ACTIVE" : "LOGISTICS DISPATCH QUEUED"}
                </h4>
                <p className="text-xs font-semibold text-kava-muted/80 mt-1 max-w-xl leading-relaxed">
                  Supply and logistics performance updates in real-time. Fulfill tasks to boost node-to-node operational synchronization and build friction-free transfer lanes.
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

        <div className="mx-4 md:mx-0 p-10 kava-holographic-glass rounded-[48px] shadow-xl overflow-hidden relative z-15">
          {tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {tasks.map(task => (
                  <motion.div 
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.91, y: -15 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25, mass: 0.8 }}
                    className={`group p-6 rounded-[34px] border-2 transition-all duration-300 kava-holographic-glass relative overflow-hidden ${
                      task.status === 'Completed' 
                        ? 'border-emerald-500/20' 
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
                            task.status === 'Completed' ? 'text-kava-muted line-through opacity-50' : 'text-kava-text'
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
                        Logged {new Date(task.createdAt).toLocaleDateString()}
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
            <div className="flex flex-col items-center justify-center py-20 space-y-8 opacity-20">
              <div className="p-10 bg-kava-text/5 rounded-[60px] animate-pulse">
                <CheckCircle size={80} strokeWidth={1} />
              </div>
              <div className="text-center">
                <p className="font-bebas text-5xl uppercase tracking-[0.2em]">Pipeline Empty</p>
                <p className="text-[10px] font-bold uppercase tracking-[4px]">Initiate a task to optimize your distribution logistics</p>
              </div>
            </div>
          )}
        </div>
      </section>
      </>)}

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
                <h3 className="font-bebas text-5xl text-kava-text">Pipeline Initiative</h3>
                <button onClick={() => setIsTaskFormOpen(false)} className="p-3 hover:bg-black/5 rounded-2xl transition-all">
                  <X size={24} className="text-kava-muted" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Objective</label>
                  <input 
                    autoFocus
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="e.g. Schedule root harvest shipment"
                    className="w-full bg-white border border-white rounded-[32px] py-6 px-10 text-xl font-bold text-kava-text focus:ring-4 focus:ring-kava-gold/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Strategic Notes</label>
                  <textarea 
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Logistical details and tactical requirements..."
                    className="w-full bg-white border border-white rounded-[32px] py-6 px-10 text-base font-medium text-kava-text focus:ring-4 focus:ring-kava-gold/10 outline-none transition-all resize-none h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted uppercase tracking-[0.2em] ml-2">Urgency Priority</label>
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

                <button 
                  type="submit"
                  className="w-full py-6 bg-kava-text text-white rounded-[32px] font-bebas text-3xl tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6"
                >
                  Confirm Entry
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B2B Communication Hub */}
      {activeTab === 'messages' && (
      <section id="b2b-chat-hub" className="kava-card flex flex-col h-[700px] animate-in fade-in zoom-in duration-700">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-80 border-r border-white/10 flex flex-col bg-white/5">
            <div className="p-8 border-b border-white/10">
              <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider leading-none">Client Network</h3>
              <p className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest mt-2">Direct B2B Channels</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {servedBars.length > 0 ? servedBars.map(bar => {
                const targetChat = allChats.find(c => c.participants.includes(bar.managerId));
                const lastMsg = targetChat?.lastMessage;

                return (
                  <button
                    key={bar.id}
                    onClick={() => setChatWithBar(bar)}
                    className={`w-full flex items-center gap-4 p-4 rounded-[32px] transition-all text-left group relative border border-transparent ${
                      chatWithBar?.id === bar.id ? 'bg-kava-gold text-white shadow-xl border-white/10' : 'hover:bg-white/60 text-kava-text hover:border-white/20'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bebas text-xl shrink-0 transition-all ${
                      chatWithBar?.id === bar.id ? 'bg-white/20 rotate-3' : 'bg-kava-text/5 text-kava-muted group-hover:bg-kava-gold group-hover:text-white group-hover:-rotate-3'
                    }`}>
                      {bar.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold truncate pr-1">{bar.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${bar.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-medium opacity-60">
                        <span className="truncate flex-1 pr-2">{lastMsg ? lastMsg.text : 'Initialize networking...'}</span>
                      </div>
                    </div>
                  </button>
                );
              }) : (
                <div className="py-20 text-center px-8 space-y-4 opacity-20">
                  <Store size={40} className="mx-auto" />
                  <p className="font-bebas text-xl uppercase tracking-widest italic">No client nodes identified</p>
                </div>
              )}
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-kava-bg/20">
            {chatWithBar ? (
              <>
                {/* Header */}
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/60 backdrop-blur-xl">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-kava-gold rounded-[24px] flex items-center justify-center font-bebas text-4xl text-white shadow-xl shadow-kava-gold/20 rotate-2">
                      {chatWithBar.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bebas text-5xl text-kava-text tracking-tight leading-none mb-1">{chatWithBar.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-kava-gold uppercase tracking-[4px]">Advanced B2B Node</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-black text-emerald-600 uppercase">Synced</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {chatHistory.length > 0 && (
                    <button
                      onClick={analyzeMessage}
                      disabled={isAnalyzingMsg}
                      className="flex items-center gap-2 px-6 py-2.5 bg-kava-text hover:bg-kava-text/95 disabled:hover:bg-kava-text text-white rounded-[20px] font-bebas text-lg tracking-wider shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                      <span>✨</span>
                      <span>{isAnalyzingMsg ? 'ANALYZING INTENT...' : 'GENKIT AI ANALYSIS'}</span>
                    </button>
                  )}
                </div>

                {msgAnalysis && (
                  <div className="mx-10 mt-6 p-6 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-[28px] flex items-start gap-4 shadow-md">
                    <div className="text-xl p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-600 mt-1">
                      ✨
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[3px] text-emerald-700">Genkit AI Intent Analysis</span>
                        <button 
                          onClick={() => setMsgAnalysis(null)}
                          className="text-[10px] font-bold text-emerald-700/60 hover:text-emerald-700 uppercase tracking-widest transition-all"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-kava-text/80 leading-relaxed">{msgAnalysis}</p>
                    </div>
                  </div>
                )}
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                  {chatHistory.length > 0 ? chatHistory.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: msg.senderId === user.id ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex message message-new ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] space-y-1.5`}>
                        <div className={`p-6 rounded-[34px] text-sm font-medium shadow-xl leading-relaxed ${
                          msg.senderId === user.id 
                            ? 'bg-kava-text text-white rounded-tr-none' 
                            : 'bg-white rounded-tl-none text-kava-text border border-white shadow-kava-text/5'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-3 px-3 text-[9px] font-black uppercase tracking-widest text-kava-muted/40 ${
                          msg.senderId === user.id ? 'justify-end text-kava-gold' : 'justify-start'
                        }`}>
                          <Clock size={10} className="mb-0.5" />
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-8 text-center px-12">
                      <div className="p-10 bg-kava-text/5 rounded-[40px] border border-white">
                        <MessageSquare size={80} strokeWidth={1} />
                      </div>
                      <div className="space-y-2">
                        <p className="font-bebas text-5xl uppercase tracking-widest leading-none">Establish Link</p>
                        <p className="text-[10px] font-bold uppercase tracking-[4px] max-w-xs mx-auto leading-relaxed">
                          Initialize a professional supply proposition or logistics update to start networking with this node.
                        </p>
                      </div>
                    </div>
                  )}
                  {isPartnerTyping && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white/40 backdrop-blur-md px-6 py-4 rounded-[24px] rounded-tl-sm flex items-center gap-1.5">
                        <div className="typing-dots flex gap-1">
                          <span className="w-1.5 h-1.5 bg-kava-muted/40 rounded-full"></span>
                          <span className="w-1.5 h-1.5 bg-kava-muted/40 rounded-full"></span>
                          <span className="w-1.5 h-1.5 bg-kava-muted/40 rounded-full"></span>
                        </div>
                        <span className="text-[8px] font-black text-kava-muted/40 uppercase tracking-widest ml-1">Node Typing...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
                {/* Input Area */}
                <form onSubmit={sendB2BMessage} className="p-10 border-t border-white/10 bg-white/40 backdrop-blur-xl">
                  <div className="flex gap-5">
                    <input 
                      value={chatText}
                      onChange={(e) => {
                        setChatText(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Draft encrypted B2B transmission..."
                      className="flex-1 bg-white/80 border border-white rounded-[32px] py-6 px-10 text-base font-medium text-kava-text focus:ring-0 focus:border-kava-gold/50 shadow-2xl shadow-kava-text/5 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!chatText.trim()}
                      className="kava-button p-6 bg-kava-gold text-white disabled:opacity-30 shadow-2xl shadow-kava-gold/20 active:scale-95 group/send"
                    >
                      <Send size={28} className="group-hover/send:translate-x-1 group-hover/send:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-10 opacity-30">
                <div className="p-14 bg-kava-gold/5 rounded-[60px] text-kava-gold border border-kava-gold/10 shadow-2xl transform rotate-3">
                  <MessageCircle size={120} strokeWidth={0.5} />
                </div>
                <div className="space-y-4">
                  <h3 className="font-bebas text-7xl text-kava-text uppercase tracking-widest flex items-center justify-center gap-6">
                    Channel <span className="text-kava-gold italic">Ready</span>
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-[5px] text-kava-muted max-w-lg mx-auto leading-relaxed">
                    Select an active business partner from the client network sidebar to establish a high-priority negotiation channel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {activeTab === 'dashboard' && (<>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Marketplace Engagement Form */}
        <section className="kava-card flex flex-col space-y-8">
           <div className="flex justify-between items-center">
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Marketplace Announcement</h3>
            <div className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">🔒 B2B Only</div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <span className="text-[10px] font-black text-kava-text uppercase tracking-widest">Ecosystem Social Import Hub</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setImportSource('facebook'); setIsImporting(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  isImporting && importSource === 'facebook'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'bg-blue-600/10 text-blue-600 border border-blue-600/20 hover:bg-blue-600/20'
                }`}
              >
                <Facebook size={12} />
                Facebook Import
              </button>
              <button
                type="button"
                onClick={() => { setImportSource('instagram'); setIsImporting(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  isImporting && importSource === 'instagram'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/25'
                    : 'bg-pink-600/10 text-pink-600 border border-pink-600/20 hover:bg-pink-600/20'
                }`}
              >
                <Instagram size={12} />
                Instagram Import
              </button>
              <button
                type="button"
                onClick={() => { setImportSource('whatsapp'); setIsImporting(true); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                  isImporting && importSource === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-emerald-600/10 text-emerald-600 border border-emerald-600/25 hover:bg-emerald-600/20'
                }`}
              >
                <Phone size={12} />
                WhatsApp Group
              </button>
              {isImporting && (
                <button
                  type="button"
                  onClick={() => setIsImporting(false)}
                  className="text-[9px] font-black text-neutral-400 hover:text-neutral-600 uppercase tracking-widest px-2 py-1.5"
                >
                  Hide [X]
                </button>
              )}
            </div>
          </div>

          {isImporting && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border space-y-3 ${
                importSource === 'facebook' ? 'bg-blue-50/50 border-blue-100' :
                importSource === 'instagram' ? 'bg-pink-50/50 border-pink-100' :
                'bg-emerald-50/50 border-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link size={13} className={
                    importSource === 'facebook' ? 'text-blue-600' :
                    importSource === 'instagram' ? 'text-pink-600' :
                    'text-emerald-600'
                  } />
                  <span className="text-[10px] font-black uppercase tracking-wider text-kava-text leading-none">
                    Extract post from {importSource} Page / Chat Link
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSocialImport(importSource)}
                  className={`px-3 py-1 text-[8.5px] font-black uppercase tracking-widest rounded-lg text-white shadow-sm hover:scale-105 transition-all cursor-pointer ${
                    importSource === 'facebook' ? 'bg-blue-600' :
                    importSource === 'instagram' ? 'bg-pink-600' :
                    'bg-emerald-600'
                  }`}
                >
                  ✨ Auto-Fill Demo content
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  value={socialImportUrl}
                  onChange={(e) => setSocialImportUrl(e.target.value)}
                  placeholder={`Paste active ${importSource} url link to auto-fetch...`}
                  className="flex-1 bg-white border border-neutral-200 rounded-xl py-2 px-4 text-xs focus:ring-1 focus:ring-kava-gold transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleSocialImport(importSource)}
                  className={`px-5 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl text-white ${
                    importSource === 'facebook' ? 'bg-blue-600' :
                    importSource === 'instagram' ? 'bg-pink-600' :
                    'bg-emerald-600'
                  }`}
                >
                  Import Link
                </button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handlePostUpdate} className="space-y-4">
             <div className="flex gap-2">
              {(['notice', 'product'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewUpdate({...newUpdate, type})}
                  className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    newUpdate.type === type ? 'bg-kava-gold text-white shadow-md' : 'bg-kava-text/5 text-kava-muted'
                  }`}
                >
                  {type === 'notice' && <Bell size={12} className="inline mr-1" />}
                  {type === 'product' && <Plus size={12} className="inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="space-y-1.55">
                <label className="text-[10px] font-black uppercase text-kava-gold tracking-widest block ml-1 select-none">
                  📢 CUSTOM SOCIAL POSTER HEADER & HEADLINE BROADCAST TITLE
                </label>
                <input 
                  placeholder="Ex: PREMIUM dried lateral roots bulk shipping batch"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({...newUpdate, title: e.target.value})}
                  className="w-full bg-white/55 border border-white/85 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-kava-gold/30 text-xs font-black uppercase tracking-wider shadow-sm"
                />
              </div>
              <textarea 
                placeholder="Describe your batch, quality, or business notice..."
                value={newUpdate.description}
                rows={3}
                onChange={(e) => setNewUpdate({...newUpdate, description: e.target.value})}
                className="w-full bg-white/50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-kava-gold/30 text-sm font-medium resize-none shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-[0.2em] ml-2">Add Product Visual</label>
                <ImageDropZone 
                  id="supplier-product-upload"
                  imageUrl={filePreview}
                  onImageChange={(base64) => { setFilePreview(base64); setNewUpdate({...newUpdate, imageUrl: base64}); }}
                  onImageRemove={() => { setFilePreview(null); setNewUpdate({...newUpdate, imageUrl: ''}); }}
                  label="Product photo"
                  className="h-40"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-[0.2em] ml-2">Share Batch Visual</label>
                <ImageDropZone 
                  id="supplier-batch-upload"
                  imageUrl={adFilePreview}
                  onImageChange={(base64) => { setAdFilePreview(base64); setNewUpdate({...newUpdate, adImageUrl: base64}); }}
                  onImageRemove={() => { setAdFilePreview(null); setNewUpdate({...newUpdate, adImageUrl: ''}); }}
                  label="Batch / Stock photo"
                  className="h-40"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-kava-text text-white rounded-2xl font-bebas text-2xl tracking-widest hover:bg-kava-gold transition-all shadow-lg"
            >
              Broadcast to Managers
            </button>
          </form>
        </section>

        {/* Promotion Banner Customizer */}
        <section className="bg-kava-surface backdrop-blur-md rounded-[48px] p-8 border border-white/20 shadow-xl flex flex-col space-y-6">
           <div className="flex justify-between items-center">
            <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Promotion Management</h3>
            {!showPromo && (
              <button 
                onClick={() => setShowPromo(true)}
                className="text-[10px] font-black text-kava-gold uppercase tracking-widest hover:underline"
              >
                Restore Banner
              </button>
            )}
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-3 gap-2">
                {(['featured', 'sale', 'alert'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setPromoConfig({...promoConfig, type})}
                    className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${
                      promoConfig.type === type 
                        ? 'bg-kava-text text-white border-transparent shadow-lg' 
                        : 'bg-white/50 text-kava-muted border-white/20 hover:bg-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
             </div>

             <div className="space-y-3">
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-widest ml-2">Banner Headline</label>
                 <input 
                  value={promoConfig.title}
                  onChange={(e) => setPromoConfig({...promoConfig, title: e.target.value})}
                  className="w-full bg-white/50 border-none rounded-2xl py-3 px-5 text-sm font-bold focus:ring-2 focus:ring-kava-gold/30"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-widest ml-2">Promotion Details</label>
                 <textarea 
                  value={promoConfig.description}
                  rows={2}
                  onChange={(e) => setPromoConfig({...promoConfig, description: e.target.value})}
                  className="w-full bg-white/50 border-none rounded-2xl py-3 px-5 text-sm font-medium focus:ring-2 focus:ring-kava-gold/30 resize-none"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-black text-kava-muted/40 uppercase tracking-widest ml-2">CTA Button Text</label>
                 <input 
                  value={promoConfig.buttonText}
                  onChange={(e) => setPromoConfig({...promoConfig, buttonText: e.target.value})}
                  className="w-full bg-white/50 border-none rounded-2xl py-3 px-5 text-sm font-bold focus:ring-2 focus:ring-kava-gold/30"
                 />
               </div>
             </div>
          </div>
          
          <div className="mt-auto p-4 bg-kava-gold/5 rounded-2xl border border-kava-gold/10">
            <p className="text-[10px] font-medium text-kava-gold leading-relaxed">
              <Info size={12} className="inline mr-1 mb-0.5" />
              Changes to this banner are reflected immediately for your internal viewing. 
              Dismissed banners can be restored anytime using the control above.
            </p>
          </div>
        </section>
      </div>

      {/* Global Market Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Business Pulse (Left 2 columns) */}
        <div className="lg:col-span-2">
          <section className="kava-card flex flex-col space-y-8 h-full">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                 <AlertCircle size={24} />
               </div>
               <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Business Pulse</h3>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {marketUpdates.map((upd) => (
                <motion.div 
                  key={upd.id} 
                  whileHover={{ y: -4, scale: 1.008, boxShadow: "0 15px 25px -5px rgba(0,0,0,0.06)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="bg-white/40 rounded-[32px] overflow-hidden border border-white/50 flex flex-col hover:border-kava-gold/25 shadow-sm transition-all"
                >
                  <div className="flex bg-kava-text/5">
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
                  <div className="p-5 space-y-2">
                     <div className="flex items-center gap-2 mb-1">
                        {upd.barId.startsWith('supplier-') ? (
                          <span className="text-[8px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Supplier Intel</span>
                        ) : (
                          <span className="text-[8px] font-black text-kava-gold bg-kava-gold/5 px-2 py-0.5 rounded-full uppercase">Venue Notice</span>
                        )}
                        <span className="text-[8px] font-bold text-kava-muted/40 mb-0.5 ml-auto">{new Date(upd.timestamp).toLocaleDateString()}</span>
                     </div>
                     <h4 className="font-bold text-kava-text text-base leading-tight">{upd.title}</h4>
                     <p className="text-xs text-kava-muted font-medium line-clamp-3 leading-relaxed">{upd.description}</p>
                  </div>
                </motion.div>
              ))}
               {marketUpdates.length === 0 && (
                <div className="text-center py-20 opacity-20">
                  <Bell size={48} className="mx-auto mb-4" />
                  <p className="font-bebas text-2xl tracking-widest uppercase">No Market Activity</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Exporter Active Buy Rates Feed (Right/1 column) */}
        <div className="lg:col-span-1">
          <section className="kava-card flex flex-col space-y-6 h-full bg-gradient-to-br from-white/20 to-white/5 border border-white/40 backdrop-blur-md rounded-[38px] p-6 shadow-xl overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-kava-gold/5 rounded-full blur-2xl animate-pulse" />
             
             <div className="flex items-center gap-3 border-b border-kava-text/5 pb-4 relative z-10">
                <div className="p-2 bg-kava-gold/15 rounded-xl text-kava-gold">
                   <Globe size={24} className="animate-spin-slow" />
                </div>
                <div>
                   <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider leading-none">Export Buyers</h3>
                   <p className="text-[9px] font-black text-kava-muted uppercase tracking-widest mt-1">Vanuatu Port Vila Market Feed</p>
                </div>
             </div>

             <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar relative z-10">
                 {exporters.map(exp => {
                   const gkRoots = exp.exporterRates?.greenKavaRoots || 1650;
                   const gkChips = exp.exporterRates?.greenKavaChips || 1200;
                   const sdRoots = exp.exporterRates?.sunDriedKavaRoots || 2750;
                   const sdChips = exp.exporterRates?.sunDriedKavaChips || 2200;
                   const instPowder = exp.exporterRates?.instantPowder || 3800;
                   
                   return (
                     <div key={exp.id} className="bg-white/55 dark:bg-black/20 rounded-[28px] p-5 shadow-sm border border-white hover:border-kava-gold/30 hover:shadow-md transition-all group flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-kava-gold/10 text-kava-gold flex items-center justify-center font-bebas text-base font-bold flex-shrink-0">
                                 {exp.name.charAt(0)}
                              </div>
                              <div>
                                 <h4 className="font-bold text-xs text-kava-text group-hover:text-kava-gold transition-colors">{exp.name}</h4>
                                 <span className="text-[8px] font-black uppercase tracking-widest text-kava-muted/80">{exp.businessName || "Registered Exporter"}</span>
                              </div>
                           </div>
                           
                           <button
                             onClick={async () => {
                               feedbackService.vibrate('tap');
                               feedbackService.playSound('tap');
                               const chatId = await chatService.getOrCreateDirectChat(user.id, exp.id);
                               const messageText = `Hello ${exp.name}, I am a Supplier. I saw your buyer offer rates on the feed:\n` +
                                 `- Green Kava Roots: ${gkRoots} VUV/kg\n` +
                                 `- Green Kava Chips: ${gkChips} VUV/kg\n` +
                                 `- Sun-Dried Roots: ${sdRoots} VUV/kg\n` +
                                 `- Sun-Dried Chips: ${sdChips} VUV/kg\n` +
                                 `- Instant Powdered Kava: ${instPowder} VUV/kg\n` +
                                 `I would like to discuss supply deals.`;
                               await chatService.sendMessage(chatId, user.id, messageText);
                               window.dispatchEvent(new CustomEvent('switchTab', { detail: 'messages' }));
                             }}
                             className="bg-kava-text text-white hover:bg-kava-gold text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all active:scale-95 flex items-center gap-1 flex-shrink-0"
                           >
                              Contact Buyer
                           </button>
                        </div>

                        <div className="space-y-3 pt-1">
                          {/* Green Kava segment */}
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black tracking-widest text-emerald-600 block uppercase">🌿 Green Kava Rates</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 flex flex-col items-center text-center">
                                 <span className="text-[7.5px] font-bold text-kava-muted uppercase tracking-wider mb-0.5">Roots</span>
                                 <span className="font-bebas text-base text-kava-text leading-none">{formatPrice(gkRoots)}</span>
                              </div>
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2 flex flex-col items-center text-center">
                                 <span className="text-[7.5px] font-bold text-kava-muted uppercase tracking-wider mb-0.5">Chips</span>
                                 <span className="font-bebas text-base text-kava-text leading-none">{formatPrice(gkChips)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Sun-Dried segment */}
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black tracking-widest text-amber-600 block uppercase">🍂 Sun-Dried / Processed Rates</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2 flex flex-col items-center text-center">
                                 <span className="text-[7px] font-bold text-kava-muted uppercase tracking-wider mb-0.5">Roots</span>
                                 <span className="font-bebas text-sm text-kava-text leading-none">{formatPrice(sdRoots)}</span>
                              </div>
                              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2 flex flex-col items-center text-center">
                                 <span className="text-[7px] font-bold text-kava-muted uppercase tracking-wider mb-0.5">Cheaps</span>
                                 <span className="font-bebas text-sm text-kava-text leading-none">{formatPrice(sdChips)}</span>
                              </div>
                              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-2 flex flex-col items-center text-center">
                                 <span className="text-[7px] font-bold text-kava-muted uppercase tracking-wider mb-0.5">Powder</span>
                                 <span className="font-bebas text-sm text-kava-text leading-none">{formatPrice(instPowder)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                     </div>
                   );
                 })}

                {exporters.length === 0 && (
                  <div className="text-center py-10 opacity-35 italic text-[10px] font-bold uppercase tracking-widest">
                     No active export buyer nodes logged on Vanuatu feed.
                  </div>
                )}
             </div>

             <div className="bg-kava-gold/5 border border-kava-gold/10 rounded-2xl p-3 mt-auto">
                <p className="text-[8px] font-bold text-kava-gold uppercase tracking-wider leading-relaxed text-center">
                   Rates syndicated live in Vanuatu Port Vila central trade feed index.
                </p>
             </div>
          </section>
        </div>

      </div>
      </>)}

      {activeTab === 'inventory' && (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 md:px-0">
          <div className="flex items-center gap-4">
             <div className="p-2 bg-kava-text/5 rounded-xl text-kava-muted">
               <Package size={20} />
             </div>
             <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Inventory Products</h3>
             <button
               onClick={generatePromotions}
               disabled={isGeneratingPromos || products.length === 0}
               className="flex items-center gap-2 px-5 py-2.5 bg-kava-gold hover:bg-kava-gold/90 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-md active:scale-95"
             >
               {isGeneratingPromos ? 'Syncing AI...' : '✨ Genkit AI Promo'}
             </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Elegant Search Input */}
            <div className="flex items-center gap-3 bg-kava-surface border border-white/20 px-4 py-2.5 rounded-2xl shadow-sm">
              <Search size={14} className="text-kava-muted/40 shrink-0" />
              <input 
                type="text" 
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  feedbackService.trigger('type');
                }}
                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-kava-text uppercase tracking-widest focus:outline-none min-w-[160px]"
              />
            </div>

            {/* Filter by Supplier */}
            <div className="flex items-center gap-3 bg-kava-surface border border-white/20 p-1.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-kava-muted uppercase tracking-widest pl-3">Supplier:</span>
              <select 
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-kava-gold uppercase tracking-wider min-w-[150px] cursor-pointer"
              >
                <option value="all" className="bg-kava-surface text-kava-text">All Suppliers</option>
                {suppliers.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-kava-surface text-kava-text">
                    {opt.name} {opt.id === user.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Bar */}
            <div className="flex items-center gap-3 bg-kava-surface border border-white/20 p-1.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-kava-muted uppercase tracking-widest pl-3">Filter by Bar:</span>
              <select 
                value={barFilter}
                onChange={(e) => setBarFilter(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-bold text-kava-gold uppercase tracking-wider min-w-[150px] cursor-pointer"
              >
                <option value="all" className="bg-kava-surface text-kava-text">All Global Supply</option>
                {servedBars.map(bar => (
                  <option key={bar.id} value={bar.id} className="bg-kava-surface text-kava-text">{bar.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {results
              .filter(p => supplierFilter === 'all' || p.supplierId === supplierFilter)
              .filter(p => barFilter === 'all' || p.barId === barFilter)
              .map((product) => {
              return (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-kava-surface backdrop-blur-md rounded-[40px] border border-white/20 p-8 space-y-6 hover:shadow-2xl transition-all group flex flex-col justify-between"
                >
                  {/* Local logic helper definitions */}
                  {(() => {
                    const isOwnProduct = product.supplierId === user.id;
                    const productSupplier = suppliers.find(s => s.id === product.supplierId);
                    const supplierName = productSupplier ? productSupplier.name : "Partner Supplier";

                    return (
                      <>
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="p-3 bg-kava-text/5 rounded-2xl text-kava-muted group-hover:bg-kava-gold group-hover:text-white transition-all">
                              <Package size={24} />
                            </div>
                            <div className="flex flex-col items-end max-w-[180px]">
                              <span className="text-[10px] font-black text-kava-gold uppercase tracking-widest bg-kava-gold/5 px-2 py-1 rounded-full border border-kava-gold/10 truncate max-w-full">
                                {isOwnProduct ? "Your SKU" : supplierName}
                              </span>
                              <span className="text-[8px] font-bold text-kava-muted/30 uppercase mt-1">Ref: {product.id.slice(0, 8)}</span>
                            </div>
                          </div>

                          {/* Catalog style read-only image */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-kava-muted/40 uppercase tracking-[0.2em] ml-1">Product Asset</label>
                            <div className="relative h-48 rounded-3xl overflow-hidden border border-white/10 shadow-lg bg-kava-text/5">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-kava-muted/30">
                                  <Package size={32} className="opacity-40 mb-1" />
                                  <span className="text-[8px] font-black uppercase tracking-widest">No Image Asset</span>
                                </div>
                              )}
                              {isOwnProduct && (
                                <div className="absolute top-3 left-3 bg-kava-gold/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10 shadow-sm">
                                  ★ Active SKU
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-1">Product Designation</label>
                            <div className="py-2 font-bold text-2xl text-kava-text tracking-wide truncate border-b-2 border-transparent">
                              {product.name}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-1">Promotional Description</label>
                            <div className="w-full min-h-[90px] text-xs bg-kava-text/5 border border-white/10 rounded-2xl p-4 font-medium text-kava-muted leading-relaxed select-all">
                              {product.description || <span className="italic opacity-35">No catalog synopsis available for this batch material.</span>}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-1">Wholesale Price</label>
                              <span className="text-[10px] font-bold text-kava-gold uppercase">Bulk Rates</span>
                            </div>
                            <div className="flex items-center gap-3 bg-kava-text/5 p-4 rounded-2xl border border-white/10">
                              <Tag size={18} className="text-kava-muted/20" />
                              <div className="flex-1 font-bebas text-3xl text-kava-gold">
                                {formatPrice(product.price)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                             <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-1">Current Stock</label>
                              <span className={`text-[10px] font-bold uppercase ${
                                (product.stockLevel || 0) < 10 ? 'text-rose-500' : 'text-emerald-500'
                              }`}>
                                {(product.stockLevel || 0) < 10 ? 'Low Stock Alert' : 'Healthy Inventory'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 bg-kava-text/5 p-4 rounded-2xl border border-white/10">
                              <Package size={18} className="text-kava-muted/20" />
                              <div className="flex-1 font-bebas text-3xl text-kava-text">
                                {product.stockLevel || 0}
                              </div>
                              <span className="font-bebas text-xl text-kava-muted/30">Units</span>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2">
                             <label className="text-[10px] font-bold text-kava-muted opacity-40 uppercase tracking-widest ml-1">Product Tags</label>
                             <div className="flex flex-wrap gap-1.5 pt-1">
                               {(product.tags && product.tags.length > 0) ? product.tags.map((tag, i) => (
                                 <span key={i} className="px-3 py-1 bg-kava-gold/10 border border-kava-gold/10 text-kava-gold text-[10px] font-bold rounded-xl uppercase tracking-wider">
                                   #{tag}
                                 </span>
                               )) : (
                                 <span className="text-[10px] italic opacity-35 px-1">No tag metrics listed</span>
                               )}
                             </div>
                          </div>
                        </div>

                        {/* Visually Distinct Action Buttons */}
                        <div className="pt-6 mt-4 border-t border-kava-text/5 flex flex-col gap-3">
                           {isOwnProduct ? (
                             <>
                               <div className="flex w-full gap-2">
                                 <button 
                                    onClick={() => startEditing(product)}
                                    className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-white bg-kava-gold hover:bg-gold-600 px-4 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-sm hover:brightness-105 active:scale-95"
                                  >
                                    <Pencil size={14} />
                                    Edit Product
                                 </button>
                                 <button 
                                    onClick={() => startDeleting(product)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-rose-500 bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/20 rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
                                    title="Delete product"
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                 </button>
                               </div>
                               {product.barId && (
                                 <button 
                                    onClick={() => contactBarManager(product.barId)}
                                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 transition-all uppercase tracking-wider"
                                  >
                                    <MessageSquare size={14} />
                                    Contact Manager
                                 </button>
                               )}
                             </>
                           ) : (
                             <>
                               <button 
                                  onClick={() => contactSupplier(product.supplierId)}
                                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-kava-gold bg-kava-gold/10 hover:bg-kava-gold hover:text-white px-4 py-3 rounded-xl border border-kava-gold/20 transition-all uppercase tracking-wider"
                                >
                                  <MessageCircle size={14} />
                                  Ping Supplier Partner
                               </button>
                             </>
                           )}
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {results
            .filter(p => supplierFilter === 'all' || p.supplierId === supplierFilter)
            .filter(p => barFilter === 'all' || p.barId === barFilter)
            .length === 0 && (
            <div className="col-span-full py-32 text-center space-y-6">
               <div className="font-bebas text-6xl text-kava-muted/10 uppercase tracking-widest italic">No matching products</div>
               <p className="text-kava-muted/40 uppercase font-bold tracking-widest">Adjust your filter or initialize a new supply line</p>
               <button 
                onClick={addProduct}
                className="px-12 py-4 border-2 border-kava-gold text-kava-gold rounded-full font-bebas text-2xl hover:bg-kava-gold hover:text-white transition-all tracking-widest"
               >
                 Initialize Supply Line
               </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* B2B Chat Sidebar/Drawer */}
      <AnimatePresence>
        {chatWithBar && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-kava-surface backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] z-[100] flex flex-col"
          >
            <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/5">
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bebas text-4xl text-kava-gold tracking-tight mb-0.5">Direct Line</h4>
                    <p className="text-[9px] font-bold text-kava-muted uppercase tracking-[2px]">Partner: {chatWithBar.name}</p>
                  </div>
                  <button 
                    onClick={() => setChatWithBar(null)}
                    className="p-2 bg-kava-text/5 hover:bg-kava-text/10 rounded-xl transition-all self-start"
                  >
                    <X size={16} className="text-kava-muted" />
                  </button>
                </div>
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {chatHistory.length > 0 ? chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-3xl text-xs font-medium ${
                    msg.senderId === user.id 
                      ? 'bg-kava-gold text-white rounded-tr-none' 
                      : 'bg-kava-text/5 text-kava-text rounded-tl-none border border-white/10'
                  }`}>
                    {msg.text}
                    <div className="text-[8px] opacity-40 mt-1 uppercase font-bold tracking-widest">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                  <MessageCircle size={48} />
                  <p className="font-bebas text-2xl uppercase tracking-widest text-center px-12">Establish a secure supply discussion channel</p>
                </div>
              )}
            </div>

            <form onSubmit={sendB2BMessage} className="p-8 border-t border-white/10 bg-black/5">
              <div className="flex gap-3">
                <input 
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Draft supply proposal..."
                  className="flex-1 bg-white/10 border-none rounded-2xl py-4 px-6 text-sm font-medium text-kava-text focus:ring-2 focus:ring-kava-gold/40 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!chatText.trim()}
                  className="p-4 bg-kava-gold text-white rounded-2xl hover:bg-kava-gold/80 transition-all disabled:opacity-30 shadow-lg shadow-kava-gold/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileEditing && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileEditing(false)}
              className="absolute inset-0 bg-kava-bg/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-4xl bg-kava-surface rounded-[48px] border border-white/20 shadow-3xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-kava-gold/10 rounded-2xl text-kava-gold">
                    <Settings size={28} />
                  </div>
                  <div>
                    <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider leading-none">Business Profile</h3>
                    <p className="text-[10px] font-bold text-kava-muted/40 uppercase tracking-widest mt-1">Configure your market identity</p>
                  </div>
                </div>
                <button onClick={() => setIsProfileEditing(false)} className="p-3 bg-kava-text/5 hover:bg-kava-text/10 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: General Info */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1">Merchant Name</label>
                      <input 
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        className="w-full bg-white/50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-kava-gold/30 font-bold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1">Company Bio / Description</label>
                      <textarea 
                        value={profileForm.description}
                        onChange={(e) => setProfileForm({...profileForm, description: e.target.value})}
                        className="w-full bg-white/50 border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-kava-gold/30 font-medium resize-none"
                        rows={5}
                        placeholder="Share your heritage, sourcing standards, and specialized kava varieties..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                        Certifications
                        <span className="text-[8px] font-normal lowercase">(comma separated)</span>
                      </label>
                      <div className="relative">
                        <Award className="absolute left-4 top-4 text-kava-gold" size={18} />
                        <input 
                          value={profileForm.certifications}
                          onChange={(e) => setProfileForm({...profileForm, certifications: e.target.value})}
                          className="w-full bg-white/50 border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-kava-gold/30 font-bold"
                          placeholder="e.g. Organic, Fair Trade, Quality Grade A"
                        />
                      </div>
                    </div>

                    {/* Location Address & Map Coords */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1 flex items-center gap-1.5 font-sans">
                        <MapPin size={12} className="text-kava-gold" />
                        Operational Base (Location)
                      </label>
                      
                      {/* Integrated Interactive map for seamless visual location pin dropped registration */}
                      <div className="w-full h-[220px] rounded-3xl overflow-hidden border border-white/10 shadow-lg relative bg-[#f6f2ee] mb-4">
                        <BusinessMap 
                          center={{ lat: Number(profileForm.locationLat) || -17.7333, lng: Number(profileForm.locationLng) || 168.3167 }} 
                          title={profileForm.name || "My Operations Hub"} 
                          address={profileForm.locationAddress || "Location Address"} 
                          isEditable={true}
                          onChangeCoordinates={(lat, lng) => {
                            setProfileForm(prev => ({
                              ...prev,
                              locationLat: Number(lat.toFixed(6)),
                              locationLng: Number(lng.toFixed(6))
                            }));
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 text-kava-muted/40" size={18} />
                          <input 
                            value={profileForm.locationAddress}
                            onChange={(e) => setProfileForm({...profileForm, locationAddress: e.target.value})}
                            className="w-full bg-white/50 border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-kava-gold/30 font-bold"
                            placeholder="e.g. 52 Kumul Highway, Port Vila, Vanuatu"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-kava-muted/55 uppercase tracking-wider ml-1">Latitude</label>
                            <input 
                              type="number"
                              step="any"
                              value={profileForm.locationLat}
                              onChange={(e) => setProfileForm({...profileForm, locationLat: parseFloat(e.target.value) || 0})}
                              className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 font-semibold text-xs"
                              placeholder="-17.7333"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-kava-muted/55 uppercase tracking-wider ml-1">Longitude</label>
                            <input 
                              type="number"
                              step="any"
                              value={profileForm.locationLng}
                              onChange={(e) => setProfileForm({...profileForm, locationLng: parseFloat(e.target.value) || 0})}
                              className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 font-semibold text-xs"
                              placeholder="168.3167"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                          <span className="text-[9.5px] font-semibold text-kava-muted">
                            📍 Automatically fetch coordinates with live device satellites.
                          </span>
                          <button 
                            type="button"
                            onClick={handleAutoLocateGPS}
                            disabled={gpsDetecting}
                            className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95 disabled:opacity-55"
                          >
                            {gpsDetecting ? "Acquiring..." : "🎯 Auto GPS Locate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Business Hours */}
                  <div className="space-y-6">
                    <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Clock size={14} />
                      Logistics Availability
                    </label>
                    <div className="space-y-2 bg-white/30 p-4 rounded-[32px] border border-white/40">
                      {Object.keys(profileForm.businessHours).map((day) => (
                        <div key={day} className="flex items-center gap-3 p-2 hover:bg-white/40 rounded-xl transition-all">
                          <span className="text-[10px] font-bold text-kava-text uppercase tracking-widest w-20">{day}</span>
                          <input 
                            type="checkbox"
                            checked={profileForm.businessHours[day].closed}
                            onChange={(e) => updateProfileHour(day, 'closed', e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 text-kava-gold focus:ring-kava-gold"
                          />
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter w-12">Closed</span>
                          
                          <div className={`flex items-center gap-2 flex-1 transition-opacity ${profileForm.businessHours[day].closed ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                            <input 
                              type="time" 
                              value={profileForm.businessHours[day].open}
                              onChange={(e) => updateProfileHour(day, 'open', e.target.value)}
                              className="bg-white/40 border-none rounded-lg text-[10px] font-bold py-1 px-2 focus:ring-kava-gold w-full"
                            />
                            <span className="text-kava-muted/30">/</span>
                            <input 
                              type="time" 
                              value={profileForm.businessHours[day].close}
                              onChange={(e) => updateProfileHour(day, 'close', e.target.value)}
                              className="bg-white/40 border-none rounded-lg text-[10px] font-bold py-1 px-2 focus:ring-kava-gold w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Digital Connection Channels */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1 flex items-center gap-1.5 font-sans">
                        <Globe size={12} className="text-kava-gold" />
                        Exporter Digital Channels
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-kava-muted/55 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Phone size={10} className="text-kava-gold" /> Phone Contact
                          </label>
                          <input 
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 font-bold text-xs"
                            placeholder="+678 555 1234"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-kava-muted/55 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Globe size={10} className="text-kava-gold" /> Website Link
                          </label>
                          <input 
                            value={profileForm.website}
                            onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                            className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 font-bold text-xs"
                            placeholder="www.vanuatukava.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <MessageCircle size={10} className="text-emerald-500" /> WhatsApp Link
                          </label>
                          <input 
                            value={profileForm.whatsapp}
                            onChange={(e) => setProfileForm({...profileForm, whatsapp: e.target.value})}
                            className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/30 font-bold text-xs"
                            placeholder="https://wa.me/6785551234"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider ml-1 flex items-center gap-1">
                            <Facebook size={10} className="text-indigo-500" /> Facebook Link
                          </label>
                          <input 
                            value={profileForm.facebook}
                            onChange={(e) => setProfileForm({...profileForm, facebook: e.target.value})}
                            className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/30 font-bold text-xs"
                            placeholder="https://facebook.com/kava"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Visual Branding section */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <label className="text-[10px] font-bold text-kava-muted uppercase tracking-widest ml-1 flex items-center gap-1.5 font-sans">
                        🎨 Visual Identity & Branding
                      </label>
                      
                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-kava-text uppercase tracking-wider ml-1">Profile Logo / Avatar URL</label>
                        <input 
                          type="text"
                          value={profileForm.avatarUrl}
                          onChange={(e) => setProfileForm({...profileForm, avatarUrl: e.target.value})}
                          className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 font-bold text-xs"
                          placeholder="https://... (or select temporary totem below)"
                        />
                        
                        <div className="grid grid-cols-5 gap-2 bg-white/30 p-2.5 rounded-2xl border border-white/40">
                          {['🥥', '🌊', '🌴', '🌋', '🛶', '🐚', '🪘', '🌺', '🐢', '🦈'].map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setProfileForm({...profileForm, avatarUrl: emoji})}
                              className={`aspect-square flex items-center justify-center text-lg rounded-xl transition-all border-2 ${
                                profileForm.avatarUrl === emoji ? 'bg-kava-gold border-kava-gold shadow-md text-white scale-105' : 'bg-white border-transparent hover:border-kava-gold/20'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[9px] font-bold text-kava-text uppercase tracking-wider ml-1">Base Background Cover URL</label>
                        <input 
                          type="text"
                          value={profileForm.backgroundUrl}
                          onChange={(e) => setProfileForm({...profileForm, backgroundUrl: e.target.value})}
                          className="w-full bg-white/50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-kava-gold/30 font-bold text-xs"
                          placeholder="https://images.unsplash.com/photo-..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex justify-end gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsProfileEditing(false)}
                    className="px-8 py-4 bg-kava-text/5 hover:bg-kava-text/10 text-kava-text rounded-2xl font-bebas text-xl tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-12 py-4 bg-kava-gold text-white rounded-2xl font-bebas text-2xl tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-kava-gold/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isBillingOpen && (
          <BillingDashboard 
            user={user} 
            onUpdateUser={onUpdateUser} 
            onClose={() => setIsBillingOpen(false)} 
          />
        )}

        <AnimatePresence>
          {isFinanceOpen && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsFinanceOpen(false)}
                className="absolute inset-0 bg-kava-bg/85 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-6xl"
              >
                <div className="absolute top-8 right-8 z-50">
                  <button onClick={() => setIsFinanceOpen(false)} className="p-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-850 rounded-full text-kava-text border border-kava-muted/20 transition-all cursor-pointer">
                    <X size={20} className="stroke-[2.5]" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[90vh] custom-scrollbar p-6 md:p-10 rounded-[48px] bg-kava-bg border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="p-3.5 bg-kava-text text-white rounded-3xl animate-pulse">
                      <DollarSign size={32} />
                    </div>
                    <div>
                      <h2 className="font-bebas text-5xl text-kava-text leading-none tracking-wide">Supplier Finance Ledger</h2>
                      <p className="text-[10px] text-kava-gold uppercase font-black tracking-[0.4em] mt-1.5">Wholesale Distribution Cash Flow & Balance</p>
                    </div>
                  </div>
                  <FinanceDashboard role="supplier" />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Supplier B2B Social Ecosystem Transmitter Broadcast Console Modal */}
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
                      <h4 className="font-bebas text-2xl text-white tracking-widest uppercase mb-0.5">Supplier Social Transmitter</h4>
                      <p className="text-[9px] font-black uppercase text-kava-gold/80 tracking-[3.5px]">B2B API Node Broadcaster</p>
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
                      <span>Status: {transmitterState === 'done' ? '🚀 B2B EXPORT SUCCESS' : '📡 ATOMIZING SUPPLY DATA...'}</span>
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
                      <span>B2B Auth Handshake Verified [OAuth Active]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={transmitterProgress >= 60 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                        {transmitterProgress >= 60 ? "✓" : "⚡"}
                      </span>
                      <span>Generating B2B Custom Poster Graphic Banner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={transmitterProgress >= 100 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                        {transmitterProgress >= 100 ? "✓" : "⚡"}
                      </span>
                      <span>Post published live to connected B2B Marketplace channels</span>
                    </div>
                  </div>

                  {/* Mock Preview container */}
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
                          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bebas text-lg text-white">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <h5 className="text-[11px] font-black text-white leading-none uppercase tracking-wide">{user.name}</h5>
                            <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest">Authorized Custom Supplier</p>
                          </div>
                        </div>

                        {/* Custom Poster Headline is styled prominently inside the mockup */}
                        <div className="space-y-2">
                          <div className="bg-emerald-650/10 border-l-4 border-emerald-500 p-2.5 rounded-r-xl">
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">Poster Graphic Title / Banner:</span>
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

        {showTitleSelector && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-x-0 inset-y-0 bg-kava-bg/90 backdrop-blur-lg"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative z-10 w-full max-w-2xl p-10 bg-kava-surface rounded-[48px] border-[3px] border-white shadow-[0_45px_100px_-20px_rgba(0,0,0,0.6)] text-center overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-kava-gold/5 rounded-full -mr-10 -mt-10 blur-2xl" />
              <div className="relative space-y-8">
                {/* Icon Header */}
                <div className="w-16 h-16 mx-auto bg-kava-gold/10 rounded-2xl flex items-center justify-center text-kava-gold shadow-lg shadow-kava-gold/5">
                  <Award size={28} />
                </div>

                {/* Typography Heading */}
                <div className="space-y-2">
                  <h3 className="font-bebas text-5xl text-kava-text tracking-tight uppercase leading-none">Declare Specialty Title</h3>
                  <p className="text-kava-muted/60 font-bold text-[10px] uppercase tracking-widest max-w-sm mx-auto">
                    Choose your primary distribution category to customize your industry profile.
                  </p>
                </div>

                {/* Grid Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  {[
                    {
                      id: 'Green Kava',
                      emoji: '🌿',
                      title: 'Green Kava',
                      desc: 'Fresh green kava roots harvested straight from organic fields.',
                      color: 'border-emerald-500/10 hover:border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600'
                    },
                    {
                      id: 'Sun-Dried Kava (Powder)',
                      emoji: '☀️',
                      title: 'Sun-Dried Powder',
                      desc: 'Premium traditional sun-dried roots ground into fine powder.',
                      color: 'border-amber-500/10 hover:border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500'
                    },
                    {
                      id: '(Instant) Powdered Kava',
                      emoji: '⚡',
                      title: 'Instant Powder',
                      desc: 'Modern soluble powdered kava juice extract for rapid serving.',
                      color: 'border-blue-500/10 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 text-blue-500'
                    }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectTitle(opt.id as any)}
                      className={`kava-card flex flex-col items-center p-6 text-center border-2 transition-all rounded-[32px] hover:-translate-y-1 active:scale-95 group relative ${opt.color}`}
                    >
                      <span className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{opt.emoji}</span>
                      <strong className="font-bold text-sm text-kava-text leading-tight mb-2 uppercase tracking-wide block">
                        {opt.title}
                      </strong>
                      <span className="text-[10px] text-kava-muted/70 leading-relaxed font-semibold block">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-[9px] font-bold text-kava-muted/40 uppercase tracking-[0.25em]">
                  This specialty title highlights your product categorization dynamically.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Glassmorphic Modal Dialog */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Modal Body Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-2xl bg-kava-surface backdrop-blur-2xl rounded-[40px] border-2 border-white/20 p-8 shadow-[0_45px_120px_-30px_rgba(0,0,0,0.6)] overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-kava-gold/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-center pb-4 border-b border-kava-text/5 shrink-0">
                <div>
                  <h3 className="font-bebas text-4xl text-kava-gold tracking-tight">Edit Supply Material</h3>
                  <p className="text-[9px] font-black text-kava-muted uppercase tracking-[0.2em] mt-0.5">Reference ID: {editForm.id.slice(0, 12)}</p>
                </div>
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="p-2.5 hover:bg-kava-text/5 rounded-2xl transition-all"
                >
                  <X size={20} className="text-kava-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
                {/* Image Drop Zone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-kava-muted/60 uppercase tracking-[0.2em] ml-1">Update Media Asset</label>
                  <ImageDropZone 
                    id={`edit-img-${editForm.id}`}
                    imageUrl={editForm.imageUrl || null}
                    onImageChange={(base64) => setEditForm(prev => ({ ...prev, imageUrl: base64 }))}
                    onImageRemove={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))}
                    label="Drop product catalog image here or tap to select"
                    className="h-44 shadow-inner"
                  />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted opacity-55 uppercase tracking-wider ml-1">Designated Name <span className="text-rose-500">*</span></label>
                  <input 
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Premium Hand-Washed Green Kava"
                    className="w-full bg-kava-text/5 border border-white/20 hover:border-kava-gold/20 focus:border-kava-gold/50 rounded-2xl p-4 outline-none font-bold text-lg text-kava-text transition-all"
                  />
                </div>

                {/* Price and Stock level */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-kava-muted opacity-55 uppercase tracking-wider ml-1">
                      Wholesale rate (VUV) {editForm.price ? `[ ≈ ${formatPrice(editForm.price)} ]` : ''}
                    </label>
                    <div className="flex items-center gap-3 bg-kava-text/5 p-4 rounded-2xl border border-white/20 hover:border-kava-gold/20 focus-within:border-kava-gold/50 transition-all">
                      <Tag size={18} className="text-kava-muted/40" />
                      <input 
                        type="number"
                        value={editForm.price}
                        onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                        className="flex-1 bg-transparent border-none focus:ring-0 font-bebas text-3xl text-kava-gold p-0"
                      />
                      <span className="font-bebas text-xl text-kava-muted/30">VUV</span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-kava-muted opacity-55 uppercase tracking-wider ml-1">Current Stock (Units)</label>
                    <div className="flex items-center gap-3 bg-kava-text/5 p-4 rounded-2xl border border-white/20 hover:border-kava-gold/20 focus-within:border-kava-gold/50 transition-all">
                      <Package size={18} className="text-kava-muted/40" />
                      <input 
                        type="number"
                        value={editForm.stockLevel}
                        onChange={(e) => setEditForm(prev => ({ ...prev, stockLevel: parseInt(e.target.value) || 0 }))}
                        className="flex-1 bg-transparent border-none focus:ring-0 font-bebas text-3xl text-kava-text p-0"
                      />
                      <span className="font-bebas text-xl text-kava-muted/30">Units</span>
                    </div>
                  </div>
                </div>

                {/* Linked Bar Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted opacity-55 uppercase tracking-wider ml-1">Target Distribution Bar</label>
                  <select
                    value={editForm.barId}
                    onChange={(e) => setEditForm(prev => ({ ...prev, barId: e.target.value }))}
                    className="w-full bg-kava-text/5 border border-white/20 hover:border-kava-gold/20 focus:border-kava-gold/50 rounded-2xl p-4 outline-none font-bold text-sm text-kava-text cursor-pointer transition-all"
                  >
                    <option value="all" className="bg-kava-surface text-kava-text">No Specific Linking (Global Directory)</option>
                    {allSystemBars.map(bar => (
                      <option key={bar.id} value={bar.id} className="bg-kava-surface text-kava-text">
                        {bar.name} ({bar.location?.address || 'Vanuatu'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted opacity-55 uppercase tracking-wider ml-1">Product Tags (comma-separated)</label>
                  <input 
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g. premium, fresh, sunset, stone-ground"
                    className="w-full bg-kava-text/5 border border-white/20 hover:border-kava-gold/20 focus:border-kava-gold/50 rounded-2xl p-4 outline-none font-bold text-sm text-kava-text transition-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-kava-muted opacity-55 uppercase tracking-wider ml-1">Promotional Description / Synopsis</label>
                  <textarea 
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe harvest batch origin, water ratio, or flavor profiles..."
                    className="w-full min-h-[110px] text-sm bg-kava-text/5 border border-white/20 hover:border-kava-gold/20 focus:border-kava-gold/50 rounded-2xl p-4 outline-none font-medium text-kava-muted leading-relaxed transition-all resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-kava-text/5 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-kava-muted text-xs font-bold uppercase tracking-wider hover:bg-kava-text/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditProduct}
                  className="px-8 py-2.5 rounded-xl bg-kava-gold hover:bg-kava-gold/90 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Destructive Delete confirmation Dialog */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Confirmation Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-md bg-kava-surface rounded-[32px] border border-rose-500/30 p-8 shadow-[0_32px_64px_rgba(244,63,94,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
              
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-bebas text-3xl text-kava-text uppercase tracking-tight">Confirm Deletion</h4>
                  <p className="text-xs text-kava-muted font-medium mt-1 leading-relaxed">
                    Are you sure you want to permanently remove <strong className="text-kava-text font-bold">"{deletingProduct.name}"</strong>? This will delete the SKU from the Vanuatu B2B partner inventory. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-kava-text/5 text-kava-muted text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  className="px-6 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  Yes, Delete Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
