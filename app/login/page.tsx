"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const schema = z.object({
  companySlug: z.string().optional(),
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<any>,
    defaultValues: { companySlug: "", email: "", password: "" },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        companySlug: isSuperadmin ? "" : (data.companySlug ?? ""),
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please check and try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 mb-4">
            <Car className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FleetMS</h1>
          <p className="text-sm text-gray-500 mt-1">Car Rental Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue</p>

          {/* Superadmin toggle */}
          <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
            <Label htmlFor="superadmin-toggle" className="text-sm text-gray-700 cursor-pointer">
              Sign in as superadmin
            </Label>
            <Switch
              id="superadmin-toggle"
              checked={isSuperadmin}
              onCheckedChange={(val) => {
                setIsSuperadmin(val);
                form.reset({ companySlug: "", email: "", password: "" });
              }}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!isSuperadmin && (
                <FormField
                  control={form.control}
                  name="companySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. safari-rentals"
                          autoComplete="organization"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
