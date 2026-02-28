/**
 * GET /api/users  — list users in this company (admin/manager)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, MANAGERS_UP } from "@/lib/api";

export const GET = withAuth(
  async (_req: NextRequest, session) => {
    const users = await prisma.user.findMany({
      where: {
        companyId: session.role === "superadmin" ? undefined : session.companyId!,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        createdAt: true,
        company: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(users);
  },
  { roles: MANAGERS_UP }
);
