import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Users, UploadCloud, Paperclip } from 'lucide-react';
import { createEvent } from '../services/apiEvents';
import { gasStorage, gasFetch } from '../../../lib/gasClient';

export default function EventFormModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    Nama_Kegiatan: '',
    Kategori: 'Rapat',
    PIC: ['ALL'],
    Start_Date: '',
    End_Date: '',
    Timeline_JSON: []
  });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isOpen) fetchEmployees();
  }, [isOpen]);

  const fetchEmployees = async () => {
      const { data } = await gasFetch({
          action: 'read',
          payload: {
              table: 'tbl_employees',
              query: { eq: { status: 'Aktif' } }
          }
      });
      setEmployees(data || []);
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePIC = (id) => {
      let newPic = [...formData.PIC];
      if (id === 'ALL') {
          newPic = ['ALL'];
      } else {
          if (newPic.includes('ALL')) {
              newPic = [id];
          } else {
              if (newPic.includes(id)) {
                  newPic = newPic.filter(p => p !== id);
              } else {
                  newPic.push(id);
              }
          }
      }
      setFormData({ ...formData, PIC: newPic });
  };

  const addTimeline = () => {
    setFormData({
      ...formData,
      Timeline_JSON: [...formData.Timeline_JSON, { date: '', note: '', status: 'pending', attachment_url: null, attachment_name: null, isUploading: false }]
    });
  };

  const handleFileUpload = async (index, file) => {
      if (!file) return;
      
      updateTimeline(index, 'isUploading', true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `events/${fileName}`;

      try {
          const { data, error } = await gasStorage.from('attachments').upload(filePath, file);
          if (error) throw error;
          const publicUrl = data.publicUrl;
          
          const newTimeline = [...formData.Timeline_JSON];
          newTimeline[index].attachment_url = publicUrl;
          newTimeline[index].attachment_name = file.name;
          newTimeline[index].isUploading = false;
          setFormData({ ...formData, Timeline_JSON: newTimeline });
      } catch (error) {
          console.error('Error upload:', error);
          alert('Gagal mengunggah lampiran.');
          updateTimeline(index, 'isUploading', false);
      }
  };

  const updateTimeline = (index, field, value) => {
    const newTimeline = [...formData.Timeline_JSON];
    newTimeline[index][field] = value;
    setFormData({ ...formData, Timeline_JSON: newTimeline });
  };

  const removeTimeline = (index) => {
    const newTimeline = formData.Timeline_JSON.filter((_, i) => i !== index);
    setFormData({ ...formData, Timeline_JSON: newTimeline });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Normalisasi array ke string untuk disimpan di GAS
    const payloadToSubmit = {
      ...formData,
      Timeline_JSON: formData.Timeline_JSON.length > 0 ? formData.Timeline_JSON : undefined
    };

    const result = await createEvent(payloadToSubmit);
    setLoading(false);
    
    if (result && result.status === 'success') {
      onSuccess();
    } else {
      alert('Gagal menyimpan event');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-800/95 shadow-2xl animate-zoom-in">
        <div className="sticky top-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center z-10 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Buat Event Baru</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nama Kegiatan</label>
              <input required name="Nama_Kegiatan" value={formData.Nama_Kegiatan} onChange={handleChange} className="glass-input" placeholder="Contoh: Rapat Koordinasi" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kategori</label>
              <select name="Kategori" value={formData.Kategori} onChange={handleChange} className="glass-input">
                <option value="Rapat">Rapat</option>
                <option value="Tamu Kunjungan">Tamu Kunjungan</option>
                <option value="Pelatihan">Pelatihan</option>
                <option value="Event">Event</option>
                <option value="Inspeksi">Inspeksi</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Penanggung Jawab (PIC)</label>
              <div className="glass-card p-4 flex flex-col gap-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent transition-colors">
                      <input 
                          type="checkbox" 
                          checked={formData.PIC.includes('ALL')} 
                          onChange={() => togglePIC('ALL')} 
                          className="w-4 h-4 text-primary rounded" 
                      />
                      <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-1.5 rounded-lg"><Users size={16} className="text-primary"/></div>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">Tugaskan ke Semua Karyawan (ALL)</span>
                      </div>
                  </label>
                  
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2">Atau pilih beberapa individu (Multi-Select):</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto px-1 pb-1">
                      {employees.map(emp => {
                          const isSelected = formData.PIC.includes(emp.id);
                          return (
                              <label key={emp.id} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} cursor-pointer hover:border-primary/50`}>
                                  <input 
                                      type="checkbox" 
                                      checked={isSelected} 
                                      onChange={() => togglePIC(emp.id)} 
                                      className="w-4 h-4 text-primary rounded" 
                                  />
                                  <div>
                                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{emp.nama_lengkap}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">NIK: {emp.nik}</p>
                                  </div>
                              </label>
                          );
                      })}
                  </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Waktu Mulai</label>
              <input required type="datetime-local" name="Start_Date" value={formData.Start_Date} onChange={handleChange} className="glass-input" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Waktu Selesai</label>
              <input required type="datetime-local" name="End_Date" value={formData.End_Date} onChange={handleChange} className="glass-input" />
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Timeline / Catatan Milestone (Opsional)</label>
              <button type="button" onClick={addTimeline} className="text-sm text-primary flex items-center gap-1 hover:bg-primary/10 px-3 py-1 rounded-lg transition-colors">
                <Plus size={16} /> Tambah Catatan
              </button>
            </div>
            
            {formData.Timeline_JSON.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-center">Belum ada catatan linimasa untuk event ini.</p>
            ) : (
                <div className="flex flex-col gap-3">
                  {formData.Timeline_JSON.map((item, index) => (
                    <div key={index} className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          <input type="date" required value={item.date} onChange={(e) => updateTimeline(index, 'date', e.target.value)} className="glass-input w-full sm:w-auto text-sm bg-white dark:bg-slate-800" />
                          <input type="text" required placeholder="Catatan milestone..." value={item.note} onChange={(e) => updateTimeline(index, 'note', e.target.value)} className="glass-input w-full flex-1 text-sm bg-white dark:bg-slate-800" />
                          <button type="button" onClick={() => removeTimeline(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {item.attachment_url ? (
                                <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 w-full truncate">
                                    <Paperclip size={14} className="flex-shrink-0" />
                                    <span className="truncate flex-1">{item.attachment_name}</span>
                                    <button type="button" onClick={() => { updateTimeline(index, 'attachment_url', null); updateTimeline(index, 'attachment_name', null); }} className="text-red-500 hover:text-red-700 ml-auto">Hapus</button>
                                </div>
                            ) : (
                                <label className="flex items-center justify-center gap-2 text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 w-full hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-primary/50 transition-colors cursor-pointer">
                                    {item.isUploading ? (
                                        <><div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div> Uploading...</>
                                    ) : (
                                        <><UploadCloud size={14} /> Lampirkan File (PDF/JPG)</>
                                    )}
                                    <input type="file" accept=".pdf,image/*" className="hidden" disabled={item.isUploading} onChange={(e) => handleFileUpload(index, e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>
                  ))}
                </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="glass-button min-w-[120px] flex justify-center items-center">
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
