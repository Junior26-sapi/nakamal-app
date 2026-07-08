import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RevenueStats } from '../types';
import { TrendingUp, BarChart3, HelpCircle, Activity, Award, ArrowUpRight, ShieldCheck, PieChart } from 'lucide-react';

interface RevenueVisualizerProps {
  stats: RevenueStats;
}

export default function RevenueVisualizer({ stats }: RevenueVisualizerProps) {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'users' | 'cycles'>('revenue');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Set default values if not provided by backend
  const trends = stats.trends || [
    { month: 'Jan', revenue: 420, activeUsers: 20, billingCycles: 15 },
    { month: 'Feb', revenue: 580, activeUsers: 24, billingCycles: 18 },
    { month: 'Mar', revenue: 790, activeUsers: 29, billingCycles: 22 },
    { month: 'Apr', revenue: 980, activeUsers: 34, billingCycles: 28 },
    { month: 'May', revenue: 1210, activeUsers: 38, billingCycles: 33 },
    { month: 'Jun', revenue: 1450, activeUsers: 42, billingCycles: 40 },
  ];

  const plansBreakdown = stats.plansBreakdown || [
    { name: 'Starter', count: 18, revenue: 522 },
    { name: 'Pro VIP', count: 18, revenue: 1602 },
    { name: 'Enterprise', count: 6, revenue: 3306 },
  ];

  // SVG dimensions for Line Chart
  const svgWidth = 600;
  const svgHeight = 240;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Find boundaries
  const getMetricValue = (item: typeof trends[0], metric: typeof activeMetric) => {
    if (metric === 'revenue') return item.revenue;
    if (metric === 'users') return item.activeUsers;
    return item.billingCycles;
  };

  const values = trends.map(t => getMetricValue(t, activeMetric));
  const maxValue = Math.max(...values, 100) * 1.15; // padding for visual headroom
  const minValue = 0;

  // Calculate coordinates
  const getCoordinates = () => {
    return trends.map((item, index) => {
      const x = paddingX + (index / (trends.length - 1)) * chartWidth;
      const yStr = getMetricValue(item, activeMetric);
      const ratio = (yStr - minValue) / (maxValue - minValue);
      const y = svgHeight - paddingY - ratio * chartHeight;
      return { x, y, ...item };
    });
  };

  const coords = getCoordinates();

  // Create path command
  const linePath = coords.reduce((acc, coord, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${coord.x} ${coord.y} `;
  }, '');

  // Closed path for filled area under the line
  const areaPath = linePath + `L ${coords[coords.length - 1].x} ${svgHeight - paddingY} L ${coords[0].x} ${svgHeight - paddingY} Z`;

  // Bar Chart parameters
  const barMax = Math.max(...plansBreakdown.map(p => p.revenue), 100);

  // Trigger sound effect on hover if mute is off
  const handlePointHover = (index: number | null) => {
    setHoveredIndex(index);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Visual Analytics Hero Chart - Spans 2 columns */}
      <div className="lg:col-span-2 kava-card p-8 flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 rounded-full">D3 High-Precision</span>
              <span className="p-1 px-2 text-[8px] font-black uppercase tracking-widest text-kava-gold bg-kava-gold/10 rounded-full animate-pulse">Live Ledger Sync</span>
            </div>
            <h3 className="font-bebas text-4xl text-kava-text tracking-wider uppercase">Revenue Operations Trend</h3>
            <p className="text-[10px] text-kava-muted/60 font-medium uppercase tracking-widest">
              Reconciled billing cycles and automated subscription pipeline projections
            </p>
          </div>

          {/* Metric Selector Toggles */}
          <div className="flex bg-neutral-100 dark:bg-white/5 rounded-2xl p-1 border border-neutral-200/50 dark:border-white/5 shadow-sm">
            {[
              { id: 'revenue', label: 'Revenue (VUV)', color: 'text-emerald-500' },
              { id: 'users', label: 'Active Users', color: 'text-sky-500' },
              { id: 'cycles', label: 'Cycles Run', color: 'text-purple-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMetric(tab.id as any);
                  setHoveredIndex(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  activeMetric === tab.id
                    ? 'bg-white dark:bg-neutral-800 text-kava-text dark:text-neutral-200 shadow-sm font-black scale-[1.02]'
                    : 'text-kava-muted hover:text-kava-text dark:hover:text-neutral-200'
                }`}
              >
                {tab.id === 'revenue' && '$ '}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom SVG Graphical Canvas */}
        <div className="relative w-full overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/10 rounded-[32px] border border-neutral-100 dark:border-white/5 p-4 sm:p-6 select-none flex flex-col justify-center min-h-[260px] cursor-crosshair">
          {/* Chart Core */}
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d4af37" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>

              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>

              <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
              const yVal = svgHeight - paddingY - ratio * chartHeight;
              const numericalVal = minValue + ratio * (maxValue - minValue);
              return (
                <g key={gridIdx} className="opacity-40">
                  <line
                    x1={paddingX}
                    y1={yVal}
                    x2={svgWidth - paddingX}
                    y2={yVal}
                    stroke="currentColor"
                    className="text-neutral-200 dark:text-neutral-800"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                  <text
                    x={paddingX - 10}
                    y={yVal + 3}
                    textAnchor="end"
                    className="fill-neutral-400 dark:fill-neutral-500 font-mono text-[9px] font-medium"
                  >
                    {activeMetric === 'revenue' 
                      ? `$${Math.round(numericalVal)}` 
                      : Math.round(numericalVal)}
                  </text>
                </g>
              );
            })}

            {/* Path - Area Fill */}
            <motion.path
              key={`${activeMetric}-area`}
              d={areaPath}
              fill="url(#areaGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0, delay: 0.6, ease: 'easeOut' }}
            />

            {/* Path - Trend Line */}
            <motion.path
              key={`${activeMetric}-line`}
              d={linePath}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-effect)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />

            {/* X-Axis Month Indicators */}
            {coords.map((item, index) => (
              <text
                key={index}
                x={item.x}
                y={svgHeight - paddingY + 16}
                textAnchor="middle"
                className="fill-neutral-500 dark:fill-neutral-400 font-mono text-[9px] font-bold uppercase tracking-wider"
              >
                {item.month}
              </text>
            ))}

            {/* Coordinate Circle Intersections */}
            {coords.map((coord, index) => {
              const worksValue = getMetricValue(coord, activeMetric);
              const isSelected = hoveredIndex === index;
              return (
                <g key={index}>
                  {/* Subtle hover pulse layer */}
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r={isSelected ? 14 : 0}
                    className="fill-emerald-500/10 stroke-emerald-500/10 transition-all duration-200"
                  />

                  {/* Intersect point */}
                  <motion.circle
                    key={`${activeMetric}-point-${index}`}
                    cx={coord.x}
                    cy={coord.y}
                    initial={{ r: 0, opacity: 0 }}
                    animate={{ r: isSelected ? 6 : 4, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 18,
                      delay: index * 0.08
                    }}
                    onMouseEnter={() => handlePointHover(index)}
                    className={`transition-all duration-150 cursor-pointer ${
                      isSelected 
                        ? 'fill-white stroke-emerald-500 stroke-2 shadow-md' 
                        : 'fill-kava-gold dark:fill-neutral-700 stroke-white dark:stroke-neutral-800 stroke-[1.5]'
                    }`}
                  />
                </g>
              );
            })}

            {/* Invisible collision rects for perfect mobile and desktop tracking on mouseover */}
            {coords.map((coord, index) => {
              const colWidth = chartWidth / (trends.length - 1);
              const colX = coord.x - colWidth / 2;
              return (
                <rect
                  key={index}
                  x={colX}
                  y={paddingY}
                  width={colWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => handlePointHover(index)}
                  onMouseLeave={() => handlePointHover(null)}
                />
              );
            })}
          </svg>

          {/* Interactive Absolute Floating Tooltip */}
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute top-2 right-2 bg-neutral-900 border border-white/20 text-white p-4 rounded-2xl shadow-xl space-y-1.5 z-20 min-w-[140px]"
            >
              <div className="flex justify-between items-center text-[9px] font-black uppercase text-kava-gold tracking-widest border-b border-white/10 pb-1">
                <span>{trends[hoveredIndex].month} Telemetry</span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-400 font-medium">Revenue:</span>
                  <span className="text-white font-black text-right">${trends[hoveredIndex].revenue}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-400 font-medium">Managers:</span>
                  <span className="text-white font-bold text-right">{trends[hoveredIndex].activeUsers}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-neutral-400 font-medium">Cycles Run:</span>
                  <span className="text-white font-medium text-right">{trends[hoveredIndex].billingCycles} cycles</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Prompt banner if not hovering */}
          {hoveredIndex === null && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none opacity-60">
              <Activity size={10} className="text-kava-muted animate-pulse" />
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-kava-muted">Hover graph coordinates for detailed telemetry</span>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Breakdown - 1 Column */}
      <div className="kava-card p-8 flex flex-col justify-between space-y-6">
        <div className="space-y-1">
          <span className="p-1 px-2 text-[8px] font-black uppercase tracking-widest text-kava-text dark:text-neutral-300 bg-neutral-100 dark:bg-white/5 rounded-full">Stream Volume</span>
          <h3 className="font-bebas text-4xl text-kava-text tracking-wider uppercase">Tiers Allocation</h3>
          <p className="text-[10px] text-kava-muted/60 font-medium uppercase tracking-widest">
            Distribution of revenue based on subscription tiers
          </p>
        </div>

        {/* High visual bar segments */}
        <div className="space-y-4 py-2">
          {plansBreakdown.map((plan, index) => {
            const percentage = Math.round((plan.revenue / barMax) * 100);
            const isHovered = hoveredBarIndex === index;
            return (
              <div 
                key={plan.name} 
                className="space-y-1.5 group select-none cursor-pointer"
                onMouseEnter={() => setHoveredBarIndex(index)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                <div className="flex justify-between items-end text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full transition-all ${
                      index === 0 ? 'bg-amber-400' : index === 1 ? 'bg-emerald-500' : 'bg-blue-500'
                    } ${isHovered ? 'scale-125 shadow-sm' : ''}`} />
                    <span className="font-bold text-kava-text text-xs">{plan.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-kava-muted">
                    {plan.count} Accounts • <strong className="text-kava-text">${plan.revenue}</strong>
                  </span>
                </div>

                <div className="h-4 bg-neutral-100 dark:bg-white/5 rounded-full overflow-hidden border border-neutral-200/20 dark:border-white/5 relative flex items-center">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full transition-all relative ${
                      index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
                      index === 1 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 
                      'bg-gradient-to-r from-blue-400 to-blue-500'
                    } ${isHovered ? 'brightness-110 shadow-lg' : ''}`}
                  >
                    {percentage > 25 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white uppercase tracking-wider">
                        {percentage}%
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aggregate Breakdown Stat block */}
        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest leading-none block mb-0.5">Yield Leader</span>
              <span className="text-xs font-bold text-kava-text uppercase leading-none">Enterprise Accounts</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Yield contribution</span>
            <span className="text-sm font-black text-kava-text leading-none mt-1">60.8% of total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
