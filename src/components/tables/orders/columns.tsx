import { Order } from '@/types/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, Printer } from 'lucide-react';

type BadgeVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning';

export const columns = (onView: (order: Order) => void) => [
  {
    header: 'Order ID',
    accessorKey: 'id',
    cell: (order: Order) => (
      <span className="font-medium">{order.id}</span>
    ),
  },
  {
    header: 'Customer',
    accessorKey: 'customer_name',
    cell: (order: Order) => (
      <div className="flex flex-col">
        <span className="font-medium">{order.customer_name}</span>
        <span className="text-sm text-muted-foreground">{order.customer_email}</span>
      </div>
    ),
  },
  {
    header: 'Amount',
    accessorKey: 'total',
    cell: (order: Order) => (
      <span className="font-medium">
        &#8377;{order.total ? order.total.toFixed(2) : '0.00'}
      </span>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (order: Order) => {
      const statusMap: Record<string, BadgeVariant> = {
        pending: 'secondary',
        processing: 'default',
        completed: 'default',
        cancelled: 'destructive',
      };

      return (
        <Badge variant={statusMap[order.status] || 'outline'}>
          {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
        </Badge>
      );
    },
  },
  {
    header: 'Payment',
    accessorKey: 'payment_status',
    cell: (order: Order) => {
      const statusMap: Record<string, BadgeVariant> = {
        pending: 'secondary',
        paid: 'success',
        failed: 'destructive',
      };

      return (
        <Badge variant={statusMap[order.payment_status] || 'outline'}>
          {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'Unknown'}
        </Badge>
      );
    },
  },
  {
    header: 'Created',
    accessorKey: 'created',
    cell: (order: Order) => (
      <span className="text-muted-foreground">
        {order.created ? formatDate(order.created) : 'Unknown'}
      </span>
    ),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: (order: Order) => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => onView(order)}>
          <Eye size={16} className="mr-2" />
          View
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(order)}>
              <Eye size={14} className="mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('print-order', { detail: order }))}>
              <Printer size={14} className="mr-2" />
              Print Slip
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  },
];
