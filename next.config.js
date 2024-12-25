/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,  // Ensure the app directory is active
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "supports-color": false,
    };
    return config;
  },
}

module.exports = nextConfig;
