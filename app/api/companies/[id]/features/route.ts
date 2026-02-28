/**
 * GET   /api/companies/:id/features  — get feature flags (superadmin)
 * PUT   /api/companies/:id/features  — replace feature flags (superadmin)
 * PATCH /api/companies/:id/features  — toggle individual flags (superadmin)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, SUPERADMIN_ONLY } from "@/lib/api";

const featuresSchema = z.object({
  sms: z.boolean().optional(),
  mpesa: z.boolean().optional(),
  reports: z.boolean().optional(),
  portal: z.boolean().optional(),
  gps: z.boolean().optional(),
});

export const GET = withAuth(
  async (_req: NextRequest, _session, params: { id: string }) => {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, enabledFeatures: true },
    });
    if (!company) return err("Company not found", 404);
    return ok(company);
  },
  { roles: SUPERADMIN_ONLY }
);

export const PUT = withAuth(
  async (req: NextRequest, _session, params: { id: string }) => {
    const body = await req.json();
    const parsed = featuresSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const company = await prisma.company.update({
      where: { id: params.id },
      data: { enabledFeatures: parsed.data },
      select: { id: true, name: true, enabledFeatures: true },
    });

    return ok(company);
  },
  { roles: SUPERADMIN_ONLY }
);

export const PATCH = withAuth(
  async (req: NextRequest, _session, params: { id: string }) => {
    const body = await req.json();
    const parsed = featuresSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    // Merge incoming flags into the existing JSON
    const current = await prisma.company.findUnique({
      where: { id: params.id },
      select: { enabledFeatures: true },
    });
    if (!current) return err("Company not found", 404);

    const merged = {
      ...(current.enabledFeatures as object),
      ...parsed.data,
    };

    const company = await prisma.company.update({
      where: { id: params.id },
      data: { enabledFeatures: merged },
      select: { id: true, name: true, enabledFeatures: true },
    });

    return ok(company);
  },
  { roles: SUPERADMIN_ONLY }
);
