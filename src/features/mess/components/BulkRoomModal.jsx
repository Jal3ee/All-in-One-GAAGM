import { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { gasFetch } from '../../../lib/gasClient';

export default function BulkRoomModal({ isOpen, onClose, sites, buildings, onSuccess }) {
  const [formData, setFormData] = useState({
    site_id: '',
    building_id: '',
    prefix: '',
    startNumber: 1,
    endNumber: 10,
    type: 'Single',
    capacity: 1
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validBuildings = buildings.filter(b => b.site_id === formData.site_id);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setFormData({ ...formData, type, capacity: type === 'Single' ? 1 : 2 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.startNumber > formData.endNumber) {
        alert('Nomor awal tidak boleh lebih besar dari nomor akhir');
        return;
    }

    setLoading(true);
    const roomsToInsert = [];
    for (let i = parseInt(formData.startNumber); i <= parseInt(formData.endNumber); i++) {
        // Format to 2 or 3 digits if needed, but let's just append
        const roomNum = `${formData.prefix}${i}`;
        roomsToInsert.push({
            building_id: formData.building_id,
            room_number: roomNum,
            type: formData.type,
            capacity: formData.capacity,
            status: 'Kosong'
        });
    }

    try {
        const { error } = await gasFetch({ action: 'insert', payload: { table: 'tbl_rooms', data: roomsToInsert }});
        if (error) throw error;
        onSuccess();
    } catch (error) {
        console.error('Error bulk insert rooms:', error);
        alert('Gagal generate kamar. Pastikan nomor kamar tidak ada yang duplikat di bangunan ini.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg overflow-hidden bg-white/95 dark:bg-slate-800/95">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Layers className="text-purple-500" /> Generate Kamar Massal
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pilih Site</label>
            <select required name="site_id" value={formData.site_id} onChange={(e) => setFormData({...formData, site_id: e.target.value, building_id: ''})} className="glass-input">
              <option value="" disabled>-- Pilih Site --</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pilih Bangunan</label>
            <select required name="building_id" value={formData.building_id} onChange={handleChange} disabled={!formData.site_id} className="glass-input">
              <option value="" disabled>-- Pilih Bangunan --</option>
              {validBuildings.map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Prefix (Opsional)</label>
                <input type="text" name="prefix" value={formData.prefix} onChange={handleChange} placeholder="Msl: A-" className="glass-input" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">No. Awal</label>
                <input type="number" required min="1" name="startNumber" value={formData.startNumber} onChange={handleChange} className="glass-input" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">No. Akhir</label>
                <input type="number" required min="1" name="endNumber" value={formData.endNumber} onChange={handleChange} className="glass-input" />
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tipe Kamar</label>
                <select name="type" value={formData.type} onChange={handleTypeChange} className="glass-input">
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kapasitas (Otomatis)</label>
                <input type="number" disabled value={formData.capacity} className="glass-input bg-slate-100 dark:bg-slate-800" />
              </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="glass-button bg-purple-500 hover:bg-purple-600 border-none min-w-[120px] flex justify-center items-center">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
