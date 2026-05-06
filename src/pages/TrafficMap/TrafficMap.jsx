import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useTrafficSimulation } from '../../hooks/useTrafficSimulation';
import { RoutePolyline } from '../../components/ui/RoutePolyline';
import L from 'leaflet';
import 'leaflet.markercluster';

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

const getCongestionColor = (congestionLevel) => {
    switch (congestionLevel) {
        case 'CRITICAL':
        case 'HIGH':
        case 'congested':
            return '#ef4444';
        case 'MEDIUM':
        case 'moderate':
            return '#eab308';
        default:
            return '#22c55e';
    }
};

const createJunctionIcon = (junction) => {
    const congestionColor = getCongestionColor(junction.congestion_level || junction.status);
    const isActive = junction.is_active_corridor;
    const radius = Math.max(12, Math.min(26, 12 + Math.round((junction.vehicle_count || junction.vehicles || 0) / 12)));
    const outerRadius = radius + 10;

    return L.divIcon({
        className: 'junction-marker-icon',
        html: `
            <div class="relative flex items-center justify-center" style="width:${outerRadius}px;height:${outerRadius}px;">
                ${isActive || congestionColor === '#ef4444' ? `<span class="absolute inset-0 rounded-full animate-ping opacity-30" style="background:${congestionColor};"></span>` : ''}
                <span class="absolute rounded-full border border-white/70 ${isActive ? 'shadow-[0_0_24px_rgba(59,130,246,0.7)]' : 'shadow-[0_0_18px_rgba(0,0,0,0.35)]'}" style="width:${radius}px;height:${radius}px;background:${congestionColor};"></span>
                ${isActive ? '<span class="absolute inset-1 rounded-full border-2 border-blue-300/80"></span>' : ''}
            </div>
        `,
        iconSize: [outerRadius, outerRadius],
        iconAnchor: [outerRadius / 2, outerRadius / 2],
        popupAnchor: [0, -(outerRadius / 2)],
    });
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]|'/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[char]));

const createPopupHtml = (junction) => `
    <div class="p-3 min-w-[220px] bg-slate-900 text-slate-100 rounded-lg border border-slate-800 shadow-xl">
        <h3 class="font-bold text-base border-b border-slate-800 pb-2 mb-3">${escapeHtml(junction.name)}</h3>
        <div class="space-y-2 text-sm">
            <div class="flex justify-between gap-4"><span class="text-slate-400">Signal phase</span><span class="font-semibold">${escapeHtml(junction.signal_phase)}</span></div>
            <div class="flex justify-between gap-4"><span class="text-slate-400">Vehicle count</span><span class="font-semibold">${escapeHtml(junction.vehicle_count)}</span></div>
            <div class="flex justify-between gap-4"><span class="text-slate-400">Time remaining</span><span class="font-semibold">${escapeHtml(junction.time_remaining)}s</span></div>
            <div class="flex justify-between gap-4"><span class="text-slate-400">Congestion</span><span class="font-semibold" style="color:${getCongestionColor(junction.congestion_level || junction.status)}">${escapeHtml(junction.congestion_level || junction.status)}</span></div>
        </div>
        ${junction.is_active_corridor ? '<div class="mt-3 text-[11px] uppercase tracking-[0.24em] text-blue-300 font-semibold">Active emergency corridor</div>' : ''}
    </div>
`;

const ClusteredJunctionLayer = ({ junctions }) => {
    const map = useMap();

    useEffect(() => {
        const clusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
        });

        junctions.forEach((junction) => {
            const marker = L.marker(junction.coords, {
                icon: createJunctionIcon(junction),
            });
            marker.bindPopup(createPopupHtml(junction));
            clusterGroup.addLayer(marker);
        });

        map.addLayer(clusterGroup);
        return () => map.removeLayer(clusterGroup);
    }, [junctions, map]);

    return null;
};

const LiveTrafficMap = () => {
    const { junctions, corridors } = useTrafficSimulation();
    const [layers, setLayers] = useState({
        junctionNodes: true,
        trafficHeatmap: false,
    });

    const activeCorridorNodes = useMemo(() => new Set(
        corridors.flatMap((corridor) => corridor.corridor_junction_ids || []).map(String)
    ), [corridors]);

    const visibleJunctions = useMemo(() => junctions.filter((junction) => (
        junction.latitude >= COIMBATORE_BOUNDS[0][0] &&
        junction.latitude <= COIMBATORE_BOUNDS[1][0] &&
        junction.longitude >= COIMBATORE_BOUNDS[0][1] &&
        junction.longitude <= COIMBATORE_BOUNDS[1][1]
    )), [junctions]);

    const junctionMarkers = visibleJunctions.map((junction) => (
        <Marker
            key={junction.id}
            position={junction.coords}
            icon={createJunctionIcon({
                ...junction,
                is_active_corridor: junction.is_active_corridor || activeCorridorNodes.has(String(junction.id)),
            })}
        >
            <Popup className="custom-popup">
                <div className="p-3 min-w-[220px] bg-slate-900 text-slate-100 rounded-lg border border-slate-800 shadow-xl">
                    <h3 className="font-bold text-base border-b border-slate-800 pb-2 mb-3">{junction.name}</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between gap-4"><span className="text-slate-400">Signal phase</span><span className="font-semibold">{junction.signal_phase}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-400">Vehicle count</span><span className="font-semibold">{junction.vehicle_count}</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-400">Time remaining</span><span className="font-semibold">{junction.time_remaining}s</span></div>
                        <div className="flex justify-between gap-4"><span className="text-slate-400">Congestion</span><span className="font-semibold" style={{ color: getCongestionColor(junction.congestion_level || junction.status) }}>{junction.congestion_level || junction.status}</span></div>
                    </div>
                    {junction.is_active_corridor && (
                        <div className="mt-3 text-[11px] uppercase tracking-[0.24em] text-blue-300 font-semibold">Active emergency corridor</div>
                    )}
                </div>
            </Popup>
        </Marker>
    ));



    return (
        <div className="h-[calc(100vh-120px)] w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <MapContainer
                center={MAP_CENTER}
                zoom={12}
                scrollWheelZoom
                className="h-full w-full z-10"
                maxBounds={COIMBATORE_BOUNDS}
                maxBoundsViscosity={1.0}
                minZoom={11}
                maxZoom={17}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {layers.trafficHeatmap && visibleJunctions.map((junction) => (
                    <CircleMarker
                        key={`heat-${junction.id}`}
                        center={junction.coords}
                        pathOptions={{
                            color: getCongestionColor(junction.congestion_level || junction.status),
                            fillColor: getCongestionColor(junction.congestion_level || junction.status),
                            fillOpacity: 0.12,
                            weight: 0,
                        }}
                        radius={Math.max(24, Math.min(60, 18 + (junction.vehicle_count / 2)))}
                    />
                ))}

                {layers.junctionNodes && (
                    visibleJunctions.length > 50 ? (
                        <ClusteredJunctionLayer
                            junctions={visibleJunctions.map((junction) => ({
                                ...junction,
                                is_active_corridor: junction.is_active_corridor || activeCorridorNodes.has(String(junction.id)),
                            }))}
                        />
                    ) : (
                        junctionMarkers
                    )
                )}
            </MapContainer>

            <div className="absolute top-4 right-4 z-[1000] space-y-2">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl w-64">
                    <h4 className="text-sm font-bold text-slate-100 mb-3">Map Layers</h4>
                    <div className="space-y-2">
                        {[
                            ['junctionNodes', 'Junction Nodes'],
                            ['trafficHeatmap', 'Traffic Heatmap'],
                        ].map(([key, label]) => (
                            <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={layers[key]}
                                        onChange={(event) => setLayers((current) => ({ ...current, [key]: event.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-slate-800 rounded-full border border-slate-700 peer-checked:bg-blue-600 transition-colors"></div>
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-slate-400 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-white"></div>
                                </div>
                                <span className="text-xs text-slate-300 group-hover:text-slate-100">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex space-x-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-6 py-3 rounded-full shadow-2xl">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs text-slate-300">Smooth</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-slate-300">Moderate</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-slate-300">Congested</span>
                </div>
            </div>
        </div>
    );
};

export default LiveTrafficMap;
