/**
 * GET  /api/companies  — list all companies (superadmin)
 * POST /api/companies  — create a new company + initial admin user (superadmin)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, SUPERADMIN_ONLY } from "@/lib/api";

const createSchema = z.object({
  // Company fields
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  subscriptionStatus: z.enum(["trial", "active", "inactive"]).default("trial"),
  enabledFeatures: z
    .object({
      sms: z.boolean().default(false),
      mpesa: z.boolean().default(false),
      reports: z.boolean().default(false),
      portal: z.boolean().default(false),
      gps: z.boolean().default(false),
    })
    .default({ sms: false, mpesa: false, reports: false, portal: false, gps: false }),

  // Initial admin user
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  adminFirstName: z.string().min(1).max(100),
  adminLastName: z.string().min(1).max(100),
});

export const GET = withAuth(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const companies = await prisma.company.findMany({
      where: status ? { subscriptionStatus: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true, vehicles: true, customers: true, bookings: true },
        },
      },
    });

    return ok(companies);
  },
  { roles: SUPERADMIN_ONLY }
);

export const POST = withAuth(
  async (req: NextRequest) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const {
      name,
      slug,
      phone,
      email,
      address,
      primaryColor,
      subscriptionStatus,
      enabledFeatures,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
    } = parsed.data;

    // Check slug uniqueness
    const existingSlug = await prisma.company.findUnique({ where: { slug } });
    if (existingSlug) return err("A company with this slug already exists", 409);

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create company + admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name,
          slug,
          phone,
          email,
          address,
          primaryColor,
          subscriptionStatus,
          enabledFeatures,
        },
      });

      const admin = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: "admin",
          companyId: company.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      return { company, admin };
    });

    return ok(result, 201);
  },
  { roles: SUPERADMIN_ONLY }
);
