import type { TrafficNode, Drone, Token, WeatherData, RoadHealth, DroneAnomaly, NodePrediction, PredictionWindow, RoadLinkMetadata } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// TRAFFIC NODES — coordinates synced from KUTIS (Kozhikode-Traffic-Management)
// Mapping:
//   stadium      ← stadium_jn        (11.255700, 75.785660)
//   bus_stand    ← bus_stand_jn      (11.260410, 75.785680)
//   arayidathupalam ← arayidathupalam_jn (11.259720, 75.792480)
//   mananchira   ← mananchira_jn     (11.254237, 75.781672)
//   poonthanam   ← poonthanam_jn     (11.250620, 75.786780)
//   palayam      ← palayam_jn        (11.249420, 75.784980)
//   mavoor       ← mavoor_road_jn    (11.258694, 75.780394)
//   midtown      ← midtown_jn        (11.256140, 75.792850)
//   east_bypass  ← east_bypass_jn    (11.252560, 75.793220)
// ─────────────────────────────────────────────────────────────────────────────
export const TRAFFIC_NODES: TrafficNode[] = [
  {
    id: 'stadium',
    name: 'Stadium Junction',
    lat: 11.2553,
    lng: 75.7861,
    density: 87,
    vehicleCount: 1243,
    avgSpeed: 24,
    incidentCount: 2,
    status: 'heavy',
  },
  {
    id: 'bus_stand',
    name: 'Bus Stand Junction',
    lat: 11.2592,
    lng: 75.7853,
    density: 72,
    vehicleCount: 1050,
    avgSpeed: 23,
    incidentCount: 1,
    status: 'heavy',
  },
  {
    id: 'arayidathupalam',
    name: 'Arayidathupalam Junction',
    lat: 11.2586,
    lng: 75.7919,
    density: 81,
    vehicleCount: 1150,
    avgSpeed: 18,
    incidentCount: 1,
    status: 'heavy',
  },
  {
    id: 'mananchira',
    name: 'Mananchira Junction',
    lat: 11.254237,
    lng: 75.7816717,
    density: 54,
    vehicleCount: 720,
    avgSpeed: 27,
    incidentCount: 0,
    status: 'moderate',
  },
  {
    id: 'poonthanam',
    name: 'Poonthanam Junction',
    lat: 11.2514,
    lng: 75.7876,
    density: 60,
    vehicleCount: 830,
    avgSpeed: 25,
    incidentCount: 0,
    status: 'moderate',
  },
  {
    id: 'palayam',
    name: 'Palayam Junction',
    lat: 11.2489,
    lng: 75.7839,
    density: 92,
    vehicleCount: 1380,
    avgSpeed: 16,
    incidentCount: 1,
    status: 'critical',
  },
  {
    id: 'mavoor',
    name: 'Mavoor Road Junction',
    lat: 11.258694,
    lng: 75.780394,
    density: 48,
    vehicleCount: 680,
    avgSpeed: 31,
    incidentCount: 0,
    status: 'moderate',
  },
  {
    id: 'midtown',
    name: 'Midtown Junction',
    lat: 11.2552,
    lng: 75.7919,
    density: 31,
    vehicleCount: 390,
    avgSpeed: 34,
    incidentCount: 0,
    status: 'free',
  },
  {
    id: 'east_bypass',
    name: 'East Bypass Junction',
    lat: 11.2526,
    lng: 75.7932,
    density: 28,
    vehicleCount: 330,
    avgSpeed: 36,
    incidentCount: 0,
    status: 'free',
  },
];

export const INITIAL_DRONES: Drone[] = [
  {
    id: 'alpha',
    name: 'Drone Alpha',
    location: 'Stadium Junction',
    lat: 11.2553,
    lng: 75.7861,
    battery: 84,
    altitude: 120,
    status: 'streaming',
    targetNodeId: 'bus_stand',
  },
  {
    id: 'bravo',
    name: 'Drone Bravo',
    location: 'Palayam Junction',
    lat: 11.2489,
    lng: 75.7839,
    battery: 91,
    altitude: 135,
    status: 'streaming',
    targetNodeId: 'east_bypass',
  },
];

export const SAMPLE_TOKENS: Token[] = [
  {
    id: 'TK-8127',
    type: 'Accident',
    priority: 'critical',
    location: 'Stadium Junction',
    status: 'active',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    description: 'Multi-vehicle collision reported near EMS Stadium Gate 3.',
    generatedBy: 'AI Auto-Detection',
  },
  {
    id: 'TK-8126',
    type: 'Congestion',
    priority: 'high',
    location: 'Bus Stand Junction',
    status: 'active',
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    description: 'Severe congestion due to bus bunching. Over 1050 vehicles detected.',
    generatedBy: 'Traffic Sensor Array',
  },
  {
    id: 'TK-8125',
    type: 'Event Warning',
    priority: 'medium',
    location: 'Palayam Junction',
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    description: 'Festival procession expected to cause route disruption from 18:00.',
    generatedBy: 'Operator: admin',
  },
  {
    id: 'TK-8124',
    type: 'Drone Observation',
    priority: 'low',
    location: 'Mavoor Road Junction',
    status: 'resolved',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    description: 'Road surface damage observed near km marker 4. Maintenance notified.',
    generatedBy: 'Drone Alpha',
  },
  {
    id: 'TK-8123',
    type: 'Congestion',
    priority: 'high',
    location: 'Stadium Junction',
    status: 'resolved',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    description: 'Post-match traffic surge resolved. Normal flow restored.',
    generatedBy: 'AI Auto-Detection',
  },
];

export const WEATHER: WeatherData = {
  temperature: 31,
  humidity: 74,
  rainProbability: 35,
  trafficImpact: 'moderate',
  condition: 'Partly Cloudy',
};

export const AI_RECOMMENDATIONS: Record<string, string[]> = {
  stadium: [
    'Increase green signal duration by 20 seconds on NH-66 approach',
    'Deploy Drone Alpha for aerial monitoring',
    'Divert northbound traffic through Mini Bypass',
    'Alert 4 officers to manual point duty',
  ],
  bus_stand: [
    'CRITICAL: Activate overflow bay management protocol',
    'Request additional traffic personnel — minimum 6 officers',
    'Implement bus departure staggering every 4 minutes',
    'Deploy Drone Alpha for passenger flow monitoring',
  ],
  arayidathupalam: [
    'Monitor Mini Bypass approach — congestion risk is high',
    'Signal timing extension of 10 seconds recommended on eastbound arm',
    'Divert via Midtown connector if density exceeds 85',
  ],
  mananchira: [
    'Current flow stable — no action required',
    'Monitor inner-city distributor during peak hours',
    'Schedule Drone Bravo patrol at 16:00',
  ],
  poonthanam: [
    'Coordinate east-west flow with Palayam signal plan',
    'Monitor for queue build-up from Palayam bottleneck',
    'Enable emergency corridor on eastern bypass if needed',
  ],
  palayam: [
    'Festival route adjustment recommended from 18:00',
    'Coordinate with event organizers for crowd management',
    'Enable emergency corridor on inner ring road',
  ],
  mavoor: [
    'Current flow stable — no action required',
    'Schedule Drone Bravo patrol at 15:00',
    'Monitor for peak hour build-up after 17:30',
  ],
  midtown: [
    'Excellent flow — actively divert heavy vehicles here',
    'Signal optimization suggested: extend green by 10 seconds',
    'Inform navigation systems to promote this route',
  ],
  east_bypass: [
    'Excellent flow — actively divert heavy vehicles here',
    'Signal optimization suggested: extend green by 10 seconds',
    'Inform navigation systems to promote this route',
  ],
};

export const STATUS_COLORS: Record<string, string> = {
  free: '#22C55E',
  moderate: '#EAB308',
  heavy: '#F97316',
  critical: '#EF4444',
};

// Expanded operational zone to cover all 9 KUTIS nodes
export const OPERATIONAL_ZONE: [number, number][] = [
  [11.2650, 75.7780],
  [11.2650, 75.7960],
  [11.2470, 75.7960],
  [11.2470, 75.7780],
];

// ============ NEW FEATURE DATA ============

// Road Health Index
export const ROAD_HEALTH: RoadHealth[] = [
  {
    id: 'mavoor-road',
    name: 'Mavoor Road',
    score: 78,
    status: 'fair',
    lastInspected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    issues: ['Minor surface cracking near km 4', 'Faded lane markings'],
  },
  {
    id: 'palayam-road',
    name: 'Palayam Road',
    score: 91,
    status: 'good',
    lastInspected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    issues: [],
  },
  {
    id: 'mini-bypass',
    name: 'East Bypass',
    score: 62,
    status: 'poor',
    lastInspected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    issues: ['Pothole cluster near junction entry', 'Drainage blockage reported'],
  },
  {
    id: 'stadium-corridor',
    name: 'Stadium Corridor',
    score: 84,
    status: 'good',
    lastInspected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    issues: ['Signal timing board flickering'],
  },
  {
    id: 'bus-stand-approach',
    name: 'Bus Stand Approach Road',
    score: 45,
    status: 'critical',
    lastInspected: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    issues: ['Severe surface degradation', 'Multiple potholes', 'Drainage failure during rain'],
  },
];

export function roadHealthColor(status: RoadHealth['status']): string {
  const map: Record<RoadHealth['status'], string> = {
    good: '#22C55E',
    fair: '#EAB308',
    poor: '#F97316',
    critical: '#EF4444',
  };
  return map[status];
}

export function scoreToStatus(score: number): RoadHealth['status'] {
  if (score >= 80) return 'good';
  if (score >= 65) return 'fair';
  if (score >= 50) return 'poor';
  return 'critical';
}

// Junction / road network for incident location lookup
export interface JunctionInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  roads: string[];
}

export const JUNCTIONS: JunctionInfo[] = [
  { id: 'stadium',        name: 'Stadium Junction',         lat: 11.2553, lng: 75.7861, roads: ['NH-66', 'Stadium Road', 'Indira Gandhi Road'] },
  { id: 'bus_stand',      name: 'Bus Stand Junction',       lat: 11.2592, lng: 75.7853, roads: ['Bus Stand Road', 'Mavoor Road', 'Mini Bypass'] },
  { id: 'arayidathupalam',name: 'Arayidathupalam Junction', lat: 11.2586, lng: 75.7919, roads: ['Mini Bypass', 'Cherootty Road', 'Arayidathupalam Road'] },
  { id: 'mananchira',     name: 'Mananchira Junction',      lat: 11.254237, lng: 75.7816717, roads: ['Mananchira Road', 'Bank Road', 'Indira Gandhi Road'] },
  { id: 'poonthanam',     name: 'Poonthanam Junction',      lat: 11.2514, lng: 75.7876, roads: ['M.M Ali Road', 'Poonthanam Road'] },
  { id: 'palayam',        name: 'Palayam Junction',         lat: 11.2489, lng: 75.7839, roads: ['Palayam Road', 'Bank Road', 'M.M Ali Road'] },
  { id: 'mavoor',         name: 'Mavoor Road Junction',     lat: 11.258694, lng: 75.780394, roads: ['Mavoor Road', 'Cherootty Road'] },
  { id: 'midtown',        name: 'Midtown Junction',         lat: 11.2552, lng: 75.7919, roads: ['Midtown Connector', 'Eastern Inner Road'] },
  { id: 'east_bypass',    name: 'East Bypass Junction',     lat: 11.2526, lng: 75.7932, roads: ['Eastern Bypass', 'Poonthanam Link'] },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestJunction(lat: number, lng: number): JunctionInfo {
  let nearest = JUNCTIONS[0];
  let minDist = Infinity;
  for (const j of JUNCTIONS) {
    const d = haversineDistance(lat, lng, j.lat, j.lng);
    if (d < minDist) {
      minDist = d;
      nearest = j;
    }
  }
  return nearest;
}

// Drone anomalies — seed data
export const DRONE_ANOMALIES: DroneAnomaly[] = [
  {
    id: 'an-1001',
    type: 'Accident',
    droneId: 'alpha',
    droneName: 'Drone Alpha',
    location: 'Stadium Junction',
    lat: 11.2553,
    lng: 75.7861,
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    confidence: 94,
    imageSeed: 'accident-stadium-1',
    tokenId: 'TK-8127',
  },
  {
    id: 'an-1002',
    type: 'Illegal Parking',
    droneId: 'bravo',
    droneName: 'Drone Bravo',
    location: 'Palayam Junction',
    lat: 11.2489,
    lng: 75.7839,
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    confidence: 88,
    imageSeed: 'parking-palayam-1',
    tokenId: 'TK-8118',
  },
  {
    id: 'an-1003',
    type: 'Crowd Gathering',
    droneId: 'alpha',
    droneName: 'Drone Alpha',
    location: 'Mavoor Road Junction',
    lat: 11.258694,
    lng: 75.780394,
    timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    confidence: 91,
    imageSeed: 'crowd-mavoor-1',
    tokenId: 'TK-8112',
  },
];

export const ANOMALY_TYPES: { type: DroneAnomaly['type']; color: string }[] = [
  { type: 'Accident', color: '#EF4444' },
  { type: 'Illegal Parking', color: '#F59E0B' },
  { type: 'Road Block', color: '#F97316' },
  { type: 'Vehicle Breakdown', color: '#A855F7' },
  { type: 'Crowd Gathering', color: '#3B82F6' },
];

// Traffic Prediction generation
function seededFactor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 1000;
  return h / 1000;
}

export function getPrediction(node: TrafficNode, window: PredictionWindow): NodePrediction {
  if (window === 'current') {
    return {
      density: node.density,
      vehicleCount: node.vehicleCount,
      avgSpeed: node.avgSpeed,
      congestion:
        node.density >= 85 ? 'critical' :
        node.density >= 65 ? 'high' :
        node.density >= 40 ? 'moderate' : 'low',
      confidence: 100,
    };
  }

  const horizonMultiplier = window === '20min' ? 1 : window === '1hr' ? 2 : 3;
  const factor = seededFactor(node.id + window);
  const densityDelta = (factor - 0.3) * 15 * horizonMultiplier;
  const predictedDensity = Math.max(5, Math.min(100, Math.round(node.density + densityDelta)));
  const vehicleDelta = Math.round((factor - 0.25) * 200 * horizonMultiplier);
  const predictedVehicles = Math.max(50, node.vehicleCount + vehicleDelta);
  const speedDelta = -((predictedDensity - node.density) * 0.3);
  const predictedSpeed = Math.max(5, Math.round(node.avgSpeed + speedDelta));

  const congestion: NodePrediction['congestion'] =
    predictedDensity >= 85 ? 'critical' :
    predictedDensity >= 65 ? 'high' :
    predictedDensity >= 40 ? 'moderate' : 'low';

  const confidence = Math.round(96 - horizonMultiplier * 4 - factor * 5);

  return {
    density: predictedDensity,
    vehicleCount: predictedVehicles,
    avgSpeed: predictedSpeed,
    congestion,
    confidence: Math.max(70, confidence),
  };
}

export function congestionToStatus(congestion: NodePrediction['congestion']): TrafficNode['status'] {
  const map: Record<NodePrediction['congestion'], TrafficNode['status']> = {
    low: 'free',
    moderate: 'moderate',
    high: 'heavy',
    critical: 'critical',
  };
  return map[congestion];
}

export const PREDICTION_WINDOW_LABELS: Record<PredictionWindow, string> = {
  current: 'Current Analysis',
  '20min': '20 Minute Prediction',
  '1hr': '1 Hour Prediction',
  '2hr': '2 Hour Prediction',
};

// What-If Simulation logic
export const SIMULATION_ACTIONS = [
  'Increase Signal Time',
  'Reduce Signal Time',
  'Close Road',
  'Divert Traffic',
  'Increase Event Attendance',
] as const;

export function runSimulation(node: TrafficNode, action: typeof SIMULATION_ACTIONS[number]) {
  let congestionReduction = 0;
  let densityChange = 0;
  let officers = 2;
  let drones = 1;
  let travelMins = Math.round(node.vehicleCount / Math.max(node.avgSpeed, 5) * 0.6);

  switch (action) {
    case 'Increase Signal Time':
      congestionReduction = 12 + Math.round(seededFactor(node.id + 'inc') * 8);
      densityChange = -8;
      officers = 2;
      drones = 1;
      travelMins = Math.max(3, travelMins - 4);
      break;
    case 'Reduce Signal Time':
      congestionReduction = -(6 + Math.round(seededFactor(node.id + 'red') * 6));
      densityChange = 6;
      officers = 3;
      drones = 1;
      travelMins = travelMins + 3;
      break;
    case 'Close Road':
      congestionReduction = -(15 + Math.round(seededFactor(node.id + 'close') * 10));
      densityChange = 20;
      officers = 6;
      drones = 2;
      travelMins = travelMins + 12;
      break;
    case 'Divert Traffic':
      congestionReduction = 18 + Math.round(seededFactor(node.id + 'div') * 10);
      densityChange = -18;
      officers = 4;
      drones = 2;
      travelMins = Math.max(3, travelMins - 7);
      break;
    case 'Increase Event Attendance':
      congestionReduction = -(20 + Math.round(seededFactor(node.id + 'event') * 15));
      densityChange = 25;
      officers = 8;
      drones = 3;
      travelMins = travelMins + 15;
      break;
  }

  const predictedDensity = Math.max(5, Math.min(100, node.density + densityChange));

  return {
    congestionReduction,
    travelTime: `${travelMins} min`,
    trafficDensity: predictedDensity,
    requiredOfficers: officers,
    requiredDrones: drones,
  };
}

export const ROAD_LINKS_METADATA: Record<string, RoadLinkMetadata> = {
  'mavoor-bus_stand': {
    name: 'Mavoor Road (Outer)',
    type: 'Arterial Corridor',
    lengthKm: 0.9,
    healthId: 'mavoor-road',
    baseSpeed: 50,
  },
  'bus_stand-arayidathupalam': {
    name: 'Mavoor Road (Middle)',
    type: 'Arterial Corridor',
    lengthKm: 0.7,
    healthId: 'bus-stand-approach',
    baseSpeed: 50,
  },
  'bus_stand-stadium': {
    name: 'Rajaji Road',
    type: 'Primary Collector',
    lengthKm: 0.5,
    healthId: 'bus-stand-approach',
    baseSpeed: 40,
  },
  'arayidathupalam-midtown': {
    name: 'Mini Bypass Road (North)',
    type: 'Bypass Expressway',
    lengthKm: 0.8,
    healthId: 'mini-bypass',
    baseSpeed: 60,
  },
  'stadium-mananchira': {
    name: 'Pavamani Road',
    type: 'Primary Collector',
    lengthKm: 0.6,
    healthId: 'stadium-corridor',
    baseSpeed: 45,
  },
  'stadium-poonthanam': {
    name: 'Rammohan Road',
    type: 'Primary Collector',
    lengthKm: 0.45,
    healthId: 'stadium-corridor',
    baseSpeed: 45,
  },
  'stadium-midtown': {
    name: 'Puthiyara Road',
    type: 'City Link Road',
    lengthKm: 0.55,
    healthId: 'stadium-corridor',
    baseSpeed: 40,
  },
  'midtown-east_bypass': {
    name: 'Mini Bypass Road (South)',
    type: 'Bypass Expressway',
    lengthKm: 0.7,
    healthId: 'mini-bypass',
    baseSpeed: 60,
  },
  'east_bypass-poonthanam': {
    name: 'Poonthanam Link Road',
    type: 'City Link Road',
    lengthKm: 0.6,
    healthId: 'mini-bypass',
    baseSpeed: 40,
  },
  'poonthanam-palayam': {
    name: 'M.M Ali Road',
    type: 'Arterial Corridor',
    lengthKm: 0.45,
    healthId: 'palayam-road',
    baseSpeed: 50,
  },
  'palayam-mananchira': {
    name: 'Bank Road',
    type: 'Primary Collector',
    lengthKm: 0.65,
    healthId: 'palayam-road',
    baseSpeed: 45,
  },
  'mavoor-mananchira': {
    name: 'Mavoor Road (Inner)',
    type: 'Arterial Corridor',
    lengthKm: 0.85,
    healthId: 'mavoor-road',
    baseSpeed: 50,
  },
};
