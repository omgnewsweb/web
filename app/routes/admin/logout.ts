import { createRoute } from 'honox/factory'
import { deleteCookie } from 'hono/cookie'

export default createRoute(async (c) => {
  // Hapus cookie sesi dari browser
  deleteCookie(c, 'auth_token', { path: '/' })
  
  // Arahkan kembali ke halaman login
  return c.redirect('/admin/login')
})
