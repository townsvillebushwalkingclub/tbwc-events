
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

const shortLivedToken = 'EAAoC7SbLZBIIBAJlwFK7NhJmmUeLxNm2UQSQb5FWIxBPBwyGdm0ZAlZBKacZA4o651KnqZAxenFwilyAoth86EGPd7WGDw8B5CUCI7WHGf2UrZAR43vZC9dMHBnBm1cXBU7FJDoxEAu8oZAXBzAxZBZBWAFoZABodcZBcvCGb9nTpKFP3dZB2xcMKszhZAAuduI3TmtRPZAZAcUECn69TtyJZCbF4K8LZA';
getLongLivedToken(shortLivedToken)
  .then((longLivedToken) => {
    console.log('Long-lived token:', longLivedToken);
  });
