/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] }
  },
  transpilePackages: ["@tedu-pass/db"]
};

export default nextConfig;
