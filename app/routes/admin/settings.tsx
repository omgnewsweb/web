import { createRoute } from 'honox/factory'
import { AdminShell } from '../../components/AdminShell'
import { hashPassword } from '../../utils/hash'

export const POST = createRoute(async (c) => {
  let successMsg = '', errorMsg = ''
  const body = await c.req.parseBody()
  const secret = c.env.JWT_SECRET || 'kunci_rahasia_cadangan_123'
  
  if (body._action === 'UPDATE_AUTH') {
    if (body.password !== body.confirm_password) {
      errorMsg = 'Konfirmasi sandi tidak cocok!'
    } else {
      // Password di-hash sebelum masuk database
      const hashed = await hashPassword(body.password as string, secret)
      
      await c.env.DB.prepare('UPDATE admin_settings SET value=? WHERE key="admin_username"').bind(body.username as string).run()
      await c.env.DB.prepare('UPDATE admin_settings SET value=? WHERE key="admin_password"').bind(hashed).run()
      successMsg = 'Kredensial login berhasil diperbarui!'
    }
  } else if (body._action === 'UPDATE_CLOUDINARY') {
    await c.env.DB.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES ("cloudinary_cloud_name", ?)').bind(body.cloud_name as string).run()
    await c.env.DB.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES ("cloudinary_api_key", ?)').bind(body.api_key as string).run()
    await c.env.DB.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES ("cloudinary_secret", ?)').bind(body.api_secret as string).run()
    successMsg = 'Kredensial API Gambar tersimpan!'
  }
  return await renderPage(c, successMsg, errorMsg)
})

export default createRoute(async (c) => {
  return await renderPage(c)
})

async function renderPage(c: any, successMsg = '', errorMsg = '') {
  const getSetting = async (key: string) => (await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key=?').bind(key).first<{value: string}>())?.value || ''
  const user = await getSetting('admin_username')
  const cloudName = await getSetting('cloudinary_cloud_name')
  const apiKey = await getSetting('cloudinary_api_key')
  const apiSecret = await getSetting('cloudinary_secret')

  return c.render(
    <AdminShell activePage="settings">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Pengaturan Sistem</h1>
      </div>

      {successMsg && <script dangerouslySetInnerHTML={{ __html: `Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '${successMsg}', showConfirmButton: false, timer: 3000 });`}} />}
      {errorMsg && <script dangerouslySetInnerHTML={{ __html: `Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: '${errorMsg}', showConfirmButton: false, timer: 3000 });`}} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Ubah Akses Admin</h2>
          <form method="POST" className="flex flex-col gap-4">
            <input type="hidden" name="_action" value="UPDATE_AUTH" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username Admin</label>
              <input type="text" name="username" defaultValue={user || 'admin'} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
              <input type="password" name="password" className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Konfirmasi Password</label>
              <input type="password" name="confirm_password" className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition">Perbarui Kredensial</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Integrasi Cloudinary</h2>
          <p className="text-sm text-gray-500 mb-6">Konfigurasi ini untuk persiapan fitur manajemen gambar otomatis.</p>
          <form method="POST" className="flex flex-col gap-4">
            <input type="hidden" name="_action" value="UPDATE_CLOUDINARY" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cloud Name</label>
              <input type="text" name="cloud_name" defaultValue={cloudName} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">API Key</label>
              <input type="text" name="api_key" defaultValue={apiKey} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">API Secret</label>
              <input type="password" name="api_secret" defaultValue={apiSecret} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" required />
            </div>
            <button type="submit" className="mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition">Simpan API Keys</button>
          </form>
        </div>
      </div>
    </AdminShell>,
    { title: 'Pengaturan' }
  )
}
