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
      'qahood.com',
      'api.qahood.com',
      'cdn.venngage.com',
      'miro.medium.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.venngage.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qahood.com',
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