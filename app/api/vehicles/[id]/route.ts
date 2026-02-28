/**
 * GET    /api/vehicles/:id  — get one vehicle
 * PATCH  /api/vehicles/:id  — update vehicle
 * DELETE /api/vehicles/:id  — soft-delete vehicle (admin only)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, COMPANY_ADMINS, ALL_STAFF } from "@/lib/api";

const updateSchema = z.object({
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.number().int().min(1990).optional(),
  category: z.enum(["small", "sedan", "suv", "van", "seven_seater"]).optional(),
  dailyRate: z.number().positive().optional(),
  status: z.enum(["available", "rented", "maintenance"]).optional(),
  mileage: z.number().int().min(0).optional(),
  color: z.string().max(50).optional(),
  fuelType: z.string().max(20).optional(),
  transmission: z.string().max(20).optional(),
  seats: z.number().int().min(1).max(30).optional(),
  notes: z.string().optional(),
});

async function getVehicle(id: string, companyId: string) {
  return prisma.vehicle.findFirst({
    where: { id, companyId, isActive: true },
  });
}

export const GET = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const vehicle = await getVehicle(params.id, session.companyId!);
    if (!vehicle) return err("Vehicle not found", 404);

    // Include upcoming bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        vehicleId: params.id,
        companyId: session.companyId!,
        status: { in: ["pending", "active"] },
        endDate: { gte: new Date() },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        customer: { select: { fullName: true, phone: true } },
      },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    return ok({ ...vehicle, upcomingBookings });
  },
  { roles: ALL_STAFF }
);

export const PATCH = withAuth(
  async (req: NextRequest, session, params: { id: string }) => {
    const vehicle = await getVehicle(params.id, session.companyId!);
    if (!vehicle) return err("Vehicle not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const updated = await prisma.vehicle.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return ok(updated);
  },
  { roles: COMPANY_ADMINS }
);

export const DELETE = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const vehicle = await getVehicle(params.id, session.companyId!);
    if (!vehicle) return err("Vehicle not found", 404);

    // Block deletion if vehicle has active bookings
    const activeBooking = await prisma.booking.findFirst({
      where: {
        vehicleId: params.id,
        companyId: session.companyId!,
        status: { in: ["pending", "active"] },
      },
    });
    if (activeBooking)
      return err("Cannot delete a vehicle with active or pending bookings", 409);

    await prisma.vehicle.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return ok({ message: "Vehicle deleted" });
  },
  { roles: ["admin"] }
);
