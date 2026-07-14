import {} from 'hono'

declare module 'hono' {
  interface Env {
    Bindings: {
      DB: D1Database
      ANALYTICS: AnalyticsEngineDataset
      JWT_SECRET: string
    }
  }
}
