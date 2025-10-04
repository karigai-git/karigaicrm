// PocketBase Schema Types

import { RecordModel } from 'pocketbase';

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

export interface User extends BaseRecord {
  email: string;
  name: string;
  avatar?: string;
  emailVisibility: boolean;
  verified: boolean;
}

export interface Product extends BaseRecord {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: string;
  images?: string[];
  category?: string;
  status: 'active' | 'inactive';
  // Extended product fields from the sample JSON
  colors?: string;
  features?: string;
  dimensions?: string;
  material?: string;
  care?: string;
  tags?: string;
  bestseller?: boolean;
  new?: boolean;
  inStock?: boolean;
  review?: number;
  specifications?: string;
  care_instructions?: string;
  usage_guidelines?: string;
  // Newly added optional fields
  list_order?: number;
  original_price?: number;
  qikink_sku?: string;
  print_type_id?: number;
  product_type?: string;
  available_colors?: string;
  available_sizes?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDescription?: string;
}

export interface Coupon extends BaseRecord {
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  valid_until: string;
  max_uses?: number;
  used_count: number;
}

export interface Order extends BaseRecord {
  id: string;
  user: string[]; // This seems to be the user ID
  status: 'pending' | 'processing' | 'dispatched' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  products: string; // This seems to be a summary string
  totalAmount: number;
  subtotal: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  coupon_code?: string;
  coupon_id?: string;
  discount_amount?: number;
  shipping_address_text?: string;
  tracking_link?: string;
  shipping_carrier?: string;
  refund_amount?: number;

  // Fields that were causing errors, added based on component usage
  shipping_fee?: number;
  tax?: number;
  discount?: number;
  user_name: string; // This seems redundant with customer_name
  user_email: string; // This seems redundant with customer_email
  payment_method: string;
  payment_id?: string;

  expand?: {
    user?: User[];
    coupon_id?: Coupon;
    items?: OrderItem[];
    shipping_address?: Address;
  };
}

export interface OrderItem extends BaseRecord {
  id: string; // Added id based on component usage
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  name: string; // Added name based on component usage
  image: string; // Added image based on component usage
  expand?: {
    product_id?: Product;
  };
}

export interface Address extends BaseRecord {
  user_id: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  expand?: {
    user_id?: User;
  };
}

export interface RazorpayOrder extends BaseRecord {
  order_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  payment_id?: string;
  signature?: string;
  expand?: {
    order_id?: Order;
  };
}

// Create data types
export type CreateProductData = {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  image?: string;
  images?: string[];
  category?: string;
  status: 'active' | 'inactive';
  collectionId?: string;
  collectionName?: string;
  colors?: string;
  features?: string;
  dimensions?: string;
  material?: string;
  care?: string;
  tags?: string;
  bestseller?: boolean;
  new?: boolean;
  inStock?: boolean;
  review?: number;
  specifications?: string;
  care_instructions?: string;
  usage_guidelines?: string;
  // Newly added optional fields
  list_order?: number;
  original_price?: number;
  qikink_sku?: string;
  print_type_id?: number;
  product_type?: string;
  available_colors?: string;
  available_sizes?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDescription?: string;
};

export type CreateOrderData = {
  user: string[];
  status: 'pending' | 'processing' | 'dispatched' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  products: string;
  totalAmount: number;
  subtotal: number;
  total: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  coupon_code?: string;
  coupon_id?: string;
  discount_amount?: number;
  shipping_address_text?: string;
};

export type CreateRazorpayOrderData = {
  order_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed';
  payment_id?: string;
  signature?: string;
};

// Update data types
export type UpdateProductData = Partial<Omit<Product, keyof BaseRecord>>;

export type UpdateOrderData = Partial<CreateOrderData> & {
  status?: 'pending' | 'processing' | 'dispatched' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_link?: string;
  shipping_carrier?: string;
  refund_amount?: number;
  whatsapp_status?: 'pending' | 'sent' | 'failed';
  whatsapp_message_id?: string;
  whatsapp_error_message?: string;
};

export type UpdateRazorpayOrderData = Partial<Omit<RazorpayOrder, keyof BaseRecord>>;
