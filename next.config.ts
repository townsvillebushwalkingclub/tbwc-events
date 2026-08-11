import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '</llms.txt>; rel="describedby"',
          },
        ],
      },
    ]
  },
}

export default nextConfig
