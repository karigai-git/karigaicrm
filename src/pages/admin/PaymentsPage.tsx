
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Search, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// This is a placeholder component - in a real implementation, this would fetch actual payment data
const PaymentsPage = () => {
  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      // Placeholder for actual API call
      return [
        { id: '1', order_id: 'ORD-001', customer: 'Jane Smith', amount: 125.50, status: 'completed', date: '2023-08-15', method: 'Credit Card' },
        { id: '2', order_id: 'ORD-002', customer: 'John Doe', amount: 89.99, status: 'completed', date: '2023-08-14', method: 'PayPal' },
        { id: '3', order_id: 'ORD-003', customer: 'Alice Johnson', amount: 210.75, status: 'pending', date: '2023-08-13', method: 'Bank Transfer' },
        { id: '4', order_id: 'ORD-004', customer: 'Robert Brown', amount: 45.99, status: 'failed', date: '2023-08-12', method: 'Credit Card' },
        { id: '5', order_id: 'ORD-005', customer: 'Sarah Davis', amount: 150.25, status: 'completed', date: '2023-08-11', method: 'PayPal' },
      ];
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by order ID..."
                className="w-64 pl-8"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
            <CardDescription>View and manage all payment transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading payments...</div>
            ) : error ? (
              <div className="text-red-500 p-4">Error loading payments</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order ID</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Method</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-center p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments?.map((payment) => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{payment.order_id}</td>
                        <td className="p-2">{payment.customer}</td>
                        <td className="p-2">{payment.method}</td>
                        <td className="p-2 text-right">${payment.amount.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-2">{payment.date}</td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default PaymentsPage;
