import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '../lib/supabase';
import { locationService } from '../services/locationService';
import { MapPin, Navigation, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LiveLocationTracker() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    locationService.initTracking();

    if (mapContainer.current && !map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://openfreemap.org/style/street.json', // Updated to a more standard open style
        center: [0, 0],
        zoom: 2,
        attributionControl: false
      });

      const geolocate = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true
      });

      map.current.addControl(geolocate);
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      geolocate.on('geolocate', async (e: any) => {
        const { longitude, latitude } = e.coords;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const timestamp = new Date().toISOString();
        setIsSyncing(true);

        // 1. Save locally for redundancy
        locationService.saveToLocalStorage(user.id, longitude, latitude, timestamp);

        // 2. Sync to cloud
        try {
          await locationService.syncLocationToSupabase(user.id, longitude, latitude);
          setLastSync(timestamp);
        } catch (err) {
          console.warn('Sync failed, using redundancy layer.');
        } finally {
          setIsSyncing(false);
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-kava-gold/10 rounded-xl text-kava-gold">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-bebas text-3xl uppercase tracking-wider text-kava-text leading-none">Live Explorer Tracker</h3>
            <p className="text-[10px] font-black text-kava-muted/40 uppercase tracking-widest mt-1">Geospatial Redundancy Protocol Active</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence mode="wait">
            {isSyncing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1 bg-kava-gold/10 text-kava-gold rounded-full text-[9px] font-black uppercase tracking-widest"
              >
                <Loader2 size={10} className="animate-spin" />
                Syncing
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
            isOnline ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isOnline ? 'Cloud Linked' : 'Offline Mode'}
          </div>
        </div>
      </div>

      <div className="relative h-[500px] w-full rounded-[48px] overflow-hidden border border-kava-text/5 bg-kava-text/5 shadow-2xl group">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Overlay Controls Branding */}
        <div className="absolute top-6 left-6 pointer-events-none">
          <div className="bg-kava-text/80 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <Navigation size={16} className="text-kava-gold" />
              <span className="font-bebas text-xl text-white tracking-widest">REAL-TIME GPS</span>
            </div>
            <div className="space-y-1">
              <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Last Cloud Handshake</div>
              <div className="text-[10px] font-bold text-white/80">{lastSync ? new Date(lastSync).toLocaleTimeString() : 'Awaiting Fix...'}</div>
            </div>
          </div>
        </div>

        {/* Floating Calibration Effect */}
        <div className="absolute inset-0 pointer-events-none border-[16px] border-kava-text/10 rounded-[48px] transition-opacity group-hover:opacity-100 opacity-60" />
      </div>

      <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-kava-text text-white rounded-2xl">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-kava-text text-sm uppercase tracking-wider mb-1">PostGIS Synchronization</h4>
            <p className="text-xs text-kava-muted leading-relaxed font-medium">
              Your location data is processed through our spatial cluster using geography-aware SRID:4326. 
              In the event of connection loss, our local redundancy layer captures your movement and auto-syncs 
              once the handshake with Supabase is restored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
