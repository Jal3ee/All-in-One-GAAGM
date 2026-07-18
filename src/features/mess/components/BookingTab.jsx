import { useState, useEffect } from 'react';
import { CalendarCheck, Plus, CheckCircle, XCircle } from 'lucide-react';
import { fetchBookings, createBooking, updateBookingStatus } from '../services/apiMess';

export default function BookingTab({ sites }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Add Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newBooking, setNewBooking] = useState({ site_id: '', room_name: '', booker_name: '', start_time: '', end_time: '', purpose: '' });

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        const data = await fetchBookings();
        setBookings(data);
        setLoading(false);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        await createBooking(newBooking);
        setIsAddModalOpen(false);
        setNewBooking({ site_id: '', room_name: '', booker_name: '', start_time: '', end_time: '', purpose: '' });
        loadBookings();
    };

    const handleStatusUpdate = async (id, status, room_name) => {
        if(confirm(`Ubah status reservasi menjadi ${status}?`)) {
            await updateBookingStatus(id, status, room_name);
            loadBookings();
        }
    };

    if (loading) return <div className="text-center py-10 text-slate-500 dark:text-slate-400">Memuat data reservasi...</div>;

    return (
        <div className="glass-card p-6 flex flex-col gap-6 min-h-[400px]">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <CalendarCheck size={20} className="text-primary"/> Reservasi Ruang Umum
                </h2>
                <button onClick={() => setIsAddModalOpen(true)} className="glass-button py-1.5 px-3 text-sm flex items-center gap-1">
                    <Plus size={16}/> Reservasi Baru
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map(b => (
                    <div key={b.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${b.status === 'Approved' ? 'bg-green-500' : b.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        
                        <div className="flex justify-between items-start pl-2">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">{b.room_name}</h3>
                                <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">{b.site?.site_name}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'Approved' ? 'bg-green-100 text-green-700' : b.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {b.status}
                            </span>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-sm flex flex-col gap-1 border border-slate-100 dark:border-slate-700/50 ml-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Peminjam:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{b.booker_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Mulai:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(b.start_time).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Selesai:</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200">{new Date(b.end_time).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700/50 text-xs italic text-slate-600 dark:text-slate-300">
                                "{b.purpose}"
                            </div>
                        </div>

                        {b.status === 'Pending' && (
                            <div className="flex gap-2 mt-auto pt-2 ml-2">
                                <button onClick={() => handleStatusUpdate(b.id, 'Approved', b.room_name)} className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600">
                                    <CheckCircle size={14}/> Setujui
                                </button>
                                <button onClick={() => handleStatusUpdate(b.id, 'Rejected', b.room_name)} className="flex-1 py-1.5 flex items-center justify-center gap-1 bg-red-50 text-red-500 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100">
                                    <XCircle size={14}/> Tolak
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {bookings.length === 0 && <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400">Belum ada riwayat reservasi ruangan.</div>}
            </div>

            {/* Modal Add Booking */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md bg-white dark:bg-slate-800 p-6 shadow-xl">
                        <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">Form Reservasi Ruangan</h3>
                        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pilih Site Lokasi</label>
                                <select required value={newBooking.site_id} onChange={e => setNewBooking({...newBooking, site_id: e.target.value})} className="glass-input w-full">
                                    <option value="" disabled>-- Pilih Site --</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ruangan yang Dipinjam</label>
                                <input type="text" required value={newBooking.room_name} onChange={e => setNewBooking({...newBooking, room_name: e.target.value})} className="glass-input w-full" placeholder="Ruang Meeting A, Lapangan Basket..."/>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Peminjam / Tim</label>
                                <input type="text" required value={newBooking.booker_name} onChange={e => setNewBooking({...newBooking, booker_name: e.target.value})} className="glass-input w-full" placeholder="Tim IT / John Doe"/>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Waktu Mulai</label>
                                    <input type="datetime-local" required value={newBooking.start_time} onChange={e => setNewBooking({...newBooking, start_time: e.target.value})} className="glass-input w-full" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Waktu Selesai</label>
                                    <input type="datetime-local" required value={newBooking.end_time} onChange={e => setNewBooking({...newBooking, end_time: e.target.value})} className="glass-input w-full" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tujuan / Keperluan</label>
                                <textarea required value={newBooking.purpose} onChange={e => setNewBooking({...newBooking, purpose: e.target.value})} className="glass-input w-full h-20 resize-none" placeholder="Rapat koordinasi bulanan..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">Batal</button>
                                <button type="submit" className="glass-button px-4 py-2">Ajukan Reservasi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
