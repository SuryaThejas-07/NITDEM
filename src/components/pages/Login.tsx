import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, EyeOff, Cpu, Radio } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => boolean;
  onSuccess: () => void;
}

export default function Login({ onLogin, onSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise(r => setTimeout(r, 1200));
    if (onLogin(username, password)) {
      setStatus('success');
      await new Promise(r => setTimeout(r, 1500));
      onSuccess();
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center overflow-hidden relative">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(249,115,22,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      
      {/* Radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-orange-500/5 via-transparent to-transparent" 
        style={{ background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)' }} />

      {/* Scanning line animation */}
      <motion.div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent"
        animate={{ y: ['-100vh', '100vh'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Glass card */}
        <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{ background: 'rgba(15,17,23,0.9)', backdropFilter: 'blur(24px)' }}>
          
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          
          <div className="p-8">
            {/* Logo section */}
            <div className="flex flex-col items-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border border-orange-500/30 flex items-center justify-center mb-4 relative"
              >
                <div className="absolute inset-2 rounded-full border border-orange-500/20" />
                <Shield className="w-7 h-7 text-orange-400" />
              </motion.div>
              <div className="text-center">
                <div className="text-2xl font-bold tracking-widest text-white font-mono">NIT DEM</div>
                <div className="text-[10px] tracking-[0.25em] text-orange-400/80 mt-1 uppercase">
                  AI Traffic Intelligence Platform
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Radio className="w-3 h-3 text-green-400" />
                </motion.div>
                <span className="text-[10px] text-green-400 font-mono tracking-wider">SYSTEM ONLINE</span>
                <Cpu className="w-3 h-3 text-green-400" />
              </div>
            </div>

            {/* Auth form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-500 mb-2 uppercase">
                  Operator ID
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter operator ID"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-500 mb-2 uppercase">
                  Secure Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter passphrase"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all font-mono"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-mono">Authentication Failed — Access Denied</span>
                  </motion.div>
                )}
                {status === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"
                  >
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.4, repeat: 2 }}>
                      <Shield className="w-4 h-4 shrink-0" />
                    </motion.div>
                    <span className="text-xs font-mono">Identity Verified — Entering Command Center...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-lg font-mono text-sm font-semibold tracking-widest uppercase transition-all relative overflow-hidden"
                style={{
                  background: status === 'success'
                    ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                    : 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: 'white',
                  opacity: status === 'loading' ? 0.8 : 1,
                }}
              >
                {status === 'loading' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
                {status === 'loading' ? 'Authenticating...' : status === 'success' ? 'Access Granted' : 'Authenticate & Enter'}
              </motion.button>
            </form>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {['AES-256 Encrypted', 'ISO 27001', 'MHA Compliant'].map(label => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.05] rounded-lg py-2">
                  <div className="text-[9px] text-gray-500 font-mono">{label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        </div>

        <p className="text-center text-[10px] text-gray-600 font-mono mt-4 tracking-wider">
          NIT DEM v2.4.1 © 2025 Smart City Operations
        </p>
      </motion.div>
    </div>
  );
}
