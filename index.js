
const axios = require('axios');

async function getPageEvents(accessToken, pageId) {
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

async function getGroupPosts(accessToken, groupId) {
    // Fetch page events
    try {
        const response = await axios.get(`https://graph.facebook.com/${groupId}/feed`, {
            params: {
                access_token: accessToken
            }
        });
        console.log('Group feed:', response.data);
    } catch (error) {
        console.error('Error fetching group feed:', error);
    }
}

async function getGroupEvents(accessToken, groupId) {
    // Fetch page events
    try {
        const response = await axios.get(`https://graph.facebook.com/${groupId}/events`, {
            params: {
                access_token: accessToken
            }
        });
        console.log('Group events:', response.data);
    } catch (error) {
        console.error('Error fetching group events:', error);
    }
}


const accessToken = 'EAAoC7SbLZBIIBADIjBhshvuuUO4pA0lr9vyxCwU8nWSusIVeIWwgDGv1qVVdZAiO9K6PJ19iZCsNvxMQTcGTf23AuinKEdNdmKuRFWr7rctk3gTLBX8UXLRAogXdZCxTwOtjyEyN0p8HgRVMLRPoZBJxNf5guEthvtj10VRptwyzejw6dywjZAeaG8dpcjZCuIZD';
const pageId = '192589954994960';
const groupId = '1044042929275742';

getPageEvents(accessToken, pageId);
getGroupPosts(accessToken, groupId);
getGroupEvents(accessToken, groupId);