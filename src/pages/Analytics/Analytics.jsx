import React, { useEffect, useState } from 'react';
import { Download, Filter, FileJson, FileText, Table as TableIcon } from 'lucide-react';
import { TrafficLineChart } from '../../components/charts/TrafficLineChart';
import { MOCK_CHART_DATA } from '../../data/mockData';
import { cn } from '../../utils/cn';
import { api, getToken, BASE } from '../../lib/api';
import { showToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';

const Analytics = () => {
    const [co2Data, setCo2Data] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        Promise.all([
            api('/analytics/co2'),
            api('/analytics/summary'),
        ]).then(([co2, sum]) => { setCo2Data(co2); setSummary(sum); })
            .catch(e => showToast(e.message, 'error'))
            .finally(() => setLoading(false));
        const t = setInterval(() => {
            api('/analytics/co2').then(setCo2Data).catch(() => {});
        }, 30000);
        return () => clearInterval(t);
    }, []);

    const exportCSV = async () => {
        setExporting(true);
        try {
            const token = getToken();
            const res = await fetch(`${BASE}/analytics/export?format=csv`, { headers: { Authorization: `Bearer ${token}` } });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'stms_traffic_export.csv'; a.click();
            showToast('CSV exported successfully', 'success');
        } catch { showToast('Export failed', 'error'); }
        finally { setExporting(false); }
    };

    const downloadReport = async (report) => {
        const fmt = (report.type || 'csv').toLowerCase();
        const token = getToken();
        try {
            // backend currently supports CSV/JSON exports; map unsupported types to CSV
            const supportedFmt = (fmt === 'json' ? 'json' : 'csv');
            const res = await fetch(`${BASE}/analytics/export?format=${supportedFmt}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const ext = supportedFmt === 'json' ? 'json' : 'csv';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `${report.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`; a.click();
            showToast('Download started', 'success');
        } catch (e) {
            showToast(e.message || 'Export failed', 'error');
        }
    };

    const reports = [
        { title: 'Monthly Congestion Report', date: 'Mar 1, 2026', type: 'PDF', size: '2.4 MB' },
        { title: 'Environmental Impact Study', date: 'Feb 28, 2026', type: 'CSV', size: '1.2 MB' },
        { title: 'Peak Hour Flow Analysis', date: 'Feb 15, 2024', type: 'JSON', size: '840 KB' },
        { title: 'Signal Efficiency Audit', date: 'Feb 10, 2026', type: 'XLXS', size: '4.1 MB' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Analytics & Reports</h2>
                    <p className="text-slate-400">Deep dive into historical traffic data and trends</p>
                    <p className="text-xs text-blue-300 mt-2">
                        City CO2: {co2Data?.city_total_co2_kg?.toFixed(2) || '--'} kg | Annual projected: {co2Data?.annual_projected_tons?.toLocaleString() || '--'} tons
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        <Filter size={16} className="mr-2" /> Filters
                    </button>
                    <button onClick={exportCSV} disabled={exporting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        {exporting ? <Spinner size="sm" /> : <Download size={16} className="mr-2" />} EXPORT ALL
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrafficLineChart data={MOCK_CHART_DATA} title="Volume Trend (Weekly)" />
                <div className="glass-card p-6 flex flex-col justify-between">
                    <h3 className="text-lg font-semibold text-slate-100 mb-6">Traffic Summary Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-sm text-slate-400 uppercase">Total Junctions</p>
                            <p className="text-2xl font-bold text-slate-100 mt-1">{summary?.total_junctions || '--'}</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-sm text-slate-400 uppercase">Total Vehicles</p>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{summary?.total_vehicles_now || '--'}</p>
                        </div>

                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-sm text-slate-400 uppercase">Avg / Junction</p>
                            <p className="text-2xl font-bold text-slate-100 mt-1">{summary?.avg_vehicles_per_junction ?? '--'}</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-sm text-slate-400 uppercase">Active Incidents</p>
                            <p className="text-2xl font-bold text-rose-400 mt-1">{summary?.active_incidents ?? '--'}</p>
                        </div>

                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-sm text-slate-400 uppercase">Active Emergency Vehicles</p>
                            <p className="text-2xl font-bold text-emerald-300 mt-1">{summary?.active_emergency_vehicles ?? '--'}</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl">
                            <p className="text-sm text-slate-400 uppercase">City CO2 (kg)</p>
                            <p className="text-2xl font-bold text-yellow-300 mt-1">{co2Data?.city_total_co2_kg ? co2Data.city_total_co2_kg.toFixed(2) : (summary?.city_total_co2_kg ?? '--')}</p>
                        </div>

                        <div className="p-4 bg-slate-800 rounded-xl col-span-2">
                            <p className="text-sm text-slate-400 uppercase">Busiest Junction</p>
                            <p className="text-xl font-bold text-orange-400 mt-1">{summary?.busiest_junction?.name || '--'}</p>
                        </div>
                        <div className="p-4 bg-slate-800 rounded-xl col-span-2">
                            <p className="text-sm text-slate-400 uppercase">System Uptime</p>
                            <p className="text-sm font-bold text-slate-100 mt-1">{summary?.system_uptime_percent ?? '--'}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-100">Recent Generated Reports</h3>
                    <span className="text-blue-400 text-xs font-bold cursor-pointer hover:underline uppercase tracking-widest">Schedule New Report</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/50 text-slate-500 text-xs uppercase font-black">
                            <tr>
                                <th className="px-6 py-4">Report Name</th>
                                <th className="px-6 py-4">Date Generated</th>
                                <th className="px-6 py-4">Format</th>
                                <th className="px-6 py-4">File Size</th>
                                <th className="px-12 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {reports.map((report, i) => (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-100 flex items-center">
                                        <FileText size={16} className="mr-3 text-slate-500" />
                                        {report.title}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{report.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold border border-slate-700 uppercase">{report.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 font-mono">{report.size}</td>
                                    <td className="px-12 py-4 text-right">
                                        <button onClick={() => downloadReport(report)} className="p-2 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all text-slate-500">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
