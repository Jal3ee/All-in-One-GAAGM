import { useState, useEffect } from 'react';
import { X, Wrench } from 'lucide-react';
import { createTicket } from '../services/apiMess';

export default function TicketModal({ isOpen, onClose, onSuccess, rooms, sites, buildings }) {
  const [formData, setFormData] = useState({
    site_id: '',
    building_id: '',
    room_id: '',
    title: '',
    description: '',
    priority: 'Medium'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
     if (isOpen && sites.length > 0 && !formData.site_id) {
         setFormData(prev => ({ ...prev, site_id: sites[0].id }));
     }
  }, [isOpen, sites]);

  // Set default building when site changes
  useEffect(() => {
      if (formData.site_id) {
          const availableBuildings = buildings.filter(b => b.site_id === formData.site_id);
          if (availableBuildings.length > 0) {
              setFormData(prev => ({ ...prev, building_id: availableBuildings[0].id }));
          } else {
              setFormData(prev => ({ ...prev, building_id: '', room_id: '' }));
          }
      }
  }, [formData.site_id, buildings]);

  // Set default room when building changes
  useEffect(() => {
      if (formData.building_id) {
          const availableRooms = rooms.filter(r => r.building_id === formData.building_id);
          if (availableRooms.length > 0) {
              setFormData(prev => ({ ...prev, room_id: availableRooms[0].id }));
          } else {
              setFormData(prev => ({ ...prev, room_id: '' }));
          }
      }
  }, [formData.building_id, rooms]);


  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.room_id) {
        alert("Pilih Kamar terlebih dahulu!");
        return;
    }
    setLoading(true);
    
    const room = rooms.find(r => r.id === formData.room_id);
    const payload = {
        room_id: formData.room_id,
        title: formData.title,
        description: formData.description,
        priority: formData.priority
    };

    const res = await createTicket(payload, room ? room.room_number : '?');
    
    setLoading(false);
    
    if (res.error) {
        alert('Gagal membuat keluhan: ' + res.error.message);
    } else {
        onSuccess();
    }
  };

  const filteredBuildings = buildings.filter(b => b.site_id === formData.site_id);
  const filteredRooms = rooms.filter(r => r.building_id === formData.building_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md bg-white/95 dark:bg-slate-800/95 shadow-2xl overflow-hidden rounded-2xl">
        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Wrench size={20} className="text-orange-500"/> Input Aduan Fasilitas
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lokasi (Site)</label>
                <select required name="site_id" value={formData.site_id} onChange={handleChange} className="glass-input">
                  <option value="" disabled>-- Pilih Site --</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bangunan Mess</label>
                <select required name="building_id" value={formData.building_id} onChange={handleChange} className="glass-input">
                  <option value="" disabled>-- Pilih Bangunan --</option>
                  {filteredBuildings.map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
                </select>
              </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nomor Kamar</label>
            <select required name="room_id" value={formData.room_id} onChange={handleChange} className="glass-input">
               <option value="" disabled>-- Pilih Kamar --</option>
               {filteredRooms.map(r => <option key={r.id} value={r.id}>Kamar {r.room_number}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Judul Keluhan (Singkat)</label>
            <input required name="title" value={formData.title} onChange={handleChange} className="glass-input" placeholder="Contoh: AC Bocor, Lampu Mati" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tingkat Prioritas</label>
            <select required name="priority" value={formData.priority} onChange={handleChange} className="glass-input">
               <option value="Low">Rendah (Low)</option>
               <option value="Medium">Menengah (Medium)</option>
               <option value="High">Tinggi (High - Urgent)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Deskripsi Detail</label>
            <textarea required name="description" value={formData.description} onChange={handleChange} className="glass-input min-h-[100px]" placeholder="Ceritakan detail kerusakan..."></textarea>
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="glass-button min-w-[120px] flex justify-center items-center bg-orange-500 hover:bg-orange-600 border-none shadow-orange-500/20 text-white">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Kirim Aduan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
