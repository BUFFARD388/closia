/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
    // L'externalisation ci-dessus empêche webpack de casser les require() du package,
    // mais Vercel doit aussi être informé explicitement d'inclure le dossier bin/ (les
    // archives binaires de Chromium) dans le bundle de la fonction serverless — sinon
    // il est absent au runtime ("input directory .../bin does not exist").
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/@sparticuz/chromium/bin/**'],
    },
  },
}

module.exports = nextConfig
