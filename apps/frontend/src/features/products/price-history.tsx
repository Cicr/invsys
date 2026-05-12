'use client';

import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api/client';
import { PriceHistory } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceHistoryListProps {
  productId: string;
}

export function PriceHistoryList({ productId }: PriceHistoryListProps) {
  const { data: history, isLoading } = useQuery<PriceHistory[]>({
    queryKey: ['price-history', productId],
    queryFn: async () => {
      const response = await productApi.get(`/products/${productId}/history`);
      return response.data;
    },
  });

  return (
    <Card className="border-white/5 bg-black/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <History className="h-5 w-5 text-primary" />
        <CardTitle className="text-lg font-bold">Price Mutation Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Mutation</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Old Price</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">New Price</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Change</TableHead>
                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-[140px] ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : history?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No price mutations recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                history?.map((entry, idx) => {
                  const isIncrease = entry.newPriceUsd > entry.oldPriceUsd;
                  const diff = ((entry.newPriceUsd - entry.oldPriceUsd) / entry.oldPriceUsd) * 100;
                  
                  return (
                    <TableRow key={entry.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-zinc-500 text-xs font-bold">#{history.length - idx}</TableCell>
                      <TableCell className="text-zinc-400">${entry.oldPriceUsd.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-white">${entry.newPriceUsd.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full w-fit border",
                          isIncrease 
                            ? "text-green-500 bg-green-500/10 border-green-500/20" 
                            : "text-red-500 bg-red-500/10 border-red-500/20"
                        )}>
                          {isIncrease ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(diff).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs text-zinc-500 font-mono">
                        {new Date(entry.changedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
