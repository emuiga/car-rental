"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, CalendarCheck } from "lucide-react";
import { useBookings } from "@/lib/queries/bookings";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatKES, formatDate } from "@/lib/format";

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: bookings, isLoading } = useBookings();

  const filtered = bookings?.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      b.bookingNumber.toLowerCase().includes(q) ||
      `${b.customer.firstName} ${b.customer.lastName}`.toLowerCase().includes(q) ||
      `${b.vehicle.make} ${b.vehicle.model}`.toLowerCase().includes(q) ||
      b.vehicle.licensePlate.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Manage rental bookings">
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </PageHeader>

      <div className="flex gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Booking #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={CalendarCheck}
                    title="No bookings found"
                    description={search || statusFilter !== "all" ? "No bookings match your filters." : "Create your first booking to get started."}
                    actionLabel={!search && statusFilter === "all" ? "New Booking" : undefined}
                    actionHref={!search && statusFilter === "all" ? "/bookings/new" : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    <Link href={`/bookings/${booking.id}`} className="text-blue-600 hover:underline font-medium">
                      {booking.bookingNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </TableCell>
                  <TableCell className="text-sm">
                    {booking.vehicle.make} {booking.vehicle.model}
                    <span className="block text-xs text-gray-400 font-mono">{booking.vehicle.licensePlate}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(booking.startDate)}
                    <span className="text-gray-400 mx-1">→</span>
                    {formatDate(booking.endDate)}
                  </TableCell>
                  <TableCell className="font-medium">{formatKES(booking.totalAmount)}</TableCell>
                  <TableCell><StatusBadge type="booking" status={booking.status} /></TableCell>
                  <TableCell><StatusBadge type="payment" status={booking.paymentStatus} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
