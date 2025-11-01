import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@/types/schema";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useWhatsAppActivities } from "@/hooks/useWhatsAppActivities";
import { WhatsAppActivities } from "@/components/orders/WhatsAppActivities";
import { SendWhatsAppMessage } from "@/components/orders/SendWhatsAppMessage";
import { MessageSquare, Printer, PencilLine, Check, X, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrders } from "@/hooks/useOrders";
import { getImageUrl as pbGetImageUrl, pb } from "@/lib/pocketbase";

// ===== Types =====
export type BadgeVariant = "default" | "destructive" | "outline" | "secondary" | "success" | "warning";

interface ViewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

interface ProductItem {
  productId: string;
  quantity: number;
  color?: string;
  product: {
    id: string;
    name: string;
    price: number;
    images?: string[];
    description?: string;
    category?: string;
  };
}

export function ViewOrderDialog({ open, onOpenChange, order }: ViewOrderDialogProps) {
  const queryClient = useQueryClient();
  const { updateOrder, deleteOrder } = useOrders();

  const orderStatusVariant: Record<string, BadgeVariant> = {
    pending: "warning",
    processing: "secondary",
    shipped: "secondary",
    out_for_delivery: "secondary",
    delivered: "success",
    cancelled: "destructive",
  };

  const paymentStatusVariant: Record<string, BadgeVariant> = {
    pending: "secondary",
    paid: "success",
    failed: "destructive",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    shipping_address_text: "",
    notes: "",
    status: "pending",
    payment_status: "pending",
  });
  
  // Products normalizer + fallback fetch by product_id
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [byId, setById] = useState<Record<string, any>>({});

  useEffect(() => {
    if (order) {
      setForm({
        customer_name: order.customer_name || "",
        customer_email: order.customer_email || "",
        customer_phone: order.customer_phone || "",
        shipping_address_text: order.shipping_address_text || "",
        notes: order.notes || "",
        status: order.status || "pending",
        payment_status: order.payment_status || "pending",
      });
      
      // Parse products when order changes
      const parsedProducts = parseProducts(order);
      setRawRows(parsedProducts);
      
      // Fetch products by ID
      const ids = Array.from(new Set(parsedProducts.map(r => (r as any).product_id).filter(Boolean))) as string[];
      if (ids.length > 0) {
        fetchProducts(ids);
      }
    }
  }, [order]);

  const handleSave = () => {
    updateOrder.mutate({
      id: order.id,
      data: {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        shipping_address_text: form.shipping_address_text,
        notes: form.notes,
        status: form.status as any,
        payment_status: form.payment_status as any,
      },
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!order) return;
    const ok = window.confirm("Delete this order? This action cannot be undone.");
    if (!ok) return;
    deleteOrder.mutate(order.id, {
      onSuccess: () => {
        onOpenChange(false);
        // orders list invalidation handled inside hook
      },
    });
  };

  // ===== Address formatter =====
  const formatShippingAddress = (): string => {
    try {
      const txt = (order.shipping_address_text || "").trim();
      if (txt && !(txt.startsWith("{") && txt.endsWith("}"))) return txt;
      const raw = (order as any).shipping_address as unknown;
      let obj: any = null;
      if (raw && typeof raw === "object") obj = raw;
      else if (typeof raw === "string" && raw.trim()) obj = JSON.parse(raw);
      else if (txt) {
        try { obj = JSON.parse(txt); } catch {}
      }
      if (!obj) return txt || "No address provided";
      const parts: string[] = [];
      const line1 = [obj.street, obj.address1, obj.address_line1].find(Boolean);
      const line2 = [obj.address2, obj.address_line2, obj.area, obj.locality, obj.landmark].filter(Boolean).join(", ");
      const city = obj.city || obj.district;
      const state = obj.state;
      const pin = obj.postalCode || obj.postal_code || obj.zip || obj.pincode;
      const country = obj.country;
      const name = obj.name || obj.recipient;
      const phone = obj.phone || obj.mobile;
      if (name) parts.push(String(name));
      if (line1) parts.push(String(line1));
      if (line2) parts.push(String(line2));
      const cityState = [city, state].filter(Boolean).join(", ");
      if (cityState) parts.push(cityState);
      if (pin) parts.push(String(pin));
      if (country) parts.push(String(country));
      if (phone) parts.push(`Phone: ${phone}`);
      return parts.filter(Boolean).join("\n");
    } catch (e) {
      console.error("Failed to format shipping address", e);
      return order.shipping_address_text || "No address provided";
    }
  };

  // ===== Products normalizer helper function =====
  type RawRow = Partial<{ product_id: string; quantity: number; price: number; name?: string; product?: any }>
  const parseProducts = (orderData: Order | null): RawRow[] => {
    if (!orderData) return [];
    try {
      const raw = orderData.products as any;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw as RawRow[];
      if (typeof raw === "object") return [raw as RawRow];
      if (typeof raw === "string") {
        let s = raw.trim();
        if (s === "[object Object]") return [];
        // If quoted string, try to JSON.parse once to unwrap
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
          try { s = JSON.parse(s); } catch { s = s.slice(1, -1); }
        }
        // Collapse CSV-doubled quotes
        if (/""/.test(s)) s = s.replace(/""/g, '"');
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? (arr as RawRow[]) : [];
      }
      return [];
    } catch (e) {
      console.error("Failed to parse products", e, orderData.products);
      return [];
    }
  };
  
  // Helper function to fetch products by IDs
  const fetchProducts = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      const fetched: Record<string, any> = {};
      await Promise.all(ids.map(async (id) => {
        try {
          const rec = await pb.collection('products').getOne(id);
          fetched[id] = rec;
        } catch (e) {
          console.warn('Failed to fetch product', id, e);
        }
      }));
      setById(prev => ({ ...prev, ...fetched }));
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  };

  const products: ProductItem[] = useMemo(() => {
    // If existing structure already provided with product object, trust it
    if (order && Array.isArray((order as any).products) && (order as any).products.every((r: any) => r?.product)) {
      return (order as any).products as ProductItem[];
    }
    return rawRows.map((r) => ({
      productId: String(r.product_id || ''),
      quantity: Number(r.quantity || 0),
      product: byId[String(r.product_id || '')] || {
        id: r.product_id,
        name: (r as any).name || 'Unknown Product',
        price: Number(r.price || 0),
        images: [],
      },
    })) as ProductItem[];
  }, [rawRows, byId, order]);

  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try { return formatDate(dateString); } catch { return dateString; }
  };

  const productImageUrl = (record: any, fileName?: string) => {
    const placeholder = "https://placehold.co/200x200/e2e8f0/64748b?text=No+Image";
    if (!fileName) return placeholder;
    // If already a full URL, use as-is
    if (typeof fileName === "string" && /^https?:\/\//i.test(fileName)) return fileName;
    // PocketBase accepts collection id or name in the files URL
    const cid = record?.collectionId || record?.collectionName || record?.collection || "products";
    const rid = record?.id || record?.productId;
    if (cid && rid) {
      let fname = String(fileName);
      // Normalize values like "<recordId>/<filename>" to just "<filename>"
      if (fname.startsWith(`${String(rid)}/`)) {
        fname = fname.slice(String(rid).length + 1);
      }
      return pbGetImageUrl(String(cid), String(rid), fname);
    }
    // Fallback
    return placeholder;
  };

  const resolveProductImageFileName = (p: any): string | undefined => {
    try {
      if (!p) return undefined;
      if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
      if (typeof p.images === "string" && p.images) return p.images as string;
      if (typeof (p as any).image === "string" && (p as any).image) return (p as any).image as string;
      return undefined;
    } catch { return undefined; }
  };

  // ===== Shipping fee (robust derivation) =====
  const shippingFee = (() => {
    if (!order) return 0;
    const rec = (order as unknown as Record<string, unknown>) || {};
    const raw = (rec["shipping_fee"] ?? rec["shipping_cost"] ?? rec["shippingCost"] ?? 0) as unknown;
    const num = typeof raw === "string" ? parseFloat(raw) : Number(raw);
    return Number.isFinite(num) ? num : 0;
  })();

  // ===== UI =====
  if (!order) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-dvh max-w-full sm:max-w-3xl sm:h-[90vh] rounded-none sm:rounded-xl p-0 overflow-hidden flex flex-col">
        {/* Sticky header with compact summary */}
        <DialogHeader className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="truncate">
                Order <span className="text-muted-foreground">#{order.id.slice(0, 8)}</span>
                <Badge variant={orderStatusVariant[form.status] || "outline"} className="ml-2 align-middle">
                  {form.status.replace(/_/g, " ")}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Created on {safeFormatDate(order.created)} • Total ₹{order.total?.toFixed(2) || "0.00"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge variant={paymentStatusVariant[form.payment_status] || "outline"} className="px-2 py-1 text-xs">
                Payment: {form.payment_status.replace(/^(.)/, (c) => c.toUpperCase())}
              </Badge>
              {/* Delete Order */}
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleteOrder.isPending}>
                <Trash2 className="h-4 w-4 mr-1" /> {deleteOrder.isPending ? "Deleting..." : "Delete"}
              </Button>
              {!isEditing ? (
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <PencilLine className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setForm({
                    customer_name: order.customer_name || "",
                    customer_email: order.customer_email || "",
                    customer_phone: order.customer_phone || "",
                    shipping_address_text: order.shipping_address_text || "",
                    notes: order.notes || "",
                    status: order.status || "pending",
                    payment_status: order.payment_status || "pending",
                  }); }}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
          <div className="px-3 pt-3 sm:px-6">
            <TabsList className="w-full justify-start flex-wrap gap-2">
              <TabsTrigger value="details" className="text-sm">Details</TabsTrigger>
              <TabsTrigger value="products" className="text-sm">Products</TabsTrigger>
              <TabsTrigger value="payment" className="text-sm">Payment</TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-sm flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> WhatsApp
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="sm:flex-1 px-3 sm:px-6 pb-24">
            {/* DETAILS */}
            <TabsContent value="details" className="space-y-3 sm:space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="px-4 py-3 sm:px-5">
                    <CardTitle className="text-base sm:text-lg">Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4 sm:px-5">
                    <div>
                      <Label className="font-semibold">Name</Label>
                      {isEditing ? (
                        <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                      ) : (
                        <p>{form.customer_name}</p>
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Email</Label>
                      {isEditing ? (
                        <Input type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                      ) : (
                        <p className="break-words">{form.customer_email}</p>
                      )}
                    </div>
                    <div>
                      <Label className="font-semibold">Phone</Label>
                      {isEditing ? (
                        <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
                      ) : (
                        <p className="break-words">{form.customer_phone || "Not provided"}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <Label className="font-semibold">Status</Label>
                        {isEditing ? (
                          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div>
                            <Badge variant={orderStatusVariant[form.status] || "outline"}>{form.status.replace(/_/g, " ")}</Badge>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="font-semibold">Payment</Label>
                        {isEditing ? (
                          <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div>
                            <Badge variant={paymentStatusVariant[form.payment_status] || "outline"}>{form.payment_status}</Badge>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label className="font-semibold">Tracking</Label>
                        <div className="text-sm mt-1 space-x-2">
                          <span>
                            Code: {((order as any).tracking_code as string) || "—"}
                          </span>
                          {((order as any).tracking_url as string) ? (
                            <a
                              href={(order as any).tracking_url as string}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-blue-600 underline"
                            >
                              View Tracking
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="px-4 py-3 sm:px-5">
                    <CardTitle className="text-base sm:text-lg">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-5">
                    {isEditing ? (
                      <Textarea rows={6} value={form.shipping_address_text} onChange={(e) => setForm({ ...form, shipping_address_text: e.target.value })} />
                    ) : (
                      <p className="whitespace-pre-line break-words">{formatShippingAddress()}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="px-4 py-3 sm:px-5">
                    <CardTitle className="text-base sm:text-lg">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-5">
                    {isEditing ? (
                      <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    ) : (
                      <p className="whitespace-pre-line break-words">{form.notes || "No notes provided"}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PRODUCTS */}
            <TabsContent value="products" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length > 0 ? (
                    <div className="space-y-6">
                      {products.map((product, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b pb-4">
                          <div className="md:col-span-1 block mb-3 md:mb-0">
                            <div className="w-full max-w-[150px] mx-auto">
                              <AspectRatio ratio={1 / 1} className="bg-muted rounded-md overflow-hidden">
                                <img
                                  src={productImageUrl(product.product, resolveProductImageFileName(product.product))}
                                  alt={product.product?.name}
                                  className="object-cover w-full h-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "https://placehold.co/200x200/e2e8f0/64748b?text=No+Image";
                                  }}
                                />
                              </AspectRatio>
                            </div>
                          </div>
                          <div className="md:col-span-3 flex flex-col justify-between">
                            <div>
                              <h4 className="font-medium text-base">{product.product?.name || (product as any).name || "Unknown Product"}</h4>
                              {product.color && (
                                <span className="text-sm text-muted-foreground">Color: {product.color}</span>
                              )}
                              {product.product?.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.product.description}</p>
                              )}
                            </div>
                            <div className="grid grid-cols-3 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Qty</span>
                                <p className="font-medium">{product.quantity}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price</span>
                                <p className="font-medium">₹{((product.product?.price ?? (product as any).price ?? 0) as number).toFixed(2)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Subtotal</span>
                                <p className="font-medium">₹{(((product.product?.price ?? (product as any).price ?? 0) as number) * (product.quantity || 0)).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between"><span className="font-medium">Subtotal:</span><span>₹{order.subtotal?.toFixed(2) || "0.00"}</span></div>
                        <div className="flex justify-between"><span className="font-medium">Shipping:</span><span>₹{shippingFee.toFixed(2)}</span></div>
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600"><span className="font-medium">Discount:</span><span>-₹{order.discount_amount.toFixed(2)}</span></div>
                        )}
                        <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>₹{order.total?.toFixed(2) || "0.00"}</span></div>
                      </div>
                    </div>
                  ) : (
                    <p>No product information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYMENT */}
            <TabsContent value="payment" className="pt-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="font-semibold">Payment Status</Label>
                      <div>
                        <Badge variant={paymentStatusVariant[order.payment_status] || "outline"}>
                          {order.payment_status.replace(/^(.)/, (c) => c.toUpperCase())}
                        </Badge>
                      </div>
                    </div>
                    {order.coupon_code && (
                      <div>
                        <Label className="font-semibold">Coupon</Label>
                        <p>{order.coupon_code}</p>
                      </div>
                    )}
                    <div>
                      <Label className="font-semibold">Razorpay Order ID</Label>
                      <p>{order.razorpay_order_id || "—"}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Razorpay Payment ID</Label>
                      <p>{order.razorpay_payment_id || "—"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>₹{order.subtotal?.toFixed(2) || "0.00"}</span></div>
                    <div className="flex justify-between"><span>Shipping:</span><span>₹{shippingFee.toFixed(2)}</span></div>
                    {order.discount_amount && order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600"><span>Discount:</span><span>-₹{order.discount_amount.toFixed(2)}</span></div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold"><span>Total Amount:</span><span>₹{order.total?.toFixed(2) || "0.00"}</span></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WHATSAPP */}
            <TabsContent value="whatsapp" className="pt-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Send WhatsApp Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <SendWhatsAppMessage
                    order={order}
                    onMessageSent={() => {
                      queryClient.invalidateQueries({ queryKey: ["whatsapp_activities", order.id] });
                    }}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Message History</CardTitle>
                </CardHeader>
                <CardContent>
                  <WhatsAppActivitiesTab orderId={order.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Sticky footer actions (mobile-friendly) */}
        <div className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur px-4 py-3 sm:px-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button>
            <Printer className="mr-2 h-4 w-4" /> Print Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WhatsAppActivitiesTab({ orderId }: { orderId: string }) {
  const { activities, isLoading } = useWhatsAppActivities(orderId);
  return <WhatsAppActivities activities={activities} isLoading={isLoading} orderId={orderId} />;
}
