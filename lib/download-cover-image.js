const fs = require('fs')
const path = require('path')

// Directory to store event cover images
const COVERS_DIR = path.join(process.cwd(), 'public', 'event-covers')

/**
 * Ensure the covers directory exists
 */
function ensureCoversDirectory() {
    if (!fs.existsSync(COVERS_DIR)) {
        fs.mkdirSync(COVERS_DIR, { recursive: true })
    }
}

/**
 * Get file extension from URL or content type
 * @param {string} url - Image URL
 * @param {string} contentType - Content-Type header (optional)
 * @returns {string} File extension (default: .jpg)
 */
function getImageExtension(url, contentType) {
    // Try to get extension from content type
    if (contentType) {
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
            return '.jpg'
        }
        if (contentType.includes('png')) {
            return '.png'
        }
        if (contentType.includes('webp')) {
            return '.webp'
        }
    }

    // Try to get extension from URL
    const urlPath = url.split('?')[0] // Remove query params
    const match = urlPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)
    if (match) {
        return match[1].toLowerCase() === 'jpeg'
            ? '.jpg'
            : `.${match[1].toLowerCase()}`
    }

    // Default to jpg
    return '.jpg'
}

/**
 * Download and save event cover image
 * @param {string} eventId - Event ID
 * @param {string} imageUrl - Facebook CDN URL
 * @returns {Promise<string|null>} Local path relative to public folder, or null if failed
 */
async function downloadCoverImage(eventId, imageUrl) {
    if (!imageUrl) {
        return null
    }

    try {
        ensureCoversDirectory()

        // Check if image already exists
        const existingFiles = fs.readdirSync(COVERS_DIR)
        const existingFile = existingFiles.find((file) =>
            file.startsWith(`${eventId}.`)
        )

        if (existingFile) {
            // Image already downloaded
            return `/event-covers/${existingFile}`
        }

        // Download the image
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        })

        if (!response.ok) {
            console.warn(
                `Failed to download cover image for event ${eventId}: ${response.statusText}`
            )
            return null
        }

        // Get content type to determine file extension
        const contentType = response.headers.get('content-type') || ''
        const extension = getImageExtension(imageUrl, contentType)
        const filename = `${eventId}${extension}`
        const filePath = path.join(COVERS_DIR, filename)

        // Get image buffer
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Save to file
        fs.writeFileSync(filePath, buffer)

        console.log(`✅ Downloaded cover image for event ${eventId}`)

        // Return path relative to public folder
        return `/event-covers/${filename}`
    } catch (error) {
        console.error(
            `Error downloading cover image for event ${eventId}:`,
            error.message
        )
        return null
    }
}

/**
 * Get local cover image path if it exists, otherwise return original URL
 * @param {string} eventId - Event ID
 * @param {string} originalUrl - Original Facebook CDN URL
 * @returns {string} Local path if exists, otherwise original URL
 */
function getCoverImagePath(eventId, originalUrl) {
    if (!originalUrl) {
        return null
    }

    try {
        ensureCoversDirectory()
        const existingFiles = fs.readdirSync(COVERS_DIR)
        const existingFile = existingFiles.find((file) =>
            file.startsWith(`${eventId}.`)
        )

        if (existingFile) {
            return `/event-covers/${existingFile}`
        }
    } catch (error) {
        // If directory doesn't exist or other error, fall back to original URL
    }

    return originalUrl
}

module.exports = {
    downloadCoverImage,
    getCoverImagePath,
}
