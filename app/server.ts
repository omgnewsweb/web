import { createApp } from 'honox/server'

const app = createApp()

app.use('/*', async (c, next) => {
  const path = c.req.path
  
  if (path.startsWith('/admin') || path === '/' || path.startsWith('/static')) {
    return await next()
  }

  const lookupSlug = path.substring(1)
  
  const link = await c.env.DB.prepare('SELECT * FROM links WHERE slug = ?').bind(lookupSlug).first<{
    target_url: string, og_title: string, og_description: string, og_image_url: string, og_site_name: string, og_url: string
  }>()

  if (!link) return c.text('Link tidak ditemukan', 404)

  const userAgent = c.req.header('user-agent') || ''
  const isBot = /facebookexternalhit|WhatsApp|Twitterbot|Pinterest|LinkedInBot|TelegramBot/i.test(userAgent)

  if (isBot) {
    // Tag URL sekarang sepenuhnya opsional dan tidak dijadikan requirement ke URL asli
    return c.html(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <meta property="og:type" content="article" />
        <meta property="og:description" content="${link.og_description}" />
        <meta property="og:image" content="${link.og_image_url}" />
      </head>
      <body>Mengarahkan...</body>
      </html>
    `)
  }

  if (c.env.ANALYTICS) {
    try {
      c.env.ANALYTICS.writeDataPoint({
        blobs: [lookupSlug, c.req.header('cf-ipcountry') || 'Unknown', userAgent],
        doubles: [1]
      })
    } catch (e) {}
  }

  return c.redirect(link.target_url, 302)
})

export default app
