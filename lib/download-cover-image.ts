import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

const COVERS_DIR = path.join(process.cwd(), 'public', 'event-covers')
const JPEG_QUALITY = 80

export function ensureCoversDirectory(): void {
  if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true })
  }
}

function getImageExtension(url: string, contentType?: string): string {
  if (contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg'
    if (contentType.includes('png')) return '.png'
    if (contentType.includes('webp')) return '.webp'
  }
  const urlPath = url.split('?')[0]
  const match = urlPath.match(/\.(jpg|jpeg|png|webp|gif)$/i)
  if (match) {
    return match[1].toLowerCase() === 'jpeg'
      ? '.jpg'
      : `.${match[1].toLowerCase()}`
  }
  return '.jpg'
}

export interface CompressResult {
  path: string
  sizeBefore: number
  sizeAfter: number
  kept: 'original' | 'compressed'
}

export async function compressCoverImageFile(
  filePath: string
): Promise<CompressResult> {
  const sizeBefore = fs.statSync(filePath).size
  const ext = path.extname(filePath).toLowerCase()
  const basePath = path.join(
    path.dirname(filePath),
    path.basename(filePath, ext)
  )
  const jpgPath = `${basePath}.jpg`
  try {
    const inputBuffer = fs.readFileSync(filePath)
    const compressed = await sharp(inputBuffer)
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer()
    if (compressed.length < sizeBefore) {
      fs.writeFileSync(jpgPath, compressed)
      if (jpgPath !== filePath) fs.unlinkSync(filePath)
      return {
        path: jpgPath,
        sizeBefore,
        sizeAfter: compressed.length,
        kept: 'compressed',
      }
    }
    return {
      path: filePath,
      sizeBefore,
      sizeAfter: sizeBefore,
      kept: 'original',
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`Compress failed for ${filePath}:`, message)
    return {
      path: filePath,
      sizeBefore,
      sizeAfter: sizeBefore,
      kept: 'original',
    }
  }
}

export async function downloadCoverImage(
  eventId: string,
  imageUrl: string
): Promise<string | null> {
  if (!imageUrl) return null
  try {
    ensureCoversDirectory()
    const existingFiles = fs.readdirSync(COVERS_DIR)
    const existingFile = existingFiles.find((file) =>
      file.startsWith(`${eventId}.`)
    )
    if (existingFile) return `/event-covers/${existingFile}`

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
    const contentType = response.headers.get('content-type') || ''
    const extension = getImageExtension(imageUrl, contentType)
    const filename = `${eventId}${extension}`
    const filePath = path.join(COVERS_DIR, filename)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    fs.writeFileSync(filePath, buffer)
    const result = await compressCoverImageFile(filePath)
    const finalFilename = path.basename(result.path)
    console.log(`✅ Downloaded cover image for event ${eventId}`)
    return `/event-covers/${finalFilename}`
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error downloading cover image for event ${eventId}:`, message)
    return null
  }
}

export function getLocalCoverPathFromFs(eventId: string): string | null {
  if (!eventId) return null
  try {
    ensureCoversDirectory()
    const existingFiles = fs.readdirSync(COVERS_DIR)
    const existingFile = existingFiles.find((file) =>
      file.startsWith(`${eventId}.`)
    )
    if (existingFile) return `/event-covers/${existingFile}`
  } catch {
    // no local cover on disk
  }
  return null
}

/** @deprecated Prefer getLocalCoverPath from event-cover-path — second arg is ignored. */
export function getCoverImagePath(
  eventId: string,
  _originalUrl?: string
): string | null {
  return getLocalCoverPathFromFs(eventId)
}

export { COVERS_DIR, JPEG_QUALITY }
