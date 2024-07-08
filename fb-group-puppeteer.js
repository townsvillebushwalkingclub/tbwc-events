require('dotenv').config()
const fs = require('fs')
const os = require('os')
const { chromium } = require('playwright-core')

const COOKIES_FILE = 'cookies.json'

function sleep(minMs, maxMs) {
    return new Promise((resolve) => {
        const ms = Math.floor(Math.random() * (maxMs - minMs + 1) + minMs)
        console.log(`Sleeping for ${ms} ms...`)
        setTimeout(resolve, ms)
    })
}

/**
 * Gets the default path to Chrome's executable for the current platform.
 */
const defaultChromeExecutablePath = () => {
    if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
        return process.env.PLAYWRIGHT_EXECUTABLE_PATH
    }

    switch (os.platform()) {
        case 'win32':
            return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

        case 'darwin':
            return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

        default: {
            const possiblePaths = [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
            ]
            for (const path of possiblePaths) {
                if (fs.existsSync(path)) {
                    return path
                }
            }
            throw new Error(
                'Chrome executable not found. Please install Chrome or set PLAYWRIGHT_EXECUTABLE_PATH.'
            )
        }
    }
}

async function scrollDown(page, distance = 800, scrolls = 5) {
    for (let i = 0; i < scrolls; i++) {
        await page.evaluate((distance) => {
            window.scrollBy(0, distance)
        }, distance)
        await sleep(400, 1500)
    }
}

async function loginAndSaveCookies(page) {
    const { FACEBOOK_USERNAME, FACEBOOK_PASSWORD } = process.env

    const loginUrl = 'https://facebook.com/login'
    const usernameSelector = '#email'
    const passwordSelector = '#pass'
    const loginButtonSelector = '#loginbutton'

    console.log('Logging in...')
    const responseLogin = await page.goto(loginUrl, {
        waitUntil: 'networkidle',
    })

    if (responseLogin.status() !== 200) {
        console.error(responseLogin.status(), `Failed to load page ${loginUrl}`)
        return false
    }

    await page.fill(usernameSelector, FACEBOOK_USERNAME)
    await sleep(250, 1000)
    await page.fill(passwordSelector, FACEBOOK_PASSWORD)
    await sleep(250, 800)
    await page.click(loginButtonSelector, { waitUntil: 'networkidle' })
    await sleep(100, 500)

    const cookies = await page.context().cookies()
    fs.writeFileSync(COOKIES_FILE, JSON.stringify(cookies, null, 2))
    console.log(`Cookies saved to ${COOKIES_FILE}`)
    return true
}

async function getCookies() {
    if (fs.existsSync(COOKIES_FILE)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE, 'utf-8'))
        console.log(`Cookies loaded from ${COOKIES_FILE}`)
        return cookies
    }
    return false
}

async function scrapeData() {
    let browser
    try {
        const args = ['--incognito', '--disable-notifications']
        if (process.env.NODE_ENV !== 'development') {
            // for server use
            args.push('--no-sandbox', '--disable-setuid-sandbox')
        }

        browser = await chromium.launch({
            headless: false, // 'new'
            args,
            executablePath: defaultChromeExecutablePath(),
        })

        const context = await browser.newContext({
            viewport: { width: 1280, height: 1024 },
        })

        const page = await context.newPage()

        const cookies = await getCookies()
        let cookiesLoaded = await page.context().addCookies(cookies)
        if (!cookiesLoaded) {
            const targetUrl =
                'https://www.facebook.com/groups/townsvillebushwalking'
            const responseGroup = await page.goto(targetUrl, {
                waitUntil: 'networkidle',
            })
            if (responseGroup.status() === 200) {
                console.log('Logged in with cookies.')
            } else {
                console.log('Cookies are invalid, logging in again...')
                cookiesLoaded = await loginAndSaveCookies(page)
            }
        } else {
            console.log('No cookies found, logging in...')
            cookiesLoaded = await loginAndSaveCookies(page)
        }

        if (!cookiesLoaded) {
            console.error('Failed to log in.')
            return
        }

        const targetUrl =
            'https://www.facebook.com/groups/townsvillebushwalking'
        const responseGroup = await page.goto(targetUrl, {
            waitUntil: 'networkidle',
        })
        if (responseGroup.status() !== 200) {
            console.error(
                responseGroup.status(),
                'Failed to load page https://www.facebook.com/groups/townsvillebushwalking'
            )
            return null
        }
        await sleep(100, 500)

        const allContent = []

        function parseJson(json) {
            const actor =
                json?.data?.node?.group_feed?.edges?.[0]?.node?.comet_sections
                    ?.content?.story?.comet_sections?.context_layout?.story
                    ?.comet_sections?.actor_photo?.story?.actors?.[0]
            const postText =
                json?.data?.node?.group_feed?.edges?.[0]?.node?.comet_sections
                    ?.content?.story?.comet_sections?.message_container?.story
                    ?.message?.text
            const postId =
                json?.data?.node?.group_feed?.edges?.[0]?.node?.comet_sections
                    ?.feedback?.story?.post_id

            console.log(`postAuthor: ${actor?.name}`)

            return {
                id: postId,
                postId,
                postText: postText || '',
                postAuthor: actor?.name,
                postAuthorId: actor?.id,
                postAuthorUrl: actor?.url,
                firstName: actor?.name?.split(' ')?.[0],
                lastName: actor?.name?.split(' ')?.[1],
            }
        }

        await page.route('**/graphql', (route) => {
            if (
                route
                    .request()
                    .postData()
                    ?.includes('GroupsCometFeedRegularStoriesPaginationQuery')
            ) {
                console.log(
                    'route.request().postData()',
                    route.request().postData()
                )
                const postData = parseJson(
                    JSON.parse(route.request().postData())
                )
                allContent.push(postData)
            }
            route.continue()
        })

        console.log('Scraping data...')
        await scrollDown(page)

        console.log('data', allContent)
        fs.writeFileSync('data.json', JSON.stringify(allContent, null, 2))
    } catch (error) {
        console.error('Error scraping data:', error)
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

// Call the scrapeData function if this file is executed directly
if (require.main === module) {
    scrapeData().catch(console.error)
}
