'use client';

import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PriceHistoryEntry {
  id: number;
  productId: string;
  oldPriceUsd: number;
  newPriceUsd: number;
  changedAt: string;
}

interface PriceHistoryModalProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PriceHistoryModal({ productId, productName, open, onOpenChange }: PriceHistoryModalProps) {
  const { data: history, isLoading } = useQuery<PriceHistoryEntry[]>({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const response = await productApi.get(`/products/${productId}/history`);
      return response.data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Price Audit Trail: {productName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No price changes recorded for this product yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {history?.map((entry) => {
                const isIncrease = entry.newPriceUsd > entry.oldPriceUsd;
                return (
                  <div 
                    key={entry.id} 
                    className="p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {isIncrease ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          {isIncrease ? 'Price Increase' : 'Price Markdown'}
                        </span>
                      </div>
                      <p className="text-lg font-bold mt-1">
                        ${Number(entry.oldPriceUsd).toFixed(2)} → <span className={isIncrease ? 'text-green-400' : 'text-red-400'}>${Number(entry.newPriceUsd).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">
                        {format(new Date(entry.changedAt), 'MMM d, yyyy')}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">
                        {format(new Date(entry.changedAt), 'HH:mm:ss')}
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
