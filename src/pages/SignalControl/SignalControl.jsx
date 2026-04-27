// src/pages/SignalControl.jsx  (or wherever this page lives — find and replace)
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { PageLoader, EmptyState, Spinner } from '../../components/ui/Spinner';

const PHASES = ['NS_GREEN', 'EW_GREEN', 'ALL_RED'];
const PHASE_COLORS = {
  NS_GREEN: 'bg-green-500',
  EW_GREEN: 'bg-blue-500',
  ALL_RED: 'bg-red-500',
  EMERGENCY_OVERRIDE: 'bg-orange-500',
};
const CONGESTION_COLORS = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

export default function SignalControl() {
  const [junctions, setJunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ current_phase: 'NS_GREEN', green_duration_ns: 30, green_duration_ew: 30 });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const data = await api('/junctions');
      setJunctions(data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectJunction = (j) => {
    setSelected(j);
    setForm({
      current_phase: j.signal?.current_phase || 'NS_GREEN',
      green_duration_ns: j.signal?.green_duration_ns || 30,
      green_duration_ew: j.signal?.green_duration_ew || 30,
    });
  };

  const applyOverride = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api(`/junctions/${selected.id}/signal`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      showToast(`Signal updated for ${selected.name}`, 'success');
      await load();
      // Update selected with new data
      const updated = (await api('/junctions')).find(j => j.id === selected.id);
      if (updated) setSelected(updated);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = junctions.filter(j =>
    j.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Signal Control</h1>
          <p className="text-slate-400 text-sm mt-1">Manual override and signal timing management</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Junction List */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-4">
          <input
            type="text"
            placeholder="Search junctions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          />
          {filtered.length === 0 ? (
            <EmptyState message="No junctions found" icon="🚦" />
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filtered.map(j => {
                const total = (j.signal?.vehicle_count_ns || 0) + (j.signal?.vehicle_count_ew || 0);
                const cLevel = total < 50 ? 'LOW' : total < 100 ? 'MEDIUM' : total < 150 ? 'HIGH' : 'CRITICAL';
                return (
                  <motion.div
                    key={j.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => selectJunction(j)}
                    className={`p-4 rounded-lg cursor-pointer transition border ${
                      selected?.id === j.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium text-sm">{j.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{j.location}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${CONGESTION_COLORS[cLevel]}`}>
                          {cLevel}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs text-white font-medium ${PHASE_COLORS[j.signal?.current_phase] || 'bg-slate-500'}`}>
                          {j.signal?.current_phase?.replace('_', ' ') || 'N/A'}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${j.status === 'ONLINE' ? 'bg-green-400' : 'bg-red-400'}`} />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-400">
                      <span>NS: {j.signal?.vehicle_count_ns || 0} vehicles</span>
                      <span>EW: {j.signal?.vehicle_count_ew || 0} vehicles</span>
                      <span>NS green: {j.signal?.green_duration_ns || 0}s</span>
                      <span>EW green: {j.signal?.green_duration_ew || 0}s</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Override Panel */}
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">Manual Override</h2>
          {!selected ? (
            <EmptyState message="Select a junction to override" icon="👈" />
          ) : (
            <div className="space-y-5">
              <div className="bg-slate-700 rounded-lg p-3">
                <p className="text-white font-medium text-sm">{selected.name}</p>
                <p className="text-slate-400 text-xs">{selected.location}</p>
                {selected.signal?.emergency_override && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded">
                    ⚠ Emergency Override Active
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">Signal Phase</label>
                <div className="grid grid-cols-3 gap-2">
                  {PHASES.map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, current_phase: p }))}
                      className={`py-2 rounded-lg text-xs font-medium transition ${
                        form.current_phase === p
                          ? `${PHASE_COLORS[p]} text-white`
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {p.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">
                  NS Green Time: {form.green_duration_ns}s
                </label>
                <input
                  type="range" min={15} max={120} step={5}
                  value={form.green_duration_ns}
                  onChange={e => setForm(f => ({ ...f, green_duration_ns: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>15s (min)</span><span>120s (max)</span>
                </div>
              </div>

              <div>
                <label className="text-slate-300 text-xs font-medium block mb-2">
                  EW Green Time: {form.green_duration_ew}s
                </label>
                <input
                  type="range" min={15} max={120} step={5}
                  value={form.green_duration_ew}
                  onChange={e => setForm(f => ({ ...f, green_duration_ew: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>15s (min)</span><span>120s (max)</span>
                </div>
              </div>

              <button
                onClick={applyOverride}
                disabled={saving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                {saving ? <><Spinner /><span>Applying...</span></> : '⚡ Apply Override'}
              </button>

              <button
                onClick={() => setSelected(null)}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Junctions', value: junctions.length, icon: '🚦' },
          { label: 'Online', value: junctions.filter(j => j.status === 'ONLINE').length, icon: '🟢' },
          { label: 'Emergency Active', value: junctions.filter(j => j.signal?.emergency_override).length, icon: '🚨' },
          { label: 'Total Vehicles', value: junctions.reduce((s, j) => s + (j.signal?.vehicle_count_ns || 0) + (j.signal?.vehicle_count_ew || 0), 0), icon: '🚗' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
