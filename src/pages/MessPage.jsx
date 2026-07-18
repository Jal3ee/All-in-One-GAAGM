import { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Wrench, Settings, Plus, Trash2, Edit, MapPin, Home, Package, CalendarCheck, Zap } from 'lucide-react';
import RoomMatrix from '../features/mess/components/RoomMatrix';
import RoomModal from '../features/mess/components/RoomModal';
import CheckInModal from '../features/mess/components/CheckInModal';
import TicketModal from '../features/mess/components/TicketModal';
import BulkRoomModal from '../features/mess/components/BulkRoomModal';
import InventoryTab from '../features/mess/components/InventoryTab';
import BookingTab from '../features/mess/components/BookingTab';
import UtilityTab from '../features/mess/components/UtilityTab';
import { 
  fetchSites, fetchBuildings, fetchRooms, fetchActiveOccupancy, fetchTickets, 
  createSite, deleteSite, createBuilding, deleteBuilding, deleteRoom, updateTicketStatus 
} from '../features/mess/services/apiMess';

export default function MessPage() {
  const [activeTab, setActiveTab] = useState('matrix'); // matrix, tickets, master
  const [masterSubTab, setMasterSubTab] = useState('rooms'); // sites, buildings, rooms
  
  // Data
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSiteId, setFilterSiteId] = useState('');
  const [filterBuildingId, setFilterBuildingId] = useState('');

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBulkRoomModalOpen, setIsBulkRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Quick Forms
  const [newSiteName, setNewSiteName] = useState('');
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingSiteId, setNewBuildingSiteId] = useState('');

  useEffect(() => {
     loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      const [sData, bData, rData, oData, tData] = await Promise.all([
          fetchSites(),
          fetchBuildings(),
          fetchRooms(),
          fetchActiveOccupancy(),
          fetchTickets()
      ]);
      setSites(sData);
      setBuildings(bData);
      setRooms(rData);
      setOccupancy(oData);
      setTickets(tData);
      
      // Auto-set default filter if empty
      if (sData.length > 0 && !filterSiteId) {
          setFilterSiteId(sData[0].id);
      }
      setLoading(false);
  };

  // Adjust building filter when site filter changes
  useEffect(() => {
      if (filterSiteId) {
          const validBuildings = buildings.filter(b => b.site_id === filterSiteId);
          if (validBuildings.length > 0) {
              setFilterBuildingId(validBuildings[0].id);
          } else {
              setFilterBuildingId('');
          }
      }
  }, [filterSiteId, buildings]);

  // Derived filtered data
  const filteredRooms = useMemo(() => {
      return rooms.filter(r => r.building_id === filterBuildingId);
  }, [rooms, filterBuildingId]);

  const filteredTickets = useMemo(() => {
      return tickets.filter(t => t.room?.building?.site?.id === filterSiteId || !t.room); // roughly filter
  }, [tickets, filterSiteId]);


  const handleRoomMatrixClick = (action, room) => {
      if (action === 'checkin') {
          setSelectedRoomForCheckIn(room);
          setIsCheckInModalOpen(true);
      } else if (action === 'edit') {
          setEditingRoom(room);
          setIsRoomModalOpen(true);
      }
  };

  // Actions
  const handleAddSite = async (e) => {
      e.preventDefault();
      if (!newSiteName) return;
      await createSite(newSiteName);
      setNewSiteName('');
      loadData();
  };

  const handleDeleteSite = async (id, name) => {
      if (confirm(`Hapus Site ${name}? Ini akan menghapus semua bangunan dan kamar di dalamnya.`)) {
          await deleteSite(id, name);
          loadData();
      }
  };

  const handleAddBuilding = async (e) => {
      e.preventDefault();
      if (!newBuildingName || !newBuildingSiteId) return;
      await createBuilding({ site_id: newBuildingSiteId, building_name: newBuildingName });
      setNewBuildingName('');
      loadData();
  };

  const handleDeleteBuilding = async (id, name) => {
      if (confirm(`Hapus Bangunan ${name}? Ini akan menghapus semua kamar di dalamnya.`)) {
          await deleteBuilding(id, name);
          loadData();
      }
  };

  const handleDeleteRoom = async (room) => {
      if (confirm(`Hapus kamar ${room.room_number}? Aksi ini juga akan menghapus tiket dan history okupansi terkait kamar ini.`)) {
          await deleteRoom(room.id, room.room_number);
          loadData();
      }
  };

  const handleUpdateTicket = async (ticket, newStatus) => {
      await updateTicketStatus(ticket.id, newStatus, ticket.title);
      loadData();
  };

  const renderTickets = () => {
      if (filteredTickets.length === 0) {
          return <div className="text-center p-8 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">Belum ada aduan untuk Site ini.</div>;
      }
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map(t => (
                  <div key={t.id} className="glass p-4 rounded-xl flex flex-col gap-3 relative border-l-4" style={{borderLeftColor: t.priority === 'High' ? '#ef4444' : t.priority === 'Medium' ? '#f59e0b' : '#3b82f6'}}>
                      <div className="flex justify-between items-start">
                         <div>
                             <h4 className="font-bold text-slate-800 dark:text-slate-100">{t.title}</h4>
                             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                 {t.room?.building?.site?.site_name} &gt; {t.room?.building?.building_name} &gt; Kamar {t.room?.room_number}
                             </p>
                         </div>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${t.status === 'Open' ? 'bg-orange-100 text-orange-700' : t.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                             {t.status}
                         </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 bg-white/40 dark:bg-slate-800/40 p-2 rounded-lg">{t.description}</p>
                      
                      <div className="mt-auto pt-3 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                          <span>Oleh: {t.reporter?.nama_lengkap || 'Unknown'}</span>
                          <span className="font-bold priority-badge">{t.priority}</span>
                      </div>

                      {t.status !== 'Resolved' && (
                          <div className="flex gap-2 mt-2">
                              {t.status === 'Open' && (
                                  <button onClick={() => handleUpdateTicket(t, 'In Progress')} className="flex-1 py-1 bg-blue-500 text-white text-xs font-bold rounded-md hover:bg-blue-600 transition-colors">Proses</button>
                              )}
                              <button onClick={() => handleUpdateTicket(t, 'Resolved')} className="flex-1 py-1 bg-green-500 text-white text-xs font-bold rounded-md hover:bg-green-600 transition-colors">Selesai</button>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      );
  };

  const renderMasterData = () => {
      return (
          <div className="flex gap-4 items-start">
             {/* Vertical Tabs for Master Data */}
             <div className="w-48 flex flex-col gap-2">
                 <button onClick={() => setMasterSubTab('sites')} className={`p-3 text-sm font-bold rounded-xl text-left transition-colors ${masterSubTab === 'sites' ? 'bg-primary text-white shadow-sm' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}>1. Kelola Site Lokasi</button>
                 <button onClick={() => setMasterSubTab('buildings')} className={`p-3 text-sm font-bold rounded-xl text-left transition-colors ${masterSubTab === 'buildings' ? 'bg-primary text-white shadow-sm' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}>2. Kelola Bangunan Mess</button>
                 <button onClick={() => setMasterSubTab('rooms')} className={`p-3 text-sm font-bold rounded-xl text-left transition-colors ${masterSubTab === 'rooms' ? 'bg-primary text-white shadow-sm' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}>3. Kelola Kamar</button>
             </div>

             <div className="flex-1 glass-card p-6 min-h-[400px]">
                
                {masterSubTab === 'sites' && (
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Master Data Site</h3>
                        <form onSubmit={handleAddSite} className="flex gap-2">
                            <input required value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} placeholder="Nama Site Baru..." className="glass-input flex-1" />
                            <button type="submit" className="glass-button"><Plus size={18} /> Tambah</button>
                        </form>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                            {sites.map(s => (
                                <div key={s.id} className="p-3 border rounded-xl flex justify-between items-center bg-white dark:bg-slate-800">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{s.site_name}</span>
                                    <button onClick={() => handleDeleteSite(s.id, s.site_name)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {masterSubTab === 'buildings' && (
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Master Data Bangunan</h3>
                        <form onSubmit={handleAddBuilding} className="flex gap-2">
                            <select required value={newBuildingSiteId} onChange={(e) => setNewBuildingSiteId(e.target.value)} className="glass-input w-48">
                                <option value="" disabled>-- Pilih Site --</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                            </select>
                            <input required value={newBuildingName} onChange={(e) => setNewBuildingName(e.target.value)} placeholder="Nama Bangunan Baru..." className="glass-input flex-1" />
                            <button type="submit" className="glass-button"><Plus size={18} /> Tambah</button>
                        </form>
                        <table className="w-full text-left mt-4">
                            <thead>
                                <tr className="border-b"><th className="p-2">Site</th><th className="p-2">Bangunan</th><th className="p-2 text-right">Aksi</th></tr>
                            </thead>
                            <tbody>
                                {buildings.map(b => (
                                    <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700/50">
                                        <td className="p-2 text-slate-500 dark:text-slate-400">{b.site?.site_name}</td>
                                        <td className="p-2 font-bold text-slate-800 dark:text-slate-100">{b.building_name}</td>
                                        <td className="p-2 text-right">
                                            <button onClick={() => handleDeleteBuilding(b.id, b.building_name)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {masterSubTab === 'rooms' && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Master Data Kamar</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setIsBulkRoomModalOpen(true)} className="glass-button py-1.5 px-3 text-sm bg-purple-500 hover:bg-purple-600 border-none">
                                    <Plus size={16} /> Generate Massal
                                </button>
                                <button onClick={() => { setEditingRoom(null); setIsRoomModalOpen(true); }} className="glass-button py-1.5 px-3 text-sm">
                                    <Plus size={16} /> Tambah Kamar
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto max-h-[500px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                                <tr>
                                    <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Lokasi</th>
                                    <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300">No Kamar</th>
                                    <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">Info</th>
                                    <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">Status</th>
                                    <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-300 text-right">Aksi</th>
                                </tr>
                                </thead>
                                <tbody>
                                    {rooms.map(r => (
                                        <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-800/40">
                                            <td className="p-3">
                                                <div className="text-[10px] text-slate-400">{r.building?.site?.site_name}</div>
                                                <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{r.building?.building_name}</div>
                                            </td>
                                            <td className="p-3 font-black text-slate-800 dark:text-slate-100">{r.room_number}</td>
                                            <td className="p-3 text-xs text-center"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.type}</span> <br/> {r.capacity} Org</td>
                                            <td className="p-3 text-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${r.status === 'Kosong' ? 'bg-green-100 text-green-700' : r.status === 'Terisi' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="p-3 flex justify-end gap-1">
                                                <button onClick={() => handleRoomMatrixClick('edit', r)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteRoom(r)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {rooms.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-500 dark:text-slate-400">Belum ada kamar.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
             </div>
          </div>
      )
  };

  return (
    <div className="min-h-full flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manajemen Mess & Akomodasi</h1>
            <p className="text-slate-500 dark:text-slate-400">Pantau ketersediaan kamar dan keluhan fasilitas secara aktual.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button onClick={() => setIsTicketModalOpen(true)} className="glass-button bg-orange-500 border-none text-white hover:bg-orange-600 flex items-center gap-2">
                <Wrench size={18} /> Lapor Aduan
            </button>
        </div>
      </div>

      {/* Global Filters (Hanya untuk Matrix & Tiket) */}
      {activeTab !== 'master' && (
          <div className="glass flex flex-wrap gap-4 p-3 rounded-2xl items-center border border-white/50 shadow-sm bg-white/40 dark:bg-slate-800/40">
             <div className="flex items-center gap-2">
                 <MapPin size={18} className="text-slate-400" />
                 <select value={filterSiteId} onChange={(e) => setFilterSiteId(e.target.value)} className="bg-white/80 dark:bg-slate-800/80 border-none text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="" disabled>-- Pilih Site --</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
                 </select>
             </div>
             
             <div className="flex items-center gap-2">
                 <Home size={18} className="text-slate-400" />
                 <select value={filterBuildingId} onChange={(e) => setFilterBuildingId(e.target.value)} className="bg-white/80 dark:bg-slate-800/80 border-none text-sm font-bold text-slate-700 dark:text-slate-200 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-primary/20">
                    {buildings.filter(b => b.site_id === filterSiteId).map(b => <option key={b.id} value={b.id}>{b.building_name}</option>)}
                    {buildings.filter(b => b.site_id === filterSiteId).length === 0 && <option value="" disabled>Belum ada bangunan</option>}
                 </select>
             </div>
          </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
          <button 
             onClick={() => setActiveTab('matrix')} 
             className={`px-4 py-2 flex items-center gap-2 font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === 'matrix' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600'}`}
          >
              <LayoutGrid size={18} /> Matrix Okupansi
          </button>
          <button 
             onClick={() => setActiveTab('tickets')} 
             className={`px-4 py-2 flex items-center gap-2 font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === 'tickets' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600'}`}
          >
              <Wrench size={18} /> Keluhan Fasilitas
              {filteredTickets.filter(t => t.status !== 'Resolved').length > 0 && (
                 <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{filteredTickets.filter(t => t.status !== 'Resolved').length}</span>
              )}
          </button>
          <button 
             onClick={() => setActiveTab('inventory')} 
             className={`px-4 py-2 flex items-center gap-2 font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === 'inventory' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600'}`}
          >
              <Package size={18} /> Logistik & BHP
          </button>
          <button 
             onClick={() => setActiveTab('booking')} 
             className={`px-4 py-2 flex items-center gap-2 font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === 'booking' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600'}`}
          >
              <CalendarCheck size={18} /> Reservasi Ruang
          </button>
          <button 
             onClick={() => setActiveTab('utilities')} 
             className={`px-4 py-2 flex items-center gap-2 font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === 'utilities' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600'}`}
          >
              <Zap size={18} /> Utilitas
          </button>
          <button 
             onClick={() => setActiveTab('master')} 
             className={`px-4 py-2 flex items-center gap-2 font-semibold transition-all border-b-2 whitespace-nowrap ${activeTab === 'master' ? 'border-primary text-primary' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:border-slate-600 dark:hover:border-slate-600'}`}
          >
              <Settings size={18} /> Master Data
          </button>
      </div>

      {loading ? (
          <div className="flex-1 glass-card flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary border-t-transparent"></div>
              <p>Memuat data Mess...</p>
          </div>
      ) : (
          <div className="flex-1">
             {activeTab === 'matrix' && <RoomMatrix rooms={filteredRooms} occupancy={occupancy} onRoomClick={handleRoomMatrixClick} onRefresh={loadData} />}
             {activeTab === 'tickets' && renderTickets()}
             {activeTab === 'inventory' && <InventoryTab sites={sites} />}
             {activeTab === 'booking' && <BookingTab sites={sites} />}
             {activeTab === 'utilities' && <UtilityTab sites={sites} />}
             {activeTab === 'master' && renderMasterData()}
          </div>
      )}

      {/* Modals */}
      <RoomModal 
          isOpen={isRoomModalOpen} 
          onClose={() => setIsRoomModalOpen(false)} 
          initialData={editingRoom}
          sites={sites}
          buildings={buildings}
          onSuccess={() => { setIsRoomModalOpen(false); loadData(); }} 
      />

      <BulkRoomModal
          isOpen={isBulkRoomModalOpen}
          onClose={() => setIsBulkRoomModalOpen(false)}
          sites={sites}
          buildings={buildings}
          onSuccess={() => { setIsBulkRoomModalOpen(false); loadData(); }}
      />
      
      <CheckInModal 
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          room={selectedRoomForCheckIn}
          onSuccess={() => { setIsCheckInModalOpen(false); loadData(); }}
      />
      
      <TicketModal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          rooms={rooms}
          sites={sites}
          buildings={buildings}
          onSuccess={() => { setIsTicketModalOpen(false); loadData(); if(activeTab !== 'tickets') setActiveTab('tickets'); }}
      />
    </div>
  );
}
