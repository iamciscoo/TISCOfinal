// UI-specific types for TanStack Tables

export type ProductColumn = {
  id: string | number;
  price: number;
  name: string;
  shortDescription: string;
  description: string;
  sizes: string[];
  colors: string[];
  images: Record<string, string>;
  stock_quantity?: number;
  is_featured?: boolean;
  is_active?: boolean;
  rating?: number;
  reviews_count?: number;
  view_count?: number;
  category?: {
    id: string | number;
    name: string;
    description: string;
  };
  categories?: Array<{
    category?: {
      id: string | number;
      name: string;
      description?: string;
    };
    id?: string | number;
    name?: string;
  }>;
};

export type OrderColumn = {
  id: string;
  customerId: string | null; // Nullable for guest orders
  customerName: string;
  customerEmail: string;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  items: number;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  currency?: string;
  shipping_amount?: number;
  tax_amount?: number;
  tracking_number?: string;
  notes?: string;
};

export type UserColumn = {
  id: string | null; // Nullable to match User interface
  avatar: string;
  fullName: string;
  email: string;
  status: "active" | "inactive";
  phone?: string;
  date_of_birth?: string;
  is_admin?: boolean;
  last_login?: string;
  created_at?: string;
};
