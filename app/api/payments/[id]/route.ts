/**
 * GET    /api/payments/:id  — get one payment
 * DELETE /api/payments/:id  — void a payment (admin only)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

export const GET = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const payment = await prisma.payment.findFirst({
      where: { id: params.id, companyId: session.companyId! },
      include: {
        booking: {
          include: {
            vehicle: { select: { registrationNumber: true, make: true, model: true } },
            customer: { select: { fullName: true, idNumber: true, phone: true } },
          },
        },
      },
    });

    if (!payment) return err("Payment not found", 404);
    return ok(payment);
  },
  { roles: ALL_STAFF }
);

export const DELETE = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const payment = await prisma.payment.findFirst({
      where: { id: params.id, companyId: session.companyId! },
    });
    if (!payment) return err("Payment not found", 404);

    // Delete payment + recalculate booking paymentStatus
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: params.id } });

      const agg = await tx.payment.aggregate({
        where: { bookingId: payment.bookingId },
        _sum: { amount: true },
      });

      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        select: { totalAmount: true },
      });

      const totalPaid = Number(agg._sum.amount ?? 0);
      const total = Number(booking?.totalAmount ?? 0);

      let paymentStatus: "unpaid" | "partial" | "paid" = "unpaid";
      if (totalPaid >= total && total > 0) paymentStatus = "paid";
      else if (totalPaid > 0) paymentStatus = "partial";

      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus },
      });
    });

    return ok({ message: "Payment voided" });
  },
  { roles: ["admin"] }
);
