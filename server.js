import { serve } from '@hono/node-server'
import app from './index.js'

const port = process.env.PORT || 3000

console.log(`🚀 TBWC Events Server starting on port ${port}`)
console.log(`📅 Calendar: http://localhost:${port}`)
console.log(`🔗 API: http://localhost:${port}/api/events`)
console.log(`❤️  Health: http://localhost:${port}/health`)

serve({
    fetch: app.fetch,
    port,
})
