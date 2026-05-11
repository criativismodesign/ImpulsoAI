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
  devServer: {
    host: '0.0.0.0',
    port: 3000,
  },
}

module.exports = nextConfig
