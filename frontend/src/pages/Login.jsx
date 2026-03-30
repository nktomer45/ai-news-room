import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Mail, Lock, LogIn, Sparkles, UserPlus, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(identity, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full animate-pulse-slow delay-1000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="glass p-10 rounded-[40px] border border-white/5 bg-[#111111]/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
          
          {/* Logo/Brand */}
          <div className="flex flex-col items-center mb-10">
            <div className="h-14 w-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-xl shadow-brand-500/20 mb-6">
              <LayoutGrid className="h-7 w-7 text-[#0a0a0a]" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">NEWSROOM</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">Control Center Access</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#444444] px-1">Operator Identity (Username/Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333333] group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type="text" 
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full h-14 bg-[#0d0d0d] border border-white/5 rounded-2xl pl-12 pr-4 text-white text-sm font-bold focus:border-brand-500/30 focus:outline-none transition-all placeholder:text-[#222222]" required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#444444] px-1">Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333333] group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-[#0d0d0d] border border-white/5 rounded-2xl pl-12 pr-12 text-white text-sm font-bold focus:border-brand-500/30 focus:outline-none transition-all placeholder:text-[#222222]" required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#333333] hover:text-brand-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
               <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="h-4 w-4 rounded border border-white/10 bg-[#0d0d0d] flex items-center justify-center group-hover:border-brand-500/50 transition-colors"></div>
                  <span className="text-[10px] font-black text-[#444444] uppercase tracking-wider">Keep Session</span>
               </label>
               <Link to="#" className="text-[10px] font-black text-brand-500 uppercase tracking-wider hover:text-white transition-colors">Recovery</Link>
            </div>

            <button 
              disabled={loading}
              className="w-full h-14 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-[#0a0a0a] font-black rounded-2xl shadow-xl shadow-brand-500/10 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
            >
              {loading ? <div className="h-5 w-5 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin"></div> : (
                <>
                  Authorizing Access 
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-[#333333]">
            Operational System v2.5 • <Link to="/register" className="text-brand-500 hover:text-white">Initialize New Command</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
