export function AdminShell({ children, activePage }: { children: any, activePage: string }) {
  const linkClass = (page: string) => `block px-4 py-3 rounded text-sm transition-colors ${activePage === page ? 'bg-blue-600 text-white font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`;
  
  return (
    <div className="flex w-full min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-8 px-2 mt-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-bold text-lg tracking-wide">Panel Afiliasi</span>
        </div>
        <nav className="flex flex-col gap-2">
          <a href="/admin/dashboard" className={linkClass('dashboard')}>Dashboard Analitik</a>
          <a href="/admin/links" className={linkClass('links')}>Manajemen Tautan</a>
          <a href="/admin/settings" className={linkClass('settings')}>Pengaturan API</a>
        </nav>
        <div className="mt-auto px-2 pb-4">
          {/* Tautan di bawah ini sudah diperbaiki mengarah ke /admin/logout */}
          <a href="/admin/logout" className="text-sm text-gray-400 hover:text-red-400 transition-colors">Keluar Sistem</a>
        </div>
      </aside>
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  )
}
