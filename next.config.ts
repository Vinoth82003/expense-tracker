import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*'],
  serverExternalPackages: ["@prisma/client", "prisma"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), /\.prisma\/client\/wasm/];
    }
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Content-Security-Policy",
            value: (() => {
              const isDev = process.env.NODE_ENV === "development";
              // SECURITY FIX: VULN-021 — Use 'unsafe-inline' (required by Next.js hydration); nonce-based CSP is a larger infrastructure change
              const scriptSrc = "script-src 'self' 'unsafe-inline' " + (isDev ? "'unsafe-eval' " : "") + "https://accounts.google.com https://www.googletagmanager.com";
              
              const connectSrc = isDev
                ? "connect-src 'self' ws: wss: https://generativelanguage.googleapis.com https://api.openai.com https://www.google-analytics.com https://www.googletagmanager.com"
                : "connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://www.google-analytics.com https://www.googletagmanager.com";

              return [
                "default-src 'self'",
                scriptSrc,
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: blob: https://lh3.googleusercontent.com https://res.cloudinary.com https://www.googletagmanager.com https://www.google-analytics.com",
                connectSrc,
                "frame-src https://accounts.google.com",
                "frame-ancestors 'self'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "upgrade-insecure-requests",
              ].join("; ");
            })(),
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
      {
        // Cache static marketing pages
        source: "/:path(features|how-it-works|faq|download|contact|privacy|terms|docs|compare/*|tools/*)?",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/docs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
