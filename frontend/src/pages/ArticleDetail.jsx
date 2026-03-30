import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { articleApi } from '../api/articles';
import { 
  ArrowLeft, 
  Trash2, 
  Send, 
  Edit3, 
  Clock, 
  Calendar, 
  Tag as TagIcon, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  Image as ImageIcon,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await articleApi.getById(id);
        const fetchedArticle = data.article || data;
        setArticle(fetchedArticle);
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Activity className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-[#444444] font-black uppercase tracking-widest text-[10px] animate-pulse italic">Reconstructing content stream...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await articleApi.delete(id);
        navigate('/articles');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePublish = async () => {
    try {
      await articleApi.update(id, { status: 'published' });
      setArticle(prev => ({ ...prev, status: 'published' }));
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleCategoryChange = async (newCat) => {
    try {
      await articleApi.update(id, { category: newCat });
      setArticle(prev => ({ ...prev, category: newCat }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!article) {
     return <div className="text-center py-32 text-[#444444] font-bold text-sm italic">Article not found in database.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-32 animate-fade-in relative">
      {/* Back Link */}
      <Link 
        to="/articles" 
        className="flex items-center gap-2 text-[#666666] hover:text-white transition-all text-xs font-black uppercase tracking-widest mb-10 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to articles
      </Link>

      {/* Edit/Delete Actions (Top Right) */}
      <div className="absolute top-0 right-0 flex items-center gap-3">
         {article.status !== 'published' && (
           <button 
             onClick={handlePublish}
             className="h-11 px-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-[#0a0a0a] transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group"
           >
              <Globe className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Publish Node
           </button>
         )}
         <Link to={`/articles/${id}/edit`} className="h-11 px-5 rounded-2xl bg-white/5 border border-white/5 text-slate-400 hover:text-brand-500 hover:border-brand-500/30 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group">
            <Edit3 className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Edit Node
         </Link>
         <button onClick={handleDelete} className="h-11 px-5 rounded-2xl bg-red-500/5 border border-white/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 group">
            <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Delete
         </button>
      </div>

      {/* Hero Content Shell */}
      <div className="space-y-12">
        {/* Banner Image */}
        <div className="relative aspect-video rounded-[40px] overflow-hidden border border-white/5 bg-[#111111] shadow-2xl">
           <img 
              src={article.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.title)}&background=1a1a1a&color=f59e0b&size=1024`} 
              alt="Feature"
              className="h-full w-full object-cover"
           />
           {/* Static Badges from Image */}
           <div className="absolute bottom-10 left-10 flex gap-3">
              <span className={`
                px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2
                ${article.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-brand-500/10 text-brand-500 border border-brand-500/20'}
              `}>
                <span className={`h-1.5 w-1.5 rounded-full ${article.status === 'published' ? 'bg-emerald-400' : 'bg-brand-500'}`} />
                {article.status}
              </span>
              {article.categories && article.categories.length > 0 ? (
                article.categories.map(cat => (
                  <span key={cat._id} className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${getCategoryColor(cat.name)}`}>
                    {cat.name}
                  </span>
                ))
              ) : (
                <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${getCategoryColor(article.category || 'Tech')}`}>
                  {article.category || 'Tech'}
                </span>
              )}
           </div>
        </div>

        {/* Article Info Section */}
        <section className="space-y-8 px-4">
           {/* Title */}
           <h1 className="text-4xl font-black text-white leading-[1.2] tracking-tight">
             {article.title}
           </h1>

           {/* Metadata Hub */}
           <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-widest text-[#555555]">
              <div className="flex items-center gap-2.5">
                 <Clock className="h-4 w-4" />
                 {new Date(article.createdAt).toLocaleDateString(undefined, { 
                   month: 'short', day: '2-digit', year: 'numeric' 
                 })} at {new Date(article.createdAt).toLocaleTimeString(undefined, { 
                   hour: '2-digit', minute: '2-digit', hour12: true 
                 })}
              </div>
              <div className="flex items-center gap-2.5 hover:text-brand-500 cursor-pointer transition-colors">
                 <ExternalLink className="h-4 w-4" />
                 Google Trends
              </div>
              <div className="flex items-center gap-2.5">
                 <span className="text-[#333333]">Topic:</span>
                 <span className="text-[#888888]">{article.topic || article.title}</span>
              </div>
           </div>

           {/* Tags Capsules */}
           {article.tags?.length > 0 && (
             <div className="flex flex-wrap gap-2 pt-2">
                {article.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-lg bg-[#111111] border border-white/5 text-[10px] font-black uppercase tracking-widest text-[#555555] hover:text-white hover:border-brand-500/30 transition-all cursor-default">
                    {tag}
                  </span>
                ))}
             </div>
           )}

           <div className="h-px w-full bg-white/5 pt-4"></div>

           {/* Content Body */}
           <div className="prose prose-invert max-w-none prose-lg text-[#999999] leading-[1.8] font-medium pt-4">
              {article.content.split('\n').map((para, i) => para.trim() && (
                <p key={i} className="mb-6">{para}</p>
              ))}
           </div>
        </section>
      </div>

    </div>
  );
};

export default ArticleDetail;
