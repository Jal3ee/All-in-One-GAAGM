import { useState } from 'react';
import { X, LogIn, Wrench, AlertTriangle } from 'lucide-react';
import { checkIn } from '../services/apiMess';

export default function CheckInModal({ isOpen, onClose, onSuccess, room }) {
  const [formData, setFormData] = useState({
    occupant_name: '',
    check_in: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !room) return null;

  // Occupancy Conflict Validator
  const isMaintenance = room.status === 'Pemeliharaan';
  const isFull = room.status === 'Terisi' || (room.type === 'Single' && room.status !== 'Kosong' && room.status !== 'Pemeliharaan');

  if (isMaintenance) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm bg-white/95 dark:bg-slate-800/95 p-6 rounded-2xl flex flex-col items-center gap-4 text-center shadow-2xl border-orange-200 border-2">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 mb-2">
                  <Wrench size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pemeliharaan</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Kamar {room.room_number} sedang dalam perbaikan. Tidak dapat melakukan Check-In.</p>
              <button onClick={onClose} className="mt-4 glass-button bg-slate-800 text-white hover:bg-slate-900 w-full border-none">Tutup</button>
          </div>
        </div>
      );
  }

  if (isFull) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm bg-white/95 dark:bg-slate-800/95 p-6 rounded-2xl flex flex-col items-center gap-4 text-center shadow-2xl border-red-200 border-2">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-2">
                  <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Kamar Penuh</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Kamar {room.room_number} ({room.type}) sudah terisi maksimal. Pilih kamar lain.</p>
              <button onClick={onClose} className="mt-4 glass-button bg-slate-800 text-white hover:bg-slate-900 w-full border-none">Tutup</button>
          </div>
        </div>
      );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await checkIn({
        room_id: room.id,
        occupant_name: formData.occupant_name,
        check_in: formData.check_in
    }, room.room_number);
    
    setLoading(false);
    
    if (res.error) {
        alert('Gagal Check-In: ' + res.error.message);
    } else {
        onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md bg-white/95 dark:bg-slate-800/95 shadow-2xl overflow-hidden rounded-2xl">
        <div className="bg-white/90 dark:bg-slate-800/90 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LogIn size={20} className="text-primary"/> Check-In Kamar {room.room_number}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
              <p className="text-sm text-blue-800">Anda sedang memproses <strong>Check-In</strong> untuk tamu di Kamar <strong>{room.room_number}</strong> (Kapasitas: {room.capacity} Orang).</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nama Lengkap Tamu/Penghuni</label>
            <input required name="occupant_name" value={formData.occupant_name} onChange={handleChange} className="glass-input" placeholder="Masukkan nama tamu" />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tanggal Check-In</label>
            <input required type="date" name="check_in" value={formData.check_in} onChange={handleChange} className="glass-input" />
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">Batal</button>
            <button type="submit" disabled={loading} className="glass-button min-w-[120px] flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Proses Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
