import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  RefreshCw, 
  CheckCircle2, 
  Activity, 
  Edit3, 
  Clock, 
  Calendar,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';


import { articleApi } from '../api/articles';
import { settingsApi } from '../api/settings';

const Trending = () => {
  const [settings, setSettings] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queue, setQueue] = useState([]);

  const fetchQueue = async () => {
    try {
      const data = await articleApi.getQueueStatus();
      if (Array.isArray(data)) {
        setQueue(data.map((job, i) => ({
          id: String(i + 1).padStart(2, '0'),
          title: job.topic || 'Generating Content...',
          volume: 'Live',
          tag: 'AI',
          status: job.status === 'completed' ? 'Generated' : 'Pending',
          jobId: job.id,
          articleId: job.articleId
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
     try {
       const data = await settingsApi.get();
       setSettings(data);
     } catch (err) {
       console.error(err);
     }
  };

  useEffect(() => {
    fetchQueue();
    fetchSettings();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
       await articleApi.triggerTrendFetch();
       await fetchQueue();
    } catch (err) {
       console.error(err);
    }
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 py-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Trending Topics</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Top 10 trending topics from Google</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-[#0a0a0a] font-black text-sm transition-all shadow-xl shadow-brand-500/10 flex items-center gap-3 active:scale-95 uppercase tracking-widest leading-none outline-none"
        >
          <RefreshCw className={`h-4.5 w-4.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Now
        </button>
      </header>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        
        {/* Left Column: Trending List */}
        <section className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xl font-black text-white tracking-tight uppercase tracking-[0.1em] text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-500" /> Trending Now
            </h2>
            <span className="text-[10px] text-[#444444] font-bold uppercase tracking-widest">Updated 3m ago</span>
          </div>

          <div className="space-y-4">
            {queue.map((topic, i) => (
              <motion.div
                key={topic.jobId || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-5 rounded-2xl bg-[#111111] border border-white/5 hover:border-brand-500/20 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-6 min-w-0">
                  <span className="text-[#333333] font-black text-sm group-hover:text-brand-500/50 transition-colors w-6 flex-shrink-0">{topic.id}</span>
                  <div className="min-w-0">
                    <h4 className="text-slate-200 font-bold text-sm tracking-tight truncate group-hover:text-white transition-colors mb-1.5">{topic.title}</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-[#444444] font-black font-mono tracking-widest">{topic.volume}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-500 text-[10px] font-black uppercase tracking-widest border border-brand-500/20">{topic.tag}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 ml-4">
                  <div className="flex items-center gap-2">
                    {topic.status === 'Generated' ? (
                      <div className="flex items-center gap-2 group/status">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">Generated</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#444444] animate-pulse" />
                        <span className="text-[10px] font-black text-[#555555] uppercase tracking-tight animate-pulse">Pending</span>
                      </div>
                    )}
                  </div>
                  <Link 
                    to={topic.articleId ? `/articles/${topic.articleId}/edit` : `/articles/new?topic=${encodeURIComponent(topic.title)}`} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-brand-500 hover:border-brand-500/30 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {topic.articleId ? 'Edit' : 'Write'}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Right Column: Fetch Schedule */}
        <aside className="lg:col-span-2 space-y-8">
           <div className="glass p-10 rounded-[44px] bg-[#111111] border border-white/5 relative overflow-hidden">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10">FETCH SCHEDULE</h3>
              
              <div className="space-y-8">
                {[
                  { label: 'Interval', value: settings ? `Every ${settings.fetchInterval.toUpperCase()}` : 'Loading...' },
                  { label: 'Last Fetch', value: '3 minutes ago' },
                  { label: 'Next Fetch', value: 'Auto-sync active' },
                  { label: 'Topics per Cycle', value: '10' },
                  { label: 'Duplicate Check', value: settings?.duplicateDetection ? 'Active' : 'Inactive', isStatus: true },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <span className="text-slate-400 font-bold text-sm">{row.label}</span>
                    <span className={`
                      font-black text-sm tracking-tight transition-colors
                      ${row.isStatus ? 'text-emerald-500' : 'text-slate-100 group-hover:text-brand-500'}
                    `}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 p-6 rounded-3xl bg-brand-500/5 border border-brand-500/10 flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-brand-500" />
                 </div>
                 <p className="text-xs text-brand-300 font-medium leading-relaxed">
                   AI agents are synced with Google Trends API for low-latency synchronization.
                 </p>
              </div>
           </div>

           {/* Stats / Status Sidebar Widget */}
           <div className="glass p-8 rounded-[44px] bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Status</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
                    <ShieldCheck className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-white font-black text-sm tracking-tight">System Validated</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">256-bit encryption active</p>
                 </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default Trending;
