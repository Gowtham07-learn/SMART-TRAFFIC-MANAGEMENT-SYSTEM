import React, { useState, useEffect } from 'react';
import { MOCK_HEALTH } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { ShieldCheck, Server, Video, Network, Cpu, AlertCircle, Brain, Activity } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader } from '../../components/ui/Spinner';

const SystemHealth = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = () => api('/sensors').then(setHealth).catch(() => {}).finally(() => setLoading(false));
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, []);

    const getIcon = (name) => {
        if (!name) return <Activity size={18} />;
        if (name.includes('Camera')) return <Video size={18} />;
        if (name.includes('Sensor')) return <Cpu size={18} />;
        if (name.includes('AI')) return <Brain size={18} />;
        if (name.includes('Database')) return <Server size={18} />;
        if (name.includes('API')) return <Network size={18} />;
        return <Activity size={18} />;
    };

    if (loading) return <PageLoader />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">System Health</h2>
                    <p className="text-slate-400">Monitor edge devices and infrastructure status</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                    <ShieldCheck size={16} className="text-green-400" />
                    <span className="text-xs font-bold text-green-400">ALL CORE SYSTEMS NOMINAL</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Sensors', val: health?.total || '--', detail: 'Across all junctions' },
                    { label: 'Online Status', val: health?.online || '--', detail: 'Active & responding' },
                    { label: 'Offline Status', val: health?.offline || '--', detail: 'Currently disconnected' },
                    { label: 'Health Score', val: `${health?.health_percent || '--'}%`, detail: 'Overall system health' },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-5">
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-100">{stat.val}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{stat.detail}</p>
                    </div>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-100">Sensor Nodes</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {health?.sensors?.map(s => (
                        <div key={s.id} className="bg-slate-700/50 border border-slate-700 rounded-lg p-4 transition-all hover:bg-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-white text-sm font-bold flex items-center gap-2">
                                    {getIcon(s.sensor_type)} {s.sensor_code}
                                </span>
                                <span className={`w-2.5 h-2.5 rounded-full ${s.status === 'ONLINE' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400 animate-pulse shadow-[0_0_8px_#f87171]'}`} />
                            </div>
                            <p className="text-slate-400 text-xs mb-1">{s.sensor_type.replace('_', ' ')}</p>
                            <p className={`text-[10px] font-bold tracking-wider ${s.status === 'ONLINE' ? 'text-green-400' : 'text-red-400'}`}>{s.status}</p>
                        </div>
                    ))}
                    {(!health?.sensors || health.sensors.length === 0) && (
                        <div className="col-span-full py-8 text-center text-slate-500">
                            No sensor data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
