// Next.js automatically loads .env files from the project root
// No need for manual dotenv loading

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force IPv4 binding for development server
  serverExternalPackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false,
  compress: true,
  // Ensure proper static asset handling
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Configure asset prefix only for production, not development
  // Force assetPrefix to be empty string in development to prevent wrong domain loading
  assetPrefix: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_ASSET_PREFIX || '') : '',
  // Ensure base path is correct for development
  basePath: process.env.NODE_ENV === 'production' ? (process.env.NEXT_PUBLIC_BASE_PATH || '') : '',
  // Ensure proper static file serving
  trailingSlash: false,
  // Configure build output for better static asset handling
  output: 'standalone',
  // Fix multiple lockfiles warning
  outputFileTracingRoot: '/home/ubuntu/aw/dashboard-aw-main',
  // Add proper webpack configuration for static assets
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Ensure proper static asset handling on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Fix for __webpack_modules__[moduleId] is not a function error
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ensure proper module resolution
      '@': '.',
      // Fix Recharts / victory-vendor import issues
      'victory-vendor/d3-shape': 'd3-shape',
      'victory-vendor/d3-scale': 'd3-scale',
      // Stub deno-only testing modules used in yahoo-finance2
      '@std/testing/mock': false,
      '@std/testing/bdd': false,
      '@gadicc/fetch-mock-cache/runtimes/deno.ts': false,
      '@gadicc/fetch-mock-cache/stores/fs.ts': false,
    };

    // Add module resolution fallbacks
    config.resolve.modules = [
      ...config.resolve.modules,
      'node_modules',
      '.',
    ];

    // Handle potential webpack module loading issues
    if (dev) {
      config.optimization = {
        ...config.optimization,
        // Ensure proper module loading in development
        moduleIds: 'named',
        chunkIds: 'named',
      };
    }

    return config;
  },
  images: {
    domains: ['localhost', '35.173.33.118', 'dashboard.ackersweldon.com'],
    unoptimized: true
  },
  // Configure headers for nginx proxy and CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Add nginx proxy support
          {
            key: 'X-Accel-Buffering',
            value: 'no'
          }
        ],
      },
      // Add CORS headers for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://dashboard.ackersweldon.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
      // Add CORS headers for _next static resources
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://dashboard.ackersweldon.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
      // Add proper MIME type headers for static assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/chunks/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Add font file headers to fix font loading issues
      {
        source: '/_next/static/media/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'font/woff2',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // Environment variables are loaded from root .env file
  // No need to redefine them here - Next.js will automatically load them
}

export default nextConfig
