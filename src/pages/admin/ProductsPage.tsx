
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// This is a placeholder component - in a real implementation, this would fetch actual product data
const ProductsPage = () => {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Placeholder for actual API call
      return [
        { id: '1', name: 'Coffee Beans - Dark Roast', price: 14.99, stock: 45, category: 'Coffee Beans' },
        { id: '2', name: 'Coffee Beans - Medium Roast', price: 12.99, stock: 30, category: 'Coffee Beans' },
        { id: '3', name: 'Coffee Grinder', price: 59.99, stock: 15, category: 'Equipment' },
        { id: '4', name: 'Coffee Filter Papers', price: 4.99, stock: 100, category: 'Accessories' },
        { id: '5', name: 'Coffee Mug', price: 9.99, stock: 25, category: 'Accessories' },
      ];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-64 pl-8"
              />
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>Manage your products, prices, and stock levels.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">Loading products...</div>
            ) : error ? (
              <div className="text-red-500 p-4">Error loading products</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Price</th>
                      <th className="text-right p-2">Stock</th>
                      <th className="text-right p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products?.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {product.name}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{product.category}</Badge>
                        </td>
                        <td className="p-2 text-right">${product.price.toFixed(2)}</td>
                        <td className="p-2 text-right">
                          <span className={product.stock < 20 ? "text-destructive font-medium" : ""}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
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

export default ProductsPage;
