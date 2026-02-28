"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, UserCog } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/lib/queries/users";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const createUserSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum(["admin", "manager", "staff"]),
});

type CreateUserValues = z.infer<typeof createUserSchema>;

function AddUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createMutation = useCreateUser();
  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema) as Resolver<any>,
    defaultValues: { firstName: "", lastName: "", email: "", password: "", role: "staff" },
  });

  async function onSubmit(data: CreateUserValues) {
    try {
      await createMutation.mutateAsync(data);
      toast.success("User created");
      onOpenChange(false);
      form.reset();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: users, isLoading } = useUsers();
  const updateUser = useUpdateUser("");
  const deleteUserMutation = useDeleteUser();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteUserMutation.mutateAsync(deleteId);
      toast.success("User removed");
      setDeleteId(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove user");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" description="Manage your team and account" />

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Team Members</CardTitle>
              {isAdmin && (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add Member
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
                        {isAdmin && user.id !== session?.user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteId(user.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Your Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{session?.user?.firstName} {session?.user?.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{session?.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <Badge variant="outline" className="text-xs capitalize">{session?.user?.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Company</span>
                <span className="font-mono text-xs">{session?.user?.companySlug ?? "—"}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Remove team member?"
        description="This user will lose access to the platform."
        confirmLabel="Remove"
        onConfirm={handleDelete}
        loading={deleteUserMutation.isPending}
      />
    </div>
  );
}
