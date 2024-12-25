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
  // Ensure environment variables are properly exposed
  env: {
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
  },
  // Disable edge runtime by default
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['supports-color'],
  },
}

module.exports = nextConfig;
