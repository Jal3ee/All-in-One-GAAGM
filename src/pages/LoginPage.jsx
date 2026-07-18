import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../features/auth/services/apiAuth';
import { Lock, User } from 'lucide-react';
import logoTextPolos from '../assets/Text Polos.png';

export default function LoginPage() {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const { error } = await login(nik, password);
    setLoading(false);
    
    if (error) {
       setErrorMsg('NIK atau Password salah.');
    } else {
       navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        
        <div className="glass-card w-full max-w-md p-8 relative z-10 shadow-2xl border border-white/60">
            <div className="text-center mb-8">
                <img src={logoTextPolos} alt="Logo" className="h-20 mx-auto mb-4 object-contain" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">GA Tambang Portal</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Silakan login menggunakan NIK Anda</p>
            </div>
            
            {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 text-center font-medium">
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        required 
                        value={nik} 
                        onChange={e => setNik(e.target.value)} 
                        placeholder="Nomor Induk Karyawan (NIK)"
                        className="glass-input w-full pl-10 py-3 bg-white/70 dark:bg-slate-800/70 font-semibold"
                    />
                </div>
                <div className="relative">
                    <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Password"
                        className="glass-input w-full pl-10 py-3 bg-white/70 dark:bg-slate-800/70"
                    />
                </div>
                <button type="submit" disabled={loading} className="glass-button w-full py-3 mt-2 text-md flex justify-center items-center shadow-md">
                    {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Masuk Sistem'}
                </button>
            </form>
        </div>
    </div>
  );
}
