/**
 * GET    /api/users/:id  — get user (admin/manager or self)
 * PATCH  /api/users/:id  — update user (admin, or self for own profile)
 * DELETE /api/users/:id  — deactivate user (admin only)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF, MANAGERS_UP } from "@/lib/api";

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(["admin", "manager", "staff"]).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
});

async function getUser(id: string, companyId: string | null) {
  return prisma.user.findFirst({
    where: {
      id,
      ...(companyId !== null && { companyId }),
    },
  });
}

export const GET = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const isSelf = session.id === params.id;
    if (!isSelf && !["admin", "manager", "superadmin"].includes(session.role)) {
      return err("Forbidden", 403);
    }

    const user = await getUser(
      params.id,
      session.role === "superadmin" ? null : session.companyId
    );
    if (!user) return err("User not found", 404);

    // Never expose password hash
    const { passwordHash: _, ...safe } = user;
    return ok(safe);
  },
  { roles: ALL_STAFF }
);

export const PATCH = withAuth(
  async (req: NextRequest, session, params: { id: string }) => {
    const isSelf = session.id === params.id;
    const isAdmin = ["admin", "superadmin"].includes(session.role);

    if (!isSelf && !isAdmin) return err("Forbidden", 403);

    const user = await getUser(
      params.id,
      session.role === "superadmin" ? null : session.companyId!
    );
    if (!user) return err("User not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    // Only admins can change roles or activation status
    if ((parsed.data.role || parsed.data.isActive !== undefined) && !isAdmin) {
      return err("Only admins can change roles or activation status", 403);
    }

    const { password, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return ok(updated);
  },
  { roles: ALL_STAFF }
);

export const DELETE = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    if (session.id === params.id) return err("Cannot deactivate your own account");

    const user = await getUser(params.id, session.companyId);
    if (!user) return err("User not found", 404);

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return ok({ message: "User deactivated" });
  },
  { roles: MANAGERS_UP }
);
