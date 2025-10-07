"use client";

import {
  SheetContent,
  SheetDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface AddOrderProps {
  onOpenChange?: (open: boolean) => void;
}

const formSchema = z.object({
  customer_type: z.enum(["registered", "guest"]),
  user_id: z.string().optional(),
  guest_name: z.string().optional(),
  guest_email: z.string().email().optional().or(z.literal("")),
  guest_phone: z.string().optional(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  payment_method: z.enum(["mobile_money", "pay_at_office"]),
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]),
  shipping_address: z.string().min(1, { message: "Shipping address is required!" }),
  notes: z.string().optional(),
  order_items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().min(1),
    price: z.number(),
  })).min(1, { message: "At least one product is required!" }),
}).refine((data) => {
  if (data.customer_type === "registered") {
    return !!data.user_id;
  } else {
    return !!data.guest_name && !!data.guest_phone;
  }
}, {
  path: ["user_id"],
});

const AddOrder = ({ onOpenChange }: AddOrderProps = {}) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Track sheet open state
  useEffect(() => {
    setIsOpen(true);
    onOpenChange?.(true);
    return () => onOpenChange?.(false);
  }, [onOpenChange]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_type: "registered",
      user_id: "",
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      status: "pending",
      payment_method: "mobile_money",
      payment_status: "pending",
      shipping_address: "",
      notes: "",
      order_items: [],
    },
  });
  
  const customerType = form.watch("customer_type");
  const orderItems = form.watch("order_items");
  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Only fetch data when sheet is opened - performance optimization
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      try {
        const [usersRes, productsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/products")
        ]);
        
        const usersJson = await usersRes.json();
        const productsJson = await productsRes.json();
        
        if (usersRes.ok) {
          setUsers(usersJson.data || []);
        }
        
        if (productsRes.ok) {
          setProducts(productsJson.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        });
      }
    };
    fetchData();
  }, [isOpen, toast]);
  
  const addOrderItem = () => {
    const currentItems = form.getValues("order_items");
    form.setValue("order_items", [
      ...currentItems,
      { product_id: "", quantity: 1, price: 0 },
    ]);
  };
  
  const removeOrderItem = (index: number) => {
    const currentItems = form.getValues("order_items");
    form.setValue("order_items", currentItems.filter((_, i) => i !== index));
  };
  
  const updateOrderItem = (index: number, field: string, value: string | number) => {
    const currentItems = form.getValues("order_items");
    const updatedItems = [...currentItems];
    
    if (field === "product_id") {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index] = {
          ...updatedItems[index],
          product_id: value as string,
          price: selectedProduct.price,
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
    }
    
    form.setValue("order_items", updatedItems);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Calculate total amount from order items
      const calculatedTotal = values.order_items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
      
      // Prepare order payload
      const orderPayload = {
        user_id: values.customer_type === "registered" ? values.user_id : null,
        customer_name: values.customer_type === "guest" ? values.guest_name : null,
        customer_email: values.customer_type === "guest" ? values.guest_email : null,
        customer_phone: values.customer_type === "guest" ? values.guest_phone : null,
        status: values.status,
        payment_method: values.payment_method,
        payment_status: values.payment_status,
        shipping_address: values.shipping_address,
        notes: values.notes,
        total_amount: calculatedTotal,
        currency: "TZS",
      };
      
      // Create order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to create order");
      
      const orderId = json.data?.id;
      
      // Create order items
      if (orderId && values.order_items.length > 0) {
        const itemsPayload = values.order_items.map(item => ({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));
        
        // Insert order items (you'll need to create this endpoint)
        await fetch("/api/orders/" + orderId + "/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsPayload }),
        });
      }

      toast({
        title: "Success",
        description: `Order created successfully! Total: TZS ${calculatedTotal.toLocaleString()}`,
      });
      form.reset();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <SheetContent className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="mb-4">Add Order</SheetTitle>
        <SheetDescription asChild>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Type Selection */}
              <FormField
                control={form.control}
                name="customer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registered">Registered Customer</SelectItem>
                          <SelectItem value="guest">Guest Customer</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Choose if this is a registered or guest customer.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Registered Customer Selection */}
              {customerType === "registered" && (
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => {
                              const fullName = [user.first_name || "", user.last_name || ""]
                                .filter(Boolean)
                                .join(" ") || user.email;
                              return (
                                <SelectItem key={user.id} value={user.id}>
                                  {fullName} ({user.email})
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        Select the registered customer for this order.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Guest Customer Fields */}
              {customerType === "guest" && (
                <>
                  <FormField
                    control={form.control}
                    name="guest_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormDescription>
                          Full name of the guest customer.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guest_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+255..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Contact phone number (required for guest orders).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guest_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email address for order notifications.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Order Items Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Order Items</h3>
                  <Button type="button" size="sm" onClick={addOrderItem} variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                  </Button>
                </div>
                
                {orderItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No products added yet. Click "Add Product" to start.</p>
                )}

                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start border p-3 rounded-md bg-muted/50">
                    <div className="flex-1 space-y-2">
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateOrderItem(index, "product_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - TZS {product.price.toLocaleString()} (Stock: {product.stock_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, "quantity", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            value={`TZS ${(item.price * item.quantity).toLocaleString()}`}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      onClick={() => removeOrderItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {orderItems.length > 0 && (
                  <div className="flex justify-between items-center font-semibold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>TZS {totalAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mobile_money">Mobile Money (M-Pesa, Tigo Pesa, Airtel Money)</SelectItem>
                          <SelectItem value="pay_at_office">Pay at Office</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select the payment method for this order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                          <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select the payment status.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Status</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Select the order status.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipping_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter the shipping address for this order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>
                      Add any additional notes for this order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Order"}
              </Button>
            </form>
          </Form>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddOrder;
