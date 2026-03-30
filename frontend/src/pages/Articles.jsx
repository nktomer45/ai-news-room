import React, { useEffect, useState } from 'react';
import { articleApi } from '../api/articles';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  Activity, 
  ChevronRight, 
  Calendar, 
  Edit3,
  Trash2,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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

  const handlePublish = async (id) => {
    try {
      await articleApi.update(id, { status: 'published' });
      setArticles(prev => prev.map(a => a._id === id ? { ...a, status: 'published' } : a));
    } catch (err) {
      console.error('Publish Error:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filter !== 'all') params.status = filter;
        if (searchTerm) params.search = searchTerm;
        
        // Fetch real articles and queue status in parallel
        const [articleData, queueData] = await Promise.all([
          articleApi.getAll(params),
          articleApi.getQueueStatus()
        ]);
        
        const realArticles = Array.isArray(articleData) ? articleData : [];
        const queueItems = Array.isArray(queueData) ? queueData : [];
        
        // Convert queue items into placeholder article objects
        const pendingArticles = queueItems
          .filter(j => j.status !== 'completed' && j.status !== 'failed')
          .map(j => ({
            _id: `queue-${j.id}`,
            title: j.topic,
            summary: "AI is currently researching and drafting this article. Expected availability: ~30 seconds.",
            status: 'pending',
            category: 'AI Pipeline',
            imageUrl: null,
            createdAt: j.createdAt,
            updatedAt: j.createdAt,
            isPlaceholder: true
          }));

        // Merge and sort by updatedAt/createdAt descending
        const combined = [...pendingArticles, ...realArticles].sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA;
        });
        
        setArticles(combined);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const inv = setInterval(fetchData, 10000); // Live sync
    return () => clearInterval(inv);
  }, [filter, searchTerm]);

  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Draft' },
    { id: 'review', label: 'Review' },
    { id: 'published', label: 'Published' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 py-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Articles</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Manage AI-generated news articles</p>
        </div>
        
        <Link to="/articles/new" className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 text-[#0a0a0a] font-black text-sm transition-all shadow-xl shadow-brand-500/10 flex items-center gap-3 active:scale-95 uppercase tracking-widest leading-none">
          <Plus className="h-4.5 w-4.5" />
          New Article
        </Link>
      </header>

      {/* Modern Filter Bar */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 max-w-xl w-full">
           <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444444] group-focus-within:text-brand-500 transition-colors" />
             <input 
               type="text" 
               placeholder="Search articles..."
               className="w-full h-12 pl-12 pr-4 bg-[#111111] border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all font-bold text-slate-300 placeholder:text-[#333333]"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center p-1.5 bg-[#111111] rounded-2xl border border-white/5 gap-1">
             {statuses.map((s) => (
               <button
                 key={s.id}
                 onClick={() => setFilter(s.id)}
                 className={`
                   px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                   ${filter === s.id ? 'bg-brand-500 text-[#0a0a0a]' : 'text-slate-500 hover:text-slate-300'}
                 `}
               >
                 {s.label}
               </button>
             ))}
           </div>

           <div className="flex items-center p-1.5 bg-[#111111] rounded-2xl border border-white/5 gap-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-500 text-[#0a0a0a]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-500 text-[#0a0a0a]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <ListIcon className="h-4 w-4" />
              </button>
           </div>
        </div>
      </section>

      {/* Grid View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
           <Activity className="h-10 w-10 text-brand-500 animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#444444]">Syncing Article Vault...</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
          {articles.map((article, idx) => (
            <motion.div
              key={article._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group glass p-2 rounded-[32px] border border-white/5 hover:border-brand-500/30 transition-all duration-300 relative overflow-hidden flex flex-col bg-[#111111] ${viewMode === 'list' ? 'h-auto md:flex-row gap-6' : 'h-full'}`}
            >
              <Link to={`/articles/${article._id}`} className={`block group/link ${viewMode === 'list' ? 'w-48' : 'flex-1'}`}>
                <div className={`relative overflow-hidden rounded-[26px] bg-slate-900 border border-white/5 ${viewMode === 'list' ? 'aspect-square' : 'aspect-[16/10]'}`}>
                  <img 
                    src={article.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.title)}&background=1a1a1a&color=f59e0b&size=512`} 
                    alt={article.title} 
                    className="h-full w-full object-cover group-hover/link:scale-110 transition-transform duration-700 opacity-60 group-hover/link:opacity-80" 
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${
                      article.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      article.status === 'pending' ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20' :
                      'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        article.status === 'published' ? 'bg-emerald-400' :
                        article.status === 'pending' ? 'bg-brand-500' :
                        'bg-indigo-400'
                      }`} />
                      {article.status}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 flex flex-wrap gap-1 justify-end">
                    {article.categories && article.categories.length > 0 ? (
                      article.categories.map(cat => (
                        <span key={cat._id} className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${getCategoryColor(cat.name)}`}>
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${getCategoryColor(article.category || 'Tech')}`}>
                        {article.category || 'Tech'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="p-6 flex-1 flex flex-col min-w-0">
                <Link to={`/articles/${article._id}`} className="group/link block">
                  <h3 className="text-lg font-bold text-white leading-snug group-hover/link:text-brand-500 transition-colors mb-4 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 font-medium line-clamp-2 opacity-80 group-hover/link:opacity-100 transition-opacity">
                     {article.summary}
                  </p>
                </Link>
                
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(article.updatedAt || article.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {article.status !== 'published' && !article.isPlaceholder && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePublish(article._id); }}
                          className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-[#0a0a0a] transition-all group/pub"
                          title="Publish"
                        >
                           <Globe className="h-3.5 w-3.5 transition-transform group-hover/pub:scale-110" />
                        </button>
                     )}
                     <Link 
                       to={article.isPlaceholder ? '#' : `/articles/${article._id}/edit`}
                       className={`h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 transition-all group/btn ${article.isPlaceholder ? 'opacity-20 cursor-not-allowed' : 'hover:text-brand-500 hover:bg-white/10'}`}
                     >
                        <Edit3 className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
                     </Link>
                     <Link 
                       to={article.isPlaceholder ? '#' : `/articles/${article._id}`}
                       className={`h-8 px-3 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                         article.isPlaceholder 
                         ? 'bg-white/5 border-white/10 text-[#333333] cursor-not-allowed' 
                         : 'bg-brand-500/10 border-brand-500/20 text-brand-500 hover:bg-brand-500 hover:text-[#0a0a0a]'
                       }`}
                     >
                       {article.isPlaceholder ? 'Generating...' : 'Manage'} <ChevronRight className="h-3 w-3" />
                     </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles;
