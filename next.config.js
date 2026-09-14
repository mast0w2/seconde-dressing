/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
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
