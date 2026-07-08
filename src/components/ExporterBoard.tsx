import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { chatService } from '../services/chatService';
import { User, Product, BarUpdate, Bar } from '../types';
import { Store, Megaphone, Package, MessageSquare, Search, Sparkles, Filter, ShieldAlert, Coins, Check, TrendingUp, Zap, BarChart3, TrendingDown, DollarSign, Globe, Calendar, Activity, MapPin, Layers, AlertCircle, Facebook, Instagram, Phone, X, CreditCard, Map, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { feedbackService } from '../services/feedbackService';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import BillingDashboard from './BillingDashboard';
import AdminBarMap from './AdminBarMap';

interface ExporterBoardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout?: () => void;
}

export default function ExporterBoard({ user, onUpdateUser, onLogout }: ExporterBoardProps) {
  const { t } = useLanguage();
  const { currency, formatPrice } = useCurrency();
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [activeBoardTab, setActiveBoardTab] = useState<'trade' | 'insights' | 'map'>(() => {
    return (localStorage.getItem('exporter_active_tab') as any) || 'trade';
  });

  useEffect(() => {
    localStorage.setItem('exporter_active_tab', activeBoardTab);
  }, [activeBoardTab]);
  const [selectedInsightMetric, setSelectedInsightMetric] = useState<'all' | 'powder' | 'roots' | 'shells'>('all');
  const [forecastInterval, setForecastInterval] = useState<30 | 90 | 180>(30);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any | null>(null);

  const [marketUpdates, setMarketUpdates] = useState<BarUpdate[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<User[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');

  // Real-time Social Transmitter States (Exporter Feed Exports)
  const [activeTransmitterUpdate, setActiveTransmitterUpdate] = useState<BarUpdate | null>(null);
  const [transmitterPlatform, setTransmitterPlatform] = useState<'facebook' | 'instagram' | 'whatsapp' | null>(null);
  const [transmitterProgress, setTransmitterProgress] = useState(0);
  const [transmitterState, setTransmitterState] = useState<'idle' | 'transmitting' | 'done'>('idle');

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

  // Interactive Exporter Buy Rates state
  const [greenKavaRootsRate, setGreenKavaRootsRate] = useState<number>(user.exporterRates?.greenKavaRoots || 1650);
  const [greenKavaChipsRate, setGreenKavaChipsRate] = useState<number>(user.exporterRates?.greenKavaChips || 1200);
  const [sunDriedKavaRootsRate, setSunDriedKavaRootsRate] = useState<number>(user.exporterRates?.sunDriedKavaRoots || 2750);
  const [sunDriedKavaChipsRate, setSunDriedKavaChipsRate] = useState<number>(user.exporterRates?.sunDriedKavaChips || 2200);
  const [instantPowderRate, setInstantPowderRate] = useState<number>(user.exporterRates?.instantPowder || 3800);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  useEffect(() => {
    loadFeed();
    // Refresh feed every 15 seconds
    const interval = setInterval(loadFeed, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadFeed = () => {
    const allUpdates = storage.getBarUpdates();
    const allProducts = storage.getProducts();
    const allUsers = storage.getUsers();
    const allBars = storage.getBars();

    // Sync state if user settings were refreshed externally
    const refreshedSelf = allUsers.find(u => u.id === user.id);
    if (refreshedSelf && refreshedSelf.exporterRates) {
      setGreenKavaRootsRate(refreshedSelf.exporterRates.greenKavaRoots);
      setGreenKavaChipsRate(refreshedSelf.exporterRates.greenKavaChips);
      setSunDriedKavaRootsRate(refreshedSelf.exporterRates.sunDriedKavaRoots);
      setSunDriedKavaChipsRate(refreshedSelf.exporterRates.sunDriedKavaChips);
      setInstantPowderRate(refreshedSelf.exporterRates.instantPowder || 3800);
    }

    // Exporters only see updates from suppliers or updates marked explicitly with business visibility
    const filteredUpdates = allUpdates.filter(
      u => u.barId.startsWith('supplier-') || u.visibility === 'business'
    ).sort((a,b) => b.timestamp - a.timestamp);

    // Get all suppliers
    const foundSuppliers = allUsers.filter(u => u.role === 'supplier');

    setMarketUpdates(filteredUpdates);
    setSupplierProducts(allProducts);
    setSuppliers(foundSuppliers);
    setBars(allBars);
  };

  const handleUpdateRates = () => {
    feedbackService.vibrate('tap');
    feedbackService.playSound('tap');

    const updatedUser: User = {
      ...user,
      exporterRates: {
        greenKavaRoots: greenKavaRootsRate,
        greenKavaChips: greenKavaChipsRate,
        sunDriedKavaRoots: sunDriedKavaRootsRate,
        sunDriedKavaChips: sunDriedKavaChipsRate,
        instantPowder: instantPowderRate
      }
    };

    // Save directly into localStorage for immediate multi-role simulation integrity
    const allUsers = storage.getUsers();
    storage.saveUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));

    // Propagate up to active session context
    onUpdateUser(updatedUser);

    setIsSavedSuccessfully(true);
    setTimeout(() => {
      setIsSavedSuccessfully(false);
    }, 2500);
  };

  const handleContactSupplier = async (supplierId: string, itemName?: string) => {
    // Generate or fetch the secure direct chat tunnel
    const chatId = await chatService.getOrCreateDirectChat(user.id, supplierId);
    
    if (itemName) {
      // Send a quick initial trace inquiring about the product to establish B2B stream
      await chatService.sendMessage(
        chatId,
        user.id,
        `Hello, I would like to inquire regarding the wholesale supply of your product: "${itemName}".`
      );
    }

    // Securely route the user via state dispatch to the Chats module
    window.dispatchEvent(new CustomEvent('switchTab', { detail: 'messages' }));
  };

  // Filter products by search query and vendor selection
  const filteredProducts = supplierProducts.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSupplier = selectedSupplierId === 'all' || prod.supplierId === selectedSupplierId;
    return matchesSearch && matchesSupplier;
  });

  // Derived Analytics for Supplier Insights dashboard
  const totalProducts = supplierProducts.length;
  const activeSuppliersCount = new Set(supplierProducts.map(p => p.supplierId)).size;
  
  const averageWholesalePrice = totalProducts 
    ? Math.round(supplierProducts.reduce((sum, p) => sum + p.price, 0) / totalProducts)
    : 0;

  const lowestPriceItem = totalProducts 
    ? [...supplierProducts].sort((a,b) => a.price - b.price)[0]
    : null;

  const highestPriceItem = totalProducts 
    ? [...supplierProducts].sort((a,b) => b.price - a.price)[0]
    : null;

  const stockDistribution = supplierProducts.reduce((acc, p) => {
    const status = p.status || 'In Stock';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { 'In Stock': 0, 'Low Stock': 0, 'Out of Stock': 0 } as Record<string, number>);

  // Arbitrage / Trade Spead Analytics correlating Exporter buy rates and wholesales
  const directArbitrageDeals = supplierProducts.map(prod => {
    const parentSupplier = suppliers.find(s => s.id === prod.supplierId);
    let comparisonRate = greenKavaRootsRate;
    let typeLabel = "Green Kava Roots";
    
    const lowerName = prod.name.toLowerCase();
    if (lowerName.includes('sun-dried') || lowerName.includes('sundried') || lowerName.includes('dried')) {
      if (lowerName.includes('chip') || lowerName.includes('cheaps')) {
        comparisonRate = sunDriedKavaChipsRate;
        typeLabel = "Dried Kava Chips";
      } else {
        comparisonRate = sunDriedKavaRootsRate;
        typeLabel = "Dried Kava Roots";
      }
    } else if (lowerName.includes('chip') || lowerName.includes('cheaps')) {
      comparisonRate = greenKavaChipsRate;
      typeLabel = "Green Kava Chips";
    }

    const priceGapVUV = comparisonRate - prod.price;
    const spreadPercent = prod.price > 0 ? Math.round((priceGapVUV / prod.price) * 100) : 0;

    return {
      productId: prod.id,
      productName: prod.name,
      supplierName: parentSupplier?.name || "Verified Supplier",
      supplierId: prod.supplierId,
      wholesalePrice: prod.price,
      yourOfferRate: comparisonRate,
      typeLabel,
      spreadVUV: priceGapVUV,
      spreadPercent,
      profitRating: spreadPercent > 20 ? 'Premium Margin' : spreadPercent > 0 ? 'Optimal Net' : 'Negative Spread'
    };
  }).sort((a, b) => b.spreadPercent - a.spreadPercent);

  // Simulated Pricing trends to graph pricing behavior
  const getSimulatedPricingTrends = () => {
    const baseIndexPoints = [
      { month: 'Jan', indexPrice: 1650, harvestVolume: 420 },
      { month: 'Feb', indexPrice: 1620, harvestVolume: 460 },
      { month: 'Mar', indexPrice: 1590, harvestVolume: 510 },
      { month: 'Apr', indexPrice: 1550, harvestVolume: 580 },
      { month: 'May', indexPrice: 1600, harvestVolume: 550 },
      { month: 'Jun', indexPrice: 1680, harvestVolume: 490 },
      { month: 'Jul', indexPrice: 1720, harvestVolume: 420 },
      { month: 'Aug', indexPrice: 1780, harvestVolume: 380 },
      { month: 'Sep', indexPrice: 1810, harvestVolume: 350 },
      { month: 'Oct', indexPrice: 1740, harvestVolume: 400 },
      { month: 'Nov', indexPrice: 1690, harvestVolume: 430 },
      { month: 'Dec', indexPrice: 1660, harvestVolume: 450 },
    ];

    if (forecastInterval === 30) {
      return baseIndexPoints.slice(-4);
    } else if (forecastInterval === 90) {
      return baseIndexPoints.slice(-8);
    }
    return baseIndexPoints;
  };

  const trendsData = getSimulatedPricingTrends();

  const handleMouseEnterDetail = (data: any, index: number) => {
    setHoveredDataPoint({ data, index });
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-kava-text to-slate-900 rounded-[48px] p-8 md:p-12 text-white shadow-2xl border-4 border-white">
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-kava-gold">
            <Sparkles size={12} /> {t('B2B Portal Active')}
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl text-white tracking-tight leading-none uppercase">
            {t('Pacific Export Traders')}
          </h1>
          <p className="text-sm md:text-base text-white/75 font-medium leading-relaxed">
            {t('Welcome')}, <span className="font-bold text-white">{user.name}</span>. {t('You are logged into the Exporter terminal. Broadcast your purchase requests and interact securely with verified wholesale Kava suppliers.')}
          </p>
        </div>
        {/* Abstract background graphics */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient opacity-10 pointer-events-none" />
      </div>

      {/* Centralized B2B Navigation Switcher and Billing */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-3xl border border-white/80 w-fit gap-2">
          <button
            onClick={() => {
              setActiveBoardTab('trade');
              feedbackService.vibrate('tap');
              feedbackService.playSound('tap');
            }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${
              activeBoardTab === 'trade'
                ? 'bg-kava-text text-white shadow-md'
                : 'text-kava-muted hover:text-kava-text hover:bg-white/40'
            }`}
          >
            <Megaphone size={14} className={activeBoardTab === 'trade' ? 'text-kava-gold' : ''} />
            <span>{t('Wholesale Trade Deck')}</span>
          </button>

          <button
            onClick={() => {
              setActiveBoardTab('insights');
              feedbackService.vibrate('tap');
              feedbackService.playSound('tap');
            }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${
              activeBoardTab === 'insights'
                ? 'bg-kava-text text-white shadow-md'
                : 'text-kava-muted hover:text-kava-text hover:bg-white/40'
            }`}
          >
            <BarChart3 size={14} className={activeBoardTab === 'insights' ? 'text-kava-gold' : ''} />
            <span>{t('Supplier Insights')}</span>
          </button>

          <button
            onClick={() => {
              setActiveBoardTab('map');
              feedbackService.vibrate('tap');
              feedbackService.playSound('tap');
            }}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all ${
              activeBoardTab === 'map'
                ? 'bg-kava-text text-white shadow-md'
                : 'text-kava-muted hover:text-kava-text hover:bg-white/40'
            }`}
          >
            <Map size={14} className={activeBoardTab === 'map' ? 'text-kava-gold' : ''} />
            <span>{t('Supply & Bar Network')}</span>
          </button>
        </div>

        {/* Billing & Licensing button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsBillingOpen(true);
              feedbackService.vibrate('tap');
              feedbackService.playSound('tap');
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all bg-white/20 hover:bg-white/40 text-kava-muted hover:text-kava-text border border-white/40"
          >
            <CreditCard size={14} className="text-kava-gold" />
            <span>{t('Billing & Licensing')}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest transition-all bg-rose-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20"
            >
              <Power size={14} />
              <span>{t('Logout')}</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeBoardTab === 'trade' ? (
          <motion.div
            key="trade-deck"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Left/Middle Column (Feed & Market Pulse) */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Supplier Announcements */}
              <section className="kava-card flex flex-col space-y-8 h-full">
                <div className="flex justify-between items-center border-b border-kava-text/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <Megaphone size={24} />
                    </div>
                    <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Supplier Announcements</h3>
                  </div>
                  <span className="text-[10px] font-black text-kava-muted uppercase tracking-widest bg-kava-text/5 px-3 py-1 rounded-full">
                    {marketUpdates.length} Published
                  </span>
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {marketUpdates.map((upd) => {
                    const supp = suppliers.find(s => `supplier-${s.id}` === upd.barId);
                    return (
                      <motion.div 
                        key={upd.id} 
                        whileHover={{ y: -4, scale: 1.008, boxShadow: "0 15px 25px -5px rgba(0,0,0,0.06)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="bg-white/40 rounded-3xl overflow-hidden border border-white/60 flex flex-col md:flex-row shadow-sm hover:border-kava-gold/25 transition-all group"
                      >
                        {(upd.imageUrl || upd.adImageUrl) && (
                          <div className="h-44 md:h-auto md:w-48 overflow-hidden relative shrink-0 bg-kava-text/5">
                            <img 
                              src={upd.adImageUrl || upd.imageUrl} 
                              alt={upd.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-[2px] bg-emerald-500/10 px-2.5 py-1 rounded-full">{upd.type}</span>
                                <span className="text-[8px] font-bold text-kava-muted opacity-40 uppercase tracking-widest">{new Date(upd.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <h4 className="font-bebas text-2xl text-kava-text leading-tight uppercase tracking-wide">{upd.title}</h4>
                            <p className="text-xs text-kava-muted/80 leading-relaxed font-medium">{upd.description}</p>
                          </div>

                          <div className="pt-4 border-t border-kava-text/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-kava-gold/10 flex items-center justify-center font-bebas text-kava-gold font-bold">
                                {supp?.name.charAt(0) || 'S'}
                              </div>
                              <div>
                                <div className="text-[10px] font-black uppercase text-kava-text leading-none">{supp?.name || 'Verified Supplier'}</div>
                                <div className="text-[8px] font-bold text-kava-gold/80 uppercase tracking-wider mt-0.5">{supp?.supplierTitle || 'Industry Wholesaler'}</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <button 
                                onClick={() => triggerSocialTransmitter(upd, 'facebook')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-xl transition-all text-[8px] font-black uppercase tracking-widest border border-[#1877F2]/20 cursor-pointer"
                                title="Transmit to Facebook Page"
                              >
                                <Facebook size={10} />
                                FB
                              </button>
                              <button 
                                onClick={() => triggerSocialTransmitter(upd, 'instagram')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-pink-600/10 hover:bg-pink-600 text-pink-600 hover:text-white rounded-xl transition-all text-[8px] font-black uppercase tracking-widest border border-pink-500/20 cursor-pointer"
                                title="Transmit to Instagram Feed"
                              >
                                <Instagram size={10} />
                                IG
                              </button>
                              <button 
                                onClick={() => triggerSocialTransmitter(upd, 'whatsapp')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 cursor-pointer"
                                title="Transmit to WhatsApp Broadcast Group"
                              >
                                <Phone size={10} />
                                WA
                              </button>
                              <button
                                onClick={() => handleContactSupplier(supp?.id || upd.barId.replace('supplier-', ''), upd.title)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-kava-text hover:bg-kava-gold text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer ml-1"
                              >
                                <MessageSquare size={11} /> Contact
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {marketUpdates.length === 0 && (
                    <div className="text-center py-20 opacity-25 italic text-[10px] font-black uppercase tracking-[0.3em]">
                      No active wholesale developments broadcasted.
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column (Products & Filter controls) */}
            <div className="space-y-10">
              
              {/* Export Buy Rates Configurator */}
              <section className="kava-card bg-gradient-to-br from-kava-text to-slate-900 border-4 border-white dark:border-white/5 text-white flex flex-col space-y-6 shadow-2xl relative overflow-hidden group">
                {/* Dynamic visual lighting beam */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-kava-gold/15 rounded-full blur-2xl animate-pulse" />
                
                <div className="flex items-center gap-3 border-b border-white/10 pb-4 relative z-10">
                  <div className="p-2 bg-kava-gold/20 rounded-xl text-kava-gold">
                    <Coins size={24} className="animate-bounce" style={{ animationDuration: '3s' }} />
                  </div>
                  <div>
                    <h3 className="font-bebas text-4xl text-white uppercase tracking-wider leading-none">Declare Buy Rates</h3>
                    <p className="text-[9px] font-black text-kava-gold uppercase tracking-widest mt-1">Sourced by wholesale producers</p>
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  {/* Green Kava Roots rate selector */}
                  <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center sm:items-baseline">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {t('Green Kava - Roots')}
                      </label>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                        <input 
                          type="number"
                          value={greenKavaRootsRate}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setGreenKavaRootsRate(val);
                            feedbackService.trigger('type');
                          }}
                          className="w-16 bg-transparent text-right font-bebas text-lg text-kava-gold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-widest select-none">VUV</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={1000}
                      max={3000}
                      step={50}
                      value={Math.max(1000, Math.min(3000, greenKavaRootsRate))}
                      onChange={(e) => {
                        setGreenKavaRootsRate(parseInt(e.target.value));
                        feedbackService.trigger('type');
                      }}
                      className="w-full accent-kava-gold bg-white/20 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-wider">
                      <span>Min: {formatPrice(1000)}</span>
                      <span>Current: {formatPrice(greenKavaRootsRate)}</span>
                      <span>Max: {formatPrice(3000)}</span>
                    </div>
                  </div>

                  {/* Green Kava Chips rate selector */}
                  <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center sm:items-baseline">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" /> {t('Green Kava - Chips / "Cheaps"')}
                      </label>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                        <input 
                          type="number"
                          value={greenKavaChipsRate}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setGreenKavaChipsRate(val);
                            feedbackService.trigger('type');
                          }}
                          className="w-16 bg-transparent text-right font-bebas text-lg text-kava-gold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-widest select-none">VUV</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={500}
                      max={2500}
                      step={50}
                      value={Math.max(500, Math.min(2500, greenKavaChipsRate))}
                      onChange={(e) => {
                        setGreenKavaChipsRate(parseInt(e.target.value));
                        feedbackService.trigger('type');
                      }}
                      className="w-full accent-kava-gold bg-white/20 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-wider">
                      <span>Min: {formatPrice(500)}</span>
                      <span>Current: {formatPrice(greenKavaChipsRate)}</span>
                      <span>Max: {formatPrice(2500)}</span>
                    </div>
                  </div>

                  {/* Sun-Dried Kava Roots rate selector */}
                  <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center sm:items-baseline">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {t('Sun-Dried - Roots')}
                      </label>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                        <input 
                          type="number"
                          value={sunDriedKavaRootsRate}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setSunDriedKavaRootsRate(val);
                            feedbackService.trigger('type');
                          }}
                          className="w-16 bg-transparent text-right font-bebas text-lg text-kava-gold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-widest select-none">VUV</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={2000}
                      max={5000}
                      step={50}
                      value={Math.max(2000, Math.min(5000, sunDriedKavaRootsRate))}
                      onChange={(e) => {
                        setSunDriedKavaRootsRate(parseInt(e.target.value));
                        feedbackService.trigger('type');
                      }}
                      className="w-full accent-kava-gold bg-white/20 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-wider">
                      <span>Min: {formatPrice(2000)}</span>
                      <span>Current: {formatPrice(sunDriedKavaRootsRate)}</span>
                      <span>Max: {formatPrice(5000)}</span>
                    </div>
                  </div>

                  {/* Sun-Dried Kava Chips rate selector */}
                  <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center sm:items-baseline">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> {t('Sun-Dried - Chips / "Cheaps"')}
                      </label>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                        <input 
                          type="number"
                          value={sunDriedKavaChipsRate}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setSunDriedKavaChipsRate(val);
                            feedbackService.trigger('type');
                          }}
                          className="w-16 bg-transparent text-right font-bebas text-lg text-kava-gold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-widest select-none">VUV</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={1000}
                      max={4000}
                      step={50}
                      value={Math.max(1000, Math.min(4000, sunDriedKavaChipsRate))}
                      onChange={(e) => {
                        setSunDriedKavaChipsRate(parseInt(e.target.value));
                        feedbackService.trigger('type');
                      }}
                      className="w-full accent-kava-gold bg-white/20 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-wider">
                      <span>Min: {formatPrice(1000)}</span>
                      <span>Current: {formatPrice(sunDriedKavaChipsRate)}</span>
                      <span>Max: {formatPrice(4000)}</span>
                    </div>
                  </div>

                  {/* Instant Powdered Kava rate selector */}
                  <div className="space-y-2 bg-white/5 p-4 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center sm:items-baseline">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> {t('Instant - Powdered Kava')}
                      </label>
                      <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                        <input 
                          type="number"
                          value={instantPowderRate}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setInstantPowderRate(val);
                            feedbackService.trigger('type');
                          }}
                          className="w-16 bg-transparent text-right font-bebas text-lg text-kava-gold focus:outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[8px] font-black text-white/50 uppercase tracking-widest select-none">VUV</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={2500}
                      max={6000}
                      step={50}
                      value={Math.max(2500, Math.min(6000, instantPowderRate))}
                      onChange={(e) => {
                        setInstantPowderRate(parseInt(e.target.value));
                        feedbackService.trigger('type');
                      }}
                      className="w-full accent-kava-gold bg-white/20 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-white/30 uppercase tracking-wider">
                      <span>Min: {formatPrice(2500)}</span>
                      <span>Current: {formatPrice(instantPowderRate)}</span>
                      <span>Max: {formatPrice(6000)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 relative z-10 flex flex-col gap-3">
                  <button
                    onClick={handleUpdateRates}
                    className="w-full py-4 bg-kava-gold text-white font-bebas text-2xl tracking-widest uppercase hover:bg-white hover:text-kava-text rounded-2xl shadow-lg shadow-kava-gold/20 transition-all duration-300 relative overflow-hidden"
                  >
                    <span className="relative z-10">Broadcast Offer Rates</span>
                  </button>

                  <AnimatePresence>
                    {isSavedSuccessfully && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-[10px] font-black uppercase tracking-wider"
                      >
                        <Check size={12} className="text-emerald-400" />
                        Market Pulse Feed Updated Live
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Supplier Catalog & Products */}
              <section className="kava-card flex flex-col space-y-6">
                <div className="flex items-center gap-3 border-b border-kava-text/5 pb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider leading-none">Wholesale Catalog</h3>
                    <p className="text-[9px] font-black text-kava-muted uppercase tracking-widest mt-1">Direct from source</p>
                  </div>
                </div>

                {/* Filter Section */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-muted/40" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search wholesale kava..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        feedbackService.trigger('type');
                      }}
                      className="w-full bg-white/60 border border-kava-muted/10 rounded-2xl py-3 px-10 focus:outline-none text-[10px] font-bold uppercase tracking-widest"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-2xl border border-white/60">
                    <Filter size={12} className="text-kava-muted/50 ml-2 shrink-0" />
                    <select 
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full bg-transparent border-none text-[10px] font-bold uppercase tracking-widest text-kava-muted focus:ring-0 cursor-pointer"
                    >
                      <option value="all">All Producers / Origin</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product Grid */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredProducts.map((prod) => {
                    const supp = suppliers.find(s => s.id === prod.supplierId);
                    return (
                      <motion.div 
                        key={prod.id} 
                        whileHover={{ y: -3, scale: 1.01, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="bg-white/45 rounded-3xl p-4 border border-white/60 flex items-center gap-4 hover:border-kava-gold/40 transition-all group"
                      >
                        <div className="w-16 h-16 bg-kava-text/5 rounded-2xl flex items-center justify-center text-kava-muted shrink-0 overflow-hidden relative">
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <Package size={20} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className="font-bold text-xs text-kava-text truncate leading-tight group-hover:text-kava-gold transition-colors">{prod.name}</h4>
                            <span className="font-bebas text-sm text-kava-gold tracking-widest shrink-0 ml-2">{formatPrice(prod.price)}</span>
                          </div>
                          <div className="text-[9px] font-bold text-kava-muted/80 truncate mb-1">
                            By: <span className="text-kava-text">{supp?.name || 'Kava Supplier'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              prod.status === 'In Stock' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {prod.status || 'In Stock'}
                            </span>

                            <button 
                              onClick={() => handleContactSupplier(prod.supplierId, prod.name)}
                              className="text-[9px] font-black uppercase tracking-widest text-kava-gold hover:underline flex items-center gap-1"
                            >
                              Inquire Trade
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-10 opacity-30 italic text-[10px] font-bold uppercase tracking-widest">
                      No matching commodities
                    </div>
                  )}
                </div>
              </section>

              {/* Strict Security Constraints */}
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-[32px] p-6 space-y-3">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert size={16} /> Closed Pipeline Trade
                </div>
                <p className="text-[10px] text-kava-muted leading-relaxed font-semibold">
                  The Exporter account resides strictly inside the wholesale logistics pipeline. By structural mandate, your user cannot view or discover Manager dashboards or public Nakamal listings.
                </p>
              </div>

            </div>
          </motion.div>
        ) : activeBoardTab === 'insights' ? (
          <motion.div
            key="supplier-insights"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-10 focus-ring"
          >
            {/* Insights Top Section with Forecast Intervals */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 p-6 md:p-8 rounded-[36px] border border-white/60">
              <div>
                <h2 className="font-bebas text-4xl text-kava-text tracking-wider uppercase leading-none">Supplier Intelligence Core</h2>
                <p className="text-[10px] font-semibold text-kava-muted tracking-wide mt-1">Aggregated wholesale price benchmarks, commodity volatility indices, and localized origin forecasts.</p>
              </div>

              {/* Seasonal Projections Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-kava-muted uppercase tracking-widest">Projection Period:</span>
                <div className="flex bg-white/50 p-1 rounded-2xl border border-kava-muted/10">
                  {([30, 90, 180] as const).map((interval) => (
                    <button
                      key={interval}
                      onClick={() => {
                        setForecastInterval(interval);
                        feedbackService.vibrate('tap');
                        feedbackService.playSound('tap');
                      }}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                        forecastInterval === interval
                          ? 'bg-kava-text text-white shadow'
                          : 'text-kava-muted hover:text-kava-text'
                      }`}
                    >
                      {interval} Days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Core KPI Bento-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Market Liquidity */}
              <div className="kava-card p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-emerald-500/20 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <Globe size={18} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#10b981] bg-emerald-500/10 px-2 py-0.5 rounded-full">Liquid</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-kava-text font-bebas tracking-wide uppercase leading-none mt-2">
                    {activeSuppliersCount} Sourcing Hubs
                  </div>
                  <p className="text-[9px] font-bold text-kava-muted uppercase tracking-widest mt-1">Active Wholesale Suppliers</p>
                </div>
                <div className="pt-2 border-t border-kava-text/5 text-[8px] font-semibold text-kava-muted flex justify-between">
                  <span>Santo, Malekula, Efate</span>
                  <span className="text-emerald-500 font-bold">100% active</span>
                </div>
              </div>

              {/* Card 2: Catalog Saturations */}
              <div className="kava-card p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-kava-gold/20 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-kava-gold/10 rounded-2xl text-kava-gold">
                    <Layers size={18} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-kava-gold">Catalog</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-kava-text font-bebas tracking-wide uppercase leading-none mt-2">
                    {totalProducts} Active SKUs
                  </div>
                  <p className="text-[9px] font-bold text-kava-muted uppercase tracking-widest mt-1">Total Wholesale Commodities</p>
                </div>
                <div className="pt-2 border-t border-kava-text/5 flex items-center justify-between text-[8px] font-bold text-kava-muted uppercase tracking-wider">
                  <span className="text-emerald-500">In Stock: {stockDistribution['In Stock']}</span>
                  <span className="text-amber-500">Low: {stockDistribution['Low Stock']}</span>
                </div>
              </div>

              {/* Card 3: Index Wholesale Price */}
              <div className="kava-card p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-kava-text/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-kava-text/5 rounded-2xl text-kava-text">
                    <DollarSign size={18} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-kava-muted/80">Average Index</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-kava-text font-bebas tracking-wide uppercase leading-none mt-2">
                    {formatPrice(averageWholesalePrice, '/kg')}
                  </div>
                  <p className="text-[9px] font-bold text-kava-muted uppercase tracking-widest mt-1">Weighted Wholesales Mean</p>
                </div>
                <div className="pt-2 border-t border-kava-text/5 text-[8px] font-semibold text-kava-muted flex justify-between">
                  <span>Lowest: {formatPrice(lowestPriceItem?.price || 0)}</span>
                  <span>Highest: {formatPrice(highestPriceItem?.price || 0)}</span>
                </div>
              </div>

              {/* Card 4: Peak Arbitrage Margin */}
              <div className="kava-card p-6 flex flex-col justify-between space-y-4 shadow-sm hover:border-blue-500/20 transition-all">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-500">
                    <Activity size={18} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Yield Map</span>
                </div>
                <div>
                  <div className="text-2xl font-black text-kava-text font-bebas tracking-wide uppercase leading-none mt-2">
                    {directArbitrageDeals && directArbitrageDeals.length > 0 && directArbitrageDeals[0].spreadPercent > 0 
                      ? `${directArbitrageDeals[0].spreadPercent}% Max Spread`
                      : "0% Spot Spread"}
                  </div>
                  <p className="text-[9px] font-bold text-kava-muted uppercase tracking-widest mt-1">Top Arbitrage spread depth</p>
                </div>
                <div className="pt-2 border-t border-kava-text/5 text-[8px] font-semibold text-kava-muted truncate">
                  Peak deals: <span className="text-emerald-600 font-bold">{directArbitrageDeals?.[0]?.productName || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Interactive Sourced Index Trends (Chart column is span-2) */}
              <div className="lg:col-span-2 space-y-10">
                <section className="kava-card p-8 flex flex-col space-y-6">
                  <div className="flex justify-between items-center border-b border-kava-text/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                        <TrendingUp className="text-kava-gold" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider leading-none">Commodity Index & Seasonality projections</h3>
                        <p className="text-[9px] font-bold text-kava-muted uppercase tracking-widest mt-1">Custom interactive charts matching meteorological data to export prices</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing line and interactive points rendered with custom responsive SVG */}
                  <div className="bg-white/40 p-6 rounded-3xl border border-white/60 relative">
                    <div className="flex justify-between items-center mb-6 text-[8px] font-black uppercase tracking-widest text-kava-muted">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-kava-gold" />
                        <span>Kava FOB Index (VUV/kg)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 border border-dashed border-emerald-400" />
                        <span>Harvest Volume index (tons)</span>
                      </div>
                    </div>

                    <div className="relative h-56 w-full flex items-center justify-center">
                      <svg viewBox="0 0 500 180" className="w-full h-full overflow-visible">
                        {/* Grid lines */}
                        <line x1="40" y1="30" x2="460" y2="30" stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
                        <line x1="40" y1="75" x2="460" y2="75" stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
                        <line x1="40" y1="120" x2="460" y2="120" stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
                        <line x1="40" y1="150" x2="460" y2="150" stroke="rgba(0,0,0,0.08)" />

                        {/* Baseline Left scale labels */}
                        <text x="15" y="34" className="text-[8px] font-bold fill-kava-muted/60">1,800</text>
                        <text x="15" y="79" className="text-[8px] font-bold fill-kava-muted/60">1,650</text>
                        <text x="15" y="124" className="text-[8px] font-bold fill-kava-muted/60">1,500</text>

                        {/* Right scale volume labels */}
                        <text x="470" y="34" className="text-[8px] font-bold fill-emerald-600/60">600t</text>
                        <text x="470" y="124" className="text-[8px] font-bold fill-emerald-600/60">300t</text>

                        {/* Gold price polyline */}
                        <polyline
                          fill="none"
                          stroke="#c59b27"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={(() => {
                            const maxP = Math.max(...trendsData.map(d => d.indexPrice), 1900);
                            const minP = Math.min(...trendsData.map(d => d.indexPrice), 1400);
                            const range = maxP - minP || 1;
                            return trendsData.map((d, index) => {
                              const x = 40 + (index * 420 / (trendsData.length - 1 || 1));
                              const y = 150 - ((d.indexPrice - minP) * 120 / range);
                              return `${x},${y}`;
                            }).join(' ');
                          })()}
                        />

                        {/* Emerald volume dashed polyline */}
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          points={(() => {
                            return trendsData.map((d, index) => {
                              const x = 40 + (index * 420 / (trendsData.length - 1 || 1));
                              const y = 150 - (d.harvestVolume * 120 / 600);
                              return `${x},${y}`;
                            }).join(' ');
                          })()}
                        />

                        {/* Vertical grid lines and points mapping for hover and tags */}
                        {trendsData.map((d, index) => {
                          const x = 40 + (index * 420 / (trendsData.length - 1 || 1));
                          const maxP = Math.max(...trendsData.map(d => d.indexPrice), 1900);
                          const minP = Math.min(...trendsData.map(d => d.indexPrice), 1400);
                          const range = maxP - minP || 1;
                          const yPrice = 150 - ((d.indexPrice - minP) * 120 / range);

                          return (
                            <g key={d.month} className="group/dot">
                              {/* Guideline */}
                              <line 
                                x1={x} 
                                y1="30" 
                                x2={x} 
                                y2="150" 
                                stroke={hoveredDataPoint?.index === index ? "rgba(197, 155, 39, 0.3)" : "rgba(0,0,0,0.02)"} 
                                strokeWidth={hoveredDataPoint?.index === index ? "2" : "1"}
                              />

                              {/* Price dot */}
                              <circle
                                cx={x}
                                cy={yPrice}
                                r={hoveredDataPoint?.index === index ? "6" : "4"}
                                className="fill-white stroke-kava-gold cursor-pointer transition-all duration-200"
                                strokeWidth="3"
                                onMouseEnter={() => handleMouseEnterDetail(d, index)}
                                onMouseLeave={() => setHoveredDataPoint(null)}
                              />

                              {/* Invisible wide mouse event tracking bars */}
                              <rect
                                x={x - 15}
                                y="20"
                                width="30"
                                height="140"
                                className="fill-transparent cursor-pointer"
                                onMouseEnter={() => handleMouseEnterDetail(d, index)}
                                onMouseLeave={() => setHoveredDataPoint(null)}
                              />

                              {/* Month description label underneath */}
                              <text x={x} y="165" textAnchor="middle" className="text-[8px] font-black fill-kava-muted/80">{d.month}</text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Floating overlay tooltip container matching interactive mouseovers */}
                      <AnimatePresence>
                        {hoveredDataPoint && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bg-kava-text text-white text-[10px] p-4 rounded-2xl shadow-xl border border-white/20 z-30 pointer-events-none"
                            style={{
                              left: `${Math.min(
                                Math.max(
                                  hoveredDataPoint.index * (100 / (trendsData.length - 1)) + 5,
                                  10
                                ),
                                75
                              )}%`,
                              top: '15%'
                            }}
                          >
                            <div className="font-bold uppercase tracking-widest text-kava-gold border-b border-white/10 pb-1.5 mb-1.5 flex items-center gap-1">
                              <Calendar size={10} />
                              <span>Seasonal Matrix: {hoveredDataPoint.data.month}</span>
                            </div>
                            <div className="space-y-1 font-semibold leading-relaxed">
                              <p className="flex justify-between gap-6">
                                <span className="text-white/60">Weighted FOB Price:</span>
                                <span className="font-bebas text-xs text-white tracking-widest">{formatPrice(hoveredDataPoint.data.indexPrice, '/kg')}</span>
                              </p>
                              <p className="flex justify-between gap-6">
                                <span className="text-white/60">Harvest Output Rate:</span>
                                <span className="text-[#10b981]">{hoveredDataPoint.data.harvestVolume} tons</span>
                              </p>
                              <p className="flex justify-between gap-6">
                                <span className="text-white/60">Estimated Quality Factor:</span>
                                <span className="text-amber-400">Class-A AAA</span>
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-3xl p-5 flex items-start gap-4">
                    <AlertCircle className="text-kava-gold shrink-0 mt-0.5" size={18} />
                    <div className="text-[10px] leading-relaxed font-semibold text-kava-muted">
                      <span className="font-bold text-kava-text uppercase">Wholesale Seasonal Projection Rules</span>: Kava market liquidity drops from July to October due to standard dry weather cycles across Espiritu Santo. Prices traditionally inflate towards Christmas, presenting elevated export spreads for forward-positioned procurement traders.
                    </div>
                  </div>
                </section>

                {/* Direct B2B Spread and profit Optimizer map (Actionable Arbitrage) */}
                <section className="kava-card flex flex-col space-y-6">
                  <div className="border-b border-kava-text/5 pb-4">
                    <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider">Trading Arbitrage & Profit spread matrix</h3>
                    <p className="text-[9px] font-bold text-kava-muted uppercase tracking-widest mt-1">Directly correlated to your active Declared Buy Rates customized in the sidebar deck</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-kava-text/5 text-[9px] font-black text-kava-muted uppercase tracking-widest">
                          <th className="py-3 px-4">Wholesale Commodity</th>
                          <th className="py-3 px-4">Producers Name</th>
                          <th className="py-3 px-4">Wholesale {currency}</th>
                          <th className="py-3 px-4">Your Bid Rate</th>
                          <th className="py-3 px-4">Price Spread {currency}</th>
                          <th className="py-3 px-4">Margin Spread</th>
                          <th className="py-3 px-4 text-right">Negotiate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-kava-text/5">
                        {directArbitrageDeals.map((deal) => (
                          <tr key={deal.productId} className="group hover:bg-white/30 transition-colors text-[10px] font-semibold">
                            <td className="py-4 px-4 font-bold text-kava-text">
                              <div className="flex flex-col">
                                <span>{deal.productName}</span>
                                <span className="text-[8px] text-kava-muted uppercase tracking-wider font-bold mt-0.5">{deal.typeLabel}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-kava-muted font-medium">{deal.supplierName}</td>
                            <td className="py-4 px-4 font-bebas text-xs">{formatPrice(deal.wholesalePrice)}</td>
                            <td className="py-4 px-4 font-bebas text-xs text-kava-gold">{formatPrice(deal.yourOfferRate)}</td>
                            <td className={`py-4 px-4 font-bold ${deal.spreadVUV > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {deal.spreadVUV > 0 ? `+${formatPrice(deal.spreadVUV)}` : formatPrice(deal.spreadVUV)}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                deal.spreadPercent > 20 
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : deal.spreadPercent > 0 
                                    ? 'bg-blue-500/10 text-blue-600'
                                    : 'bg-rose-500/10 text-rose-600'
                              }`}>
                                {deal.spreadPercent}% {deal.profitRating}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => handleContactSupplier(deal.supplierId, `Wholesale Supply of ${deal.productName}`)}
                                className="px-3.5 py-1.5 bg-kava-text hover:bg-kava-gold text-white hover:text-white rounded-full text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
                              >
                                Secure Deal
                              </button>
                            </td>
                          </tr>
                        ))}
                        {directArbitrageDeals.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-10 opacity-30 italic text-[10px] font-bold uppercase tracking-widest">
                              No wholesale commodities available for spread computation.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              {/* Suppler Regional Saturation Details Map (Right column) */}
              <div className="space-y-10">
                <section className="kava-card flex flex-col space-y-6">
                  <div className="flex items-center gap-3 border-b border-kava-text/5 pb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="font-bebas text-4xl text-kava-text uppercase tracking-wider leading-none">Vendor Saturation</h3>
                      <p className="text-[9px] font-black text-kava-muted uppercase tracking-widest mt-1">Geographic density details</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {suppliers.map(supp => {
                      const suppProducts = supplierProducts.filter(p => p.supplierId === supp.id);
                      const avgPriceOfWholesaler = suppProducts.length
                        ? Math.round(suppProducts.reduce((sum, p) => sum + p.price, 0) / suppProducts.length)
                        : 0;

                      return (
                        <div key={supp.id} className="bg-white/40 p-5 rounded-3xl border border-white/60 flex flex-col space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-xs text-kava-text leading-tight">{supp.name}</h4>
                              <p className="text-[8px] font-semibold text-kava-muted uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <Globe size={10} className="stroke-kava-gold" />
                                <span>{supp.location?.address || "Port Vila Hub"}</span>
                              </p>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest bg-white/60 px-2.5 py-1 rounded-full border">
                              {suppProducts.length} Items Listed
                            </span>
                          </div>

                          {/* Inventory depth bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-bold text-kava-muted uppercase tracking-wider">
                              <span>Sourcing Capacity Factor</span>
                              <span className="text-kava-text">{suppProducts.length > 1 ? 'High Yield' : 'Medium Cap'}</span>
                            </div>
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-kava-gold to-emerald-500 rounded-full"
                                style={{ width: `${Math.min(Math.max(suppProducts.length * 35 + 20, 20), 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline pt-2 text-[9px] font-semibold">
                            <span className="text-kava-muted">Average Vendor price:</span>
                            <span className="font-bebas text-xs text-kava-gold">{formatPrice(avgPriceOfWholesaler)}</span>
                          </div>
                        </div>
                      );
                    })}

                    {suppliers.length === 0 && (
                      <div className="text-center py-10 opacity-30 italic text-[10px] font-bold uppercase tracking-widest">
                        No active wholesale suppliers registered.
                      </div>
                    )}
                  </div>
                </section>

                <div className="bg-rose-500/5 border border-rose-500/10 rounded-[32px] p-6 space-y-3">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                    <ShieldAlert size={16} /> Closed Pipeline Trade
                  </div>
                  <p className="text-[10px] text-kava-muted leading-relaxed font-semibold">
                    The Exporter account resides strictly inside the wholesale logistics pipeline. By structural mandate, your user cannot view or discover Manager dashboards or public Nakamal listings.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="network-map"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="kava-card relative overflow-hidden"
          >
            <AdminBarMap 
              bars={bars} 
              suppliers={suppliers} 
              readOnly={true} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exporter pipeline B2B Social Ecosystem Transmitter Broadcast Console Modal */}
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
                    <h4 className="font-bebas text-2xl text-white tracking-widest uppercase mb-0.5">Exporter B2B transmitter</h4>
                    <p className="text-[9px] font-black uppercase text-kava-gold/80 tracking-[3.5px]">Ecosystem Distribution Broker</p>
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
                    <span>Status: {transmitterState === 'done' ? '🚀 B2B EXPORT SUCCESS' : '📡 TRANSMITTING TRADER DATA...'}</span>
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
                    <span>Verified Broker Node Authorization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={transmitterProgress >= 60 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                      {transmitterProgress >= 60 ? "✓" : "⚡"}
                    </span>
                    <span>Compiled Custom Graphic Poster Package</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={transmitterProgress >= 100 ? "text-emerald-400 font-bold" : "text-neutral-500"}>
                      {transmitterProgress >= 100 ? "✓" : "⚡"}
                    </span>
                    <span>Broadcasting live to Exporter channels</span>
                  </div>
                </div>

                {/* Live Client Preview container */}
                {transmitterState === 'done' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 bg-neutral-900 border border-white/10 rounded-3xl p-5 overflow-hidden"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <span className="text-[9px] font-black tracking-widest uppercase text-neutral-500">Exporter Live Mock Preview</span>
                      <span className="text-[8px] px-2 py-0.5 border border-emerald-500/20 text-emerald-400 rounded-full font-black uppercase tracking-widest animate-pulse">Published Live</span>
                    </div>

                    <div className="bg-neutral-950 p-4 rounded-2xl space-y-3.5 border border-white/5 shadow-inner">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bebas text-lg text-white">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-[11px] font-black text-white leading-none uppercase tracking-wide">{user.name}</h5>
                          <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest">Authorized Exporter Broker</p>
                        </div>
                      </div>

                      {/* Header/Headline custom poster label is displayed prominently */}
                      <div className="space-y-2">
                        <div className="bg-emerald-650/10 border-l-4 border-emerald-500 p-2.5 rounded-r-xl">
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">Poster Graphic Title / Banner:</span>
                          <h6 className="text-[11px] font-bold text-white tracking-wide leading-snug uppercase">
                            {activeTransmitterUpdate.title}
                          </h6>
                        </div>

                        {(activeTransmitterUpdate.adImageUrl || activeTransmitterUpdate.imageUrl) && (
                          <div className="rounded-xl overflow-hidden aspect-video border border-white/10">
                            <img 
                              src={activeTransmitterUpdate.adImageUrl || activeTransmitterUpdate.imageUrl || ''} 
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
                    Dismiss & Return to Pipeline
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Billing Dashboard modal portal */}
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
              <div className="absolute top-8 right-8 z-[210]">
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
