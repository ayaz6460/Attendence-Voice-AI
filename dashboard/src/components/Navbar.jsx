import React from 'react';
import { Bell, Search, Calendar, ChevronDown } from 'lucide-react';

const Navbar = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <header className="fixed top-0 right-0 left-0 md:left-64 h-20 bg-slate-900/50 backdrop-blur-md border-b border-white/5 z-40 px-4 md:px-8 flex items-center justify-between">
            {/* Left: Context */}
            <div>
                <h2 className="text-xl font-semibold text-white">Attendance Dashboard</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    <Calendar size={14} />
                    <span>{today}</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>Computer Science (CS-A)</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="bg-slate-800/50 border border-white/5 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2.5 w-64 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>

                <button className="relative p-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-slate-900 rounded-full"></span>
                </button>

                <div className="h-8 w-px bg-white/10 mx-2"></div>

                <button className="flex items-center gap-3 p-1.5 pr-3 hover:bg-white/5 rounded-full transition-all border border-transparent hover:border-white/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            alt="User"
                            className="w-full h-full rounded-full bg-slate-900 object-cover"
                        />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-medium text-white leading-none">Prof. Anderson</p>
                        <p className="text-xs text-slate-400 mt-1">Computer Science</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-500" />
                </button>
            </div>
        </header>
    );
};

export default Navbar;
