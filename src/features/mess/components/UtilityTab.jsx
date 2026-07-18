import { useState, useEffect } from 'react';
import { Zap, Plus, ExternalLink, Download, CheckCircle } from 'lucide-react';
import { fetchUtilities, createUtilityRecord } from '../services/apiMess';
import { gasStorage } from '../../../lib/gasClient';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function UtilityTab({ sites }) {
    const [utilities, setUtilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUtil, setNewUtil] = useState({ site_id: '', type: 'Listrik', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), amount: '', attachment_url: '' });

    useEffect(() => {
        loadUtilities();
    }, []);

    const loadUtilities = async () => {
        setLoading(true);
        const data = await fetchUtilities();
        setUtilities(data);
        setLoading(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `util_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error: uploadError } = await gasStorage.from('attachments').upload(filePath, file);
            if (uploadError) throw uploadError;

            const publicUrl = data.publicUrl;
            setNewUtil(prev => ({ ...prev, attachment_url: publicUrl }));
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Gagal mengunggah file.');
        } finally {
            setUploading(false);
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        await createUtilityRecord(newUtil);
        setIsAddModalOpen(false);
        setNewUtil({ site_id: '', type: 'Listrik', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), amount: '', attachment_url: '' });
        loadUtilities();
    };

    if (loading) return <div className="text-center py-10 text-slate-500 dark:text-slate-400">Memuat data utilitas...</div>;

    return (
        <div className="glass-card p-6 flex flex-col gap-6 min-h-[400px]">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Zap size={20} className="text-primary"/> Pencatatan Utilitas & Tagihan
                </h2>
                <button onClick={() => setIsAddModalOpen(true)} className="glass-button py-1.5 px-3 text-sm flex items-center gap-1">
                    <Plus size={16}/> Catat Tagihan
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Periode</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Site Lokasi</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Jenis Tagihan</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">Nominal (Rp)</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">Bukti / Invoice</th>
                        </tr>
                    </thead>
                    <tbody>
                        {utilities.map(u => (
                            <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-800/40">
                                <td className="p-3">
                                    <div className="font-bold text-slate-700 dark:text-slate-200">{MONTHS[u.period_month - 1]} {u.period_year}</div>
                                </td>
                                <td className="p-3 text-sm text-slate-600 dark:text-slate-300">{u.site?.site_name}</td>
                                <td className="p-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${u.type === 'Listrik' ? 'bg-yellow-100 text-yellow-700' : u.type === 'Air' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {u.type}
                                    </span>
                                </td>
                                <td className="p-3 font-black text-slate-800 dark:text-slate-100 text-right">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(u.amount)}
                                </td>
                                <td className="p-3 text-center">
                                    {u.attachment_url ? (
                                        <a href={u.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-focus bg-primary/10 px-2 py-1 rounded">
                                            <ExternalLink size={12}/> Lihat Struk
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Tidak ada bukti</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {utilities.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-500 dark:text-slate-400">Belum ada riwayat tagihan utilitas.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal Add Utility */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md bg-white dark:bg-slate-800 p-6 shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Catat Tagihan Bulanan</h3>
                        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilih Site Lokasi</label>
                                <select required value={newUtil.site_id} onChange={e => setNewUtil({...newUtil, site_id: e.target.value})} className="glass-input w-full">
                                    <option value="" disabled>-- Pilih Site --</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bulan</label>
                                    <select value={newUtil.period_month} onChange={e => setNewUtil({...newUtil, period_month: parseInt(e.target.value)})} className="glass-input w-full">
                                        {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tahun</label>
                                    <input type="number" required min="2000" max="2100" value={newUtil.period_year} onChange={e => setNewUtil({...newUtil, period_year: parseInt(e.target.value)})} className="glass-input w-full"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jenis Tagihan</label>
                                <select value={newUtil.type} onChange={e => setNewUtil({...newUtil, type: e.target.value})} className="glass-input w-full">
                                    <option value="Listrik">Listrik (PLN)</option>
                                    <option value="Air">Air (PDAM)</option>
                                    <option value="Internet">Internet / WiFi</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nominal Tagihan (Rp)</label>
                                <input type="number" required min="0" value={newUtil.amount} onChange={e => setNewUtil({...newUtil, amount: e.target.value})} className="glass-input w-full" placeholder="Misal: 1500000"/>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Upload Bukti / Invoice (Opsional)</label>
                                {newUtil.attachment_url ? (
                                    <div className="flex items-center gap-2 mt-1 p-2 bg-green-50 rounded border border-green-200 text-green-700 text-sm">
                                        <CheckCircle size={16}/> Struk berhasil diunggah!
                                    </div>
                                ) : (
                                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} className="block w-full text-sm text-slate-500 dark:text-slate-400 mt-1
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary/10 file:text-primary
                                    hover:file:bg-primary/20
                                    "/>
                                )}
                                {uploading && <p className="text-xs text-blue-500 mt-1">Mengunggah...</p>}
                            </div>
                            
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
                                <button type="submit" className="glass-button px-4 py-2">Simpan Catatan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
