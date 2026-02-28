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
import type { Vehicle } from "@/lib/queries/vehicles";

const schema = z.object({
  make: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z.coerce.number().int().min(1980).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  dailyRate: z.coerce.number().positive("Must be positive"),
  color: z.string().optional(),
  mileage: z.coerce.number().nonnegative().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  seats: z.coerce.number().int().min(1).max(20).optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<Vehicle>;
  onSubmit: (data: VehicleFormValues) => void;
  loading?: boolean;
  showStatus?: boolean;
}

export function VehicleForm({ defaultValues, onSubmit, loading, showStatus }: Props) {
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(schema) as Resolver<VehicleFormValues>,
    defaultValues: {
      make: defaultValues?.make ?? "",
      model: defaultValues?.model ?? "",
      year: defaultValues?.year ?? new Date().getFullYear(),
      licensePlate: defaultValues?.licensePlate ?? "",
      category: defaultValues?.category ?? "",
      dailyRate: defaultValues?.dailyRate ?? 0,
      color: defaultValues?.color ?? "",
      mileage: defaultValues?.mileage ?? undefined,
      fuelType: defaultValues?.fuelType ?? "",
      transmission: defaultValues?.transmission ?? "",
      seats: defaultValues?.seats ?? undefined,
      notes: defaultValues?.notes ?? "",
      status: defaultValues?.status ?? "available",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="make" render={({ field }) => (
            <FormItem>
              <FormLabel>Make</FormLabel>
              <FormControl><Input placeholder="Toyota" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="model" render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <FormControl><Input placeholder="Land Cruiser" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="year" render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={form.control} name="licensePlate" render={({ field }) => (
            <FormItem>
              <FormLabel>License Plate</FormLabel>
              <FormControl><Input placeholder="KAA 123A" className="uppercase" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["economy", "compact", "midsize", "suv", "luxury", "van", "truck"].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="dailyRate" render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Rate (KES)</FormLabel>
              <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="color" render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl><Input placeholder="White" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="mileage" render={({ field }) => (
            <FormItem>
              <FormLabel>Mileage (km)</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={form.control} name="fuelType" render={({ field }) => (
            <FormItem>
              <FormLabel>Fuel Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {["petrol", "diesel", "hybrid", "electric"].map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="transmission" render={({ field }) => (
            <FormItem>
              <FormLabel>Transmission</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="seats" render={({ field }) => (
            <FormItem>
              <FormLabel>Seats</FormLabel>
              <FormControl><Input type="number" placeholder="5" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {showStatus && (
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Textarea placeholder="Optional notes..." rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Vehicle
          </Button>
        </div>
      </form>
    </Form>
  );
}
