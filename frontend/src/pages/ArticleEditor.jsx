import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { articleApi } from '../api/articles';
import { 
  ArrowLeft, 
  Sparkles, 
  ChevronDown, 
  Image as ImageIcon,
  CheckCircle2,
  Save,
  Send,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  List,
  Quote,
  Minus,
  Link2,
  Undo2,
  Redo2,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    summary: '',
    content: '',
    imageUrl: '',
    tags: [],
    status: 'draft',
    categoryNames: ['Tech']
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await articleApi.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();

    // Handling topic pre-population for new articles
    const searchParams = new URLSearchParams(location.search);
    const topicParam = searchParams.get('topic');
    
    if (!isEdit && topicParam) {
      setFormData(prev => ({
        ...prev,
        title: topicParam,
        topic: topicParam.toLowerCase().replace(/[^a-z0-9]/g, '-')
      }));
    }

    if (isEdit) {
      const fetchArticle = async () => {
        try {
          console.log('Fetching Article ID:', id);
          const data = await articleApi.getById(id);
          console.log('Article Data Received:', data);
          const article = data.article || data;
          
          setFormData({
            title: article.title || '',
            topic: article.topic || '',
            summary: article.summary || '',
            content: article.content || '',
            imageUrl: article.imageUrl || '',
            tags: article.tags || [],
            status: article.status || 'draft',
            categoryNames: article.categories?.map(c => c.name) || [article.category].filter(Boolean) || ['Tech']
          });
        } catch (error) {
          console.error('Fetch Error:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchArticle();
    }
  }, [id, isEdit, location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (status) => {
    setLoading(true);
    try {
      const payload = { ...formData, status: status || formData.status };
      if (isEdit) {
        await articleApi.update(id, payload);
      } else {
        await articleApi.create(payload);
      }
      navigate('/articles');
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (name) => {
    const current = formData.categoryNames || [];
    const updated = current.includes(name)
      ? current.filter(n => n !== name)
      : [...current, name];
    setFormData({ ...formData, categoryNames: updated });
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-pulse">
        <Activity className="h-10 w-10 text-brand-500 animate-spin" />
        <p className="text-[#444444] font-black uppercase tracking-widest text-[10px]">Reconstructing article stream...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-32 animate-fade-in relative min-h-screen">
      {/* Upper Navigation Track */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-6">
          <Link to={isEdit ? `/articles/${id}` : "/articles"} className="flex items-center gap-2 text-[#666666] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {isEdit ? 'Back to article' : 'Back to articles'}
          </Link>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          {isEdit && (
            <p className="text-[10px] text-[#444444] font-black uppercase tracking-widest hidden md:block">
               Editing: <span className="text-slate-300">{formData.title}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
           <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              <Sparkles className="h-4 w-4 text-brand-500" />
              AI Generate
           </button>
           <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${formData.status === 'published' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400'}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full mr-2 ${formData.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {formData.status}
           </span>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Form */}
        <div className="lg:col-span-2 space-y-8">
           <section className="p-8 rounded-[40px] bg-[#111111] border border-white/5 space-y-8">
              {/* Title Input */}
              <div className="space-y-3">
                 <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Title</label>
                 <input 
                   name="title"
                   value={formData.title}
                   onChange={handleChange}
                   placeholder="Enter article headline..."
                   className="w-full h-12 px-5 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 font-bold text-slate-200 placeholder:text-[#333333]"
                 />
              </div>

              {/* Slug Input */}
              <div className="space-y-3">
                 <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Slug</label>
                 <input 
                   name="topic"
                   value={formData.topic}
                   onChange={handleChange}
                   placeholder="e.g. ai-regulation-framework-2025"
                   className="w-full h-12 px-5 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 font-bold text-slate-500 placeholder:text-[#333333] text-sm"
                 />
              </div>

              {/* Excerpt */}
              <div className="space-y-3">
                 <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Excerpt</label>
                 <textarea 
                   name="summary"
                   value={formData.summary}
                   onChange={handleChange}
                   rows={3}
                   placeholder="Brief summary for display..."
                   className="w-full p-5 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 font-medium text-slate-400 placeholder:text-[#333333] text-sm resize-none leading-relaxed"
                 />
              </div>
           </section>

           {/* Content Editor Simulation */}
           <section className="p-8 rounded-[40px] bg-[#111111] border border-white/5 flex flex-col min-h-[500px]">
              <div className="mb-6 flex items-center justify-between">
                 <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Content</h4>
              </div>
              
              {/* Toolbar */}
              <div className="p-2 mb-6 bg-slate-950/50 border border-white/5 rounded-2xl flex flex-wrap items-center gap-1">
                 {[Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, AlignLeft, List, Quote, Minus, Link2, Undo2, Redo2].map((Icon, i) => (
                   <button key={i} type="button" className="p-2 rounded-lg hover:bg-white/5 text-[#555555] hover:text-white transition-all">
                      <Icon className="h-4 w-4" />
                   </button>
                 ))}
              </div>

              <textarea 
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Full article content here..."
                className="flex-1 w-full bg-transparent border-none focus:outline-none text-slate-100 font-medium leading-[2] text-sm resize-none placeholder:text-[#333333]"
              />
           </section>
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-8">
           {/* Metadata Sidebar Card */}
           <section className="p-8 rounded-[40px] bg-[#111111] border border-white/5 space-y-8">
              <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Metadata</h4>
              
              {/* Category Multi-Selection */}
              <div className="space-y-4">
                 <label className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Categories</label>
                 <div className="grid grid-cols-1 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => toggleCategory(cat.name)}
                        className={`
                          px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all
                          ${formData.categoryNames?.includes(cat.name) 
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-500' 
                            : 'bg-slate-950/50 border-white/5 text-[#444444] hover:bg-white/5'}
                        `}
                      >
                         {cat.name}
                         {formData.categoryNames?.includes(cat.name) && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Featured Image */}
              <div className="space-y-4">
                 <label className="text-slate-400 font-bold text-xs">Featured Image URL</label>
                 <input 
                   name="imageUrl"
                   value={formData.imageUrl}
                   onChange={handleChange}
                   placeholder="https://..."
                   className="w-full h-11 px-4 bg-slate-950/50 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs font-medium text-slate-500 truncate"
                 />
                 <div className="aspect-video rounded-2xl bg-slate-950/50 border border-white/5 overflow-hidden group relative">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#222222]">
                         <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                 </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                 <label className="text-slate-400 font-bold text-xs">Tags (comma-separated)</label>
                 <input 
                   name="tags"
                   value={formData.tags.join(', ')}
                   onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                   placeholder="AI, News, Tech..."
                   className="w-full h-11 px-4 bg-slate-950/50 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs font-bold text-slate-300"
                 />
              </div>
           </section>

           {/* SEO Settings Sidebar Card */}
           <section className="p-8 rounded-[40px] bg-[#111111] border border-white/5 space-y-8">
              <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">SEO SETTINGS</h4>
              
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-slate-400 font-bold text-xs uppercase tracking-widest">SEO Title</label>
                    <span className="text-[9px] text-[#444444] font-black">48/60</span>
                 </div>
                 <input 
                   defaultValue={formData.title}
                   className="w-full h-11 px-4 bg-slate-950/50 border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs font-bold text-slate-300"
                 />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-slate-400 font-bold text-xs uppercase tracking-widest">SEO Description</label>
                    <span className="text-[9px] text-[#444444] font-black">101/160</span>
                 </div>
                 <textarea 
                   rows={3}
                   defaultValue={formData.summary}
                   className="w-full p-4 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500/30 text-xs font-medium text-slate-500 resize-none leading-relaxed"
                 />
              </div>
           </section>
        </aside>
      </div>

      {/* Bottom Floating Bar */}
      <footer className="fixed bottom-0 left-64 right-0 h-24 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-12 z-50">
        <div className="flex items-center gap-4">
           <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${formData.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-500/10 text-brand-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${formData.status === 'published' ? 'bg-emerald-400' : 'bg-brand-500'}`} />
              {formData.status}
           </span>
           <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate max-w-sm">
              {formData.title || 'Untitled Node'}
           </span>
        </div>

        <div className="flex items-center gap-4">
           <button 
             onClick={() => handleSave('draft')}
             disabled={loading}
             className="px-6 h-12 rounded-2xl bg-white/5 border border-white/5 text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
           >
              {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
           </button>
           <button 
             onClick={() => handleSave('published')}
             disabled={loading}
             className="px-8 h-12 rounded-2xl bg-brand-500 text-[#0a0a0a] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-500/10 hover:bg-brand-400 transition-all flex items-center gap-3"
           >
              <Send className="h-4 w-4" />
              Publish
           </button>
        </div>
      </footer>
    </div>
  );
};

export default ArticleEditor;
