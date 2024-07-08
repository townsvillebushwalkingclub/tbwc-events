async function getPageEvents(accessToken, pageId) {
    // Fetch page events
    try {
        const response = await fetch.get(
            `https://graph.facebook.com/${pageId}/events`,
            {
                params: {
                    access_token: accessToken,
                },
            }
        )
        console.log('Events:', response.data)
    } catch (error) {
        console.error('Error fetching events:', error)
    }
}

async function getGroupPosts(accessToken, groupId) {
    // Fetch page events
    try {
        const response = await fetch.get(
            `https://graph.facebook.com/${groupId}/feed`,
            {
                params: {
                    access_token: accessToken,
                },
            }
        )
        console.log('Group feed:', response.data)
    } catch (error) {
        console.error('Error fetching group feed:', error)
    }
}

async function getGroupEvents(accessToken, groupId) {
    // Fetch page events
    try {
        const response = await fetch.get(
            `https://graph.facebook.com/${groupId}/events`,
            {
                params: {
                    access_token: accessToken,
                },
            }
        )
        console.log('Group events:', response.data)
    } catch (error) {
        console.error('Error fetching group events:', error)
    }
}

const accessToken = process.env.FACEBOOK_ACCESS_TOKEN
const pageId = process.env.FACEBOOK_PAGE_ID
const groupId = process.env.FACEBOOK_GROUP_ID

getPageEvents(accessToken, pageId)
getGroupPosts(accessToken, groupId)
getGroupEvents(accessToken, groupId)
