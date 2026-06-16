import { motion } from 'framer-motion';
import { Brain, Cpu, Zap, Activity } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend
} from 'recharts';

const VEHICLE_DATA = [
  { name: 'Cars', value: 1523, color: '#F97316' },
  { name: 'Bikes', value: 1844, color: '#3B82F6' },
  { name: 'Buses', value: 72, color: '#A855F7' },
  { name: 'Trucks', value: 43, color: '#EF4444' },
];

const HOURLY = Array.from({ length: 12 }, (_, i) => ({
  hour: `${(i * 2).toString().padStart(2, '0')}:00`,
  cars: 100 + Math.floor(Math.random() * 400),
  bikes: 150 + Math.floor(Math.random() * 500),
  buses: 5 + Math.floor(Math.random() * 20),
}));

const ACCURACY = [{ name: 'Congestion', value: 96.2, fill: '#F97316' },
  { name: 'Incidents', value: 91.4, fill: '#EF4444' },
  { name: 'Flow', value: 94.8, fill: '#22C55E' },
  { name: 'Speed', value: 88.5, fill: '#3B82F6' }];

export default function AIAnalytics() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">AI Analytics</h1>
          <p className="text-[11px] text-gray-500 font-mono">Spatio-Temporal Graph Neural Network · Real-Time Inference</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Model', value: 'ST-GNN v3.2', color: 'text-purple-400' },
            { label: 'Inference', value: '0.18s', color: 'text-green-400' },
            { label: 'Accuracy', value: '96.2%', color: 'text-orange-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0F1117] border border-white/[0.08] rounded-lg px-3 py-1.5 text-right">
              <div className="text-[9px] text-gray-500 font-mono">{label}</div>
              <div className={`text-xs font-mono font-bold ${color}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Congestion Score', value: '87', unit: '/100', icon: Activity, color: '#F97316' },
          { label: 'Prediction Accuracy', value: '96.2', unit: '%', icon: Brain, color: '#A855F7' },
          { label: 'Model Status', value: 'Online', unit: '', icon: Cpu, color: '#22C55E' },
          { label: 'Inference Time', value: '0.18', unit: 's', icon: Zap, color: '#3B82F6' },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 60%)` }} />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-xl font-bold font-mono" style={{ color }}>{value}<span className="text-sm">{unit}</span></div>
            <div className="text-[9px] text-gray-500 font-mono tracking-wider mt-1 uppercase">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vehicle breakdown donut */}
        <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4">
          <div className="text-sm font-semibold text-white mb-1">Vehicle Classification</div>
          <div className="text-[10px] text-gray-500 font-mono mb-4">AI-detected vehicle types</div>
          <div className="flex items-center flex-wrap gap-3">
            <ResponsiveContainer width="100%" minWidth={0} height={180} className="!w-full sm:!w-3/5">
              <PieChart>
                <Pie data={VEHICLE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={3} dataKey="value">
                  {VEHICLE_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#151820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 ml-0 sm:ml-2">
              {VEHICLE_DATA.map(({ name, value, color }) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-400 w-10">{name}</span>
                  <span className="text-xs font-mono font-bold" style={{ color }}>{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Model accuracy */}
        <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4">
          <div className="text-sm font-semibold text-white mb-1">Prediction Accuracy by Category</div>
          <div className="text-[10px] text-gray-500 font-mono mb-4">ST-GNN model performance metrics</div>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%"
              data={ACCURACY} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" cornerRadius={4} label={false} />
              <Legend iconSize={8} formatter={(value) => <span style={{ fontSize: 10, color: '#9CA3AF' }}>{value}</span>} />
              <Tooltip contentStyle={{ background: '#151820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly breakdown bar chart */}
      <div className="bg-[#0F1117] border border-white/[0.06] rounded-xl p-4">
        <div className="text-sm font-semibold text-white mb-1">Hourly Vehicle Classification</div>
        <div className="text-[10px] text-gray-500 font-mono mb-4">24-hour detection breakdown by vehicle type</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={HOURLY} barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fontSize: 9, fill: '#6B7280', fontFamily: 'JetBrains Mono' }} />
            <Tooltip contentStyle={{ background: '#151820', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="cars" fill="#F97316" radius={[2, 2, 0, 0]} />
            <Bar dataKey="bikes" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="buses" fill="#A855F7" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
