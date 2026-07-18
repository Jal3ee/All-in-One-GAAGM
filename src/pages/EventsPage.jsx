import { useState, useEffect } from 'react';
import Calendar from '../features/events/components/Calendar';
import GanttChart from '../features/events/components/GanttChart';
import EventFormModal from '../features/events/components/EventFormModal';
import EventDetailModal from '../features/events/components/EventDetailModal';
import { fetchEvents } from '../features/events/services/apiEvents';
import { markAsRead } from '../features/notifications/services/apiNotifications';
import { Calendar as CalendarIcon, List, Plus, LayoutPanelLeft, Filter, User } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { gasFetch } from '../lib/gasClient';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); 
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { notifications, loadNotifications } = useOutletContext() || {};

  // Filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const [data, emps] = await Promise.all([
        fetchEvents(),
        gasFetch({ action: 'read', payload: { table: 'tbl_employees' }})
    ]);
    setEvents(data);
    setEmployees(emps.data || []);
    setLoading(false);
  };

  const renderPIC = (picArray) => {
      if (!picArray || picArray.length === 0) return 'Belum ditentukan';
      if (picArray.includes('ALL')) return 'Semua Karyawan';
      const names = picArray.map(id => {
          const emp = employees.find(e => e.id === id);
          return emp ? emp.nama_lengkap.split(' ')[0] : 'Unknown'; // use first name to save space
      });
      return names.join(', ');
  };

  const handleEventClick = async (ev) => {
      setSelectedEvent(ev);
      setIsDetailModalOpen(true);
      
      // Tandai semua notifikasi untuk event ini sebagai terbaca
      const unreadNotifs = notifications?.filter(n => n.entity_id === ev.ID_Event && !n.is_read);
      if (unreadNotifs && unreadNotifs.length > 0) {
          for (const n of unreadNotifs) {
              await markAsRead(n.id);
          }
          if (loadNotifications) loadNotifications();
      }
  };

  const filteredEvents = events.filter(ev => {
    if (filterCategory !== 'All' && ev.Kategori !== filterCategory) return false;
    if (filterStatus !== 'All' && ev.Status !== filterStatus) return false;
    return true;
  }).map(ev => ({
    ...ev,
    hasUnread: notifications?.some(n => n.entity_id === ev.ID_Event && !n.is_read) || false
  }));

  return (
    <div className="p-6 min-h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Event Management</h1>
            <p className="text-slate-500 dark:text-slate-400">Visualisasi jadwal dan pemantauan kegiatan GA</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass flex items-center rounded-xl p-1">
              <button 
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg flex items-center gap-2 transition-all ${view === 'calendar' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
              >
                  <CalendarIcon size={18} /> <span className="hidden sm:inline">Kalender</span>
              </button>
              <button 
                onClick={() => setView('gantt')}
                className={`p-2 rounded-lg flex items-center gap-2 transition-all ${view === 'gantt' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
              >
                  <LayoutPanelLeft size={18} /> <span className="hidden sm:inline">Gantt</span>
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-lg flex items-center gap-2 transition-all ${view === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
              >
                  <List size={18} /> <span className="hidden sm:inline">Daftar</span>
              </button>
          </div>
          <button onClick={() => setIsFormModalOpen(true)} className="glass-button flex items-center gap-2">
              <Plus size={18} /> Buat Event
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass px-4 py-3 rounded-xl flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium text-sm">
             <Filter size={16} /> Filter:
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="glass-input text-sm py-1.5 min-w-[150px]">
             <option value="All">Semua Kategori</option>
             <option value="Rapat">Rapat</option>
             <option value="Pelatihan">Pelatihan</option>
             <option value="Tamu Kunjungan">Tamu Kunjungan</option>
             <option value="Event">Event</option>
             <option value="Inspeksi">Inspeksi</option>
             <option value="Lainnya">Lainnya</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="glass-input text-sm py-1.5 min-w-[150px]">
             <option value="All">Semua Status</option>
             <option value="Open">Buka (Open)</option>
             <option value="Closed">Selesai (Closed)</option>
          </select>
      </div>
      
      {loading ? (
          <div className="flex-1 glass-card flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
              <p>Memuat data dari Google Sheets...</p>
          </div>
      ) : (
          <div className="flex-1">
             {view === 'calendar' && <Calendar events={filteredEvents} onEventClick={handleEventClick} />}
             {view === 'gantt' && <GanttChart events={filteredEvents} onEventClick={handleEventClick} />}
             {view === 'list' && (
                 <div className="glass-card p-6">
                     <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Daftar Event</h3>
                     {filteredEvents.length === 0 ? (
                         <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                            <List size={48} className="mx-auto mb-4 opacity-30" />
                            <p>Belum ada event yang cocok dengan filter.</p>
                         </div>
                     ) : (
                         <div className="flex flex-col gap-3">
                             {filteredEvents.map(ev => {
                                 let tlCount = 0, chkCount = 0, chkDone = 0;
                                 try {
                                    const tl = JSON.parse(ev.Timeline_JSON || '[]');
                                    tlCount = tl.length;
                                    const chk = JSON.parse(ev.Checklist_JSON || '[]');
                                    chkCount = chk.length;
                                    chkDone = chk.filter(c => c.done).length;
                                 } catch(e){}

                                 return (
                                 <div 
                                    key={ev.ID_Event} 
                                    onClick={() => handleEventClick(ev)}
                                    className={`glass p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border-l-4 ${ev.Status === 'Closed' ? 'border-l-slate-400 opacity-70' : 'border-l-primary'}`}
                                 >
                                     <div className="flex-1">
                                         <div className="flex items-center gap-3 mb-1 relative">
                                            <h4 className={`font-bold text-lg ${ev.Status === 'Closed' ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {ev.Nama_Kegiatan}
                                                {ev.hasUnread && <span className="ml-2 inline-block w-2.5 h-2.5 bg-red-500 rounded-full" title="Terdapat pembaruan belum dibaca"></span>}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase shadow-sm ${ev.Status === 'Closed' ? 'bg-slate-200 text-slate-600 dark:text-slate-300' : 'bg-green-100 text-green-700'}`}>
                                                {ev.Status}
                                            </span>
                                         </div>
                                         <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            <span className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-md" title={renderPIC(ev.PIC)}><User size={14} className="text-slate-400"/> {renderPIC(ev.PIC).length > 25 ? renderPIC(ev.PIC).substring(0,25) + '...' : renderPIC(ev.PIC)}</span>
                                            <span className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-md"><CalendarIcon size={14} className="text-slate-400"/> {new Date(ev.Start_Date).toLocaleDateString()} - {new Date(ev.End_Date).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">Timeline: {tlCount}</span>
                                            <span className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-md">Checklist: {chkDone}/{chkCount}</span>
                                         </div>
                                     </div>
                                     <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20 shadow-sm">{ev.Kategori}</span>
                                 </div>
                             )})}
                         </div>
                     )}
                 </div>
             )}
          </div>
      )}

      <EventFormModal 
          isOpen={isFormModalOpen} 
          onClose={() => setIsFormModalOpen(false)} 
          onSuccess={() => {
              setIsFormModalOpen(false);
              loadEvents();
          }} 
      />

      <EventDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          event={selectedEvent}
          renderPIC={renderPIC}
          onSuccess={() => {
              loadEvents(); 
          }}
      />
    </div>
  );
}
