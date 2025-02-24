/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-supabase-url.supabase.co'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig