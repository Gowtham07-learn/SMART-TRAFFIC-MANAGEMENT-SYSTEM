import React from 'react';
import { Download, Filter, FileJson, FileText, Table as TableIcon } from 'lucide-react';
import { TrafficLineChart } from '../../components/charts/TrafficLineChart';
import { MOCK_CHART_DATA } from '../../data/mockData';
import { cn } from '../../utils/cn';

const Analytics = () => {
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
                </div>
                <div className="flex space-x-3">
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        <Filter size={16} className="mr-2" /> Filters
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center">
                        <Download size={16} className="mr-2" /> EXPORT ALL
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TrafficLineChart data={MOCK_CHART_DATA} title="Volume Trend (Weekly)" />
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-slate-100 mb-6">Historical Comparison</h3>
                    <div className="space-y-6 flex flex-col justify-center h-[300px]">
                        {[
                            { label: 'Vs. Last Month', val: 12.5, status: 'improvement' },
                            { label: 'Vs. Last Year', val: 4.8, status: 'improvement' },
                            { label: 'Target Efficiency', val: 2.1, status: 'lagging' },
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className={item.status === 'improvement' ? 'text-green-400' : 'text-red-400'}>
                                        {item.status === 'improvement' ? '+' : '-'}{item.val}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={cn("h-full", item.status === 'improvement' ? 'bg-green-500' : 'bg-red-500')} style={{ width: `${item.val * 5}%` }}></div>
                                </div>
                            </div>
                        ))}
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
                                        <button className="p-2 hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all text-slate-500">
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
