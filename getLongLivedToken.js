const axios = require('axios')

// Function to exchange a short-lived token for a long-lived token
const getLongLivedToken = async (shortLivedToken) => {
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET

    try {
        const response = await axios.get(
            'https://graph.facebook.com/v11.0/oauth/access_token',
            {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken,
                },
            }
        )

        return response.data.access_token
    } catch (error) {
        console.error('Error getting long-lived token:', error)
        return null
    }
}

const shortLivedToken = process.env.FACEBOOK_SHORT_LIVED_TOKEN

getLongLivedToken(shortLivedToken).then((longLivedToken) => {
    console.log('Long-lived token:', longLivedToken)
})
