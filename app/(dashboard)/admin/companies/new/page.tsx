"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCompany } from "@/lib/queries/companies";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/format";

const schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  slug: z.string().min(2, "At least 2 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const createMutation = useCreateCompany();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<any>,
    defaultValues: { name: "", slug: "", email: "", phone: "", address: "" },
  });

  function handleNameChange(name: string) {
    form.setValue("name", name);
    if (!form.getValues("slug") || form.getValues("slug") === slugify(form.getValues("name"))) {
      form.setValue("slug", slugify(name));
    }
  }

  async function onSubmit(data: FormValues) {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Company created");
      router.push("/admin/companies");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create company");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/companies"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader title="New Company" description="Register a new tenant company" />
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Safari Rentals Ltd"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Slug (Login ID)</FormLabel>
                  <FormControl>
                    <Input placeholder="safari-rentals" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is used by company users to log in. Cannot be changed later.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl><Input type="email" placeholder="info@safarirentals.co.ke" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl><Input placeholder="+254 700 000 000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (optional)</FormLabel>
                    <FormControl><Input placeholder="Nairobi, Kenya" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Company
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
