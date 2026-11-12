import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Produces .next/standalone — a self-contained server used by the
  // Windows portable bundle (see scripts/package-windows.ps1).
  output: "standalone",
};

export default nextConfig;
