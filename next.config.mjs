/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'standalone', <--- REMOVED
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure proper module resolution for client components
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;