// src/pages/ReportIncident/ReportIncident.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { PageLoader, EmptyState, Spinner } from '../../components/ui/Spinner';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SEVERITY_COLORS = { LOW: 'border-green-500 bg-green-500/10 text-green-400', MEDIUM: 'border-yellow-500 bg-yellow-500/10 text-yellow-400', HIGH: 'border-orange-500 bg-orange-500/10 text-orange-400', CRITICAL: 'border-red-500 bg-red-500/10 text-red-400' };

const DEFAULT_FORM = { location: '', location_lat: '', location_lon: '', nearest_junction_id: '', severity: 'MEDIUM', description: '', ir_vehicle: '' };

export default function ReportIncident() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [junctions, setJunctions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    api('/junctions').then(setJunctions).catch(() => {});
    api('/incidents/my').then(r => setMyReports(r)).catch(() => {}).finally(() => setLoadingReports(false));
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, location_lat: pos.coords.latitude.toFixed(6), location_lon: pos.coords.longitude.toFixed(6) }));
        showToast('Location captured', 'success');
      },
      () => showToast('Could not get location', 'error')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.location.trim()) { showToast('Location is required', 'error'); return; }
    if (!form.description.trim()) { showToast('Please describe the incident', 'error'); return; }
    setSubmitting(true);
    try {
      await api('/incidents/report', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          location_lat: form.location_lat ? parseFloat(form.location_lat) : null,
          location_lon: form.location_lon ? parseFloat(form.location_lon) : null,
          nearest_junction_id: form.nearest_junction_id || null,
        }),
      });
      showToast('Incident reported successfully!', 'success');
      setForm(DEFAULT_FORM);
      const updated = await api('/incidents/my');
      setMyReports(updated);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_COLORS = { OPEN: 'text-blue-400', ACKNOWLEDGED: 'text-yellow-400', RESOLVED: 'text-green-400' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Report Incident</h1>
        <p className="text-slate-400 text-sm mt-1">Submit a traffic incident report for your area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-5">New Incident Report</h2>
          <form onSubmit={submit} className="space-y-4">

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Location *</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Near Gandhipuram bus stand" required
                className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-1.5">Latitude (optional)</label>
                <input value={form.location_lat} onChange={e => setForm(f => ({ ...f, location_lat: e.target.value }))}
                  placeholder="11.0168"
                  className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-slate-300 text-xs font-medium block mb-1.5">Longitude (optional)</label>
                <input value={form.location_lon} onChange={e => setForm(f => ({ ...f, location_lon: e.target.value }))}
                  placeholder="77.0033"
                  className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <button type="button" onClick={useMyLocation}
              className="w-full py-2 border border-dashed border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400 rounded-lg text-sm transition">
              📍 Use my current location
            </button>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Nearest Junction</label>
              <select value={form.nearest_junction_id} onChange={e => setForm(f => ({ ...f, nearest_junction_id: e.target.value }))}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Select junction --</option>
                {junctions.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Vehicle Involved (if any)</label>
              <input value={form.ir_vehicle} onChange={e => setForm(f => ({ ...f, ir_vehicle: e.target.value }))}
                placeholder="e.g. Bus, Auto, Truck..."
                className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Severity *</label>
              <div className="grid grid-cols-4 gap-2">
                {SEVERITIES.map(s => (
                  <button key={s} type="button" onClick={() => setForm(f => ({ ...f, severity: s }))}
                    className={`py-2 rounded-lg text-xs font-bold border-2 transition ${form.severity === s ? SEVERITY_COLORS[s] : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the incident — what happened, how many vehicles involved, road blocked?" required rows={4}
                className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
              {submitting ? <><Spinner /><span>Submitting...</span></> : '🚨 Submit Report'}
            </button>
          </form>
        </div>

        {/* My Past Reports */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-5">My Reports</h2>
          {loadingReports ? <PageLoader /> : myReports.length === 0 ? (
            <EmptyState message="No reports submitted yet" icon="📋" />
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {myReports.map(r => (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400">{r.report_code}</span>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded bg-opacity-20 ${SEVERITY_COLORS[r.severity]?.split(' ')[0] || ''} ${SEVERITY_COLORS[r.severity]?.split(' ')[2] || ''}`}>
                        {r.severity}
                      </span>
                      <span className={`text-xs ${STATUS_COLORS[r.status] || 'text-slate-400'}`}>● {r.status}</span>
                    </div>
                  </div>
                  <p className="text-white text-sm">📍 {r.location}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {new Date(r.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
