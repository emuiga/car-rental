/**
 * GET    /api/companies/:id  — get one company with stats (superadmin)
 * PATCH  /api/companies/:id  — update company info (superadmin)
 * DELETE /api/companies/:id  — soft-deactivate company (superadmin)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, SUPERADMIN_ONLY } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  subscriptionStatus: z.enum(["trial", "active", "inactive"]).optional(),
});

export const GET = withAuth(
  async (_req: NextRequest, _session, params: { id: string }) => {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            vehicles: true,
            customers: true,
            bookings: true,
            payments: true,
          },
        },
      },
    });

    if (!company) return err("Company not found", 404);
    return ok(company);
  },
  { roles: SUPERADMIN_ONLY }
);

export const PATCH = withAuth(
  async (req: NextRequest, _session, params: { id: string }) => {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    if (parsed.data.slug) {
      const conflict = await prisma.company.findFirst({
        where: { slug: parsed.data.slug, NOT: { id: params.id } },
      });
      if (conflict) return err("Slug already taken", 409);
    }

    const company = await prisma.company.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return ok(company);
  },
  { roles: SUPERADMIN_ONLY }
);

export const DELETE = withAuth(
  async (_req: NextRequest, _session, params: { id: string }) => {
    // Soft-delete: set status to inactive
    await prisma.company.update({
      where: { id: params.id },
      data: { subscriptionStatus: "inactive" },
    });
    return ok({ message: "Company deactivated" });
  },
  { roles: SUPERADMIN_ONLY }
);
