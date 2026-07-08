import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { motion } from 'motion/react';
import maplibregl from 'maplibre-gl';
import { Bar, User } from '../types';
import { MapPin, ArrowRight, Trash2, X, Globe, Star, Phone, ShieldAlert, Sliders, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AdminBarMapProps {
  bars: Bar[];
  suppliers?: User[];
  onUpdateBar?: (barId: string, updates: Partial<Bar>) => void;
  onAddBar?: (bar: Partial<Bar>) => void;
  onDeleteBar?: (barId: string) => void;
  readOnly?: boolean;
}

export default function AdminBarMap({ 
  bars, 
  suppliers = [], 
  onUpdateBar, 
  onAddBar, 
  onDeleteBar,
  readOnly = false 
}: AdminBarMapProps) {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: { marker: maplibregl.Marker; root?: Root } }>({});
  
  // Selected Node State (can be either kava bar or a supplier node)
  const [selectedNode, setSelectedNode] = useState<{ id: string; type: 'bar' | 'supplier' } | null>(null);
  const [mapFilter, setMapFilter] = useState<'all' | 'bars' | 'suppliers'>('all');
  
  const [newBarLocation, setNewBarLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [newBarName, setNewBarName] = useState('');

  // Vanuatu coordinates
  const defaultCenter: [number, number] = [168.3270, -17.7333];

  // Consolidate Active Filtered Nodes
  const activeNodes = useMemo(() => {
    const list: {
      id: string;
      name: string;
      lat: number;
      lng: number;
      type: 'bar' | 'supplier';
      status?: 'open' | 'closed';
      address: string;
      category?: string;
      phone?: string;
      website?: string;
      supplierTitle?: string;
    }[] = [];

    // Add Kava Bars
    if (mapFilter === 'all' || mapFilter === 'bars') {
      bars.forEach(b => {
        if (typeof b.lat === 'number' && typeof b.lng === 'number') {
          list.push({
            id: b.id,
            name: b.name,
            lat: b.lat,
            lng: b.lng,
            type: 'bar',
            status: b.status,
            address: b.address,
            category: b.category || 'Bar'
          });
        }
      });
    }

    // Add Wholesale Suppliers
    if (mapFilter === 'all' || mapFilter === 'suppliers') {
      suppliers.forEach(s => {
        if (s.location && typeof s.location.lat === 'number' && typeof s.location.lng === 'number') {
          list.push({
            id: s.id,
            name: s.name,
            lat: s.location.lat,
            lng: s.location.lng,
            type: 'supplier',
            address: s.location.address,
            phone: s.phone || '+678 Domestic Supply',
            website: s.website || 'Cooperative Node',
            supplierTitle: s.supplierTitle || 'Wholesale Supplier'
          });
        }
      });
    }

    return list;
  }, [bars, suppliers, mapFilter]);

  // Derived Active Selections
  const activeSelectedBar = useMemo(() => {
    if (selectedNode?.type !== 'bar') return null;
    return bars.find(b => b.id === selectedNode.id) || null;
  }, [bars, selectedNode]);

  const activeSelectedSupplier = useMemo(() => {
    if (selectedNode?.type !== 'supplier') return null;
    return suppliers.find(s => s.id === selectedNode.id) || null;
  }, [suppliers, selectedNode]);

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: defaultCenter,
      zoom: 12,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.current.on('click', (e) => {
      // Don't set new location if click event originated from a map marker or readOnly is active
      if (readOnly) return;
      if ((e.originalEvent.target as HTMLElement).closest('.marker-node')) return;
      
      setNewBarLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setNewBarName('');
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [readOnly]);

  // Handle flying-to or centering selected node changes
  useEffect(() => {
    if (!map.current || !selectedNode) return;
    const node = activeNodes.find(n => n.id === selectedNode.id);
    if (node) {
      map.current.flyTo({
        center: [node.lng, node.lat],
        zoom: 14,
        essential: true
      });
    }
  }, [selectedNode?.id, activeNodes]);

  // Update Maplibre markers dynamically based on the filtered node list
  useEffect(() => {
    if (!map.current) return;

    const activeNodeIds = new Set(activeNodes.map(n => n.id));

    // Cleanup stale markers
    Object.keys(markers.current).forEach(id => {
      if (!activeNodeIds.has(id)) {
        markers.current[id].marker.remove();
        markers.current[id].root?.unmount();
        delete markers.current[id];
      }
    });

    // Add and sync fresh markers
    activeNodes.forEach(node => {
      let item = markers.current[node.id];
      const isActive = selectedNode?.id === node.id;

      if (item) {
        item.marker.setLngLat([node.lng, node.lat]);
      } else {
        const el = document.createElement('div');
        el.className = 'marker-node';
        el.style.cursor = 'pointer';

        const isDraggable = !readOnly && node.type === 'bar';

        const marker = new maplibregl.Marker({ 
          element: el,
          draggable: isDraggable 
        })
          .setLngLat([node.lng, node.lat])
          .addTo(map.current!);

        if (isDraggable && onUpdateBar) {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            onUpdateBar(node.id, { lat: lngLat.lat, lng: lngLat.lng });
            if (selectedNode?.id === node.id) {
              setSelectedNode(prev => prev ? { ...prev, lat: lngLat.lat, lng: lngLat.lng } as any : null);
            }
          });
        }

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedNode({ id: node.id, type: node.type });
        });

        const root = createRoot(el);
        item = { marker, root };
        markers.current[node.id] = item;
      }

      // Render the Framer Motion-powered marker component
      if (item.root) {
        item.root.render(
          <MarkerComponent type={node.type} status={node.status} isActive={isActive} />
        );
      }
    });
  }, [activeNodes, selectedNode, readOnly, onUpdateBar]);

  const handleCreateBar = () => {
    if (newBarLocation && newBarName.trim() && onAddBar) {
      onAddBar({
        name: newBarName.trim(),
        lat: newBarLocation.lat,
        lng: newBarLocation.lng,
      });
      setNewBarLocation(null);
      setNewBarName('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h3 className="font-bebas text-4xl text-kava-text tracking-wider uppercase leading-none">
            {readOnly ? t("Supply & Bar Network Map") : t("Global Venue Network")}
          </h3>
          <p className="text-kava-muted/60 font-medium uppercase text-[10px] tracking-widest mt-2">
            {t("Visualizing verified physical establishments and supplier cargo nodes via MapLibre")}
          </p>
        </div>

        {/* Beautiful filters switcher */}
        <div className="flex bg-white/40 p-1 rounded-2xl border border-white/80 self-start md:self-auto shadow-sm">
          <button
            onClick={() => setMapFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer ${
              mapFilter === 'all'
                ? 'bg-kava-text text-white'
                : 'text-kava-muted hover:text-kava-text'
            }`}
          >
            🌀 All Nodes
          </button>
          <button
            onClick={() => setMapFilter('bars')}
            className={`px-4 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer ${
              mapFilter === 'bars'
                ? 'bg-emerald-500 text-neutral-950'
                : 'text-kava-muted hover:text-kava-text'
            }`}
          >
            ☘️ Kava Bars ({bars.length})
          </button>
          <button
            onClick={() => setMapFilter('suppliers')}
            className={`px-4 py-1.5 rounded-xl text-[9px] uppercase tracking-widest font-black transition-all cursor-pointer ${
              mapFilter === 'suppliers'
                ? 'bg-amber-500 text-neutral-950 font-black'
                : 'text-kava-muted hover:text-kava-text'
            }`}
          >
            📦 Suppliers ({suppliers.length})
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar List */}
        <div className="w-full lg:w-80 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-kava-bg/50 backdrop-blur-md rounded-3xl border border-white/20 p-4 sticky top-0 z-10 flex justify-between items-center">
            <h4 className="font-bebas text-2xl text-kava-text uppercase tracking-wide">
              {t("Network Registry")} ({activeNodes.length})
            </h4>
            <span className="text-[9px] font-black uppercase text-kava-muted bg-neutral-200/50 px-2.5 py-1 rounded-full">
              {mapFilter}
            </span>
          </div>

          {activeNodes.map((node) => (
            <div
              key={node.id}
              className={`w-full text-left p-4 rounded-3xl border transition-all space-y-3 ${
                selectedNode?.id === node.id 
                  ? 'bg-kava-gold/5 border-kava-gold shadow-lg shadow-kava-gold/10' 
                  : 'bg-white/50 border-white/20 text-kava-text'
              }`}
            >
              <button 
                onClick={() => setSelectedNode({ id: node.id, type: node.type })}
                className="w-full text-left flex justify-between items-start"
              >
                <div>
                  <div className="font-bold text-sm leading-tight truncate pr-2">{node.name}</div>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest block mt-1">
                    {node.type === 'bar' ? '☘️ Kava Nakamal' : '📦 Storage Node'}
                  </span>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                  node.type === 'supplier' 
                    ? 'bg-amber-100 text-amber-700'
                    : node.status === 'open' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-rose-100 text-rose-700'
                }`}>
                  {node.type === 'supplier' ? 'supplier' : node.status}
                </div>
              </button>

              {node.type === 'bar' && !readOnly ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-kava-muted/60 ml-2">Lat</span>
                      <input 
                        type="number"
                        step="any"
                        value={node.lat || ''}
                        disabled={readOnly}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (onUpdateBar) {
                            onUpdateBar(node.id, { lat: isNaN(val) ? undefined : val });
                          }
                        }}
                        className="w-full bg-white/80 border border-kava-text/5 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-kava-gold transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-kava-muted/60 ml-2">Lng</span>
                      <input 
                        type="number"
                        step="any"
                        value={node.lng || ''}
                        disabled={readOnly}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (onUpdateBar) {
                            onUpdateBar(node.id, { lng: isNaN(val) ? undefined : val });
                          }
                        }}
                        className="w-full bg-white/80 border border-kava-text/5 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-kava-gold transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedNode({ id: node.id, type: node.type })}
                      className="flex-[2] py-1.5 rounded-xl bg-kava-text/5 text-[8px] font-black uppercase tracking-widest hover:bg-kava-text/10 transition-colors"
                    >
                      Locate
                    </button>
                    {onDeleteBar && (
                      <button 
                        onClick={() => onDeleteBar(node.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="Remove Venue"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-black/5">
                  <span className="text-[9px] text-kava-muted font-medium truncate max-w-[200px]">
                    📍 {node.address}
                  </span>
                  <button 
                    onClick={() => setSelectedNode({ id: node.id, type: node.type })}
                    className="py-1 px-2.5 rounded-lg bg-kava-text/5 text-[8px] font-black uppercase tracking-widest hover:bg-kava-gold hover:text-white transition-colors"
                  >
                    Locate
                  </button>
                </div>
              )}
            </div>
          ))}

          {activeNodes.length === 0 && (
            <div className="p-8 text-center bg-white/30 border border-dashed rounded-3xl text-sm italic text-kava-muted">
              {t("No active network items found.")}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 h-[600px] rounded-[48px] overflow-hidden border border-white/20 shadow-2xl relative bg-kava-text/5">
          <div ref={mapContainer} className="absolute inset-0" />

          {/* New Venue Popover (Only for non-readOnly Admin) */}
          {newBarLocation && !readOnly && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/10 backdrop-blur-[2px]">
              <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[40px] border border-white/40 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-start mb-6">
                  <h4 className="font-bebas text-3xl text-kava-text leading-none uppercase tracking-wide">Register New Venue</h4>
                  <button onClick={() => setNewBarLocation(null)} className="text-kava-muted/40 hover:text-rose-500 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted block mb-2">Venue Name</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newBarName}
                      onChange={(e) => setNewBarName(e.target.value)}
                      placeholder="e.g. The Golden Sip"
                      className="w-full bg-kava-text/5 border border-kava-text/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-kava-gold transition-colors"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 p-4 bg-kava-gold/5 rounded-2xl border border-kava-gold/10">
                    <MapPin size={16} className="text-kava-gold" />
                    <div className="text-[9px] text-kava-muted font-bold tracking-widest uppercase">
                      Coords: {newBarLocation.lat.toFixed(6)}, {newBarLocation.lng.toFixed(6)}
                    </div>
                  </div>

                  <button 
                    onClick={handleCreateBar}
                    disabled={!newBarName.trim()}
                    className="w-full bg-kava-gold text-white py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-kava-gold/30 hover:scale-[0.98] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    Confirm Registration
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-10">
            <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-lg flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-kava-text uppercase tracking-widest leading-none">Nakamal Open</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span className="text-[10px] font-bold text-kava-text uppercase tracking-widest leading-none">Closed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-bold text-kava-text uppercase tracking-widest leading-none">Supplier Hub</span>
              </div>
              {!readOnly && (
                <>
                  <div className="h-3 w-px bg-kava-text/10 mx-1" />
                  <div className="text-[9px] font-black text-kava-muted/60 uppercase tracking-widest">Click map to add</div>
                </>
              )}
            </div>
          </div>

          {/* Selected Kava Bar Details Overlay (Admin Mode with edits) */}
          {activeSelectedBar && (
            <div className="absolute top-6 right-6 z-10 w-80 bg-white/95 backdrop-blur-xl rounded-[40px] border-[3px] border-white shadow-2xl p-8 animate-in slide-in-from-right-4 max-h-[90%] overflow-y-auto custom-scrollbar">
               <div className="flex justify-between items-start mb-6">
                 <div className="flex-1">
                   <div className="text-[10px] font-black uppercase tracking-[0.3em] text-kava-gold mb-2">Venue Identifier</div>
                   {readOnly ? (
                     <div className="font-bebas text-3xl text-kava-text uppercase tracking-wide leading-none py-1 truncate">
                       {activeSelectedBar.name}
                     </div>
                   ) : (
                     <input 
                      value={activeSelectedBar.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        if (onUpdateBar) {
                          onUpdateBar(activeSelectedBar.id, { name: newName });
                        }
                      }}
                      className="font-bebas text-4xl text-kava-text uppercase tracking-wide leading-none w-full bg-transparent border-b-2 border-transparent hover:border-kava-gold/20 focus:border-kava-gold/50 outline-none transition-all py-1"
                     />
                   )}
                   
                   <div className="mt-4">
                    <label className="text-[8px] font-black uppercase tracking-widest text-kava-muted/40 block mb-1">Category</label>
                    {readOnly ? (
                      <span className="text-[10px] font-bold text-kava-muted uppercase tracking-widest block">
                        {activeSelectedBar.category}
                      </span>
                    ) : (
                      <input 
                        value={activeSelectedBar.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          if (onUpdateBar) {
                            onUpdateBar(activeSelectedBar.id, { category: newCat });
                          }
                        }}
                        className="text-[10px] font-bold text-kava-muted uppercase tracking-widest w-full bg-transparent border-b border-transparent hover:border-kava-gold/20 focus:border-kava-gold/50 outline-none transition-all"
                      />
                    )}
                   </div>
                 </div>
                 <button onClick={() => setSelectedNode(null)} className="p-3 bg-kava-text/5 hover:bg-rose-500 hover:text-white rounded-full transition-all">
                   <X size={20} />
                 </button>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-kava-muted opacity-40 block ml-2">Verified Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-kava-gold" size={16} />
                      <input 
                        value={activeSelectedBar.address}
                        disabled={readOnly}
                        onChange={(e) => {
                          const newAddr = e.target.value;
                          if (onUpdateBar) {
                            onUpdateBar(activeSelectedBar.id, { address: newAddr });
                          }
                        }}
                        className="w-full bg-kava-text/5 border-2 border-white/50 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-kava-text focus:outline-none focus:border-kava-gold/30 transition-all shadow-inner disabled:opacity-70"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-kava-text/5">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-kava-muted opacity-40 block mb-2 ml-2">Active Status</label>
                      <select 
                        value={activeSelectedBar.status}
                        disabled={readOnly}
                        onChange={(e) => {
                          const newStatus = e.target.value as 'open' | 'closed';
                          if (onUpdateBar) {
                            onUpdateBar(activeSelectedBar.id, { status: newStatus });
                          }
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer appearance-none outline-none border-2 transition-all ${
                          activeSelectedBar.status === 'open' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                        }`}
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col justify-end">
                      {!readOnly && onDeleteBar && (
                        <button 
                          onClick={() => {
                            onDeleteBar(activeSelectedBar.id);
                            setSelectedNode(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between px-2">
                        <p className="text-[9px] font-black text-kava-muted/40 uppercase tracking-[0.2em]">Geo-spatial Node</p>
                        <div className="p-1 px-2 border border-kava-gold/20 rounded-md text-[7px] font-black text-kava-gold animate-pulse">DRAGGABLE</div>
                      </div>
                      <ManualCoordEditor 
                        bar={activeSelectedBar} 
                        onSave={(updates) => {
                          if (onUpdateBar) {
                            onUpdateBar(activeSelectedBar.id, updates);
                          }
                        }} 
                      />
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Selected Supplier Details Overlay (Read-Only cargo node cards) */}
          {activeSelectedSupplier && (
            <div className="absolute top-6 right-6 z-10 w-80 bg-neutral-950/95 backdrop-blur-xl rounded-[40px] border-[3px] border-emerald-500/20 shadow-2xl p-8 animate-in slide-in-from-right-4 max-h-[90%] overflow-y-auto custom-scrollbar text-white">
              <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400 block mb-1">
                    VERIFIED SUPPLIER NODE
                  </span>
                  <p className="font-bebas text-3xl text-white uppercase tracking-wide leading-none">
                    {activeSelectedSupplier.name}
                  </p>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                    🎯 {activeSelectedSupplier.supplierTitle || "Cooperative Wholesaler"}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  className="p-2 bg-white/5 hover:bg-rose-500 hover:text-white rounded-full transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5 text-left text-xs">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 block mb-1.5">
                    Warehouse Address
                  </span>
                  <p className="font-bold text-white leading-snug">
                    📍 {activeSelectedSupplier.location?.address || "Port Vila Logistics Hub"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                      Phone Contact
                    </span>
                    <p className="font-mono text-[10px] text-neutral-300 font-bold">
                       ☎️ {activeSelectedSupplier.phone || "+678 224430"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 block mb-1">
                      Web Terminal
                    </span>
                    <p className="font-bold text-emerald-400 text-[10px] truncate">
                      🌐 {activeSelectedSupplier.website || "islandcoop.vu"}
                    </p>
                  </div>
                </div>

                {activeSelectedSupplier.certifications && activeSelectedSupplier.certifications.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 block mb-1.5">
                      Verified Credentials
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSelectedSupplier.certifications.map((cert) => (
                        <span key={cert} className="text-[8px] font-black tracking-widest uppercase bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                          ✓ {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-[9px] uppercase font-black tracking-widest text-neutral-400">
                      Pipeline Active
                    </span>
                  </div>
                  <span className="text-[8px] font-black tracking-widest uppercase bg-neutral-800 text-neutral-300 px-2.5 py-1 rounded-full">
                    No. {activeSelectedSupplier.id}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualCoordEditor({ bar, onSave }: { bar: Bar, onSave: (updates: Partial<Bar>) => void }) {
  const [lat, setLat] = useState(bar.lat?.toString() || '');
  const [lng, setLng] = useState(bar.lng?.toString() || '');

  useEffect(() => {
    setLat(bar.lat?.toString() || '');
    setLng(bar.lng?.toString() || '');
  }, [bar.lat, bar.lng]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-kava-muted/40 mb-1 block">Latitude</label>
          <input 
            type="number" 
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="w-full bg-kava-text/5 border border-kava-text/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-kava-gold transition-colors"
          />
        </div>
        <div>
          <label className="text-[8px] font-black uppercase tracking-widest text-kava-muted/40 mb-1 block">Longitude</label>
          <input 
            type="number" 
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full bg-kava-text/5 border border-kava-text/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-kava-gold transition-colors"
          />
        </div>
      </div>
      <button 
        onClick={() => onSave({ lat: parseFloat(lat), lng: parseFloat(lng) })}
        className="w-full bg-kava-gold text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-kava-gold/20 hover:scale-[0.98] transition-all"
      >
        Save Position
      </button>
    </div>
  );
}

interface MarkerComponentProps {
  type: 'bar' | 'supplier';
  status?: 'open' | 'closed';
  isActive: boolean;
}

function MarkerComponent({ type, status, isActive }: MarkerComponentProps) {
  const isBar = type === 'bar';
  const color = isBar 
    ? (status === 'open' ? '#10b981' : '#f43f5e') 
    : '#f59e0b'; // Amber Gold for suppliers

  return (
    <motion.div
      initial={{ scale: 0, y: 15 }}
      animate={
        isActive 
          ? { 
              scale: [1, 1.3, 1.15, 1.2],
              y: [0, -10, 2, 0],
            } 
          : { 
              scale: 1, 
              y: 0 
            }
      }
      transition={{
        initial: { type: 'spring', stiffness: 200, damping: 15 },
        animate: isActive 
          ? {
              duration: 0.6,
              ease: "easeInOut",
              times: [0, 0.4, 0.7, 1]
            }
          : { type: 'spring', stiffness: 150, damping: 12 }
      }}
      style={{
        background: color,
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: `2px solid ${isActive ? '#c5a880' : 'white'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isActive ? '0 8px 18px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {isBar ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )}
    </motion.div>
  );
}
