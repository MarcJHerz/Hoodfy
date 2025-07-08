/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  output: 'standalone',
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      '192.168.1.87',
      'cdn.venngage.com',
      'miro.medium.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.venngage.com',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.87',
        port: '5000',
      },
      {
        protocol: 'https',
        hostname: 'miro.medium.com',
      }
    ],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig 