import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "files.stripe.com" }],
  },
    reactStrictMode: false,
};

export default nextConfig;