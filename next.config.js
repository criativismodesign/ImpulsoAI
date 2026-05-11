/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ukercfwzhbkhmwrahxii.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  distDir: '.next',
}

module.exports = nextConfig
