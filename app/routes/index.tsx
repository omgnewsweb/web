import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-white text-center p-6">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Affiliate Tracking Panel</h1>
      <p className="text-lg text-gray-500 mb-8 max-w-lg">Sistem pengalihan tautan dengan optimasi metadata Open Graph. Dirancang untuk kecepatan di Edge.</p>
      <a href="/admin/dashboard" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all">Masuk Admin Area</a>
    </div>,
    { title: 'Beranda' }
  )
})
