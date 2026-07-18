import { format, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay } from 'date-fns';

const categoryColors = {
  'Rapat': 'bg-blue-500',
  'Pelatihan': 'bg-green-500',
  'Tamu Kunjungan': 'bg-purple-500',
  'Event': 'bg-pink-500',
  'Inspeksi': 'bg-teal-500',
  'Lainnya': 'bg-orange-500'
};

export default function GanttChart({ events = [], currentMonth = new Date(), onEventClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const activeEvents = events.filter(e => {
      if(!e.Start_Date) return false;
      try {
         const evStart = startOfDay(parseISO(e.Start_Date));
         const evEnd = startOfDay(parseISO(e.End_Date || e.Start_Date));
         return evStart <= monthEnd && evEnd >= monthStart;
      } catch(err) {
         return false;
      }
  });

  return (
    <div className="glass-card p-6 w-full overflow-x-auto">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{format(currentMonth, 'MMMM yyyy')}</h2>
        
        <div className="min-w-[800px]">
            {/* Header / Tanggal */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                <div className="w-48 font-bold text-slate-600 dark:text-slate-300 flex-shrink-0">Nama Event</div>
                <div className="flex-1 flex">
                    {daysInMonth.map(day => (
                        <div key={day.toString()} className="flex-1 text-center text-xs text-slate-500 dark:text-slate-400 font-semibold border-l border-slate-100 dark:border-slate-700/50">
                            {format(day, 'd')}
                        </div>
                    ))}
                </div>
            </div>

            {/* Event Rows */}
            {activeEvents.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-center py-6 italic">Tidak ada event di bulan ini.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {activeEvents.map(ev => {
                        const evStart = startOfDay(parseISO(ev.Start_Date));
                        const evEnd = startOfDay(parseISO(ev.End_Date || ev.Start_Date));
                        const colorClass = categoryColors[ev.Kategori] || categoryColors['Lainnya'];
                        const isClosed = ev.Status === 'Closed';

                        return (
                            <div key={ev.ID_Event} className="flex items-center hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors rounded-lg py-1">
                                <div className="w-48 text-sm font-semibold text-slate-700 dark:text-slate-200 truncate pr-2 flex-shrink-0" title={ev.Nama_Kegiatan}>
                                    {ev.Nama_Kegiatan}
                                </div>
                                <div className="flex-1 flex relative h-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    {daysInMonth.map((day, idx) => {
                                        const isSpan = isWithinInterval(day, { start: evStart, end: evEnd });
                                        return (
                                            <div key={idx} className="flex-1 border-l border-slate-100 dark:border-slate-700/50/50 relative">
                                                {isSpan && (
                                                    <div 
                                                        onClick={() => onEventClick && onEventClick(ev)}
                                                        className={`absolute inset-0 cursor-pointer ${colorClass} ${isClosed ? 'opacity-40' : 'opacity-80 hover:opacity-100'} transition-opacity`}
                                                    ></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    </div>
  );
}
