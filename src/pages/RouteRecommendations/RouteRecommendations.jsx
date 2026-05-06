import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { api } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { PageLoader, EmptyState, Spinner } from '../../components/ui/Spinner';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const greenIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const redIcon = new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

const CBE_CENTER = [11.0168, 77.0033];

export default function RouteRecommendations() {
  const [junctions, setJunctions] = useState([]);
  const [form, setForm] = useState({ s_location: '', s_lat: '', s_lon: '', d_location: '', d_lat: '', d_lon: '' });
  const [result, setResult] = useState(null);
  const [finding, setFinding] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api('/junctions').then(j => setJunctions(j)).catch(() => {});
  }, []);

  const fillFromJunction = (which, junction) => {
    setForm(f => ({
      ...f,
      [`${which}_location`]: junction.name,
      [`${which}_lat`]: junction.latitude,
      [`${which}_lon`]: junction.longitude,
    }));
  };

  const normalizeRouteResult = (data) => ({
    ...data,
    waypoints: data?.waypoints || data?.junctions || [],
  });

  const findRoute = async () => {
    if (!form.s_lat || !form.d_lat) { showToast('Select source and destination junctions', 'error'); return; }
    if (form.s_lat === form.d_lat && form.s_lon === form.d_lon) {
      showToast('Source and destination must be different junctions', 'error');
      return;
    }
    setFinding(true);
    try {
      const data = await api('/routes/find', {
        method: 'POST',
        body: JSON.stringify({
          s_location: form.s_location, s_lat: parseFloat(form.s_lat), s_lon: parseFloat(form.s_lon),
          d_location: form.d_location, d_lat: parseFloat(form.d_lat), d_lon: parseFloat(form.d_lon),
        }),
      });
      const normalized = normalizeRouteResult(data);
      setResult(normalized);
      setHistory(h => [normalized, ...h.slice(0, 4)]);
      showToast(`Route found: ${data.total_distance_km} km`, 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setFinding(false);
    }
  };

  const activeWaypoints = result?.waypoints || result?.junctions || [];
  const routeCoords = result?.path_coordinates?.length
    ? result.path_coordinates
    : activeWaypoints.map(j => [j.latitude, j.longitude]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Route Recommendations</h1>
        <p className="text-slate-400 text-sm mt-1">Find the optimal route through Coimbatore traffic network</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Route Finder Form */}
        <div className="bg-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">Plan Route</h2>

          <div>
            <label className="text-slate-300 text-xs font-medium block mb-1.5">📍 From (Source Junction)</label>
            <select onChange={e => { const j = junctions.find(x => x.id === e.target.value); if (j) fillFromJunction('s', j); }}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500">
              <option value="">-- Select source --</option>
              {junctions.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            {form.s_location && <p className="text-green-400 text-xs mt-1">✓ {form.s_location}</p>}
          </div>

          <div>
            <label className="text-slate-300 text-xs font-medium block mb-1.5">🏁 To (Destination Junction)</label>
            <select onChange={e => { const j = junctions.find(x => x.id === e.target.value); if (j) fillFromJunction('d', j); }}
              className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500">
              <option value="">-- Select destination --</option>
              {junctions.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
            {form.d_location && <p className="text-red-400 text-xs mt-1">✓ {form.d_location}</p>}
          </div>

          <button onClick={findRoute} disabled={finding}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
            {finding ? <><Spinner /><span>Finding route...</span></> : '🗺 Find Optimal Route'}
          </button>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-700 rounded-lg p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Route Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">{result.total_distance_km}</p>
                  <p className="text-slate-400 text-xs">km</p>
                </div>
                <div className="bg-slate-600 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-400">{result.estimated_time_minutes}</p>
                  <p className="text-slate-400 text-xs">minutes</p>
                </div>
              </div>
              <div>
                <p className="text-slate-300 text-xs font-medium mb-2">Waypoints ({activeWaypoints.length} junctions)</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {activeWaypoints.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">{i+1}</span>
                      {w.name}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Route History */}
          {history.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs font-medium mb-2">Recent Routes</p>
              {history.map((r, i) => (
                <div key={i} onClick={() => setResult(r)} className="flex justify-between text-xs text-slate-300 py-1.5 border-b border-slate-700 hover:text-white cursor-pointer">
                  <span>{r.source?.address || r.s_location || 'Source'} → {r.destination?.address || r.d_location || 'Destination'}</span>
                  <span className="text-blue-400">{r.total_distance_km} km</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl overflow-hidden" style={{ height: '520px' }}>
          {typeof window !== 'undefined' && (
            <MapContainer center={CBE_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {junctions.map(j => (
                <Marker key={j.id} position={[j.latitude, j.longitude]}>
                  <Popup><b>{j.name}</b><br />{j.location}</Popup>
                </Marker>
              ))}
              {activeWaypoints.length > 0 && (
                <>
                  <Marker position={[activeWaypoints[0].latitude, activeWaypoints[0].longitude]} icon={greenIcon}>
                    <Popup>🟢 Start: {activeWaypoints[0].name}</Popup>
                  </Marker>
                  <Marker position={[activeWaypoints[activeWaypoints.length - 1].latitude, activeWaypoints[activeWaypoints.length - 1].longitude]} icon={redIcon}>
                    <Popup>🔴 End: {activeWaypoints[activeWaypoints.length - 1].name}</Popup>
                  </Marker>
                  <Polyline positions={routeCoords} color="#3b82f6" weight={4} dashArray="8 4" />
                </>
              )}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
