import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { CreateOrderDialog } from '@/components/dialogs/CreateOrderDialog';
import { ViewOrderDialog } from '@/components/dialogs/ViewOrderDialog';
import { PrintOrderDialog } from '@/components/dialogs/PrintOrderDialog';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { Order } from '@/types/schema';

const OrdersPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { orders, isLoading, error, createOrder, updateOrder } = useOrders();

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 text-red-500">
          Error loading orders: {error.message}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Order
          </Button>
        </div>

        <OrdersTable
          orders={orders}
          isLoading={isLoading}
          onViewOrder={handleViewOrder}
          onUpdateStatus={(orderId, status) => {
            updateOrder.mutate({ id: orderId, data: { status } });
          }}
        />

        <CreateOrderDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={async (data) => {
            try {
              // Convert data to match the CreateOrderData type from useOrders.ts
              const orderData = {
                user_id: '', // Will be filled by backend
                status: data.status || 'pending',
                total_amount: data.totalAmount || 0,
                // Add any other required fields
                shipping_address: data.shipping_address_text,
                // Convert products to items array if needed
                items: data.products ? JSON.parse(data.products) : []
              };
              await createOrder.mutateAsync(orderData);
            } catch (error) {
              console.error('Failed to create order:', error);
            }
          }}
        />

        <ViewOrderDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          order={selectedOrder}
        />
        
        {/* Add PrintOrderDialog to handle print slip functionality */}
        <PrintOrderDialog />
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
