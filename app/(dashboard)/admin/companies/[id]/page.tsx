"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCompany,
  useUpdateCompany,
  useUpdateCompanyFeatures,
} from "@/lib/queries/companies";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";

const detailsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionStatus: z.enum(["trial", "active", "inactive"]),
});

type DetailsValues = z.infer<typeof detailsSchema>;

const FEATURES: { key: string; label: string; description: string }[] = [
  { key: "sms", label: "SMS Notifications", description: "Send SMS alerts to customers" },
  { key: "mpesa", label: "M-Pesa Integration", description: "Accept M-Pesa payments" },
  { key: "reports", label: "Advanced Reports", description: "Detailed analytics and exports" },
  { key: "portal", label: "Customer Portal", description: "Self-service portal for customers" },
  { key: "gps", label: "GPS Tracking", description: "Real-time vehicle tracking" },
];

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: company, isLoading } = useCompany(id);
  const updateMutation = useUpdateCompany(id);
  const featuresMutation = useUpdateCompanyFeatures(id);

  const [features, setFeatures] = useState<Record<string, boolean> | null>(null);

  const currentFeatures = features ?? company?.enabledFeatures ?? {};

  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema) as Resolver<any>,
    values: company
      ? {
          name: company.name,
          email: company.email,
          phone: company.phone ?? "",
          address: company.address ?? "",
          subscriptionStatus: company.subscriptionStatus as "trial" | "active" | "inactive",
        }
      : undefined,
  });

  async function onSaveDetails(data: DetailsValues) {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Company updated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update company");
    }
  }

  async function onSaveFeatures() {
    try {
      await featuresMutation.mutateAsync(currentFeatures);
      toast.success("Features saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save features");
    }
  }

  function toggleFeature(key: string) {
    setFeatures((prev) => ({
      ...(prev ?? company?.enabledFeatures ?? {}),
      [key]: !currentFeatures[key],
    }));
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!company) return <p className="text-gray-500">Company not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/companies"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader title={company.name} description={`/${company.slug}`}>
          <StatusBadge type="subscription" status={company.subscriptionStatus} />
        </PageHeader>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Users", value: company._count?.users ?? 0 },
          { label: "Vehicles", value: company._count?.vehicles ?? 0 },
          { label: "Bookings", value: company._count?.bookings ?? 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* Details tab */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Company Information</CardTitle>
              <CardDescription className="text-xs">
                Created {formatDate(company.createdAt)} · Login slug:{" "}
                <span className="font-mono">{company.slug}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSaveDetails)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="address" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="subscriptionStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subscription Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features tab */}
        <TabsContent value="features" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Enabled Features</CardTitle>
              <CardDescription className="text-xs">
                Control which features this company has access to.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {FEATURES.map((feature, i) => (
                <div key={feature.key}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <Label className="text-sm font-medium">{feature.label}</Label>
                      <p className="text-xs text-gray-500 mt-0.5">{feature.description}</p>
                    </div>
                    <Switch
                      checked={!!currentFeatures[feature.key]}
                      onCheckedChange={() => toggleFeature(feature.key)}
                    />
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-end pt-4">
                <Button onClick={onSaveFeatures} disabled={featuresMutation.isPending}>
                  {featuresMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
