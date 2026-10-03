/** @type {import('next').NextConfig} */

// Sent with every response. Vercel already redirects HTTP to HTTPS and adds
// HSTS; declaring them here keeps that guarantee if the hosting changes.
//
// The HTTPS-only rules are limited to Vercel deployments (VERCEL=1). On a
// plain http://localhost server, Safari/WebKit applies
// upgrade-insecure-requests to localhost too, rewrites every script to
// https://localhost and the page never hydrates (this broke the e2e tests).
const isHttpsDeployment = process.env.VERCEL === '1';

const securityHeaders = [
  // Browsers must use HTTPS for two years, without even trying HTTP first.
  // includeSubDomains is left out until every subdomain (mail tracking,
  // etc.) is confirmed to serve HTTPS.
  ...(isHttpsDeployment
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }]
    : []),
  // Not a full script policy: only rules that cannot break the app. Upgrades
  // any http:// subresource to https:// and forbids framing the site.
  {
    key: 'Content-Security-Policy',
    value: [
      ...(isHttpsDeployment ? ['upgrade-insecure-requests'] : []),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // The microphone is used by the seller inventory (voice dictation).
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=(self), payment=(), usb=()',
  },
];

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/about',
        destination: '/concept',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
