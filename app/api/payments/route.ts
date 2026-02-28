/**
 * GET  /api/payments  — list payments for this company
 * POST /api/payments  — record a payment against a booking
 *
 * Security: bookingId is validated against session.companyId before processing.
 * Staff cannot access payments from another company by guessing a booking UUID.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

const createSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["mpesa", "cash", "card", "bank"]),
  transactionRef: z.string().max(100).optional(),
  paymentDate: z.string().datetime(),
  notes: z.string().optional(),
});

export const GET = withAuth(
  async (req: NextRequest, session) => {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");
    const method = searchParams.get("method");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const payments = await prisma.payment.findMany({
      where: {
        // companyId always enforced from session — never from query params
        companyId: session.companyId!,
        ...(bookingId && { bookingId }),
        ...(method && { paymentMethod: method as never }),
        ...(from && { paymentDate: { gte: new Date(from) } }),
        ...(to && { paymentDate: { lte: new Date(to) } }),
      },
      include: {
        booking: {
          select: {
            id: true,
            totalAmount: true,
            vehicle: { select: { registrationNumber: true, make: true, model: true } },
            customer: { select: { fullName: true, phone: true } },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return ok(payments);
  },
  { roles: ALL_STAFF }
);

export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { bookingId, amount, paymentMethod, transactionRef, paymentDate, notes } =
      parsed.data;

    // ── Verify booking belongs to this company (security gate) ──────────────
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, companyId: session.companyId! },
    });
    if (!booking) return err("Booking not found", 404);
    if (booking.status === "cancelled")
      return err("Cannot record payment for a cancelled booking");

    // ── Record payment + auto-update paymentStatus ──────────────────────────
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          companyId: session.companyId!,
          bookingId,
          amount,
          paymentMethod,
          transactionRef,
          paymentDate: new Date(paymentDate),
          notes,
          recordedBy: session.id,
        },
      });

      // Recalculate total paid for this booking
      const agg = await tx.payment.aggregate({
        where: { bookingId },
        _sum: { amount: true },
      });
      const totalPaid = Number(agg._sum.amount ?? 0);
      const total = Number(booking.totalAmount);

      let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";
      if (totalPaid >= total) paymentStatus = "paid";
      else if (totalPaid > 0) paymentStatus = "partial";

      await tx.booking.update({
        where: { id: bookingId },
        data: { paymentStatus },
      });

      return p;
    });

    return ok(payment, 201);
  },
  { roles: ALL_STAFF }
);
