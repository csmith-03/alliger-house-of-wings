import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "files.stripe.com" },
      // add any other hostnames if needed
    ],
  },
};