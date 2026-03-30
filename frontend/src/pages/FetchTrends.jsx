import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  PlusCircle,
  XCircle,
  BarChart2,
  ChevronRight,
  Globe,
  Radio,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { articleApi, pipelineApi } from '../api/articles';
import PipelineMonitor from '../components/Pipeline/PipelineMonitor';
import { useTopicContext } from '../context/TopicContext';

const FetchTrends = () => {
  const { selectedTopics, toggleSelection, clearSelection } = useTopicContext();
  const [trends, setTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState(null);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch live RSS trends on mount
  const loadTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const data = await articleApi.getLiveTrends();
      if (Array.isArray(data)) {
        const unique = Array.from(new Map(data.map(t => [t.title, t])).values())
          .filter(topic => topic.isNew);
        setTrends(unique);
      }
    } catch (err) {
      console.error(err);
      setFetchMsg({ type: 'error', text: '✗ Failed to load RSS trends. Check backend connection.' });
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const handleRefreshTrends = async () => {
    setIsFetching(true);
    setFetchMsg(null);
    clearSelection();
    await loadTrends();
    setIsFetching(false);
  };

  const handleGenerateSelected = async () => {
    if (selectedTopics.length === 0) return;
    
    setIsGenerating(true);
    setFetchMsg(null);
    try {
      const topicsToGen = trends.filter(t => selectedTopics.includes(t.title));
      const res = await articleApi.triggerPipelineWithTopics(topicsToGen);
      setFetchMsg({ type: 'success', text: `✓ ${res?.message || 'Started generation for selected topics'}` });
      setTrends(prev => prev.filter(t => !selectedTopics.includes(t.title)));
      clearSelection();
    } catch (err) {
      setFetchMsg({ type: 'error', text: `✗ ${err?.message || 'Failed to start generation'}` });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setFetchMsg(null), 6000);
    }
  };

  const selectAll = () => {
    trends.forEach(t => {
      if (!selectedTopics.includes(t.title)) toggleSelection(t.title);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-16">

      {/* ── Page Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black text-brand-500/60 uppercase tracking-[0.3em]">Mission Control</span>
            <span className="h-px flex-1 bg-brand-500/10 max-w-[80px]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none">Fetch Trends</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px]">
            Google News RSS → AI Pipeline → Published Articles
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRefreshTrends}
            disabled={isFetching || loadingTrends}
            className="px-6 py-3.5 rounded-2xl bg-[#111111] border border-white/5 hover:bg-white/5 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-black text-[11px] transition-all flex items-center gap-3 active:scale-95 uppercase tracking-widest"
          >
            <RefreshCw className={`h-4 w-4 text-brand-500 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh Feed'}
          </button>
          
          <button
            onClick={handleGenerateSelected}
            disabled={isGenerating || selectedTopics.length === 0}
            className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:bg-brand-500/30 disabled:text-brand-900 disabled:cursor-not-allowed text-[#0a0a0a] font-black text-[11px] transition-all shadow-xl shadow-brand-500/10 flex items-center gap-3 active:scale-95 uppercase tracking-widest"
          >
            <Zap className={`h-4 w-4 ${isGenerating ? 'animate-bounce' : ''}`} />
            {isGenerating ? 'Starting Agents...' : `Generate Selected (${selectedTopics.length})`}
          </button>
        </div>
      </header>

      {/* ── Feedback Toast ── */}
      <AnimatePresence>
        {fetchMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`px-6 py-4 rounded-2xl border font-black text-sm ${
              fetchMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {fetchMsg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left: Live RSS Trends */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-brand-500" />
              <h2 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Trending Now (RSS)</h2>
              <span className="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-500 text-[9px] font-black border border-brand-500/20">
                {trends.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">
                Select All
              </button>
              {selectedTopics.length > 0 && (
                <button onClick={clearSelection} className="text-[10px] font-black text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1">
                  <XCircle className="h-3 w-3" /> Clear ({selectedTopics.length})
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {loadingTrends ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-[#111111] border border-white/5 animate-pulse" />
              ))
            ) : trends.length === 0 ? (
              <div className="py-24 rounded-[40px] bg-[#111111] border border-white/5 flex flex-col items-center justify-center gap-4">
                <Globe className="h-10 w-10 text-[#1a1a1a]" />
                <p className="text-[10px] font-black text-[#333333] uppercase tracking-widest">No trends found.</p>
              </div>
            ) : (
              trends.map((topic, i) => {
                const isSelected = selectedTopics.includes(topic.title);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => toggleSelection(topic.title)}
                    className={`
                      group p-5 rounded-2xl border transition-all cursor-pointer flex gap-4
                      ${isSelected ? 'bg-brand-500/5 border-brand-500/30' : 'bg-[#111111] border-white/5 hover:border-white/10'}
                    `}
                  >
                    {/* Checkbox */}
                    <div className="mt-1">
                      <div className={`h-5 w-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-white/10 bg-white/5'}`}>
                        {isSelected && <Check className="h-3 w-3 text-[#0a0a0a]" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <h4 className="text-slate-200 font-bold text-sm tracking-tight group-hover:text-white transition-colors leading-snug">
                          {topic.title}
                        </h4>
                        {topic.isNew ? (
                          <span className="px-2 py-0.5 rounded flex-shrink-0 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest">Fresh</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded flex-shrink-0 bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest">In DB</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {topic.contentSnippet || 'No description available'}
                      </p>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {new Date(topic.pubDate).toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Pipeline Monitor */}
        <div className="space-y-4">
           {/* Replace custom rendering with our imported PipelineMonitor component. It self-fetches runs inside. */}
           <PipelineMonitor />
        </div>

      </div>
    </div>
  );
};

export default FetchTrends;
