import React from 'react';
import { useTrafficSimulation } from '../../hooks/useTrafficSimulation';
import { cn } from '../../utils/cn';
import { Clock, Users, ArrowUpRight, ShieldAlert, Cpu } from 'lucide-react';

const SignalControl = () => {
    const { junctions } = useTrafficSimulation();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Signal Control Interface</h2>
                    <p className="text-slate-400">Manual override and signal timing management</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-orange-600/10 text-orange-400 border border-orange-500/20 hover:bg-orange-600/20 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        <ShieldAlert size={16} className="mr-2" />
                        EMERGENCY RESET
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {junctions.map((junction) => (
                    <div key={junction.id} className="glass-card overflow-hidden group">
                        <div className={cn(
                            "h-1.5 w-full",
                            junction.signal === 'Red' ? "bg-red-500" :
                                junction.signal === 'Yellow' ? "bg-yellow-500" : "bg-green-500"
                        )}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-100">{junction.name}</h3>
                                    <p className="text-xs text-slate-500">{junction.id.toUpperCase()} • ID-NODE-ACTIVE</p>
                                </div>
                                <div className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold border",
                                    junction.signal === 'Red' ? "text-red-400 bg-red-400/10 border-red-500/20" :
                                        junction.signal === 'Yellow' ? "text-yellow-400 bg-yellow-400/10 border-yellow-500/20" :
                                            "text-green-400 bg-green-400/10 border-green-500/20"
                                )}>
                                    {junction.signal} PHASE
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center text-slate-500 mb-1">
                                        <Clock size={14} className="mr-2" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Time Rem.</span>
                                    </div>
                                    <span className="text-2xl font-mono font-bold text-slate-100">{junction.timeRemaining}s</span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center text-slate-500 mb-1">
                                        <Users size={14} className="mr-2" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Flow</span>
                                    </div>
                                    <span className="text-2xl font-mono font-bold text-slate-100">{junction.vehicles}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Manual Control Mode</span>
                                    <span className="text-blue-400 flex items-center cursor-pointer hover:underline">
                                        <Cpu size={12} className="mr-1" /> AI Optimized
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-xs font-medium transition-colors">
                                        MANUAL OVERRIDE
                                    </button>
                                    <button className="py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium transition-colors">
                                        ADJUST TIMING
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SignalControl;
