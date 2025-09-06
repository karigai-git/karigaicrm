import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateOrderData, Product } from '@/types/schema';
import { useProducts } from '@/hooks/useProducts';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';

const formSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email address'),
  customer_phone: z.string().optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']).default('pending'),
  payment_status: z.enum(['pending', 'paid', 'failed']).default('pending'),
  total: z.number().min(0, 'Total must be non-negative'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  shipping_address_text: z.string().optional(),
  notes: z.string().optional(),
  products: z.string().default('[]'),
});

type OrderFormValues = z.infer<typeof formSchema>;

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOrderData) => Promise<void>;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [shippingAmount, setShippingAmount] = useState<number>(0);

  // Load products for selection
  const { products, isLoading } = useProducts({ page: 1, perPage: 50, searchTerm, sort: '-created' });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'pending',
      payment_status: 'pending',
      products: '[]',
      total: 0,
      subtotal: 0,
      totalAmount: 0,
    },
  });

  // Derived amounts
  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (Number(item.product?.price) || 0) * (item.quantity || 0), 0);
  }, [selectedItems]);

  const total = useMemo(() => {
    return subtotal + (Number(shippingAmount) || 0);
  }, [subtotal, shippingAmount]);

  // Keep form numeric fields in sync
  useEffect(() => {
    form.setValue('subtotal', Number(subtotal.toFixed(2)));
    form.setValue('total', Number(total.toFixed(2)));
    form.setValue('totalAmount', Number(total.toFixed(2)));
  }, [subtotal, total]);

  // Build products JSON string for PocketBase
  const buildProductsJson = () => {
    const rows = selectedItems.map((it) => ({
      product_id: it.product.id,
      name: it.product.name,
      price: Number(it.product.price) || 0,
      quantity: it.quantity,
      total: ((Number(it.product.price) || 0) * it.quantity),
    }));
    return JSON.stringify(rows);
  };

  const handleSubmit = async (values: OrderFormValues) => {
    try {
      setIsSubmitting(true);
      // Ensure all required fields are present for CreateOrderData
      const productsJson = buildProductsJson();
      form.setValue('products', productsJson);
      const orderData: CreateOrderData = {
        user: [], // Will be filled by backend
        customer_name: values.customer_name,
        customer_email: values.customer_email,
        customer_phone: values.customer_phone || '',
        status: values.status,
        payment_status: values.payment_status,
        total: Number(total.toFixed(2)),
        subtotal: Number(subtotal.toFixed(2)),
        totalAmount: Number(total.toFixed(2)),
        shipping_address_text: values.shipping_address_text,
        notes: values.notes,
        products: productsJson,
      } as CreateOrderData as any;
      // add shipping_cost to align with backend schema
      (orderData as any).shipping_cost = Number((shippingAmount || 0).toFixed(2));
      // include created timestamp formatted as 'YYYY-MM-DD HH:mm:ss.SSSZ'
      const iso = new Date().toISOString(); // e.g., 2025-09-06T07:20:30.123Z
      const pbCreated = iso.replace('T', ' '); // 2025-09-06 07:20:30.123Z
      (orderData as any).created = pbCreated;
      await onSubmit(orderData);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Add a new order to the system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter customer name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="customer@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter phone number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product selection */}
            <div className="space-y-2">
              <FormLabel className="text-base">Products</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select onValueChange={(id) => {
                  const prod = products.find((p: Product) => p.id === id);
                  if (prod) {
                    setSelectedItems((prev) => {
                      const exists = prev.find((x) => x.product.id === prod.id);
                      if (exists) return prev; // avoid duplicates
                      return [...prev, { product: prod, quantity: 1 }];
                    });
                  }
                }}>
                  <SelectTrigger className="w-[260px]" disabled={isLoading}>
                    <SelectValue placeholder={isLoading ? 'Loading...' : 'Select product'} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: Product) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — ₹{Number(p.price || 0).toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected items list */}
              {selectedItems.length > 0 && (
                <div className="border rounded-md divide-y">
                  {selectedItems.map((it, idx) => (
                    <div key={it.product.id} className="flex items-center gap-3 p-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.product.name}</div>
                        <div className="text-xs text-muted-foreground">₹{Number(it.product.price || 0).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => {
                            const q = Math.max(1, Number(e.target.value) || 1);
                            setSelectedItems((prev) => prev.map((row, i) => i === idx ? { ...row, quantity: q } : row));
                          }}
                          className="w-20"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedItems((prev) => prev.filter((row) => row.product.id !== it.product.id))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-24 text-right font-medium">₹{(((Number(it.product.price) || 0) * it.quantity)).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Shipping and totals */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Shipping Cost</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={shippingAmount}
                  onChange={(e) => setShippingAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Shipping:</span><span>₹{Number(shippingAmount || 0).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total:</span><span>₹{total.toFixed(2)}</span></div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="shipping_address_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping Address</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter shipping address"
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter any additional notes"
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
