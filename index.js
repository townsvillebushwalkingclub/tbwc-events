import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { getFacebookEvents } from './lib/facebook-api.js'
import eventCache from './lib/cache.js'

dotenv.config()

// print .env FACEBOOK_ACCESS_TOKEN
//console.log('FACEBOOK_ACCESS_TOKEN', process.env.FACEBOOK_ACCESS_TOKEN)

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const app = new Hono()

// Enable CORS
app.use('*', cors())

// API Routes
app.get('/api/events', async (c) => {
    try {
        const events = await getFacebookEvents()
        return c.json({
            success: true,
            data: events,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Error fetching events:', error)
        return c.json(
            {
                success: false,
                error: error.message,
            },
            500
        )
    }
})

app.get('/api/events/:year/:month', async (c) => {
    try {
        const year = parseInt(c.req.param('year'))
        const month = parseInt(c.req.param('month'))

        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return c.json(
                {
                    success: false,
                    error: 'Invalid year or month',
                },
                400
            )
        }

        const events = await getFacebookEvents()
        const filteredEvents = events.filter((event) => {
            const eventDate = new Date(event.start_time)
            return (
                eventDate.getFullYear() === year &&
                eventDate.getMonth() === month - 1
            )
        })

        return c.json({
            success: true,
            data: filteredEvents,
            year,
            month,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Error fetching events:', error)
        return c.json(
            {
                success: false,
                error: error.message,
            },
            500
        )
    }
})

// Serve the main calendar page
app.get('/', async (c) => {
    try {
        const htmlPath = join(__dirname, 'public', 'index.html')
        const html = readFileSync(htmlPath, 'utf-8')
        return c.html(html)
    } catch (error) {
        console.error('Error serving index.html:', error)
        return c.text('Calendar not found', 404)
    }
})

// Health check endpoint
app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
    })
})

// Cache management endpoints
app.get('/api/cache/stats', (c) => {
    const stats = eventCache.getStats()
    return c.json({
        success: true,
        cache: stats,
        timestamp: new Date().toISOString(),
    })
})

app.post('/api/cache/clear', (c) => {
    eventCache.clear()
    return c.json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString(),
    })
})

const port = process.env.PORT || 3000

console.log(`🚀 TBWC Events Server starting on port ${port}`)
console.log(`📅 Calendar: http://localhost:${port}`)
console.log(`🔗 API: http://localhost:${port}/api/events`)

export default {
    port,
    fetch: app.fetch,
}
