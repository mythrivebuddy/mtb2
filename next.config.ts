import { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.SUPABASE_HOST_URL ?? "", // Ensure a string
      },
    ],
  },
  experimental: {
    serverActions: {},
  },
  transpilePackages: ["@tinymce/tinymce-react"],
};

export default nextConfig;
