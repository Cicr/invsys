'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, inventoryApi } from '@/lib/api/client';
import { Product } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  MoreHorizontal, 
  Globe, 
  ChevronDown, 
  History, 
  Trash2, 
  PackageSearch,
  Loader2,
  DollarSign,
  Edit,
  Search,
  Filter,
  X,
  Tag
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { PriceHistoryModal } from './price-history-modal';
import { InventoryAdjustment } from '../inventory/inventory-adjustment';
import { EditPriceModal } from './edit-price-modal';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAuthStore } from '../auth/auth-store';
import { InventoryHistoryModal } from '../inventory/inventory-history-modal';
import { EditProductModal } from './edit-product-modal';

type Currency = 'USD' | 'EUR' | 'DOP' | 'CNY';

function StockCell({ productId }: { productId: string }) {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory', productId],
    queryFn: async () => {
      const response = await inventoryApi.get(`/inventory/${productId}`);
      return response.data;
    },
  });

  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />;
  
  const qty = inventory?.quantity ?? 0;
  
  return (
    <span className={qty <= 10 ? "text-orange-400 font-bold" : "text-zinc-400"}>
      {qty}
    </span>
  );
}

export function ProductTable() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);
  const [historyProductName, setHistoryProductName] = useState<string>('');
  const [invHistoryProductId, setInvHistoryProductId] = useState<string | null>(null);
  const [invHistoryProductName, setInvHistoryProductName] = useState<string>('');
  const [adjustmentProduct, setAdjustmentProduct] = useState<{id: string, qty: number} | null>(null);
  const [editPriceProduct, setEditPriceProduct] = useState<Product | null>(null);
  const [editDetailsProduct, setEditDetailsProduct] = useState<Product | null>(null);
  
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role === 'admin';
  
  const queryClient = useQueryClient();

  // Fetch all products; category filtering applied server-side when set
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', currency, activeCategory],
    queryFn: async () => {
      const response = await productApi.get('/products', {
        params: {
          currency: currency !== 'USD' ? currency : undefined,
          category: activeCategory || undefined,
        },
      });
      return response.data;
    },
  });

  // Derive unique categories from all products (no-category fetch) for filter pills
  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ['products', currency],
    queryFn: async () => {
      const response = await productApi.get('/products', {
        params: { currency: currency !== 'USD' ? currency : undefined },
      });
      return response.data;
    },
  });

  const categories = useMemo(() => {
    const cats = new Set(allProducts?.map(p => p.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [allProducts]);

  // Client-side name/sku search on top of server-side category filter
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products?.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku ?? '').toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product archived successfully');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error('Failed to delete product', {
        description: error.response?.data?.message || 'Server error',
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-full animate-pulse bg-white/5 rounded-md" />
        ))}
      </div>
    );
  }

  const formatPriceValue = (value: number | string | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return (num !== undefined && !isNaN(num)) ? num.toFixed(2) : 'N/A';
  };

  const getDisplayPrice = (product: Product) => {
    switch (currency) {
      case 'EUR':
        return `€${formatPriceValue(product.priceEUR)}`;
      case 'DOP':
        return `RD$ ${formatPriceValue(product.priceDOP)}`;
      case 'CNY':
        return `¥${formatPriceValue(product.priceCNY)}`;
      default:
        return `$${formatPriceValue(product.priceUsd)}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-white">Global Catalog</h2>
          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
            {filteredProducts?.length ?? 0} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "bg-white/5 border-white/10")}>
              <Globe className="mr-2 h-4 w-4" />
              {currency}
              <ChevronDown className="ml-2 h-4 w-4 text-zinc-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10">
              {(['USD', 'EUR', 'DOP', 'CNY'] as Currency[]).map((curr) => (
                <DropdownMenuItem
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className="text-white hover:bg-white/10"
                >
                  {curr}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Search + Category filter bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by name, SKU, description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <Filter className="h-3.5 w-3.5" />
            Category:
          </span>
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
              activeCategory === null
                ? 'bg-primary text-black border-primary'
                : 'bg-white/5 text-zinc-400 border-white/10 hover:border-primary/30 hover:text-white'
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                activeCategory === cat
                  ? 'bg-primary text-black border-primary'
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:border-primary/30 hover:text-white'
              )}
            >
              <Tag className="h-3 w-3" />
              {cat}
            </button>
          ))}
        </div>

        {/* Active filters summary */}
        {(search || activeCategory) && (
          <button
            onClick={() => { setSearch(''); setActiveCategory(null); }}
            className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear all filters
          </button>
        )}
      </div>

      <div className="rounded-md border border-white/10 bg-black/20 overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Category</TableHead>
              <TableHead className="text-right text-zinc-400">Stock</TableHead>
              <TableHead className="text-right text-zinc-400">Price ({currency})</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-zinc-500">
                  No products match your filters.
                </TableCell>
              </TableRow>
            ) : filteredProducts?.map((product) => (
              <TableRow key={product.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                <TableCell className="font-medium text-white">
                  <div>
                    {product.name}
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{product.sku}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-[10px] bg-zinc-800 text-zinc-300 rounded uppercase tracking-wider">
                    {product.category || 'General'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <StockCell productId={product.id} />
                </TableCell>
                <TableCell className="text-right text-white font-semibold">
                  {getDisplayPrice(product)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 hover:bg-white/10 flex items-center justify-center")}>
                      <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10">
                      <DropdownMenuItem 
                        onClick={() => {
                          setHistoryProductId(product.id);
                          setHistoryProductName(product.name);
                        }}
                        className="text-white hover:bg-white/10"
                      >
                        <History className="mr-2 h-4 w-4" />
                        Price History
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setInvHistoryProductId(product.id);
                          setInvHistoryProductName(product.name);
                        }}
                        className="text-white hover:bg-white/10"
                      >
                        <History className="mr-2 h-4 w-4" />
                        Inventory Logs
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem 
                            onClick={() => setEditDetailsProduct(product)}
                            className="text-white hover:bg-white/10"
                          >
                            <Edit className="mr-2 h-4 w-4 text-blue-400" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setEditPriceProduct(product)}
                            className="text-white hover:bg-white/10"
                          >
                            <DollarSign className="mr-2 h-4 w-4 text-green-400" />
                            Edit Price
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              // Fetch current stock from cache or trigger refetch
                              const inv: { quantity: number } | undefined = queryClient.getQueryData(['inventory', product.id]);
                              setAdjustmentProduct({ id: product.id, qty: inv?.quantity ?? 0 });
                            }}
                            className="text-white hover:bg-white/10"
                          >
                            <PackageSearch className="mr-2 h-4 w-4" />
                            Adjust Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Are you sure you want to archive this product?')) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                            className="text-red-400 hover:bg-red-400/10 focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PriceHistoryModal 
        open={!!historyProductId} 
        onOpenChange={(open) => !open && setHistoryProductId(null)}
        productId={historyProductId || ''}
        productName={historyProductName}
      />

      <InventoryHistoryModal 
        open={!!invHistoryProductId} 
        onOpenChange={(open) => !open && setInvHistoryProductId(null)}
        productId={invHistoryProductId || ''}
        productName={invHistoryProductName}
      />

      <EditProductModal
        product={editDetailsProduct}
        open={!!editDetailsProduct}
        onOpenChange={(open) => !open && setEditDetailsProduct(null)}
      />

      <Dialog open={!!adjustmentProduct} onOpenChange={(open) => !open && setAdjustmentProduct(null)}>
        <DialogContent className="bg-transparent border-none p-0 max-w-md">
          {adjustmentProduct && (
            <InventoryAdjustment 
              productId={adjustmentProduct.id} 
              currentQuantity={adjustmentProduct.qty} 
            />
          )}
        </DialogContent>
      </Dialog>

      {editPriceProduct && (
        <EditPriceModal 
          open={!!editPriceProduct}
          onOpenChange={(open) => !open && setEditPriceProduct(null)}
          productId={editPriceProduct.id}
          productName={editPriceProduct.name}
          currentPrice={Number(editPriceProduct.priceUsd)}
        />
      )}
    </div>
  );
}
