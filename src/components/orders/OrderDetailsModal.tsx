import React, { useEffect, useMemo, useState } from 'react';
import { Order } from '@/types/schema';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Truck, 
  CreditCard, 
  FileText, 
  MapPin, 
  User, 
  Clock,
  MessageSquare
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useWhatsAppActivities } from '@/hooks/useWhatsAppActivities';
import { WhatsAppActivities } from './WhatsAppActivities';
import SendEvolutionMessage from './SendEvolutionMessage';
import { pb } from '@/lib/pocketbase';
import { ViewProductDialog } from '@/components/dialogs/ViewProductDialog';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
}

// WhatsApp Activities Tab Component
function WhatsAppActivitiesTab({ orderId, order }: { orderId: string, order: Order }) {
  const { activities, isLoading, createActivity } = useWhatsAppActivities(orderId);
  
  const handleMessageSent = () => {
    // This will trigger a refetch of the activities
    // through the invalidation in the createActivity mutation
  };
  
  return (
    <div className="space-y-6">
      <SendEvolutionMessage order={order} onMessageSent={handleMessageSent} />
      
      {/* WhatsApp Activity History Section */}
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Message History</h3>
        </div>
        <WhatsAppActivities 
          activities={activities} 
          isLoading={isLoading} 
          orderId={orderId} 
        />
      </div>
    </div>
  );
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  const formatDate = (dateString: string | undefined) => {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a');
  };

  // ---- Derive products from order.products (fallback when expand.items is empty) ----
  type OrderProductRow = { product_id: string; quantity: number; price: number; name?: string };
  const [rows, setRows] = useState<OrderProductRow[]>([]);
  const [productsById, setProductsById] = useState<Record<string, any>>({});
  const [productDialog, setProductDialog] = useState<{open: boolean; product: any | null}>({open: false, product: null});

  const safeParseProducts = (value: unknown): OrderProductRow[] => {
    try {
      if (!value) return [];
      let s = value as string;
      if (typeof value !== 'string') return Array.isArray(value) ? (value as any) : [];
      s = s.trim();
      // If it looks like a JSON string embedded as a string (e.g., "[ {...} ]"), remove surrounding quotes
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        try { s = JSON.parse(s); } catch { s = s.slice(1, -1); }
      }
      // Replace CSV-escaped doubled quotes to normal quotes
      if (/""/.test(s)) {
        s = s.replace(/""/g, '"');
      }
      // Final parse
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr as OrderProductRow[];
      return [];
    } catch (e) {
      console.warn('Failed to parse order.products', e, value);
      return [];
    }
  };

  // Load rows from either expanded items or products JSON
  useEffect(() => {
    const expandedItems = (order.expand as any)?.items as any[] | undefined;
    if (expandedItems && expandedItems.length > 0) {
      const mapped: OrderProductRow[] = expandedItems.map((it: any) => ({
        product_id: it.product_id,
        quantity: Number(it.quantity) || 0,
        price: Number(it.price) || 0,
        name: it.expand?.product_id?.name,
      }));
      setRows(mapped);
      // Fetch missing product records if needed
      const ids = mapped.map(r => r.product_id).filter(Boolean);
      void fetchProducts(ids);
    } else {
      const parsed = safeParseProducts((order as any).products);
      setRows(parsed);
      const ids = parsed.map(r => r.product_id).filter(Boolean);
      void fetchProducts(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  const fetchProducts = async (ids: string[]) => {
    try {
      const unique = Array.from(new Set(ids)).filter(Boolean);
      if (unique.length === 0) return;
      const fetched: Record<string, any> = {};
      await Promise.all(unique.map(async (id) => {
        try {
          const rec = await pb.collection('products').getOne(id);
          fetched[id] = rec;
        } catch (e) {
          console.warn('Failed to fetch product', id, e);
        }
      }));
      setProductsById(prev => ({ ...prev, ...fetched }));
    } catch (e) {
      console.error('fetchProducts error', e);
    }
  };

  const itemsToRender = useMemo(() => rows.map(r => ({
    ...r,
    product: productsById[r.product_id],
  })), [rows, productsById]);
  
  const orderId = order?.id || '';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            Order Details 
            <span className="ml-2 text-sm font-normal text-gray-500">
              {order ? `#${order.id.slice(0, 8)}` : ''}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="items">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="items" className="flex items-center">
              <Package size={14} className="mr-2" />
              Items
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center">
              <User size={14} className="mr-2" />
              Customer
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex items-center">
              <Truck size={14} className="mr-2" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center">
              <CreditCard size={14} className="mr-2" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center">
              <MessageSquare size={14} className="mr-2" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
          
          {/* Items tab */}
          <TabsContent value="items" className="space-y-4">
            <div className="space-y-4">
              {order && itemsToRender.length > 0 ? itemsToRender.map((item, idx) => {
                const product = item.product;
                const total = (Number(item.quantity) || 0) * (Number(item.price) || 0);
                const displayName = product?.name || item.name || 'N/A';
                const imgField = product?.images ?? product?.image;
                const image = Array.isArray(imgField) ? (imgField[0] || '') : (imgField || '');
                return (
                  <div key={`${item.product_id}-${idx}`} className="flex items-center border rounded-md p-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mr-4">
                      {image ? (
                        <img src={image} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <button
                        type="button"
                        className="font-medium text-left hover:underline"
                        onClick={() => setProductDialog({ open: true, product })}
                      >
                        {displayName}
                      </button>
                      <div className="text-sm text-gray-500">
                        {item.quantity} x ₹{Number(item.price || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right font-medium">₹{total.toFixed(2)}</div>
                  </div>
                );
              }) : (
                <div className="text-sm text-muted-foreground">{order ? 'No product information available' : 'No order selected'}</div>
              )}
            </div>
            
            <div className="border rounded-md p-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{Number(order?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>
                    ₹{
                      (() => {
                        const rec = (order || {}) as Record<string, unknown>;
                        const raw = (rec['shipping_fee'] ?? rec['shipping_cost'] ?? rec['shippingCost'] ?? 0) as unknown;
                        const num = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
                        return Number.isFinite(num) ? num : 0;
                      })().toFixed(2)
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>₹{Number(order?.tax || 0).toFixed(2)}</span>
                </div>
                {Number(order?.discount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">-₹{Number(order?.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>₹{Number(order?.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Customer tab */}
          <TabsContent value="customer" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <User size={16} className="mr-2 text-gray-500" />
                Customer Info
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div>
                  <Label className="text-xs text-gray-500">Name</Label>
                  <p>{order?.user_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Email</Label>
                  <p>{order?.user_email || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Clock size={16} className="mr-2 text-gray-500" />
                Order Timeline
              </h3>
              <div className="space-y-4 mt-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                    <FileText size={12} />
                  </div>
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-sm text-gray-500">{order?.created ? formatDate(order.created) : 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                    <CreditCard size={12} />
                  </div>
                  <div>
                    <p className="font-medium">Payment {order?.payment_status === 'paid' ? 'Completed' : 'Pending'}</p>
                    <p className="text-sm text-gray-500">{order?.updated ? formatDate(order.updated) : 'N/A'}</p>
                  </div>
                </div>
                
                {order?.status === 'shipped' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                      <Truck size={12} />
                    </div>
                    <div>
                      <p className="font-medium">Order Shipped</p>
                      <p className="text-sm text-gray-500">{order?.updated ? formatDate(order.updated) : 'N/A'}</p>
                    </div>
                  </div>
                )}
                
                {order?.status === 'delivered' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                      <Package size={12} />
                    </div>
                    <div>
                      <p className="font-medium">Order Delivered</p>
                      <p className="text-sm text-gray-500">{order?.updated ? formatDate(order.updated) : 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Shipping tab */}
          <TabsContent value="shipping" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <MapPin size={16} className="mr-2 text-gray-500" />
                Shipping Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-xs text-gray-500">Shipping Address</Label>
                  {order?.expand?.shipping_address ? (
                    <>
                      <p>{order?.expand?.shipping_address?.street}, {order?.expand?.shipping_address?.city}, {order?.expand?.shipping_address?.state} - {order?.expand?.shipping_address?.postal_code}</p>
                      <p>{order?.expand?.shipping_address?.country}</p>
                    </>
                  ) : (
                    <p>{order?.shipping_address_text || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Shipping Method</Label>
                  <p>{order?.shipping_carrier || 'Standard Shipping'}</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Truck size={16} className="mr-2 text-gray-500" />
                Shipping Status
              </h3>
              
              <div className="mt-4">
                <div className="mb-4">
                  <Label className="text-xs text-gray-500">Current Status</Label>
                  <p className="font-medium capitalize">{order.status}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500 mb-2">Update Status</Label>
                  <div className="flex space-x-2 mt-2">
                    <Button 
                      variant={order?.status === 'pending' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => order && onUpdateStatus(order.id, 'pending')}
                    >
                      Pending
                    </Button>
                    <Button 
                      variant={order?.status === 'processing' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => order && onUpdateStatus(order.id, 'processing')}
                    >
                      Processing
                    </Button>
                    <Button 
                      variant={order?.status === 'shipped' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => order && onUpdateStatus(order.id, 'shipped')}
                    >
                      Shipped
                    </Button>
                    <Button 
                      variant={order?.status === 'delivered' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => order && onUpdateStatus(order.id, 'delivered')}
                    >
                      Delivered
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {order.notes && (
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <FileText size={16} className="mr-2 text-gray-500" />
                  Order Notes
                </h3>
                <p className="text-sm mt-2">{order.notes}</p>
              </div>
            )}
          </TabsContent>
          
          {/* Payment tab */}
          <TabsContent value="payment" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <CreditCard size={16} className="mr-2 text-gray-500" />
                Payment Information
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-xs text-gray-500">Payment Method</Label>
                  <p className="capitalize">{order?.payment_method || 'Razorpay'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Payment Status</Label>
                  <p className="capitalize">{order?.payment_status || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Payment ID</Label>
                  <p>{order?.payment_id || 'Not available'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Amount</Label>
                  <p>₹{Number(order?.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2">Transaction Timeline</h3>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                    <CreditCard size={12} />
                  </div>
                  <div>
                    <p className="font-medium">Payment Initiated</p>
                    <p className="text-sm text-gray-500">{order?.created ? formatDate(order.created) : 'N/A'}</p>
                  </div>
                </div>
                
                {order?.payment_status === 'paid' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                      <CreditCard size={12} />
                    </div>
                    <div>
                      <p className="font-medium">Payment Successful</p>
                      <p className="text-sm text-gray-500">{order?.updated ? formatDate(order.updated) : 'N/A'}</p>
                    </div>
                  </div>
                )}
                
                {order?.payment_status === 'failed' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0 flex items-center justify-center text-white mt-0.5">
                      <CreditCard size={12} />
                    </div>
                    <div>
                      <p className="font-medium">Payment Failed</p>
                      <p className="text-sm text-gray-500">{formatDate(order.updated)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* WhatsApp tab */}
          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppActivitiesTab orderId={order.id} order={order} />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
      {/* Product viewer */}
      <ViewProductDialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog(prev => ({ open, product: open ? prev.product : null }))}
        product={productDialog.product}
      />
    </Dialog>
  );
}

