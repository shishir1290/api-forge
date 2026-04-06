import type { NextConfig } from "next";

const isElectron = process.env.BUILD_TARGET === 'electron';

const nextConfig: NextConfig = {
  // Static export for Electron desktop app packaging
  ...(isElectron ? { output: 'export', trailingSlash: true } : {}),
  async headers() {
    if (isElectron) return [];
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
