/**
 * POST /api/auth/register
 *
 * Creates a new company user (admin/manager/staff).
 * Only superadmin or company admin can call this.
 * - superadmin can create users for any company
 * - company admin can only create users within their own company
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, MANAGERS_UP } from "@/lib/api";
import { UserRole } from "@prisma/client";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(["admin", "manager", "staff"]),
  /// Required when called by superadmin; ignored for company admins (uses their own companyId)
  companyId: z.string().uuid().optional(),
});

export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { email, password, firstName, lastName, role, companyId } =
      parsed.data;

    // Resolve target company
    let targetCompanyId: string;

    if (session.role === "superadmin") {
      if (!companyId) return err("companyId is required when registering as superadmin");
      // Verify company exists
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) return err("Company not found", 404);
      targetCompanyId = companyId;
    } else {
      // Company admin — restricted to their own company
      targetCompanyId = session.companyId!;
      // Company admin cannot create another admin
      if (role === "admin" && session.role !== "admin") {
        return err("Only admins can create other admin accounts", 403);
      }
    }

    // Check duplicate email within the target company
    const existing = await prisma.user.findFirst({
      where: { email, companyId: targetCompanyId },
    });
    if (existing) return err("A user with this email already exists in this company", 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as UserRole,
        companyId: targetCompanyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    return ok(user, 201);
  },
  { roles: MANAGERS_UP }
);
