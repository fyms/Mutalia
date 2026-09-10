import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  logging: { incomingRequests: { ignore: [/activation/, /reset-password/] }, serverFunctions: false },
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/documents/*": ["./src/lib/data/private/documents/**/*.pdf"],
    "/api/sources/harmonie/*": ["./data/sources/harmonie/2026/*.pdf"],
  },
};

export default nextConfig;
