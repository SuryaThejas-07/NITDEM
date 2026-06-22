import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, MapPin, Hash, Clock, Radio } from 'lucide-react';
import MiniMapPreview from './MiniMapPreview';
import type { Incident, Token } from '../../types';
import { formatRelative, formatTime, priorityBadgeClass } from '../../utils';

interface Props {
  incidents: Incident[];
  tokens: Token[];
}

const PRIORITY: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
// max simultaneously visible per severity
const LIMITS: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 1 };
const TOTAL_CAP = 4;
// auto-dismiss after (ms) — critical sticks longer
const TTL: Record<string, number> = { critical: 20000, high: 14000, medium: 10000, low: 8000 };

const COLORS: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  critical: { border: 'border-red-500/50', bg: 'bg-red-500/15', text: 'text-red-400', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.35)]' },
  high: { border: 'border-orange-500/50', bg: 'bg-orange-500/15', text: 'text-orange-400', glow: 'shadow-[0_0_18px_rgba(249,115,22,0.3)]' },
  medium: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/15', text: 'text-yellow-400', glow: '' },
  low: { border: 'border-green-500/40', bg: 'bg-green-500/15', text: 'text-green-400', glow: '' },
};

export default function IncidentAlerts({ incidents, tokens }: Props) {
  // ignore incidents that already existed when this mounted (don't pop on page switch)
  const initialIds = useRef<Set<string>>(new Set(incidents.map(i => i.id)));
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Incident | null>(null);

  // schedule auto-dismiss for new incidents
  const scheduled = useRef<Set<string>>(new Set());
  useEffect(() => {
    incidents.forEach(inc => {
      if (initialIds.current.has(inc.id)) return;
      if (scheduled.current.has(inc.id)) return;
      scheduled.current.add(inc.id);
      const ttl = TTL[inc.priority] ?? 10000;
      setTimeout(() => {
        setDismissed(prev => {
          if (prev.has(inc.id)) return prev;
          const next = new Set(prev);
          next.add(inc.id);
          return next;
        });
      }, ttl);
    });
  }, [incidents]);

  const dismiss = (id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // pool of poppable incidents = new since mount AND not dismissed
  const pool = incidents
    .filter(i => !initialIds.current.has(i.id) && !dismissed.has(i.id))
    .sort((a, b) => {
      const pa = PRIORITY[a.priority] ?? 99;
      const pb = PRIORITY[b.priority] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const perSev: Record<string, number> = {};
  const visible: Incident[] = [];
  for (const inc of pool) {
    const cap = LIMITS[inc.priority] ?? 1;
    perSev[inc.priority] = (perSev[inc.priority] || 0) + 1;
    if (perSev[inc.priority] > cap) continue;
    visible.push(inc);
    if (visible.length >= TOTAL_CAP) break;
  }

  const selectedToken = selected ? tokens.find(t => t.id === selected.tokenId) : null;

  return (
    <>
      {/* Floating alert stack — top-left of map, above leaflet panes */}
      <div className="absolute top-3 left-3 z-[600] w-[280px] sm:w-[320px] space-y-2 pointer-events-none">
        <AnimatePresence>
          {visible.map(inc => {
            const c = COLORS[inc.priority] ?? COLORS.medium;
            return (
              <motion.button
                key={inc.id}
                layout
                initial={{ opacity: 0, x: -40, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={() => setSelected(inc)}
                className={`pointer-events-auto w-full text-left rounded-xl border ${c.border} ${c.glow} backdrop-blur-md p-3 relative overflow-hidden hover:scale-[1.02] transition-transform`}
                style={{ background: 'rgba(15,17,23,0.94)' }}
              >
                {/* pulse strip for critical */}
                {inc.priority === 'critical' && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <AlertTriangle className={`w-3.5 h-3.5 ${c.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] font-mono font-bold tracking-wider ${c.text}`}>
                        {inc.priority.toUpperCase()} INCIDENT
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{formatTime(inc.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-0.5 truncate">{inc.type}</div>
                    <div className="text-[10px] text-gray-400 truncate">📍 {inc.location}</div>
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-mono text-orange-400">
                      <Hash className="w-2.5 h-2.5" />{inc.tokenId}
                      <span className="text-gray-500 ml-auto">Tap for details →</span>
                    </div>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); dismiss(inc.id); }}
                    className="text-gray-500 hover:text-white transition-colors shrink-0 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail modal — token + mini map */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0F1117] max-h-[90vh] overflow-y-auto"
            >
              <div className={`h-1 ${selected.priority === 'critical' ? 'bg-red-500' : selected.priority === 'high' ? 'bg-orange-500' : selected.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${priorityBadgeClass(selected.priority)}`}>
                        {selected.priority.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/20 flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" />{selected.tokenId}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{formatRelative(selected.timestamp)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{selected.type}</h3>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {selected.location}
                    </p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mini map */}
                {selected.lat && selected.lng ? (
                  <MiniMapPreview
                    lat={selected.lat}
                    lng={selected.lng}
                    height={200}
                    label={selected.nearestJunction ? `Near ${selected.nearestJunction}` : 'Incident Location'}
                    color={selected.priority === 'critical' ? '#EF4444' : '#F97316'}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-white/[0.08] p-4 text-center text-[11px] font-mono text-gray-500">
                    No precise location attached to this incident
                  </div>
                )}

                {/* Description */}
                <div>
                  <div className="text-[9px] font-mono text-gray-500 tracking-widest uppercase mb-1">Description</div>
                  <p className="text-xs text-gray-300 leading-relaxed">{selected.description}</p>
                </div>

                {/* Token panel */}
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-orange-400">
                    <Radio className="w-3 h-3" /> DISPATCH TOKEN
                  </div>
                  {selectedToken ? (
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div><span className="text-gray-500">ID:</span> <span className="text-white">{selectedToken.id}</span></div>
                      <div><span className="text-gray-500">Status:</span> <span className="text-white uppercase">{selectedToken.status}</span></div>
                      <div><span className="text-gray-500">Type:</span> <span className="text-white">{selectedToken.type}</span></div>
                      <div><span className="text-gray-500">Priority:</span> <span className="text-white uppercase">{selectedToken.priority}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">By:</span> <span className="text-white">{selectedToken.generatedBy}</span></div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-gray-500">Token {selected.tokenId}</div>
                  )}
                </div>

                {selected.affectedRoads && selected.affectedRoads.length > 0 && (
                  <div>
                    <div className="text-[9px] font-mono text-gray-500 tracking-widest uppercase mb-1">Affected Roads</div>
                    <div className="flex flex-wrap gap-1">
                      {selected.affectedRoads.map(r => (
                        <span key={r} className="text-[9px] bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded px-1.5 py-0.5 font-mono">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { dismiss(selected.id); setSelected(null); }}
                  className="w-full py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-gray-300 hover:bg-white/[0.08] transition-all"
                >
                  Dismiss Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}