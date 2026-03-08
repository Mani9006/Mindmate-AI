/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Enable static export for deployment
  output: 'export',
  distDir: 'dist',
}

module.exports = nextConfig
