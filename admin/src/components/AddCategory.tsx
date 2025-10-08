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
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { useAdminActions } from "@/lib/admin-utils";

const formSchema = z.object({
  name: z.string().min(1, { message: "Category name is required!" }),
  description: z.string().optional(),
});

const AddCategory = () => {
  const [loading, setLoading] = useState(false);
  const { handleCreate } = useAdminActions();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await handleCreate("/api/categories", values, "Category", () => {
        form.reset();
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <SheetContent aria-describedby={undefined} className="px-4 sm:px-6">
      <SheetHeader>
        <SheetTitle className="mb-4">Add Category</SheetTitle>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 mt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Enter category name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>Enter category description.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </Form>
    </SheetContent>
  );
};

export default AddCategory;
