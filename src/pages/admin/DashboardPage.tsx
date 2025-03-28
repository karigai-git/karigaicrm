
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { MetricsGrid } from '@/components/dashboard/DashboardMetrics';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderDetailsModal } from '@/components/orders/OrderDetailsModal';
import { DashboardMetrics, Order, OrderStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

// Mock data for dashboard metrics
const mockMetrics: DashboardMetrics = {
  total_orders: 248,
  pending_orders: 12,
  completed_orders: 206,
  total_revenue: 1259750,
  average_order_value: 5079.64,
  revenue_today: 42650
};

// Mock data for orders
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
  }
];

// Mock data for chart
const mockRevenueData = [
  { month: 'Jan', revenue: 45000 },
  { month: 'Feb', revenue: 52000 },
  { month: 'Mar', revenue: 49000 },
  { month: 'Apr', revenue: 62000 },
  { month: 'May', revenue: 89000 },
  { month: 'Jun', revenue: 73000 },
  { month: 'Jul', revenue: 102000 },
  { month: 'Aug', revenue: 96000 },
];

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(mockMetrics);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Simulating API fetch
  useEffect(() => {
    const timer = setTimeout(() => {
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your store performance</p>
        </div>
        
        {/* Metrics Cards */}
        <MetricsGrid metrics={metrics} isLoading={isLoading} />
        
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the current year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="#0c8ee8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Orders */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <OrdersTable 
            orders={orders} 
            isLoading={isLoading}
            onViewOrder={handleViewOrder}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        </div>
        
        {/* Order Details Modal */}
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

export default DashboardPage;
