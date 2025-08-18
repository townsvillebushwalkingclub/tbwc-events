class EventCache {
    constructor() {
        this.cache = new Map()
        this.cacheDuration = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }

    set(key, data) {
        const cacheEntry = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.cacheDuration,
        }
        this.cache.set(key, cacheEntry)
        console.log(`💾 Cached events with key: ${key}`)
    }

    get(key) {
        const entry = this.cache.get(key)

        if (!entry) {
            console.log(`❌ Cache miss for key: ${key}`)
            return null
        }

        if (Date.now() > entry.expiresAt) {
            console.log(`⏰ Cache expired for key: ${key}`)
            this.cache.delete(key)
            return null
        }

        const ageInMinutes = Math.floor(
            (Date.now() - entry.timestamp) / (1000 * 60)
        )
        console.log(
            `✅ Cache hit for key: ${key} (age: ${ageInMinutes} minutes)`
        )
        return entry.data
    }

    clear() {
        this.cache.clear()
        console.log('🗑️ Cache cleared')
    }

    getStats() {
        const now = Date.now()
        let validEntries = 0
        let expiredEntries = 0

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                expiredEntries++
            } else {
                validEntries++
            }
        }

        return {
            total: this.cache.size,
            valid: validEntries,
            expired: expiredEntries,
        }
    }

    cleanup() {
        const now = Date.now()
        let cleaned = 0

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key)
                cleaned++
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired cache entries`)
        }
    }
}

// Create a singleton instance
const eventCache = new EventCache()

// Clean up expired entries every hour
setInterval(() => {
    eventCache.cleanup()
}, 60 * 60 * 1000)

export default eventCache
