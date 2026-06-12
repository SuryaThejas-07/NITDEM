import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Plane, AlertTriangle, Thermometer, Droplets, CloudRain, MapPin, TrendingUp, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import type { TrafficNode, Drone, PredictionWindow } from '../../types';
import { AI_RECOMMENDATIONS, WEATHER, getPrediction, PREDICTION_WINDOW_LABELS, congestionToStatus } from '../../data/constants';
import { statusColor, statusLabel } from '../../utils';

interface IntelPanelProps {
  selectedNode: TrafficNode | null;
  drones: Drone[];
  predictionWindow: PredictionWindow;
}

export default function IntelPanel({ selectedNode, drones, predictionWindow }: IntelPanelProps) {
  const recs = selectedNode ? (AI_RECOMMENDATIONS[selectedNode.id] || []) : [];
  const nearbyDrones = selectedNode
    ? drones.filter(d => d.location === selectedNode.name || d.targetNodeId === selectedNode.id)
    : drones;
  const prediction = selectedNode ? getPrediction(selectedNode, predictionWindow) : null;
  const isPredicting = predictionWindow !== 'current';

  return (
    <div className="h-full flex flex-col border-l border-white/[0.06] overflow-hidden"
      style={{ background: '#0F1117', width: 260 }}>
      
      {/* Panel header */}
      <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Intelligence</span>
        <div className="flex items-center gap-1">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-1 rounded-full bg-orange-400" />
          <span className="text-[9px] font-mono text-orange-400">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Selected node info */}
        <AnimatePresence mode="wait">
          <motion.div key={selectedNode?.id || 'default'}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            
            {selectedNode ? (
              <div className="space-y-3">
                {/* Location header */}
                <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="text-xs font-semibold text-white">{selectedNode.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(isPredicting ? congestionToStatus(prediction!.congestion) : selectedNode.status) }} />
                      <span className="text-[10px] font-mono" style={{ color: statusColor(isPredicting ? congestionToStatus(prediction!.congestion) : selectedNode.status) }}>
                        {statusLabel(isPredicting ? congestionToStatus(prediction!.congestion) : selectedNode.status).toUpperCase()}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isPredicting ? 'bg-orange-500/15 text-orange-400' : 'bg-green-500/15 text-green-400'
                    }`}>
                      {isPredicting ? <Sparkles className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
                      {PREDICTION_WINDOW_LABELS[predictionWindow].toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  {isPredicting && prediction ? (
                    <>
                      {[
                        { label: 'Predicted Density', value: `${prediction.density}%`, color: prediction.density > 80 ? '#EF4444' : prediction.density > 60 ? '#F97316' : '#22C55E' },
                        { label: 'Predicted Vehicles', value: prediction.vehicleCount.toLocaleString(), color: '#F97316' },
                        { label: 'Predicted Speed', value: `${prediction.avgSpeed} km/h`, color: '#3B82F6' },
                        { label: 'Confidence', value: `${prediction.confidence}%`, color: '#A855F7' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.05]">
                          <div className="text-[9px] text-gray-500 font-mono mb-1">{label}</div>
                          <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
                        </div>
                      ))}
                      <div className="col-span-2 bg-white/[0.03] rounded-lg p-2 border border-white/[0.05] flex items-center justify-between">
                        <div className="text-[9px] text-gray-500 font-mono">Predicted Congestion</div>
                        <div className="text-xs font-bold font-mono capitalize" style={{ color: statusColor(congestionToStatus(prediction.congestion)) }}>
                          {prediction.congestion}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {[
                        { label: 'Current Density', value: `${selectedNode.density}%`, color: selectedNode.density > 80 ? '#EF4444' : selectedNode.density > 60 ? '#F97316' : '#22C55E' },
                        { label: 'Current Vehicles', value: selectedNode.vehicleCount.toLocaleString(), color: '#F97316' },
                        { label: 'Current Speed', value: `${selectedNode.avgSpeed} km/h`, color: '#3B82F6' },
                        { label: 'Incidents', value: selectedNode.incidentCount.toString(), color: selectedNode.incidentCount > 0 ? '#EF4444' : '#22C55E' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.05]">
                          <div className="text-[9px] text-gray-500 font-mono mb-1">{label}</div>
                          <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* AI Block */}
                <div className="rounded-lg border border-orange-500/20 overflow-hidden">
                  <div className="bg-orange-500/10 px-3 py-1.5 flex items-center gap-2">
                    <Brain className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-mono text-orange-400 tracking-wider">AI RECOMMENDATIONS</span>
                    <span className="ml-auto text-[9px] text-orange-300 font-mono">96% conf.</span>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {recs.map((rec, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2">
                        <Zap className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-300 leading-relaxed">{rec}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Nearby drones */}
                {nearbyDrones.length > 0 && (
                  <div className="rounded-lg border border-blue-500/20 overflow-hidden">
                    <div className="bg-blue-500/10 px-3 py-1.5 flex items-center gap-2">
                      <Plane className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] font-mono text-blue-400 tracking-wider">DRONE COVERAGE</span>
                    </div>
                    <div className="p-2 space-y-2">
                      {nearbyDrones.map(drone => (
                        <div key={drone.id} className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-mono text-white">{drone.name}</div>
                            <div className="text-[9px] text-gray-500">{drone.altitude}m · {drone.battery}% batt.</div>
                          </div>
                          <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                            ACTIVE
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Incidents */}
                {selectedNode.incidentCount > 0 && (
                  <div className="rounded-lg border border-red-500/20 overflow-hidden">
                    <div className="bg-red-500/10 px-3 py-1.5 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] font-mono text-red-400">{selectedNode.incidentCount} INCIDENT(S)</span>
                    </div>
                    <div className="p-2">
                      <span className="text-[10px] text-gray-400">Active incidents at this node. Review Incident Center.</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] text-center">
                  <MapPin className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 font-mono">Select a traffic node on the map to view intelligence</p>
                </div>

                {/* System overview when no node selected */}
                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-gray-600 tracking-widest uppercase px-1">System Overview</div>
                  {[
                    { label: 'Total Vehicles', value: '4,869', icon: TrendingUp, color: 'text-orange-400' },
                    { label: 'Active Drones', value: '2', icon: Plane, color: 'text-blue-400' },
                    { label: 'AI Confidence', value: '96.2%', icon: Brain, color: 'text-purple-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${color}`} />
                        <span className="text-[10px] text-gray-400">{label}</span>
                      </div>
                      <span className={`text-xs font-mono font-semibold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Weather */}
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <div className="px-3 py-1.5 border-b border-white/[0.05] flex items-center gap-2">
            <Thermometer className="w-3 h-3 text-cyan-400" />
            <span className="text-[10px] font-mono text-gray-500 tracking-wider">WEATHER — KOZHIKODE</span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded p-2">
              <div className="text-[9px] text-gray-500 font-mono">Temperature</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">{WEATHER.temperature}°C</div>
            </div>
            <div className="bg-white/[0.03] rounded p-2">
              <div className="text-[9px] text-gray-500 font-mono">Humidity</div>
              <div className="text-sm font-bold text-blue-400 font-mono">{WEATHER.humidity}%</div>
            </div>
            <div className="bg-white/[0.03] rounded p-2">
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono mb-0.5">
                <CloudRain className="w-2.5 h-2.5" /> Rain
              </div>
              <div className="text-sm font-bold text-blue-300 font-mono">{WEATHER.rainProbability}%</div>
            </div>
            <div className="bg-white/[0.03] rounded p-2">
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-mono mb-0.5">
                <Droplets className="w-2.5 h-2.5" /> Impact
              </div>
              <div className="text-xs font-bold text-yellow-400 font-mono capitalize">{WEATHER.trafficImpact}</div>
            </div>
          </div>
        </div>

        {/* System health */}
        <div className="space-y-1">
          <div className="text-[9px] font-mono text-gray-600 tracking-widest uppercase px-1">System Health</div>
          {['AI Model', 'Drone Network', 'Map Services', 'Token Engine'].map(sys => (
            <div key={sys} className="flex items-center justify-between bg-white/[0.03] rounded px-2.5 py-1.5 border border-white/[0.04]">
              <span className="text-[10px] text-gray-400">{sys}</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                <span className="text-[9px] font-mono text-green-400">ONLINE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
