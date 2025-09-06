import React, { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { PlusIcon, RefreshCw } from "lucide-react";
import { CreateOrderDialog } from "@/components/dialogs/CreateOrderDialog";
import { ViewOrderDialog } from "@/components/dialogs/ViewOrderDialog";
import { PrintOrderDialog } from "@/components/dialogs/PrintOrderDialog";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { Order } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OrdersPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [query, setQuery] = useState("");

  const { orders, isLoading, error, createOrder, updateOrder, refetch } = useOrders();

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o: any) => {
      const fields = [
        o?.id,
        o?.status,
        // legacy user relation fields (may not exist)
        o?.user?.email,
        o?.user?.name,
        // direct customer fields used by CreateOrderDialog
        o?.customer_name,
        o?.customer_email,
        o?.customer_phone,
      ].filter(Boolean);
      return fields.some((v: string) => String(v).toLowerCase().includes(q));
    });
  }, [orders, query]);

  if (error) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-7xl p-4">
          <Card className="border-destructive/30">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">Error loading orders: {error.message}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => refetch?.()}>Try again</Button>
                <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Sticky page header */}
      <div
        className={cn(
          "sticky top-0 z-30 w-full border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <h1 className="flex-1 truncate text-xl font-semibold sm:text-2xl">Orders</h1>
          {/* Desktop add button */}
          <div className="hidden sm:block">
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" /> Add Order
            </Button>
          </div>
        </div>
        {/* Inline toolbar (search + refresh) */}
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order #, status, user…"
              className="h-9"
            />
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => refetch?.()} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-4">
        {/* Table / list container */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <OrdersTable
              orders={filteredOrders}
              isLoading={isLoading}
              onViewOrder={handleViewOrder}
              onUpdateStatus={(orderId, status) => {
                updateOrder.mutate({ id: orderId, data: { status } });
              }}
            />
            {/* Empty state */}
            {!isLoading && filteredOrders?.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="text-sm text-muted-foreground">No orders found{query ? " for your search." : "."}</div>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                  <PlusIcon className="mr-2 h-4 w-4" /> Create your first order
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAB for mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="pointer-events-none mx-auto mb-4 max-w-7xl px-4">
          <div className="pointer-events-auto ml-auto flex w-fit items-center gap-2 rounded-full border bg-background/95 p-2 shadow-lg backdrop-blur">
            <Button size="icon" className="h-12 w-12 rounded-full" onClick={() => setIsCreateDialogOpen(true)} aria-label="Add order">
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={async (data: any) => {
          try {
            // Build a payload compatible with the PocketBase orders collection
            // Avoid sending `shipping_address` relation with a text value
            const orderData: any = {
              // basic customer info
              customer_name: data.customer_name || '',
              customer_email: data.customer_email || '',
              customer_phone: data.customer_phone || '',
              // status & payment
              status: data.status || 'pending',
              payment_status: data.payment_status || 'pending',
              // amounts
              subtotal: Number(data.subtotal ?? 0),
              total: Number(data.total ?? data.totalAmount ?? 0),
              totalAmount: Number(data.totalAmount ?? data.total ?? 0),
              // address text only (no relation id)
              shipping_address_text: data.shipping_address_text || '',
              // optional notes
              notes: data.notes || '',
              // products JSON from dialog
              products: data.products || '[]',
            };
            // include shipping fee if available
            if (typeof (data as any).shipping_fee !== 'undefined') {
              orderData.shipping_fee = Number((data as any).shipping_fee) || 0;
            }

            await createOrder.mutateAsync(orderData as any);
          } catch (err) {
            console.error("Failed to create order:", err);
          }
        }}
      />

      <ViewOrderDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} order={selectedOrder} />

      {/* Print slip functionality */}
      <PrintOrderDialog />
    </AdminLayout>
  );
};

export default OrdersPage;
