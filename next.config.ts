import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Static export
  distDir: 'out', // Output directory
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
