import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTrafficSimulation } from '../../hooks/useTrafficSimulation';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveTrafficMap = () => {
    const { junctions } = useTrafficSimulation();
    const center = [11.0247, 77.0030]; // PSG College of Technology

    const getStatusColor = (status) => {
        switch (status) {
            case 'congested': return '#ef4444';
            case 'moderate': return '#eab308';
            default: return '#22c55e';
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] w-full relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full z-10"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Tracking Location Marker */}
                <Marker position={center}>
                    <Popup className="custom-popup tracking-popup">
                        <div className="p-3 min-w-[220px] bg-slate-900 border border-blue-500/50 text-slate-100 rounded-lg shadow-xl shadow-blue-500/20">
                            <div className="flex items-center space-x-2 border-b border-slate-700/50 pb-2 mb-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <h3 className="font-bold text-blue-400 text-sm">Tracking Location</h3>
                            </div>
                            <p className="font-bold text-[13px] mb-1 text-white">PSG College of Technology</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                                Peelamedu,<br/>
                                Coimbatore - 641004,<br/>
                                Tamil Nadu, India.
                            </p>
                        </div>
                    </Popup>
                </Marker>

                {junctions.map((junction) => (
                    <CircleMarker
                        key={junction.id}
                        center={junction.coords}
                        pathOptions={{
                            color: getStatusColor(junction.status),
                            fillColor: getStatusColor(junction.status),
                            fillOpacity: 0.6,
                            weight: 2
                        }}
                        radius={10 + (junction.vehicles / 5)}
                    >
                        <Popup className="custom-popup">
                            <div className="p-2 min-w-[200px] bg-slate-900 text-slate-100 rounded-lg">
                                <h3 className="font-bold border-b border-slate-800 pb-2 mb-2">{junction.name}</h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Status:</span>
                                        <span className={getStatusColor(junction.status).replace('#', 'text-[#')}>
                                            {junction.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Vehicles:</span>
                                        <span className="font-mono">{junction.vehicles}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Avg Speed:</span>
                                        <span className="font-mono">{junction.speed} km/h</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Signal:</span>
                                        <span className="font-bold">{junction.signal} ({junction.timeRemaining}s)</span>
                                    </div>
                                </div>
                                <button className="w-full mt-4 bg-blue-600 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition-colors">
                                    OPEN CAMERA FEED
                                </button>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>

            {/* Map Overlay Controls */}
            <div className="absolute top-4 right-4 z-[1000] space-y-2">
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-xl w-64">
                    <h4 className="text-sm font-bold text-slate-100 mb-3">Map Layers</h4>
                    <div className="space-y-2">
                        {['Traffic Heatmap', 'Junction Nodes', 'Emergency Corridors', 'CCTV Feeds'].map(layer => (
                            <label key={layer} className="flex items-center space-x-3 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" defaultChecked={layer !== 'Traffic Heatmap'} className="sr-only peer" />
                                    <div className="w-10 h-5 bg-slate-800 rounded-full border border-slate-700 peer-checked:bg-blue-600 transition-colors"></div>
                                    <div className="absolute left-1 top-1 w-3 h-3 bg-slate-400 rounded-full transition-transform peer-checked:translate-x-5 peer-checked:bg-white"></div>
                                </div>
                                <span className="text-xs text-slate-300 group-hover:text-slate-100">{layer}</span>
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
