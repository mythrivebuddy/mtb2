/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.SUPABASE_HOST_URL,
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
