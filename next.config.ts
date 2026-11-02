import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Pictures are made once by scripts/sync-images.mjs (a large and a small copy) and served as static files from
    // public/media. src/lib/image-loader.ts picks the copy; no image service runs per visit and nothing is hotlinked.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    // Fewer, well-spaced sizes: shorter srcset lists in every page's HTML.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  experimental: {
    // One cached stylesheet file. Inlining it (Dubai South's choice) copies the CSS three times into every page of
    // this much larger site; measured on mobile Lighthouse, the separate file scores 1 to 4 points higher.
    inlineCss: false,
    // Only for timing a build the way Vercel's small machine runs it: BUILD_WORKERS=1 npm run build
    ...(process.env.BUILD_WORKERS ? { cpus: Number(process.env.BUILD_WORKERS) } : {}),
  },
  // Pages can be regenerated on the server later (ISR): keep the data files in the deployment.
  outputFileTracingIncludes: {
    '/**': ['./data/*.json', './content-snapshot.json'],
    // Share images are drawn on request: their fonts and logo travel with the function.
    '/projects/[slug]/opengraph-image': ['./src/og/*.ttf', './public/brand/prelaunchuae-stacked-reversed.svg'],
  },
  // The bare domain prelaunchuae.com is the main address; www sends visitors and search engines to it with a permanent 301.
  // (Vercel's own domain redirect runs first when set; this is the same rule in the app.)
  async redirects() {
    return [
      { source: '/:path*', has: [{ type: 'host', value: 'www.prelaunchuae.com' }], destination: 'https://prelaunchuae.com/:path*', statusCode: 301 },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
