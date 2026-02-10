import React from 'react';
import { LayoutDashboard, Users, Clock, Phone, Settings } from 'lucide-react';

const MobileNav = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Home', active: true },
        { icon: Users, label: 'People', active: false },
        { icon: Clock, label: 'History', active: false },
        { icon: Phone, label: 'Calls', active: false },
        { icon: Settings, label: 'Settings', active: false },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-50 md:hidden flex items-center justify-around px-2">
            {menuItems.map((item, index) => (
                <button
                    key={index}
                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${item.active
                            ? 'text-primary-500'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <item.icon size={20} className={item.active ? 'text-primary-500' : ''} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                    {item.active && (
                        <div className="absolute top-0 w-8 h-1 rounded-b-lg bg-primary-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    )}
                </button>
            ))}
        </div>
    );
};

export default MobileNav;
