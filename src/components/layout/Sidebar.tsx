import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, LayoutDashboard, BarChart3, TrendingUp, AlertTriangle,
  Plane, Clock, Zap, FileText, LogOut, Shield, ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import type { Page } from '../../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  incidentCount: number;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'map', label: 'Command Map', icon: Map },
  { page: 'analytics', label: 'AI Analytics', icon: BarChart3 },
  { page: 'forecasting', label: 'Traffic Forecasting', icon: TrendingUp },
  { page: 'incidents', label: 'Incident Center', icon: AlertTriangle },
  { page: 'events', label: 'Event Planning Center', icon: Calendar },
  { page: 'drones', label: 'Drone Operations', icon: Plane },
  { page: 'history', label: 'Historical Intel', icon: Clock },
  { page: 'alerts', label: 'Alert Generator', icon: Zap },
  { page: 'reports', label: 'Reports', icon: FileText },
];

export default function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onToggle, incidentCount }: SidebarProps) {
  return (
    <>
      <motion.aside
        animate={{ width: isOpen ? 220 : 60 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative h-full flex flex-col border-r border-white/[0.06] overflow-hidden shrink-0"
        style={{ background: '#0F1117' }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center border-b border-white/[0.06] px-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-orange-400" />
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-bold font-mono text-white tracking-widest">NIT DEM</div>
                  <div className="text-[9px] text-orange-400/60 tracking-wider">COMMAND CENTER</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          {NAV_ITEMS.map(({ page, label, icon: Icon }) => {
            const isActive = currentPage === page;
            const badge = page === 'incidents' ? incidentCount : undefined;
            return (
              <motion.button
                key={page}
                onClick={() => onNavigate(page)}
                whileHover={{ x: 2 }}
                className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all text-left relative group ${
                  isActive
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-400 rounded-r"
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-medium whitespace-nowrap flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {badge !== undefined && badge > 0 && (
                  <AnimatePresence>
                    {isOpen ? (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="text-[9px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0"
                      >
                        {badge}
                      </motion.span>
                    ) : (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/[0.06] p-2 space-y-1 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-medium"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1C202B] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-white transition-colors z-10"
        >
          {isOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </motion.aside>
    </>
  );
}
