/** @type {import('next').NextConfig} */
console.log('[NextConfig] Loaded from .conductor/yokohama');

const nextConfig = {
  // Generate build ID using timestamp for Railway builds
  async generateBuildId() {
    // Generate a build ID based on timestamp
    // This ensures Railway builds get a unique ID
    return `build-${Date.now()}`;
  },
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

