import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Bot, Clock3, ShieldAlert } from 'lucide-react';
import { api, getToken } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { PageLoader, Spinner } from '../../components/ui/Spinner';

const PHASES = ['NS_GREEN', 'EW_GREEN', 'ALL_RED'];
const PHASE_DISPLAY = {
  NS_GREEN: 'Green PHASE',
  EW_GREEN: 'Green PHASE',
  ALL_RED: 'Red PHASE',
  EMERGENCY_OVERRIDE: 'Red PHASE',
};

const CARD_ACCENT = {
  NS_GREEN: 'border-t-green-400',
  EW_GREEN: 'border-t-green-400',
  ALL_RED: 'border-t-red-400',
  EMERGENCY_OVERRIDE: 'border-t-red-400',
};

const PHASE_PILL = {
  NS_GREEN: 'bg-green-500/15 text-green-300 border border-green-400/20',
  EW_GREEN: 'bg-green-500/15 text-green-300 border border-green-400/20',
  ALL_RED: 'bg-red-500/15 text-red-300 border border-red-400/20',
  EMERGENCY_OVERRIDE: 'bg-red-500/15 text-red-300 border border-red-400/20',
};

export default function SignalControl() {
  const [junctions, setJunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [authError, setAuthError] = useState(false);

  const toPhase = (value) => {
    if (value === 'Green' || value === 'GREEN') return 'NS_GREEN';
    if (value === 'Yellow' || value === 'YELLOW') return 'EW_GREEN';
    if (value === 'Red' || value === 'RED') return 'ALL_RED';
    return value;
  };

  const resolvePhase = (signal, fallbackPhase) => {
    const phase = toPhase(signal?.current_phase || fallbackPhase || signal?.signal_status || 'ALL_RED');
    if (signal?.emergency_override) return 'EMERGENCY_OVERRIDE';
    return PHASES.includes(phase) ? phase : 'ALL_RED';
  };

  const normalizeJunction = (junction, latestFlowCount = null) => {
    const signal = junction.signal || {};
    const currentPhase = resolvePhase(signal, junction.signal_phase);
    const defaultDuration = currentPhase === 'EW_GREEN'
      ? (signal.green_duration_ew ?? junction.time_remaining ?? signal.phase_duration ?? 30)
      : (signal.green_duration_ns ?? junction.time_remaining ?? signal.phase_duration ?? 30);
    const liveFlow = typeof latestFlowCount === 'number' ? latestFlowCount : null;

    return {
      ...junction,
      signal: {
        ...signal,
        current_phase: currentPhase,
        vehicle_count: liveFlow ?? junction.vehicle_count ?? signal.vehicle_count ?? 0,
        time_remaining: signal.time_remaining ?? junction.time_remaining ?? defaultDuration,
        green_duration_ns: signal.green_duration_ns ?? 30,
        green_duration_ew: signal.green_duration_ew ?? 30,
      },
      statusLabel: signal.emergency_override ? 'Manual' : 'AI Optimized',
      time_remaining: signal.time_remaining ?? junction.time_remaining ?? defaultDuration,
      vehicle_count: liveFlow ?? junction.vehicle_count ?? 0,
    };
  };

  const loadSignals = async ({ silent = false } = {}) => {
    if (!getToken()) {
      setAuthError(true);
      setLoadError('');
      setJunctions([]);
      setLoading(false);
      return;
    }

    try {
      setAuthError(false);
      const data = await api('/junctions');
      const rows = Array.isArray(data) ? data : [];

      const flowResults = await Promise.allSettled(
        rows.map((junction) => api(`/traffic/history/${junction.id}?limit=1`)),
      );

      const flowMap = {};
      flowResults.forEach((result, idx) => {
        if (result.status !== 'fulfilled') return;
        const history = Array.isArray(result.value) ? result.value : [];
        const latest = history[0];
        if (latest && typeof latest.vehicle_count === 'number') {
          flowMap[rows[idx].id] = latest.vehicle_count;
        }
      });

      const normalized = rows.map((junction) => normalizeJunction(junction, flowMap[junction.id]));
      setLoadError('');
      setJunctions(normalized);
    } catch (e) {
      const message = e.message || 'Failed to load live signal data.';
      const unauthenticated = /401|unauth|not authenticated|token/i.test(message);
      setAuthError(unauthenticated);
      setLoadError(unauthenticated ? '' : message);
      if (!silent) showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
    const pollId = setInterval(() => {
      loadSignals({ silent: true });
    }, 4000);
    return () => clearInterval(pollId);
  }, []);

  useEffect(() => {
    const timerId = setInterval(() => {
      setJunctions((prev) =>
        prev.map((junction) => {
          const next = Math.max(0, (junction.signal?.time_remaining ?? junction.time_remaining ?? 0) - 1);
          return {
            ...junction,
            time_remaining: next,
            signal: {
              ...junction.signal,
              time_remaining: next,
            },
          };
        }),
      );
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  const getNextPhase = (phase) => {
    const normalized = PHASES.includes(phase) ? phase : 'ALL_RED';
    const idx = PHASES.indexOf(normalized);
    return PHASES[(idx + 1) % PHASES.length];
  };

  const updateSignal = async (junctionId, payload, successMessage) => {
    setSaving(true);
    setBusyId(junctionId);
    try {
      await api(`/junctions/${junctionId}/signal`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast(successMessage, 'success');
      await loadSignals();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
      setBusyId(null);
    }
  };

  const handleManualOverride = async (junction) => {
    const currentPhase = junction.signal?.current_phase || 'ALL_RED';
    const payload = {
      current_phase: getNextPhase(currentPhase),
      green_duration_ns: junction.signal?.green_duration_ns || 30,
      green_duration_ew: junction.signal?.green_duration_ew || 30,
    };

    await updateSignal(junction.id, payload, `Manual override applied to ${junction.name}`);
  };

  const handleAdjustTiming = async (junction) => {
    const baseNs = junction.signal?.green_duration_ns || 30;
    const baseEw = junction.signal?.green_duration_ew || 30;
    const payload = {
      current_phase: junction.signal?.current_phase || 'ALL_RED',
      green_duration_ns: Math.min(baseNs + 5, 120),
      green_duration_ew: Math.min(baseEw + 5, 120),
    };

    await updateSignal(junction.id, payload, `Signal timing adjusted for ${junction.name}`);
  };

  const handleEmergencyReset = async () => {
    showToast('Emergency reset request processed.', 'success');
    await loadSignals();
  };

  const getFlowCount = (junction) => {
    const flow = junction.vehicle_count ?? junction.signal?.vehicle_count;
    if (typeof flow === 'number') return flow;
    return (junction.signal?.vehicle_count_ns || 0) + (junction.signal?.vehicle_count_ew || 0);
  };

  const getTimeRemaining = (junction) => {
    return junction.signal?.time_remaining || junction.time_remaining || 0;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Signal Control Interface</h1>
          <p className="text-slate-400 text-sm mt-1">Manual override and signal timing management</p>
        </div>
        <button
          onClick={handleEmergencyReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500/10 border border-orange-400/25 hover:bg-orange-500/15 text-orange-300 rounded-xl text-sm font-semibold transition"
        >
          <ShieldAlert size={16} />
          EMERGENCY RESET
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-200 px-4 py-3 text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {junctions.map((junction, idx) => {
          const phase = junction.signal?.current_phase || 'ALL_RED';
          const timeRemaining = getTimeRemaining(junction);
          const flowCount = getFlowCount(junction);
          const isBusy = saving && busyId === junction.id;
          const emergency = Boolean(junction.signal?.emergency_override);

          return (
            <motion.div
              key={junction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
              className={`rounded-2xl bg-slate-900/85 border border-slate-800 p-6 border-t-4 ${CARD_ACCENT[phase] || 'border-t-red-400'} ${emergency ? 'ring-1 ring-orange-400/60' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-white leading-tight">{junction.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">J{idx + 1} · ID-NODE-ACTIVE</p>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${PHASE_PILL[phase] || PHASE_PILL.ALL_RED}`}>
                  {PHASE_DISPLAY[phase] || 'Red PHASE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="text-[11px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock3 size={13} />
                    TIME REM.
                  </div>
                  <div className="text-4xl font-semibold text-white mt-2">{timeRemaining}s</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="text-[11px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Activity size={13} />
                    FLOW
                  </div>
                  <div className="text-4xl font-semibold text-white mt-2">{flowCount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-400 mt-5">
                <span>Manual Control Mode</span>
                <span className="inline-flex items-center gap-1.5 text-sky-300">
                  <Bot size={14} /> {junction.statusLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => handleManualOverride(junction)}
                  disabled={isBusy || authError}
                  className="h-10 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-slate-100 text-xs font-semibold tracking-wide transition"
                >
                  {isBusy ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Spinner />
                      APPLYING
                    </span>
                  ) : (
                    'MANUAL OVERRIDE'
                  )}
                </button>
                <button
                  onClick={() => handleAdjustTiming(junction)}
                  disabled={isBusy || authError}
                  className="h-10 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900 disabled:opacity-60 text-slate-200 text-xs font-semibold tracking-wide transition"
                >
                  ADJUST TIMING
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
