import React from 'react';
import { Search, Bell, User, SearchIcon } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="h-20 w-full px-8 flex items-center justify-between glass border-b border-white/5 sticky top-0 z-40">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Search articles, trends, or system logs..."
            className="w-full h-11 pl-12 pr-4 bg-slate-900/50 border border-white/10 rounded-2xl focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all font-medium text-slate-300 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-6 ml-8">
        {/* Notifications */}
        <button className="relative p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-brand-500 rounded-full border-2 border-slate-950"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
            <User className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">Admin AI</p>
            <p className="text-xs text-slate-500">System Operator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
