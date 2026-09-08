import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["192.168.31.216", "192.168.31.216:3000", "localhost:3000"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
