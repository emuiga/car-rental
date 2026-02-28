"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { useCustomers, useDeleteCustomer } from "@/lib/queries/customers";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: customers, isLoading } = useCustomers();
  const deleteMutation = useDeleteCustomer();

  const filtered = customers?.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Customer deleted");
      setDeleteId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete customer");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage customer records">
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </PageHeader>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Users}
                    title="No customers found"
                    description={search ? "No customers match your search." : "Add your first customer to get started."}
                    actionLabel={!search ? "Add Customer" : undefined}
                    actionHref={!search ? "/customers/new" : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link href={`/customers/${customer.id}`} className="hover:text-blue-600 transition-colors">
                      {customer.firstName} {customer.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{customer.phone}</TableCell>
                  <TableCell className="text-sm text-gray-500">{customer.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {customer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{customer._count?.bookings ?? 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(customer.id)}
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
        title="Delete customer?"
        description="This will permanently remove the customer record."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
