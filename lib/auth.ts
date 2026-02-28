import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // Company users pass their company slug; superadmins leave this blank
        companySlug: { label: "Company Slug", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let user: Awaited<ReturnType<typeof prisma.user.findFirst>> & {
          company?: { slug: string } | null;
        } | null = null;

        if (credentials.companySlug) {
          // ── Company-scoped login ──────────────────────────────────────────
          const company = await prisma.company.findUnique({
            where: { slug: credentials.companySlug },
            select: { id: true, slug: true, subscriptionStatus: true },
          });

          if (!company || company.subscriptionStatus === "inactive") return null;

          user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
              companyId: company.id,
              isActive: true,
            },
            include: { company: { select: { slug: true } } },
          });
        } else {
          // ── Superadmin login (no company slug) ────────────────────────────
          user = await prisma.user.findFirst({
            where: {
              email: credentials.email,
              role: "superadmin",
              companyId: null,
              isActive: true,
            },
          });
        }

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          firstName: user.firstName,
          lastName: user.lastName,
          companySlug:
            "company" in user && user.company ? user.company.slug : null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.companySlug = user.companySlug;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.companyId = token.companyId;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.companySlug = token.companySlug;
      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
