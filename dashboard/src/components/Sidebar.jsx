import React from 'react';
import { LayoutDashboard, Users, Clock, Phone, Settings, LogOut } from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Users, label: 'Students', path: '/students' },
        { icon: Clock, label: 'History', path: '/history' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 z-50 hidden md:flex flex-col transition-all duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <span className="font-bold text-white text-xl">C</span>
                </div>
                <div>
                    <h1 className="font-bold text-white text-lg tracking-tight">ClassFlow</h1>
                    <p className="text-xs text-slate-400">Teacher Portal</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-4">Menu</p>

                {menuItems.map((item, index) => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                                ? 'bg-primary-500/10 text-primary-500 shadow-lg shadow-primary-500/5 ring-1 ring-primary-500/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={active ? 'text-primary-500' : 'text-slate-400 group-hover:text-white'} />
                            <span className="font-medium">{item.label}</span>
                            {active && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5 mx-4 mb-4">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all">
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
