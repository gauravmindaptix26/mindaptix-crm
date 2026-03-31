import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // OneDrive-backed workspaces can trigger Turbopack cache write/compaction collisions.
    // Disabling the dev filesystem cache avoids the persistent `.next` compaction errors.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
