import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Zap,
  LayoutGrid,
  Activity,
  Award,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, subtext, icon: Icon, colorClasses, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-[#111111]/60 p-7 rounded-[32px] border border-white/5 hover:border-brand-500/20 transition-all duration-500 relative overflow-hidden group flex-1 min-w-[200px]"
  >
    <div className="flex items-start justify-between relative z-10 h-full">
      <div className="space-y-10 flex flex-col justify-between h-full">
        <div>
           <h4 className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">
              {title}
           </h4>
           <div className="flex items-baseline gap-2">
             <h3 className="text-[32px] font-black text-white tracking-tighter leading-none">{value}</h3>
           </div>
        </div>

        <div className="space-y-2">
           <p className="text-[11px] text-[#444444] font-black uppercase tracking-widest">{subtext}</p>
           {trend && (
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                <TrendingUp className="h-3 w-3" />
                {trend}% this week
              </span>
           )}
        </div>
      </div>
      
      <div className={`h-11 w-11 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center ${colorClasses.text} group-hover:scale-110 group-hover:bg-brand-500/10 group-hover:border-brand-500/20 transition-all duration-500`}>
        <Icon className="h-5 w-5" strokeWidth={2.5} />
      </div>
    </div>

    {/* Subtle Glow */}
    <div className={`absolute -right-8 -top-8 w-16 h-16 rounded-full blur-[40px] ${colorClasses.glow} opacity-[0.02] group-hover:opacity-[0.08] transition-opacity`}></div>
  </motion.div>
);

const StatsGrid = ({ stats }) => {
  const cards = [
    { 
      title: 'Total Articles', 
      value: stats.all || 0, 
      subtext: 'Database archive',
      icon: BookOpen, 
      colorClasses: { text: 'text-brand-500', glow: 'bg-brand-500' },
      delay: 0 
    },
    { 
      title: 'Published', 
      value: stats.published || 0, 
      subtext: 'Live content',
      icon: CheckCircle, 
      colorClasses: { text: 'text-brand-500', glow: 'bg-brand-500' },
      delay: 0.1 
    },
    { 
      title: 'In Draft', 
      value: stats.draft || 0, 
      subtext: 'WIP articles',
      icon: BookOpen, 
      colorClasses: { text: 'text-brand-500', glow: 'bg-brand-500' },
      delay: 0.2 
    },
    { 
      title: 'In Review', 
      value: stats.review || 0, 
      subtext: 'Gatekeeper queue',
      icon: Clock, 
      colorClasses: { text: 'text-brand-500', glow: 'bg-brand-500' },
      delay: 0.3
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, idx) => (
        <StatsCard key={idx} {...card} />
      ))}
    </div>
  );
};

export default StatsGrid;
