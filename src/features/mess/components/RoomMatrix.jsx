import { Users, AlertTriangle } from 'lucide-react';
import { checkOut } from '../services/apiMess';

export default function RoomMatrix({ rooms, occupancy, onRoomClick, onRefresh }) {
   const getOccupant = (roomId) => occupancy.find(o => o.room_id === roomId);

   const handleCheckOut = async (room, occ) => {
       if (confirm(`Apakah Anda yakin ingin Check-Out tamu ${occ.occupant_name} dari kamar ${room.room_number}?`)) {
           await checkOut(occ.id, room.id, room.room_number, occ.occupant_name);
           onRefresh();
       }
   };

   if (rooms.length === 0) {
       return (
           <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
               <p>Belum ada data kamar. Silakan tambah kamar di menu Master Data.</p>
           </div>
       );
   }

   return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
         {rooms.map(room => {
             const occ = getOccupant(room.id);
             let bgColor = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
             let textColor = 'text-slate-700 dark:text-slate-200';

             if (room.status === 'Kosong') {
                 bgColor = 'bg-green-50/80 border-green-300';
                 textColor = 'text-green-700';
             } else if (room.status === 'Terisi') {
                 bgColor = 'bg-red-50 border-red-300';
                 textColor = 'text-red-700';
             } else if (room.status === 'Maintenance') {
                 bgColor = 'bg-yellow-50 border-yellow-300';
                 textColor = 'text-yellow-700';
             }

             return (
                 <div key={room.id} className={`${bgColor} border-2 rounded-2xl p-4 flex flex-col items-center justify-center relative group shadow-sm hover:shadow-md transition-all overflow-hidden h-32`}>
                     <span className={`text-2xl font-black ${textColor}`}>{room.room_number}</span>
                     <span className="text-[10px] mt-1 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">{room.type}</span>
                     
                     {room.status === 'Terisi' && occ && (
                         <div className="mt-auto mb-1 flex flex-col items-center w-full px-2">
                             <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/50 w-full justify-center">
                                 <Users size={12} className="text-primary flex-shrink-0" />
                                 <p className="text-[11px] font-bold truncate leading-tight" title={occ.occupant_name}>{occ.occupant_name}</p>
                             </div>
                         </div>
                     )}

                     {/* Hover overlay actions */}
                     <div className="absolute inset-0 bg-slate-800/90 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 z-10">
                        {room.status === 'Kosong' && (
                            <button onClick={() => onRoomClick('checkin', room)} className="w-full py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                Check-In
                            </button>
                        )}
                        {room.status === 'Terisi' && occ && (
                            <button onClick={() => handleCheckOut(room, occ)} className="w-full py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                                Check-Out
                            </button>
                        )}
                        {room.status === 'Maintenance' && (
                            <div className="text-yellow-400 flex flex-col items-center justify-center mb-1">
                                <AlertTriangle size={18} />
                                <span className="text-[10px] font-bold mt-1 text-center">MAINTENANCE</span>
                            </div>
                        )}
                        <button onClick={() => onRoomClick('edit', room)} className="w-full py-1.5 bg-white/20 dark:bg-slate-800/20 hover:bg-white/30 dark:hover:bg-slate-800/30 text-white text-xs font-bold rounded-lg transition-colors mt-auto">
                            Edit Kamar
                        </button>
                     </div>
                 </div>
             );
         })}
      </div>
   );
}
