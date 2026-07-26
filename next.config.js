/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['studyhub.mw', 'localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.studyhub.mw',
      },
    ],
  },
  i18n: {
    locales: ['en', 'ny'],
    defaultLocale: 'en',
    localeDetection: true,
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
};

module.exports = nextConfig;
