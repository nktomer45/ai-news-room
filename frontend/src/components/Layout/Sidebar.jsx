import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Newspaper, 
  Settings, 
  TrendingUp,
  Activity,
  LogOut,
  Zap,
  LayoutGrid,
  Radio
} from 'lucide-react';
import { articleApi, pipelineApi } from '../../api/articles';
import { useAuth } from '../../context/AuthContext';

/**
 * Sidebar Component
 * Manages navigation, user status, and auto-mode progress.
 */
const Sidebar = ({ isOpen }) => {
  const [stats, setStats] = useState({ all: 0, published: 0 });
  const [activeRuns, setActiveRuns] = useState([]);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch for stats
    const fetchStats = async () => {
      try {
        const data = await articleApi.getStats();
        if (data) setStats(data);
      } catch (err) {
        console.error('Sidebar Stats Error:', err);
      }
    };

    fetchStats();
    
    // Subscribe to real-time pipeline updates
    const eventSource = new EventSource(pipelineApi.streamUrl());
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data)) {
          // Filter for currently active runs only
          const running = data.filter(run => ['running', 'paused'].includes(run.status));
          setActiveRuns(running);
          // Refresh stats if something finished
          if (data.some(run => run.status === 'completed')) fetchStats();
        }
      } catch (e) {
        console.error('SSE Parse Error:', e);
      }
    };

    const interval = setInterval(fetchStats, 60000);
    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Fetch Trends', icon: Radio, path: '/fetch-trends' },
    { name: 'Articles', icon: Newspaper, path: '/articles' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Calculate global summary across all active runs
  const totalArticles = activeRuns.reduce((acc, run) => acc + (run.summary?.total || 0), 0);
  const doneArticles = activeRuns.reduce((acc, run) => {
    const summary = run.summary || { done: 0, failed: 0, cancelled: 0 };
    return acc + (summary.done + summary.failed + summary.cancelled);
  }, 0);
  
  // Calculate percentage correctly: if total is 10 and we are starting, progress is 0. 
  // If we are halfway through, it should be reflected.
  const totalProgress = totalArticles > 0 ? Math.min((doneArticles / totalArticles) * 100, 100) : 0;
  
  // Check if any run is strictly 'running' or 'paused'
  const isAnyActive = activeRuns.length > 0;

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[#0a0a0a] border-r border-white/5 z-50 flex flex-col pt-8 overflow-y-auto no-scrollbar shadow-2xl">
      {/* Brand Branding */}
      <div className="px-6 mb-12 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <LayoutGrid className="h-5 w-5 text-[#0a0a0a]" strokeWidth={2.5} />
        </div>
        <div>
           <h2 className="font-black text-white text-[13px] tracking-[0.2em] uppercase leading-none mb-1">NEWSROOM</h2>
           <p className="text-[10px] text-brand-500/60 font-black tracking-widest uppercase">AI CMS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-black text-[13px] group uppercase tracking-widest
              ${isActive ? 'bg-white/5 text-brand-500 shadow-sm border border-white/5' : 'text-[#444444] hover:text-slate-300 hover:bg-white/5'}
            `}
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Auto Mode Widget - Now Real-Time Tracker */}
      <div className="p-6 mx-3 mb-8 rounded-[32px] bg-[#111111]/40 border border-white/5 space-y-5">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isAnyActive ? 'bg-brand-500/20' : 'bg-white/5'}`}>
            <Zap className={`h-4 w-4 ${isAnyActive ? 'text-brand-500 fill-brand-500/20 animate-pulse' : 'text-slate-600'}`} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Live Pipeline</h4>
            <p className="text-[9px] font-bold text-[#444444] uppercase tracking-tighter truncate">
              {isAnyActive ? `${activeRuns.length} Active Run(s)` : 'System Standby'}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${totalProgress}%` }}
               transition={{ duration: 1, ease: "easeOut" }}
               className={`h-full rounded-full ${isAnyActive ? 'bg-brand-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-800'}`}
             ></motion.div>
           </div>
           <div className="flex justify-between items-center px-0.5">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                {isAnyActive ? `${doneArticles}/${totalArticles} topics processed` : `Last Sync: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
              </p>
              {isAnyActive && (
                <Link to="/fetch-trends" className="text-[9px] text-brand-500 font-black uppercase hover:underline">
                   View
                </Link>
              )}
           </div>
        </div>
      </div>

      {/* Session Card */}
      <div className="px-3 mb-6">
        <div className="p-4 rounded-[28px] bg-white/[0.02] border border-white/5 flex items-center justify-between gap-2">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-500 text-[#0a0a0a] flex items-center justify-center font-black text-xs">
                {user?.username?.charAt(0).toUpperCase() || 'O'}
              </div>
              <div className="min-w-0">
                 <p className="text-[11px] font-black text-white truncate">{user?.username || 'Operator'}</p>
                 <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
           >
             <LogOut className="h-4 w-4" />
           </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
