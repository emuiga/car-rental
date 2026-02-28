"use client";

import { use, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { useBooking, useUpdateBookingStatus } from "@/lib/queries/bookings";
import { useCreatePayment, useDeletePayment } from "@/lib/queries/payments";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatKES, formatDate, formatDateTime } from "@/lib/format";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function AddPaymentDialog({
  bookingId,
  open,
  onOpenChange,
}: {
  bookingId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createPayment = useCreatePayment();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!amount || !method) return;
    try {
      await createPayment.mutateAsync({
        bookingId,
        amount: Number(amount),
        method,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      toast.success("Payment recorded");
      onOpenChange(false);
      setAmount("");
      setMethod("cash");
      setReference("");
      setNotes("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to record payment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Amount (KES)</Label>
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Reference (optional)</Label>
            <Input
              placeholder="Transaction ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Notes..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!amount || createPayment.isPending}>
            {createPayment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: booking, isLoading } = useBooking(id);
  const updateStatus = useUpdateBookingStatus(id);
  const deletePayment = useDeletePayment();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const transitions = booking ? STATUS_TRANSITIONS[booking.status] ?? [] : [];

  const paid = booking?.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const outstanding = (booking?.totalAmount ?? 0) - paid;

  async function handleStatusChange(status: string) {
    try {
      await updateStatus.mutateAsync(status);
      toast.success(`Booking marked as ${status}`);
      setPendingStatus(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  async function handleDeletePayment() {
    if (!deletePaymentId) return;
    try {
      await deletePayment.mutateAsync(deletePaymentId);
      toast.success("Payment removed");
      setDeletePaymentId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove payment");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!booking) return <p className="text-gray-500">Booking not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bookings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title={`Booking ${booking.bookingNumber}`}
          description={`Created ${formatDateTime(booking.createdAt)}`}
        >
          <StatusBadge type="booking" status={booking.status} />
          <StatusBadge type="payment" status={booking.paymentStatus} />
        </PageHeader>
      </div>

      {/* Status actions */}
      {transitions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {transitions.map((s) => (
            <Button
              key={s}
              variant={s === "cancelled" ? "destructive" : "default"}
              size="sm"
              onClick={() => setPendingStatus(s)}
              disabled={updateStatus.isPending}
            >
              Mark as {s}
            </Button>
          ))}
        </div>
      )}

      {/* Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{booking.customer.firstName} {booking.customer.lastName}</p>
            <p className="text-gray-500">{booking.customer.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Vehicle</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{booking.vehicle.make} {booking.vehicle.model}</p>
            <p className="font-mono text-gray-500">{booking.vehicle.licensePlate}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold">Rental Period</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start</p>
              <p className="font-medium">{formatDate(booking.startDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">End</p>
              <p className="font-medium">{formatDate(booking.endDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-bold text-base">{formatKES(booking.totalAmount)}</p>
            </div>
          </div>
          {booking.notes && (
            <>
              <Separator className="my-3" />
              <p className="text-sm text-gray-500">{booking.notes}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Payments</CardTitle>
          {booking.status !== "cancelled" && (
            <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Record Payment
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {booking.payments?.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">No payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {booking.payments?.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{formatKES(payment.amount)}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {payment.method.replace("_", " ")}
                      {payment.reference && ` · ${payment.reference}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeletePaymentId(payment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator className="my-3" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Paid</span>
            <span className="font-medium text-green-700">{formatKES(paid)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Outstanding</span>
            <span className={outstanding > 0 ? "font-semibold text-red-600" : "font-medium text-gray-400"}>
              {formatKES(outstanding)}
            </span>
          </div>
        </CardContent>
      </Card>

      <AddPaymentDialog
        bookingId={id}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />

      <ConfirmDialog
        open={!!pendingStatus}
        onOpenChange={(o) => !o && setPendingStatus(null)}
        title={`Mark as ${pendingStatus}?`}
        description={
          pendingStatus === "cancelled"
            ? "This booking will be cancelled. The vehicle will be made available."
            : pendingStatus === "completed"
            ? "This will mark the booking as completed and free up the vehicle."
            : `This will move the booking to ${pendingStatus} status.`
        }
        confirmLabel={`Mark as ${pendingStatus}`}
        variant={pendingStatus === "cancelled" ? "destructive" : "default"}
        onConfirm={() => pendingStatus && handleStatusChange(pendingStatus)}
        loading={updateStatus.isPending}
      />

      <ConfirmDialog
        open={!!deletePaymentId}
        onOpenChange={(o) => !o && setDeletePaymentId(null)}
        title="Remove payment?"
        description="This payment will be removed and the booking payment status will be recalculated."
        confirmLabel="Remove"
        onConfirm={handleDeletePayment}
        loading={deletePayment.isPending}
      />
    </div>
  );
}
