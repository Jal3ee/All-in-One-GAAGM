import { useState, useEffect } from 'react';
import { getAllEmployees, createEmployee, updateEmployeeStatus } from '../../features/admin/services/apiAdmin';
import { UserPlus, UserX, UserCheck } from 'lucide-react';

export default function EmployeeData() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState('Karyawan');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await getAllEmployees();
    setEmployees(data || []);
    setLoading(false);
  };

  const handleCreate = async (e) => {
      e.preventDefault();
      setSaving(true);
      const { error } = await createEmployee(nik, nama, role, password);
      setSaving(false);
      if (error) {
          alert('Gagal membuat karyawan: ' + error.message);
      } else {
          setIsModalOpen(false);
          setNik(''); setNama(''); setRole('Karyawan'); setPassword('');
          loadData();
      }
  };

  const toggleStatus = async (id, currentStatus) => {
      const newStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
      await updateEmployeeStatus(id, newStatus);
      loadData();
  };

  return (
    <div className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manajemen Karyawan</h1>
                <p className="text-slate-500 dark:text-slate-400">Khusus Super Admin: Kelola hak akses dan akun sistem.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="glass-button flex items-center gap-2">
                <UserPlus size={18} /> Tambah Akun
            </button>
        </div>

        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">NIK</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Nama Lengkap</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Role</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">Memuat data...</td></tr>
                        ) : employees.map(emp => (
                            <tr key={emp.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{emp.nik}</td>
                                <td className="p-4 text-slate-700 dark:text-slate-200">{emp.nama_lengkap}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${emp.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-sm ${emp.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {emp.status}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button 
                                        onClick={() => toggleStatus(emp.id, emp.status)}
                                        className={`p-2 rounded-lg transition-colors border shadow-sm ${emp.status === 'Aktif' ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'}`}
                                        title={emp.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                    >
                                        {emp.status === 'Aktif' ? <UserX size={18} /> : <UserCheck size={18} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal Insert */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="glass-card w-full max-w-md bg-white/95 dark:bg-slate-800/95 p-6 border-2 border-primary/20 shadow-2xl">
                 <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Buat Akun Karyawan</h2>
                 <form onSubmit={handleCreate} className="flex flex-col gap-4">
                     <div>
                         <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">NIK</label>
                         <input required value={nik} onChange={e => setNik(e.target.value)} className="glass-input w-full bg-white dark:bg-slate-800" placeholder="Cth: 102938" />
                     </div>
                     <div>
                         <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">Nama Lengkap</label>
                         <input required value={nama} onChange={e => setNama(e.target.value)} className="glass-input w-full bg-white dark:bg-slate-800" />
                     </div>
                     <div>
                         <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">Role</label>
                         <select value={role} onChange={e => setRole(e.target.value)} className="glass-input w-full bg-white dark:bg-slate-800">
                             <option value="Karyawan">Karyawan</option>
                             <option value="Super Admin">Super Admin</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">Password Sementara</label>
                         <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="glass-input w-full bg-white dark:bg-slate-800" minLength="6" />
                     </div>
                     <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium">Batal</button>
                         <button type="submit" disabled={saving} className="glass-button px-6 flex justify-center items-center min-w-[100px]">
                            {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Simpan'}
                         </button>
                     </div>
                 </form>
              </div>
            </div>
        )}
    </div>
  );
}
