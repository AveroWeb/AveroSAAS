import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no database access here. Used by middleware.
// The full config (with the Credentials provider) lives in `src/auth.ts`.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;

      if (pathname === "/login") {
        if (isLoggedIn) {
          const target = role === "CLIENT" ? "/portal" : "/dashboard";
          return Response.redirect(new URL(target, request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) return false;

      if (pathname.startsWith("/portal")) {
        return role === "CLIENT";
      }

      if (role === "CLIENT") {
        return Response.redirect(new URL("/portal", request.nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
