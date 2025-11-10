"use client";

import {
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
// Removed unused Select imports
import { Button } from "./ui/button";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters!" })
    .max(50),
  email: z.string().email({ message: "Invalid email address!" }),
  phone: z.string().min(10).max(15),
  address: z.string().min(2),
  city: z.string().min(2),
});

type EditUserProps = {
  userId: string;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
};

const EditUser = ({ userId, defaultValues }: EditUserProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: defaultValues?.fullName ?? "John Doe",
      email: defaultValues?.email ?? "john.doe@gmail.com",
      phone: defaultValues?.phone ?? "+1 234 5678",
      address: defaultValues?.address ?? "123 Main St",
      city: defaultValues?.city ?? "New York",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const parts = values.fullName.trim().split(/\s+/);
    const first_name = parts.shift() || "";
    const last_name = parts.length ? parts.join(" ") : null;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          phone: values.phone,
          first_name,
          last_name,
          // address fields for default shipping address update
          address_line_1: values.address,
          city: values.city,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || "Failed to update user");
      }
      toast({ title: "User updated", description: "Changes saved successfully" });
      window.location.reload();
    } catch (e) {
      console.error("Update user failed", e);
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  }
  return (
    <SheetContent aria-describedby={undefined} className="flex flex-col p-0">
      <SheetHeader className="px-4 py-3 border-b shrink-0">
        <SheetTitle className="text-base sm:text-lg">Edit User</SheetTitle>
      </SheetHeader>
      
      {/* Scrollable Form Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="name" className="h-9" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter user full name.
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} className="h-9" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Only admin can see your email.
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" {...field} className="h-9" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Only admin can see your phone number (optional)
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Address</FormLabel>
                  <FormControl>
                    <Input autoComplete="street-address" {...field} className="h-9" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter user address (optional)
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">City</FormLabel>
                  <FormControl>
                    <Input autoComplete="address-level2" {...field} className="h-9" />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter user city (optional)
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      
      {/* Fixed Footer with Save Button */}
      <div className="border-t px-4 py-3 shrink-0 bg-white">
        <Button 
          type="submit" 
          disabled={form.formState.isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
          className="w-full h-9 text-sm"
        >
          {form.formState.isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </SheetContent>
  );
};

export default EditUser;
