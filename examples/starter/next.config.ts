import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Enforce React 19 concurrent features
  reactStrictMode: true,
  
  // Skip ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Generate source maps in production for debugging
  productionBrowserSourceMaps: true,

  // Note: swcMinify is now the default in Next.js 15
  // Note: typedRoutes is not yet available in stable Next.js 15

  // ✅ Optimize imports for better tree-shaking
  experimental: {
    optimizePackageImports: [
      "@tanstack/react-query",
      "zustand",
      "edgepilot"
    ],
  },

  // ✅ Remote patterns for external images (future-proof)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
      {
        protocol: "https",
        hostname: "**.githubusercontent.com",
      },
    ],
  },

  // ✅ Environment variable validation (informational)
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "dev",
  },

  // ✅ Optional: CORS headers for API routes
  async headers() {
    return [
      {
        source: "/api/health",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
      // Uncomment if you need CORS for API routes
      // {
      //   source: "/api/:path*",
      //   headers: [
      //     { key: "Access-Control-Allow-Origin", value: "*" },
      //     { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
      //     { key: "Access-Control-Allow-Headers", value: "X-Requested-With, Content-Type, Authorization" },
      //   ],
      // },
    ];
  },

  // ✅ Optional: Redirects for common patterns
  // async redirects() {
  //   return [
  //     {
  //       source: "/docs",
  //       destination: "https://github.com/edgepilot/edgepilot/wiki",
  //       permanent: false,
  //     },
  //   ];
  // },
};

export default nextConfig;