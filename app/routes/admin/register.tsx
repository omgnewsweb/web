import { createRoute } from 'honox/factory'
import { hashPassword } from '../../utils/hash'

export const POST = createRoute(async (c) => {
  try {
    // 1. Kunci Halaman
    const checkUser = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_username"').first<{value: string}>()
    if (checkUser?.value) return c.redirect('/admin/login')

    const body = await c.req.parseBody()
    const username = (body.username as string).trim()
    const password = (body.password as string).trim()
    const secret = c.env.JWT_SECRET || 'kunci_rahasia_cadangan_123'

    // 2. Hash Password
    const hashedPassword = await hashPassword(password, secret)

    // 3. Simpan ke D1 
    // PERBAIKAN: Gunakan INSERT OR REPLACE untuk menghindari error duplikat/bentrok data
    await c.env.DB.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES ("admin_username", ?)').bind(username).run()
    await c.env.DB.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES ("admin_password", ?)').bind(hashedPassword).run()

    return c.redirect('/admin/login')
  } catch (err: any) {
    // PERBAIKAN: Tangkap error agar tidak blank, lalu tampilkan di UI
    return c.render(<RegisterUI error={`Gagal menyimpan ke database: ${err.message}`} />)
  }
})

export default createRoute(async (c) => {
  try {
    // Kunci Halaman
    const checkUser = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_username"').first<{value: string}>()
    if (checkUser?.value) return c.redirect('/admin/login')
  } catch (err: any) {
    // PERBAIKAN: Jika tabel di database D1 belum dibuat sama sekali, error akan muncul di sini
    return c.render(<RegisterUI error={`Koneksi Database Gagal (Apakah tabel D1 sudah dibuat?): ${err.message}`} />)
  }

  return c.render(<RegisterUI />)
})

// UI dipisahkan ke dalam fungsi agar bisa merender pesan error dengan rapi
function RegisterUI({ error }: { error?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Instalasi Admin</h2>
        <p className="text-sm text-gray-500 mb-6">Buat akun admin pertama Anda. Halaman ini aman dan hanya muncul satu kali.</p>
        
        {/* Notifikasi error akan muncul di kotak merah ini jika gagal */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* PERBAIKAN: Menambahkan action="/admin/register" secara eksplisit */}
        <form action="/admin/register" method="POST" className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username Baru</label>
            <input type="text" name="username" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password Baru</label>
            <input type="password" name="password" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <button type="submit" className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors">
            Generate & Simpan Keamanan
          </button>
        </form>
      </div>
    </div>
  )
}
