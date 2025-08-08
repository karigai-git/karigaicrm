import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types/schema';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useWhatsAppActivities } from '@/hooks/useWhatsAppActivities';
import { WhatsAppActivities } from '@/components/orders/WhatsAppActivities';
import { SendWhatsAppMessage } from '@/components/orders/SendWhatsAppMessage';
import { MessageSquare, Mail } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEmailActivities } from '@/hooks/useEmailActivities';
import { EmailActivities } from '@/components/orders/EmailActivities';
import { SendEmailMessage } from '@/components/orders/SendEmailMessage';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrders } from '@/hooks/useOrders';
import { getImageUrl as pbGetImageUrl } from '@/lib/pocketbase';

type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning';

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
  const { updateOrder } = useOrders();

  const orderStatusVariant: Record<string, BadgeVariant> = {
    pending: 'warning',
    processing: 'secondary',
    shipped: 'secondary',
    out_for_delivery: 'secondary',
    delivered: 'success',
    cancelled: 'destructive'
  };

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address_text: '',
    notes: '',
    status: 'pending',
    payment_status: 'pending',
  });

  useEffect(() => {
    if (order) {
      setForm({
        customer_name: order.customer_name || '',
        customer_email: order.customer_email || '',
        customer_phone: order.customer_phone || '',
        shipping_address_text: order.shipping_address_text || '',
        notes: order.notes || '',
        status: order.status || 'pending',
        payment_status: order.payment_status || 'pending',
      });
    }
  }, [order]);

  if (!order) return null;

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

  // Format shipping address from either plain text or JSON
  const formatShippingAddress = (): string => {
    try {
      // Prefer plain text if it doesn't look like JSON
      const txt = (order.shipping_address_text || '').trim();
      if (txt && !(txt.startsWith('{') && txt.endsWith('}'))) return txt;

      // Try shipping_address object/string
      const raw = (order as any).shipping_address as unknown;
      let obj: any = null;

      if (raw && typeof raw === 'object') obj = raw;
      else if (typeof raw === 'string' && raw.trim()) obj = JSON.parse(raw);
      else if (txt) {
        // shipping_address_text might actually contain JSON
        try { obj = JSON.parse(txt); } catch {}
      }

      if (!obj) return txt || 'No address provided';

      const parts: string[] = [];
      const line1 = [obj.street, obj.address1, obj.address_line1].find(Boolean);
      const line2 = [obj.address2, obj.address_line2, obj.area, obj.locality, obj.landmark].filter(Boolean).join(', ');
      const city = obj.city || obj.district;
      const state = obj.state;
      const pin = obj.postalCode || obj.postal_code || obj.zip || obj.pincode;
      const country = obj.country;
      const name = obj.name || obj.recipient;
      const phone = obj.phone || obj.mobile;

      if (name) parts.push(String(name));
      if (line1) parts.push(String(line1));
      if (line2) parts.push(String(line2));
      const cityState = [city, state].filter(Boolean).join(', ');
      if (cityState) parts.push(cityState);
      if (pin) parts.push(String(pin));
      if (country) parts.push(String(country));
      if (phone) parts.push(`Phone: ${phone}`);

      return parts.filter(Boolean).join('\n');
    } catch (e) {
      console.error('Failed to format shipping address', e);
      return order.shipping_address_text || 'No address provided';
    }
  };

  // Handle products data - could be a string, object, or array
  let products: ProductItem[] = [];
  try {
    console.log('Raw products data:', order.products);
    console.log('Products data type:', typeof order.products);
    
    // Check if products is already an object/array or a string that needs parsing
    if (typeof order.products === 'string') {
      // Handle case where it might be a stringified JSON
      if (order.products === '[object Object]') {
        // This is a special case where the string is literally "[object Object]"
        console.warn('Products data is "[object Object]" string, not valid JSON');
      } else if (order.products.trim() !== '') {
        // Only try to parse if it's not an empty string
        products = JSON.parse(order.products);
        console.log('Parsed products:', products);
      }
    } else if (Array.isArray(order.products)) {
      // If it's already an array, use it directly
      products = order.products;
      console.log('Using array products directly:', products);
    } else if (typeof order.products === 'object' && order.products !== null) {
      // If it's a single object, wrap it in an array
      products = [order.products as unknown as ProductItem];
      console.log('Using object product wrapped in array:', products);
    }
  } catch (e) {
    console.error('Failed to parse products data:', e);
  }

  // Status badge variants
  const paymentStatusVariant: Record<string, BadgeVariant> = {
    pending: 'secondary',
    paid: 'success',
    failed: 'destructive',
  };

  // Safely format date
  const safeFormatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return formatDate(dateString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Helper to build product image URL consistently with Products page
  const productImageUrl = (record: any, fileName?: string) => {
    const placeholder = 'https://placehold.co/200x200/e2e8f0/64748b?text=No+Image';
    if (!fileName) return placeholder;
    const cid = record?.collectionId || record?.collection || 'products';
    const rid = record?.id;
    if (cid && rid) return pbGetImageUrl(cid, rid, fileName);
    if (fileName.startsWith('http')) return fileName;
    // Fallback if filename accidentally contains "recordId/filename"
    if (typeof fileName === 'string' && fileName.includes('/')) {
      return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/${cid || ''}/${fileName}`;
    }
    return placeholder;
  };

  // Resolve a product's primary image filename similar to Products page
  const resolveProductImageFileName = (p: any): string | undefined => {
    try {
      if (!p) return undefined;
      if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
      if (typeof p.images === 'string' && p.images) return p.images as string;
      if (typeof (p as any).image === 'string' && (p as any).image) return (p as any).image as string;
      return undefined;
    } catch {
      return undefined;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-dvh max-w-full sm:max-w-3xl sm:h-[90vh] sm:rounded-lg sm:mx-auto rounded-none box-border overflow-hidden overflow-x-hidden flex flex-col p-0 sm:p-6">
        <DialogHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 sm:px-0 sm:py-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>
                Order <span className="text-muted-foreground">#{order.id.slice(0, 8)}</span>
                <Badge variant={orderStatusVariant[form.status] || 'outline'} className="ml-2">
                  {form.status.replace(/_/g, ' ')}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Created on {safeFormatDate(order.created)}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge variant={paymentStatusVariant[form.payment_status] || 'outline'} className="px-3 py-1 text-xs">
                Payment: {form.payment_status.charAt(0).toUpperCase() + form.payment_status.slice(1)}
              </Badge>
              {!isEditing ? (
                <Button variant="outline" className="h-8 px-3 text-sm" onClick={() => setIsEditing(true)}>Edit</Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="h-8 px-3 text-sm" onClick={() => { setIsEditing(false); setForm({
                    customer_name: order.customer_name || '',
                    customer_email: order.customer_email || '',
                    customer_phone: order.customer_phone || '',
                    shipping_address_text: order.shipping_address_text || '',
                    notes: order.notes || '',
                    status: order.status || 'pending',
                    payment_status: order.payment_status || 'pending',
                  }); }}>Cancel</Button>
                  <Button className="h-8 px-3 text-sm" onClick={handleSave}>Save</Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mb-3 px-3 sm:px-0 flex flex-wrap gap-2">
            <TabsTrigger value="details" className="text-sm">Order Details</TabsTrigger>
            <TabsTrigger value="products" className="text-sm">Products</TabsTrigger>
            <TabsTrigger value="payment" className="text-sm">Payment Info</TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-1 text-sm">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1 text-sm">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="sm:flex-1 pr-0 sm:pr-4 overflow-visible sm:overflow-auto">
            <TabsContent value="details" className="space-y-3 sm:space-y-4 p-3 sm:p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Card>
                  <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4 sm:px-6">
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
                        <p className="break-words">{form.customer_phone || 'Not provided'}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                    <CardTitle className="text-lg">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-6">
                    {isEditing ? (
                      <Textarea rows={6} value={form.shipping_address_text} onChange={(e) => setForm({ ...form, shipping_address_text: e.target.value })} />
                    ) : (
                      <p className="whitespace-pre-line break-words">{formatShippingAddress()}</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                    <CardTitle className="text-lg">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-6">
                    {isEditing ? (
                      <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    ) : (
                      <p className="whitespace-pre-line break-words">{form.notes || 'No notes provided'}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-4 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {products.length > 0 ? (
                    <div className="space-y-6">
                      {products.map((product, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b pb-4">
                          <div className="md:col-span-1 hidden sm:block">
                            {product.product?.images && Array.isArray(product.product.images) && product.product.images.length > 0 ? (
                              <div className="w-full max-w-[150px] mx-auto">
                                {(() => { 
                                  const imagePath = product.product.images[0];
                                  console.log('Product image data:', imagePath); 
                                  return null; 
                                })()}
                                <AspectRatio ratio={1 / 1} className="bg-muted rounded-md overflow-hidden">
                                  <img 
                                    src={productImageUrl(product.product, resolveProductImageFileName(product.product))}
                                    alt={product.product.name}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      console.log('Image failed to load, using placeholder');
                                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/e2e8f0/64748b?text=No+Image';
                                    }}
                                  />
                                </AspectRatio>
                              </div>
                            ) : (
                              <div className="w-full max-w-[150px] mx-auto">
                                <AspectRatio ratio={1 / 1} className="bg-muted rounded-md flex items-center justify-center">
                                  <span className="text-muted-foreground text-sm">No Image</span>
                                </AspectRatio>
                              </div>
                            )}
                          </div>
                          
                          <div className="md:col-span-3 flex flex-col justify-between">
                            <div>
                              <h4 className="font-medium text-base">{product.product?.name || 'Unknown Product'}</h4>
                              {product.color && <span className="text-sm text-muted-foreground">Color: {product.color}</span>}
                              {product.product?.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.product.description}</p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-3 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Quantity:</span>
                                <p className="font-medium">{product.quantity}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Price:</span>
                                <p className="font-medium">&#8377;{product.product?.price?.toFixed(2) || '0.00'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Subtotal:</span>
                                <p className="font-medium">&#8377;{((product.product?.price || 0) * product.quantity).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">Subtotal:</span>
                          <span>&#8377;{order.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="font-medium">Discount:</span>
                            <span>-&#8377;{order.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>&#8377;{order.total?.toFixed(2) || '0.00'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>No product information available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4 p-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="font-semibold">Payment Status</Label>
                      <div>
                        <Badge variant={paymentStatusVariant[order.payment_status] || 'outline'}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    {order.coupon_code && (
                      <div>
                        <Label className="font-semibold">Coupon Applied</Label>
                        <p>{order.coupon_code}</p>
                      </div>
                    )}
                    
                    <div>
                      <Label className="font-semibold">Razorpay Order ID</Label>
                      <p>{order.razorpay_order_id || 'Not available'}</p>
                    </div>
                    
                    <div>
                      <Label className="font-semibold">Razorpay Payment ID</Label>
                      <p>{order.razorpay_payment_id || 'Not available'}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>&#8377;{order.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {order.discount_amount && order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-&#8377;{order.discount_amount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <span>&#8377;{order.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4 p-1 overflow-y-auto">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Send WhatsApp Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SendWhatsAppMessage 
                      order={order} 
                      onMessageSent={() => {
                        // This will trigger a refetch of the activities
                        queryClient.invalidateQueries({ queryKey: ['whatsapp_activities', order.id] });
                      }} 
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Message History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WhatsAppActivitiesTab orderId={order.id} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 p-1 overflow-y-auto">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Send Email</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SendEmailMessage 
                      order={order} 
                      onEmailSent={() => {
                        // This will trigger a refetch of the email activities
                        queryClient.invalidateQueries({ queryKey: ['email_activities', order.id] });
                      }} 
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Email History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EmailActivitiesTab orderId={order.id} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button>Print Invoice</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// WhatsApp Activities Tab Component
function WhatsAppActivitiesTab({ orderId }: { orderId: string }) {
  const { activities, isLoading, refetch } = useWhatsAppActivities(orderId);
  
  return (
    <WhatsAppActivities 
      activities={activities} 
      isLoading={isLoading} 
      orderId={orderId} 
    />
  );
}

// Email Activities Tab Component
function EmailActivitiesTab({ orderId }: { orderId: string }) {
  const { activities, isLoading, refetch } = useEmailActivities(orderId);
  
  return (
    <EmailActivities 
      activities={activities} 
      isLoading={isLoading} 
      orderId={orderId} 
    />
  );
}
