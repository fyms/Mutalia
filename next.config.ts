import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/sources/harmonie/*": ["./data/sources/harmonie/2026/*.pdf"],
  },
};

export default nextConfig;
