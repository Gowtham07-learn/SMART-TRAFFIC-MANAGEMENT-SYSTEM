import { useState, useEffect } from 'react';
import { MOCK_STATS } from '../data/mockData';

export const useTrafficSimulation = () => {
    const [junctions, setJunctions] = useState([]);
    const [stats, setStats] = useState(MOCK_STATS);

    useEffect(() => {
        const token = sessionStorage.getItem('access_token');
        const ws = new WebSocket(`ws://localhost:8000/ws/traffic?token=${token}`);

        ws.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            if (payload.type !== 'TRAFFIC_UPDATE') return;
            const mapped = (payload.junctions || []).map((j) => {
                const total = (j.vehicle_count_ns || 0) + (j.vehicle_count_ew || 0);
                return {
                    id: j.id,
                    name: j.name,
                    coords: [j.latitude, j.longitude],
                    status:
                        j.congestion_level === 'CRITICAL' || j.congestion_level === 'HIGH'
                            ? 'congested'
                            : j.congestion_level === 'MEDIUM'
                            ? 'moderate'
                            : 'smooth',
                    vehicles: total,
                    speed: 30,
                    signal: j.current_phase || 'NS_GREEN',
                    timeRemaining: j.green_duration_ns || 30,
                };
            });
            setJunctions(mapped);
        };

        ws.onerror = () => {
            setJunctions([]);
        };

        const interval = setInterval(() => {
            setStats((prev) =>
                prev.map((s) => {
                    if (s.label !== 'Current Congestion') return s;
                    const next = junctions.length
                        ? Math.min(95, Math.max(5, Math.round((junctions.filter((j) => j.status !== 'smooth').length / junctions.length) * 100)))
                        : 0;
                    return { ...s, value: `${next}%` };
                })
            );
        }, 1500);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, []);

    return { junctions, stats };
};
