import { createRoute } from 'honox/factory'
import { AdminShell } from '../../components/AdminShell'

export default createRoute(async (c) => {
  const totalLinksRes = await c.env.DB.prepare('SELECT COUNT(*) as total FROM links').first<{ total: number }>()
  const totalLinks = totalLinksRes?.total || 0
  const recentLinks = await c.env.DB.prepare('SELECT * FROM links ORDER BY created_at DESC LIMIT 5').all<{ id: number, slug: string, target_url: string, created_at: string }>()

  return c.render(
    <AdminShell activePage="dashboard">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard Analitik</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-blue-500">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tautan Aktif</div>
          <div className="text-3xl font-extrabold text-gray-900 mt-2">{totalLinks} Link</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-green-500">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metrik Klik Harian</div>
          <div className="text-sm font-medium text-gray-500 mt-2">Cek otomatis di dashboard Cloudflare Analytics Anda.</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">5 Tautan Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-500 text-sm border-b">
                <th className="px-6 py-4 font-semibold">Slug Tautan</th>
                <th className="px-6 py-4 font-semibold">Target URL</th>
                <th className="px-6 py-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentLinks.results.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">/{l.slug}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-xs">{l.target_url}</td>
                  <td className="px-6 py-4"><a href={`/admin/links/${l.id}`} className="text-blue-600 font-semibold text-sm hover:underline">Kelola →</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>,
    { title: 'Dashboard' }
  )
})
