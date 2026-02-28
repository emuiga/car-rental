/**
 * GET  /api/bookings  — list bookings (filterable)
 * POST /api/bookings  — create booking with availability check
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

const createSchema = z
  .object({
    vehicleId: z.string().uuid(),
    customerId: z.string().uuid(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    depositPaid: z.number().min(0).default(0),
    notes: z.string().optional(),
    pickupLocation: z.string().optional(),
    returnLocation: z.string().optional(),
    startMileage: z.number().int().min(0).optional(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const GET = withAuth(
  async (req: NextRequest, session) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const vehicleId = searchParams.get("vehicleId");
    const customerId = searchParams.get("customerId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const bookings = await prisma.booking.findMany({
      where: {
        companyId: session.companyId!,
        ...(status && { status: status as never }),
        ...(paymentStatus && { paymentStatus: paymentStatus as never }),
        ...(vehicleId && { vehicleId }),
        ...(customerId && { customerId }),
        ...(from && { startDate: { gte: new Date(from) } }),
        ...(to && { endDate: { lte: new Date(to) } }),
      },
      include: {
        vehicle: {
          select: { registrationNumber: true, make: true, model: true, category: true },
        },
        customer: {
          select: { fullName: true, phone: true, idNumber: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    return ok(bookings);
  },
  { roles: ALL_STAFF }
);

export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { vehicleId, customerId, startDate, endDate, depositPaid, ...rest } =
      parsed.data;
    const start = new Date(startDate);
    const end = new Date(endDate);

    // ── Verify vehicle belongs to this company ───────────────────────────────
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId: session.companyId!, isActive: true },
    });
    if (!vehicle) return err("Vehicle not found", 404);
    if (vehicle.status === "maintenance")
      return err("Vehicle is currently under maintenance");

    // ── Verify customer belongs to this company ──────────────────────────────
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId: session.companyId!, isActive: true },
    });
    if (!customer) return err("Customer not found", 404);

    // ── Check for date conflicts on this vehicle ─────────────────────────────
    const conflict = await prisma.booking.findFirst({
      where: {
        companyId: session.companyId!,
        vehicleId,
        status: { in: ["pending", "active"] },
        // Overlapping: existing.start < new.end  AND  existing.end > new.start
        startDate: { lt: end },
        endDate: { gt: start },
      },
    });
    if (conflict)
      return err(
        `Vehicle is already booked from ${conflict.startDate.toISOString().slice(0, 10)} to ${conflict.endDate.toISOString().slice(0, 10)}`,
        409
      );

    // ── Calculate total ──────────────────────────────────────────────────────
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailyRate = vehicle.dailyRate;
    const totalAmount = Number(dailyRate) * days;

    // ── Create booking + mark vehicle as rented ──────────────────────────────
    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          companyId: session.companyId!,
          vehicleId,
          customerId,
          startDate: start,
          endDate: end,
          dailyRate,
          totalAmount,
          depositPaid,
          createdBy: session.id,
          ...rest,
        },
        include: {
          vehicle: { select: { registrationNumber: true, make: true, model: true } },
          customer: { select: { fullName: true, phone: true } },
        },
      });

      // If start date is today, mark vehicle as rented immediately
      const today = new Date();
      if (start <= today && end > today) {
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: { status: "rented" },
        });
      }

      return b;
    });

    return ok(booking, 201);
  },
  { roles: ALL_STAFF }
);
