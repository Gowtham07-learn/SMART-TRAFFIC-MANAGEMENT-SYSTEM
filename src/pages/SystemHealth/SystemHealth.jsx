import React from 'react';
import { MOCK_HEALTH } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { ShieldCheck, Server, Video, Network, Cpu, AlertCircle, Brain, Activity } from 'lucide-react';

const SystemHealth = () => {
    const getIcon = (name) => {
        if (name.includes('Camera')) return <Video size={18} />;
        if (name.includes('Sensor')) return <Cpu size={18} />;
        if (name.includes('AI')) return <Brain size={18} />;
        if (name.includes('Database')) return <Server size={18} />;
        if (name.includes('API')) return <Network size={18} />;
        return <Activity size={18} />;
    };

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
                    { label: 'Uptime', val: '99.98%', detail: 'Last 7 days' },
                    { label: 'Avg Latency', val: '24ms', detail: 'Edge-to-Cloud' },
                    { label: 'Active Devices', val: '1,204', detail: '4 currently offline' },
                    { label: 'AI Accuracy', val: '96.2%', detail: 'L7 average' },
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
                    <h3 className="text-lg font-semibold text-slate-100">Infrastructure Nodes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase font-black">
                            <tr>
                                <th className="px-6 py-4">Node Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Resource Load</th>
                                <th className="px-6 py-4">Uptime</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-400 font-mono">
                            {MOCK_HEALTH.map((node, i) => (
                                <tr key={node.name} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-200 flex items-center font-sans">
                                        <div className="p-2 bg-slate-800 rounded-lg mr-3 text-slate-500">
                                            {node.name.includes('Camera') ? <Video size={16} /> :
                                                node.name.includes('Sensor') ? <Cpu size={16} /> :
                                                    node.name.includes('Database') ? <Server size={16} /> : <Network size={16} />}
                                        </div>
                                        {node.name}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                node.status === 'operational' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" :
                                                    node.status === 'warning' ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                                            )}></div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase",
                                                node.status === 'operational' ? "text-green-400" :
                                                    node.status === 'warning' ? "text-yellow-400" : "text-red-400"
                                            )}>{node.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex-1 h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                <div className={cn(
                                                    "h-full",
                                                    parseInt(node.load) > 80 ? "bg-red-500" :
                                                        parseInt(node.load) > 50 ? "bg-yellow-500" : "bg-blue-500"
                                                )} style={{ width: node.load }}></div>
                                            </div>
                                            <span className="text-xs">{node.load}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs">{node.uptime}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-colors">DIAGNOSTICS</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
