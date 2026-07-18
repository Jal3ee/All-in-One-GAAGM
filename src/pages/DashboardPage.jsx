export default function DashboardPage() {
  return (
    <div className="glass-card p-6 min-h-full">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Welcome to All-in-One GA</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-6">Pilih modul di sebelah kiri untuk mulai mengelola kegiatan atau akomodasi.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-2">Event Aktif</h3>
          <div className="text-3xl font-bold text-primary">12</div>
        </div>
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold mb-2">Okupansi Mess</h3>
          <div className="text-3xl font-bold text-primary">85%</div>
        </div>
      </div>
    </div>
  );
}
