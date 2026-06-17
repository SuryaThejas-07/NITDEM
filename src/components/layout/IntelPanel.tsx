import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Plane, AlertTriangle, Thermometer, Droplets, CloudRain, MapPin, TrendingUp, CheckCircle2, Sparkles, Activity, ArrowLeft } from 'lucide-react';
import type { TrafficNode, Drone, PredictionWindow, RoadLinkMetadata } from '../../types';
import { 
  AI_RECOMMENDATIONS, 
  WEATHER, 
  getPrediction, 
  PREDICTION_WINDOW_LABELS, 
  congestionToStatus, 
  ROAD_LINKS_METADATA, 
  ROAD_HEALTH, 
  roadHealthColor, 
  TRAFFIC_NODES 
} from '../../data/constants';
import { statusColor, statusLabel } from '../../utils';

interface IntelPanelProps {
  selectedNode: TrafficNode | null;
  selectedLink: string | null;
  drones: Drone[];
  predictionWindow: PredictionWindow;
  onClearSelection?: () => void;
}

export default function IntelPanel({ selectedNode, selectedLink, drones, predictionWindow, onClearSelection }: IntelPanelProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'forecast20'>('live');
  const recs = selectedNode ? (AI_RECOMMENDATIONS[selectedNode.id] || []) : [];
  const nearbyDrones = selectedNode
    ? drones.filter(d => d.location === selectedNode.name || d.targetNodeId === selectedNode.id)
    : drones;
  const prediction = selectedNode ? getPrediction(selectedNode, predictionWindow) : null;
  const isPredicting = predictionWindow !== 'current';

  // Find nodes and metadata for selectedLink
  const { linkNodes, linkMetadata, linkStats, linkRecommendations } = (() => {
    if (!selectedLink || selectedNode) {
      return { linkNodes: null, linkMetadata: null, linkStats: null, linkRecommendations: [] };
    }
    const [aId, bId] = selectedLink.split('-');
    const a = TRAFFIC_NODES.find(n => n.id === aId);
    const b = TRAFFIC_NODES.find(n => n.id === bId);
    if (!a || !b) {
      return { linkNodes: null, linkMetadata: null, linkStats: null, linkRecommendations: [] };
    }

    const metadata = ROAD_LINKS_METADATA[selectedLink] || ROAD_LINKS_METADATA[`${bId}-${aId}`] || {
      name: `${a.name} ↔ ${b.name}`,
      type: 'City Connector',
      lengthKm: 0.6,
      healthId: 'unknown',
      baseSpeed: 45,
    };

    const predA = getPrediction(a, predictionWindow);
    const predB = getPrediction(b, predictionWindow);

    const statusA = predictionWindow === 'current' ? a.status : congestionToStatus(predA.congestion);
    const statusB = predictionWindow === 'current' ? b.status : congestionToStatus(predB.congestion);
    
    const CONGESTION_ORDER = ['free', 'moderate', 'heavy', 'critical'] as const;
    const worseStatus = CONGESTION_ORDER.indexOf(statusA) > CONGESTION_ORDER.indexOf(statusB) ? statusA : statusB;

    const avgDensity = Math.round((predA.density + predB.density) / 2);
    const totalVehicles = predA.vehicleCount + predB.vehicleCount;
    const avgSpeed = Math.round((predA.avgSpeed + predB.avgSpeed) / 2);

    // Travel time calculation: length / speed + signal delay
    const speedKmh = Math.max(5, avgSpeed);
    const baseMins = (metadata.lengthKm / speedKmh) * 60;
    const delayMins = worseStatus === 'critical' ? 3.5 : worseStatus === 'heavy' ? 2.0 : worseStatus === 'moderate' ? 0.5 : 0;
    const travelMins = parseFloat((baseMins + delayMins).toFixed(1));

    const stats = {
      avgDensity,
      totalVehicles,
      avgSpeed,
      worseStatus,
      travelMins,
    };

    // AI Recommendations for the corridor
    const linkRecs = [];
    if (worseStatus === 'critical' || worseStatus === 'heavy') {
      linkRecs.push(`Reroute traffic at ${a.name} via secondary loops`);
      linkRecs.push(`Adjust green signal offset on ${metadata.name}`);
      linkRecs.push('Advise real-time speed reduction alert to GPS apps');
    } else if (worseStatus === 'moderate') {
      linkRecs.push(`Monitor merge lane activity at endpoint signals`);
      linkRecs.push(`Optimal speed threshold maintained at ${avgSpeed} km/h`);
    } else {
      linkRecs.push(`Corridor operating under nominal flow. Green wave active.`);
    }

    // Associated health check
    const healthItem = ROAD_HEALTH.find(h => h.id === metadata.healthId);
    if (healthItem && (healthItem.status === 'critical' || healthItem.status === 'poor')) {
      linkRecs.push(`CAUTION: ${healthItem.issues[0] || 'Road degradation detected'}`);
      linkRecs.push('Prioritize dispatch of maintenance crew');
    } else {
      linkRecs.push(`Signal timings optimized for ${metadata.baseSpeed} km/h design speed`);
    }

    return {
      linkNodes: { a, b },
      linkMetadata: metadata,
      linkStats: stats,
      linkRecommendations: linkRecs,
    };
  })();

  return (
    <div className="h-full flex flex-col border-l border-white/[0.06] overflow-hidden bg-[#0F1117]"
      style={{ width: 260 }}>
      
      {/* Panel header */}
      <div className="border-b border-white/[0.06] shrink-0">
        <div className="h-12 flex items-center justify-between px-3">
          {(selectedNode || selectedLink) && onClearSelection ? (
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 text-[10px] font-mono text-gray-400 hover:text-orange-400 transition-colors"
              aria-label="Back to overview"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to overview
            </button>
          ) : (
            <span className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">Intelligence</span>
          )}
          <div className="flex items-center gap-1">
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 rounded-full bg-orange-400" />
            <span className="text-[9px] font-mono text-orange-400">LIVE</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="px-2 pb-2 flex gap-1">
          <button onClick={() => setActiveTab('live')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'live' ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'text-gray-500 hover:text-white border border-transparent'
            }`}>
            <Activity className="w-3 h-3" /> Live
          </button>
          <button onClick={() => setActiveTab('forecast20')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[9px] font-mono uppercase tracking-wider transition-all ${
              activeTab === 'forecast20' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-gray-500 hover:text-white border border-transparent'
            }`}>
            <Sparkles className="w-3 h-3" /> 20-Min Forecast
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'forecast20' ? (
          <Forecast20Panel selectedNode={selectedNode} />
        ) : (
        /* Selected node info */
        <AnimatePresence mode="wait">
          <motion.div key={selectedNode?.id || selectedLink || 'default'}
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
            ) : selectedLink && linkNodes && linkMetadata && linkStats ? (
              <div className="space-y-3">
                {/* Location / Route Header */}
                <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="text-xs font-semibold text-white">{linkMetadata.name}</span>
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono mb-2">
                    {linkNodes.a.name} ↔ {linkNodes.b.name} ({linkMetadata.type})
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor(linkStats.worseStatus) }} />
                      <span className="text-[10px] font-mono" style={{ color: statusColor(linkStats.worseStatus) }}>
                        {statusLabel(linkStats.worseStatus).toUpperCase()}
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
                  {[
                    { label: 'Avg Density', value: `${linkStats.avgDensity}%`, color: linkStats.avgDensity > 80 ? '#EF4444' : linkStats.avgDensity > 60 ? '#F97316' : '#22C55E' },
                    { label: 'Est. Travel Time', value: `${linkStats.travelMins} min`, color: linkStats.worseStatus === 'critical' ? '#EF4444' : linkStats.worseStatus === 'heavy' ? '#F97316' : '#22C55E' },
                    { label: 'Avg Speed', value: `${linkStats.avgSpeed} km/h`, color: '#3B82F6' },
                    { label: 'Combined Volume', value: linkStats.totalVehicles.toLocaleString(), color: '#A855F7' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.05]">
                      <div className="text-[9px] text-gray-500 font-mono mb-1">{label}</div>
                      <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Road Health Section */}
                {(() => {
                  const healthItem = ROAD_HEALTH.find(h => h.id === linkMetadata.healthId);
                  if (!healthItem) return null;
                  return (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-gray-500 tracking-wider">ROAD HEALTH INDEX</span>
                        <span className="text-[10px] font-mono font-bold" style={{ color: roadHealthColor(healthItem.status) }}>
                          {healthItem.score}/100 ({healthItem.status.toUpperCase()})
                        </span>
                      </div>
                      {healthItem.issues.length > 0 ? (
                        <div className="space-y-1">
                          {healthItem.issues.map((issue, idx) => (
                            <div key={idx} className="text-[9px] text-red-300 flex items-start gap-1">
                              <span className="text-red-400 shrink-0 mt-0.5">⚠️</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                          <span>No structural defects reported</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* AI Recommendations */}
                <div className="rounded-lg border border-orange-500/20 overflow-hidden">
                  <div className="bg-orange-500/10 px-3 py-1.5 flex items-center gap-2">
                    <Brain className="w-3 h-3 text-orange-400" />
                    <span className="text-[10px] font-mono text-orange-400 tracking-wider">CORRIDOR DIRECTIVES</span>
                    <span className="ml-auto text-[9px] text-orange-300 font-mono">94% conf.</span>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {linkRecommendations.map((rec, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-2">
                        <Zap className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] text-gray-300 leading-relaxed">{rec}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.05] text-center">
                  <MapPin className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 font-mono">Select a traffic node or corridor on the map to view intelligence</p>
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
        )}

        {/* Weather */}
        {activeTab === 'live' && (
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
        )}

        {/* System health */}
        {activeTab === 'live' && (
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
        )}
      </div>
    </div>
  );
}

function Forecast20Panel({ selectedNode }: { selectedNode: TrafficNode | null }) {
  const nodes = selectedNode ? [selectedNode] : TRAFFIC_NODES;
  return (
    <div className="space-y-2">
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        <div>
          <div className="text-[10px] font-mono text-orange-400 tracking-wider">20-MIN PREDICTION</div>
          <div className="text-[9px] text-gray-400">{selectedNode ? `Forecast for ${selectedNode.name}` : 'Forecast across all monitored junctions'}</div>
        </div>
      </div>
      {nodes.map(node => {
        const pred = getPrediction(node, '20min');
        const status = congestionToStatus(pred.congestion);
        const color = statusColor(status);
        return (
          <div key={node.id} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[11px] font-semibold text-white truncate">{node.name}</span>
              </div>
              <span className="text-[9px] font-mono uppercase shrink-0" style={{ color }}>{statusLabel(status)}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-white/[0.03] rounded p-1.5">
                <div className="text-[8px] text-gray-500 font-mono">Density</div>
                <div className="text-[11px] font-bold font-mono" style={{ color }}>{pred.density}%</div>
              </div>
              <div className="bg-white/[0.03] rounded p-1.5">
                <div className="text-[8px] text-gray-500 font-mono">Vehicles</div>
                <div className="text-[11px] font-bold font-mono text-orange-400">{pred.vehicleCount.toLocaleString()}</div>
              </div>
              <div className="bg-white/[0.03] rounded p-1.5">
                <div className="text-[8px] text-gray-500 font-mono">Speed</div>
                <div className="text-[11px] font-bold font-mono text-blue-400">{pred.avgSpeed}<span className="text-[8px] text-gray-500"> km/h</span></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span className="text-gray-500">Confidence</span>
              <span className="text-purple-400">{pred.confidence}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
