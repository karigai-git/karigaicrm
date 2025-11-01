import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Printer, ChevronDown, Grid2X2, Grid, LayoutGrid } from 'lucide-react';
import { PrintableSlip, LayoutOption } from './PrintableSlip';
import { Order } from '@/types/schema';
import { toast } from 'sonner';

interface OrderPrintManagerProps {
  selectedOrders: Order[];
  allOrders: Order[];
}

export const OrderPrintManager: React.FC<OrderPrintManagerProps> = ({ 
  selectedOrders,
  allOrders
}) => {
  const [printLayout, setPrintLayout] = useState<LayoutOption>(2);
  const [ordersToPrint, setOrdersToPrint] = useState<Order[]>([]);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Print handler using react-to-print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () => {
      if (ordersToPrint.length === 0) {
        toast.error('No orders selected for printing');
        return Promise.reject('No orders selected for printing');
      }
      return Promise.resolve();
    },
    onAfterPrint: () => {
      toast.success(`${ordersToPrint.length} slip(s) printed successfully`);
      setIsPrintDialogOpen(false);
    },
    onPrintError: (error) => {
      toast.error('Failed to print: ' + error.message);
    },
  });

  // Print selected orders
  const printSelectedOrders = () => {
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }
    setOrdersToPrint(selectedOrders);
    setIsPrintDialogOpen(true);
  };

  // Print all orders
  const printAllOrders = () => {
    if (allOrders.length === 0) {
      toast.error('No orders available');
      return;
    }
    setOrdersToPrint(allOrders);
    setIsPrintDialogOpen(true);
  };

  // Print a single order
  const printSingleOrder = (order: Order) => {
    setOrdersToPrint([order]);
    setIsPrintDialogOpen(true);
  };

  // Get layout icon based on selection
  const getLayoutIcon = () => {
    switch (printLayout) {
      case 1: return <LayoutGrid size={16} />;
      case 2: return <Grid2X2 size={16} />;
      case 4: return <Grid size={16} />;
      case 6: return <Grid size={16} />;
      default: return <Grid2X2 size={16} />;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="ml-2">
            <Printer size={16} className="mr-2" />
            Print
            <ChevronDown size={14} className="ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Print Options</DropdownMenuLabel>
          <DropdownMenuItem onClick={printSelectedOrders}>
            Print Selected Orders ({selectedOrders.length})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={printAllOrders}>
            Print All Orders ({allOrders.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Print Preview Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Print Preview</DialogTitle>
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
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePrint}>
              <Printer size={16} className="mr-2" />
              Print Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Export a function to print a single order
export const printOrder = (order: Order, printFunction: (order: Order) => void) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={(e) => {
        e.stopPropagation();
        printFunction(order);
      }}
    >
      <Printer size={14} className="mr-1" />
      Print Slip
    </Button>
  );
};
