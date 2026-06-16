import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, AlertTriangle, Activity, MapPin, Car, Cpu, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TRAFFIC_NODES } from '../../data/constants';
import type { Drone, Incident } from '../../types';
import { statusColor } from '../../utils';

interface DashboardProps {
  drones: Drone[];
  incidents: Incident[];
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
      className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4 relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {trend && (
          <TrendIcon className={`w-3.5 h-3.5 ${trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-gray-500'}`} />
        )}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>
        {animated.toLocaleString()}{unit}
      </div>
      <div className="text-[10px] text-gray-500 mt-1 font-mono tracking-wider uppercase">{label}</div>
    </motion.div>
  );
}

// Generate time-series data
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

export default function Dashboard({ drones, incidents }: DashboardProps) {
  const totalVehicles = TRAFFIC_NODES.reduce((s, n) => s + n.vehicleCount, 0);
  const activeIncidents = incidents.filter(i => i.status === 'active').length;
  const congestionZones = TRAFFIC_NODES.filter(n => n.status === 'heavy' || n.status === 'critical').length;
  const flowScore = Math.round(100 - TRAFFIC_NODES.reduce((s, n) => s + n.density, 0) / TRAFFIC_NODES.length);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-white">Operations Dashboard</h1>
          <p className="text-[11px] text-gray-500 font-mono">Kozhikode Traffic Intelligence · Live Overview</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-[10px] font-mono text-green-400">ALL SYSTEMS NOMINAL</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Active Drones" value={drones.filter(d => d.status !== 'offline').length} icon={Plane} color="#3B82F6" trend="flat" />
        <KPICard label="Active Incidents" value={activeIncidents + incidents.length} icon={AlertTriangle} color="#EF4444" trend="up" />
        <KPICard label="Flow Score" value={flowScore} unit="%" icon={Activity} color="#22C55E" trend="down" />
        <KPICard label="Congestion Zones" value={congestionZones} icon={MapPin} color="#F97316" trend="up" />
        <KPICard label="Vehicles Detected" value={totalVehicles} icon={Car} color="#F59E0B" trend="up" />
        <KPICard label="AI Accuracy" value={96} unit="%" icon={Cpu} color="#A855F7" trend="flat" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white">Vehicle Flow</div>
              <div className="text-[10px] text-gray-500 font-mono">24-hour count</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={{ background: '#151820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="vehicles" stroke="#F97316" fill="url(#vGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white">Traffic Flow Score</div>
              <div className="text-[10px] text-gray-500 font-mono">Efficiency % over 24h</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} domain={[40, 100]} />
              <Tooltip contentStyle={{ background: '#151820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="flow" stroke="#22C55E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Node status table */}
      <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <span className="text-sm font-semibold text-white">Node Status Overview</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Node', 'Status', 'Density', 'Vehicles', 'Speed', 'Incidents'].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-[9px] font-mono text-gray-500 tracking-widest uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRAFFIC_NODES.map((node, i) => (
                <motion.tr key={node.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-xs font-medium text-white">{node.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(node.status) }} />
                      <span className="text-[10px] font-mono capitalize" style={{ color: statusColor(node.status) }}>{node.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-white/[0.06] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${node.density}%`, backgroundColor: statusColor(node.status) }} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{node.density}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-gray-300">{node.vehicleCount.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-[10px] font-mono text-gray-300">{node.avgSpeed} km/h</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-mono font-bold ${node.incidentCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
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
  );
}
