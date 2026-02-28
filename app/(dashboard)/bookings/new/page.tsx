"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2, CalendarIcon } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInCalendarDays } from "date-fns";
import { useCreateBooking } from "@/lib/queries/bookings";
import { useVehicles } from "@/lib/queries/vehicles";
import { useCustomers } from "@/lib/queries/customers";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/format";
import { cn } from "@/lib/utils";

const schema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  vehicleId: z.string().min(1, "Select a vehicle"),
  startDate: z.date(),
  endDate: z.date(),
  notes: z.string().optional(),
}).refine((d) => d.endDate > d.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type FormValues = z.infer<typeof schema>;

export default function NewBookingPage() {
  const router = useRouter();
  const createMutation = useCreateBooking();
  const { data: vehicles } = useVehicles({ status: "available" });
  const { data: customers } = useCustomers();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  });

  const watchVehicleId = form.watch("vehicleId");
  const watchStart = form.watch("startDate");
  const watchEnd = form.watch("endDate");

  const selectedVehicle = vehicles?.find((v) => v.id === watchVehicleId);
  const days =
    watchStart && watchEnd
      ? Math.max(1, differenceInCalendarDays(watchEnd, watchStart))
      : 0;
  const totalAmount = selectedVehicle ? days * selectedVehicle.dailyRate : 0;

  async function onSubmit(data: FormValues) {
    try {
      await createMutation.mutateAsync({
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        totalAmount,
        notes: data.notes,
      });
      toast.success("Booking created");
      router.push("/bookings");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create booking");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bookings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <PageHeader title="New Booking" description="Create a rental booking" />
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} — {c.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="vehicleId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.year} {v.make} {v.model} ({v.licensePlate}) — {formatKES(v.dailyRate)}/day
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd MMM yyyy") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "dd MMM yyyy") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date <= (form.getValues("startDate") ?? new Date())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {totalAmount > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {days} day{days !== 1 ? "s" : ""} × {formatKES(selectedVehicle!.dailyRate)}/day
                    </span>
                    <span className="font-bold text-blue-700 text-base">
                      {formatKES(totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Textarea placeholder="Any notes..." rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Booking
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
