/**
 * GET    /api/customers/:id  — get one customer with booking history
 * PATCH  /api/customers/:id  — update customer info
 * DELETE /api/customers/:id  — soft-delete (admin only)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

const updateSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  customerType: z.enum(["local", "tourist", "expat"]).optional(),
  drivingLicense: z.string().max(50).optional(),
  licenseExpiry: z.string().datetime().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  nextOfKinName: z.string().max(255).optional(),
  nextOfKinPhone: z.string().max(20).optional(),
  employerDetails: z.string().optional(),
});

async function getCustomer(id: string, companyId: string) {
  return prisma.customer.findFirst({
    where: { id, companyId, isActive: true },
  });
}

export const GET = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, companyId: session.companyId!, isActive: true },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            vehicle: { select: { registrationNumber: true, make: true, model: true } },
          },
        },
      },
    });

    if (!customer) return err("Customer not found", 404);
    return ok(customer);
  },
  { roles: ALL_STAFF }
);

export const PATCH = withAuth(
  async (req: NextRequest, session, params: { id: string }) => {
    const customer = await getCustomer(params.id, session.companyId!);
    if (!customer) return err("Customer not found", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { licenseExpiry, ...rest } = parsed.data;

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
      },
    });

    return ok(updated);
  },
  { roles: ALL_STAFF }
);

export const DELETE = withAuth(
  async (_req: NextRequest, session, params: { id: string }) => {
    const customer = await getCustomer(params.id, session.companyId!);
    if (!customer) return err("Customer not found", 404);

    const activeBooking = await prisma.booking.findFirst({
      where: {
        customerId: params.id,
        companyId: session.companyId!,
        status: { in: ["pending", "active"] },
      },
    });
    if (activeBooking)
      return err("Cannot delete a customer with active or pending bookings", 409);

    await prisma.customer.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return ok({ message: "Customer deleted" });
  },
  { roles: ["admin"] }
);
