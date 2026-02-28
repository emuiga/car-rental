"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useVehicle, useUpdateVehicle } from "@/lib/queries/vehicles";
import { VehicleForm, type VehicleFormValues } from "@/components/vehicles/vehicle-form";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: vehicle, isLoading } = useVehicle(id);
  const updateMutation = useUpdateVehicle(id);

  async function handleSubmit(data: VehicleFormValues) {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Vehicle updated");
      router.push("/vehicles");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update vehicle");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vehicles"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title={
            isLoading
              ? "Loading..."
              : `${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`
          }
          description={vehicle?.licensePlate}
        >
          {vehicle && <StatusBadge type="vehicle" status={vehicle.status} />}
        </PageHeader>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : vehicle ? (
            <VehicleForm
              defaultValues={vehicle}
              onSubmit={handleSubmit}
              loading={updateMutation.isPending}
              showStatus
            />
          ) : (
            <p className="text-gray-500">Vehicle not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
