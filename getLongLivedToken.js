
const axios = require('axios');

// Function to exchange a short-lived token for a long-lived token
const getLongLivedToken = async (shortLivedToken) => {
  const appId = '2817967348512898';
  const appSecret = '66588a4ed0dc6f9d49f5997b948fcda2';
  
  try {
    const response = await axios.get('https://graph.facebook.com/v11.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      },
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting long-lived token:', error);
    return null;
  }
};

const shortLivedToken = 'EAAoC7SbLZBIIBO65nHXM9zDf5gr7dt2srji3lIcdje0PSQb28jxDHFrQ0hd5ZCLwRZAUTdFzfOqdAMCcqe263sttBqZBP6l4SMHF37DJ9FZANOAsMCaDB0Fm4qZBaUxTZCyxKzFJQfp4WmTwi1aAqiUkp8m24xLEu3o4LNZAZBTC1Saw7faKcmGMgEZBxxBfWbbIgCv7gKBPZBmdQRpH3xf';
getLongLivedToken(shortLivedToken)
  .then((longLivedToken) => {
    console.log('Long-lived token:', longLivedToken);
  });
