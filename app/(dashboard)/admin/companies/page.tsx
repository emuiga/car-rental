"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Building2 } from "lucide-react";
import { useCompanies, useDeleteCompany } from "@/lib/queries/companies";
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
import { formatDate } from "@/lib/format";

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: companies, isLoading } = useCompanies();
  const deleteMutation = useDeleteCompany();

  const filtered = companies?.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Company deleted");
      setDeleteId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete company");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description="Manage all tenant companies">
        <Button asChild>
          <Link href="/admin/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Link>
        </Button>
      </PageHeader>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Company</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Vehicles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="No companies found"
                    description={search ? "No companies match your search." : "Create your first tenant company."}
                    actionLabel={!search ? "New Company" : undefined}
                    actionHref={!search ? "/admin/companies/new" : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((company) => (
                <TableRow key={company.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link href={`/admin/companies/${company.id}`} className="hover:text-blue-600 transition-colors">
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">{company.slug}</TableCell>
                  <TableCell className="text-sm">{company.email}</TableCell>
                  <TableCell className="text-sm">{company._count?.users ?? 0}</TableCell>
                  <TableCell className="text-sm">{company._count?.vehicles ?? 0}</TableCell>
                  <TableCell>
                    <StatusBadge type="subscription" status={company.subscriptionStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(company.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/companies/${company.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteId(company.id)}
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
        title="Delete company?"
        description="This will permanently remove the company and all associated data."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
