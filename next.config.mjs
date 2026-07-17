/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Generate build ID using timestamp for Railway builds
  async generateBuildId() {
    // Generate a build ID based on timestamp
    // This ensures Railway builds get a unique ID
    return `build-${Date.now()}`;
  },
  // Ensure proper module resolution for client components
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
