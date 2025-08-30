import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { DataTable } from '@/components/ui/data-table';
import { columns } from '@/components/tables/products/columns';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { PlusIcon, LayoutGrid, LayoutList } from 'lucide-react';
import { useState } from 'react';
import { CreateProductDialog } from '@/components/dialogs/CreateProductDialog';
import { ViewProductDialog } from '@/components/dialogs/ViewProductDialog';
import { EditProductDialog } from '@/components/dialogs/EditProductDialog';
import { Product } from '@/types/schema';
import { Input } from '@/components/ui/input';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { ProductCardGrid } from '@/components/cards/ProductCardGrid';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'table' | 'card';

const ProductsPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('card'); 
  const perPage = 10;
  const pbUrl = import.meta.env.VITE_POCKETBASE_URL as string | undefined;

  const { 
    products, 
    isLoading, 
    error, 
    totalPages,
    createProduct,
    updateProduct,
    refetch 
  } = useProducts({
    page,
    perPage,
    searchTerm,
    sort: '-created'
  });

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewModeChange = (value: string) => {
    if (value) {
      setViewMode(value as ViewMode);
    }
  };

  // Do not hard-fail the page; show a warning and continue rendering with any available data/fallbacks
  const warning = error
    ? `Error loading products: ${error.message}`
    : !pbUrl
      ? 'PocketBase URL is not configured (VITE_POCKETBASE_URL). Showing sample data.'
      : '';

  return (
    <AdminLayout>
      <div className="space-y-4 p-4">
        {warning && (
          <div className="mb-2 rounded border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-800 dark:text-yellow-200">
            {warning}
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        <div className="flex items-center justify-between space-x-2 pb-4">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="max-w-sm"
          />
          
          <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange}>
            <ToggleGroupItem value="table" aria-label="Table view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {viewMode === 'table' ? (
          <DataTable
            columns={columns(handleViewProduct, handleEditProduct)}
            data={products}
            isLoading={isLoading}
            searchField="name"
          />
        ) : (
          <ProductCardGrid
            products={products}
            onView={handleViewProduct}
            onEdit={handleEditProduct}
            isLoading={isLoading}
          />
        )}

        {totalPages > 1 && (
          <CustomPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        <CreateProductDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={async (data) => {
            await createProduct.mutateAsync(data);
          }}
        />

        <ViewProductDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          product={selectedProduct}
        />

        <EditProductDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          product={selectedProduct}
          onSubmit={updateProduct.mutateAsync}
        />
      </div>
    </AdminLayout>
  );
};

export default ProductsPage;
