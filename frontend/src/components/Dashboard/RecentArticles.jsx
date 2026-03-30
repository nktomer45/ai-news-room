import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Calendar, Tag, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentArticles = ({ articles }) => {
  return (
    <div className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Recent Articles</h2>
          <p className="text-slate-500 text-sm mt-1">Latest AI generated publications</p>
        </div>
        <Link 
          to="/articles" 
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-all flex items-center gap-2 group border border-white/5"
        >
          View All
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="space-y-4">
        {articles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 italic">No articles found. Time to generate some!</p>
          </div>
        ) : (
          articles.map((article, idx) => (
            <motion.div
              key={article._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
            >
              {/* Image Placeholder/Thumbnail */}
              <div className="h-20 w-32 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-white/5 relative">
                {article.imageUrl ? (
                  <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <Tag className="h-6 w-6 text-slate-700" />
                  </div>
                )}
                {/* Status Badge Over Image */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  {article.category || 'General'}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-100 font-bold text-lg truncate group-hover:text-brand-400 transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-slate-500 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(article.createdAt).toLocaleDateString()}
                  </div>
                  <div className={`px-2 py-0.5 rounded-md border ${
                    article.status === 'published' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                    article.status === 'draft' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                    'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                  } uppercase text-[10px] tracking-widest font-black`}>
                    {article.status}
                  </div>
                </div>
              </div>

              {/* Action */}
              <Link 
                to={`/articles/${article._id}`}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-white hover:border-brand-500/50 transition-all group-hover:translate-x-1"
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentArticles;
