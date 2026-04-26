import React, { useEffect, useState } from 'react';
import { TrafficLineChart } from '../../components/charts/TrafficLineChart';
import { Brain, TrendingUp, AlertCircle, Clock, Timer, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

const TrafficPrediction = () => {
    const [PREDICTED_DATA, setPredictedData] = useState([]);

    useEffect(() => {
        const run = async () => {
            const token = sessionStorage.getItem('access_token');
            const junctionRes = await fetch('http://localhost:8000/junctions', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const junctionData = await junctionRes.json();
            const first = junctionData?.data?.[0];
            if (!first) return;
            const res = await fetch(
                `http://localhost:8000/predict/traffic?junction_id=${first.id}&minutes=30`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) {
                setPredictedData(
                    data.data.forecast.map((p) => ({
                        time: `${p.minutes_from_now}m`,
                        volume: p.predicted_volume,
                    }))
                );
            }
        };
        run();
    }, []);

    const hotspots = [
        { location: 'Central Freeway', probability: 85, duration: '45m', start: '16:45' },
        { location: 'Harbor Bridge', probability: 42, duration: '15m', start: '17:15' },
        { location: 'Market St.', probability: 68, duration: '30m', start: '16:30' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">AI Traffic Prediction</h2>
                    <p className="text-slate-400">Deep learning forecast of city congestion patterns</p>
                </div>
                <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                    <Brain size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-400">NEURAL-MODEL-V4 ACTIVE</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2">
                    <TrafficLineChart data={PREDICTED_DATA} title="Projected Congestion (Next 6 Hours)" />
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
                            <AlertCircle size={20} className="mr-2 text-orange-400" />
                            Predicted Hotspots
                        </h3>
                        <div className="space-y-4">
                            {hotspots.map((spot, i) => (
                                <div key={i} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl relative overflow-hidden group">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-orange-500/10 transition-all duration-1000"
                                        style={{ width: `${spot.probability}%` }}
                                    ></div>
                                    <div className="relative flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-100">{spot.location}</h4>
                                            <div className="flex items-center mt-1 space-x-3 text-xs text-slate-400">
                                                <span className="flex items-center"><Clock size={12} className="mr-1" /> {spot.start}</span>
                                                <span className="flex items-center"><Timer size={12} className="mr-1" /> {spot.duration}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn(
                                                "text-sm font-bold",
                                                spot.probability > 70 ? "text-red-400" : "text-orange-400"
                                            )}>{spot.probability}%</span>
                                            <p className="text-[10px] text-slate-500 uppercase font-black">Prob.</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all uppercase tracking-widest">
                            View Map Forecast
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 flex items-center space-x-6">
                    <div className="p-4 bg-blue-500/10 rounded-2xl">
                        <TrendingUp className="text-blue-500" size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-100">System Accuracy</h4>
                        <p className="text-sm text-slate-400">Predictive models are operating at 94.2% historical accuracy over the last 30 days.</p>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center space-x-6">
                    <div className="p-4 bg-purple-500/10 rounded-2xl">
                        <Zap className="text-purple-500" size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-100">Event Impact</h4>
                        <p className="text-sm text-slate-400">Upcoming stadium event detected at 19:00. Adjusting signal timings city-wide.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrafficPrediction;
