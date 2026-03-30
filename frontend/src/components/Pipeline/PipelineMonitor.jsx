/**
 * PipelineMonitor — Real-time article generation tracker
 * Subscribes to SSE stream, shows per-topic stage progress with Cancel/Pause controls
 */
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, XCircle, AlertTriangle, Activity, Clock, PauseCircle,
  PlayCircle, Trash2, Edit3, ChevronRight, Radio, Zap, Image as ImageIcon,
  FileText, BookOpen, ShieldCheck, Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pipelineApi } from '../../api/articles';

// ── Stage metadata ──
const STAGE_META = {
  pending:    { label: 'Queued',     icon: Clock,         color: 'text-[#444444]',  bg: 'bg-white/5',          border: 'border-white/5' },
  planning:   { label: 'Planning',   icon: BookOpen,      color: 'text-blue-400',   bg: 'bg-blue-500/10',      border: 'border-blue-500/20' },
  writing:    { label: 'Writing',    icon: FileText,      color: 'text-brand-500',  bg: 'bg-brand-500/10',     border: 'border-brand-500/20' },
  imaging:    { label: 'Imaging',    icon: ImageIcon,     color: 'text-purple-400', bg: 'bg-purple-500/10',    border: 'border-purple-500/20' },
  editing:    { label: 'Editing',    icon: Edit3,         color: 'text-amber-400',  bg: 'bg-amber-500/10',     border: 'border-amber-500/20' },
  qa:         { label: 'QA Check',   icon: ShieldCheck,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10',      border: 'border-cyan-500/20' },
  publishing: { label: 'Publishing', icon: Rocket,        color: 'text-emerald-400',bg: 'bg-emerald-500/10',   border: 'border-emerald-500/20' },
  done:       { label: 'Published',  icon: CheckCircle2,  color: 'text-emerald-400',bg: 'bg-emerald-500/10',   border: 'border-emerald-500/20' },
  failed:     { label: 'Failed',     icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10',       border: 'border-red-500/20' },
  cancelled:  { label: 'Cancelled',  icon: XCircle,       color: 'text-slate-500',  bg: 'bg-white/[0.03]',     border: 'border-white/5' },
  skipped:    { label: 'Skipped',    icon: ChevronRight,  color: 'text-slate-600',  bg: 'bg-white/[0.02]',     border: 'border-white/5' },
};

const getStageMeta = (status) => STAGE_META[status] || STAGE_META.pending;

// ── Animated progress bar for active stages ──
const LiveBar = ({ status }) => {
  const active = ['writing', 'imaging', 'editing', 'qa', 'publishing'].includes(status);
  if (!active) return null;
  return (
    <div className="mt-2.5 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        className="h-full w-1/3 bg-brand-500/60 rounded-full"
      />
    </div>
  );
};

const STAGE_ORDER = ['pending', 'planning', 'writing', 'imaging', 'editing', 'qa', 'publishing', 'done'];

const AGENTS = [
  { id: 'planning', label: 'Planner Agent 🧠', desc: 'Determines formatting, tone, and angle' },
  { id: 'writing', label: 'Writer Agent ✍️', desc: 'Drafts the full markdown article' },
  { id: 'imaging', label: 'Image Agent 🖼️', desc: 'Generates SEO header graphic' },
  { id: 'editing', label: 'Editor Agent 📝', desc: 'Refines language and structure' },
  { id: 'qa', label: 'QA Agent ✅', desc: 'Scores output against standards' },
  { id: 'publishing', label: 'Publisher Agent 🚀', desc: 'Saves to DB & applies metadata' }
];

// ── Single Topic Card ──
const TopicCard = ({ topic, runId, isPaused, onCancel }) => {
  const meta = getStageMeta(topic.status);
  const Icon = meta.icon;
  const isActive = !['done', 'failed', 'cancelled', 'pending'].includes(topic.status);
  const [cancelling, setCancelling] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCancelTopic = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cancelling) return;
    setCancelling(true);
    try {
      await pipelineApi.cancelTopic(runId, topic.slug);
      onCancel?.();
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  // Calculate effective progress index even if failed/cancelled mid-way
  let effectiveIndex = STAGE_ORDER.indexOf(topic.status);
  if (effectiveIndex === -1) {
    const st = (topic.stage || '').toLowerCase();
    if (st.includes('plan')) effectiveIndex = 1;
    else if (st.includes('writ')) effectiveIndex = 2;
    else if (st.includes('imag')) effectiveIndex = 3;
    else if (st.includes('edit')) effectiveIndex = 4;
    else if (st.includes('qa')) effectiveIndex = 5;
    else if (st.includes('publish')) effectiveIndex = 6;
    else effectiveIndex = 0;
  }

  const isDone = topic.status === 'done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => { setExpanded(!expanded); }}
      className={`p-4 rounded-2xl border transition-all relative group cursor-pointer ${meta.bg} ${meta.border} hover:border-white/20 hover:scale-[1.01]`}
    >
      <div className="flex items-start justify-between gap-3 relative z-20 pointer-events-none">
        {/* Left: topic info */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} border ${meta.border}`}>
            <Icon className={`h-3.5 w-3.5 ${meta.color} ${isActive ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <p className="text-slate-200 font-bold text-xs truncate leading-snug">{topic.topic}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[9px] font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</span>
              {topic.qualityScore && (
                <span className="text-[9px] text-slate-600 font-black">QA: {topic.qualityScore}/100</span>
              )}
              {topic.error && (
                <span className="text-[9px] text-red-400/70 font-black truncate max-w-[150px]" title={topic.error}>
                  {topic.error.slice(0, 40)}...
                </span>
              )}
            </div>
            <LiveBar status={topic.status} />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0 pointer-events-auto">
          {isDone && topic.articleId && (
            <Link
              to={`/articles/${topic.articleId}`}
              onClick={(e) => e.stopPropagation()}
              className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 transition-all hover:bg-emerald-500 hover:text-black z-30"
              title="Read completed article"
            >
              <FileText className="h-4 w-4" />
            </Link>
          )}

          <div className="flex items-center gap-2">
            {!['failed', 'cancelled', 'done'].includes(topic.status) && (
              <button
                onClick={handleCancelTopic}
                disabled={cancelling}
                className="h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all z-30"
                title="Cancel this article"
              >
                <XCircle className="h-3 w-3" />
              </button>
            )}
            {/* Expand Toggle Chevron */}
            <div className={`h-7 w-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 transition-all ${expanded ? 'rotate-90' : ''}`}>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Stages Accordion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden relative z-20 pointer-events-none"
          >
            <div className="mt-5 ml-[13px] pl-5 border-l border-white/10 space-y-4">
              {AGENTS.map((agent) => {
                const agentIdx = STAGE_ORDER.indexOf(agent.id);
                let state = 'upcoming'; // upcoming | active | done | failed
                let dotColor = 'bg-white/10 border-white/5';
                let textColor = 'text-slate-600';

                if (['failed', 'cancelled'].includes(topic.status)) {
                  if (agentIdx < effectiveIndex) { state = 'done'; dotColor = 'bg-emerald-500/20 border-emerald-500'; textColor = 'text-slate-400'; }
                  else if (agentIdx === effectiveIndex) { state = 'failed'; dotColor = 'bg-red-500/20 border-red-500'; textColor = 'text-red-400'; }
                } else if (agentIdx < effectiveIndex) {
                  state = 'done'; dotColor = 'bg-emerald-500/20 border-emerald-500'; textColor = 'text-slate-400';
                } else if (agentIdx === effectiveIndex) {
                  state = 'active'; dotColor = 'bg-brand-500 border-brand-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]'; textColor = 'text-brand-500';
                }

                return (
                  <div key={agent.id} className="relative">
                    <div className={`absolute -left-[25px] top-1 h-2 w-2 rounded-full border ${dotColor}`} />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{agent.label}</p>
                    <p className="text-[9px] text-slate-600 font-bold mt-0.5">{agent.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Run-level header card ──
const RunCard = ({ run, onRefresh }) => {
  const [pausing, setPausing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isPaused = run.status === 'paused';
  const isActive = run.status === 'running' || run.status === 'paused';
  const isComplete = ['completed', 'cancelled'].includes(run.status);

  const progress = run.summary.total > 0
    ? Math.round(((run.summary.done + run.summary.failed + run.summary.cancelled) / run.summary.total) * 100)
    : 0;

  const handlePause = async () => {
    setPausing(true);
    try { await pipelineApi.pauseRun(run.runId); onRefresh?.(); }
    catch (err) { console.error(err); }
    finally { setPausing(false); }
  };

  const handleCancelRun = async () => {
    setCancelling(true);
    try { await pipelineApi.cancelRun(run.runId); onRefresh?.(); }
    catch (err) { console.error(err); }
    finally { setCancelling(false); }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[32px] bg-[#111111] border border-white/5 overflow-hidden"
    >
      {/* Run Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-brand-500/10' : isComplete ? 'bg-white/5' : 'bg-white/5'} border ${isActive ? 'border-brand-500/20' : 'border-white/5'}`}>
              {isActive
                ? <Radio className={`h-4 w-4 text-brand-500 ${!isPaused ? 'animate-pulse' : ''}`} />
                : <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                Run: <span className="text-brand-500">{run.runId}</span>
              </p>
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-0.5">
                {new Date(run.startedAt).toLocaleTimeString()} · {run.summary.total} topics
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${
              run.status === 'running'   ? 'bg-brand-500/10 text-brand-500 border-brand-500/20' :
              run.status === 'paused'    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              run.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              run.status === 'cancelled' ? 'bg-white/5 text-slate-500 border-white/5' : ''
            }`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${
                run.status === 'running'   ? 'bg-brand-500 animate-pulse' :
                run.status === 'paused'    ? 'bg-amber-400' :
                run.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-600'
              }`} />
              {run.status}
            </span>

            {/* Pause/Resume button */}
            {isActive && (
              <button
                onClick={handlePause}
                disabled={pausing}
                className={`h-8 w-8 rounded-xl border flex items-center justify-center transition-all ${
                  isPaused
                    ? 'bg-brand-500/10 border-brand-500/20 text-brand-500 hover:bg-brand-500/20'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400'
                }`}
                title={isPaused ? 'Resume pipeline' : 'Pause pipeline'}
              >
                {isPaused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
              </button>
            )}

            {/* Cancel button */}
            {isActive && (
              <button
                onClick={handleCancelRun}
                disabled={cancelling}
                className="h-8 w-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
                title="Cancel entire run"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
              <span className="text-emerald-400">✓ {run.summary.done} done</span>
              <span className="text-red-400">✗ {run.summary.failed} failed</span>
              <span className="text-slate-600">⊘ {run.summary.cancelled} cancelled</span>
            </div>
            {isActive && <span className="text-[9px] text-slate-500 font-black">{progress}%</span>}
          </div>
          {isActive && (
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Topic list */}
      <div className="p-4 max-h-[400px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence>
          {run.topics.map((topic) => (
            <TopicCard
              key={topic.slug}
              topic={topic}
              runId={run.runId}
              isPaused={isPaused}
              onCancel={onRefresh}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ── Main PipelineMonitor export ──
const PipelineMonitor = () => {
  const [runs, setRuns] = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const esRef = useRef(null);

  const fetchRuns = async () => {
    try {
      const data = await pipelineApi.getAllRuns();
      if (Array.isArray(data)) setRuns(data);
    } catch (err) {
      console.error('[PipelineMonitor] Fetch error:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchRuns();

    // Connect to SSE stream
    const url = pipelineApi.streamUrl();
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLastUpdate(new Date());

        if (payload.type === 'init') {
          setRuns(payload.runs || []);
        } else if (payload.type === 'update') {
          setRuns(prev => {
            const idx = prev.findIndex(r => r.runId === payload.runId);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = payload.run;
              return next;
            }
            return [payload.run, ...prev];
          });
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    es.onerror = () => {
      setConnected(false);
      // Reconnect via polling fallback
      const pollInterval = setInterval(fetchRuns, 3000);
      return () => clearInterval(pollInterval);
    };

    // Polling fallback for environments that block SSE
    const poll = setInterval(fetchRuns, 5000);

    return () => {
      es.close();
      clearInterval(poll);
    };
  }, []);

  const activeRuns = runs.filter(r => r.status === 'running' || r.status === 'paused');
  const completedRuns = runs.filter(r => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Monitor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-4 w-4 text-brand-500" />
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.25em]">Live Pipeline Monitor</h2>
          {activeRuns.length > 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-brand-500/10 text-brand-500 text-[9px] font-black border border-brand-500/20">
              {activeRuns.length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
            {connected ? 'Live' : 'Polling'}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {runs.length === 0 && (
        <div className="py-16 rounded-[32px] bg-[#111111] border border-white/5 flex flex-col items-center justify-center gap-4">
          <Radio className="h-10 w-10 text-[#1a1a1a]" />
          <p className="text-[10px] font-black text-[#333333] uppercase tracking-widest">No active pipelines. Trigger a fetch to begin.</p>
        </div>
      )}

      {/* Active runs */}
      {activeRuns.length > 0 && (
        <div className="space-y-4">
          <p className="text-[9px] font-black text-brand-500/60 uppercase tracking-widest px-1">🔴 Active Runs</p>
          {activeRuns.map(run => (
            <RunCard key={run.runId} run={run} onRefresh={fetchRuns} />
          ))}
        </div>
      )}

      {/* Completed runs */}
      {completedRuns.length > 0 && (
        <div className="space-y-4">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">✓ Recent Runs</p>
          {completedRuns.map(run => (
            <RunCard key={run.runId} run={run} onRefresh={fetchRuns} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PipelineMonitor;
