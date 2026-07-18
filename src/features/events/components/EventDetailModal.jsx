import { useState, useEffect } from 'react';
import { X, CheckCircle, Circle, MapPin, Plus, Trash2, Calendar, User, AlignLeft, Paperclip, UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateEvent } from '../services/apiEvents';
import { gasStorage } from '../../../lib/gasClient';

export default function EventDetailModal({ isOpen, onClose, event, onSuccess, renderPIC }) {
  const [timeline, setTimeline] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [status, setStatus] = useState('Open');
  const [newChecklist, setNewChecklist] = useState('');
  
  const [newTimelineDate, setNewTimelineDate] = useState('');
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [newTimelineFile, setNewTimelineFile] = useState(null);
  const [isUploadingTimeline, setIsUploadingTimeline] = useState(false);
  
  const [showTimeline, setShowTimeline] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setTimeline(event.Timeline_JSON ? JSON.parse(event.Timeline_JSON) : []);
      setChecklist(event.Checklist_JSON ? JSON.parse(event.Checklist_JSON) : []);
      setStatus(event.Status || 'Open');
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const toggleStatus = async () => {
    const newStatus = status === 'Open' ? 'Closed' : 'Open';
    setStatus(newStatus);
    await saveUpdates({ Status: newStatus });
  };

  const addChecklistItem = async () => {
    if (!newChecklist.trim()) return;
    const newList = [...checklist, { text: newChecklist, done: false }];
    setChecklist(newList);
    setNewChecklist('');
    await saveUpdates({ Checklist_JSON: newList });
  };

  const toggleChecklistItem = async (index) => {
    const newList = [...checklist];
    newList[index].done = !newList[index].done;
    setChecklist(newList);
    await saveUpdates({ Checklist_JSON: newList });
  };

  const deleteChecklistItem = async (index) => {
    const newList = checklist.filter((_, i) => i !== index);
    setChecklist(newList);
    await saveUpdates({ Checklist_JSON: newList });
  };

  const addTimelineItem = async () => {
      if(!newTimelineDate || !newTimelineNote.trim()) {
          toast.error('Tanggal dan Catatan progress harus diisi!');
          return;
      }
      
      let attachmentUrl = null;
      let attachmentName = null;
      
      if (newTimelineFile) {
          setIsUploadingTimeline(true);
          const fileExt = newTimelineFile.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `events/${fileName}`;
          try {
              const { data, error } = await gasStorage.from('attachments').upload(filePath, newTimelineFile);
              if (error) throw error;
              attachmentUrl = data.publicUrl;
              attachmentName = newTimelineFile.name;
          } catch (error) {
              console.error('Upload Error:', error);
              toast.error('Gagal mengunggah file: ' + (error.message || error));
              setIsUploadingTimeline(false);
              return;
          }
      }

      const newList = [...timeline, { date: newTimelineDate, note: newTimelineNote, status: 'pending', attachment_url: attachmentUrl, attachment_name: attachmentName }];
      setTimeline(newList);
      setNewTimelineDate('');
      setNewTimelineNote('');
      setNewTimelineFile(null);
      setIsUploadingTimeline(false);
      await saveUpdates({ Timeline_JSON: newList });
  };

  const deleteTimelineItem = async (index) => {
      // Find real index after sorting if we were interacting with sorted array, 
      // but here we pass original index or map carefully. 
      // To be safe, we use the original index passed from map.
      const newList = timeline.filter((_, i) => i !== index);
      setTimeline(newList);
      await saveUpdates({ Timeline_JSON: newList });
  };

  const saveUpdates = async (payloadPartial) => {
    setLoading(true);
    await updateEvent({
      ID_Event: event.ID_Event,
      ...payloadPartial
    });
    setLoading(false);
    if(onSuccess) onSuccess(); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white/95 dark:bg-slate-800/95 shadow-2xl animate-zoom-in">
        
        {/* Header */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start z-10">
          <div>
             <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{event.Nama_Kegiatan}</h2>
                 <button 
                    onClick={toggleStatus}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors shadow-sm ${status === 'Open' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-300'}`}
                 >
                     {status}
                 </button>
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg inline-block">{event.Kategori}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            
            {/* Meta Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 glass rounded-xl">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Calendar size={18}/></div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Pelaksanaan</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {new Date(event.Start_Date).toLocaleDateString('id-ID')} - {new Date(event.End_Date).toLocaleDateString('id-ID')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-3 glass rounded-xl">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><User size={18}/></div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">PIC</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{renderPIC ? renderPIC(event.PIC) : Array.isArray(event.PIC) ? event.PIC.join(', ') : event.PIC}</p>
                    </div>
                </div>
            </div>

            {/* Checklist Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <AlignLeft size={18} className="text-primary"/>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Custom Checklist</h3>
                    {loading && <div className="ml-2 animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>}
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newChecklist} 
                        onChange={e => setNewChecklist(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && addChecklistItem()}
                        className="glass-input flex-1 text-sm bg-white dark:bg-slate-800" 
                        placeholder="Tambahkan tugas baru..." 
                    />
                    <button onClick={addChecklistItem} className="glass-button px-4 text-sm py-1">Tambah</button>
                </div>

                <div className="flex flex-col gap-2">
                    {checklist.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Belum ada checklist.</p>
                    ) : (
                        checklist.map((item, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${item.done ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60' : 'glass border-primary/20'}`}>
                                <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleChecklistItem(idx)}>
                                    {item.done ? <CheckCircle size={20} className="text-green-500" /> : <Circle size={20} className="text-slate-300" />}
                                    <span className={`text-sm ${item.done ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>{item.text}</span>
                                </div>
                                <button onClick={() => deleteChecklistItem(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Editable Timeline Dot-to-dot */}
            <div>
                <div className="flex items-center justify-between mb-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-primary"/>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Timeline Perjalanan</h3>
                    </div>
                    <button onClick={() => setShowTimeline(!showTimeline)} className="text-sm text-primary font-medium hover:underline">
                        {showTimeline ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                </div>

                {showTimeline && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4">
                        <div className="ml-2 pl-4 border-l-2 border-primary/30 py-2 space-y-6 relative">
                            {timeline.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic -ml-4 mb-4">Tidak ada timeline yang dicatat.</p>
                            ) : (
                                // Kita map langsung berdasar timeline asli untuk memastikan index delete-nya tepat, 
                                // namun secara visual kita harus mengurutkannya. Karena kita butuh indeks asli untuk hapus,
                                // kita buat array of objects dengan indeks aslinya.
                                timeline.map((item, originalIndex) => ({...item, originalIndex}))
                                  .sort((a,b) => new Date(a.date) - new Date(b.date))
                                  .map((item) => (
                                    <div key={item.originalIndex} className="relative group">
                                        <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-slate-50"></span>
                                        <div className="glass p-3 rounded-xl -mt-2 flex justify-between items-start hover:shadow-md transition-shadow">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-primary mb-1">{new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</p>
                                                <p className="text-sm text-slate-700 dark:text-slate-200">{item.note}</p>
                                                {item.attachment_url && (
                                                    <a href={item.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors">
                                                        <Paperclip size={12} /> {item.attachment_name || 'Lihat Lampiran'}
                                                    </a>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => deleteTimelineItem(item.originalIndex)} 
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all p-1.5 rounded-lg ml-2 flex-shrink-0"
                                                title="Hapus Catatan"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input type="date" value={newTimelineDate} onChange={e => setNewTimelineDate(e.target.value)} className="glass-input text-sm py-1" />
                                <input type="text" value={newTimelineNote} onChange={e => setNewTimelineNote(e.target.value)} placeholder="Catatan progress..." className="glass-input flex-1 text-sm py-1" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                                <label className="flex items-center gap-2 text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer">
                                    <UploadCloud size={14} /> 
                                    {newTimelineFile ? newTimelineFile.name : 'Lampirkan File (Opsional)'}
                                    <input type="file" accept=".pdf,image/*" className="hidden" onChange={e => setNewTimelineFile(e.target.files[0])} />
                                </label>
                                <button onClick={addTimelineItem} disabled={loading || isUploadingTimeline} className="glass-button px-4 text-sm py-1.5 w-full sm:w-auto flex justify-center items-center">
                                    {isUploadingTimeline ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div> : 'Tambah'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}
