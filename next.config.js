/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "supports-color": false,
    };
    return config;
  },
}

module.exports = nextConfig; 