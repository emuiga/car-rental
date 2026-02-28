"use client";

import { useDashboard } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKES } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  CalendarCheck,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
          {trend !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your fleet operations" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Revenue (This Month)"
              value={formatKES(data?.revenue.thisMonth ?? 0)}
              sub={`Last month: ${formatKES(data?.revenue.lastMonth ?? 0)}`}
              icon={CreditCard}
              trend={data?.revenue.change}
            />
            <StatCard
              title="Total Bookings"
              value={data?.bookings.total ?? 0}
              sub={`${data?.bookings.active ?? 0} active · ${data?.bookings.pending ?? 0} pending`}
              icon={CalendarCheck}
            />
            <StatCard
              title="Fleet Size"
              value={data?.vehicles.total ?? 0}
              sub={`${data?.vehicles.available ?? 0} available · ${data?.vehicles.rented ?? 0} rented`}
              icon={Car}
            />
            <StatCard
              title="Customers"
              value={data?.customers.total ?? 0}
              icon={Users}
            />
          </>
        )}
      </div>

      {!isLoading && data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">Booking Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Pending", value: data.bookings.pending, color: "bg-yellow-400" },
                { label: "Active", value: data.bookings.active, color: "bg-blue-500" },
                { label: "Completed", value: data.bookings.completed, color: "bg-green-500" },
                { label: "Cancelled", value: data.bookings.cancelled, color: "bg-red-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.color)} />
                  <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">Vehicle Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Available", value: data.vehicles.available, color: "bg-green-500" },
                { label: "Rented", value: data.vehicles.rented, color: "bg-blue-500" },
                { label: "Maintenance", value: data.vehicles.maintenance, color: "bg-orange-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.color)} />
                  <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
