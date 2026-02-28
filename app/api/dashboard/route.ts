/**
 * GET /api/dashboard  — company dashboard stats
 *
 * Returns:
 * - Revenue this month vs last month
 * - Active / pending / completed bookings
 * - Vehicle availability breakdown
 * - New customers this month
 * - Recent bookings (last 5)
 * - Top vehicles by revenue
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ok, ALL_STAFF } from "@/lib/api";

export const GET = withAuth(
  async (_req: NextRequest, session) => {
    const companyId = session.companyId!;
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      revenueThisMonth,
      revenueLastMonth,
      bookingCounts,
      vehicleStatusCounts,
      customersThisMonth,
      totalCustomers,
      recentBookings,
    ] = await Promise.all([
      // Revenue this month
      prisma.payment.aggregate({
        where: {
          companyId,
          paymentDate: { gte: startOfThisMonth },
        },
        _sum: { amount: true },
      }),

      // Revenue last month
      prisma.payment.aggregate({
        where: {
          companyId,
          paymentDate: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),

      // Booking status breakdown
      prisma.booking.groupBy({
        by: ["status"],
        where: { companyId },
        _count: { _all: true },
      }),

      // Vehicle status breakdown
      prisma.vehicle.groupBy({
        by: ["status"],
        where: { companyId, isActive: true },
        _count: { _all: true },
      }),

      // New customers this month
      prisma.customer.count({
        where: { companyId, createdAt: { gte: startOfThisMonth } },
      }),

      // Total active customers
      prisma.customer.count({
        where: { companyId, isActive: true },
      }),

      // Recent bookings
      prisma.booking.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          vehicle: { select: { registrationNumber: true, make: true, model: true } },
          customer: { select: { fullName: true, phone: true } },
        },
      }),
    ]);

    // Reshape counts into maps for easy access
    const bookings: Record<string, number> = {};
    bookingCounts.forEach((b) => {
      bookings[b.status] = b._count._all;
    });

    const vehicles: Record<string, number> = {};
    vehicleStatusCounts.forEach((v) => {
      vehicles[v.status] = v._count._all;
    });

    const thisMonthRevenue = Number(revenueThisMonth._sum.amount ?? 0);
    const lastMonthRevenue = Number(revenueLastMonth._sum.amount ?? 0);
    const revenueChange =
      lastMonthRevenue === 0
        ? null
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    return ok({
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        changePercent: revenueChange ? Math.round(revenueChange * 10) / 10 : null,
      },
      bookings: {
        active: bookings["active"] ?? 0,
        pending: bookings["pending"] ?? 0,
        completed: bookings["completed"] ?? 0,
        cancelled: bookings["cancelled"] ?? 0,
        total: Object.values(bookings).reduce((a, b) => a + b, 0),
      },
      vehicles: {
        available: vehicles["available"] ?? 0,
        rented: vehicles["rented"] ?? 0,
        maintenance: vehicles["maintenance"] ?? 0,
        total: Object.values(vehicles).reduce((a, b) => a + b, 0),
      },
      customers: {
        newThisMonth: customersThisMonth,
        total: totalCustomers,
      },
      recentBookings,
    });
  },
  { roles: ALL_STAFF }
);
