/**
 * PATCH /api/bookings/:id/status  — advance booking status
 *
 * Valid transitions:
 *   pending  → active     (vehicle picked up)
 *   active   → completed  (vehicle returned)
 *   pending  → cancelled  (cancelled before pickup)
 *   active   → cancelled  (admin only — emergency cancellation)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

const schema = z.object({
  status: z.enum(["active", "completed", "cancelled"]),
  endMileage: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

const TRANSITIONS: Record<string, string[]> = {
  pending: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const PATCH = withAuth(
  async (req: NextRequest, session, params: { id: string }) => {
    const booking = await prisma.booking.findFirst({
      where: { id: params.id, companyId: session.companyId! },
    });
    if (!booking) return err("Booking not found", 404);

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { status: newStatus, endMileage, notes } = parsed.data;

    // Enforce valid transitions
    if (!TRANSITIONS[booking.status].includes(newStatus)) {
      return err(
        `Cannot transition booking from '${booking.status}' to '${newStatus}'`,
        422
      );
    }

    // Only admin can cancel an active booking
    if (booking.status === "active" && newStatus === "cancelled") {
      if (!["admin", "superadmin"].includes(session.role)) {
        return err("Only admins can cancel an active booking", 403);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          ...(notes && { notes }),
          ...(endMileage !== undefined && { endMileage }),
        },
      });

      // Update vehicle status based on transition
      if (newStatus === "active") {
        await tx.vehicle.update({
          where: { id: booking.vehicleId },
          data: { status: "rented" },
        });
      } else if (newStatus === "completed" || newStatus === "cancelled") {
        // Only free the vehicle if there's no other active booking for it
        const otherActive = await tx.booking.findFirst({
          where: {
            vehicleId: booking.vehicleId,
            companyId: session.companyId!,
            status: "active",
            NOT: { id: params.id },
          },
        });
        if (!otherActive) {
          await tx.vehicle.update({
            where: { id: booking.vehicleId },
            data: { status: "available" },
          });
        }
      }

      return b;
    });

    return ok(updated);
  },
  { roles: ALL_STAFF }
);
