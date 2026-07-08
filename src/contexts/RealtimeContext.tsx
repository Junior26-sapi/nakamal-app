import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle } from 'lucide-react';

// Lazily initialized single shared AudioContext
let sharedAudioCtx: AudioContext | null = null;

const getSharedAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  
  // Try to resume if it was suspended
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  
  return sharedAudioCtx;
};

// Web Audio API Synthesizer - Client Synthesized Chimes to avoid 404 asset drops and network overhead
export const playChime = () => {
  try {
    if (localStorage.getItem('kava_muted') === 'true') return;
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    
    // Resume context to ensure browser compliance with async play
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playPing = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine'; // Premium soft sine sound
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = ctx.currentTime;
    playPing(now, 1174.66, 0.35); // D6 note
    playPing(now + 0.08, 1567.98, 0.45); // G6 note - harmonic major interval
  } catch (e) {
    console.warn('[AUDIO] Web Audio chime playback bypassed:', e);
  }
};

export const playWarningSound = () => {
  try {
    if (localStorage.getItem('kava_muted') === 'true') return;
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    
    // Resume context to ensure browser compliance with async play
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // Soft organic warm wood feel
    osc.frequency.setValueAtTime(330, ctx.currentTime); // E4
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.25); // Decline
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.warn('[AUDIO] Web Audio warning playback bypassed:', e);
  }
};

// Keyboard-like micro mechanical ticking sound for active typing
export const playTick = () => {
  try {
    if (localStorage.getItem('kava_muted') === 'true') return;
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Ultra brief high-frequency acoustic snap
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.003, ctx.currentTime); // Very quiet
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.015);
  } catch (e) {
    console.debug('[AUDIO] Keyboard tick bypassed:', e);
  }
};

// Tactility Solid metallic switch click sound for general buttons
export const playClick = () => {
  try {
    if (localStorage.getItem('kava_muted') === 'true') return;
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.01, ctx.currentTime); // Subtle but present
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.debug('[AUDIO] Touch click sound bypassed:', e);
  }
};

// Mobile Navigator Haptics (Vibrations)
export const triggerHaptic = (type: 'success' | 'warning' | 'light' | 'micro') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (type === 'success') {
        navigator.vibrate([40, 30, 40]); // Crisp double pulse
      } else if (type === 'warning') {
        navigator.vibrate([100, 50, 100]); // Heavy pulse
      } else if (type === 'micro') {
        navigator.vibrate(8); // Extremely soft keyboard-like touch pulse
      } else {
        navigator.vibrate(20); // Subatomic tactility pulse
      }
    } catch (e) {
      console.warn('[HAPTIC] Device vibration blocked or unsupported:', e);
    }
  }
};

export interface RealtimeMessage {
  id: string;
  type: 'info' | 'success' | 'warning';
  title: string;
  content: string;
  timestamp: number;
}

interface RealtimeContextType {
  isConnected: boolean;
  sendBroadcast: (payloadType: string, payload: any, recipientIds?: string[]) => void;
  playNotification: (type?: 'success' | 'warning') => void;
  triggerVibration: (type?: 'success' | 'warning' | 'light') => void;
  triggerAlert: (title: string, content: string, type?: 'info' | 'success' | 'warning') => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children, currentUserId }: { children: React.ReactNode; currentUserId?: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<RealtimeMessage[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  const triggerAlert = (title: string, content: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newAlert: RealtimeMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      content,
      timestamp: Date.now()
    };

    // Keep alerts updated in local state safely
    setAlerts(prev => [...prev, newAlert]);

    // Audio sound logic
    if (type === 'warning') {
      playWarningSound();
      triggerHaptic('warning');
    } else {
      playChime();
      triggerHaptic('success');
    }

    // Auto-dismiss alerts to prevent layout clutters
    setTimeout(() => {
      setAlerts(prev => prev.filter(al => al.id !== newAlert.id));
    }, 4500);
  };

  useEffect(() => {
    if (!currentUserId) {
      setIsConnected(false);
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${loc.host}`;

    let reconnectTimeoutRef: any = null;

    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log('[CLIENT] Real-Time WebSockets socket open');
        // Authenticate client
        socket.send(JSON.stringify({ type: 'auth', userId: currentUserId }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'chat_message') {
            // New message incoming natively
            triggerAlert(
              `New Chat from ${message.payload.senderName || 'User'}`,
              message.payload.text,
              'info'
            );
            // Propagate custom window event so individual chat tabs update gracefully without reload
            window.dispatchEvent(new CustomEvent('realtime-chat', { detail: message.payload }));
          } else if (message.type === 'alert') {
            triggerAlert(
              message.payload.title || 'Platform Notification',
              message.payload.description || 'New update available',
              message.payload.severity || 'info'
            );
          } else if (message.type === 'sync' || message.type === 'subscription_expire' || message.type === 'billing_renewal') {
            triggerAlert(
              message.payload.title || 'Real-Time Sync',
              message.payload.description || 'System state synchronized',
              message.payload.type || 'success'
            );
            // Dispatches window update to refresh stats/state
            window.dispatchEvent(new CustomEvent('realtime-sync', { detail: message.payload }));
          }
        } catch (err) {
          console.error('[CLIENT-WS] Error decoding socket payload:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.warn('[CLIENT] Sockets disconnected. Attempting auto reconnection...');
        reconnectTimeoutRef = setTimeout(() => {
          connect();
        }, 5000); // 5s connection interval
      };

      socket.onerror = (e) => {
        console.error('[CLIENT-WS] Websocket encountered an error:', e);
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef) clearTimeout(reconnectTimeoutRef);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [currentUserId]);

  // Global Interceptor for Audio & Haptic Sensory Feedback
  useEffect(() => {
    const handleInputFeedback = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        // Synthesize modern mechanical keyboard click
        playTick();

        // Detect if this input is a search bar/field
        const isSearchField = 
          target.type === 'search' ||
          (target.placeholder && typeof target.placeholder === 'string' && target.placeholder.toLowerCase().includes('search')) ||
          (target.id && typeof target.id === 'string' && target.id.toLowerCase().includes('search')) ||
          (target.name && typeof target.name === 'string' && target.name.toLowerCase().includes('search')) ||
          (target.className && typeof target.className === 'string' && target.className.toLowerCase().includes('search'));

        if (isSearchField) {
          // Vibrate precisely for search bar characters typing as requested
          triggerHaptic('micro');
        }
      }
    };

    const handleClickFeedback = (e: MouseEvent) => {
      let elem = e.target as HTMLElement | null;
      // Traverse ancestor chain to verify if clicking a button, tab, anchor, list control, or toggle
      while (elem && elem !== document.body) {
        const trgName = elem.tagName;
        const role = elem.getAttribute('role');
        const holdsPointer = elem.className && typeof elem.className === 'string' && (
          elem.className.includes('cursor-pointer') ||
          elem.className.includes('hover:bg-') ||
          elem.className.includes('hover:text-')
        );

        if (
          trgName === 'BUTTON' ||
          trgName === 'A' ||
          role === 'button' ||
          role === 'tab' ||
          holdsPointer ||
          elem.onclick !== null
        ) {
          // Play tactical responsive physical tap click sound and subtle vibration
          playClick();
          triggerHaptic('light');
          break;
        }
        elem = elem.parentElement;
      }
    };

    const handleTouchStart = () => {
      // Warm up and unlock the global audio context on mobile touch start gesture
      getSharedAudioContext();
    };

    document.addEventListener('input', handleInputFeedback, { capture: true, passive: true });
    document.addEventListener('click', handleClickFeedback, { capture: true, passive: true });
    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });

    return () => {
      document.removeEventListener('input', handleInputFeedback, { capture: true });
      document.removeEventListener('click', handleClickFeedback, { capture: true });
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, []);

  const sendBroadcast = (payloadType: string, payload: any, recipientIds: string[] = []) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify({
        type: 'broadcast',
        payloadType,
        payload,
        recipientIds
      }));
    } else {
      console.warn('[CLIENT-WS] Sockets unready. Saved update locally.');
    }
  };

  const playNotification = (type: 'success' | 'warning' = 'success') => {
    if (type === 'success') playChime();
    if (type === 'warning') playWarningSound();
  };

  const triggerVibration = (type: 'success' | 'warning' | 'light' = 'light') => {
    triggerHaptic(type);
  };

  return (
    <RealtimeContext.Provider value={{
      isConnected,
      sendBroadcast,
      playNotification,
      triggerVibration,
      triggerAlert
    }}>
      {children}

      {/* Floating Glassmorphic Alert Broadcaster (Zero-layout shift alert banners) */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex gap-4 p-4 rounded-2xl bg-black/80 dark:bg-zinc-900/95 backdrop-blur-md border border-white/20 shadow-2xl relative overflow-hidden"
            >
              {/* Highlight bar base */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                alert.type === 'warning' ? 'bg-red-500' : alert.type === 'success' ? 'bg-kava-gold' : 'bg-blue-400'
              }`} />

              <div className="pl-2.5 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {alert.type === 'warning' ? (
                    <motion.div
                      animate={{
                        rotate: [0, -10, 10, -10, 10, -5, 5, -2, 2, 0],
                        scale: [1, 1.2, 1.1, 1.2, 1.1, 1.15, 1.05, 1.05, 1.02, 1]
                      }}
                      transition={{
                        duration: 1.2,
                        ease: 'easeInOut',
                        repeat: 2,
                        repeatDelay: 1.5
                      }}
                      className="shrink-0 flex items-center justify-center text-red-400"
                    >
                      <AlertTriangle size={14} />
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={{
                        rotate: [0, -20, 15, -15, 12, -8, 8, -4, 4, 0],
                        scale: [1, 1.3, 1.15, 1.25, 1.1, 1.15, 1.05, 1.05, 1.02, 1]
                      }}
                      transition={{
                        duration: 1.4,
                        ease: 'easeInOut',
                        repeat: 2,
                        repeatDelay: 1.5
                      }}
                      className="shrink-0 flex items-center justify-center text-kava-gold"
                    >
                      <Bell size={14} />
                    </motion.div>
                  )}
                  <h4 className="font-bebas text-lg text-white tracking-wide uppercase">{alert.title}</h4>
                </div>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed">{alert.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used inside RealtimeProvider');
  }
  return context;
}
