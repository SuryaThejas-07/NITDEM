import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { Activity, Sparkles } from 'lucide-react';
import type { TrafficNode, Drone, PredictionWindow, UserRole } from '../../types';
import { TRAFFIC_NODES, OPERATIONAL_ZONE, STATUS_COLORS, getPrediction, congestionToStatus, PREDICTION_WINDOW_LABELS } from '../../data/constants';
import { statusLabel } from '../../utils';

interface CommandMapProps {
  selectedNode: TrafficNode | null;
  onNodeSelect: (node: TrafficNode) => void;
  selectedLink: string | null;
  onLinkSelect: (link: string | null) => void;
  drones: Drone[];
  predictionWindow: PredictionWindow;
  onPredictionWindowChange: (w: PredictionWindow) => void;
  onDroneClick: (droneId: string) => void;
  currentRole: UserRole;
  onUpdateDroneRoute: (droneId: string, nodeIds: string[]) => void;
  isDark: boolean;
}

// Road connections synced from KUTIS trafficNetwork.ts road links
const CONNECTIONS: [string, string][] = [
  ['mavoor',          'bus_stand'],        // Mavoor Connector (arterial)
  ['bus_stand',       'arayidathupalam'],  // Mini Bypass Link (bypass)
  ['bus_stand',       'stadium'],          // Bus Stand Spine (collector)
  ['arayidathupalam', 'midtown'],          // Arayidathupalam to Midtown Link
  ['stadium',         'mananchira'],       // Stadium Road (collector)
  ['stadium',         'poonthanam'],       // Stadium Link Road (collector)
  ['stadium',         'midtown'],          // Stadium to Midtown Link
  ['midtown',         'east_bypass'],      // Midtown to East Bypass Link
  ['east_bypass',     'poonthanam'],       // Eastern Bypass Link
  ['poonthanam',      'palayam'],          // M.M Ali Road (arterial)
  ['palayam',         'mananchira'],       // Palayam to Mananchira Link
  ['mavoor',          'mananchira'],       // Mavoor to Mananchira Connector
];

const NODE_BY_ID = Object.fromEntries(TRAFFIC_NODES.map(node => [node.id, node]));
const CONGESTION_ORDER = ['free', 'moderate', 'heavy', 'critical'] as const;

function getEffectiveNodeStatus(node: TrafficNode, predictionWindow: PredictionWindow) {
  if (predictionWindow === 'current') return node.status;
  return congestionToStatus(getPrediction(node, predictionWindow).congestion);
}

function getConnectionTooltipContent(a: TrafficNode, b: TrafficNode, predictionWindow: PredictionWindow) {
  const predA = getPrediction(a, predictionWindow);
  const predB = getPrediction(b, predictionWindow);
  const statusA = getEffectiveNodeStatus(a, predictionWindow);
  const statusB = getEffectiveNodeStatus(b, predictionWindow);
  const worse = CONGESTION_ORDER.indexOf(statusA) > CONGESTION_ORDER.indexOf(statusB) ? statusA : statusB;
  const label = predictionWindow === 'current' ? 'CURRENT ANALYSIS' : PREDICTION_WINDOW_LABELS[predictionWindow].toUpperCase();

  return `
    <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #151820; border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; padding: 8px 10px; color: white; min-width: 190px;">
      <div style="color: #F97316; font-weight: 700; margin-bottom: 4px;">${a.name} ↔ ${b.name}</div>
      <div style="color:#6B7280; font-size:9px; letter-spacing:0.05em; margin-bottom:3px;">${label}</div>
      <div style="color: #9CA3AF; font-size: 10px;">Link status: <span style="color: ${STATUS_COLORS[worse]}">${statusLabel(worse)}</span></div>
      <div style="color: #9CA3AF; font-size: 10px;">${a.name}: <span style="color:${STATUS_COLORS[statusA]}">${predA.density}%</span> density, ${predA.vehicleCount.toLocaleString()} vehicles</div>
      <div style="color: #9CA3AF; font-size: 10px;">${b.name}: <span style="color:${STATUS_COLORS[statusB]}">${predB.density}%</span> density, ${predB.vehicleCount.toLocaleString()} vehicles</div>
      <div style="color: #9CA3AF; font-size: 10px; margin-top: 4px;">Hover road link to inspect</div>
    </div>
  `;
}

export default function CommandMap({ selectedNode, onNodeSelect, selectedLink, onLinkSelect, drones, predictionWindow, onPredictionWindowChange, onDroneClick, currentRole, onUpdateDroneRoute, isDark }: CommandMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const ringsRef = useRef<Record<string, L.Circle>>({});
  const linesRef = useRef<Record<string, L.Polyline>>({});
  const droneMarkersRef = useRef<Record<string, L.Marker>>({});
  const [mapReady, setMapReady] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const selectedLinkRef = useRef(selectedLink);
  const selectedNodeRef = useRef(selectedNode);

  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [drawnRoute, setDrawnRoute] = useState<string[]>([]);
  const [isUploadingRoute, setIsUploadingRoute] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [plannerDroneId, setPlannerDroneId] = useState('alpha');
  const [roleAlert, setRoleAlert] = useState(false);

  const isDrawingRouteRef = useRef(isDrawingRoute);
  const drawnRouteRef = useRef(drawnRoute);

  useEffect(() => {
    selectedLinkRef.current = selectedLink;
  }, [selectedLink]);

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    isDrawingRouteRef.current = isDrawingRoute;
  }, [isDrawingRoute]);

  useEffect(() => {
    drawnRouteRef.current = drawnRoute;
  }, [drawnRoute]);

  // Swap Leaflet tile layer url when isDark transitions
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(
        isDark 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      );
    }
  }, [isDark]);

  const drawnLineRef = useRef<L.Polyline | null>(null);

  // Redraw drawn route polyline when it changes
  useEffect(() => {
    if (!mapReady || !leafletMap.current) return;

    if (drawnLineRef.current) {
      drawnLineRef.current.remove();
      drawnLineRef.current = null;
    }

    if (drawnRoute.length >= 2) {
      const coords = drawnRoute.map(id => {
        const node = NODE_BY_ID[id];
        return [node.lat, node.lng] as [number, number];
      });
      drawnLineRef.current = L.polyline(coords, {
        color: '#06B6D4', // Cyan neon line for MAVLink path
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.9,
      }).addTo(leafletMap.current);
    }

    return () => {
      if (drawnLineRef.current) {
        drawnLineRef.current.remove();
      }
    };
  }, [drawnRoute, mapReady]);

  const handleUploadMission = () => {
    setIsUploadingRoute(true);
    setUploadStep(0);

    setTimeout(() => setUploadStep(1), 1000);
    setTimeout(() => setUploadStep(2), 2000);
    setTimeout(() => setUploadStep(3), 3000);
    setTimeout(() => {
      onUpdateDroneRoute(plannerDroneId, drawnRoute);
      setIsUploadingRoute(false);
      setIsDrawingRoute(false);
      setDrawnRoute([]);
    }, 4200);
  };

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [11.2545, 75.7872],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // CartoDB tile layer (url dynamically toggled based on initial isDark state)
    const tiles = L.tileLayer(
      isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', 
      {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);
    tileLayerRef.current = tiles;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Operational zone polygon
    const zone = L.polygon(OPERATIONAL_ZONE as L.LatLngExpression[], {
      color: '#F97316',
      fillColor: '#F97316',
      fillOpacity: 0.05,
      weight: 2,
      dashArray: '8 4',
    }).addTo(map);

    zone.bindTooltip('NIT DEM Operational Monitoring Zone', {
      permanent: true,
      direction: 'top',
      className: 'zone-tooltip',
    });

    // Draw connections
    CONNECTIONS.forEach(([aId, bId]) => {
      const a = NODE_BY_ID[aId];
      const b = NODE_BY_ID[bId];
      const worse = [a, b].sort((x, y) => {
        return CONGESTION_ORDER.indexOf(y.status) - CONGESTION_ORDER.indexOf(x.status);
      })[0];
      const key = `${aId}-${bId}`;
      const line = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
        color: STATUS_COLORS[worse.status],
        weight: 3,
        opacity: 0.6,
        className: 'cursor-pointer',
      }).addTo(map);
      line.bindTooltip(getConnectionTooltipContent(a, b, predictionWindow), {
        permanent: false,
        sticky: true,
        direction: 'top',
        className: 'custom-tooltip',
        opacity: 1,
        offset: [0, -8],
      });
      line.on('mouseover', () => {
        line.setStyle({ weight: 7, opacity: 1.0 });
        line.openTooltip();
      });
      line.on('mouseout', () => {
        const isSel = selectedLinkRef.current === key;
        const hasSelection = selectedLinkRef.current !== null || selectedNodeRef.current !== null;
        line.setStyle({
          weight: isSel ? 7 : 3,
          opacity: isSel ? 1.0 : (hasSelection ? 0.35 : 0.6),
        });
        line.closeTooltip();
      });
      line.on('click', () => {
        onLinkSelect(key);
      });
      linesRef.current[key] = line;
    });

    // Draw traffic nodes
    TRAFFIC_NODES.forEach(node => {
      const color = STATUS_COLORS[node.status];

      // Outer pulse ring
      const ring = L.circle([node.lat, node.lng], {
        radius: 80,
        color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1,
        dashArray: '4 4',
      }).addTo(map);
      ringsRef.current[node.id] = ring;

      const marker = L.circleMarker([node.lat, node.lng], {
        radius: 10,
        color,
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);

      marker.on('click', () => {
        if (isDrawingRouteRef.current) {
          const route = drawnRouteRef.current;
          if (route[route.length - 1] !== node.id) {
            setDrawnRoute([...route, node.id]);
          }
        } else {
          onNodeSelect(node);
          map.flyTo([node.lat, node.lng], 16, { duration: 1.2, easeLinearity: 0.3 });
        }
      });

      // Node label
      L.marker([node.lat, node.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="font-family:'JetBrains Mono',monospace; font-size:10px; color:white; white-space:nowrap; margin-top:16px; text-shadow: 0 1px 3px black; font-weight:600;">${node.name}</div>`,
          iconAnchor: [0, 0],
        }),
      }).addTo(map);

      markersRef.current[node.id] = marker;
    });

    // Drone markers
    drones.forEach(drone => {
      const droneIcon = L.divIcon({
        className: 'cursor-pointer',
        html: `<div style="width:20px;height:20px;background:rgba(59,130,246,0.9);border:2px solid #3B82F6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 0 10px rgba(59,130,246,0.5);">✈</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const droneMarker = L.marker([drone.lat, drone.lng], { icon: droneIcon }).addTo(map);
      droneMarker.bindTooltip(`${drone.name} · ${drone.battery}%`, { direction: 'top' });
      droneMarker.on('click', () => {
        onDroneClick(drone.id);
      });
      droneMarkersRef.current[drone.id] = droneMarker;
    });

    leafletMap.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update drone positions
  useEffect(() => {
    if (!mapReady) return;
    drones.forEach(drone => {
      const marker = droneMarkersRef.current[drone.id];
      if (marker) {
        marker.setLatLng([drone.lat, drone.lng]);
        marker.setTooltipContent(`${drone.name} · ${drone.battery.toFixed(0)}% · ${drone.altitude}m`);
      }
    });
  }, [drones, mapReady]);

  // Selected node highlighting + map color updates are both handled below

  // Update map colors based on prediction window (Current Analysis vs Future Prediction)
  useEffect(() => {
    if (!mapReady) return;

    // Compute effective status per node for this window
    const effectiveStatus: Record<string, TrafficNode['status']> = {};
    TRAFFIC_NODES.forEach(node => {
      const pred = getPrediction(node, predictionWindow);
      effectiveStatus[node.id] = predictionWindow === 'current' ? node.status : congestionToStatus(pred.congestion);
    });

    const hasSelection = selectedLink !== null || selectedNode !== null;

    // Update node markers and rings
    TRAFFIC_NODES.forEach(node => {
      const color = STATUS_COLORS[effectiveStatus[node.id]];
      const marker = markersRef.current[node.id];
      const ring = ringsRef.current[node.id];
      if (marker) {
        const isSelected = selectedNode?.id === node.id;
        const opacity = isSelected ? 1.0 : (hasSelection ? 0.4 : 0.9);
        marker.setStyle({
          radius: isSelected ? 14 : 10,
          weight: isSelected ? 3 : 2,
          color: isSelected ? '#FFFFFF' : color,
          fillColor: color,
          fillOpacity: opacity,
          opacity: opacity,
        });
        const pred = getPrediction(node, predictionWindow);
        marker.setTooltipContent(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #151820; border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; padding: 8px 10px; color: white; min-width: 170px;">
            <div style="color: #F97316; font-weight: 700; margin-bottom: 4px;">${node.name}</div>
            <div style="color:#6B7280; font-size:9px; letter-spacing:0.05em; margin-bottom:3px;">${PREDICTION_WINDOW_LABELS[predictionWindow].toUpperCase()}</div>
            <div style="color: #9CA3AF; font-size: 10px;">Density: <span style="color: ${color}">${pred.density}%</span></div>
            <div style="color: #9CA3AF; font-size: 10px;">Vehicles: ${pred.vehicleCount.toLocaleString()}</div>
            <div style="color: #9CA3AF; font-size: 10px;">Speed: ${pred.avgSpeed} km/h</div>
            ${predictionWindow !== 'current' ? `<div style="color: #9CA3AF; font-size: 10px;">Confidence: <span style="color:#F97316">${pred.confidence}%</span></div>` : ''}
            <div style="color: #9CA3AF; font-size: 10px; margin-top: 4px;">Click to inspect →</div>
          </div>
        `);
      }
      if (ring) {
        ring.setStyle({ color, fillColor: color });
      }
    });

    // Update connection line colors based on the worse of the two endpoint statuses
    CONNECTIONS.forEach(([aId, bId]) => {
      const key = `${aId}-${bId}`;
      const line = linesRef.current[key];
      if (!line) return;
      const a = NODE_BY_ID[aId];
      const b = NODE_BY_ID[bId];
      const worse = CONGESTION_ORDER.indexOf(effectiveStatus[aId]) > CONGESTION_ORDER.indexOf(effectiveStatus[bId]) ? effectiveStatus[aId] : effectiveStatus[bId];
      
      const isSel = selectedLink === key;
      line.setStyle({
        color: STATUS_COLORS[worse],
        weight: isSel ? 7 : 3,
        opacity: isSel ? 1.0 : (hasSelection ? 0.35 : 0.6),
      });
      line.setTooltipContent(getConnectionTooltipContent(a, b, predictionWindow));
    });
  }, [predictionWindow, mapReady, selectedNode, selectedLink]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Overlay legend */}
      <div className="absolute bottom-4 left-4 bg-[#0F1117]/90 border border-white/[0.08] rounded-lg p-3 backdrop-blur-sm">
        <div className="text-[9px] font-mono text-gray-500 mb-2 tracking-widest flex items-center gap-2">
          TRAFFIC STATUS
          {predictionWindow !== 'current' && (
            <span className="text-orange-400">· {PREDICTION_WINDOW_LABELS[predictionWindow].toUpperCase()}</span>
          )}
        </div>
        <div className="space-y-1">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400 font-mono">{statusLabel(status)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map overlay stats — hidden on small to avoid overlap, scrollable strip on medium */}
      <div className="hidden md:flex absolute top-4 left-4 gap-2 flex-wrap max-w-[55%] z-[5]">
        {TRAFFIC_NODES.map(node => {
          const pred = getPrediction(node, predictionWindow);
          const color = STATUS_COLORS[predictionWindow === 'current' ? node.status : congestionToStatus(pred.congestion)];
          return (
            <motion.button
              key={node.id}
              onClick={() => {
                onNodeSelect(node);
                leafletMap.current?.flyTo([node.lat, node.lng], 16, { duration: 1.2 });
              }}
              whileHover={{ scale: 1.05 }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                selectedNode?.id === node.id
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                  : 'bg-[#0F1117]/80 border-white/[0.08] text-gray-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                {node.name}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mobile node selector — horizontal scroll strip below header */}
      <div className="md:hidden absolute top-2 left-14 right-2 z-[5] overflow-x-auto">
        <div className="flex gap-1.5 pb-1">
          {TRAFFIC_NODES.map(node => {
            const pred = getPrediction(node, predictionWindow);
            const color = STATUS_COLORS[predictionWindow === 'current' ? node.status : congestionToStatus(pred.congestion)];
            return (
              <button
                key={node.id}
                onClick={() => {
                  onNodeSelect(node);
                  leafletMap.current?.flyTo([node.lat, node.lng], 16, { duration: 1.2 });
                }}
                className={`shrink-0 px-2 py-1 rounded-md text-[9px] font-mono border ${
                  selectedNode?.id === node.id
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                    : 'bg-[#0F1117]/90 border-white/[0.08] text-gray-300'
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle" style={{ backgroundColor: color }} />
                {node.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prediction Mode Toggle — bottom on mobile, top-right on desktop */}
      <div className="absolute bottom-20 right-2 md:bottom-auto md:top-4 md:right-4 flex flex-col items-end gap-2 z-[5]">
        <div className="flex gap-1 bg-[#0F1117]/90 border border-white/[0.08] rounded-lg p-1 backdrop-blur-sm">
          <button
            onClick={() => onPredictionWindowChange('current')}
            className={`flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${
              predictionWindow === 'current' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" /> <span className="hidden sm:inline">Current Analysis</span><span className="sm:hidden">Now</span>
          </button>
          <button
            onClick={() => onPredictionWindowChange('20min')}
            className={`flex items-center gap-1.5 px-2 md:px-2.5 py-1.5 rounded text-[10px] font-mono uppercase transition-all ${
              predictionWindow !== 'current' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" /> <span className="hidden sm:inline">Future Prediction</span><span className="sm:hidden">Future</span>
          </button>
        </div>

        {/* Sub-toggle for prediction horizon */}
        {predictionWindow !== 'current' && (
          <motion.div
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
            className="flex gap-1 bg-[#0F1117]/90 border border-orange-500/20 rounded-lg p-1 backdrop-blur-sm"
          >
            {(['20min', '1hr', '2hr'] as const).map(w => (
              <button
                key={w}
                onClick={() => onPredictionWindowChange(w)}
                className={`px-2 md:px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-all ${
                  predictionWindow === w ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-white'
                }`}
              >
                {w === '20min' ? '20 Min' : w === '1hr' ? '1 Hour' : '2 Hour'}
              </button>
            ))}
          </motion.div>
        )}

        {/* MAVLink Mission Planner Toggle Button */}
        <button
          onClick={() => {
            const allowed = currentRole === 'supervisor' || currentRole === 'operator';
            if (allowed) {
              setIsDrawingRoute(!isDrawingRoute);
              setDrawnRoute([]);
            } else {
              setRoleAlert(true);
              setTimeout(() => setRoleAlert(false), 3000);
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-mono uppercase border transition-all ${
            isDrawingRoute 
              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' 
              : 'bg-[#0F1117]/90 border-white/[0.08] text-gray-400 hover:text-white hover:border-cyan-500/30'
          }`}
        >
          ✈ MAVLink Mission Planner
        </button>

        {roleAlert && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider text-right max-w-xs">
            Requires Supervisor or Operator elevation to program autopilot dispatches.
          </motion.div>
        )}
      </div>

      {/* MAVLink Planning Console Banner at bottom center */}
      {isDrawingRoute && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0F1117]/95 border border-cyan-500/30 rounded-xl p-3.5 backdrop-blur-md z-[5] w-full max-w-sm">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/[0.06]">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase">MAVLink Planner</span>
              <div className="text-[8px] text-gray-500 font-mono">Draw waypoints on map</div>
            </div>
            <select
              value={plannerDroneId}
              onChange={e => setPlannerDroneId(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.1] rounded px-1.5 py-0.5 text-[9px] font-mono text-white focus:outline-none"
            >
              <option value="alpha" className="bg-[#151820]">UAV Alpha</option>
              <option value="bravo" className="bg-[#151820]">UAV Bravo</option>
            </select>
          </div>

          <div className="mb-3 space-y-1">
            <div className="text-[9px] text-gray-400 font-mono">
              Waypoints: {drawnRoute.length === 0 ? 'Click map nodes to add...' : drawnRoute.map(id => NODE_BY_ID[id]?.name.split(' ')[0]).join(' → ')}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsDrawingRoute(false);
                setDrawnRoute([]);
              }}
              className="flex-1 py-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white border border-white/[0.08] text-[9px] font-mono uppercase"
            >
              Cancel
            </button>
            <button
              disabled={drawnRoute.length < 2 || isUploadingRoute}
              onClick={handleUploadMission}
              className={`flex-1 py-1.5 rounded text-[9px] font-mono uppercase font-bold transition-all ${
                drawnRoute.length >= 2 
                  ? 'bg-cyan-500 hover:bg-cyan-600 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]' 
                  : 'bg-white/[0.02] text-gray-600 border border-white/[0.04] cursor-not-allowed'
              }`}
            >
              Upload Mission
            </button>
          </div>
        </div>
      )}

      {/* Holographic upload progress loader */}
      {isUploadingRoute && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0F1117] border border-cyan-500/40 rounded-2xl p-6 w-full max-w-xs text-center space-y-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full mx-auto" />
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase">MAVLink Telemetry Upload</div>
              <p className="text-[9px] font-mono text-gray-400">
                {uploadStep === 0 && 'Establishing connection to UAV telemetry modems...'}
                {uploadStep === 1 && 'Uploading mission frames to autopilot serial registers...'}
                {uploadStep === 2 && 'Verifying checksums and flight boundaries...'}
                {uploadStep === 3 && 'UAV autopilot route programmed successfully!'}
              </p>
            </div>
            <div className="w-full bg-white/[0.05] h-1 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-cyan-400"
                initial={{ width: '0%' }}
                animate={{ width: `${(uploadStep + 1) * 25}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>
      )}


      {/* CSS for tooltips */}
      <style>{`
        .custom-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .custom-tooltip::before { display: none !important; }
        .zone-tooltip { background: rgba(249,115,22,0.2) !important; border: 1px solid rgba(249,115,22,0.4) !important; color: #F97316 !important; font-family: 'JetBrains Mono', monospace !important; font-size: 11px !important; font-weight: 600 !important; border-radius: 6px !important; padding: 4px 8px !important; }
        .zone-tooltip::before { border-top-color: rgba(249,115,22,0.4) !important; }
        .leaflet-control-zoom { border: 1px solid rgba(255,255,255,0.08) !important; background: #0F1117 !important; }
        .leaflet-control-zoom a { background: #0F1117 !important; color: #9CA3AF !important; border-color: rgba(255,255,255,0.06) !important; }
        .leaflet-control-zoom a:hover { color: white !important; background: #1C202B !important; }
        .cursor-pointer { cursor: pointer !important; }
      `}</style>
    </div>
  );
}
