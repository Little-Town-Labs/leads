import type { NextConfig } from 'next';
import { withBotId } from 'botid/next/config';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@slack/bolt'],
  // Force webpack for builds - Tailwind CSS v4's native bindings don't work with Turbopack yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack: (config: any) => {
    return config;
  },
};

export default withWorkflow(withBotId(nextConfig));
