// src/pages/Alerts/Alerts.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { PageLoader, EmptyState, Spinner } from '../../components/ui/Spinner';

const SEVERITY_STYLES = {
  LOW:      { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-300' },
  MEDIUM:   { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300' },
  HIGH:     { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300' },
  CRITICAL: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-300' },
};

const STATUS_BADGE = {
  OPEN:         'bg-blue-500/20 text-blue-300',
  ACKNOWLEDGED: 'bg-yellow-500/20 text-yellow-300',
  RESOLVED:     'bg-green-500/20 text-green-300',
};

export default function Alerts() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [resolving, setResolving] = useState(null);

  const user = JSON.parse(localStorage.getItem('stms_user') || '{}');
  const isController = ['ADMIN', 'TRAFFIC_CONTROLLER'].includes(user.role);

  const load = async () => {
    try {
      const endpoint = isController ? '/incidents?limit=50' : '/incidents/my';
      const data = await api(endpoint);
      setIncidents(data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const resolve = async (id) => {
    setResolving(id);
    try {
      await api(`/incidents/${id}/resolve`, { method: 'PATCH' });
      showToast('Incident resolved', 'success');
      await load();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setResolving(null);
    }
  };

  const filtered = filter === 'ALL' ? incidents : incidents.filter(i => i.severity === filter || i.status === filter);

  const counts = {
    CRITICAL: incidents.filter(i => i.severity === 'CRITICAL' && i.status === 'OPEN').length,
    HIGH: incidents.filter(i => i.severity === 'HIGH' && i.status === 'OPEN').length,
    OPEN: incidents.filter(i => i.status === 'OPEN').length,
    RESOLVED: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts & Incidents</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isController ? 'All reported incidents across the network' : 'Your submitted incident reports'}
          </p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition">
          🔄 Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Critical Open', value: counts.CRITICAL, color: 'text-red-400' },
          { label: 'High Priority', value: counts.HIGH, color: 'text-orange-400' },
          { label: 'Total Open', value: counts.OPEN, color: 'text-blue-400' },
          { label: 'Resolved', value: counts.RESOLVED, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OPEN', 'RESOLVED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Incident List */}
      {filtered.length === 0 ? (
        <EmptyState message="No incidents found" icon="✅" />
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {filtered.map(inc => {
              const sty = SEVERITY_STYLES[inc.severity] || SEVERITY_STYLES.MEDIUM;
              return (
                <motion.div key={inc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl border p-4 ${sty.bg} ${sty.border}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${sty.badge}`}>
                          {inc.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_BADGE[inc.status] || STATUS_BADGE.OPEN}`}>
                          {inc.status}
                        </span>
                        {inc.is_auto_generated && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">AUTO</span>
                        )}
                        <span className="text-slate-500 text-xs">{inc.report_code}</span>
                      </div>
                      <p className="text-white font-medium text-sm">📍 {inc.location}</p>
                      {inc.description && <p className="text-slate-300 text-sm mt-1">{inc.description}</p>}
                      {inc.ir_vehicle && <p className="text-slate-400 text-xs mt-1">Vehicle: {inc.ir_vehicle}</p>}
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(inc.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    {isController && inc.status === 'OPEN' && (
                      <button onClick={() => resolve(inc.id)} disabled={resolving === inc.id}
                        className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition flex items-center gap-1 whitespace-nowrap">
                        {resolving === inc.id ? <Spinner /> : '✓'} Resolve
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
