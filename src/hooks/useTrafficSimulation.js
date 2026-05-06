import { useState, useEffect, useRef } from 'react';
import { MOCK_STATS } from '../data/mockData';

const COIMBATORE_BOUNDS = {
    latMin: 10.9,
    latMax: 11.1,
    lonMin: 76.85,
    lonMax: 77.1,
};

const normalizeKey = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const REAL_JUNCTION_COORDS = {
    'psg tech main gate': [11.0247, 77.003],
    'peelamedu signal': [11.026, 77.004],
    'hopes college signal': [11.028, 77.012],
    'nava india junction': [11.018, 76.992],
    'fun republic mall road': [11.027, 77.015],
    'gandhipuram junction': [11.0168, 76.9673],
    'town hall': [10.9947, 76.9614],
    'ukkadam': [10.9909, 76.9598],
    'singanallur': [11.0056, 77.0347],
    'rs puram': [11.0051, 76.9515],
    'ganapathy': [11.0594, 76.9995],
    'saravanampatti': [11.0818, 77.0054],
    'avinashi road': [11.0185, 77.0368],
};

const resolveCoords = (junction) => {
    const key = normalizeKey(junction.name);
    const matched = REAL_JUNCTION_COORDS[key]
        || Object.entries(REAL_JUNCTION_COORDS).find(([candidate]) => key.includes(candidate) || candidate.includes(key))?.[1];

    if (matched) return matched;

    return [junction.latitude, junction.longitude];
};

const withinCoimbatore = (latitude, longitude) => (
    latitude >= COIMBATORE_BOUNDS.latMin &&
    latitude <= COIMBATORE_BOUNDS.latMax &&
    longitude >= COIMBATORE_BOUNDS.lonMin &&
    longitude <= COIMBATORE_BOUNDS.lonMax
);

const apiFetch = async (path) => {
    const token = sessionStorage.getItem('access_token');
    const res = await fetch(`http://localhost:8000${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const payload = await res.json();
    if (!res.ok || !payload.success) {
        throw new Error(payload.error || payload.detail || `Request failed: ${res.status}`);
    }
    return payload.data;
};

const getCongestionLabel = (congestionLevel) => {
    if (['CRITICAL', 'HIGH'].includes(congestionLevel)) return 'congested';
    if (congestionLevel === 'MEDIUM') return 'moderate';
    return 'smooth';
};

const normalizeJunction = (junction, activeCorridorIds = new Set()) => {
    const totalVehicles = Number(
        junction.vehicle_count ?? ((junction.vehicle_count_ns || 0) + (junction.vehicle_count_ew || 0))
    );
    const signalPhase = junction.signal_phase || junction.signal?.current_phase || 'NS_GREEN';
    const timeRemaining = Number(
        junction.time_remaining ?? (
            signalPhase === 'EW_GREEN'
                ? junction.signal?.green_duration_ew
                : junction.signal?.green_duration_ns
        ) ?? 30
    );

    return {
        id: junction.id,
        name: junction.name,
        coords: resolveCoords(junction),
        latitude: junction.latitude,
        longitude: junction.longitude,
        congestion_level: junction.congestion_level || 'LOW',
        status: getCongestionLabel(junction.congestion_level || 'LOW'),
        vehicle_count: totalVehicles,
        vehicles: totalVehicles,
        signal_phase: signalPhase,
        signal: signalPhase,
        time_remaining: timeRemaining,
        timeRemaining,
        speed: Math.max(8, 50 - Math.round(totalVehicles / 6)),
        is_active_corridor: activeCorridorIds.has(String(junction.id)),
    };
};

export const useTrafficSimulation = () => {
    const [junctions, setJunctions] = useState([]);
    const [corridors, setCorridors] = useState([]);
    const [stats, setStats] = useState(MOCK_STATS);
    const corridorIdsRef = useRef(new Set());
    const wsUpdateTimerRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const token = sessionStorage.getItem('access_token');

        const loadJunctions = async () => {
            try {
                const [junctionData, corridorData] = await Promise.all([
                    apiFetch('/junctions'),
                    apiFetch('/emergency/active'),
                ]);

                if (!mounted) return;

                const activeIds = new Set(
                    (corridorData || []).flatMap((corridor) => corridor.corridor_junction_ids || []).map(String)
                );
                corridorIdsRef.current = activeIds;
                setCorridors(corridorData || []);
                setJunctions(
                    (junctionData || [])
                        .filter((junction) => withinCoimbatore(junction.latitude, junction.longitude))
                        .map((junction) => normalizeJunction(junction, activeIds))
                );
            } catch {
                if (mounted) {
                    setCorridors([]);
                    setJunctions([]);
                }
            }
        };

        loadJunctions();

        const corridorRefresh = setInterval(async () => {
            try {
                const corridorData = await apiFetch('/emergency/active');
                if (!mounted) return;
                const activeIds = new Set(
                    (corridorData || []).flatMap((corridor) => corridor.corridor_junction_ids || []).map(String)
                );
                corridorIdsRef.current = activeIds;
                setCorridors(corridorData || []);
                setJunctions((current) => current.map((junction) => ({
                    ...junction,
                    is_active_corridor: activeIds.has(String(junction.id)),
                })));
            } catch {
                // Keep the last known corridor state if refresh fails.
            }
        }, 30000);

        let ws = null;
        if (token) {
            ws = new WebSocket(`ws://localhost:8000/ws/traffic?token=${token}`);

            ws.onmessage = (event) => {
                clearTimeout(wsUpdateTimerRef.current);
                wsUpdateTimerRef.current = setTimeout(() => {
                    try {
                        const payload = JSON.parse(event.data);
                        if (payload.type !== 'TRAFFIC_UPDATE') return;

                        const nextJunctions = (payload.junctions || [])
                            .filter((junction) => withinCoimbatore(junction.latitude, junction.longitude))
                            .map((junction) => {
                                const totalVehicles = (junction.vehicle_count_ns || 0) + (junction.vehicle_count_ew || 0);
                                const congestionLevel = junction.congestion_level || (
                                    totalVehicles < 50 ? 'LOW' : totalVehicles < 100 ? 'MEDIUM' : totalVehicles < 150 ? 'HIGH' : 'CRITICAL'
                                );
                                const signalPhase = junction.current_phase || 'NS_GREEN';
                                const timeRemaining = signalPhase === 'EW_GREEN'
                                    ? junction.green_duration_ew || 30
                                    : junction.green_duration_ns || 30;

                                return normalizeJunction({
                                    id: junction.id,
                                    name: junction.name,
                                    latitude: junction.latitude,
                                    longitude: junction.longitude,
                                    congestion_level: congestionLevel,
                                    signal_phase: signalPhase,
                                    vehicle_count: totalVehicles,
                                    time_remaining: timeRemaining,
                                }, corridorIdsRef.current);
                            });

                        setJunctions(nextJunctions);
                    } catch {
                        // Ignore malformed websocket payloads.
                    }
                }, 180);
            };

            ws.onerror = () => {
                // Keep the last loaded junctions when live updates fail.
            };
        }

        return () => {
            mounted = false;
            if (ws) ws.close();
            clearTimeout(wsUpdateTimerRef.current);
            clearInterval(corridorRefresh);
        };
    }, []);

    useEffect(() => {
        setStats((prev) =>
            prev.map((stat) => {
                if (stat.label !== 'Current Congestion') return stat;
                const congestedCount = junctions.filter((junction) => junction.status !== 'smooth').length;
                const next = junctions.length
                    ? Math.min(95, Math.max(5, Math.round((congestedCount / junctions.length) * 100)))
                    : 0;
                return { ...stat, value: `${next}%` };
            })
        );
    }, [junctions]);

    return { junctions, corridors, stats };
};
