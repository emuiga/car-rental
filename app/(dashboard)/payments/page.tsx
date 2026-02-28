"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, CreditCard } from "lucide-react";
import { usePayments } from "@/lib/queries/payments";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatKES, formatDate } from "@/lib/format";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const { data: payments, isLoading } = usePayments();

  const filtered = payments?.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.booking.bookingNumber.toLowerCase().includes(q) ||
      `${p.booking.customer.firstName} ${p.booking.customer.lastName}`.toLowerCase().includes(q) ||
      (p.reference ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="All recorded payments" />

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search payments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Date</TableHead>
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
                    icon={CreditCard}
                    title="No payments found"
                    description={search ? "No payments match your search." : "Payments will appear here once bookings are paid."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/bookings/${payment.booking.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {payment.booking.bookingNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.booking.customer.firstName} {payment.booking.customer.lastName}
                  </TableCell>
                  <TableCell className="font-medium">{formatKES(payment.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {payment.method.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 font-mono">
                    {payment.reference ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge type="payment" status={payment.booking.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(payment.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
