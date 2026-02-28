"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCreateCustomer } from "@/lib/queries/customers";
import { CustomerForm, type CustomerFormValues } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NewCustomerPage() {
  const router = useRouter();
  const createMutation = useCreateCustomer();

  async function handleSubmit(data: CustomerFormValues) {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Customer added");
      router.push("/customers");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add customer");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader title="Add Customer" description="Register a new customer" />
      </div>

      <Card>
        <CardContent className="p-6">
          <CustomerForm onSubmit={handleSubmit} loading={createMutation.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
