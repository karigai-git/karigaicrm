import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { PrintableSlip } from '../orders/PrintableSlip';
import { pb, ensureAdminAuth } from '@/lib/pocketbase';
import { Order } from '@/types/schema';
import { toast } from 'sonner';

type LayoutOption = 1 | 2 | 4 | 6;

export const PrintOrderDialog: React.FC = () => {
  const [printLayout, setPrintLayout] = useState<LayoutOption>(2);
  const [ordersToPrint, setOrdersToPrint] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Helper to load expanded orders for accurate printing
  const loadExpanded = async (orders: Order[]): Promise<Order[]> => {
    try {
      await ensureAdminAuth();
      const enriched = await Promise.all(
        orders.map(async (o) => {
          try {
            const rec = await pb.collection('orders').getOne(o.id, {
              expand: 'items,shipping_address,items.product_id',
            });
            return rec as unknown as Order;
          } catch {
            return o;
          }
        })
      );
      return enriched;
    } catch {
      return orders;
    }
  };

  // Listen for print-order events
  useEffect(() => {
    const handlePrintOrder = async (event: CustomEvent<Order>) => {
      const list = await loadExpanded([event.detail]);
      setOrdersToPrint(list);
      setIsOpen(true);
    };

    window.addEventListener('print-order', handlePrintOrder as unknown as EventListener);
    
    return () => {
      window.removeEventListener('print-order', handlePrintOrder as unknown as EventListener);
    };
  }, []);

  // Listen for print-orders events (multiple orders)
  useEffect(() => {
    const handlePrintOrders = async (event: CustomEvent<{ orders: Order[] }>) => {
      const list = event?.detail?.orders || [];
      if (Array.isArray(list) && list.length > 0) {
        const enriched = await loadExpanded(list);
        setOrdersToPrint(enriched);
        setIsOpen(true);
      } else {
        toast.error('No orders selected for printing');
      }
    };

    window.addEventListener('print-orders', handlePrintOrders as unknown as EventListener);
    return () => window.removeEventListener('print-orders', handlePrintOrders as unknown as EventListener);
  }, []);

  // Print handler function
  const handlePrint = async () => {
    if (ordersToPrint.length === 0) {
      toast.error('No orders selected for printing');
      return;
    }

    if (printRef.current) {
      try {
        // Try to fetch expanded data for accuracy (items, shipping_address)
        // If PocketBase SDK is available here, we could refetch; otherwise rely on provided expands.
        // For now, proceed with existing data in the preview node.

        // Use the browser's print functionality
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error('Failed to open print window. Please check your popup blocker settings.');
          return;
        }

        // Clone the printable content
        const printContent = printRef.current.cloneNode(true) as HTMLElement;
        
        // Create a new document in the print window
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map((node) => (node as HTMLElement).outerHTML)
          .join('\n');

        printWindow.document.write(`
          <html>
            <head>
              <title>Karigai Order Slip</title>
              ${styles}
              <style>
                @page { size: auto; margin: 0; }
                @media print {
                  body { margin: 0; padding: 0; }
                  .print-layout { page-break-inside: avoid; }
                  .page { page-break-after: always; }
                }
                html, body { background: #fff; }
                body { font-family: system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              </style>
            </head>
            <body>
              ${printContent.outerHTML}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Print after a short delay to ensure content is loaded
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          toast.success(`${ordersToPrint.length} slip(s) printed successfully`);
          setIsOpen(false);
        }, 500);
      } catch (error) {
        toast.error('Failed to print: ' + (error as Error).message);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Print Order Slip</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">
            {ordersToPrint.length} order{ordersToPrint.length !== 1 ? 's' : ''} selected for printing
          </p>
          
          <div className="flex items-center">
            <span className="text-sm mr-2">Layout:</span>
            <Select value={printLayout.toString()} onValueChange={(value) => setPrintLayout(parseInt(value) as LayoutOption)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Single (1×1)</SelectItem>
                <SelectItem value="2">Double (2×1)</SelectItem>
                <SelectItem value="4">Quad (2×2)</SelectItem>
                <SelectItem value="6">Six (3×2)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-auto border rounded-md p-4">
          <PrintableSlip ref={printRef} orders={ordersToPrint} layout={printLayout} />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePrint}>
            <Printer size={16} className="mr-2" />
            Print Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
