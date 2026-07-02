import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, AlertTriangle, Activity, MapPin, Car, Cpu, TrendingUp, TrendingDown, Minus, Sparkles, Radio, Video, Zap } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Drone, Incident, TrafficNode } from '../../types';
import { statusColor } from '../../utils';
import { getAffectedLinks, linkToRoadMap } from '../../hooks/useAppStore';
import { ROAD_LINKS_METADATA } from '../../data/constants';

interface DashboardProps {
  drones: Drone[];
  incidents: Incident[];
  nodes: TrafficNode[];
  telemetryLogs?: any[];
  predictionLogs?: any[];
  playbackIndex?: number;
  isAutoDispatch?: boolean;
  onDispatchDrone?: (droneId: string, nodeId: string) => void;
  linkStatuses: Record<string, {
    status: 'free' | 'moderate' | 'heavy' | 'critical';
    density: number;
    speed: number;
    volume: number;
    travelTime: number;
    queueLength?: number;
  }>;
  // What-If Simulation Sandbox states
  isWhatIfActive?: boolean;
  setIsWhatIfActive?: (val: boolean) => void;
  whatIfLanesBlocked?: number;
  setWhatIfLanesBlocked?: (val: number) => void;
  whatIfEventIntensity?: number;
  setWhatIfEventIntensity?: (val: number) => void;
  whatIfRetimingSeconds?: number;
  setWhatIfRetimingSeconds?: (val: number) => void;
  isRetimingApplied?: boolean;
  setIsRetimingApplied?: (val: boolean) => void;
}

function useAnimatedValue(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function KPICard({ label, value, unit, icon: Icon, color, trend }: {
  label: string; value: number; unit?: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string; trend?: 'up' | 'down' | 'flat';
}) {
  const animated = useAnimatedValue(value);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-5 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5.5 h-5.5" style={{ color }} />
        </div>
        {trend && (
          <TrendIcon className={`w-4 h-4 ${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-500'}`} />
        )}
      </div>
      <div className="text-3xl font-extrabold font-mono" style={{ color }}>
        {animated.toLocaleString()}{unit}
      </div>
      <div className="text-xs text-gray-400 mt-1.5 font-sans font-semibold tracking-wider uppercase">{label}</div>
    </motion.div>
  );
}

// Generate time-series fallback data
function genData() {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => ({
    time: new Date(now - (23 - i) * 3600000).getHours() + ':00',
    vehicles: 800 + Math.floor(Math.random() * 1200),
    incidents: Math.floor(Math.random() * 5),
    flow: 60 + Math.floor(Math.random() * 35),
  }));
}

const CHART_DATA = genData();

const junctionMap: Record<string, string> = {
  'Mavoor Road Junction': 'mavoor',
  'Bus Stand Junction': 'bus_stand',
  'Arayidathupalam Junction': 'arayidathupalam',
  'Mananchira Junction': 'mananchira',
  'Stadium Junction': 'stadium',
  'Midtown Junction': 'midtown',
  'Palayam Junction': 'palayam',
  'Poonthanam Junction': 'poonthanam',
  'East Bypass Junction': 'east_bypass',
  // Backwards compatibility for old names
  'KSRTC Jn': 'bus_stand',
  'New Bus Stand': 'bus_stand',
  'BMH Hospital Jn': 'arayidathupalam',
  'GTech Junction': 'mavoor',
  'Mananchira Jn': 'mananchira',
  'Puthiyara Junction': 'midtown',
  'Palayam Jn': 'palayam',
  'Chinthavalappu Jn': 'poonthanam',
  'Kalluthankadavu Jn': 'east_bypass',
};

export default function Dashboard({
  drones,
  incidents,
  nodes,
  telemetryLogs,
  predictionLogs,
  playbackIndex,
  isAutoDispatch,
  onDispatchDrone,
  linkStatuses,
  // Sandbox state inputs
  isWhatIfActive = false,
  setIsWhatIfActive = () => {},
  whatIfLanesBlocked = 0,
  setWhatIfLanesBlocked = () => {},
  whatIfEventIntensity = 0,
  setWhatIfEventIntensity = () => {},
  whatIfRetimingSeconds = 18,
  setWhatIfRetimingSeconds = () => {},
  isRetimingApplied = false,
  setIsRetimingApplied = () => {},
}: DashboardProps) {
  const totalVehicles = nodes.reduce((s, n) => s + n.vehicleCount, 0);
  const activeIncidents = incidents.filter(i => i.status === 'active' || i.status === 'pending').length;
  const congestedLinksCount = Object.values(linkStatuses || {}).filter(
    (l: any) => l.status === 'critical' || l.status === 'heavy'
  ).length;
  const flowScore = Math.round(100 - nodes.reduce((s, n) => s + n.density, 0) / nodes.length);

  // Map dynamic CSV telemetry logs to chart data
  const liveChartData = telemetryLogs && telemetryLogs.length > 0 && playbackIndex !== undefined
    ? telemetryLogs.slice(Math.max(0, playbackIndex - 15), playbackIndex + 1).map((log, index) => {
        const timePart = log.timestamp.split(' ')[1] || log.timestamp;
        const flowVal = Math.round(100 - log.densityPercent);
        const seed = Math.sin(index + (playbackIndex || 0)) * 1.5;
        const incidentCount = Math.max(0, Math.round(activeIncidents + seed));

        return {
          time: timePart.slice(0, 5),
          vehicles: Math.round(log.densityPercent * 14.5),
          flow: flowVal,
          incidents: incidentCount,
        };
      })
    : CHART_DATA;

  // 20-minute future predictions lookup (lookahead index in logs)
  const lookaheadIndex = playbackIndex !== undefined && predictionLogs 
    ? Math.min(predictionLogs.length - 1, playbackIndex + 10) 
    : 0;

  const futureLog = predictionLogs && predictionLogs[lookaheadIndex];
  const predictedMavoorDensity = futureLog ? Math.round(futureLog.densityPercent) : 56;
  const predictedFlow = 100 - predictedMavoorDensity;
  const predictedStatus = predictedMavoorDensity >= 85 ? 'critical' :
                          predictedMavoorDensity >= 65 ? 'heavy' :
                          predictedMavoorDensity >= 40 ? 'moderate' : 'free';

  // Capture active incident junction
  const activeIncident = incidents.find(i => i.status === 'active' || i.status === 'pending');

  // Trigger bottleneck alert popup
  const isBottleneckPredicted = predictedMavoorDensity > 65 || activeIncident;
  
  const alertData = isBottleneckPredicted ? {
    type: activeIncident ? `Surge: ${activeIncident.type}` : 'Predicted Bottleneck Alert',
    location: activeIncident ? activeIncident.location : 'Mavoor Road Junction',
    severity: activeIncident ? activeIncident.priority : (predictedMavoorDensity > 80 ? 'critical' : 'high'),
    measures: activeIncident 
      ? `Deploy nearest UAV to ${activeIncident.nearestJunction || 'site'}, deploy manual overridden signals, divert incoming traffic.` 
      : 'Divert heavy vehicles to East Bypass, optimize cycle time to +15s green phase on Mavoor corridor.'
  } : null;

  // Locate active drone on-site at the incident junction
  const activeIncidentJunctionName = activeIncident?.nearestJunction || '';
  const activeIncidentJunctionNodeId = junctionMap[activeIncidentJunctionName] || '';

  const activeDroneOnSite = drones.find(d => {
    if (d.status !== 'streaming') return false;
    const loc = d.location.toLowerCase();
    const incidentJunc = activeIncidentJunctionName.toLowerCase();
    const nodeJunc = activeIncidentJunctionNodeId.toLowerCase();
    return loc.includes(incidentJunc) || (nodeJunc && loc.includes(nodeJunc));
  });

  // Load JPEG snapshot frame from GCS bucket corresponding to active drone's position
  let snapshotImageSrc = '';
  if (activeDroneOnSite) {
    const loc = activeDroneOnSite.location.toLowerCase();
    if (loc.includes('stadium')) snapshotImageSrc = '/drone_stadium.png';
    else if (loc.includes('bus stand') || loc.includes('bus_stand')) snapshotImageSrc = '/drone_bus_stand.png';
    else if (loc.includes('palayam')) snapshotImageSrc = '/drone_palayam.png';
    else if (loc.includes('mananchira')) snapshotImageSrc = '/drone_mananchira.png';
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Operations Dashboard</h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">Kozhikode NH-66 & Bypass Operations · Live Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-xs font-mono text-green-400 font-bold">ALL SYSTEMS NOMINAL</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="Active Drones" value={drones.filter(d => d.status !== 'offline').length} icon={Plane} color="#3B82F6" trend="flat" />
        <KPICard label="Active Incidents" value={activeIncidents} icon={AlertTriangle} color="#EF4444" trend="up" />
        <KPICard label="Congested Links" value={congestedLinksCount} icon={Activity} color="#F97316" trend="up" />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Real-Time Charts & Status Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Affected Links Due to Congestion */}
            <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-5 flex flex-col min-h-[260px]">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-2">
                <div>
                  <div className="text-base font-bold text-white">Affected Links Due to Congestion</div>
                  <div className="text-xs text-gray-400 font-sans mt-0.5">Adjacent roads impacted by current bottlenecks</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[180px]">
                {(() => {
                  const activeBottlenecks = Object.entries(linkStatuses || {}).filter(
                    ([_, info]: any) => info.status === 'critical' || info.status === 'heavy'
                  );

                  if (activeBottlenecks.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center py-6">
                        <span className="text-xs font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded">
                          ✓ ALL CORRIDORS FREE FLOWING
                        </span>
                        <p className="text-[11px] text-gray-500 font-sans mt-2">No active bottlenecks or congestion propagation detected.</p>
                      </div>
                    );
                  }

                  return activeBottlenecks.map(([linkKey, info]: any) => {
                    const connectionToLinks: Record<string, [string, string]> = {
                      'mavoor-bus_stand': ['L23', 'L11'],
                      'bus_stand-arayidathupalam': ['L19', 'L13'],
                      'arayidathupalam-midtown': ['L1', 'L18'],
                      'midtown-east_bypass': ['L2', 'L24'],
                      'east_bypass-poonthanam': ['L20', 'L7'],
                      'poonthanam-palayam': ['L21', 'L9'],
                      'palayam-mananchira': ['L22', 'L8'],
                      'mavoor-mananchira': ['L26', 'L14'],
                      'bus_stand-stadium': ['L6', 'L17'],
                      'stadium-midtown': ['L3', 'L16'],
                      'stadium-poonthanam': ['L4', 'L10'],
                      'stadium-mananchira': ['L5', 'L15'],
                    };
                    const linkIds = connectionToLinks[linkKey] || [];
                    const roadName = ROAD_LINKS_METADATA[linkKey]?.name || linkKey;

                    return (
                      <div key={linkKey} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg space-y-2.5">
                        {/* Cause section */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[8.5px] font-mono text-red-400 font-bold uppercase tracking-wider block">CONGESTION CAUSE LINK</span>
                            <span className="text-xs font-bold text-white truncate block">
                              {roadName} <span className="text-[9px] font-mono text-orange-400 font-semibold bg-white/[0.05] px-1 rounded ml-1">({linkIds.join(', ')})</span>
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border bg-red-500/10 text-red-400 border-red-500/30 shrink-0">
                            {info.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Affected links section */}
                        <div className="bg-red-500/[0.015] border border-red-500/10 p-2 rounded">
                          <span className="text-[8px] font-mono text-gray-500 font-bold uppercase tracking-wider block mb-1">AFFECTED ADJACENT ROADS</span>
                          <div className="text-[10px] text-gray-300 font-sans leading-relaxed">
                            {(() => {
                              const details = linkIds.map((id: string) => {
                                const affIds = getAffectedLinks(id);
                                const affRoadNames = affIds.map(affId => `${linkToRoadMap[affId]?.roadName || affId} (${affId})`);
                                return Array.from(new Set(affRoadNames));
                              }).flat();
                              const uniqueDetails = Array.from(new Set(details));
                              return uniqueDetails.join(', ') || 'None adjacent';
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Overall Network Parameters */}
            <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-5 min-h-[260px] flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-2">
                <div>
                  <div className="text-base font-bold text-white">Overall Network Parameters</div>
                  <div className="text-xs text-gray-400 font-sans mt-0.5">Aggregated metrics across Kozhikode NH-66 & bypass network</div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3.5 text-xs">
                {[
                  { label: 'Average Speed', value: `${Math.round(nodes.reduce((s, n) => s + n.avgSpeed, 0) / nodes.length)} km/h`, color: '#22C55E' },
                  { label: 'Average Density', value: `${Math.round(nodes.reduce((s, n) => s + n.density, 0) / nodes.length)}%`, color: '#F97316' },
                  { label: 'Network Congestion Index', value: `${Object.values(linkStatuses || {}).filter((l: any) => l.status === 'critical' || l.status === 'heavy').length} / ${Object.keys(linkStatuses || {}).length} links`, color: '#EF4444' },
                  { label: 'Active Link Count', value: `${Object.keys(linkStatuses || {}).length} monitored links`, color: '#3B82F6' },
                ].map(item => (
                  <div key={item.label} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-sans tracking-wide uppercase font-semibold leading-normal">{item.label}</span>
                    <span className="text-lg font-bold font-mono mt-1.5" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Node Status Table */}
          <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <span className="text-base font-bold text-white">Node Status Overview</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                    {['Node', 'Status', 'Density', 'Speed', 'Incidents'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-mono text-gray-400 tracking-wider uppercase font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node, i) => (
                    <motion.tr key={node.id}
                      layout
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">
                        <div className="flex items-center gap-2">
                          {['stadium', 'midtown', 'bus_stand', 'mavoor'].includes(node.id) && (
                            <span className="text-[10px] bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">🚦 Signal</span>
                          )}
                          <span>{node.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor(node.status) }} />
                          <span className="text-xs font-mono capitalize font-bold" style={{ color: statusColor(node.status) }}>{node.status}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white/[0.06] rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${node.density}%`, backgroundColor: statusColor(node.status) }} />
                          </div>
                          <span className="text-xs font-mono text-gray-300">{node.density}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-gray-200">{node.avgSpeed} km/h</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-mono font-bold ${node.incidentCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {node.incidentCount}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: UAV Snapshot Feed & 20-minute Future Prediction Panel */}
        <div className="space-y-6">
          {/* Live UAV Snapshot Feed */}
          <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl overflow-hidden flex flex-col">
            <div className="bg-white/[0.03] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" /> LIVE UAV FEED
              </span>
              {activeDroneOnSite ? (
                <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full animate-pulse font-bold">
                  VERIFIED STREAMING
                </span>
              ) : (
                <span className="text-[10px] font-mono text-gray-400 bg-white/[0.05] px-2 py-0.5 rounded-full font-bold">
                  SCANNING FOR TRANSMISSIONS
                </span>
              )}
            </div>

            <div className="h-[190px] bg-black relative flex items-center justify-center overflow-hidden group">
              {snapshotImageSrc ? (
                <>
                  <img src={snapshotImageSrc} alt="UAV Snapshot" className="w-full h-full object-cover" />
                  {/* Scanline / HUD overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
                  <div className="absolute top-2 left-2 font-mono text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                    <Radio className="w-2.5 h-2.5 text-cyan-400 animate-ping" />
                    UAV TELEMETRY: {activeDroneOnSite?.name.toUpperCase()} (ALT: {activeDroneOnSite?.altitude}m)
                  </div>
                </>
              ) : (
                <div className="text-center p-5 space-y-3 relative z-10 w-full h-full flex flex-col justify-center bg-zinc-950">
                  <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
                  {/* Dynamic CRT static lines */}
                  <div className="w-12 h-12 border border-dashed border-white/[0.1] rounded-full flex items-center justify-center mx-auto text-gray-500">
                    <Plane className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-gray-400 uppercase font-bold">No UAV Feed Connected</div>
                    <p className="text-[10px] text-gray-500 font-sans mt-1">Dispatch a UAV to active incident junctions for verification.</p>
                  </div>
                  {activeIncident && onDispatchDrone && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetNodeId = junctionMap[activeIncidentJunctionName] || 'stadium';
                        const closestDrone = drones.find(d => d.status !== 'offline');
                        if (closestDrone) onDispatchDrone(closestDrone.id, targetNodeId);
                      }}
                      className="px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-mono uppercase font-bold mx-auto transition-all"
                    >
                      Dispatch nearest UAV
                    </button>
                  )}
                </div>
              )}
          </div>
          {/* Cloud Storage Pipeline Monitor */}
          <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-5 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-grid-pattern" />
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06] mb-3">
              <Radio className="w-4 h-4 text-green-400 animate-pulse" />
              <div>
                <span className="text-sm font-bold text-white">Excel Storage Pipeline Monitor</span>
                <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">Real-time Excel/JSON NOC Sync Status</p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              {/* Row 1: GCS Input Bucket */}
              <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded border border-white/[0.04]">
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Excel Parameter Bucket</span>
                  <span className="text-[9px] text-gray-500">I1a.xlsx / I2.xlsx</span>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-bold flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                    CONNECTED
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Latency: 112ms</span>
                </div>
              </div>

              {/* Row 2: GCS Output Bucket */}
              <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded border border-white/[0.04]">
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Excel Recommendation Bucket</span>
                  <span className="text-[9px] text-gray-500">O1.xlsx</span>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-bold flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                    CONNECTED
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Latency: 98ms</span>
                </div>
              </div>

              {/* Row 3: Excel Integration Feed */}
              <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded border border-white/[0.04]">
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Excel Integration Feed</span>
                  <span className="text-[9px] text-gray-500">public/*.json</span>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-bold flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    ONLINE
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Caching: Local Storage Cache</span>
                </div>
              </div>

              {/* Row 4: Edge Update Heartbeat */}
              <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded border border-white/[0.04]">
                <div className="flex flex-col">
                  <span className="text-white font-semibold">Edge Update Interval</span>
                  <span className="text-[9px] text-gray-500">NH-66 Node Telemetry Feed</span>
                </div>
                <div className="text-right">
                  <span className="text-cyan-400 font-bold block">5.0s HEARTBEAT</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Last update: 2s ago</span>
                </div>
              </div>
            </div>
          </div>        </div>
        </div>
      </div>
    </div>
  );
}
