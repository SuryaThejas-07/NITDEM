import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, AlertCircle, X, Hash } from 'lucide-react';
import type { Notification } from '../../types';

interface ToastStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onViewToken?: (tokenId: string) => void;
}

const ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  success: CheckCircle,
  info: Info,
};

const COLORS = {
  critical: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
  warning: { border: 'border-orange-500/30', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  success: { border: 'border-green-500/30', bg: 'bg-green-500/10', text: 'text-green-400' },
  info: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

export default function ToastStack({ notifications, onDismiss, onViewToken }: ToastStackProps) {
  return (
    <div className="fixed top-16 right-4 z-[100] space-y-2 w-80 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => {
          const Icon = ICONS[n.type];
          const c = COLORS[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`rounded-xl border ${c.border} ${c.bg} backdrop-blur-md p-3 pointer-events-auto relative overflow-hidden`}
              style={{ background: 'rgba(15,17,23,0.92)' }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${c.bg.replace('/10', '')}`} />
              <div className="flex items-start gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${c.text}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-mono font-bold tracking-wider ${c.text}`}>{n.title}</div>
                  <div className="text-xs text-gray-300 mt-0.5">{n.message}</div>
                  {n.tokenId && (
                    <button
                      onClick={() => onViewToken?.(n.tokenId!)}
                      className={`flex items-center gap-1 mt-1.5 text-[10px] font-mono ${c.text} hover:underline`}>
                      <Hash className="w-3 h-3" /> View Token
                    </button>
                  )}
                </div>
                <button onClick={() => onDismiss(n.id)} className="text-gray-500 hover:text-white transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
