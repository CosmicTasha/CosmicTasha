import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output — self-contained server with embedded Node.js
  // Deploy the .next/standalone folder to production (no node_modules needed)
  output: "standalone",
};

export default nextConfig;
