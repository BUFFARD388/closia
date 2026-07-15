/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  },
}

module.exports = nextConfig
