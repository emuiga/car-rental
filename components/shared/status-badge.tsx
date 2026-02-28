import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bookingStatusMap: Record<string, { label: string; class: string }> = {
  pending:   { label: "Pending",   class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  active:    { label: "Active",    class: "bg-blue-100 text-blue-800 border-blue-200" },
  completed: { label: "Completed", class: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelled", class: "bg-red-100 text-red-800 border-red-200" },
};

const paymentStatusMap: Record<string, { label: string; class: string }> = {
  unpaid:  { label: "Unpaid",   class: "bg-red-100 text-red-800 border-red-200" },
  partial: { label: "Partial",  class: "bg-orange-100 text-orange-800 border-orange-200" },
  paid:    { label: "Paid",     class: "bg-green-100 text-green-800 border-green-200" },
};

const vehicleStatusMap: Record<string, { label: string; class: string }> = {
  available:   { label: "Available",   class: "bg-green-100 text-green-800 border-green-200" },
  rented:      { label: "Rented",      class: "bg-blue-100 text-blue-800 border-blue-200" },
  maintenance: { label: "Maintenance", class: "bg-orange-100 text-orange-800 border-orange-200" },
};

const subscriptionMap: Record<string, { label: string; class: string }> = {
  trial:    { label: "Trial",    class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  active:   { label: "Active",   class: "bg-green-100 text-green-800 border-green-200" },
  inactive: { label: "Inactive", class: "bg-gray-100 text-gray-600 border-gray-200" },
};

type BadgeType = "booking" | "payment" | "vehicle" | "subscription";

export function StatusBadge({ type, status }: { type: BadgeType; status: string }) {
  const map = {
    booking: bookingStatusMap,
    payment: paymentStatusMap,
    vehicle: vehicleStatusMap,
    subscription: subscriptionMap,
  }[type];

  const config = map[status] ?? { label: status, class: "bg-gray-100 text-gray-600" };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.class)}>
      {config.label}
    </Badge>
  );
}
