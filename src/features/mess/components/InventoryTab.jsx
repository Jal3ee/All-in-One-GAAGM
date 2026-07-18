import { useState, useEffect } from 'react';
import { Package, Plus, ArrowUpRight, ArrowDownRight, Edit2 } from 'lucide-react';
import { fetchInventory, mutateStock, createInventoryItem } from '../services/apiMess';

export default function InventoryTab({ sites }) {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Mutation Modal
    const [isMutateModalOpen, setIsMutateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [mutateType, setMutateType] = useState('IN');
    const [mutateQty, setMutateQty] = useState('');
    const [mutateNotes, setMutateNotes] = useState('');

    // Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ site_id: '', item_name: '', category: 'Barang Habis Pakai', stock: 0, unit: 'Pcs' });

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setLoading(true);
        const data = await fetchInventory();
        setInventory(data);
        setLoading(false);
    };

    const handleMutateSubmit = async (e) => {
        e.preventDefault();
        if(!mutateQty || isNaN(mutateQty)) return;
        
        await mutateStock(selectedItem.id, mutateType, mutateQty, mutateNotes, selectedItem.item_name);
        setIsMutateModalOpen(false);
        setMutateQty('');
        setMutateNotes('');
        loadInventory();
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        await createInventoryItem(newItem);
        setIsAddModalOpen(false);
        setNewItem({ site_id: '', item_name: '', category: 'Barang Habis Pakai', stock: 0, unit: 'Pcs' });
        loadInventory();
    };

    if (loading) return <div className="text-center py-10 text-slate-500 dark:text-slate-400">Memuat data logistik...</div>;

    return (
        <div className="glass-card p-6 flex flex-col gap-6 min-h-[400px]">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Package size={20} className="text-primary"/> Logistik & Barang Habis Pakai
                </h2>
                <button onClick={() => setIsAddModalOpen(true)} className="glass-button py-1.5 px-3 text-sm flex items-center gap-1">
                    <Plus size={16}/> Barang Baru
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Site</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Nama Barang</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Kategori</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">Stok Aktif</th>
                            <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">Aksi Mutasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => (
                            <tr key={item.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-800/40">
                                <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{item.site?.site_name}</td>
                                <td className="p-3 text-sm font-bold text-slate-800 dark:text-slate-100">{item.item_name}</td>
                                <td className="p-3 text-xs"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{item.category}</span></td>
                                <td className="p-3 text-center">
                                    <span className={`font-black text-lg ${item.stock < 5 ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{item.stock}</span>
                                    <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                </td>
                                <td className="p-3 flex justify-center gap-2">
                                    <button onClick={() => { setSelectedItem(item); setMutateType('IN'); setIsMutateModalOpen(true); }} className="px-3 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <ArrowDownRight size={14}/> Masuk
                                    </button>
                                    <button onClick={() => { setSelectedItem(item); setMutateType('OUT'); setIsMutateModalOpen(true); }} className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <ArrowUpRight size={14}/> Keluar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {inventory.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-500 dark:text-slate-400">Belum ada barang di inventaris.</td></tr>}
                    </tbody>
                </table>
            </div>

            {/* Modal Mutasi */}
            {isMutateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md bg-white dark:bg-slate-800 p-6 shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
                            {mutateType === 'IN' ? 'Barang Masuk (IN)' : 'Barang Keluar (OUT)'} - {selectedItem?.item_name}
                        </h3>
                        <form onSubmit={handleMutateSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jumlah {selectedItem?.unit}</label>
                                <input type="number" required min="1" value={mutateQty} onChange={e => setMutateQty(e.target.value)} className="glass-input w-full" placeholder="Contoh: 10"/>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Catatan / Keterangan</label>
                                <input type="text" required value={mutateNotes} onChange={e => setMutateNotes(e.target.value)} className="glass-input w-full" placeholder="Contoh: Restock bulanan / Diambil oleh OB..."/>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsMutateModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
                                <button type="submit" className={`px-4 py-2 rounded-lg font-bold text-white ${mutateType === 'IN' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Add Item */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md bg-white dark:bg-slate-800 p-6 shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Tambah Barang Baru</h3>
                        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilih Site</label>
                                <select required value={newItem.site_id} onChange={e => setNewItem({...newItem, site_id: e.target.value})} className="glass-input w-full">
                                    <option value="" disabled>-- Pilih Site --</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Barang</label>
                                <input type="text" required value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} className="glass-input w-full" placeholder="Minyak Wangi, Sapu, dll"/>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kategori</label>
                                    <input type="text" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="glass-input w-full" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Satuan (Unit)</label>
                                    <input type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="glass-input w-full" placeholder="Pcs, Dus, Liter"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stok Awal</label>
                                <input type="number" required min="0" value={newItem.stock} onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value)})} className="glass-input w-full"/>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
                                <button type="submit" className="glass-button px-4 py-2">Simpan Barang</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
