"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCustomer, useUpdateCustomer } from "@/lib/queries/customers";
import { CustomerForm, type CustomerFormValues } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: customer, isLoading } = useCustomer(id);
  const updateMutation = useUpdateCustomer(id);

  async function handleSubmit(data: CustomerFormValues) {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Customer updated");
      router.push("/customers");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update customer");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader
          title={isLoading ? "Loading..." : `${customer?.firstName} ${customer?.lastName}`}
          description={customer?.phone}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : customer ? (
            <CustomerForm
              defaultValues={customer}
              onSubmit={handleSubmit}
              loading={updateMutation.isPending}
            />
          ) : (
            <p className="text-gray-500">Customer not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
