import withPWA from "@ducanh2912/next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/logo\.clearbit\.com/,
        handler: "CacheFirst",
        options: {
          cacheName: "logos-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/www\.google\.com\/s2\/favicons/,
        handler: "CacheFirst",
        options: {
          cacheName: "favicons-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-cache",
          expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/news/,
        handler: "NetworkFirst",
        options: {
          cacheName: "news-cache",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/admin\/.*/,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /\/_next\/image\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "www.google.com", pathname: "/s2/favicons" },
    ],
  },
};

export default withPWAConfig(nextConfig);
