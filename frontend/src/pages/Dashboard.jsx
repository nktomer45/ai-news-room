import React, { useEffect, useState } from 'react';
import { articleApi, pipelineApi } from '../api/articles';
import { useTopicContext } from '../context/TopicContext';
import StatsGrid from '../components/Dashboard/StatsGrid';
import { Sparkles, TrendingUp, Newspaper, ChevronRight, Activity, Zap, RefreshCw, Calendar, Tag, ExternalLink, CheckCircle2, Edit3, Circle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [allArticles, setAllArticles] = useState([]);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState('Normal');
  const [queue, setQueue] = useState([]);
  const { selectedTopics, toggleSelection, clearSelection } = useTopicContext();
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  // Filters for Recent Articles
  const [filterDate, setFilterDate] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const getCategoryColor = (cat = 'Tech') => {
    const colors = {
      'AI': 'bg-brand-500/10 text-brand-500 border-brand-500/20',
      'Tech': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Business': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Gaming': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Science': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'Entertainment': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      'AI Pipeline': 'bg-amber-500/5 text-amber-500 border-amber-500/10'
    };
    return colors[cat] || 'bg-slate-500/10 text-slate-400 border-white/5';
  };

  const fetchTrending = async () => {
    try {
      const data = await articleApi.getLiveTrends();
      if (Array.isArray(data)) {
        const seen = new Set();
        const unique = data.filter(t => {
          if (!t.isNew) return false;
          if (seen.has(t.title)) return false;
          seen.add(t.title);
          return true;
        });

        setQueue(unique.slice(0, 7).map((topic, i) => ({
          id: String(i + 1).padStart(2, '0'),
          raw: topic,
          title: topic.title,
          tag: 'RSS Trend',
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, articlesData, healthData] = await Promise.all([
          articleApi.getStats(),
          articleApi.getAll({ limit: 4 }),
          articleApi.checkHealth()
        ]);
        setStats(statsData);
        setAllArticles(Array.isArray(articlesData) ? articlesData : []);
        setSystemHealth(healthData?.status === 'ok' ? 'Normal' : 'Issues Detected');
        fetchTrending();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Effect to apply Date & Category filters
  useEffect(() => {
    let filtered = [...allArticles];
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => {
        const catName = a.categories?.[0]?.name || a.category || 'Tech';
        return catName === filterCategory;
      });
    }

    if (filterDate !== 'all') {
      const now = new Date();
      filtered = filtered.filter(a => {
        const d = new Date(a.updatedAt || a.createdAt);
        if (filterDate === 'today') {
           return d.toDateString() === now.toDateString();
        } else if (filterDate === 'week') {
           const weekAgo = new Date(now);
           weekAgo.setDate(now.getDate() - 7);
           return d >= weekAgo;
        } else if (filterDate === 'month') {
           const monthAgo = new Date(now);
           monthAgo.setMonth(now.getMonth() - 1);
           return d >= monthAgo;
        }
        return true;
      });
    }

    setRecentArticles(filtered.slice(0, 4));
  }, [filterDate, filterCategory, allArticles]);

  const availableCategories = Array.from(new Set(allArticles.map(a => a.categories?.[0]?.name || a.category || 'Tech')));

  return (
    <div className="max-w-7xl mx-auto py-2 animate-fade-in font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <h1 className="text-[32px] font-black text-white tracking-tight leading-none mb-2">Dashboard</h1>
          <p className="text-slate-500 font-bold text-[13px] tracking-wide">AI Newsroom Overview</p>
        </div>
        
        <button 
          onClick={async () => {
            try {
              await articleApi.triggerTrendFetch();
              fetchTrending();
            } catch (err) {
              console.error(err);
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-[#0a0a0a] font-black text-[13px] transition-all shadow-xl shadow-brand-500/10 flex items-center gap-2 active:scale-95 uppercase tracking-widest leading-none"
        >
          <RefreshCw className="h-4 w-4" />
          Fetch Trends
        </button>
      </header>

      {/* Stats Cards Section */}
      <section className="mb-14">
        <StatsGrid stats={{ ...stats, queue }} />
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Recent Articles (3/4 width approx) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <h2 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">RECENT ARTICLES</h2>
              
              <div className="flex items-center gap-2">
                 <select 
                   value={filterDate} 
                   onChange={(e) => setFilterDate(e.target.value)}
                   className="bg-[#1a1a1a] border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-brand-500/50 transition-colors"
                 >
                    <option value="all">Any Date</option>
                    <option value="today">Today</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                 </select>

                 <select 
                   value={filterCategory} 
                   onChange={(e) => setFilterCategory(e.target.value)}
                   className="bg-[#1a1a1a] border border-white/10 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg px-2.5 py-1.5 outline-none cursor-pointer hover:border-brand-500/50 transition-colors max-w-[140px] truncate"
                 >
                    <option value="all">All Categories</option>
                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
              </div>
            </div>

            <Link to="/articles" className="text-brand-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors shrink-0">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentArticles.length > 0 ? recentArticles.map((article, idx) => (
              <Link key={article._id} to={`/articles/${article._id}`} className="block h-full group">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="h-full glass p-2 rounded-[32px] border border-white/5 group-hover:border-brand-500/30 transition-all duration-500 relative overflow-hidden flex flex-col bg-[#111111]/40"
                >
                  {/* Thumbnail Layer */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[26px] bg-slate-900 border border-white/5 shadow-inner">
                    <img 
                      src={article.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.title)}&background=1a1a1a&color=f59e0b&size=512`} 
                      alt={article.title} 
                      className="h-full w-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                    />
                    {/* Overlay Badges */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${article.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'}`}>
                        <Circle className={`h-1.5 w-1.5 fill-current ${article.status === 'published' ? 'text-emerald-400' : 'text-brand-500'}`} />
                        {article.status}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 flex flex-wrap gap-1.5 justify-end pl-8">
                       {article.categories && article.categories.length > 0 ? (
                         article.categories.map(cat => (
                           <span key={cat._id} className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${getCategoryColor(cat.name)} shadow-lg`}>
                             {cat.name}
                           </span>
                         ))
                       ) : (
                         <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${getCategoryColor(article.category || 'Tech')} shadow-lg`}>
                             {article.category || 'Tech'}
                         </span>
                       )}
                    </div>
                  </div>

                  {/* Content Layer */}
                  <div className="p-6 pb-4 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-white leading-tight group-hover:text-brand-500 transition-colors mb-4 line-clamp-2 tracking-tight">
                      {article.title}
                    </h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed mb-6 font-medium line-clamp-2 opacity-80">
                      {article.summary}
                    </p>
                    
                    {/* Footer - Social Reference Style */}
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#444444] text-[10px] font-black uppercase tracking-widest">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(article.updatedAt || article.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#555555]">
                        Details <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            )) : (
              <div className="col-span-2 py-32 bg-white/5 rounded-[40px] border border-white/5 flex flex-col items-center justify-center gap-4">
                 <Newspaper className="h-12 w-12 text-[#1a1a1a]" />
                 <p className="text-[11px] font-black uppercase tracking-widest text-[#333333]">Synchronization Pending</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Trending Now Sidebar (1/4 width approx) */}
        <aside className="lg:col-span-4 ps-4">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-2">
               <TrendingUp className="h-4 w-4 text-brand-500" />
               <h2 className="text-[13px] font-black text-white uppercase tracking-[0.2em]">Trending Now</h2>
             </div>
             {selectedTopics.length > 0 ? (
               <button 
                 disabled={generating}
                 onClick={async () => {
                   setGenerating(true);
                   try {
                     const selected = queue.filter(q => selectedTopics.includes(q.title)).map(q => q.raw);
                     await articleApi.triggerPipelineWithTopics(selected);
                     // Remove from local list immediately
                     setQueue(prev => prev.filter(q => !selectedTopics.includes(q.title)));
                     clearSelection();
                     navigate('/fetch-trends');
                   } catch (e) { console.error(e); }
                 }}
                 className="text-[9px] bg-brand-500 text-black px-3 py-1.5 rounded-lg font-black uppercase tracking-widest hover:bg-brand-400 disabled:opacity-50"
               >
                 {generating ? 'Starting...' : `Generate (${selectedTopics.length})`}
               </button>
             ) : (
               <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Live RSS</span>
             )}
           </div>

           <div className="space-y-4">
             {queue.length > 0 ? queue.map((item, i) => (
               <motion.div 
                 key={item.title}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: i * 0.05 }}
                 onClick={() => toggleSelection(item.title)}
                 className={`group flex items-start gap-4 p-3 rounded-2xl border transition-all cursor-pointer ${selectedTopics.includes(item.title) ? 'bg-brand-500/10 border-brand-500/30 shadow-lg shadow-brand-500/5' : 'bg-transparent border-transparent hover:border-white/5 hover:bg-white/5'}`}
               >
                 <div className="mt-1 flex-shrink-0">
                    <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${selectedTopics.includes(item.title) ? 'bg-brand-500 border-brand-500' : 'border-slate-600 bg-[#111111] group-hover:border-slate-500'}`}>
                      {selectedTopics.includes(item.title) && <CheckCircle2 className="h-3 w-3 text-black" />}
                    </div>
                 </div>
                 
                 <div className="flex-1 space-y-2 min-w-0">
                    <h4 className={`font-bold text-sm leading-tight line-clamp-2 transition-colors ${selectedTopics.includes(item.title) ? 'text-brand-400' : 'text-slate-300 group-hover:text-white'}`}>{item.title}</h4>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400 text-[9px] font-bold uppercase tracking-widest border border-white/5">{item.tag}</span>
                 </div>
               </motion.div>
             )) : (
               <div className="py-20 text-center opacity-20">
                  <Activity className="h-8 w-8 text-white mx-auto mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]">Queue Passive</p>
               </div>
             )}
           </div>

           <Link to="/fetch-trends" className="mt-10 w-full py-4 border border-white/5 rounded-2xl flex items-center justify-center gap-2 group hover:bg-white/5 transition-all">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#444444] group-hover:text-white">Expand Queue</span>
              <ChevronRight className="h-4 w-4 text-[#222222] group-hover:text-brand-500" />
           </Link>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
