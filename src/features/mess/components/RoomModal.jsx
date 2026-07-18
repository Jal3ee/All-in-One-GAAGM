import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createRoom, updateRoom } from '../services/apiMess';

export default function RoomModal({ isOpen, onClose, onSuccess, initialData, sites, buildings }) {
  const [formData, setFormData] = useState({
    site_id: '',
    building_id: '',
    room_number: '',
    type: 'Single',
    capacity: 1,
    status: 'Kosong'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        site_id: initialData.building?.site?.id || '',
        building_id: initialData.building_id || '',
        room_number: initialData.room_number,
        type: initialData.type,
        capacity: initialData.capacity,
        status: initialData.status
      });
    } else {
      setFormData({
        site_id: sites.length > 0 ? sites[0].id : '',
        building_id: '',
        room_number: '',
        type: 'Single',
        capacity: 1,
        status: 'Kosong'
      });
    }
  }, [initialData, isOpen, sites]);

  // Set default building when site changes
  useEffect(() => {
      if (!initialData && formData.site_id) {
          const availableBuildings = buildings.filter(b => b.site_id === formData.site_id);
          if (availableBuildings.length > 0) {
              setFormData(prev => ({ ...prev, building_id: availableBuildings[0].id }));
          } else {
              setFormData(prev => ({ ...prev, building_id: '' }));
          }
      }
  }, [formData.site_id, buildings, initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.building_id) {
        alert("Pilih Bangunan terlebih dahulu!");
        return;
    }
    setLoading(true);
    
    // eslint-disable-next-line no-unused-vars
    const { site_id, ...payload } = formData;
    
    let res;
    if (initialData) {
        res = await updateRoom(initialData.id, payload, formData.room_number);
    } else {
        res = await createRoom(payload);
    }
    setLoading(false);
    
    if (res.error) {
        alert('Gagal menyimpan data kamar: ' + res.error.message);
    } else {
        onSuccess();
    }
  };

  const filteredBuildings = buildings.filter(b => b.site_id === formData.site_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md bg-white/95 dark:bg-slate-800/95 shadow-2xl overflow-hidden rounded-2xl">
        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{initialData ? 'Edit Master Kamar' : 'Tambah Kamar Baru'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Cascading Dropdowns */}
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pilih Site Lokasi</label>
                <select required name="site_id" value={formData.site_id} onChange={handleChange} className="glass-input">
                  <option value="" disabled>-- Pilih Site --</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pilih Bangunan</label>
                <select required name="building_id" value={formData.building_id} onChange={handleChange} className="glass-input">
                  <option value="" disabled>-- Pilih Bangunan --</option>
                  {filteredBuildings.map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
                </select>
              </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nomor Kamar</label>
            <input required name="room_number" value={formData.room_number} onChange={handleChange} className="glass-input" placeholder="Misal: 101, Blok A-1" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tipe Kamar</label>
                <select name="type" value={formData.type} onChange={handleChange} className="glass-input">
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kapasitas (Orang)</label>
                <input required type="number" min="1" name="capacity" value={formData.capacity} onChange={handleChange} className="glass-input" />
              </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Status Saat Ini</label>
            <select name="status" value={formData.status} onChange={handleChange} className="glass-input">
              <option value="Kosong">Kosong (Tersedia)</option>
              <option value="Terisi">Terisi</option>
              <option value="Maintenance">Maintenance (Perbaikan)</option>
            </select>
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="glass-button min-w-[100px] flex justify-center items-center">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
