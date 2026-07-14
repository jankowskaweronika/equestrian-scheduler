import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@equestrian-scheduler/domain',
    '@equestrian-scheduler/calendar',
    '@equestrian-scheduler/ui-tokens',
  ],
};

export default nextConfig;
