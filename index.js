
const axios = require('axios');

async function getPageEvents() {
    const accessToken = 'EAAoC7SbLZBIIBADIjBhshvuuUO4pA0lr9vyxCwU8nWSusIVeIWwgDGv1qVVdZAiO9K6PJ19iZCsNvxMQTcGTf23AuinKEdNdmKuRFWr7rctk3gTLBX8UXLRAogXdZCxTwOtjyEyN0p8HgRVMLRPoZBJxNf5guEthvtj10VRptwyzejw6dywjZAeaG8dpcjZCuIZD';
    const pageId = '192589954994960';

    // Fetch page events
    try {
        const response = await axios.get(`https://graph.facebook.com/${pageId}/events`, {
            params: {
                access_token: accessToken
            }
        });
        console.log('Events:', response.data);
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

getPageEvents();