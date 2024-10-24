/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
