/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', // Disabled for host deployment (systemd)
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
