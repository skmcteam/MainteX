import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { prisma } = await import("./prisma");
        const bcrypt = await import("bcryptjs");

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { role: true },
        });

        if (!user || !user.isActive) return null;

        const passwordValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nameEn,
          nameTh: user.nameTh,
          nameEn: user.nameEn,
          role: user.role.code,
          image: user.avatar,
        };
      },
    }),
  ],
});

// ─── Auth helpers (Node.js runtime only) ──────────────────────

type AuthSession = {
  user: { id: string; email?: string | null; name?: string | null; image?: string | null; role?: string; nameTh?: string; nameEn?: string };
  expires: string;
};

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session as unknown as AuthSession;
}

export async function requireRole(roles: string[]): Promise<AuthSession> {
  const session = await requireAuth();
  if (!session.user.role || !roles.includes(session.user.role)) throw new Error("Forbidden");
  return session;
}

export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  const [resource, action] = permission.split(".");
  const { prisma } = await import("./prisma");
  const perm = await prisma.rolePermission.findFirst({
    where: {
      permission: { resource, action },
      role: { users: { some: { id: userId } } },
    },
  });
  return !!perm;
}

export async function writeAuditLog({
  userId,
  entity,
  entityId,
  action,
  before,
  after,
}: {
  userId?: string;
  entity: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  const { prisma } = await import("./prisma");
  await prisma.auditLog.create({
    data: {
      userId,
      entity,
      entityId,
      action,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(before !== undefined ? { before: before as any } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(after !== undefined ? { after: after as any } : {}),
    },
  });
}
