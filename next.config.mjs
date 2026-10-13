/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/ads",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
