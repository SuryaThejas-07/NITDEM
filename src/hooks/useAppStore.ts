import { useState, useEffect, useCallback } from 'react';
import type { Page, TrafficNode, Drone, Incident, Token, Notification, PlannedEvent, DroneAnomaly, SimulationResult, SimulationAction, PredictionWindow, UserRole } from '../types';
import { TRAFFIC_NODES, INITIAL_DRONES, SAMPLE_TOKENS, DRONE_ANOMALIES, runSimulation } from '../data/constants';

const STORAGE_KEY = 'nitdem_tokens';
const INCIDENTS_KEY = 'nitdem_incidents';
const EVENTS_KEY = 'nitdem_events';
const ANOMALIES_KEY = 'nitdem_anomalies';
const SIMULATIONS_KEY = 'nitdem_simulations';

function generateTokenId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `TK-${num}`;
}

export function useAppStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('map');
  const [selectedNode, setSelectedNode] = useState<TrafficNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>('alpha');
  const [currentRole, setCurrentRole] = useState<UserRole>('supervisor');

  const selectNode = useCallback((node: TrafficNode | null) => {
    setSelectedNode(node);
    if (node) setSelectedLink(null);
  }, []);

  const selectLink = useCallback((linkId: string | null) => {
    setSelectedLink(linkId);
    if (linkId) setSelectedNode(null);
  }, []);
  const [isDark, setIsDark] = useState(true);
  const [drones, setDrones] = useState<Drone[]>(INITIAL_DRONES);
  const [tokens, setTokens] = useState<Token[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : SAMPLE_TOKENS;
    } catch { return SAMPLE_TOKENS; }
  });
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const stored = localStorage.getItem(INCIDENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [events, setEvents] = useState<PlannedEvent[]>(() => {
    try {
      const stored = localStorage.getItem(EVENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [anomalies, setAnomalies] = useState<DroneAnomaly[]>(() => {
    try {
      const stored = localStorage.getItem(ANOMALIES_KEY);
      return stored ? JSON.parse(stored) : DRONE_ANOMALIES;
    } catch { return DRONE_ANOMALIES; }
  });
  const [simulations, setSimulations] = useState<SimulationResult[]>(() => {
    try {
      const stored = localStorage.getItem(SIMULATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [predictionWindow, setPredictionWindow] = useState<PredictionWindow>('current');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }, [tokens]);

  useEffect(() => {
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(ANOMALIES_KEY, JSON.stringify(anomalies));
  }, [anomalies]);

  useEffect(() => {
    localStorage.setItem(SIMULATIONS_KEY, JSON.stringify(simulations));
  }, [simulations]);

  // Drone movement simulation with collision avoidance
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setDrones(prev => prev.map(drone => {
        const target = TRAFFIC_NODES.find(n => n.id === drone.targetNodeId);
        const current = TRAFFIC_NODES.find(n => n.name === drone.location);
        if (!target || !current) return drone;

        // Collision avoidance logic
        const isHeadingToStadium = drone.targetNodeId === 'stadium';
        const otherDrone = prev.find(d => d.id !== drone.id);
        let shouldHold = false;

        if (isHeadingToStadium && otherDrone) {
          const otherAtStadium = otherDrone.location === 'Stadium Junction';
          const otherHeadingToStadium = otherDrone.targetNodeId === 'stadium';

          if (otherAtStadium) {
            shouldHold = true;
          } else if (otherHeadingToStadium) {
            const stadiumNode = TRAFFIC_NODES.find(n => n.id === 'stadium');
            if (stadiumNode) {
              const myDist = Math.sqrt((stadiumNode.lat - drone.lat) ** 2 + (stadiumNode.lng - drone.lng) ** 2);
              const otherDist = Math.sqrt((stadiumNode.lat - otherDrone.lat) ** 2 + (stadiumNode.lng - otherDrone.lng) ** 2);
              if (myDist > otherDist) {
                shouldHold = true;
              } else if (myDist === otherDist && drone.id === 'bravo') {
                shouldHold = true; // Alpha has priority if distance is identical
              }
            }
          }
        }

        if (shouldHold) {
          // Hovering: don't adjust lat/lng, drain battery slightly less
          return {
            ...drone,
            battery: Math.max(10, drone.battery - 0.005),
          };
        }

        const dlat = target.lat - drone.lat;
        const dlng = target.lng - drone.lng;
        const dist = Math.sqrt(dlat * dlat + dlng * dlng);

        if (dist < 0.001) {
          // Reached target, pick next target on the loop route or customRoute
          const isAlpha = drone.id === 'alpha';
          
          if (drone.customRoute && drone.customRoute.length > 0) {
            const currentIdx = drone.routeIndex !== undefined ? drone.routeIndex : 0;
            const nextIdx = (currentIdx + 1) % drone.customRoute.length;
            const nextTargetId = drone.customRoute[nextIdx];
            
            return {
              ...drone,
              location: target.name,
              lat: target.lat,
              lng: target.lng,
              targetNodeId: nextTargetId,
              routeIndex: nextIdx,
              battery: Math.max(10, drone.battery - 0.1),
            };
          } else {
            const route = isAlpha 
              ? ['stadium', 'mavoor', 'bus_stand', 'arayidathupalam'] 
              : ['mananchira', 'stadium', 'midtown', 'east_bypass', 'poonthanam', 'palayam'];
            
            const currentIdx = route.indexOf(drone.targetNodeId || '');
            const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % route.length;
            const nextTargetId = route[nextIdx];

            return {
              ...drone,
              location: target.name,
              lat: target.lat,
              lng: target.lng,
              targetNodeId: nextTargetId,
              battery: Math.max(10, drone.battery - 0.1),
            };
          }
        }

        return {
          ...drone,
          lat: drone.lat + dlat * 0.05,
          lng: drone.lng + dlng * 0.05,
          battery: Math.max(10, drone.battery - 0.02),
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const n: Notification = {
      ...notif,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [n, ...prev].slice(0, 10));
    setTimeout(() => {
      setNotifications(prev => prev.filter(x => x.id !== n.id));
    }, 8000);
  }, []);

  const createToken = useCallback((data: Omit<Token, 'id' | 'timestamp'>) => {
    const token: Token = {
      ...data,
      id: generateTokenId(),
      timestamp: new Date().toISOString(),
    };
    setTokens(prev => [token, ...prev]);
    addNotification({
      type: data.priority === 'critical' ? 'critical' : data.priority === 'high' ? 'warning' : 'info',
      title: `${data.priority.toUpperCase()} ALERT`,
      message: `Token ${token.id} Generated`,
      tokenId: token.id,
    });
    return token;
  }, [addNotification]);

  const logIncident = useCallback((data: Omit<Incident, 'id' | 'timestamp' | 'tokenId' | 'status'>) => {
    const token = createToken({
      type: data.type,
      priority: data.priority,
      location: data.location,
      status: 'pending',
      description: data.description,
      generatedBy: 'Operator: admin',
      lat: data.lat,
      lng: data.lng,
    });
    const incident: Incident = {
      ...data,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      tokenId: token.id,
      status: 'pending',
    };
    setIncidents(prev => [incident, ...prev]);
    return incident;
  }, [createToken]);

  const updateIncidentStatus = useCallback((id: string, status: Incident['status']) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        // Also update the associated token status
        setTokens(tPrev => tPrev.map(t => {
          if (t.id === inc.tokenId) {
            return {
              ...t,
              status: status === 'active' ? 'active' : status === 'declined' ? 'resolved' : 'pending'
            };
          }
          return t;
        }));

        // Twilio / SendGrid simulation alerts
        if (status === 'active' && (inc.priority === 'high' || inc.priority === 'critical')) {
          addNotification({
            type: 'success',
            title: 'TWILIO DISPATCH',
            message: `Emergency SMS broadcasted for ${inc.type} at ${inc.location}.`,
          });
          addNotification({
            type: 'info',
            title: 'SENDGRID DISPATCH',
            message: `Incident details email dispatched to emergency personnel.`,
          });
        }

        return { ...inc, status };
      }
      return inc;
    }));
  }, [addNotification]);

  const updateDroneRoute = useCallback((droneId: string, nodeIds: string[]) => {
    setDrones(prev => prev.map(d => {
      if (d.id === droneId) {
        return {
          ...d,
          customRoute: nodeIds,
          routeIndex: 0,
          targetNodeId: nodeIds[0] || d.targetNodeId
        };
      }
      return d;
    }));
  }, []);

  const createEvent = useCallback((data: Omit<PlannedEvent, 'id' | 'tokenId' | 'createdAt'>) => {
    const token = createToken({
      type: `Event: ${data.type}`,
      priority: data.priority,
      location: data.zoneName || `${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}`,
      status: 'pending',
      description: `${data.name} — ${data.description || 'No additional details'}. Expected attendance: ${data.expectedAttendance.toLocaleString()}.`,
      generatedBy: 'Operator: admin',
    });
    const event: PlannedEvent = {
      ...data,
      id: Math.random().toString(36).slice(2),
      tokenId: token.id,
      createdAt: new Date().toISOString(),
    };
    setEvents(prev => [event, ...prev]);
    return event;
  }, [createToken]);

  const logAnomaly = useCallback((data: Omit<DroneAnomaly, 'id' | 'timestamp' | 'tokenId'>) => {
    const token = createToken({
      type: `Drone Detection: ${data.type}`,
      priority: data.type === 'Accident' ? 'critical' : data.type === 'Road Block' ? 'high' : 'medium',
      location: data.location,
      status: 'active',
      description: `${data.droneName} detected ${data.type} near ${data.location} with ${data.confidence}% confidence.`,
      generatedBy: data.droneName,
    });
    const anomaly: DroneAnomaly = {
      ...data,
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      tokenId: token.id,
    };
    setAnomalies(prev => [anomaly, ...prev]);
    return anomaly;
  }, [createToken]);

  const runSimulationAction = useCallback((node: TrafficNode, action: SimulationAction) => {
    const result = runSimulation(node, action);
    const token = createToken({
      type: `Simulation: ${action}`,
      priority: result.congestionReduction < 0 ? 'high' : 'medium',
      location: node.name,
      status: 'resolved',
      description: `What-if simulation "${action}" on ${node.name}: ${result.congestionReduction >= 0 ? '+' : ''}${result.congestionReduction}% congestion change, travel time ${result.travelTime}, density ${result.trafficDensity}%.`,
      generatedBy: 'AI Simulation Engine',
    });
    const sim: SimulationResult = {
      action,
      nodeId: node.id,
      nodeName: node.name,
      congestionReduction: result.congestionReduction,
      travelTime: result.travelTime,
      trafficDensity: result.trafficDensity,
      requiredOfficers: result.requiredOfficers,
      requiredDrones: result.requiredDrones,
      tokenId: token.id,
      timestamp: new Date().toISOString(),
    };
    setSimulations(prev => [sim, ...prev]);
    return sim;
  }, [createToken]);

  const login = useCallback((username: string, password: string) => {
    return username === 'admin' && password === 'password';
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentPage('map');
    setSelectedNode(null);
    setSelectedLink(null);
    setSelectedDroneId('alpha');
    setCurrentRole('supervisor');
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    isAuthenticated, setIsAuthenticated,
    currentPage, setCurrentPage,
    selectedNode, setSelectedNode: selectNode,
    selectedLink, setSelectedLink: selectLink,
    selectedDroneId, setSelectedDroneId,
    currentRole, setCurrentRole,
    updateIncidentStatus,
    updateDroneRoute,
    isDark, setIsDark,
    drones,
    tokens, setTokens,
    incidents,
    notifications,
    sidebarOpen, setSidebarOpen,
    addNotification,
    createToken,
    logIncident,
    login,
    logout,
    dismissNotification,
    events,
    createEvent,
    anomalies,
    logAnomaly,
    simulations,
    runSimulationAction,
    predictionWindow,
    setPredictionWindow,
  };
}
