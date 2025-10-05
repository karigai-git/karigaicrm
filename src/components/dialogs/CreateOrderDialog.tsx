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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  created_text: z.string().optional(),
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
  const [selectedItems, setSelectedItems] = useState<Array<{ product: Product; quantity: number; selectedSize?: string; selectedColor?: string }>>([]);
  const [shippingAmount, setShippingAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  // Bulk create state
  const [bulkInput, setBulkInput] = useState<string>('');
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  // Paste-to-CSV helper state
  const [rawPaste, setRawPaste] = useState<string>('');
  const [pasteErrors, setPasteErrors] = useState<string[]>([]);

  // Load products for selection
  const { products, isLoading } = useProducts({ page: 1, perPage: 50, searchTerm, sort: '-created' });

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'pending',
      payment_status: 'paid',
      products: '[]',
      total: 0,
      subtotal: 0,
      totalAmount: 0,
      created_text: '',
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
      name: it.product.name + (it.selectedSize ? ` - ${it.selectedSize}` : '') + (it.selectedColor ? ` - ${it.selectedColor}` : ''),
      price: Number(it.product.price) || 0,
      quantity: it.quantity,
      total: ((Number(it.product.price) || 0) * it.quantity),
      variant: {
        size: it.selectedSize || null,
        color: it.selectedColor || null
      }
    }));
    return JSON.stringify(rows);
  };

  // ---- PASTE-TO-CSV CONVERTER ----
  const computeShippingByState = (addrLines: string[]) => {
    const addr = addrLines.join(' ').toLowerCase();
    if (addr.includes('tamil nadu') || addr.includes('tamilnadu')) return 50;
    return 60;
  };

  const matchProduct = (name: string) => {
    // Extract variant information if format is like "Product Name - Size - Color"
    let q = name.trim().toLowerCase();
    let size = '';
    let color = '';
    
    // Look for size/color specifications in the format "Product - Size - Color"
    const parts = q.split(/-\s*/);
    if (parts.length > 1) {
      // The first part is the product name
      q = parts[0].trim();
      
      // Check remaining parts for size/color indicators
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.startsWith('size:') || part.includes('ml') || part.includes('l') || 
            part.includes('g') || part.includes('kg')) {
          size = part.replace(/^size:\s*/i, '');
        } else if (part.startsWith('color:') || 
                  ['red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'pink', 'orange', 'brown'].includes(part)) {
          color = part.replace(/^color:\s*/i, '');
        }
      }
    }
    
    // Try to find an exact match first
    let found = products.find((p: Product) => (p.name || '').toLowerCase() === q);
    
    if (found) {
      return { product: found, size, color };
    }
    
    // Try partial matches
    found = products.find((p: Product) => 
      (p.name || '').toLowerCase().includes(q) || q.includes((p.name || '').toLowerCase())
    );
    
    return found ? { product: found, size, color } : null;
  };

  const convertPasteToCsv = () => {
    try {
      setPasteErrors([]);
      const blocksRaw = rawPaste
        .split(/\n{2,}/)
        .map(b => b.split(/\n/).map(l => l.trim()).filter(Boolean))
        .filter(b => b.length > 0);
      if (blocksRaw.length === 0) {
        setPasteErrors(['No content detected.']);
        return;
      }

      const hasItem = (lines: string[]) => lines.some(l => /^(?:-\s*)?\d+\s+.+/i.test(l));

      // Merge blocks when user added extra blank lines between address and items
      const blocks: string[][] = [];
      for (let i = 0; i < blocksRaw.length; i++) {
        const cur = blocksRaw[i];
        if (!hasItem(cur) && i + 1 < blocksRaw.length) {
          const merged = [...cur, ...blocksRaw[i + 1]];
          if (hasItem(merged)) {
            blocks.push(merged);
            i++; // skip next
            continue;
          }
        }
        blocks.push(cur);
      }

      const headers = [
        'customer_name','customer_email','customer_phone','status','payment_status','subtotal','total','shipping_cost','shipping_address_text','products','notes','created'
      ];
      const rows: string[] = [headers.join(',')];
      const errs: string[] = [];

      const nowIso = new Date().toISOString().replace('T', ' ');
      const csvEscape = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

      blocks.forEach((lines, idx) => {
        try {
          let i = 0;
          const name = lines[i++] || '';
          // phone: next line with at least 10 digits
          let phone = '';
          while (i < lines.length && !/\d{10,}/.test(lines[i].replace(/\D/g, ''))) i++;
          if (i < lines.length) {
            phone = lines[i].replace(/\D/g, '');
            i++;
          }
          // address lines until an item pattern appears
          const addrLines: string[] = [];
          while (i < lines.length && !/^(?:-\s*)?\d+\s+.+/i.test(lines[i])) {
            addrLines.push(lines[i]);
            i++;
          }
          // item lines
          const items: { qty: number; name: string }[] = [];
          while (i < lines.length) {
            const m = lines[i].match(/^(?:-\s*)?(\d+)\s+(.+)$/i);
            if (m) {
              items.push({ qty: parseInt(m[1], 10) || 1, name: m[2].trim() });
            }
            i++;
          }

          if (items.length === 0) {
            throw new Error('No items detected. Tip: lines like "1 charcoal soap" or "- 1 charcoal soap" are recognized as items.');
          }

          // build products JSON
          const productRows: Array<{
            product_id: string; 
            quantity: number; 
            price: number; 
            name: string;
            variant?: {
              size: string | null;
              color: string | null;
            };
          }> = [];
          let subtotal = 0;
          items.forEach(it => {
            const matchResult = matchProduct(it.name);
            if (matchResult) {
              const { product, size, color } = matchResult;
              const price = Number(product.price || 0);
              const productName = product.name + (size ? ` - ${size}` : '') + (color ? ` - ${color}` : '');
              
              productRows.push({ 
                product_id: product.id, 
                quantity: it.qty, 
                price, 
                name: productName,
                variant: {
                  size: size || null,
                  color: color || null
                }
              });
              subtotal += price * it.qty;
            } else {
              errs.push(`Block ${idx + 1}: product not found -> "${it.name}"`);
            }
          });

          const shipping = computeShippingByState(addrLines);
          const totalCalc = subtotal + shipping;
          const productsJson = JSON.stringify(productRows);

          const csvRow = [
            csvEscape(name),
            '',
            phone,
            'pending',
            'paid',
            String(subtotal),
            String(totalCalc),
            String(shipping),
            csvEscape(addrLines.join(' | ')),
            csvEscape(productsJson),
            csvEscape(addrLines.join(' | ')),
            nowIso,
          ].join(',');
          rows.push(csvRow);
        } catch (e: any) {
          errs.push(`Block ${idx + 1}: ${e?.message || e}`);
        }
      });

      if (errs.length) setPasteErrors(errs);
      setBulkInput(rows.join('\n'));
      setActiveTab('bulk');
    } catch (e: any) {
      setPasteErrors([e?.message || String(e)]);
    }
  };

  // ---- SAMPLE CSV HELPERS ----
  const generateSampleCsv = () => {
    const headers = [
      'customer_name','customer_email','customer_phone','status','payment_status','subtotal','total','shipping_cost','shipping_address_text','products','notes','created'
    ].join(',');
    const esc = (v: string) => '"' + v.replace(/"/g, '""') + '"';
    const row1 = [
      esc('John Doe'),'john@example.com','9912345678','processing','paid','200','220','20',
      esc('Tharamangalam main road tholasampatty | Salem | Tamilnadu | 636503'),
      esc(JSON.stringify({product_id:'abc123',quantity:1,price:200})),
      esc('First order'),'2025-09-06 10:00:00.000Z'
    ].join(',');
    const row2 = [
      esc('Jane Smith'),'jane@example.com','9987654321','pending','paid','150','170','20',
      esc('Another street, City, State, 600001'),
      esc(JSON.stringify({product_id:'xyz789',quantity:2,price:75})),
      esc('Second order'),'2025-09-06 11:30:00.000Z'
    ].join(',');
    return `${headers}\n${row1}\n${row2}`;
  };

  const handleDownloadSample = () => {
    const csv = generateSampleCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySample = async () => {
    try {
      await navigator.clipboard.writeText(generateSampleCsv());
    } catch {}
  };

  const handleFillSample = () => {
    setBulkInput(generateSampleCsv());
  };

  // ---- BULK CREATE HELPERS ----
  type BulkRow = Partial<{
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    status: 'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    subtotal: string | number;
    total: string | number;
    shipping_cost: string | number;
    shipping_address_text: string;
    products: string; // JSON string
    notes: string;
    created: string; // expects 'YYYY-MM-DD HH:mm:ss.SSSZ' or similar
  }>;

  const parseBulkCSV = (text: string): BulkRow[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows: BulkRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));
      const r: any = {};
      headers.forEach((h, idx) => { r[h] = cols[idx]; });
      rows.push(r as BulkRow);
    }
    return rows;
  };

  const normalizeCreated = (s?: string) => {
    if (!s) return new Date().toISOString().replace('T', ' ');
    // If already has 'T', convert to space
    return s.includes('T') ? s.replace('T', ' ') : s;
  };

  const toNumber = (v: any, def = 0) => {
    const n = Number(v);
    return isNaN(n) ? def : n;
  };

  const handleBulkCreate = async () => {
    try {
      setIsBulkCreating(true);
      setBulkResult({ success: 0, failed: 0, errors: [] });
      const rows = parseBulkCSV(bulkInput);
      if (rows.length === 0) return;

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          const productsJson = r.products && r.products.trim().startsWith('[') ? r.products : '[]';
          const subtotal = toNumber(r.subtotal, 0);
          const total = toNumber(r.total, subtotal + toNumber(r.shipping_cost, 0));
          const payload: any = {
            user: [],
            customer_name: r.customer_name || '',
            customer_email: r.customer_email || '',
            customer_phone: r.customer_phone || '',
            status: (r.status as any) || 'pending',
            payment_status: (r.payment_status as any) || 'paid',
            subtotal,
            total,
            totalAmount: total,
            shipping_address_text: r.shipping_address_text || '',
            notes: r.notes || '',
            products: productsJson,
          };
          payload.shipping_cost = toNumber(r.shipping_cost, 0);
          payload.created = normalizeCreated(r.created);
          payload.created_text = payload.created;

          await onSubmit(payload);
          success++;
        } catch (e: any) {
          failed++;
          errors.push(`Row ${i + 1}: ${e?.message || e}`);
        }
      }

      setBulkResult({ success, failed, errors });
      if (failed === 0) {
        setBulkInput('');
      }
    } finally {
      setIsBulkCreating(false);
    }
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
      const provided = (values as any).created_text as string | undefined;
      const createdStr = provided && provided.trim().length > 0
        ? provided
        : new Date().toISOString().replace('T', ' ');
      (orderData as any).created = createdStr;
      (orderData as any).created_text = createdStr;
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Orders</DialogTitle>
          <DialogDescription>Single or bulk create orders.</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'single' | 'bulk')}>
          <TabsList className="mb-4">
            <TabsTrigger value="single">Single Order</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="single">
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
                    // Create a new item without adding it to the list yet
                    const newItem = { product: prod, quantity: 1 };
                    
                    // Check for variants
                    const hasSizes = prod.available_sizes && prod.available_sizes !== '';
                    const hasColors = prod.available_colors && prod.available_colors !== '';
                    
                    if (!hasSizes && !hasColors) {
                      // No variants, add directly
                      setSelectedItems((prev) => {
                        const exists = prev.find((x) => x.product.id === prod.id);
                        if (exists) return prev; // avoid duplicates
                        return [...prev, newItem];
                      });
                    } else {
                      // Show variant selector dialog or expand the current item
                      setSelectedItems((prev) => {
                        const exists = prev.find((x) => x.product.id === prod.id && !x.selectedSize && !x.selectedColor);
                        if (exists) return prev; // avoid duplicates of base product
                        return [...prev, newItem];
                      });
                    }
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
                  {selectedItems.map((it, idx) => {
                    // Parse variants if available
                    const parseSizes = (sizesStr: string | undefined) => {
                      if (!sizesStr) return [];
                      try {
                        const parsed = JSON.parse(sizesStr);
                        return Array.isArray(parsed) ? parsed : [];
                      } catch {
                        return sizesStr.split(',').map(s => s.trim()).filter(Boolean);
                      }
                    };
                    
                    const parseColors = (colorsStr: string | undefined) => {
                      if (!colorsStr) return [];
                      try {
                        const parsed = JSON.parse(colorsStr);
                        return Array.isArray(parsed) ? parsed : [];
                      } catch {
                        return colorsStr.split(',').map(c => c.trim()).filter(Boolean);
                      }
                    };
                    
                    const sizes = parseSizes(it.product.available_sizes);
                    const colors = parseColors(it.product.available_colors);
                    
                    return (
                      <div key={`${it.product.id}-${idx}`} className="flex flex-col p-2 border-b">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{it.product.name}</div>
                            <div className="text-xs text-muted-foreground">₹{Number(it.product.price || 0).toFixed(2)}</div>
                            {(it.selectedSize || it.selectedColor) && (
                              <div className="text-xs font-medium mt-1">
                                {it.selectedSize && <span className="mr-2">Size: {it.selectedSize}</span>}
                                {it.selectedColor && <span>Color: {it.selectedColor}</span>}
                              </div>
                            )}
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
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setSelectedItems((prev) => 
                                prev.filter((_, i) => i !== idx)
                              )}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="w-24 text-right font-medium">₹{(((Number(it.product.price) || 0) * it.quantity)).toFixed(2)}</div>
                        </div>
                        
                        {/* Variant selectors */}
                        {(sizes.length > 0 || colors.length > 0) && (
                          <div className="flex flex-wrap gap-2 mt-2 ml-1">
                            {sizes.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Size:</span>
                                <Select
                                  value={it.selectedSize || ""}
                                  onValueChange={(size) => {
                                    setSelectedItems((prev) => prev.map((row, i) => 
                                      i === idx ? { ...row, selectedSize: size } : row
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-[100px]">
                                    <SelectValue placeholder="Select size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sizes.map((size: string) => (
                                      <SelectItem key={size} value={size}>
                                        {size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            
                            {colors.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">Color:</span>
                                <Select
                                  value={it.selectedColor || ""}
                                  onValueChange={(color) => {
                                    setSelectedItems((prev) => prev.map((row, i) => 
                                      i === idx ? { ...row, selectedColor: color } : row
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="h-7 w-[120px]">
                                    <SelectValue placeholder="Select color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colors.map((color: string) => (
                                      <SelectItem key={color} value={color}>
                                        {color}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

            <FormField
              control={form.control}
              name="created_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Created At (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="2022-01-01 10:00:00.123Z"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="bulk">
            <div className="space-y-3">
              <div className="text-sm font-medium">Bulk Create (CSV or pasted rows)</div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadSample}>Download sample CSV</Button>
                <Button type="button" variant="outline" onClick={handleCopySample}>Copy sample</Button>
                <Button type="button" variant="ghost" onClick={handleFillSample}>Fill sample here</Button>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium">Paste order text</div>
                <Textarea
                  value={rawPaste}
                  onChange={(e) => setRawPaste(e.target.value)}
                  placeholder={`Example:\nKamalesh\n9345968120\nTharamangalam main road tholasampatty\nSalem\nTamilnadu\n636503\n\n1 charcoal soap\n1 neem comb`}
                  className="min-h-[160px]"
                />
                <div className="flex items-center gap-2">
                  <Button type="button" onClick={convertPasteToCsv} disabled={!rawPaste.trim()}>Convert pasted text to CSV</Button>
                  {pasteErrors.length > 0 && (
                    <div className="text-xs text-destructive">{pasteErrors.length} issues detected</div>
                  )}
                </div>
                {pasteErrors.length > 0 && (
                  <div className="rounded-md border p-2 text-xs text-destructive">
                    {pasteErrors.slice(0, 5).map((er, i) => <div key={i}>{er}</div>)}
                    {pasteErrors.length > 5 && <div>…and {pasteErrors.length - 5} more</div>}
                  </div>
                )}
              </div>
              <Textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={'Headers required: customer_name,customer_email,customer_phone,status,payment_status,subtotal,total,shipping_cost,products,notes,created\nExample:\nJohn,john@mail.com,9912345678,paid,paid,200,220,20,[],,2025-09-06 10:00:00.000Z'}
                className="min-h-[220px]"
              />

              <div className="text-xs text-muted-foreground">
                Expected headers: <code>customer_name, customer_email, customer_phone, status, payment_status, subtotal, total, shipping_cost, products, notes, created</code>
                {' '} • products must be a JSON array string like <code>{'[{"product_id":"abc","quantity":1,"price":99}]'}</code>
              </div>
              
              <div className="mt-2 bg-muted/50 p-2 rounded-md text-xs">
                <div className="font-semibold mb-1">Product Variant Help:</div>
                <p>To specify variants when pasting order text, use the format:</p>
                <ul className="ml-4 mt-1 list-disc space-y-1">
                  <li>"1 Herbal Oil - 100ml" (for size variants)</li>
                  <li>"2 Herbal Oil - Green" (for color variants)</li>
                  <li>"1 Herbal Oil - 200ml - Blue" (for both size and color)</li>
                </ul>
              </div>
              
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" onClick={handleBulkCreate} disabled={isBulkCreating || !bulkInput.trim()}>
                  {isBulkCreating ? 'Creating…' : 'Create Bulk Orders'}
                </Button>
                {(bulkResult.success + bulkResult.failed) > 0 && (
                  <div className="text-xs">
                    <span className="font-medium">Result:</span> {bulkResult.success} success, {bulkResult.failed} failed
                  </div>
                )}
                <div className="flex-1" />
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              </div>
              {bulkResult.errors.length > 0 && (
                <div className="rounded-md border p-2 text-xs text-destructive">
                  {bulkResult.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                  {bulkResult.errors.length > 5 && (
                    <div>…and {bulkResult.errors.length - 5} more</div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
