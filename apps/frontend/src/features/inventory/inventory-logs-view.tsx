'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi, inventoryApi } from '@/lib/api/client';
import { Product, InventoryMovement } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Package,
  Search,
  ClipboardList,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Per-product transaction modal ──────────────────────────────────────────

interface InventoryTransactionModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InventoryTransactionModal({ product, open, onOpenChange }: InventoryTransactionModalProps) {
  const { data: movements, isLoading } = useQuery<InventoryMovement[]>({
    queryKey: ['inventory-history', product?.id],
    queryFn: async () => {
      const res = await inventoryApi.get(`/inventory/${product?.id}/history`);
      return res.data;
    },
    enabled: open && !!product?.id,
  });

  const totalAdded    = movements?.filter(m => m.action === 'add').reduce((s, m) => s + m.delta, 0) ?? 0;
  const totalDeducted = movements?.filter(m => m.action !== 'add').reduce((s, m) => s + Math.abs(m.delta), 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-white/10 text-white p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p>{product?.name}</p>
              <p className="text-xs font-normal text-zinc-500 mt-0.5 uppercase tracking-wider">
                Transaction History
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Summary stats */}
        {!isLoading && movements && movements.length > 0 && (
          <div className="grid grid-cols-3 gap-3 px-6 pt-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Transactions</p>
              <p className="text-2xl font-bold text-white mt-1">{movements.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/10 text-center">
              <p className="text-xs text-green-500 uppercase tracking-wider">Total Added</p>
              <p className="text-2xl font-bold text-green-400 mt-1">+{totalAdded}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/10 text-center">
              <p className="text-xs text-orange-500 uppercase tracking-wider">Total Deducted</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">-{totalDeducted}</p>
            </div>
          </div>
        )}

        {/* Movement list */}
        <div className="py-4 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !movements || movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <ArrowUpDown className="h-7 w-7 text-zinc-600" />
              </div>
              <p className="text-zinc-400 font-medium">No movements yet</p>
              <p className="text-zinc-600 text-sm">Adjust stock levels to see transactions here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
              {movements.map((entry, idx) => {
                const isAdd = entry.action === 'add';
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-xl border transition-colors',
                      isAdd
                        ? 'bg-green-500/5 border-green-500/10 hover:bg-green-500/10'
                        : 'bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center shrink-0',
                        isAdd ? 'bg-green-500/20' : 'bg-orange-500/20'
                      )}>
                        {isAdd
                          ? <TrendingUp className="h-4 w-4 text-green-400" />
                          : <TrendingDown className="h-4 w-4 text-orange-400" />
                        }
                      </div>
                      <div>
                        <p className={cn('font-bold text-sm', isAdd ? 'text-green-400' : 'text-orange-400')}>
                          {isAdd ? '+' : ''}{entry.delta} units
                        </p>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
                          {isAdd ? 'Stock Added' : 'Stock Deducted'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400 font-medium">
                        {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-0.5">
                        {format(new Date(entry.createdAt), 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Inventory Logs View ─────────────────────────────────────────────────

export function InventoryLogsView() {
  const [search, setSearch]                   = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productApi.get('/products');
      return res.data;
    },
  });

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Transaction Logs</h1>
        <p className="text-zinc-500 mt-1">Select a product to view its complete transaction history.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-white/5 border-white/10 focus:border-primary/30 text-white placeholder:text-zinc-600"
        />
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center rounded-2xl border border-white/5 bg-white/2">
          <Package className="h-12 w-12 text-zinc-700" />
          <p className="text-zinc-400 font-medium">No products found</p>
          <p className="text-zinc-600 text-sm">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="group text-left p-5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-primary/20 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-1 rounded-full">
                  <Tag className="h-3 w-3" />
                  {product.category || 'General'}
                </span>
              </div>

              <div className="mt-3">
                <p className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
                  {product.name}
                </p>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  {product.description || 'No description'}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                <ClipboardList className="h-3.5 w-3.5" />
                <span>View transaction log →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Transaction modal */}
      <InventoryTransactionModal
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={open => !open && setSelectedProduct(null)}
      />
    </div>
  );
}
