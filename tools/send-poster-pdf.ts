/**
 * Generate the current month's TBWC events poster as a PDF and email it.
 *
 * Usage (local):  npx tsx tools/send-poster-pdf.ts
 * Usage (CI):     .github/workflows/send-poster-pdf.yml
 */
import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'
import {
  formatPosterMonthLabel,
  formatPosterMonthSlug,
  getCurrentPosterMonth,
} from '../lib/poster-month'
import { POSTER_QR_URL } from '../lib/poster-constants'

const DEFAULT_SITE_URL = 'https://events.townsvillebushwalkingclub.com'

function loadEnvFile(): void {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(process.cwd(), file)
    if (!fs.existsSync(envPath)) continue
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const [key, ...rest] = trimmed.split('=')
      if (key && rest.length) {
        process.env[key.trim()] = rest
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '')
      }
    }
    return
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    console.error(`${name} must be set`)
    process.exit(1)
  }
  return value
}

loadEnvFile()

const siteUrl = (process.env.POSTER_SITE_URL || DEFAULT_SITE_URL).replace(
  /\/$/,
  ''
)
const mailTo = requireEnv('POSTER_MAIL_TO')
const mailFrom = requireEnv('POSTER_MAIL_FROM')
const smtpHost = requireEnv('POSTER_MAIL_SMTP_HOST')
const smtpUser = requireEnv('POSTER_MAIL_SMTP_USER')
const smtpPassword = requireEnv('POSTER_MAIL_SMTP_PASSWORD')
const smtpPort = parseInt(process.env.POSTER_MAIL_SMTP_PORT || '587', 10)
const smtpSecure = process.env.POSTER_MAIL_SMTP_SECURE === 'true'

type BrowserPage = Awaited<
  ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>['newPage']>
>

async function waitForImages(page: BrowserPage): Promise<void> {
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve()
              return
            }
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          })
      )
    )
  })
}

async function generatePosterPdf(posterUrl: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 })
    await page.goto(posterUrl, { waitUntil: 'networkidle0', timeout: 90_000 })
    await page.waitForSelector('.poster-page', { timeout: 30_000 })
    await waitForImages(page)
    await page.emulateMediaType('print')

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

async function main(): Promise<void> {
  const { year, month } = getCurrentPosterMonth()
  const slug = formatPosterMonthSlug(year, month)
  const label = formatPosterMonthLabel(year, month)
  const posterUrl = `${siteUrl}/poster/${slug}`
  const filename = `tbwc-events-poster-${slug}.pdf`

  console.log(`Generating poster PDF for ${label}`)
  console.log(`Source: ${posterUrl}`)

  const pdf = await generatePosterPdf(posterUrl)
  console.log(`PDF size: ${(pdf.length / 1024).toFixed(1)} KB`)

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  })

  const recipients = mailTo.split(',').map((address) => address.trim())
  const cc = process.env.POSTER_MAIL_CC?.split(',').map((address) => address.trim())

  await transporter.sendMail({
    from: mailFrom,
    to: recipients,
    cc: cc?.length ? cc : undefined,
    subject: `TBWC Events Poster – ${label}`,
    text: [
      `Attached is the Townsville Bushwalking Club events poster for ${label}.`,
      '',
      `View online: ${posterUrl}`,
      `Calendar & RSVP: ${POSTER_QR_URL}`,
    ].join('\n'),
    attachments: [
      {
        filename,
        content: pdf,
        contentType: 'application/pdf',
      },
    ],
  })

  console.log(`Sent poster to ${recipients.join(', ')}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
