const fs = require('fs')
const os = require('os')
const path = require('path')
const { chromium } = require('playwright-core')

const COOKIES_FILE_PATH = path.join(__dirname, 'cookies.json')

function sleep(minMs, maxMs) {
    return new Promise((resolve) => {
        const ms = Math.floor(Math.random() * (maxMs - minMs + 1) + minMs)
        console.log(`Sleeping for ${ms} ms...`)
        setTimeout(resolve, ms)
    })
}

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

async function gotoPage(page, url) {
    const response = await page.goto(url, {
        waitUntil: 'networkidle',
    })
    if (response.status() !== 200) {
        console.error(response.status(), `Failed to load page ${url}`)
        return false
    }
    return true
}

async function loginFormPresent(page) {
    const selectors = [
        'form[data-testid="royal_login_form"]',
        'form[action*="/login/"]',
        '#login_form',
        'form[name="login"]',
    ]
    for (let selector of selectors) {
        const form = await page.$(selector)
        if (form) {
            console.log(`Found login form using selector: ${selector}`)
            return true
        }
    }
    return false
}

async function loginAndSaveCookies(page) {
    require('dotenv').config()
    const { FACEBOOK_USERNAME, FACEBOOK_PASSWORD } = process.env

    const loginUrl = 'https://facebook.com/login'
    const usernameSelector = '#email'
    const passwordSelector = '#pass'
    const loginButtonSelector = '#loginbutton'

    console.log('Logging in...')
    if (!(await gotoPage(page, loginUrl))) return false

    await page.fill(usernameSelector, FACEBOOK_USERNAME)
    await sleep(250, 1000)
    await page.fill(passwordSelector, FACEBOOK_PASSWORD)
    await sleep(250, 800)
    await page.click(loginButtonSelector, { waitUntil: 'networkidle' })
    await sleep(100, 500)

    const cookies = await page.context().cookies()
    fs.writeFileSync(COOKIES_FILE_PATH, JSON.stringify(cookies, null, 2))

    console.log(`Cookies saved to ${COOKIES_FILE_PATH}`)

    return true
}

async function getCookies() {
    if (fs.existsSync(COOKIES_FILE_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_FILE_PATH, 'utf-8'))
        console.log(`Cookies loaded from ${COOKIES_FILE_PATH}`)
        return cookies
    }
    return []
}

async function loadFacebook(page) {
    let cookies = await getCookies()
    await page.context().addCookies(cookies)

    if (cookies && cookies.length > 0) {
        const targetUrl = 'https://www.facebook.com/'
        if (!(await gotoPage(page, targetUrl))) return false

        const loginForm = await loginFormPresent(page)
        if (loginForm) {
            console.log('Cookies are invalid, logging in again...')
            cookies = await loginAndSaveCookies(page)
        } else {
            console.log('Logged in with cookies.')
        }
    } else {
        console.log('No cookies found, logging in...')
        cookies = await loginAndSaveCookies(page)
    }

    if (!cookies || cookies.length === 0) {
        console.error('Failed to log in.')
        return null
    }
    return true
}

function parseJson(json) {
    const actor =
        json?.data?.node?.group_feed?.edges?.[0]?.node?.comet_sections?.content
            ?.story?.comet_sections?.context_layout?.story?.comet_sections
            ?.actor_photo?.story?.actors?.[0]
    const postText =
        json?.data?.node?.group_feed?.edges?.[0]?.node?.comet_sections?.content
            ?.story?.comet_sections?.message_container?.story?.message?.text
    const postId =
        json?.data?.node?.group_feed?.edges?.[0]?.node?.comet_sections?.feedback
            ?.story?.post_id

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

async function scrapeData() {
    let browser
    try {
        const args = ['--incognito', '--disable-notifications']
        if (process.env.NODE_ENV !== 'development') {
            args.push('--no-sandbox', '--disable-setuid-sandbox')
        }

        browser = await chromium.launch({
            headless: false,
            args,
            executablePath: defaultChromeExecutablePath(),
        })

        const context = await browser.newContext({
            viewport: { width: 1280, height: 1024 },
        })

        const page = await context.newPage()

        if (!(await loadFacebook(page))) return

        const allContent = []

        await page.route('**/*', async (route) => {
            const request = route.request()
            if (request.url().includes('graphql')) {
                console.log('Intercepted request:', request.url())
                if (
                    request.postData() &&
                    request
                        .postData()
                        .includes(
                            'GroupsCometFeedRegularStoriesPaginationQuery'
                        )
                ) {
                    console.log(
                        'Intercepted GraphQL request:',
                        request.postData()
                    )
                    route.continue()
                    try {
                        const response = await request.response()
                        if (response) {
                            const responseBody = await response.text()
                            // Log the response body for debugging
                            console.log(
                                'Response Body:',
                                responseBody.slice(0, 500)
                            ) // Log first 500 chars
                            if (responseBody.startsWith('{')) {
                                try {
                                    const responseJson =
                                        JSON.parse(responseBody)
                                    const postData = parseJson(responseJson)
                                    allContent.push(postData)
                                } catch (jsonError) {
                                    console.error(
                                        'Error parsing JSON:',
                                        jsonError
                                    )
                                    console.error(
                                        'Invalid JSON:',
                                        responseBody.slice(0, 500)
                                    ) // Log first 500 chars
                                }
                            } else {
                                console.log(
                                    'Response is not valid JSON:',
                                    responseBody.slice(0, 500)
                                )
                            }
                        } else {
                            console.log(
                                'No response received for request:',
                                request.url()
                            )
                        }
                    } catch (error) {
                        console.error('Error processing response:', error)
                    }
                } else {
                    route.continue()
                }
            } else {
                route.continue()
            }
        })

        const targetUrl =
            'https://www.facebook.com/groups/townsvillebushwalking'
        if (!(await gotoPage(page, targetUrl))) return false
        await sleep(100, 500)

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

if (require.main === module) {
    scrapeData().catch(console.error)
}
