import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Sun, Moon, User, Wifi, Activity } from 'lucide-react';
import { format } from 'date-fns';
import type { Notification } from '../../types';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  notifications: Notification[];
  onNotificationClick: (id: string) => void;
  unreadCount: number;
}

export default function Header({ isDark, onToggleTheme, notifications, unreadCount }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 border-b border-white/[0.06] flex items-center justify-between pl-12 pr-2 md:px-4 shrink-0 relative z-20 gap-2"
      style={{ background: '#0F1117' }}>
      
      {/* Left: Status indicators */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] font-mono text-green-400 tracking-wider">LIVE</span>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-gray-500">
          <Wifi className="w-3 h-3" />
          <span className="text-[10px] font-mono">KOZHIKODE NODE CLUSTER</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-gray-500">
          <Activity className="w-3 h-3" />
          <span className="text-[10px] font-mono">AI: ONLINE</span>
        </div>
      </div>

      {/* Center: Time — hidden on small screens */}
      <div className="hidden xl:block absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <div className="font-mono text-lg font-bold text-white tracking-widest">
          {format(time, 'HH:mm:ss')}
        </div>
        <div className="text-[9px] font-mono text-gray-500 tracking-wider">
          {format(time, 'EEE, dd MMM yyyy')} · IST
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <div className="hidden sm:block xl:hidden font-mono text-xs font-bold text-white tracking-wider mr-1">
          {format(time, 'HH:mm')}
        </div>
        <button onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/[0.2] transition-all shrink-0">
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-gray-400 hover:text-white hover:border-white/[0.2] transition-all relative">
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </motion.span>
            )}
          </button>

          {showNotifs && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-10 w-[calc(100vw-1rem)] max-w-xs sm:w-72 rounded-xl border border-white/[0.08] overflow-hidden z-50"
              style={{ background: '#151820' }}>
              <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">NOTIFICATIONS</span>
                <span className="text-[10px] text-orange-400">{notifications.length} active</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-600">No active notifications</div>
                ) : notifications.map(n => (
                  <div key={n.id} className="px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03]">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-mono font-bold ${
                        n.type === 'critical' ? 'text-red-400' :
                        n.type === 'warning' ? 'text-orange-400' :
                        n.type === 'success' ? 'text-green-400' : 'text-blue-400'
                      }`}>{n.title}</span>
                    </div>
                    <div className="text-xs text-gray-400">{n.message}</div>
                    {n.tokenId && <div className="text-[10px] text-orange-400 font-mono mt-0.5">→ {n.tokenId}</div>}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 md:px-3 py-1.5">
          <User className="w-3.5 h-3.5 text-orange-400" />
          <div>
            <div className="text-[10px] font-mono text-white font-semibold leading-tight">ADMIN</div>
            <div className="text-[9px] font-mono text-gray-500 leading-tight">Operator L3</div>
          </div>
        </div>
        <div className="sm:hidden w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-orange-400" />
        </div>
      </div>
    </header>
  );
}
