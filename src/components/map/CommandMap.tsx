import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { Activity, Sparkles } from 'lucide-react';
import type { TrafficNode, Drone, PredictionWindow } from '../../types';
import { TRAFFIC_NODES, OPERATIONAL_ZONE, STATUS_COLORS, getPrediction, congestionToStatus, PREDICTION_WINDOW_LABELS } from '../../data/constants';
import { statusLabel } from '../../utils';

interface CommandMapProps {
  selectedNode: TrafficNode | null;
  onNodeSelect: (node: TrafficNode) => void;
  drones: Drone[];
  predictionWindow: PredictionWindow;
  onPredictionWindowChange: (w: PredictionWindow) => void;
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

export default function CommandMap({ selectedNode, onNodeSelect, drones, predictionWindow, onPredictionWindowChange }: CommandMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.CircleMarker>>({});
  const ringsRef = useRef<Record<string, L.Circle>>({});
  const linesRef = useRef<Record<string, L.Polyline>>({});
  const droneMarkersRef = useRef<Record<string, L.Marker>>({});
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [11.2545, 75.7872],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark CartoDB tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

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
      const a = TRAFFIC_NODES.find(n => n.id === aId)!;
      const b = TRAFFIC_NODES.find(n => n.id === bId)!;
      const worse = [a, b].sort((x, y) => {
        const order = ['free', 'moderate', 'heavy', 'critical'];
        return order.indexOf(y.status) - order.indexOf(x.status);
      })[0];
      const line = L.polyline([[a.lat, a.lng], [b.lat, b.lng]], {
        color: STATUS_COLORS[worse.status],
        weight: 3,
        opacity: 0.6,
      }).addTo(map);
      linesRef.current[`${aId}-${bId}`] = line;
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

      marker.bindTooltip(`
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #151820; border: 1px solid rgba(249,115,22,0.3); border-radius: 8px; padding: 8px 10px; color: white; min-width: 160px;">
          <div style="color: #F97316; font-weight: 700; margin-bottom: 4px;">${node.name}</div>
          <div style="color: #9CA3AF; font-size: 10px;">Density: <span style="color: ${color}">${node.density}%</span></div>
          <div style="color: #9CA3AF; font-size: 10px;">Vehicles: ${node.vehicleCount.toLocaleString()}</div>
          <div style="color: #9CA3AF; font-size: 10px;">Speed: ${node.avgSpeed} km/h</div>
          <div style="color: #9CA3AF; font-size: 10px; margin-top: 4px;">Click to inspect →</div>
        </div>
      `, { permanent: false, direction: 'top', className: 'custom-tooltip', offset: [0, -10] });

      marker.on('click', () => {
        onNodeSelect(node);
        map.flyTo([node.lat, node.lng], 16, { duration: 1.2, easeLinearity: 0.3 });
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
        className: '',
        html: `<div style="width:20px;height:20px;background:rgba(59,130,246,0.9);border:2px solid #3B82F6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;box-shadow:0 0 10px rgba(59,130,246,0.5);">✈</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      const droneMarker = L.marker([drone.lat, drone.lng], { icon: droneIcon }).addTo(map);
      droneMarker.bindTooltip(`${drone.name} · ${drone.battery}%`, { direction: 'top' });
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

    // Update node markers and rings
    TRAFFIC_NODES.forEach(node => {
      const color = STATUS_COLORS[effectiveStatus[node.id]];
      const marker = markersRef.current[node.id];
      const ring = ringsRef.current[node.id];
      if (marker) {
        const isSelected = selectedNode?.id === node.id;
        marker.setStyle({
          radius: isSelected ? 14 : 10,
          weight: isSelected ? 3 : 2,
          color: isSelected ? '#FFFFFF' : color,
          fillColor: color,
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
      const line = linesRef.current[`${aId}-${bId}`];
      if (!line) return;
      const order = ['free', 'moderate', 'heavy', 'critical'];
      const worse = order.indexOf(effectiveStatus[aId]) > order.indexOf(effectiveStatus[bId]) ? effectiveStatus[aId] : effectiveStatus[bId];
      line.setStyle({ color: STATUS_COLORS[worse] });
    });
  }, [predictionWindow, mapReady, selectedNode]);

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
      </div>


      {/* CSS for tooltips */}
      <style>{`
        .custom-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; }
        .custom-tooltip::before { display: none !important; }
        .zone-tooltip { background: rgba(249,115,22,0.2) !important; border: 1px solid rgba(249,115,22,0.4) !important; color: #F97316 !important; font-family: 'JetBrains Mono', monospace !important; font-size: 11px !important; font-weight: 600 !important; border-radius: 6px !important; padding: 4px 8px !important; }
        .zone-tooltip::before { border-top-color: rgba(249,115,22,0.4) !important; }
        .leaflet-control-zoom { border: 1px solid rgba(255,255,255,0.08) !important; background: #0F1117 !important; }
        .leaflet-control-zoom a { background: #0F1117 !important; color: #9CA3AF !important; border-color: rgba(255,255,255,0.06) !important; }
        .leaflet-control-zoom a:hover { color: white !important; background: #1C202B !important; }
      `}</style>
    </div>
  );
}
