/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        FACEBOOK_ACCESS_TOKEN: process.env.FACEBOOK_ACCESS_TOKEN,
    },
}

module.exports = nextConfig
