import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import MessPage from './pages/MessPage';
import LoginPage from './pages/LoginPage';
import TravelPage from './pages/TravelPage';
import AssetPage from './pages/AssetPage';
import DocsPage from './pages/DocsPage';
import EmployeeData from './pages/admin/EmployeeData';
import SystemLogs from './pages/admin/SystemLogs';

// Komponen Proteksi Rute
function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Memeriksa sesi pengguna...</p>
            </div>
        );
    }
    
    if (!user) return <Navigate to="/login" replace />;
    
    // Blokir jika status Nonaktif
    if (user.profile?.status === 'Nonaktif') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
                <div className="bg-red-100 text-red-600 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Akun Dinonaktifkan</h1>
                <p className="text-slate-600 dark:text-slate-300">Akses Anda ke sistem telah dibekukan. Silakan hubungi Super Admin GA.</p>
            </div>
        );
    }

    // Blokir karyawan biasa jika rute butuh Super Admin
    if (requireAdmin && user.profile?.role !== 'Super Admin') {
        return <Navigate to="/" replace />;
    }
    
    return children;
}

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'dark:bg-slate-800 dark:text-white',
          style: {
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#1e293b',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }} 
      />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <MainLayout />
                </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="mess" element={<MessPage />} />
              <Route path="travel" element={<TravelPage />} />
              <Route path="asset" element={<AssetPage />} />
              <Route path="docs" element={<DocsPage />} />
              
              {/* Rute Super Admin */}
              <Route path="admin/employees" element={
                  <ProtectedRoute requireAdmin={true}>
                      <EmployeeData />
                  </ProtectedRoute>
              } />
              <Route path="admin/logs" element={
                  <ProtectedRoute requireAdmin={true}>
                      <SystemLogs />
                  </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
    </AuthProvider>
    </>
  );
}

export default App;
