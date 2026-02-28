"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Customer } from "@/lib/queries/customers";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  type: z.string(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Customer>;
  onSubmit: (data: CustomerFormValues) => void;
  loading?: boolean;
}

export function CustomerForm({ defaultValues, onSubmit, loading }: Props) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema) as Resolver<CustomerFormValues>,
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      phone: defaultValues?.phone ?? "",
      email: defaultValues?.email ?? "",
      idType: defaultValues?.idType ?? "",
      idNumber: defaultValues?.idNumber ?? "",
      type: defaultValues?.type ?? "individual",
      address: defaultValues?.address ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl><Input placeholder="John" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl><Input placeholder="Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input placeholder="+254 700 000 000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="idType" render={({ field }) => (
            <FormItem>
              <FormLabel>ID Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="driving_license">Driving License</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="idNumber" render={({ field }) => (
            <FormItem>
              <FormLabel>ID Number</FormLabel>
              <FormControl><Input placeholder="12345678" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Address (optional)</FormLabel>
            <FormControl><Input placeholder="Nairobi, Kenya" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (optional)</FormLabel>
            <FormControl><Textarea placeholder="Any additional notes..." rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Customer
          </Button>
        </div>
      </form>
    </Form>
  );
}
