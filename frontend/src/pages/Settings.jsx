import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Hand, 
  Info, 
  Globe, 
  Clock, 
  ShieldCheck,
  ChevronDown,
  Activity,
  Loader2,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsApi } from '../api/settings';

const Settings = () => {
  const [settings, setSettings] = useState({
    publishMode: 'manual',
    contentQuality: 'high',
    sourceRegion: 'US',
    fetchInterval: '1h',
    maxArticlesPerRun: 2,
    duplicateDetection: true
  });
  const [nextJob, setNextJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNextJob = async () => {
    try {
      const { nextRun } = await settingsApi.getNextJob();
      setNextJob(nextRun);
    } catch (err) {
      console.error('Failed to fetch next job:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      if (data) setSettings(data);
      await fetchNextJob();
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Poll next job time every 30 seconds
    const interval = setInterval(fetchNextJob, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      // Re-fetch to confirm changes are reflected
      await fetchSettings();
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setTimeout(() => setSaving(false), 1200);
    }
  };

  const updateField = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
       <Loader2 className="h-10 w-10 text-brand-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-32">
      {/* Header */}
      <header className="mb-12 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Settings</h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Configure your AI newsroom</p>
        </div>
        <AnimatePresence>
          {saving && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-2"
            >
              <CircleLoader size={12} color="#f59e0b" />
              <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Syncing Config</span>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Floating Save Button - Bottom Right */}
      <div className="fixed bottom-10 right-10 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-[#0a0a0a] font-black text-sm transition-all shadow-2xl shadow-brand-500/30 flex items-center gap-3 active:scale-95 uppercase tracking-widest leading-none disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </div>

      {/* Publishing Mode Section */}
      <section className="space-y-8">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">PUBLISHING MODE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => updateField('publishMode', 'auto')}
            className={`
              p-8 rounded-[32px] border transition-all duration-500 text-left group relative overflow-hidden
              ${settings.publishMode === 'auto' ? 'bg-[#111111] border-brand-500 shadow-2xl shadow-brand-500/10 scale-[1.02]' : 'bg-transparent border-white/5 hover:border-white/10'}
            `}
          >
             <div className="flex items-start gap-4 mb-4">
                <div className={`
                  h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500
                  ${settings.publishMode === 'auto' ? 'bg-brand-500 text-[#0a0a0a]' : 'bg-white/5 text-slate-500'}
                `}>
                   <Zap className="h-5 w-5" />
                </div>
                <div className="flex-1">
                   <h4 className="text-white font-black text-lg tracking-tight mb-1">Fully Automated</h4>
                   <p className="text-slate-500 text-xs font-medium leading-relaxed">
                     Articles are automatically generated and published without manual intervention
                   </p>
                </div>
             </div>
          </button>

          <button 
            onClick={() => updateField('publishMode', 'manual')}
            className={`
              p-8 rounded-[32px] border transition-all duration-500 text-left group relative overflow-hidden
              ${settings.publishMode === 'manual' ? 'bg-[#111111] border-brand-500 shadow-2xl shadow-brand-500/10 scale-[1.02]' : 'bg-transparent border-white/5 hover:border-white/10'}
            `}
          >
             <div className="flex items-start gap-4 mb-4">
                <div className={`
                  h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500
                  ${settings.publishMode === 'manual' ? 'bg-brand-500 text-[#0a0a0a]' : 'bg-white/5 text-slate-500'}
                `}>
                   <Hand className="h-5 w-5" />
                </div>
                <div className="flex-1">
                   <h4 className="text-white font-black text-lg tracking-tight mb-1">Manual Review</h4>
                   <p className="text-slate-500 text-xs font-medium leading-relaxed">
                     Articles are saved as drafts and require human approval before publishing
                   </p>
                </div>
             </div>
          </button>
        </div>
      </section>

      {/* AI Configuration Section */}
      <section className="space-y-6 pt-6">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">AI CONFIGURATION</h3>
        
        <div className="glass p-10 rounded-[44px] bg-[#111111]/40 border border-white/5 space-y-12">
           {/* Content Quality */}
           <SettingRow 
             icon={Info} 
             title="Content Quality" 
             subtitle="AI writing style and depth"
             value={settings.contentQuality}
             options={['standard', 'high', 'ultra']}
             onChange={(val) => updateField('contentQuality', val)}
           />

           {/* Source Region */}
           <SettingRow 
             icon={Globe} 
             title="Source Region" 
             subtitle="Google Trends region"
             value={settings.sourceRegion}
             options={['US', 'UK', 'CA', 'GLOBAL', 'IN']}
             onChange={(val) => updateField('sourceRegion', val)}
           />

           {/* Fetch Interval */}
           <SettingRow 
             icon={Clock} 
             title="Fetch Interval" 
             subtitle="How often to check for trends"
             value={settings.fetchInterval}
             options={['5m', '10m', '15m', '30m', '1h', '6h', '12h', '24h']}
             onChange={(val) => updateField('fetchInterval', val)}
           />

           {/* Max Articles Per Run */}
           <SettingRow 
             icon={Layers} 
             title="Max Articles" 
             subtitle="Articles per automated cycle"
             value={settings.maxArticlesPerRun}
             options={[1, 2, 5, 10, 15, 20]}
             onChange={(val) => updateField('maxArticlesPerRun', val)}
           />

           {/* Next Job Countdown */}
           <div className="flex items-center justify-between group pt-4">
              <div className="flex items-center gap-5">
                 <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500">
                    <Loader2 className="h-5 w-5 animate-pulse" />
                 </div>
                 <div>
                    <h5 className="text-white font-bold text-sm">Next Automated Job</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Countdown to next synthesis</p>
                 </div>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-[#0a0a0a] border border-white/5 font-mono text-brand-500 font-black text-sm tracking-widest">
                 <Countdown target={nextJob} onComplete={fetchNextJob} />
              </div>
           </div>

           {/* Duplicate Detection */}
           <div className="flex items-center justify-between group">
              <div className="flex items-center gap-5">
                 <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-500 transition-colors">
                    <ShieldCheck className="h-5 w-5" />
                 </div>
                 <div>
                    <h5 className="text-white font-bold text-sm">Duplicate Detection</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Prevent duplicate articles</p>
                 </div>
              </div>
              <button 
                onClick={() => updateField('duplicateDetection', !settings.duplicateDetection)}
                className={`
                  w-12 h-6 rounded-full p-1 relative transition-all duration-500 outline-none
                  ${settings.duplicateDetection ? 'bg-brand-500 shadow-lg shadow-brand-500/20' : 'bg-slate-800'}
                `}
              >
                 <motion.div
                   animate={{ x: settings.duplicateDetection ? 24 : 0 }}
                   className="h-4 w-4 bg-white rounded-full shadow-lg"
                 />
              </button>
           </div>
        </div>
      </section>

      {/* Footer Info */}
      <div className="flex items-center gap-4 p-8 rounded-[40px] bg-[#111111] border border-white/5">
         <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-brand-500" />
         </div>
         <p className="text-xs text-slate-500 font-medium leading-relaxed">
           Configurations changed here are applied to the synthesis engine. 
           Current region: <span className="text-white font-black">{settings.sourceRegion}</span>. 
           Interval: <span className="text-white font-black">{settings.fetchInterval}</span>.
         </p>
      </div>
    </div>
  );
};

const SettingRow = ({ icon: Icon, title, subtitle, value, options, onChange }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-5">
      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-brand-500 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h5 className="text-white font-bold text-sm">{title}</h5>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          {subtitle}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`
            px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
            ${value === opt ? 'bg-brand-500 text-[#0a0a0a]' : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}
          `}
        >
          {String(opt).replace(/Every /i, '').toUpperCase()}
        </button>
      ))}
    </div>
  </div>
);

const Countdown = ({ target, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!target) return;

    const calculate = () => {
      const diff = new Date(target) - new Date();
      if (diff <= 0) {
        setTimeLeft('EXECUTING...');
        if (onComplete) onComplete();
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      setTimeLeft(`${h}H ${m}M ${s}S`);
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{timeLeft || '--H --M --S'}</span>;
};

const CircleLoader = ({ size, color }) => (
  <div 
    style={{ width: size, height: size, borderColor: color }}
    className="border-2 border-t-transparent rounded-full animate-spin"
  />
);

export default Settings;
