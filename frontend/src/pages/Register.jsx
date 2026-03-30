import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Mail, Lock, User, UserPlus, Sparkles, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin' // Default to admin for this CMS
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Initialization failed. Security protocol engaged.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
         <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[120px] rounded-full animate-pulse-slow"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse-slow delay-1000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg z-10"
      >
        <div className="glass p-12 rounded-[50px] border border-white/5 bg-[#111111]/80 backdrop-blur-2xl shadow-2xl relative">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="h-16 w-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <UserPlus className="h-8 w-8 text-brand-500" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase mb-3 leading-none italic">SECURE INITIALIZATION</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase">Register New Operator Identity</p>
          </div>

          {error && (
            <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#555555] px-1">Operator ID</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333333]" />
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="neeraj_k"
                    className="w-full h-14 bg-[#0d0d0d] border border-white/5 rounded-2xl pl-12 pr-4 text-white text-sm font-bold focus:border-brand-500/30 transition-all placeholder:text-[#222222]" required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#555555] px-1">Email Endpoint</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333333]" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="neeraj@newsroom.ai"
                    className="w-full h-14 bg-[#0d0d0d] border border-white/5 rounded-2xl pl-12 pr-4 text-white text-sm font-bold focus:border-brand-500/30 transition-all placeholder:text-[#222222]" required 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555555] px-1">Access Protocol (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#333333] group-focus-within:text-brand-500 transition-colors" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 8 characters encrypted"
                  className="w-full h-14 bg-[#0d0d0d] border border-white/5 rounded-2xl pl-12 pr-12 text-white text-sm font-bold focus:border-brand-500/30 transition-all placeholder:text-[#222222]" required 
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

            <button 
              disabled={loading}
              className="w-full h-16 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 text-[#0a0a0a] font-black rounded-2xl shadow-xl shadow-brand-500/10 flex items-center justify-center gap-4 transition-all hover:scale-[1.01] active:scale-[0.99] uppercase tracking-[0.2em] text-sm"
            >
              {loading ? <div className="h-6 w-6 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full animate-spin"></div> : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  Initialize Command 
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-[#444444]">
            Already an authorized operator? <Link to="/login" className="text-brand-500 hover:text-white transition-colors">Authorize Session</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
