
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus } from '@/lib/pocketbase';
import { mapPocketBaseOrderToOrder } from '@/lib/mapper';

const OrdersPage: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders from PocketBase
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  // Map PocketBase records to our Order type
  const orders = data?.items.map(mapPocketBaseOrderToOrder) || [];

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) => 
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      // Invalidate orders query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateOrderMutation.mutate(
      { orderId, status },
      {
        onSuccess: () => {
          toast({
            title: 'Order Updated',
            description: `Order ${orderId.slice(0, 8)} status changed to ${status}`,
          });
          
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({
              ...selectedOrder,
              status: status,
              updated: new Date().toISOString()
            });
          }
        },
        onError: (error) => {
          toast({
            title: 'Update Failed',
            description: `Failed to update order status: ${error}`,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-4 text-red-500">
          Error loading orders: {(error as Error).message}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">Manage and process customer orders</p>
          </div>
        </div>
        
        <OrdersTable 
          orders={orders}
          isLoading={isLoading}
          onViewOrder={handleViewOrder}
          onUpdateStatus={handleUpdateOrderStatus}
        />
        
        <OrderDetailsModal 
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
