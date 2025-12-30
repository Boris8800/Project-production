/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Disabled for host deployment (systemd)
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
};

module.exports = nextConfig;
