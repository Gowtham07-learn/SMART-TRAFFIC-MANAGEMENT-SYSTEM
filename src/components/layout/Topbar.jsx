import React from 'react';
import { Bell, Search, Calendar, Clock } from 'lucide-react';

export const Topbar = () => {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="h-16 bg-slate-950/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center space-x-6 flex-1">
                <div className="relative w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search junctions, corridors, cameras..."
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <div className="hidden lg:flex items-center space-x-4 border-r border-slate-800 pr-6">
                    <div className="flex items-center text-slate-400 text-sm space-x-2">
                        <Calendar size={14} />
                        <span>{time.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-slate-400 text-sm space-x-2">
                        <Clock size={14} />
                        <span>{time.toLocaleTimeString()}</span>
                    </div>
                </div>

                <button className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
                </button>

                <div className="flex items-center space-x-2 text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    SYSTEM LIVE
                </div>
            </div>
        </header>
    );
};
