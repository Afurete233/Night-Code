import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function dshProductionBridge(): Plugin {
  let latestBrief: unknown = null

  return {
    name: 'dsh-production-bridge',
    configureServer(server) {
      server.middlewares.use('/api/dsh/production-brief', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ brief: latestBrief }))
          return
        }
        if (req.method !== 'POST') {
          next()
          return
        }

        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => {
          body += chunk
          if (body.length > 2_000_000) req.destroy()
        })
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body)
            if (!parsed || typeof parsed !== 'object') throw new Error('Brief must be an object')
            latestBrief = { ...(parsed as Record<string, unknown>), receivedAt: new Date().toISOString() }
            res.statusCode = 202
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ accepted: true }))
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ accepted: false, error: 'Invalid production brief JSON' }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), dshProductionBridge()],
  server: {
    watch: {
      ignored: ['**/*.tmp*', '**/.*.tmp*', '**/.git/**', '**/dist/**', '**/node_modules/**'],
    },
  },
})
