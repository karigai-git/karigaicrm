
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus } from 'lucide-react';

// This is a placeholder component - in a real implementation, this would fetch actual customer data
const CustomersPage = () => {
  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      // Placeholder for actual API call
      return [
        { id: '1', name: 'Jane Smith', email: 'jane@example.com', orders: 5, total_spent: 550 },
        { id: '2', name: 'John Doe', email: 'john@example.com', orders: 3, total_spent: 320 },
        { id: '3', name: 'Alice Johnson', email: 'alice@example.com', orders: 7, total_spent: 890 },
        { id: '4', name: 'Robert Brown', email: 'robert@example.com', orders: 2, total_spent: 210 },
        { id: '5', name: 'Sarah Davis', email: 'sarah@example.com', orders: 4, total_spent: 475 },
      ];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="w-64 pl-8"
              />
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>Manage your customers and view their order history.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading customers...</div>
            ) : error ? (
              <div className="text-red-500 p-4">Error loading customers</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-right p-2">Orders</th>
                      <th className="text-right p-2">Total Spent</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers?.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{customer.name}</td>
                        <td className="p-2">{customer.email}</td>
                        <td className="p-2 text-right">{customer.orders}</td>
                        <td className="p-2 text-right">${customer.total_spent.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm">View</Button>
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

export default CustomersPage;
