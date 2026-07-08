import React, { useState, useMemo, useEffect } from 'react';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { Bar, MenuItem, Comment, BarUpdate, User as UserType } from '../types';
import { Search, MapPin, Tag, QrCode, ArrowUpRight, X, Megaphone, Calendar, Camera, LayoutGrid, Map as MapIcon, Heart, ThumbsUp, Flame, MessageCircle, Send, CheckCircle2, Upload, Filter, Edit3, Save, Check, RotateCcw, Clock, ChevronLeft, ChevronRight, Image as ImageIcon, PlusCircle, MinusCircle, Lightbulb, Volume2, VolumeX, Sparkles, BookOpen, Smartphone, Download, Server, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { feedbackService } from '../services/feedbackService';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import MultiBarMap from './MultiBarMap';
import ImageDropZone from './ImageDropZone';
import MultiImageUpload from './MultiImageUpload';
import VenueQRCode from './VenueQRCode';
import Fuse from 'fuse.js';
import NakamalLanding from './NakamalLanding';
import ThreeDVenueCard from './ThreeDVenueCard';

function playPcmBase64(base64Str: string, sampleRate: number = 24000) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const raw = window.atob(base64Str);
    const rawLength = raw.length;
    const arrayBuffer = new ArrayBuffer(rawLength);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < rawLength; i++) {
      uint8Array[i] = raw.charCodeAt(i);
    }
    
    // Each sample represents a 16-bit PCM integer (2 bytes)
    const int16Array = new Int16Array(arrayBuffer);
    const numSamples = int16Array.length;
    
    const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < numSamples; i++) {
      // Map signed 16-bit to float range of -1.0 to 1.0
      channelData[i] = int16Array[i] / 32768.0;
    }
    
    const sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);
    sourceNode.start(0);
    
    return {
      audioContext,
      sourceNode,
      stop: () => {
        try {
          sourceNode.stop();
          audioContext.close();
        } catch (e) {}
      }
    };
  } catch (error) {
    console.error("PCM playback initialization error:", error);
    return null;
  }
}

export default function Discover({ user, onTogglePortal }: { user: UserType | null, onTogglePortal?: () => void }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const [refreshKey, setRefreshKey] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [showEcosystemHub, setShowEcosystemHub] = useState(false);
  const [hubTab, setHubTab] = useState<'business' | 'domain' | 'download'>('business');
  // Helper to check app status synchronously on initial render
  const checkIsAppInstanceSync = () => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         (window.navigator as any).standalone === true;
    const isPwaQuery = window.location.search.includes('pwa=true') || 
                       window.location.search.includes('standalone=true');
    const isCapacitorNative = (window as any).Capacitor?.isNativePlatform?.() || false;
    const isNativeProtocol = window.location.protocol === 'capacitor:' || 
                             window.location.protocol === 'app:' || 
                             window.location.protocol === 'file:';
    return isStandalone || isPwaQuery || isCapacitorNative || isNativeProtocol;
  };

  const [isAppInstance, setIsAppInstance] = useState(checkIsAppInstanceSync);
  const [activePublicSection, setActivePublicSection] = useState<'landing' | 'explorer'>(() => {
    if (user) return 'explorer';
    return checkIsAppInstanceSync() ? 'explorer' : 'landing';
  });
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  // Detect mobile device or standalone PWA on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isApp = checkIsAppInstanceSync();
      setIsAppInstance(isApp);
      if (isApp) {
        setActivePublicSection('explorer');
      } else if (!user) {
        setActivePublicSection('landing');
      }
    }
  }, [user]);

  // Gemini TTS State Engine
  const [ttsState, setTtsState] = useState<{ id: string | null; loading: boolean; speaking: boolean; stopFn?: () => void }>({
    id: null,
    loading: false,
    speaking: false
  });

  // Stop current TTS playback
  const stopTts = () => {
    if (ttsState.stopFn) {
      ttsState.stopFn();
    }
    setTtsState({ id: null, loading: false, speaking: false });
  };

  // Trigger Gemini TTS Speech synthesis
  const handleTts = async (id: string, textToSpeak: string, voiceName: string = 'Kore') => {
    if (ttsState.id === id && (ttsState.speaking || ttsState.loading)) {
      stopTts();
      return;
    }

    if (ttsState.speaking) {
      stopTts();
    }

    setTtsState({ id, loading: true, speaking: false });

    try {
      const response = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voice: voiceName })
      });
      
      const resData = await response.json();
      if (!response.ok || resData.error) {
        throw new Error(resData.error || 'TTS Synthesis error');
      }

      const base64Audio = resData.audio;
      const playResult = playPcmBase64(base64Audio);
      
      if (playResult) {
        setTtsState({
          id,
          loading: false,
          speaking: true,
          stopFn: playResult.stop
        });
      } else {
        throw new Error("Unable to initialize client playback node");
      }
    } catch (err: any) {
      console.error('[TTS API Client] Failed speaking text:', err);
      alert(err.message || "Failed to read text. Ensure your environment has a valid API key.");
      setTtsState({ id: null, loading: false, speaking: false });
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (ttsState.stopFn) {
        ttsState.stopFn();
      }
    };
  }, [ttsState.stopFn]);

  // Supabase Real-time Listener for all venues
  useEffect(() => {
    const channel = supabase
      .channel('bars-discovery-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bars' }, (payload) => {
        const allBars = storage.getBars();
        
        if (payload.eventType === 'UPDATE') {
          const raw = payload.new as any;
          const updatedBar: Partial<Bar> = {
            id: raw.id,
            name: raw.name,
            address: raw.address,
            status: raw.status,
            category: raw.category,
            description: raw.description,
            tags: raw.tags || [],
            pricePreview: raw.price_preview,
            managerId: raw.manager_id,
            lat: raw.lat,
            lng: raw.lng,
            businessHours: raw.business_hours,
            statusHistory: raw.status_history,
            logoUrl: raw.logo_url,
            photos: raw.photos || []
          };
          
          const updated = allBars.map(b => b.id === updatedBar.id ? { ...b, ...updatedBar } : b) as Bar[];
          storage.saveBars(updated);
          refreshData();
          
          if (selectedBar?.id === updatedBar.id) {
            setSelectedBar(prev => prev ? { ...prev, ...updatedBar } : null);
          }
        } else if (payload.eventType === 'INSERT') {
          const raw = payload.new as any;
          const newBar: Bar = {
            ...raw,
            managerId: raw.manager_id,
            businessHours: raw.business_hours,
            statusHistory: raw.status_history,
            pricePreview: raw.price_preview,
            logoUrl: raw.logo_url,
            photos: raw.photos || [],
            tags: raw.tags || []
          };
          
          if (!allBars.find(b => b.id === newBar.id)) {
            storage.saveBars([...allBars, newBar]);
            refreshData();
          }
        } else if (payload.eventType === 'DELETE') {
          const filtered = allBars.filter(b => b.id !== payload.old.id);
          storage.saveBars(filtered);
          refreshData();
          if (selectedBar?.id === payload.old.id) {
            setSelectedBar(null);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBar]);

  // Get user location for distance check and auto-register
  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        localStorage.setItem('kava_registered_user_location', JSON.stringify({
          ...coords,
          accuracy: pos.coords.accuracy || 15,
          registeredAt: new Date().toISOString(),
          source: 'Vercel v0.app AI Auto-Registration',
          status: 'saved',
          radiusMeters: 800
        }));
      },
      () => {
        const defaultCoords = { lat: -17.7333, lng: 168.3167 };
        setUserLocation(defaultCoords);
        localStorage.setItem('kava_registered_user_location', JSON.stringify({
          ...defaultCoords,
          accuracy: 25,
          registeredAt: new Date().toISOString(),
          source: 'Vercel v0.app AI Auto-Registration (Fallback)',
          status: 'saved',
          radiusMeters: 800
        }));
      }
    );
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const refreshData = () => setRefreshKey(prev => prev + 1);

  const data = useMemo(() => ({
    users: storage.getUsers(),
    bars: storage.getBars(),
    menus: storage.getMenus(),
    comments: storage.getComments(),
    updates: storage.getBarUpdates().filter(u => u.isApproved)
  }), [refreshKey]);

  // Deep-linking parsing from query string to auto-select and expand a venue modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('venue') || params.get('bar');
    if (targetId && data.bars && data.bars.length > 0) {
      const match = data.bars.find(b => b.id === targetId);
      if (match) {
        setSelectedBar(match);
      }
    }
  }, [data.bars]);

  const handleReaction = (updateId: string, emoji: string) => {
    if (!user) {
      alert("Please login to react to updates!");
      return;
    }
    const allUpdates = storage.getBarUpdates();
    const updated = allUpdates.map(u => {
      if (u.id === updateId) {
        const reactions = { ...(u.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...u, reactions };
      }
      return u;
    });
    storage.saveBarUpdates(updated);
    refreshData();
  };

  const handleAddComment = (updateId: string, text: string) => {
    if (!user) {
      alert("Please login to comment!");
      return;
    }
    const allUpdates = storage.getBarUpdates();
    const updated = allUpdates.map(u => {
      if (u.id === updateId) {
        const comments = [...(u.comments || [])];
        comments.push({
          author: user?.name || "Guest Explorer",
          text,
          date: new Date().toISOString().split('T')[0],
          likes: 0
        });
        return { ...u, comments };
      }
      return u;
    });
    storage.saveBarUpdates(updated);
    refreshData();
  };

  const handleReviewProduct = (barId: string, itemName: string, text: string, rating: number) => {
    if (!user) {
      alert("Please login to leave reviews!");
      return;
    }
    const menus = storage.getMenus();
    const barMenu = menus[barId] || [];
    const updatedMenu = barMenu.map(item => {
      if (item.name === itemName) {
        const reviews = [...(item.reviews || [])];
        reviews.push({
          author: user?.name || "Guest Explorer",
          rating,
          text,
          date: new Date().toISOString().split('T')[0]
        });
        return { ...item, reviews };
      }
      return item;
    });
    menus[barId] = updatedMenu;
    storage.saveMenus(menus);
    refreshData();
  };

  const activeBars = useMemo(() => {
    return data.bars.filter(bar => {
      const mgr = data.users.find(u => u.id === bar.managerId);
      return mgr && mgr.approved && mgr.subscriptionActive;
    });
  }, [data]);

  const categories = useMemo(() => {
    const standardCats = ['Borogu Kava', 'Melo Melo Kava', 'Morning Fresh Kava'];
    const barCats = activeBars.map(b => b.category || '').filter(Boolean);
    const combined = new Set([...standardCats, ...barCats]);
    return ['All', ...Array.from(combined)];
  }, [activeBars]);

  const results = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let hiddenCount = 0;

    // 1. Initial Filtering by Status and Category
    let baseFiltered = activeBars.filter(bar => {
      const matchesStatus = statusFilter === 'all' || bar.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || bar.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });

    // 2. Fuzzy Search if term exists
    let searched = baseFiltered;
    if (term) {
      const fuse = new Fuse(baseFiltered, {
        keys: ['name', 'address', 'category', 'tags'],
        threshold: 0.35,
        ignoreLocation: true
      });
      searched = fuse.search(term).map(r => r.item);
    }

    // 3. Strict 800m radius threshold filtering for Guests only (Registered & Managers get full global access)
    const filtered = searched.filter(bar => {
      let matchesRadius = true;
      if (!user && userLocation) {
        const barLat = bar.lat || bar.location?.lat;
        const barLng = bar.lng || bar.location?.lng;
        
        if (barLat !== undefined && barLng !== undefined) {
          const dist = getDistance(userLocation.lat, userLocation.lng, barLat, barLng);
          matchesRadius = dist <= 800;
          
          // Increment hidden count if it matches the search but is outside radius
          if (!matchesRadius && searchTerm.length > 0) {
            hiddenCount++;
          }
        } else {
          matchesRadius = false; 
        }
      }
      return matchesRadius;
    });

    return { filtered, hiddenCount };
  }, [activeBars, searchTerm, statusFilter, categoryFilter, user, userLocation]);

  const filteredBars = results.filtered;
  const hiddenDueToRadius = results.hiddenCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Toggle between Landing and Interactive Map Explorer (Guests Only) */}
      {!user && !isAppInstance && (
        <div className="flex justify-center -mb-2">
          <div className="bg-kava-surface/50 backdrop-blur-md p-1.5 rounded-full flex gap-1 shadow-layered border border-white/20 dark:border-white/5 transition-all">
            <button
              id="toggle-nav-landing"
              onClick={() => setActivePublicSection('landing')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all text-xs font-black uppercase tracking-widest cursor-pointer ${
                activePublicSection === 'landing'
                  ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20 scale-[1.03]'
                  : 'text-kava-muted hover:bg-kava-text/5'
              }`}
            >
              <Sparkles size={12} />
              Nakamal Brand Portal
            </button>
            <button
              id="toggle-nav-explorer"
              onClick={() => setActivePublicSection('explorer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all text-xs font-black uppercase tracking-widest cursor-pointer ${
                activePublicSection === 'explorer'
                  ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20 scale-[1.03]'
                  : 'text-kava-muted hover:bg-kava-text/5'
              }`}
            >
              <MapIcon size={12} />
              Interactive Map Explorer
            </button>
          </div>
        </div>
      )}

      {activePublicSection === 'landing' ? (
        <NakamalLanding 
          onLaunchMap={() => {
            setActivePublicSection('explorer');
            setViewMode('map');
          }} 
          onOpenLogin={() => {
            const btn = document.getElementById('btn-login-portal');
            if (btn) btn.click();
          }}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div>
          <h2 className="font-bebas text-6xl text-kava-text tracking-tight uppercase leading-none">Curated Venues</h2>
          <p className="text-kava-muted/60 font-medium">Explore hand-picked kava bars & artisanal lounges</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="bg-kava-surface backdrop-blur-md p-1.5 rounded-full flex gap-1 shadow-inner border border-white/30 transition-colors w-full sm:w-auto">
            <button 
              onClick={() => { setViewMode('grid'); setShowEcosystemHub(false); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest ${
                viewMode === 'grid' && !showEcosystemHub ? 'bg-kava-text text-kava-bg shadow-xl' : 'text-kava-muted hover:bg-kava-text/5'
              }`}
            >
              <LayoutGrid size={14} />
              List View
            </button>
            <button 
              onClick={() => { setViewMode('map'); setShowEcosystemHub(false); }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest ${
                viewMode === 'map' && !showEcosystemHub ? 'bg-kava-text text-kava-bg shadow-xl' : 'text-kava-muted hover:bg-kava-text/5'
              }`}
            >
              <MapIcon size={14} />
              Interactive Map
            </button>
          </div>

          <div className="bg-kava-surface backdrop-blur-md p-1.5 rounded-full flex gap-1 shadow-inner border border-white/30 transition-colors w-full sm:w-auto overflow-x-auto no-scrollbar">
            <div className="flex items-center px-3 text-kava-muted/40 border-r border-kava-text/5">
              <Filter size={12} />
            </div>
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest min-w-[70px] whitespace-nowrap ${
                  categoryFilter === cat ? 'bg-kava-text text-white shadow-lg' : 'text-kava-muted hover:bg-kava-text/5'
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </div>

          <div className="bg-kava-surface backdrop-blur-md p-1.5 rounded-full flex gap-1 shadow-inner border border-white/30 transition-colors w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(['all', 'open', 'closed'] as const).map((status) => (
              <button 
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-full transition-all text-[10px] font-bold uppercase tracking-widest min-w-[70px] ${
                  statusFilter === status ? 'bg-kava-gold text-white shadow-lg' : 'text-kava-muted hover:bg-kava-text/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>



      {!user && searchTerm.length > 0 && hiddenDueToRadius > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-kava-gold/10 border-2 border-white p-4 rounded-[40px] text-center backdrop-blur-xl shadow-lg shadow-kava-gold/5"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-kava-gold">
            {hiddenDueToRadius} {hiddenDueToRadius === 1 ? 'Venue' : 'Venues'} matching "{searchTerm}" hidden beyond 800m • Sign up to unlock full island discovery
          </p>
        </motion.div>
      )}

      {/* Prominent Search Bar Section */}
      <section className="relative px-4 md:px-0">
        <div className="absolute -inset-1 bg-gradient-to-r from-kava-gold/30 via-white/40 to-kava-gold/30 rounded-[40px] blur-xl opacity-20" />
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-kava-gold transition-transform group-focus-within:scale-110">
            <Search size={24} strokeWidth={3} />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, address, or vibe..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              feedbackService.trigger('type');
            }}
            className="w-full bg-kava-surface backdrop-blur-xl border-[3px] border-white/60 focus:border-white rounded-[32px] py-6 px-16 focus:outline-none focus:ring-0 transition-all font-bebas text-3xl tracking-wide text-kava-text shadow-2xl placeholder:text-kava-muted/30 placeholder:uppercase"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-kava-text/5 hover:bg-kava-text/10 rounded-full text-kava-muted transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredBars.length > 0 ? (
              filteredBars.map((bar) => {
                const latestUpdate = data.updates.find(u => u.barId === bar.id);
                return (
                  <ThreeDVenueCard 
                    key={bar.id}
                    bar={bar}
                    latestUpdate={latestUpdate}
                    users={data.users}
                    onClick={() => setSelectedBar(bar)}
                  />
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                 <div className="font-bebas text-4xl text-kava-muted/20">No active venues found</div>
                 <p className="text-kava-muted/40">Try adjusting your search or check back later.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="map"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="w-full"
          >
            <MultiBarMap 
              bars={filteredBars} 
              onSelectBar={(bar) => setSelectedBar(bar)} 
              isLoggedIn={!!user}
              onTogglePortal={onTogglePortal}
            />
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}

      <AnimatePresence>
        {selectedBar && (
          <BarModal 
            bar={selectedBar} 
            user={user}
            isPro={data.users.find(u => u.id === selectedBar.managerId)?.subscription?.status === 'active'}
            menu={data.menus[selectedBar.id] || []}
            comments={data.comments[selectedBar.id] || []}
            updates={data.updates.filter(u => u.barId === selectedBar.id)}
            onReaction={handleReaction}
            onComment={handleAddComment}
            onReviewProduct={(itemName, text, rating) => handleReviewProduct(selectedBar.id, itemName, text, rating)}
            ttsState={ttsState}
            onSpeak={handleTts}
            onUpdateBar={async (updates) => {
              const allBars = storage.getBars();
              const updated = allBars.map(b => b.id === selectedBar.id ? { ...b, ...updates } : b);
              storage.saveBars(updated);
              
              // Push to Supabase for real-time sync
              try {
                await supabase
                  .from('bars')
                  .update(updates)
                  .eq('id', selectedBar.id);
              } catch (err) {
                console.error('Failed to sync to Supabase:', err);
              }

              setSelectedBar({ ...selectedBar, ...updates });
              refreshData();
            }}
            onClose={() => setSelectedBar(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { chatService } from '../services/chatService';

function BarModal({ bar, user, isPro, menu, comments, updates, onReaction, onComment, onReviewProduct, ttsState, onSpeak, onUpdateBar, onClose }: { 
  bar: Bar, 
  user: UserType | null,
  isPro?: boolean,
  menu: MenuItem[], 
  comments: Comment[], 
  updates: BarUpdate[], 
  onReaction: (id: string, emoji: string) => void, 
  onComment: (id: string, text: string) => void,
  onReviewProduct: (itemName: string, text: string, rating: number) => void,
  ttsState: { id: string | null; loading: boolean; speaking: boolean; },
  onSpeak: (id: string, text: string) => void,
  onUpdateBar: (updates: Partial<Bar>) => void,
  onClose: () => void 
}) {
  const events = updates.filter(u => u.type === 'event').sort((a,b) => b.timestamp - a.timestamp);
  const otherUpdates = updates.filter(u => u.type !== 'event').sort((a,b) => b.timestamp - a.timestamp);
  const isManager = user?.role === 'manager' && user?.barId === bar.id;
  const isUser = user?.role === 'user';
  
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'feedback'>('info');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const { locale, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  React.useEffect(() => {
    setTranslatedDesc(null);
  }, [bar.id]);

  const handleTranslateDescription = async () => {
    if (translatedDesc) {
      setTranslatedDesc(null);
      return;
    }
    setIsTranslating(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: bar.description, targetLang: locale })
      });
      const data = await response.json();
      if (data.translatedText) {
        setTranslatedDesc(data.translatedText);
      }
    } catch (err) {
      console.error('[AI Translate] Error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [tempBar, setTempBar] = useState(bar);
  const [showQrStation, setShowQrStation] = useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setTempBar(bar);
    }
  }, [bar, isEditing]);

  const averageRating = (reviews: any[]) => {
    if (!reviews || reviews.length === 0) return 0;
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  };

  const handleStartChat = async () => {
    if (!user) return;
    const chatId = await chatService.getOrCreateDirectChat(user.id, bar.managerId);
    if (chatId) {
      // We could use a window event or context to switch tabs in App.tsx
      // For now, let's just alert or log, as routing across components is handled by parent
      window.dispatchEvent(new CustomEvent('switchTab', { detail: 'messages' }));
      onClose();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div 
        layoutId={`bar-${bar.id}`}
        className="bg-kava-bg w-full max-w-2xl rounded-[48px] overflow-hidden relative border-[3px] border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Cover Banner Section */}
          <div className="relative h-40 md:h-52 bg-kava-text overflow-hidden flex-shrink-0">
             {bar.photos && bar.photos.length > 0 ? (
                <img 
                  src={bar.photos[0]} 
                  alt={`${bar.name} cover`} 
                  className="w-full h-full object-cover opacity-75 grayscale-[15%] hover:grayscale-0 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                />
             ) : bar.logoUrl ? (
                <img 
                  src={bar.logoUrl} 
                  alt={`${bar.name} cover`} 
                  className="w-full h-full object-cover opacity-30 blur-sm scale-105" 
                  referrerPolicy="no-referrer"
                />
             ) : (
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-kava-gold/20 via-kava-bg to-kava-bg opacity-40 flex items-center justify-center">
                  <span className="font-bebas text-9xl tracking-[0.2em] text-white/5">{bar.name.charAt(0)}</span>
                </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
             
             {/* Status Badge overlay on top-left of banner */}
             <div className="absolute top-6 left-8 flex items-center gap-3">
               <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${
                 bar.status === 'open' 
                   ? 'bg-emerald-500/95 border-emerald-400/30 text-white' 
                   : 'bg-rose-500/95 border-rose-400/30 text-white'
               } backdrop-blur-md shadow-lg`}>
                 <Lightbulb size={12} className={`shrink-0 ${bar.status === 'open' ? 'text-emerald-300 fill-emerald-300 drop-shadow-[0_0_4px_rgba(52,211,153,0.8)] animate-pulse' : 'text-rose-300 fill-rose-950/40 opacity-70'}`} />
                 Currently {bar.status}
               </span>
               
               {isPro && (
                 <span className="inline-flex items-center justify-center bg-blue-500/95 border border-blue-400/30 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] backdrop-blur-md shadow-lg" title="Verified Pro Venue">
                   Verified Pro
                 </span>
               )}
             </div>
          </div>

          {/* Profile Overlay Section */}
          <div className="relative px-8 md:px-12 -mt-10 md:-mt-14 z-10 flex flex-col md:flex-row md:items-end gap-5">
             {/* Circular Logo/Profile Picture */}
             <div className="w-20 h-20 md:w-28 md:h-28 bg-kava-surface rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 select-none relative">
               {bar.logoUrl ? (
                 <img 
                   src={bar.logoUrl} 
                   alt={`${bar.name} profile`} 
                   className="w-full h-full object-cover" 
                   referrerPolicy="no-referrer"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center font-bebas text-4xl md:text-5xl text-kava-gold bg-kava-text">
                   {bar.name.charAt(0)}
                 </div>
               )}
             </div>

             {/* Profile Meta info next to Logo */}
             <div className="flex-1 min-w-0 md:pb-1 animate-in slide-in-from-left duration-500">
               <h2 className="font-bebas text-4xl md:text-6xl text-kava-text leading-none tracking-tight truncate drop-shadow-sm mb-1.5">
                 {t(bar.name)}
               </h2>
               <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-kava-muted">
                 <span className="bg-kava-text/5 px-2.5 py-1 rounded-lg text-[9px] font-black tracking-widest text-kava-gold uppercase">
                   {t(bar.category)}
                 </span>
                 <span className="flex items-center gap-1 text-[11px] text-kava-muted/80">
                   <MapPin size={12} className="text-kava-gold shrink-0" />
                   {t(bar.address)}
                 </span>
               </div>
             </div>

             {/* Follow Button Action */}
             <div className="self-start md:self-end md:pb-1">
               {!user ? (
                 <div className="inline-flex items-center gap-1.5 bg-kava-gold/15 border border-kava-gold/30 px-3.5 py-1.5 rounded-full text-[9px] font-black text-kava-gold uppercase tracking-wider animate-pulse">
                   ⭐ Connect to Follow
                 </div>
               ) : (
                 <button className="flex items-center gap-1.5 bg-kava-text hover:bg-kava-gold hover:scale-[1.02] active:scale-95 text-white shadow-md border border-white/10 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider transition-all">
                   ⭐ Follow Venue
                 </button>
               )}
             </div>
          </div>

          <div className="p-8 md:p-12 space-y-10">
            {/* Modal Tabs */}
            <div className="flex gap-4 border-b border-kava-text/5 pb-4">
              {([
                { id: 'info', icon: MapPin, label: 'Overview' },
                { id: 'menu', icon: LayoutGrid, label: 'Menu' },
                { id: 'feedback', icon: MessageCircle, label: 'Feedback' },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === t.id ? 'bg-kava-gold text-white shadow-lg shadow-kava-gold/20' : 'text-kava-muted hover:bg-kava-text/5'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-10"
                >
                  <section>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2 text-kava-gold">
                        <MapPin size={20} />
                        <span className="font-semibold">{bar.address}</span>
                      </div>
                      {isManager && (
                        <button 
                          onClick={() => {
                            if (isEditing) {
                              setTempBar(bar);
                              setIsEditing(false);
                            } else {
                              setIsEditing(true);
                            }
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isEditing ? 'bg-rose-500 text-white shadow-lg' : 'bg-kava-text text-white hover:bg-kava-gold'
                          }`}
                        >
                          {isEditing ? <RotateCcw size={14} /> : <Edit3 size={14} />}
                          {isEditing ? 'Discard Changes' : 'Quick Edit Node'}
                        </button>
                      )}
                    </div>

                    {isManager && isEditing ? (
                      <div className="bg-kava-surface/50 border-2 border-white p-8 rounded-[40px] space-y-6 animate-in zoom-in-95 duration-300 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40 ml-4">Venue Branding Name</label>
                            <input 
                              value={tempBar.name}
                              onChange={(e) => setTempBar({ ...tempBar, name: e.target.value })}
                              className="w-full bg-white border-2 border-white rounded-[24px] py-4 px-6 font-bebas text-2xl tracking-wide text-kava-text shadow-sm focus:border-kava-gold transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40 ml-4">Operational Status</label>
                            <div className="flex gap-2">
                              {(['open', 'closed'] as const).map(s => (
                                <button 
                                  key={s}
                                  onClick={() => setTempBar({ ...tempBar, status: s })}
                                  className={`flex-1 py-4 rounded-[24px] font-bebas text-2xl tracking-widest transition-all ${
                                    tempBar.status === s 
                                      ? 'bg-kava-text text-white shadow-lg' 
                                      : 'bg-white border-2 border-white text-kava-muted'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40 ml-4">Geographic Address</label>
                          <input 
                            value={tempBar.address}
                            onChange={(e) => setTempBar({ ...tempBar, address: e.target.value })}
                            className="w-full bg-white border-2 border-white rounded-[24px] py-4 px-6 font-medium text-kava-text shadow-sm focus:border-kava-gold transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40 ml-4">Latitude Node</label>
                            <input 
                              type="number"
                              step="0.0001"
                              value={tempBar.lat || 0}
                              onChange={(e) => setTempBar({ ...tempBar, lat: parseFloat(e.target.value) })}
                              className="w-full bg-white border-2 border-white rounded-[20px] py-3 px-6 font-bold text-kava-text shadow-sm focus:border-kava-gold transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40 ml-4">Longitude Node</label>
                            <input 
                              type="number"
                              step="0.0001"
                              value={tempBar.lng || 0}
                              onChange={(e) => setTempBar({ ...tempBar, lng: parseFloat(e.target.value) })}
                              className="w-full bg-white border-2 border-white rounded-[20px] py-3 px-6 font-bold text-kava-text shadow-sm focus:border-kava-gold transition-all"
                            />
                          </div>
                        </div>

                        {/* Operational Hours Node */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 ml-4">
                            <Clock size={14} className="text-kava-gold" />
                            <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40">Temporal Availability (Operational Hours)</label>
                          </div>
                          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                             {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                               <div key={day} className="flex items-center justify-between bg-white border border-white/50 p-3 rounded-2xl">
                                  <span className="text-[10px] font-bold text-kava-text w-20">{day}</span>
                                  <div className="flex items-center gap-2">
                                     <input 
                                       type="time"
                                       value={tempBar.businessHours?.[day]?.open || "08:00"}
                                       disabled={tempBar.businessHours?.[day]?.closed}
                                       onChange={(e) => {
                                         const hours = { ...tempBar.businessHours };
                                         hours[day] = { ...hours[day], open: e.target.value };
                                         setTempBar({ ...tempBar, businessHours: hours });
                                       }}
                                       className="bg-kava-surface/50 border-none text-[10px] font-bold p-1 rounded-lg disabled:opacity-30"
                                     />
                                     <span className="text-kava-muted/30">-</span>
                                     <input 
                                       type="time"
                                       value={tempBar.businessHours?.[day]?.close || "17:00"}
                                       disabled={tempBar.businessHours?.[day]?.closed}
                                       onChange={(e) => {
                                         const hours = { ...tempBar.businessHours };
                                         hours[day] = { ...hours[day], close: e.target.value };
                                         setTempBar({ ...tempBar, businessHours: hours });
                                       }}
                                       className="bg-kava-surface/50 border-none text-[10px] font-bold p-1 rounded-lg disabled:opacity-30"
                                     />
                                     <button 
                                       onClick={() => {
                                         const hours = { ...tempBar.businessHours };
                                         hours[day] = { ...hours[day], closed: !hours[day]?.closed };
                                         setTempBar({ ...tempBar, businessHours: hours });
                                       }}
                                       className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                                         tempBar.businessHours?.[day]?.closed 
                                           ? 'bg-rose-500 text-white' 
                                           : 'bg-kava-muted/10 text-kava-muted'
                                       }`}
                                     >
                                       {tempBar.businessHours?.[day]?.closed ? 'Closed' : 'Open'}
                                     </button>
                                  </div>
                               </div>
                             ))}
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            onUpdateBar(tempBar);
                            setIsEditing(false);
                          }}
                          className="w-full py-5 bg-kava-gold text-white rounded-[28px] font-bebas text-3xl tracking-widest shadow-xl shadow-kava-gold/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                          <Save size={24} />
                          Finalize Node Updates
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-lg text-kava-muted leading-relaxed font-medium opacity-80 mb-1 lowercase first-letter:uppercase">
                          {translatedDesc ? translatedDesc : bar.description}
                        </p>
                        {translatedDesc && (
                          <p className="text-[10px] text-kava-gold font-bold uppercase tracking-widest flex items-center gap-1.5 mb-6">
                            ✨ {t('translated_by_gemini') || 'Translated via Gemini API'} ({locale.toUpperCase()})
                          </p>
                        )}
                        {!translatedDesc && <div className="mb-8" />}

                        {/* Google Gemini Translate & Text to Speech (TTS) Controls */}
                        <div className="flex flex-wrap items-center gap-3 mb-8 bg-kava-text/5 p-4 rounded-3xl border border-kava-text/10 shadow-sm font-sans">
                          <button
                            type="button"
                            onClick={() => onSpeak(`bar-desc-${bar.id}`, `Welcome to ${bar.name}. ${translatedDesc || bar.description}`)}
                            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                              ttsState.id === `bar-desc-${bar.id}` && ttsState.speaking
                                ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                                : ttsState.id === `bar-desc-${bar.id}` && ttsState.loading
                                ? 'bg-kava-gold/50 cursor-wait text-white'
                                : 'bg-kava-gold hover:bg-kava-gold/90 text-white'
                            }`}
                          >
                            {ttsState.id === `bar-desc-${bar.id}` && ttsState.speaking ? (
                              <>
                                <VolumeX size={14} /> Stop Listening
                              </>
                            ) : ttsState.id === `bar-desc-${bar.id}` && ttsState.loading ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Synthesizing AI Voice...
                              </>
                            ) : (
                              <>
                                <Volume2 size={14} /> Listen to Venue (Gemini TTS)
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleTranslateDescription}
                            disabled={isTranslating}
                            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-white ${
                              isTranslating ? 'animate-pulse opacity-75' : ''
                            }`}
                          >
                            <Sparkles size={14} className="text-kava-gold" />
                            {isTranslating ? 'Translating...' : translatedDesc ? 'Show Original' : `Translate (${locale.toUpperCase()})`}
                          </button>

                          {ttsState.id === `bar-desc-${bar.id}` && ttsState.speaking && (
                            <div className="flex gap-1 items-center">
                              <span className="w-1 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                              <span className="w-1 h-5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                              <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                            </div>
                          )}
                        </div>

                        {/* Venue Photos */}
                        {bar.photos && bar.photos.length > 0 && (
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Camera size={20} className="text-kava-gold" />
                                <h4 className="font-bebas text-2xl uppercase tracking-wider text-kava-text">Venue Highlights</h4>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    const el = document.getElementById(`carousel-${bar.id}`);
                                    if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
                                  }}
                                  className="p-2 bg-kava-text/5 hover:bg-kava-text/10 rounded-full text-kava-muted transition-all"
                                >
                                  <ChevronLeft size={16} />
                                </button>
                                <button 
                                  onClick={() => {
                                    const el = document.getElementById(`carousel-${bar.id}`);
                                    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                                  }}
                                  className="p-2 bg-kava-text/5 hover:bg-kava-text/10 rounded-full text-kava-muted transition-all"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                            <div 
                              id={`carousel-${bar.id}`}
                              className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x scroll-smooth"
                            >
                              {bar.photos.map((photo, i) => (
                                <motion.div 
                                  key={i} 
                                  whileHover={{ scale: 1.02 }}
                                  className="min-w-[280px] aspect-[4/3] rounded-[32px] overflow-hidden snap-start border-[2.5px] border-white shadow-lg cursor-zoom-in"
                                >
                                  <img src={photo} alt={`${bar.name} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                    {isUser && (
                      <button 
                        onClick={handleStartChat}
                        className="flex items-center gap-3 px-8 py-4 bg-kava-text text-white rounded-2xl font-bebas text-xl tracking-widest hover:bg-kava-gold transition-all shadow-xl shadow-kava-text/10"
                      >
                        <MessageCircle size={20} />
                        Chat Directly with Manager
                      </button>
                    )}
                  </>
                )}
              </section>

              {/* Visual Identity & Gallery for Managers */}
                  {isManager && (
                    <section className="space-y-10">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                            <Camera size={20} />
                          </div>
                          <h3 className="font-bebas text-3xl uppercase tracking-wider text-kava-text">Visual Identity</h3>
                        </div>
                        <div className="max-w-md">
                          <ImageDropZone 
                            id={`bar-logo-${bar.id}`}
                            imageUrl={bar.logoUrl || null}
                            onImageChange={(newLogo) => onUpdateBar({ logoUrl: newLogo })}
                            onImageRemove={() => onUpdateBar({ logoUrl: '' })}
                            label="Capture or upload bar profile picture"
                            className="h-64 shadow-2xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                            <ImageIcon size={20} />
                          </div>
                          <h3 className="font-bebas text-3xl uppercase tracking-wider text-kava-text">Venue Gallery</h3>
                        </div>
                        <MultiImageUpload 
                          id={`bar-gallery-${bar.id}`}
                          images={bar.photos || []}
                          onImagesChange={(newPhotos) => onUpdateBar({ photos: newPhotos })}
                          label="Drop multiple highlights or artisanal shots here"
                        />
                      </div>
                    </section>
                  )}

                  {/* Upcoming Events */}
                  {events.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
                          <Calendar size={20} />
                        </div>
                        <h3 className="font-bebas text-3xl uppercase tracking-wider text-kava-text">Upcoming Events</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {events.map(event => (
                          <UpdateCard key={event.id} update={event} user={user} onReaction={onReaction} onComment={onComment} ttsState={ttsState} onSpeak={onSpeak} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Pulse Feed */}
                  {otherUpdates.length > 0 && (
                    <section className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                          <Flame size={20} />
                        </div>
                        <h3 className="font-bebas text-3xl uppercase tracking-wider text-kava-text">Pulse Feed</h3>
                      </div>
                      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x">
                        {otherUpdates.map(upd => (
                          <div key={upd.id} className="min-w-[320px] snap-start">
                            <UpdateCard update={upd} user={user} onReaction={onReaction} onComment={onComment} ttsState={ttsState} onSpeak={onSpeak} />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </motion.div>
              )}

              {activeTab === 'menu' && (
                <motion.div 
                   key="menu"
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   className="space-y-8"
                >
                  <div className="grid grid-cols-1 gap-4">
                    {menu.length > 0 ? menu.map((item, idx) => (
                      <div key={idx} className="space-y-4">
                        <motion.button 
                          onClick={() => setSelectedMenuItem(selectedMenuItem?.name === item.name ? null : item)}
                          whileHover={{ y: -3, scale: 1.01, boxShadow: "0 10px 20px -3px rgba(0, 0, 0, 0.05)" }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: "spring", stiffness: 450, damping: 25 }}
                          className={`w-full flex justify-between items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left ${
                            selectedMenuItem?.name === item.name ? 'bg-kava-gold/5 border-kava-gold shadow-lg' : 'bg-white/40 border-white hover:border-kava-gold/40 shadow-sm'
                          }`}
                        >
                          <div className="flex-1 flex gap-4 items-center">
                            {item.imageUrl && (
                              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/40 shadow-sm">
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="font-bold text-lg text-kava-text truncate">{item.name}</span>
                                {item.reviews && item.reviews.length > 0 && (
                                  <span className="flex items-center gap-1 bg-kava-gold/10 text-kava-gold px-2 py-0.5 rounded-full text-[9px] font-black">
                                    ⭐ {averageRating(item.reviews)}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-kava-muted/40 truncate">
                                {item.category || 'GENERAL'} • {item.reviews?.length || 0} REVIEWS • {item.status || 'AVAILABLE'}
                              </div>
                              {item.description && (
                                <p className="text-[10px] text-kava-muted/60 mt-1 line-clamp-1">{item.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            {item.promotionPrice ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest">PROMO</span>
                                  <span className="font-bebas text-2xl text-rose-500 tracking-wider">{formatPrice(item.promotionPrice)}</span>
                                </div>
                                <span className="text-[10px] font-bold text-kava-muted line-through opacity-50">{formatPrice(item.price)}</span>
                              </>
                            ) : (
                              <span className="font-bebas text-3xl text-kava-gold tracking-wider">{formatPrice(item.price)}</span>
                            )}
                          </div>
                        </motion.button>

                        {/* Review Expansion */}
                        <AnimatePresence>
                          {selectedMenuItem?.name === item.name && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden px-4"
                            >
                              <div className="bg-kava-surface rounded-[28px] p-6 border-2 border-white shadow-inner space-y-6">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-bebas text-2xl uppercase tracking-widest text-kava-muted">Product Reviews</h4>
                                  <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Clean Business Environment</div>
                                </div>

                                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                  {item.reviews?.map((r, i) => (
                                    <div key={i} className="bg-white/40 p-4 rounded-2xl space-y-2 border border-white/20">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <span className="font-black text-[10px] uppercase text-kava-muted">{r.author}</span>
                                          <div className="flex text-kava-gold">
                                            {Array.from({ length: 5 }).map((_, star) => (
                                              <span key={star} className={star < r.rating ? "opacity-100" : "opacity-20"}>★</span>
                                            ))}
                                          </div>
                                        </div>
                                        <span className="text-[9px] font-bold text-kava-muted/30">{r.date}</span>
                                      </div>
                                      <p className="text-sm font-medium text-kava-text leading-snug">{r.text}</p>
                                    </div>
                                  ))}
                                  {(!item.reviews || item.reviews.length === 0) && (
                                    <div className="text-center py-8 text-kava-muted/40 italic text-sm">No reviews yet for this selection.</div>
                                  )}
                                </div>

                                 {user ? (
                                   <div className="pt-6 border-t border-kava-text/5 space-y-4">
                                     <div className="flex items-center justify-between">
                                       <span className="text-[10px] font-black uppercase tracking-widest text-kava-muted">Leave your rating</span>
                                       <div className="flex gap-2">
                                         {[1, 2, 3, 4, 5].map(star => (
                                           <button 
                                             key={star}
                                             onClick={() => setReviewRating(star)}
                                             className={`text-2xl transition-all ${reviewRating >= star ? 'text-kava-gold scale-110' : 'text-kava-muted/20'}`}
                                           >
                                             ★
                                           </button>
                                         ))}
                                       </div>
                                     </div>
                                     <div className="relative">
                                       <textarea 
                                         placeholder="Share your experience with this craft..."
                                         value={reviewText}
                                         onChange={(e) => setReviewText(e.target.value)}
                                         className="w-full bg-white/60 border-2 border-white/20 rounded-2xl p-4 text-sm font-medium outline-none focus:border-kava-gold/40 h-24 resize-none transition-all"
                                       />
                                       <button 
                                         disabled={!reviewText.trim()}
                                         onClick={() => {
                                           onReviewProduct(item.name, reviewText, reviewRating);
                                           setReviewText('');
                                           setReviewRating(5);
                                         }}
                                         className="absolute bottom-4 right-4 p-3 bg-kava-gold text-white rounded-xl shadow-lg shadow-kava-gold/20 hover:scale-105 active:scale-95 disabled:opacity-30 transition-all"
                                       >
                                         <Send size={16} />
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                   <div className="pt-6 border-t border-kava-text/5 text-center">
                                      <button 
                                        className="w-full py-4 bg-kava-gold/10 border-2 border-dashed border-kava-gold/40 rounded-2xl font-bold text-[10px] text-kava-gold uppercase tracking-widest hover:bg-kava-gold/20 transition-all"
                                        onClick={() => alert("Please login to review products!")}
                                      >
                                        Sign in to share your experience
                                      </button>
                                   </div>
                                 )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )) : <div className="text-center py-20 text-kava-muted/40 italic">The manager has not published the menu yet.</div>}
                  </div>
                </motion.div>
              )}

              {activeTab === 'feedback' && (
                <motion.div 
                   key="feedback"
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 10 }}
                   className="space-y-6"
                >
                  <h3 className="font-bebas text-3xl uppercase tracking-wider text-kava-text">Community Feedback</h3>
                  <div className="space-y-6">
                    {comments.length > 0 ? comments.map((comment, idx) => (
                      <div key={idx} className="bg-kava-text/5 p-5 rounded-3xl space-y-2 border border-white/10 transition-colors text-kava-text relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-kava-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-kava-muted/40">
                          <span>{comment.author}</span>
                          <span>{comment.date}</span>
                        </div>
                        <p className="text-kava-text/80 font-medium leading-snug">{t(comment.text)}</p>
                        <div className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                          ❤️ {comment.likes} LIKES
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center space-y-4 opacity-40">
                        <MessageCircle size={48} className="mx-auto" />
                        <p className="italic text-sm">No general feedback yet. Be the first to start the conversation!</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer info or quick close */}
        <div className="p-6 bg-white/40 backdrop-blur-xl border-t border-kava-text/5 flex justify-center">
            <button 
              onClick={onClose}
              className="px-12 py-3 bg-kava-text text-white font-bebas text-xl tracking-widest rounded-full hover:bg-kava-gold transition-all"
            >
              Back to Explorer
            </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface UpdateCardProps {
  update: BarUpdate;
  user: UserType | null;
  onReaction: (id: string, emoji: string) => void;
  onComment: (id: string, text: string) => void;
  ttsState: { id: string | null; loading: boolean; speaking: boolean; };
  onSpeak: (id: string, text: string) => void;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update, user, onReaction, onComment, ttsState, onSpeak }) => {
  const { t } = useLanguage();
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const emojis = [
    { char: '🔥', label: 'fire' },
    { char: '❤️', label: 'heart' },
    { char: '👍', label: 'thumbs' }
  ];

  return (
    <div className="kava-card group flex flex-col h-full !p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="text-[10px] font-black text-kava-gold uppercase tracking-[0.2em] bg-kava-gold/5 px-3 py-1 rounded-full outline outline-1 outline-kava-gold/10">
          {new Date(update.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="p-2 text-kava-muted/20 group-hover:text-kava-gold/40 transition-colors">
          {update.type === 'event' ? <Calendar size={16} /> : <Megaphone size={16} />}
        </div>
      </div>
      {(update.adImageUrl || update.imageUrl) && (
        <div className="h-44 w-full mb-4 rounded-2xl overflow-hidden bg-kava-text/5 relative border border-white/50">
          <img 
            src={update.adImageUrl || update.imageUrl} 
            alt={t(update.title)} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            referrerPolicy="no-referrer" 
          />
          {update.adImageUrl && (
            <div className="absolute top-3 right-3 bg-rose-500/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white">
              Event Poster
            </div>
          )}
        </div>
      )}
      <h4 className="font-bebas text-3xl text-kava-text leading-tight mb-2 uppercase tracking-wide">{t(update.title)}</h4>
      <p className="text-sm text-kava-muted font-medium opacity-80 line-clamp-3 leading-relaxed mb-4 flex-1">
        {t(update.description)}
      </p>

      {/* Interactions */}
      <div className="pt-4 border-t border-kava-text/5 space-y-4">
        {/* Reactions Row */}
        <div className="flex flex-wrap items-center gap-2">
          {emojis.map(e => (
            <button
              key={e.char}
              onClick={() => onReaction(update.id, e.char)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-kava-text/5 hover:bg-kava-gold/10 rounded-full transition-all border border-transparent hover:border-kava-gold/20"
            >
              <span className="text-base">{e.char}</span>
              <span className="text-[10px] font-bold text-kava-muted">
                {update.reactions?.[e.char] || 0}
              </span>
            </button>
          ))}

          {/* Gemini Text To Speech Play/Stop button */}
          <button
            onClick={() => onSpeak(update.id, `Announcement: ${update.title}. description details: ${t(update.description)}`)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border text-[10px] font-bold ${
              ttsState.id === update.id && ttsState.speaking
                ? 'bg-rose-500 text-white border-rose-400/20 shadow-md animate-pulse'
                : ttsState.id === update.id && ttsState.loading
                ? 'bg-kava-gold/30 text-kava-text border-kava-gold/15 cursor-wait'
                : 'bg-kava-text/5 hover:bg-kava-gold/10 text-kava-muted border-transparent hover:border-kava-gold/20'
            }`}
            title="Read announcement aloud with Gemini TTS AI Speech"
          >
            {ttsState.id === update.id && ttsState.speaking ? (
              <VolumeX size={12} className="stroke-[2.5]" />
            ) : ttsState.id === update.id && ttsState.loading ? (
              <div className="w-2.5 h-2.5 border-2 border-kava-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              <Volume2 size={12} className="stroke-[2.5]" />
            )}
            <span>AI Voice</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="ml-auto p-2 text-kava-muted hover:text-kava-gold transition-all flex items-center gap-1"
          >
            <MessageCircle size={14} />
            <span className="text-[10px] font-bold">{(update.comments?.length || 0)}</span>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {update.comments?.map((c, i) => (
                <div key={i} className="text-[10px] bg-kava-text/5 p-2 rounded-xl border border-white/10">
                  <div className="flex justify-between font-bold text-kava-muted/60 mb-0.5">
                    <span>{c.author}</span>
                    <span>{c.date}</span>
                  </div>
                  <p className="text-kava-text/80">{t(c.text)}</p>
                </div>
              ))}
              {(!update.comments || update.comments.length === 0) && (
                <p className="text-[10px] text-kava-muted/40 italic">Be the first to comment...</p>
              )}
            </div>
            
            {user ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (commentText.trim()) {
                    onComment(update.id, commentText);
                    setCommentText('');
                  }
                }}
                className="flex gap-2"
              >
                <input 
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 bg-kava-text/5 border-none rounded-xl px-3 py-2 text-[10px] focus:ring-1 focus:ring-kava-gold/30"
                />
                <button 
                  type="submit"
                  disabled={!commentText.trim()}
                  className="p-2 bg-kava-gold text-white rounded-xl hover:bg-kava-gold/80 transition-all disabled:opacity-30"
                >
                  <Send size={12} />
                </button>
              </form>
            ) : (
              <button 
                onClick={() => alert("Please login to comment!")}
                className="w-full py-2 bg-kava-text/5 rounded-xl text-[8px] font-black uppercase text-kava-muted/40 tracking-[0.2em] hover:bg-kava-text/10 transition-all"
              >
                Sign in to participate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
