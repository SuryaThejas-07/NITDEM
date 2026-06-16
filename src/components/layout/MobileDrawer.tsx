import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import type { Page } from '../../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  incidentCount: number;
}

export default function MobileDrawer({ isOpen, onClose, currentPage, onNavigate, onLogout, incidentCount }: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden"
            style={{ zIndex: 9998 }}
          />
          <motion.div
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 md:hidden"
            style={{ zIndex: 9999 }}
          >
            <div className="relative h-full">
              <button onClick={onClose}
                className="absolute -right-3 top-3 w-6 h-6 rounded-full bg-[#1C202B] border border-white/[0.08] flex items-center justify-center text-gray-400 z-10">
                <X className="w-3 h-3" />
              </button>
              <Sidebar
                currentPage={currentPage}
                onNavigate={(p) => { onNavigate(p); onClose(); }}
                onLogout={onLogout}
                isOpen={true}
                onToggle={() => {}}
                incidentCount={incidentCount}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
