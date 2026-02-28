/**
 * GET  /api/vehicles  — list company vehicles (with filters)
 * POST /api/vehicles  — add a vehicle (admin/manager)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, COMPANY_ADMINS, ALL_STAFF } from "@/lib/api";

const createSchema = z.object({
  registrationNumber: z.string().min(1).max(20),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  category: z.enum(["small", "sedan", "suv", "van", "seven_seater"]),
  dailyRate: z.number().positive(),
  mileage: z.number().int().min(0).optional(),
  color: z.string().max(50).optional(),
  fuelType: z.string().max(20).optional(),
  transmission: z.string().max(20).optional(),
  seats: z.number().int().min(1).max(30).optional(),
  notes: z.string().optional(),
});

export const GET = withAuth(
  async (req: NextRequest, session) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const vehicles = await prisma.vehicle.findMany({
      where: {
        companyId: session.companyId!,
        isActive: true,
        ...(status && { status: status as never }),
        ...(category && { category: category as never }),
        ...(search && {
          OR: [
            { make: { contains: search, mode: "insensitive" } },
            { model: { contains: search, mode: "insensitive" } },
            { registrationNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(vehicles);
  },
  { roles: ALL_STAFF }
);

export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { registrationNumber, dailyRate, ...rest } = parsed.data;

    const existing = await prisma.vehicle.findFirst({
      where: { registrationNumber, companyId: session.companyId! },
    });
    if (existing)
      return err("A vehicle with this registration number already exists", 409);

    const vehicle = await prisma.vehicle.create({
      data: {
        ...rest,
        registrationNumber,
        dailyRate,
        companyId: session.companyId!,
      },
    });

    return ok(vehicle, 201);
  },
  { roles: COMPANY_ADMINS }
);
