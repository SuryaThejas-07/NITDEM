import { AnimatePresence, motion } from 'framer-motion';
import { Siren, X } from 'lucide-react';
import type { Notification } from '../../types';
import { linkToRoadMap } from '../../hooks/linkMaps';

interface ToastStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onViewToken?: (tokenId: string) => void;
  onNotificationClick?: (n: Notification) => void;
}

export default function ToastStack({ notifications, onDismiss, onNotificationClick }: ToastStackProps) {
  return (
    <div className="fixed bottom-6 left-6 z-[9999] space-y-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => {
          const roadName = n.linkId ? (linkToRoadMap[n.linkId]?.roadName || n.linkId) : 'General Corridor';
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -80, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              onClick={() => {
                if (onNotificationClick) onNotificationClick(n);
              }}
              className="group pointer-events-auto relative overflow-hidden rounded-md border border-orange-500/20 backdrop-blur-xl px-2.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer hover:border-orange-500/40 hover:shadow-[0_0_10px_rgba(249,115,22,0.15)] transition-all select-none scale-100 hover:scale-[1.01] duration-300 w-64"
              style={{ 
                background: 'linear-gradient(135deg, rgba(20, 24, 33, 0.95) 0%, rgba(10, 12, 16, 0.98) 100%)',
                boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Left indicator accent line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]" />

              <div className="flex items-center gap-2 min-w-0 z-10 pl-1">
                <div className="w-5.5 h-5.5 rounded bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Siren className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                </div>
                <span className="text-[11px] font-sans font-bold text-gray-100 truncate leading-none" title={`Alert - ${roadName}`}>
                  Alert - {roadName}
                </span>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(n.id);
                }} 
                className="text-gray-500 hover:text-white transition-all shrink-0 p-0.5 rounded hover:bg-white/5 z-10"
                title="Remove Notification"
              >
                <X className="w-3 h-3 transition-transform group-hover:rotate-90 duration-300" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
