/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable SSR
  // output: 'export', // Comment this out for SSR
  distDir: './dist',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}
   
  export default nextConfig