import React from 'react';
import { StatCard } from '../../components/cards/StatCard';
import { TrafficLineChart } from '../../components/charts/TrafficLineChart';
import { useTrafficSimulation } from '../../hooks/useTrafficSimulation';
import { MOCK_CHART_DATA } from '../../data/mockData';
import { MapPin, ArrowRight, TrafficCone, Ambulance, Zap } from 'lucide-react';

const Dashboard = () => {
    const { stats, junctions } = useTrafficSimulation();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">City Overview</h2>
                    <p className="text-slate-400">Real-time traffic metrics and system status</p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Generate Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <TrafficLineChart data={MOCK_CHART_DATA} title="City-wide Traffic Volume (24h)" />
                </div>

                <div className="glass-card p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">Critical Junctions</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                        {junctions.filter(j => j.status === 'congested').map((junction) => (
                            <div key={junction.id} className="p-4 bg-slate-800/50 border border-red-500/20 rounded-xl flex items-center justify-between group hover:border-red-500/40 transition-all cursor-pointer">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-red-400/10 rounded-lg">
                                        <MapPin size={20} className="text-red-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-100">{junction.name}</h4>
                                        <p className="text-xs text-slate-400">{junction.vehicles} vehicles • {junction.speed} km/h</p>
                                    </div>
                                </div>
                                <ArrowRight size={16} className="text-slate-500 group-hover:text-red-400 transition-colors" />
                            </div>
                        ))}
                        {junctions.filter(j => j.status === 'congested').length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                                </div>
                                <p>No critical congestion detected</p>
                            </div>
                        )}
                    </div>
                    <button className="w-full mt-4 py-2 border border-slate-800 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all">
                        View All Junctions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-l-4 border-orange-500">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Active Alerts</h4>
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xl font-bold text-slate-100">2 High Priority</p>
                            <p className="text-xs text-slate-500 mt-1">Manual intervention recommended</p>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <TrafficCone className="text-orange-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Emergency Units</h4>
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xl font-bold text-slate-100">4 In Transit</p>
                            <p className="text-xs text-slate-500 mt-1">ETA reliability at 98%</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Ambulance className="text-blue-500" size={24} />
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 border-l-4 border-green-500">
                    <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">AI Confidence</h4>
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-xl font-bold text-slate-100">92.4% Score</p>
                            <p className="text-xs text-slate-500 mt-1">Model updated 12m ago</p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <Zap className="text-green-500" size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
