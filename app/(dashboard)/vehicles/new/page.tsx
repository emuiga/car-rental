"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCreateVehicle } from "@/lib/queries/vehicles";
import { VehicleForm, type VehicleFormValues } from "@/components/vehicles/vehicle-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NewVehiclePage() {
  const router = useRouter();
  const createMutation = useCreateVehicle();

  async function handleSubmit(data: VehicleFormValues) {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Vehicle added successfully");
      router.push("/vehicles");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add vehicle");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vehicles"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader title="Add Vehicle" description="Register a new vehicle to your fleet" />
      </div>

      <Card>
        <CardContent className="p-6">
          <VehicleForm onSubmit={handleSubmit} loading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
