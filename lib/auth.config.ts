import type { NextAuthConfig } from "next-auth";

// Edge-safe config — NO Prisma, NO bcrypt, NO Node.js-only modules.
// Used in middleware (Edge Runtime).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth) return true;
      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.nameTh = (user as { nameTh?: string }).nameTh;
        token.nameEn = (user as { nameEn?: string }).nameEn;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { nameTh?: string }).nameTh = token.nameTh as string;
        (session.user as { nameEn?: string }).nameEn = token.nameEn as string;
      }
      return session;
    },
  },
  providers: [],
};
