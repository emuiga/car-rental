/**
 * GET  /api/customers  — list company customers
 * POST /api/customers  — create a customer (with KYC)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, err, ALL_STAFF } from "@/lib/api";

const createSchema = z.object({
  fullName: z.string().min(1).max(255),
  idNumber: z.string().min(1).max(50),
  customerType: z.enum(["local", "tourist", "expat"]).default("local"),
  drivingLicense: z.string().max(50).optional(),
  licenseExpiry: z.string().datetime().optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  nextOfKinName: z.string().max(255).optional(),
  nextOfKinPhone: z.string().max(20).optional(),
  employerDetails: z.string().optional(),
});

export const GET = withAuth(
  async (req: NextRequest, session) => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const customerType = searchParams.get("type");

    const customers = await prisma.customer.findMany({
      where: {
        companyId: session.companyId!,
        isActive: true,
        ...(customerType && { customerType: customerType as never }),
        ...(search && {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { idNumber: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        idNumber: true,
        customerType: true,
        phone: true,
        email: true,
        drivingLicense: true,
        licenseExpiry: true,
        createdAt: true,
      },
    });

    return ok(customers);
  },
  { roles: ALL_STAFF }
);

export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message);

    const { idNumber, licenseExpiry, ...rest } = parsed.data;

    // Check for duplicate ID within this company
    const existing = await prisma.customer.findFirst({
      where: { idNumber, companyId: session.companyId! },
    });
    if (existing)
      return err("A customer with this ID number already exists", 409);

    const customer = await prisma.customer.create({
      data: {
        ...rest,
        idNumber,
        companyId: session.companyId!,
        ...(licenseExpiry && { licenseExpiry: new Date(licenseExpiry) }),
      },
    });

    return ok(customer, 201);
  },
  { roles: ALL_STAFF }
);
