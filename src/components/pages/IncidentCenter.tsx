import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Plus, X, CheckCircle, Clock, Hash, MapPin, Crosshair, Edit2, Save } from 'lucide-react';
import type { Incident, UserRole } from '../../types';
import { formatRelative, priorityBadgeClass } from '../../utils';
import LocationPicker from '../map/LocationPicker';
import MiniMapPreview from '../map/MiniMapPreview';

interface IncidentCenterProps {
  incidents: Incident[];
  onLogIncident: (data: Omit<Incident, 'id' | 'timestamp' | 'tokenId' | 'status'>) => void;
  currentRole: UserRole;
  onUpdateIncidentStatus: (id: string, status: Incident['status']) => void;
  onUpdateIncident: (id: string, updates: Partial<Incident>) => void;
}

const INCIDENT_TYPES = ['Road Accident', 'Road Block', 'Vehicle Breakdown', 'Congestion Alert', 'Flooding', 'Traffic Signal Failure', 'VIP Movement', 'Other'];
const LOCATIONS = ['Stadium Junction', 'Mavoor Road', 'Palayam', 'KSRTC Bus Stand', 'Mini Bypass', 'Custom'];

interface SelectedLocation {
  lat: number;
  lng: number;
  nearestJunction: string;
  affectedRoads: string[];
}

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function IncidentCenter({ incidents, onLogIncident, currentRole, onUpdateIncidentStatus, onUpdateIncident }: IncidentCenterProps) {
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [form, setForm] = useState({ type: INCIDENT_TYPES[0], location: LOCATIONS[0], priority: 'high' as const, description: '' });
  const [selectedLoc, setSelectedLoc] = useState<SelectedLocation | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [roleWarningId, setRoleWarningId] = useState<string | null>(null);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [isEditingView, setIsEditingView] = useState(false);
  const [editForm, setEditForm] = useState<{ type: string; location: string; priority: Incident['priority']; description: string }>({ type: '', location: '', priority: 'high', description: '' });
  const [editPicker, setEditPicker] = useState(false);
  const [editLoc, setEditLoc] = useState<SelectedLocation | null>(null);

  const alertRoleWarning = (id: string) => {
    setRoleWarningId(id);
    setTimeout(() => {
      setRoleWarningId(prev => prev === id ? null : prev);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogIncident({
      ...form,
      priority: form.priority as any,
      lat: selectedLoc?.lat,
      lng: selectedLoc?.lng,
      nearestJunction: selectedLoc?.nearestJunction,
      affectedRoads: selectedLoc?.affectedRoads,
    });
    setSubmitted(form.location);
    setTimeout(() => {
      setShowModal(false);
      setSubmitted(null);
      setForm({ type: INCIDENT_TYPES[0], location: LOCATIONS[0], priority: 'high', description: '' });
      setSelectedLoc(null);
    }, 2500);
  };

  const allIncidents = [...incidents].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const openViewer = (inc: Incident) => {
    setViewingIncident(inc);
    setIsEditingView(false);
    setEditForm({ type: inc.type, location: inc.location, priority: inc.priority, description: inc.description });
    setEditLoc(inc.lat && inc.lng ? { lat: inc.lat, lng: inc.lng, nearestJunction: inc.nearestJunction || '', affectedRoads: inc.affectedRoads || [] } : null);
  };

  const saveEdits = () => {
    if (!viewingIncident) return;
    onUpdateIncident(viewingIncident.id, {
      type: editForm.type,
      location: editForm.location,
      priority: editForm.priority,
      description: editForm.description,
      lat: editLoc?.lat ?? viewingIncident.lat,
      lng: editLoc?.lng ?? viewingIncident.lng,
      nearestJunction: editLoc?.nearestJunction ?? viewingIncident.nearestJunction,
      affectedRoads: editLoc?.affectedRoads ?? viewingIncident.affectedRoads,
    });
    setViewingIncident({
      ...viewingIncident,
      type: editForm.type,
      location: editForm.location,
      priority: editForm.priority,
      description: editForm.description,
      lat: editLoc?.lat ?? viewingIncident.lat,
      lng: editLoc?.lng ?? viewingIncident.lng,
      nearestJunction: editLoc?.nearestJunction ?? viewingIncident.nearestJunction,
      affectedRoads: editLoc?.affectedRoads ?? viewingIncident.affectedRoads,
    });
    setIsEditingView(false);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Incident Center</h1>
          <p className="text-[11px] text-gray-500 font-mono">{allIncidents.filter(i => i.status === 'active').length} active · {allIncidents.length} total</p>
        </div>
      </div>

      {/* Incident list */}
      <div className="space-y-2">
        {allIncidents.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No incidents logged</p>
          </div>
        ) : allIncidents.map((incident, i) => (
          <motion.div key={incident.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => openViewer(incident)}
            className={`bg-[#0F1117] border rounded-xl p-4 flex items-start gap-4 transition-all cursor-pointer hover:border-orange-500/40 ${
              incident.status === 'declined' ? 'opacity-40 border-gray-800' :
              incident.status === 'active' ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]' :
              incident.status === 'pending' ? 'border-yellow-500/20' : 'border-white/[0.06]'
            }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              incident.priority === 'critical' ? 'bg-red-500/20' : incident.priority === 'high' ? 'bg-orange-500/20' : 'bg-yellow-500/20'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${
                incident.priority === 'critical' ? 'text-red-400' : incident.priority === 'high' ? 'text-orange-400' : 'text-yellow-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-sm font-semibold text-white ${incident.status === 'declined' ? 'line-through' : ''}`}>{incident.type}</span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${priorityBadgeClass(incident.priority)}`}>
                  {incident.priority.toUpperCase()}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                  incident.status === 'active' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  incident.status === 'resolved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  incident.status === 'declined' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {incident.status.toUpperCase()}
                </span>
              </div>
              <p className={`text-xs text-gray-400 mb-2 ${incident.status === 'declined' ? 'line-through' : ''}`}>{incident.description}</p>
              <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 flex-wrap">
                <span>📍 {incident.location}</span>
                {incident.lat && incident.lng && (
                  <span className="text-cyan-400">{incident.lat.toFixed(4)}°N, {incident.lng.toFixed(4)}°E</span>
                )}
                {incident.nearestJunction && (
                  <span className="text-orange-400">Near: {incident.nearestJunction}</span>
                )}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelative(incident.timestamp)}</span>
                <span className="flex items-center gap-1 text-orange-400"><Hash className="w-3 h-3" />{incident.tokenId}</span>
              </div>

              {incident.status === 'pending' && (
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/[0.04] pt-3 flex-wrap">
                  <span className="text-[10px] font-mono text-yellow-400 flex items-center gap-1">
                    ⚠️ Awaiting Supervisor Validation
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentRole === 'supervisor') {
                          onUpdateIncidentStatus(incident.id, 'active');
                        } else {
                          alertRoleWarning(incident.id);
                        }
                      }}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase font-bold transition-all ${
                        currentRole === 'supervisor'
                          ? 'bg-green-500 hover:bg-green-600 text-black shadow-[0_0_8px_rgba(34,197,94,0.3)]'
                          : 'bg-white/[0.02] text-gray-500 border border-white/[0.04] cursor-not-allowed hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      }`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentRole === 'supervisor') {
                          onUpdateIncidentStatus(incident.id, 'declined');
                        } else {
                          alertRoleWarning(incident.id);
                        }
                      }}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase font-bold transition-all ${
                        currentRole === 'supervisor'
                          ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                          : 'bg-white/[0.02] text-gray-500 border border-white/[0.04] cursor-not-allowed hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}

              {roleWarningId === incident.id && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] font-mono text-red-400 mt-2 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-1 flex items-center gap-1.5">
                  🛑 ACCESS DENIED: Requires Supervisor (L3) elevation to validate dispatch tokens.
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating log button */}
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full font-mono text-sm font-bold shadow-lg"
        style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white' }}
        animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0.4)', '0 0 20px rgba(239,68,68,0.4)', '0 0 0px rgba(239,68,68,0.4)'] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Log Incident</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0F1117]">
              <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
              <div className="p-6">
                {submitted ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-6">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 3, duration: 0.4 }}>
                      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    </motion.div>
                    <div className="text-red-400 font-mono font-bold text-lg mb-1">CRITICAL ALERT</div>
                    <div className="text-white font-semibold mb-1">{form.type} Logged</div>
                    <div className="text-gray-400 text-sm">Dispatching Units to {submitted}</div>
                    <div className="text-orange-400 font-mono text-sm mt-2">Token Generated ✓</div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-base font-bold text-white">Log Incident</div>
                        <div className="text-[10px] text-gray-500 font-mono">Creates an intelligence token</div>
                      </div>
                      <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {[
                      { label: 'Incident Type', key: 'type', options: INCIDENT_TYPES },
                      { label: 'Location', key: 'location', options: LOCATIONS },
                      { label: 'Priority', key: 'priority', options: ['low', 'medium', 'high', 'critical'] },
                    ].map(({ label, key, options }) => (
                      <div key={key}>
                        <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">{label}</label>
                        <select
                          value={(form as any)[key]}
                          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50 transition-all"
                        >
                          {options.map(o => <option key={o} value={o} className="bg-[#151820]">{o}</option>)}
                        </select>
                      </div>
                    ))}

                    <div>
                      <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the incident..."
                        rows={3}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                        required
                      />
                    </div>

                    {/* Smart location selection */}
                    <div>
                      <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">Precise Location (Optional)</label>
                      <button
                        type="button"
                        onClick={() => setShowPicker(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-orange-500/30 text-orange-400 text-xs font-mono hover:bg-orange-500/10 transition-all"
                      >
                        <Crosshair className="w-3.5 h-3.5" /> Select Incident Location
                      </button>

                      {selectedLoc && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          className="mt-2 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06] space-y-1.5">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-white">
                            <MapPin className="w-3 h-3 text-orange-400" />
                            {selectedLoc.lat.toFixed(5)}°N, {selectedLoc.lng.toFixed(5)}°E
                          </div>
                          <div className="text-[10px] font-mono text-gray-400">
                            Nearest Junction: <span className="text-orange-400">{selectedLoc.nearestJunction}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedLoc.affectedRoads.map(r => (
                              <span key={r} className="text-[9px] bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded px-1.5 py-0.5">{r}</span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-lg font-mono text-sm font-bold tracking-wider"
                      style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white' }}>
                      Submit & Generate Token
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location picker */}
      <AnimatePresence>
        {showPicker && (
          <LocationPicker
            onClose={() => setShowPicker(false)}
            onConfirm={(data) => setSelectedLoc(data)}
          />
        )}
      </AnimatePresence>

      {/* Edit-location picker */}
      <AnimatePresence>
        {editPicker && (
          <LocationPicker
            initialLat={editLoc?.lat ?? viewingIncident?.lat}
            initialLng={editLoc?.lng ?? viewingIncident?.lng}
            onClose={() => setEditPicker(false)}
            onConfirm={(data) => setEditLoc(data)}
          />
        )}
      </AnimatePresence>

      {/* View / Edit incident modal */}
      <AnimatePresence>
        {viewingIncident && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setViewingIncident(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0F1117] max-h-[92vh] overflow-y-auto"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-white">{isEditingView ? 'Edit Incident' : 'Incident Details'}</div>
                    <div className="text-[10px] text-gray-500 font-mono">Token {viewingIncident.tokenId} · {formatRelative(viewingIncident.timestamp)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditingView && (
                      <button onClick={() => setIsEditingView(true)} className="text-orange-400 hover:text-orange-300 text-[10px] font-mono flex items-center gap-1 border border-orange-500/30 rounded px-2 py-1">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    )}
                    <button onClick={() => setViewingIncident(null)} className="text-gray-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Map preview */}
                {(editLoc?.lat || viewingIncident.lat) && (editLoc?.lng || viewingIncident.lng) ? (
                  <MiniMapPreview
                    lat={editLoc?.lat ?? viewingIncident.lat!}
                    lng={editLoc?.lng ?? viewingIncident.lng!}
                    label={editLoc?.nearestJunction || viewingIncident.nearestJunction || viewingIncident.location}
                    color={viewingIncident.priority === 'critical' ? '#EF4444' : viewingIncident.priority === 'high' ? '#F97316' : '#EAB308'}
                  />
                ) : (
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 text-center text-[11px] text-gray-500 font-mono">
                    No precise location pinned · {viewingIncident.location}
                  </div>
                )}

                {!isEditingView ? (
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{viewingIncident.type}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border ${priorityBadgeClass(viewingIncident.priority)}`}>{viewingIncident.priority.toUpperCase()}</span>
                      <span className="text-[9px] text-gray-400 bg-white/[0.04] border border-white/[0.06] rounded px-2 py-0.5">{viewingIncident.status.toUpperCase()}</span>
                    </div>
                    <div className="text-gray-300">{viewingIncident.description}</div>
                    <div className="flex items-center gap-3 text-gray-500 flex-wrap">
                      <span>📍 {viewingIncident.location}</span>
                      {viewingIncident.lat && viewingIncident.lng && (
                        <span className="text-cyan-400">{viewingIncident.lat.toFixed(4)}°N, {viewingIncident.lng.toFixed(4)}°E</span>
                      )}
                      {viewingIncident.nearestJunction && <span className="text-orange-400">Near: {viewingIncident.nearestJunction}</span>}
                    </div>
                    {viewingIncident.affectedRoads && viewingIncident.affectedRoads.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {viewingIncident.affectedRoads.map(r => (
                          <span key={r} className="text-[9px] bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded px-1.5 py-0.5">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">Type</label>
                      <select value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50">
                        {INCIDENT_TYPES.map(o => <option key={o} value={o} className="bg-[#151820]">{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">Location</label>
                      <select value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50">
                        {[editForm.location, ...LOCATIONS.filter(l => l !== editForm.location)].map(o => <option key={o} value={o} className="bg-[#151820]">{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">Priority</label>
                      <select value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value as any }))}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50">
                        {['low', 'medium', 'high', 'critical'].map(o => <option key={o} value={o} className="bg-[#151820]">{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-gray-500 tracking-widest mb-1.5 uppercase">Description</label>
                      <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                        rows={3}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-orange-500/50 resize-none" />
                    </div>
                    <button type="button" onClick={() => setEditPicker(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-orange-500/30 text-orange-400 text-xs font-mono hover:bg-orange-500/10">
                      <Crosshair className="w-3.5 h-3.5" /> {editLoc || viewingIncident.lat ? 'Change Location on Map' : 'Pick Location on Map'}
                    </button>

                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setIsEditingView(false)}
                        className="flex-1 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-gray-300 text-xs font-mono uppercase hover:bg-white/[0.08]">
                        Cancel
                      </button>
                      <button type="button" onClick={saveEdits}
                        className="flex-1 py-2 rounded-lg text-xs font-mono uppercase font-bold flex items-center justify-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', color: 'white' }}>
                        <Save className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
