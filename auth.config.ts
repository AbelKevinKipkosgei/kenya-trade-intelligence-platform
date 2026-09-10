import type { NextAuthConfig } from "next-auth";

/**
 * Auth config for Edge Runtime compatibility (middleware).
 * This file doesn't import database or Node.js modules.
 */
export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes — /analyst is deliberately NOT here: every call it
      // makes is a real, metered LLM request, so it's gated behind sign-in
      // to tie usage to an account instead of anonymous traffic.
      const publicRoutes = [
        "/",
        "/explorer",
        "/opportunities",
        "/barriers",
        "/exporters",
        "/dashboards",
        "/news",
        "/getting-started",
      ];

      // Check if current path is public
      const isPublicRoute =
        publicRoutes.includes(pathname) ||
        pathname.startsWith("/auth/") ||
        pathname.startsWith("/api/auth/") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/logo") ||
        pathname.includes(".");

      if (isPublicRoute) {
        return true;
      }

      // Protected routes require authentication
      if (!isLoggedIn) {
        return false;
      }

      // Check role-based access
      const userRole = auth.user.role;

      // Admin routes
      if (pathname.startsWith("/admin")) {
        return userRole === "admin" || userRole === "officer";
      }

      return true;
    },
  },
  providers: [], // Providers are defined in lib/auth.ts
} satisfies NextAuthConfig;
