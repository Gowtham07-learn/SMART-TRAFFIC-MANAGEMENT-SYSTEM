import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { Spinner, EmptyState, PageLoader } from '../../components/ui/Spinner';

export default function EmergencyPriority() {
  const [junctions, setJunctions] = useState([]);
  const [form, setForm] = useState({ junction_id: '', heading_degrees: 0, vehicle_type: 'AMBULANCE' });
  const [activating, setActivating] = useState(false);
  const [activeCorridors, setActiveCorridors] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api('/junctions').then(setJunctions).catch(() => {});
    loadCorridors();
    const t = setInterval(loadCorridors, 5000);
    return () => clearInterval(t);
  }, []);

  const loadCorridors = () => api('/emergency/active').then(setActiveCorridors).catch(() => {});

  const activate = async () => {
    if (!form.junction_id) { showToast('Select a starting junction', 'error'); return; }
    setActivating(true);
    try {
      const data = await api('/emergency/activate', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(data);
      showToast(`🚨 Green corridor activated! ${data.corridor_junctions?.length || 0} junctions cleared`, 'success');
      loadCorridors();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setActivating(false);
    }
  };

  const cancelCorridor = async (corridorId) => {
    try {
      await api(`/emergency/${corridorId}/cancel`, { method: 'DELETE' });
      showToast('Corridor cancelled', 'info');
      loadCorridors();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
          <span className="text-red-400 text-xl">🚨</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency Priority</h1>
          <p className="text-slate-400 text-sm">Activate green corridor for emergency vehicles</p>
        </div>
      </div>

      {/* Active Corridors Banner */}
      {activeCorridors.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-semibold text-sm mb-3">🔴 {activeCorridors.length} Active Corridor(s)</p>
          <div className="space-y-2">
            {activeCorridors.map(c => {
              const expiresAt = new Date(c.expires_at);
              const secsLeft = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
              return (
                <div key={c.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                  <div>
                    <p className="text-white text-sm font-medium">{c.vehicle_type} — {c.corridor_junction_ids?.length || 0} junctions</p>
                    <p className="text-slate-400 text-xs">Expires in {secsLeft}s • Heading {c.heading_degrees}°</p>
                  </div>
                  <button onClick={() => cancelCorridor(c.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition">
                    Cancel
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activation Form */}
        <div className="bg-slate-800 rounded-xl p-5 space-y-5">
          <h2 className="text-white font-semibold">Activate Green Corridor</h2>

          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['AMBULANCE', 'FIRE_TRUCK', 'POLICE'].map(v => (
                <button key={v} onClick={() => setForm(f => ({ ...f, vehicle_type: v }))}
                  className={`py-3 rounded-lg text-sm font-medium transition ${form.vehicle_type === v ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                  {v === 'AMBULANCE' ? '🚑' : v === 'FIRE_TRUCK' ? '🚒' : '🚓'} {v.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">Starting Junction</label>
            <select value={form.junction_id} onChange={e => setForm(f => ({ ...f, junction_id: e.target.value }))}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500">
              <option value="">-- Select junction --</option>
              {junctions.map(j => <option key={j.id} value={j.id}>{j.name} ({j.status})</option>)}
            </select>
          </div>

          <div>
            <label className="text-slate-300 text-sm font-medium block mb-2">
              Heading Direction: {form.heading_degrees}° ({['N','NE','E','SE','S','SW','W','NW'][Math.round(form.heading_degrees/45)%8]})
            </label>
            <input type="range" min={0} max={359} step={1} value={form.heading_degrees}
              onChange={e => setForm(f => ({ ...f, heading_degrees: Number(e.target.value) }))}
              className="w-full accent-red-500" />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>N (0°)</span><span>E (90°)</span><span>S (180°)</span><span>W (270°)</span>
            </div>
          </div>

          <button onClick={activate} disabled={activating}
            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-3 shadow-lg shadow-red-500/20">
            {activating ? <><Spinner size="md" /><span>Activating...</span></> : '🚨 ACTIVATE GREEN CORRIDOR'}
          </button>

          <p className="text-slate-500 text-xs text-center">Corridor auto-expires after 120 seconds</p>
        </div>

        {/* Result Panel */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Last Activation Result</h2>
          {!result ? (
            <EmptyState message="No corridor activated yet" icon="🟢" />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 font-semibold">✓ {result.message}</p>
                <p className="text-slate-400 text-xs mt-1">Expires: {new Date(result.expires_at).toLocaleTimeString()}</p>
              </div>
              <p className="text-slate-300 text-sm font-medium">Cleared Junctions ({result.corridor_junctions?.length}):</p>
              <div className="space-y-2">
                {result.corridor_junctions?.map((j, i) => (
                  <div key={j.id} className="flex items-center gap-3 bg-slate-700 rounded-lg p-3">
                    <span className="w-6 h-6 bg-orange-500 rounded-full text-white text-xs font-bold flex items-center justify-center">{i+1}</span>
                    <span className="text-white text-sm">{j.name}</span>
                    <span className="ml-auto text-xs text-green-400 font-medium">🟢 GREEN</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
