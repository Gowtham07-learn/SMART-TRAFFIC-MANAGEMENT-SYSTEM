import React, { useEffect, useState } from 'react';
import { Ambulance, MapPin, Navigation, ShieldCheck, Timer } from 'lucide-react';
import { cn } from '../../utils/cn';

const EmergencyPriority = () => {
    const [activeCorridors, setActiveCorridors] = useState([]);

    const fetchActive = async () => {
        const token = sessionStorage.getItem('access_token');
        const res = await fetch('http://localhost:8000/emergency/active', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setActiveCorridors(
                data.data.map((c) => ({
                    id: c.id,
                    vehicle: 'EMERGENCY',
                    destination: 'Priority Route',
                    eta: 'Live',
                    progress: 50,
                    junctions: c.corridor_junction_ids?.length || 0,
                }))
            );
        }
    };

    const activateEmergency = async () => {
        const token = sessionStorage.getItem('access_token');
        const junctionRes = await fetch('http://localhost:8000/junctions', {
            headers: { Authorization: `Bearer ${token}` },
        });
        const junctionData = await junctionRes.json();
        const firstJunction = junctionData?.data?.[0];
        if (!firstJunction) return;
        const res = await fetch('http://localhost:8000/emergency/activate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                junction_id: firstJunction.id,
                heading_degrees: 90,
                vehicle_type: 'AMBULANCE',
            }),
        });
        await res.json();
        fetchActive();
    };

    useEffect(() => {
        fetchActive();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Emergency Priority</h2>
                    <p className="text-slate-400">Green corridor management and live vehicle tracking</p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={activateEmergency} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
                        <Ambulance size={18} className="mr-2" />
                        DISPATCH NEW CORRIDOR
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-slate-100 mb-6 flex items-center">
                            <Navigation size={20} className="mr-2 text-blue-400" />
                            Active Corridors
                        </h3>
                        <div className="space-y-4">
                            {activeCorridors.map((corridor) => (
                                <div key={corridor.id} className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                                <Ambulance className="text-blue-500" size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-100">{corridor.vehicle}</h4>
                                                <p className="text-xs text-slate-500">Destination: {corridor.destination}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-blue-400">{corridor.eta}</div>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">EST. ARRIVAL</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Route Progress</span>
                                            <span className="text-slate-100 font-bold">{corridor.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 transition-all duration-1000"
                                                style={{ width: `${corridor.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex space-x-2">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center border text-[10px] font-bold",
                                                    i <= Math.floor(corridor.progress / 20) + 1
                                                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                        : "bg-slate-800 border-slate-700 text-slate-500"
                                                )}>
                                                    J{i}
                                                </div>
                                            ))}
                                        </div>
                                        <button className="text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors uppercase tracking-widest">
                                            View Detailed Route
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 bg-gradient-to-br from-blue-900/20 to-slate-900">
                        <h3 className="text-lg font-semibold text-slate-100 mb-4">Route Coherence</h3>
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="64" cy="64" r="60" fill="transparent" stroke="#1e293b" strokeWidth="8" />
                                    <circle cx="64" cy="64" r="60" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeDasharray="377" strokeDashoffset="45" />
                                </svg>
                                <span className="absolute text-2xl font-bold text-slate-100">98%</span>
                            </div>
                            <p className="mt-4 text-sm text-slate-400 text-center">Signals are perfectly coordinated for the current priority routes.</p>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Nearby Units</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'FIRE STATION 4', dist: '1.2km', status: 'Ready' },
                                { name: 'MEDICAL HUB', dist: '2.8km', status: 'Busy' },
                                { name: 'POLICE DEP B', dist: '0.5km', status: 'Ready' },
                            ].map((unit, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800/50">
                                    <span className="text-xs font-medium text-slate-200">{unit.name}</span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                        unit.status === 'Ready' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                    )}>{unit.dist} • {unit.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmergencyPriority;
