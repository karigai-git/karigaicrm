
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Order } from '@/types/schema';

// Define OrderStatus and PaymentStatus types to match the schema
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'out_for_delivery';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
import { 
  ChevronDown, 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  AlertCircle,
  Printer,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { OrderPrintManager, printOrder } from './OrderPrintManager';
import { DateRangePicker } from '@/components/ui/date-range-picker';

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onRefresh?: () => void;
}

// Function to render status badges
const getStatusBadge = (status: OrderStatus) => {
  const variants: Record<OrderStatus, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
    shipped: { color: 'bg-purple-100 text-purple-800', label: 'Shipped' },
    delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
    cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    out_for_delivery: { color: 'bg-indigo-100 text-indigo-800', label: 'Out for Delivery' }
  };
  
  const { color, label } = variants[status];
  
  return (
    <Badge variant="outline" className={`${color} border-none`}>
      {label}
    </Badge>
  );
};

// Function to render payment status badges
const getPaymentStatusBadge = (status: PaymentStatus) => {
  const variants: Record<PaymentStatus, { color: string; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
  };

  const variant = variants[status];

  if (!variant) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-none capitalize">
        {status || 'N/A'}
      </Badge>
    );
  }

  const { color, label } = variant;

  return (
    <Badge variant="outline" className={`${color} border-none`}>
      {label}
    </Badge>
  );
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ 
  orders, 
  isLoading, 
  onViewOrder, 
  onUpdateStatus,
  onRefresh 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('paid');
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Handle order selection
  const toggleOrderSelection = (order: Order) => {
    setSelectedOrders(prev => {
      const isSelected = prev.some(o => o.id === order.id);
      if (isSelected) {
        return prev.filter(o => o.id !== order.id);
      } else {
        return [...prev, order];
      }
    });
  };

  // Handle select all orders
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders([...filteredOrders]);
    }
  };

  // Handle single order print
  const handlePrintSingleOrder = (order: Order) => {
    // Dispatch a custom event that PrintOrderDialog will listen for
    window.dispatchEvent(new CustomEvent('print-order', { detail: order }));
  };
  
  // Handle bulk print of selected orders
  const handlePrintSelectedOrders = () => {
    if (selectedOrders.length === 0) return;
    
    // Create a custom event with all selected orders
    const printEvent = new CustomEvent('print-orders', { 
      detail: { orders: selectedOrders } 
    });
    window.dispatchEvent(printEvent);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setDateRange({});
  };
  
  // Filter orders based on all filters
  const filteredOrders = orders.filter(order => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    // Filter by payment status
    const matchesPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    
    // Filter by date range
    let matchesDateRange = true;
    if (dateRange.from) {
      const orderDate = new Date(order.created);
      matchesDateRange = orderDate >= dateRange.from;
      
      if (dateRange.to) {
        // Set the end of day for the to date
        const toDateEnd = new Date(dateRange.to);
        toDateEnd.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && orderDate <= toDateEnd;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Search and primary filters row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {paymentStatusFilter === 'paid' ? (
              <Button
                variant="outline"
                onClick={() => setPaymentStatusFilter('all')}
                className="whitespace-nowrap"
              >
                Show All
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setPaymentStatusFilter('paid')}
                className="whitespace-nowrap"
              >
                Show Paid Only
              </Button>
            )}
            {selectedOrders.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrintSelectedOrders}
                className="whitespace-nowrap"
              >
                <Printer size={16} className="mr-2" />
                Print {selectedOrders.length} Selected
              </Button>
            )}
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </div>
        
        {/* Advanced filters section */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-gray-50">
            <div>
              <label className="text-sm font-medium mb-1 block">Order Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Status</label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Date Range</label>
              <DateRangePicker 
                date={dateRange} 
                onDateChange={setDateRange} 
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="secondary" 
                onClick={resetFilters} 
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        )}
        
        {/* Filter summary */}
        {(statusFilter !== 'all' || paymentStatusFilter !== 'all' || dateRange.from) && (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="font-medium">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {statusFilter}
              </Badge>
            )}
            {paymentStatusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Payment: {paymentStatusFilter}
              </Badge>
            )}
            {dateRange.from && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {format(dateRange.from, 'dd MMM yyyy')}
                {dateRange.to && ` - ${format(dateRange.to, 'dd MMM yyyy')}`}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Selected Orders Info */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 p-2 rounded-md text-sm flex justify-between items-center">
          <span>
            {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrders([])}>Clear selection</Button>
        </div>
      )}
      
      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox 
                  checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  {Array(8).fill(0).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center">
                    <AlertCircle size={24} className="mb-2" />
                    <p>No orders found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id} className={selectedOrders.some(o => o.id === order.id) ? 'bg-blue-50' : ''}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedOrders.some(o => o.id === order.id)}
                      onCheckedChange={() => toggleOrderSelection(order)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name || order.user_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{order.customer_email || order.user_email || 'N/A'}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{getPaymentStatusBadge(order.payment_status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{order.total?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(order.created), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => onViewOrder(order)}>
                        <Eye size={16} />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewOrder(order)}>
                            <Eye size={14} className="mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit size={14} className="mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handlePrintSingleOrder(order)}>
                            <Printer size={14} className="mr-2" />
                            Print Slip
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
