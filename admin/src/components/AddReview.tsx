"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SearchSelect } from "@/components/SearchSelect";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddReviewProps {
  onCreated?: () => void;
}

interface AdminUserOption {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface AdminProductOption {
  id: string;
  name: string;
  price?: number | null;
}

const formSchema = z.object({
  product_id: z.string().min(1, { message: "Select a product" }),
  user_id: z.string().optional().or(z.literal('')),
  reviewer_name: z.string().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional().or(z.literal('')),
  comment: z.string().optional().or(z.literal('')),
});

const AddReview = ({ onCreated }: AddReviewProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product_id: "",
      user_id: "",
      reviewer_name: "",
      rating: 5,
      title: "",
      comment: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    
    console.log('🎯 Admin Review Form - Submitting:', {
      product_id: values.product_id,
      user_id: values.user_id || 'EMPTY',
      reviewer_name: values.reviewer_name || 'EMPTY',
      rating: values.rating,
      title: values.title || 'EMPTY',
      comment: values.comment || 'EMPTY'
    });
    
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json().catch(() => ({}));
      
      console.log('📡 API Response:', { 
        status: res.status, 
        ok: res.ok, 
        error: json?.error 
      });
      
      if (!res.ok) throw new Error(json?.error || "Failed to create review");

      toast({ title: "Review created", description: "Review published successfully." });
      form.reset({ product_id: "", user_id: "", reviewer_name: "", rating: 5, title: "", comment: "" });
      onCreated?.();
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const userLabel = (u: AdminUserOption) =>
    `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email;

  return (
    <SheetContent aria-describedby={undefined} className="px-4 sm:px-6">
      <SheetHeader>
        <SheetTitle className="mb-4">Add Review</SheetTitle>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 mt-4">
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <SearchSelect<AdminProductOption>
                      value={field.value}
                      onChange={field.onChange}
                      fetchUrl="/api/products"
                      placeholder="Search products..."
                      itemToOption={(p) => ({ id: p.id, label: p.name })}
                      limit={10}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User (Optional)</FormLabel>
                    <SearchSelect<AdminUserOption>
                      value={field.value || ""}
                      onChange={field.onChange}
                      fetchUrl="/api/users"
                      placeholder="Search users..."
                      itemToOption={(u) => ({ id: u.id, label: `${userLabel(u)} (${u.email})` })}
                      limit={10}
                      buttonClassName="w-full justify-between"
                    />
                    <FormDescription>
                      Select a registered user or leave empty to add a guest review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reviewer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reviewer Name (Optional if user selected)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter reviewer's name for guest review" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Only required if no user is selected above. Must provide either a user OR a reviewer name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Validation hint */}
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <p className="font-medium">📝 Note:</p>
                <p className="mt-1">
                  You must either <strong>select a user</strong> from the system OR <strong>enter a reviewer name</strong> for guest reviews.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <Input 
                        type="number" 
                        min={1} 
                        max={5} 
                        step={1} 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (optional)</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Review"}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
};

export default AddReview;
