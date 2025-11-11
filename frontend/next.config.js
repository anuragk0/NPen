/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://npen.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

