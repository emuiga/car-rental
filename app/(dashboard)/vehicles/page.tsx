"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useVehicles, useDeleteVehicle } from "@/lib/queries/vehicles";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Car } from "lucide-react";
import { formatKES } from "@/lib/format";

export default function VehiclesPage() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: vehicles, isLoading } = useVehicles();
  const deleteMutation = useDeleteVehicle();

  const filtered = vehicles?.filter((v) => {
    const q = search.toLowerCase();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.licensePlate.toLowerCase().includes(q)
    );
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Vehicle deleted");
      setDeleteId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete vehicle");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description="Manage your fleet">
        <Button asChild>
          <Link href="/vehicles/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </PageHeader>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search vehicles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Daily Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Car}
                    title="No vehicles found"
                    description={
                      search
                        ? "No vehicles match your search."
                        : "Add your first vehicle to get started."
                    }
                    actionLabel={!search ? "Add Vehicle" : undefined}
                    actionHref={!search ? "/vehicles/new" : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{vehicle.licensePlate}</TableCell>
                  <TableCell className="capitalize text-sm">{vehicle.category}</TableCell>
                  <TableCell>{formatKES(vehicle.dailyRate)}/day</TableCell>
                  <TableCell>
                    <StatusBadge type="vehicle" status={vehicle.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(vehicle.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete vehicle?"
        description="This action cannot be undone. The vehicle will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
