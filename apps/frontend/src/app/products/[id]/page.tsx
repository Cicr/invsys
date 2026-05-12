'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productApi, inventoryApi } from '@/lib/api/client';
import { Product, InventoryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Package, DollarSign, Tag, Calendar, BadgeInfo } from 'lucide-react';
import { PriceHistoryList } from '@/features/products/price-history';
import { InventoryAdjustment } from '@/features/inventory/inventory-adjustment';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productApi.get(`/products/${id}`);
      return response.data;
    },
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem>({
    queryKey: ['inventory', id],
    queryFn: async () => {
      const response = await inventoryApi.get(`/inventory/${id}`);
      return response.data;
    },
  });

  if (productLoading || inventoryLoading) {
    return (
      <div className="p-8 space-y-8 bg-[#050505] min-h-screen text-white">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="p-8 text-white">Product not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="gap-2 hover:bg-white/5 -ml-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                {product.category || 'Materials'}
              </span>
              <span className="text-xs font-mono text-zinc-500">{product.sku}</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{product.name}</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-zinc-500 uppercase tracking-tighter">Current Valuation</p>
              <h2 className="text-4xl font-black text-white">${product.priceUsd.toFixed(2)}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Details & History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="p-8 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm space-y-6">
              <div className="flex items-center gap-2 text-zinc-400">
                <BadgeInfo className="h-4 w-4" />
                <h3 className="font-bold uppercase tracking-wider text-xs">Product Specifications</h3>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                {product.description || "High-precision component engineered for industrial applications. This SKU is optimized for high-throughput tracking within the INVSYS ecosystem, featuring real-time price history audit trails and Kafka-synchronized inventory levels."}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Global ID</p>
                  <p className="text-xs font-mono truncate text-zinc-300">{product.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Last Synced</p>
                  <p className="text-xs text-zinc-300">Just now</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Region</p>
                  <p className="text-xs text-zinc-300">Global (Multi-curr)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-zinc-500">Status</p>
                  <p className="text-xs text-green-500 font-bold">Active</p>
                </div>
              </div>
            </div>

            {/* Price History */}
            <PriceHistoryList productId={product.id} />
          </div>

          {/* Right Column: Inventory & Actions */}
          <div className="space-y-8">
            <InventoryAdjustment 
              productId={product.id} 
              currentQuantity={inventory?.quantity || 0} 
            />

            <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
              <h4 className="font-bold text-white mb-4">Admin Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-3 bg-black/40 border-white/5 hover:bg-black/60">
                  <Tag className="h-4 w-4" />
                  Apply Discount
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 bg-black/40 border-white/5 hover:bg-black/60">
                  <DollarSign className="h-4 w-4" />
                  Update Base Price
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 bg-black/40 border-white/5 hover:bg-black/60 text-red-500 hover:text-red-400">
                  <Calendar className="h-4 w-4" />
                  Archive Product
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
