import React from 'react';
import { Play, RotateCcw, Save, Settings2, BarChart, Clock, Fuel, Wind, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

const DigitalTwin = () => {
    const metrics = [
        { label: 'Avg Delay', value: '+1.2s', trend: 'up', color: 'text-red-400' },
        { label: 'Throughput', value: '4,200/h', trend: 'down', color: 'text-green-400' },
        { label: 'Fuel Saved', value: '128L', trend: 'up', color: 'text-blue-400' },
        { label: 'CO₂ Impact', value: '-12kg', trend: 'down', color: 'text-green-400' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Digital Twin Simulator</h2>
                    <p className="text-slate-400">Run "what-if" scenarios on city traffic models</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        <RotateCcw size={16} className="mr-2" /> Reset
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        <Play size={16} className="mr-2" /> RUN SIMULATION
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                        <Settings2 size={16} className="mr-2" /> Scenario Builder
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-2">Simulation Base</label>
                            <select className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500">
                                <option>Current Live State</option>
                                <option>Monday Morning Rush</option>
                                <option>Friday Evening Peak</option>
                                <option>Rainy Day Conditions</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 block">Traffic Volume Multiplier</label>
                            <input type="range" className="w-full accent-blue-500" min="0.5" max="2.0" step="0.1" />
                            <div className="flex justify-between text-[10px] text-slate-600">
                                <span>0.5x</span>
                                <span>Normal</span>
                                <span>2.0x</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-800">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase">Inject Events</h4>
                            {[
                                { name: 'Road Construction', color: 'bg-orange-500' },
                                { name: 'Public Protest', color: 'bg-red-500' },
                                { name: 'Stadium Event', color: 'bg-blue-500' },
                                { name: 'VIP Convoy', color: 'bg-purple-500' },
                            ].map(event => (
                                <button key={event.name} className="w-full text-left px-3 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 transition-all flex items-center">
                                    <span className={cn("w-2 h-2 rounded-full mr-2", event.color)}></span>
                                    {event.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 glass-card p-6 bg-slate-900/30 overflow-hidden relative min-h-[500px] flex items-center justify-center border-2 border-dashed border-slate-800">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                            <Zap className="text-blue-500 animate-pulse" size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-100">Simulation Engine Ready</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Configure parameters on the left and click 'Run Simulation' to visualize flow changes.</p>
                    </div>

                    {/* Animated decorative elements to simulate a map system */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <div className="absolute top-10 left-10 w-96 h-1 bg-blue-500/30 rotate-45"></div>
                        <div className="absolute top-40 left-0 w-full h-px bg-slate-800"></div>
                        <div className="absolute top-0 left-60 w-px h-full bg-slate-800"></div>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center">
                        <BarChart size={16} className="mr-2" /> Projected Results
                    </h3>
                    <div className="space-y-4">
                        {metrics.map((metric, i) => (
                            <div key={i} className="p-4 bg-slate-800/30 border border-slate-800 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 font-medium">{metric.label}</span>
                                    <span className={cn("text-lg font-bold", metric.color)}>{metric.value}</span>
                                </div>
                                <div className="flex items-center mt-2">
                                    <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={cn("h-full transition-all duration-500", metric.color.replace('text', 'bg'))} style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-all flex items-center justify-center">
                        <Save size={14} className="mr-2" /> SAVE SCENARIO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalTwin;
