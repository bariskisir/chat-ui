import type { NextConfig } from 'next';

const nextConfiguration: NextConfig =
{
  reactStrictMode: true,
  serverExternalPackages: ['jsdom']
};

export default nextConfiguration;
