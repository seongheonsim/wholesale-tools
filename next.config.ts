import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'thumb.domeggook.com',
      },
      {
        protocol: 'http',
        hostname: 'thumb.domeggook.com',
      },
    ],
  },
};

export default nextConfig;
