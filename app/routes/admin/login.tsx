import { createRoute } from 'honox/factory'
import { sign } from 'hono/jwt'
import { setCookie } from 'hono/cookie'
import { hashPassword } from '../../utils/hash'

export const POST = createRoute(async (c) => {
  try {
    const body = await c.req.parseBody()
    const inputUsername = (body.username as string).trim()
    const inputPassword = (body.password as string).trim()
    const secret = c.env.JWT_SECRET || 'kunci_rahasia_cadangan_123'

    const userDbRes = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_username"').first<{value: string}>()
    const adminRes = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_password"').first<{value: string}>()

    // Jika database benar-benar kosong, arahkan ke register
    if (!userDbRes?.value) {
      return c.redirect('/admin/register')
    }

    const realUser = userDbRes.value.trim()
    const realPassHash = adminRes?.value?.trim()

    // HASH password inputan sebelum dicocokkan
    const hashedInputPassword = await hashPassword(inputPassword, secret)

    if (inputUsername === realUser && hashedInputPassword === realPassHash) {
      // EKSPLISIT ALG HS256
      const token = await sign({ username: inputUsername, exp: Math.floor(Date.now() / 1000) + 86400 }, secret, 'HS256')
      setCookie(c, 'auth_token', token, { path: '/', httpOnly: true, secure: true, maxAge: 86400, sameSite: 'Lax' })
      return c.redirect('/admin/dashboard')
    }
    
    return c.render(<LoginUI error="Username atau password salah!" />)
  } catch (err: any) {
    return c.render(<LoginUI error={`Sistem Error: ${err.message}`} />)
  }
})

export default createRoute(async (c) => {
  const checkUser = await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key = "admin_username"').first<{value: string}>()
  if (!checkUser?.value) return c.redirect('/admin/register')
  
  return c.render(<LoginUI />)
})

function LoginUI({ error }: { error?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
        <p className="text-sm text-gray-500 mb-6">Silakan masuk untuk mengelola tautan afiliasi.</p>
        
        {error && (
          <script dangerouslySetInnerHTML={{ __html: `
            Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: '${error}', showConfirmButton: false, timer: 5000 });
          `}} />
        )}

        <form method="POST" className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
            <input type="text" name="username" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input type="password" name="password" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors">Login Ke Dashboard</button>
        </form>
      </div>
    </div>
  )
}
