/**
 * GET   /api/bookings/:id  — get booking with payments
 * PATCH /api/bookings/:id  — update non-critical fields (notes, locations, mileage)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

const updateSchema = z.object({
  notes: z.string().optional(),
  pickupLocation: z.string().optional(),
  returnLocation: z.string().optional(),
  startMileage: z.number().int().min(0).optional(),
  endMileage: z.number().int().min(0).optional(),
  depositPaid: z.number().min(0).optional(),
});

async function getBooking(id: string, companyId: string) {
  return prisma.booking.findFirst({
    where: { id, companyId },
  });
}

export const GET = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, companyId: session.companyId! },
      include: {
        vehicle: true,
        customer: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!booking) return err("Booking not found", 404);

    // Calculate amount paid vs outstanding
    const amountPaid = booking.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const outstanding = Number(booking.totalAmount) - amountPaid;

    return ok({ ...booking, amountPaid, outstanding });
  },
  { roles: ALL_STAFF }
);

export const PATCH = withAuth(
  async (req: NextRequest, session, params: { id: string }) => {
    const booking = await getBooking(params.id, session.companyId!);
    if (!booking) return err("Booking not found", 404);

    if (booking.status === "cancelled")
      return err("Cannot update a cancelled booking");

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return ok(updated);
  },
  { roles: ALL_STAFF }
);
