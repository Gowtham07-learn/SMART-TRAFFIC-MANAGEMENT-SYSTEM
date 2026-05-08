import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../lib/api';
import { PageLoader, EmptyState } from '../../components/ui/Spinner';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COIMBATORE_BOUNDS = [
    [10.90, 76.85],
    [11.10, 77.10],
];
const MAP_CENTER = [11.0168, 76.9558];

const createPointIcon = (color) => {
    return L.divIcon({
        className: 'route-marker-icon',
        html: `
            <div class="relative flex items-center justify-center w-6 h-6">
                <span class="absolute w-4 h-4 rounded-full border border-white/70 shadow-lg" style="background:${color};"></span>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

export default function EmergencyRoute() {
    const [corridors, setCorridors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCorridors = () => {
            api('/emergency/active')
                .then(setCorridors)
                .catch(console.error)
                .finally(() => setLoading(false));
        };
        fetchCorridors();
        const t = setInterval(fetchCorridors, 5000);
        return () => clearInterval(t);
    }, []);

    const activeCorridor = corridors.length > 0 ? corridors[0] : null;

    const [routeGeometry, setRouteGeometry] = useState([]);
    const [estimatedTime, setEstimatedTime] = useState(null);

    useEffect(() => {
        if (!activeCorridor) return;
        const routeJunctions = activeCorridor.corridor_junctions || [];
        if (routeJunctions.length < 2) {
            setRouteGeometry([]);
            return;
        }

        const coords = routeJunctions.map(j => `${j.longitude},${j.latitude}`).join(';');
        fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const geometry = data.routes[0].geometry.coordinates;
                    setRouteGeometry(geometry.map(coord => [coord[1], coord[0]]));
                    setEstimatedTime(data.routes[0].duration);
                }
            })
            .catch(console.error);
    }, [activeCorridor]);

    if (loading) return <PageLoader />;

    if (!activeCorridor) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-white mb-6">Navigation Route</h1>
                <EmptyState message="No active emergency routes found." icon="🗺️" />
            </div>
        );
    }

    const routeJunctions = activeCorridor.corridor_junctions || [];
    const positions = routeJunctions.map(j => [j.latitude, j.longitude]);
    const startJunction = routeJunctions[0];
    const destinationJunction = routeJunctions[routeJunctions.length - 1];

    const polylinePositions = routeGeometry.length > 0 ? routeGeometry : positions;

    return (
        <div className="p-6 space-y-6 h-[calc(100vh-80px)] flex flex-col">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="text-blue-400 text-xl">🗺️</span>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Navigation Route</h1>
                    <p className="text-slate-400 text-sm">Real-time emergency routing guidance</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative h-[400px] lg:h-full">
                    <MapContainer
                        center={startJunction ? [startJunction.latitude, startJunction.longitude] : MAP_CENTER}
                        zoom={14}
                        scrollWheelZoom
                        className="h-full w-full z-10"
                        maxBounds={COIMBATORE_BOUNDS}
                        maxBoundsViscosity={1.0}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        
                        {polylinePositions.length > 1 && (
                            <Polyline
                                positions={polylinePositions}
                                pathOptions={{ color: '#3b82f6', weight: 6, opacity: 0.8 }}
                            />
                        )}

                        {startJunction && (
                            <Marker position={[startJunction.latitude, startJunction.longitude]} icon={createPointIcon('#ef4444')}>
                                <Popup><div className="font-bold">Start: {startJunction.name}</div></Popup>
                            </Marker>
                        )}

                        {destinationJunction && (
                            <Marker position={[destinationJunction.latitude, destinationJunction.longitude]} icon={createPointIcon('#22c55e')}>
                                <Popup><div className="font-bold">Destination: {destinationJunction.name}</div></Popup>
                            </Marker>
                        )}
                    </MapContainer>
                    
                    <div className="absolute top-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-lg shadow-xl">
                        <p className="text-sm font-semibold text-white">Active Route: {activeCorridor.vehicle_type}</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Expires in {Math.floor(Math.max(0, Math.round((new Date(activeCorridor.expires_at) - Date.now()) / 1000)) / 60)}m {Math.max(0, Math.round((new Date(activeCorridor.expires_at) - Date.now()) / 1000)) % 60}s
                        </p>
                        {estimatedTime !== null && (
                            <p className="text-xs text-blue-400 mt-1 font-medium">
                                ETA: {Math.ceil(estimatedTime / 60)} mins
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-5 overflow-y-auto lg:h-full">
                    <h2 className="text-white font-semibold mb-4 text-lg">Route Guidance</h2>
                    
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-600 before:to-transparent">
                        {routeJunctions.map((j, idx) => {
                            const isStart = idx === 0;
                            const isEnd = idx === routeJunctions.length - 1;
                            
                            return (
                                <div key={j.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-800 bg-slate-700 text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        {isStart ? '🏁' : isEnd ? '🏥' : '🚦'}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-700 bg-slate-800/50 shadow-md">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-slate-100">{isStart ? 'Start' : isEnd ? 'Destination' : `Junction ${idx + 1}`}</div>
                                        </div>
                                        <div className="text-slate-400 text-sm">
                                            {j.name}
                                        </div>
                                        {!isEnd && (
                                            <div className="mt-2 text-xs font-semibold text-green-400 bg-green-400/10 inline-block px-2 py-1 rounded">
                                                🟢 CLEARED
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
