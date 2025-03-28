
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { Order, OrderStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Using the same mock orders from DashboardPage
const mockOrders: Order[] = [
  {
    id: 'ORD12345678',
    user_id: 'USR001',
    user_name: 'Raj Sharma',
    user_email: 'raj.sharma@example.com',
    status: 'pending',
    payment_status: 'pending',
    payment_id: 'rzp_12345',
    payment_method: 'card',
    shipping_address: {
      id: 'ADDR001',
      user_id: 'USR001',
      name: 'Raj Sharma',
      street: '123 Main St, Malviya Nagar',
      city: 'New Delhi',
      state: 'Delhi',
      postal_code: '110017',
      country: 'India',
      phone: '+91 9876543210',
      is_default: true
    },
    items: [
      {
        id: 'ITEM001',
        order_id: 'ORD12345678',
        product_id: 'PROD001',
        product_name: 'Organic Turmeric Powder',
        product_price: 350,
        quantity: 2,
        total: 700
      },
      {
        id: 'ITEM002',
        order_id: 'ORD12345678',
        product_id: 'PROD002',
        product_name: 'Himalayan Pink Salt',
        product_price: 250,
        quantity: 1,
        total: 250
      }
    ],
    subtotal: 950,
    shipping_fee: 50,
    tax: 95,
    discount: 100,
    total: 995,
    notes: 'Please deliver in the evening',
    created: '2023-08-15T10:30:00Z',
    updated: '2023-08-15T10:35:00Z'
  },
  {
    id: 'ORD87654321',
    user_id: 'USR002',
    user_name: 'Priya Patel',
    user_email: 'priya.patel@example.com',
    status: 'delivered',
    payment_status: 'paid',
    payment_id: 'rzp_67890',
    payment_method: 'upi',
    shipping_address: {
      id: 'ADDR002',
      user_id: 'USR002',
      name: 'Priya Patel',
      street: '456 Park Ave, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400050',
      country: 'India',
      phone: '+91 8765432109',
      is_default: true
    },
    items: [
      {
        id: 'ITEM003',
        order_id: 'ORD87654321',
        product_id: 'PROD003',
        product_name: 'Organic Coconut Oil',
        product_price: 400,
        quantity: 3,
        total: 1200
      }
    ],
    subtotal: 1200,
    shipping_fee: 0,
    tax: 120,
    discount: 0,
    total: 1320,
    created: '2023-08-14T15:45:00Z',
    updated: '2023-08-15T09:20:00Z'
  },
  {
    id: 'ORD98765432',
    user_id: 'USR003',
    user_name: 'Amit Kumar',
    user_email: 'amit.kumar@example.com',
    status: 'processing',
    payment_status: 'paid',
    payment_id: 'rzp_54321',
    payment_method: 'card',
    shipping_address: {
      id: 'ADDR003',
      user_id: 'USR003',
      name: 'Amit Kumar',
      street: '789 Lake Road, HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      postal_code: '560102',
      country: 'India',
      phone: '+91 7654321098',
      is_default: true
    },
    items: [
      {
        id: 'ITEM004',
        order_id: 'ORD98765432',
        product_id: 'PROD004',
        product_name: 'Premium Cardamom',
        product_price: 800,
        quantity: 1,
        total: 800
      },
      {
        id: 'ITEM005',
        order_id: 'ORD98765432',
        product_id: 'PROD005',
        product_name: 'Black Pepper',
        product_price: 300,
        quantity: 2,
        total: 600
      }
    ],
    subtotal: 1400,
    shipping_fee: 70,
    tax: 140,
    discount: 200,
    total: 1410,
    created: '2023-08-13T09:15:00Z',
    updated: '2023-08-13T09:20:00Z'
  },
  {
    id: 'ORD56789012',
    user_id: 'USR004',
    user_name: 'Sneha Reddy',
    user_email: 'sneha.reddy@example.com',
    status: 'shipped',
    payment_status: 'paid',
    payment_id: 'rzp_98765',
    payment_method: 'netbanking',
    shipping_address: {
      id: 'ADDR004',
      user_id: 'USR004',
      name: 'Sneha Reddy',
      street: '42 Tech Park, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      postal_code: '500081',
      country: 'India',
      phone: '+91 6543210987',
      is_default: true
    },
    items: [
      {
        id: 'ITEM006',
        order_id: 'ORD56789012',
        product_id: 'PROD006',
        product_name: 'Saffron Premium',
        product_price: 1500,
        quantity: 1,
        total: 1500
      },
      {
        id: 'ITEM007',
        order_id: 'ORD56789012',
        product_id: 'PROD007',
        product_name: 'Organic Honey',
        product_price: 450,
        quantity: 2,
        total: 900
      }
    ],
    subtotal: 2400,
    shipping_fee: 0,
    tax: 240,
    discount: 0,
    total: 2640,
    created: '2023-08-12T14:20:00Z',
    updated: '2023-08-13T11:45:00Z'
  },
  {
    id: 'ORD43210987',
    user_id: 'USR005',
    user_name: 'Vikram Singh',
    user_email: 'vikram.singh@example.com',
    status: 'cancelled',
    payment_status: 'refunded',
    payment_id: 'rzp_24680',
    payment_method: 'card',
    shipping_address: {
      id: 'ADDR005',
      user_id: 'USR005',
      name: 'Vikram Singh',
      street: '34 Civil Lines',
      city: 'Jaipur',
      state: 'Rajasthan',
      postal_code: '302006',
      country: 'India',
      phone: '+91 5432109876',
      is_default: true
    },
    items: [
      {
        id: 'ITEM008',
        order_id: 'ORD43210987',
        product_id: 'PROD008',
        product_name: 'Premium Tea Collection',
        product_price: 1200,
        quantity: 1,
        total: 1200
      }
    ],
    subtotal: 1200,
    shipping_fee: 100,
    tax: 120,
    discount: 0,
    total: 1420,
    notes: 'Customer requested cancellation due to delayed shipping',
    created: '2023-08-10T09:30:00Z',
    updated: '2023-08-11T15:20:00Z'
  }
];

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Simulating API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setOrders(mockOrders);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    // In a real app, this would be an API call
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: status as OrderStatus, updated: new Date().toISOString() } 
          : order
      )
    );
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        status: status as OrderStatus,
        updated: new Date().toISOString()
      });
    }
    
    toast({
      title: 'Order Updated',
      description: `Order ${orderId.slice(0, 8)} status changed to ${status}`,
    });
  };

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
