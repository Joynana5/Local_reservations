import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    ...Object.values(networkInterfaces())
      .flatMap((interfaces) => interfaces ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => address.address),
  ],
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
