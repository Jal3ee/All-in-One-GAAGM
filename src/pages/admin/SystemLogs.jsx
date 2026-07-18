import { useState, useEffect } from 'react';
import { fetchSystemLogs } from '../../features/admin/services/apiLogs';
import { Activity, Clock } from 'lucide-react';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSystemLogs();
    setLogs(data || []);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Activity size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Log Sistem (Audit Trail)</h1>
                <p className="text-slate-500 dark:text-slate-400">Rekaman seluruh kejadian dan aktivitas sistem secara universal.</p>
            </div>
        </div>

        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-48">Waktu</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-48">Pelaku (Aktor)</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 w-40">Aksi</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat histori log...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">Belum ada aktivitas terekam.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-slate-400" />
                                        {new Date(log.created_at).toLocaleString('id-ID')}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{log.user?.nama_lengkap || 'Sistem'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{log.user?.role || '-'}</p>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-700 dark:text-slate-200">
                                    {log.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
