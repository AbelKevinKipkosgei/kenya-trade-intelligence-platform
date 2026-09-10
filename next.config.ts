import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Profile photos handed back by the four OAuth sign-in providers
    // (lib/auth.ts) — next/image refuses to load an external image whose
    // host isn't explicitly allowed here.
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" }, // Google
      { protocol: "https", hostname: "*.licdn.com" }, // LinkedIn
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub
      { protocol: "https", hostname: "*.fbsbx.com" }, // Facebook
    ],
  },
};

export default nextConfig;
