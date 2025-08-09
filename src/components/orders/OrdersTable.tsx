import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Order } from "@/types/schema";
import type { FC } from "react";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  AlertCircle,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent } from "@/components/ui/card";

// Keep types exactly the same
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "out_for_delivery";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface OrdersTableProps {
  orders: Order[];
  isLoading?: boolean;
  onViewOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onRefresh?: () => void;
}

// Status badges (unchanged)
const getStatusBadge = (status: OrderStatus) => {
  const variants: Record<OrderStatus, { color: string; label: string }> = {
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
    shipped: { color: "bg-purple-100 text-purple-800", label: "Shipped" },
    delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
    cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    out_for_delivery: {
      color: "bg-indigo-100 text-indigo-800",
      label: "Out for Delivery",
    },
  };
  const { color, label } = variants[status];
  return (
    <Badge variant="outline" className={`${color} border-none`}>
      {label}
    </Badge>
  );
};

const getPaymentStatusBadge = (status: PaymentStatus) => {
  const variants: Record<PaymentStatus, { color: string; label: string }> = {
    pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    paid: { color: "bg-green-100 text-green-800", label: "Paid" },
    failed: { color: "bg-red-100 text-red-800", label: "Failed" },
    refunded: { color: "bg-gray-100 text-gray-800", label: "Refunded" },
  };
  const variant = variants[status];
  if (!variant) {
    return (
      <Badge
        variant="outline"
        className="bg-gray-100 text-gray-800 border-none capitalize"
      >
        {status || "N/A"}
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

export const OrdersTable: FC<OrdersTableProps> = ({
  orders,
  isLoading,
  onViewOrder,
  onUpdateStatus,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<string>("paid");
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showFilters, setShowFilters] = useState(false);

  const toggleOrderSelection = (order: Order) => {
    setSelectedOrders((prev) => {
      const isSelected = prev.some((o) => o.id === order.id);
      return isSelected ? prev.filter((o) => o.id !== order.id) : [...prev, order];
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) setSelectedOrders([]);
    else setSelectedOrders([...filteredOrders]);
  };

  const handlePrintSingleOrder = (order: Order) => {
    window.dispatchEvent(new CustomEvent("print-order", { detail: order }));
  };

  const handlePrintSelectedOrders = () => {
    if (selectedOrders.length === 0) return;
    const printEvent = new CustomEvent("print-orders", {
      detail: { orders: selectedOrders },
    });
    window.dispatchEvent(printEvent);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setDateRange({});
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      order.id.toLowerCase().includes(q) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(q)) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentStatusFilter === "all" ||
      order.payment_status === paymentStatusFilter;

    let matchesDateRange = true;
    if (dateRange.from) {
      const d = new Date(order.created);
      matchesDateRange = d >= dateRange.from!;
      if (dateRange.to) {
        const toEnd = new Date(dateRange.to);
        toEnd.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && d <= toEnd;
      }
    }
    return matchesSearch && matchesStatus && matchesPayment && matchesDateRange;
  });

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, customer, email…"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            {paymentStatusFilter === "paid" ? (
              <Button
                variant="outline"
                onClick={() => setPaymentStatusFilter("all")}
                className="whitespace-nowrap"
              >
                Show All
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setPaymentStatusFilter("paid")}
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
                <Printer size={16} className="mr-2" /> Print{" "}
                {selectedOrders.length} Selected
              </Button>
            )}
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/30">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Order Status
              </label>
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
                  <SelectItem value="out_for_delivery">
                    Out for Delivery
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Payment Status
              </label>
              <Select
                value={paymentStatusFilter}
                onValueChange={setPaymentStatusFilter}
              >
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
              <label className="text-sm font-medium mb-1 block">
                Date Range
              </label>
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
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
      </div>

      {(statusFilter !== "all" ||
        paymentStatusFilter !== "all" ||
        dateRange.from) && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="font-medium">Active filters:</span>
          {statusFilter !== "all" && (
            <Badge variant="secondary">Status: {statusFilter}</Badge>
          )}
          {paymentStatusFilter !== "all" && (
            <Badge variant="secondary">Payment: {paymentStatusFilter}</Badge>
          )}
          {dateRange.from && (
            <Badge variant="secondary">
              Date: {format(dateRange.from!, "dd MMM yyyy")}{" "}
              {dateRange.to && ` - ${format(dateRange.to, "dd MMM yyyy")}`}
            </Badge>
          )}
        </div>
      )}

      {/* MOBILE: Card list */}
      <div className="grid gap-2 sm:hidden">
        {isLoading ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-3">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="mt-2 h-3 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="mt-1.5 h-3 w-1/2 rounded bg-muted animate-pulse" />
                </CardContent>
              </Card>
            ))
        ) : filteredOrders.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-4 text-center text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-5 w-5" />
              No orders found.
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order.id}
              className={`rounded-2xl border-0 shadow-sm ring-1 ring-black/5`}
            >
              <CardContent className="p-3">
                {/* top row */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedOrders.some((o) => o.id === order.id)}
                    onCheckedChange={() => toggleOrderSelection(order)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        #{order.id.slice(0, 8)}
                      </div>

                      {/* HIDE 3-dot on mobile */}
                      <div className="hidden sm:block">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="-mr-2"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewOrder(order)}>
                              <Eye className="mr-2 h-4 w-4" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Update status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePrintSingleOrder(order)}
                            >
                              <Printer className="mr-2 h-4 w-4" /> Print slip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(order.created), "dd MMM yyyy")} • ₹
                      {order.total?.toFixed(2) || "0.00"}
                    </div>

                    {/* middle: customer + badges */}
                    <div className="mt-2">
                      <div className="text-sm font-medium">
                        {order.customer_name || order.user_name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customer_email || order.user_email || "N/A"}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {getStatusBadge(order.status as OrderStatus)}
                      {getPaymentStatusBadge(
                        order.payment_status as PaymentStatus
                      )}
                    </div>

                    {/* bottom row: actions */}
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onViewOrder(order)}
                        className="rounded-full"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => handlePrintSingleOrder(order)}
                      >
                        <Printer className="mr-2 h-4 w-4" /> Slip
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* DESKTOP/TABLET: Keep original table UX */}
      <div className="hidden sm:block border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={
                    filteredOrders.length > 0 &&
                    selectedOrders.length === filteredOrders.length
                  }
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
              Array(5)
                .fill(0)
                .map((_, i) => (
                  <TableRow key={i}>
                    {Array(8)
                      .fill(0)
                      .map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                  </TableRow>
                ))
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center">
                    <AlertCircle className="mb-2 h-5 w-5" />
                    No orders found matching your filters.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={
                    selectedOrders.some((o) => o.id === order.id)
                      ? "bg-primary/5"
                      : ""
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.some((o) => o.id === order.id)}
                      onCheckedChange={() => toggleOrderSelection(order)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {order.customer_name || order.user_name || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.customer_email || order.user_email || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status as OrderStatus)}
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(
                      order.payment_status as PaymentStatus
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{order.total?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.created), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewOrder(order)}
                      >
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
                            <Eye size={14} className="mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit size={14} className="mr-2" /> Update Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handlePrintSingleOrder(order)}
                          >
                            <Printer size={14} className="mr-2" /> Print Slip
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
