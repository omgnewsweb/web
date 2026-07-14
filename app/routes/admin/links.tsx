import { createRoute } from 'honox/factory'
import { AdminShell } from '../../components/AdminShell'

async function getCloudinarySignature(timestamp: string, apiSecret: string) {
  const msgBuffer = new TextEncoder().encode(`timestamp=${timestamp}${apiSecret}`)
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const POST = createRoute(async (c) => {
  let successMsg = ''
  let errorMsg = ''
  
  const body = await c.req.parseBody()
  let name = body.name as string || 'Untitled Link'
  let slug = (body.slug as string).replace(/^\/+|\/+$/g, '')
  let finalImageUrl = body.og_image_url as string || ''
  let siteName = body.og_site_name as string || ''
  let ogUrl = body.og_url as string || '' // Tangkap Canonical URL

  const imageFile = body.image_file as File
  if (imageFile && imageFile.size > 0) {
    try {
      const getSetting = async (k: string) => (await c.env.DB.prepare('SELECT value FROM admin_settings WHERE key=?').bind(k).first<{value: string}>())?.value || ''
      const cloudName = await getSetting('cloudinary_cloud_name')
      const apiKey = await getSetting('cloudinary_api_key')
      const apiSecret = await getSetting('cloudinary_secret')

      if (!cloudName || !apiKey || !apiSecret) throw new Error('Kredensial Cloudinary belum diatur di Pengaturan!')

      const timestamp = Math.round(new Date().getTime() / 1000).toString()
      const signature = await getCloudinarySignature(timestamp, apiSecret)

      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('api_key', apiKey)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData })
      const uploadJson = await uploadRes.json() as any
      
      if (uploadJson.secure_url) {
        finalImageUrl = uploadJson.secure_url.replace('/upload/', '/upload/c_fill,w_1200,h_630,f_webp/')
      } else {
        throw new Error('Gagal mengunggah ke Cloudinary.')
      }
    } catch (err: any) {
      errorMsg = err.message
    }
  }

  if (!errorMsg) {
    // Insert dengan og_url
    await c.env.DB.prepare('INSERT INTO links (name, slug, target_url, og_title, og_description, og_image_url, og_site_name, og_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(name, slug, body.target_url as string, body.og_title as string, body.og_description as string, finalImageUrl, siteName, ogUrl).run()
    successMsg = 'Tautan afiliasi baru berhasil dibuat!'
  }

  return await renderPage(c, successMsg, errorMsg)
})

export default createRoute(async (c) => {
  return await renderPage(c)
})

async function renderPage(c: any, successMsg = '', errorMsg = '') {
  const linksList = await c.env.DB.prepare('SELECT id, name, slug FROM links ORDER BY id DESC').all<{id: number, name: string, slug: string}>()

  return c.render(
    <AdminShell activePage="links">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Tautan Afiliasi</h1>
      </div>

      {successMsg && <script dangerouslySetInnerHTML={{ __html: `Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: '${successMsg}', showConfirmButton: false, timer: 3000 });`}} />}
      {errorMsg && <script dangerouslySetInnerHTML={{ __html: `Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: '${errorMsg}', showConfirmButton: false, timer: 4000 });`}} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Buat Tautan Pintar</h2>
          
          <form method="POST" encType="multipart/form-data" className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Internal Link</label>
              <input type="text" name="name" placeholder="Misal: Promo Celana Cutbray FB" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Custom Slug (Gunakan '/')</label>
              <input type="text" name="slug" placeholder="promo/sepatu" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Target URL Afiliasi</label>
              <input type="url" name="target_url" placeholder="https://shopee..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fake Canonical URL (Berita Besar)</label>
              <input type="url" name="og_url" id="input-canonical" placeholder="Misal: https://news.detik.com/berita/..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Situs / Domain (Opsional)</label>
              <input type="text" name="og_site_name" id="input-domain" placeholder="Misal: Detik News" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Open Graph</label>
              <input type="text" name="og_title" id="input-title" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Open Graph</label>
              <input type="text" name="og_description" id="input-desc" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
            </div>
            
            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Gambar (Cloudinary)</label>
              <input type="file" name="image_file" accept="image/*" id="input-img-file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
              <div className="flex items-center my-3"><hr className="flex-1 border-gray-300"/><span className="mx-2 text-xs text-gray-400 font-bold">ATAU</span><hr className="flex-1 border-gray-300"/></div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Tempel URL Gambar Eksternal</label>
              <input type="url" name="og_image_url" id="input-img-url" placeholder="https://..." className="w-full px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>

            <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition">Simpan & Upload</button>
          </form>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 border-dashed">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Live Facebook Preview</h2>
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm max-w-[500px]">
              <img id="prev-img" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22100%25%22%20height%3D%22261%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f2f5%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23bcc0c4%22%20dy%3D%22.3em%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%22%20font-size%3D%2216%22%3EPratinjau Gambar%3C%2Ftext%3E%3C%2Fsvg%3E" className="w-full h-[261px] object-cover bg-gray-50" />
              <div className="p-3 bg-[#f2f3f5]">
                <span id="prev-domain" className="text-[12px] text-[#606770] uppercase block mb-1"></span>
                <div id="prev-title" className="text-[16px] font-semibold text-[#1d2129] leading-tight truncate">Judul Menarik Di Sini</div>
                <div id="prev-desc" className="text-[14px] text-[#606770] mt-1 line-clamp-2">Deskripsi singkat penawaran...</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b bg-gray-50 text-gray-600"><th className="p-4">Nama Link</th><th className="p-4">Slug</th><th className="p-4">Aksi</th></tr></thead>
              <tbody className="divide-y">
                {linksList.results.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-800">{l.name}</td>
                    <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">/{l.slug}</span></td>
                    <td className="p-4 flex gap-2">
                      <button type="button" onClick={`copyLink('${l.slug}')`} className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1.5 rounded text-xs font-semibold transition">Copy</button>
                      <a href={`/admin/links/${l.id}`} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded text-xs font-semibold transition">Edit</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function upd() {
          document.getElementById('prev-title').innerText = document.getElementById('input-title').value || 'Judul Menarik Di Sini';
          document.getElementById('prev-desc').innerText = document.getElementById('input-desc').value || 'Deskripsi singkat penawaran...';
          
          const domainInput = document.getElementById('input-domain').value;
          const canonicalInput = document.getElementById('input-canonical').value;
          let displayDomain = window.location.hostname;
          if (domainInput) {
            displayDomain = domainInput;
          } else if (canonicalInput) {
            try { displayDomain = new URL(canonicalInput).hostname; } catch(e) {}
          }
          document.getElementById('prev-domain').innerText = displayDomain.toUpperCase();
          
          const urlInput = document.getElementById('input-img-url').value;
          if(urlInput) document.getElementById('prev-img').src = urlInput;
        }
        document.addEventListener('DOMContentLoaded', upd);
        ['input-title','input-desc','input-domain','input-canonical','input-img-url'].forEach(id => document.getElementById(id)?.addEventListener('input', upd));
        
        document.getElementById('input-img-file').addEventListener('change', function(e) {
          const file = e.target.files[0];
          if(file) {
            document.getElementById('prev-img').src = URL.createObjectURL(file);
            document.getElementById('input-img-url').value = ''; 
          }
        });

        window.copyLink = function(slug) {
          const url = window.location.protocol + '//' + window.location.host + '/' + slug;
          navigator.clipboard.writeText(url).then(() => {
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Link berhasil disalin!', showConfirmButton: false, timer: 2000 });
          }).catch(err => {
            console.error('Gagal menyalin:', err);
          });
        };
      `}} />
    </AdminShell>,
    { title: 'Manajemen Links' }
  )
}
