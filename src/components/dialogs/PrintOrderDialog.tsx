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
import { Order } from '@/types/schema';
import { toast } from 'sonner';

type LayoutOption = 1 | 2 | 4 | 6;

export const PrintOrderDialog: React.FC = () => {
  const [printLayout, setPrintLayout] = useState<LayoutOption>(2);
  const [ordersToPrint, setOrdersToPrint] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Listen for print-order events
  useEffect(() => {
    const handlePrintOrder = (event: CustomEvent<Order>) => {
      setOrdersToPrint([event.detail]);
      setIsOpen(true);
    };

    window.addEventListener('print-order', handlePrintOrder as EventListener);
    
    return () => {
      window.removeEventListener('print-order', handlePrintOrder as EventListener);
    };
  }, []);

  // Print handler function
  const handlePrint = () => {
    if (ordersToPrint.length === 0) {
      toast.error('No orders selected for printing');
      return;
    }

    if (printRef.current) {
      try {
        // Use the browser's print functionality
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error('Failed to open print window. Please check your popup blocker settings.');
          return;
        }

        // Clone the printable content
        const printContent = printRef.current.cloneNode(true) as HTMLElement;
        
        // Create a new document in the print window
        printWindow.document.write(`
          <html>
            <head>
              <title>Karigai Order Slip</title>
              <style>
                @media print {
                  body { margin: 0; padding: 0; }
                  .print-layout { page-break-inside: avoid; }
                }
                body { font-family: system-ui, sans-serif; }
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
