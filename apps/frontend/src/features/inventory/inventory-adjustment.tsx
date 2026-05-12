'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/client';
import { InventoryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { PackagePlus, PackageMinus, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InventoryAdjustmentProps {
  productId: string;
  currentQuantity: number;
}

export function InventoryAdjustment({ productId, currentQuantity }: InventoryAdjustmentProps) {
  const [quantity, setQuantity] = useState<string>('1');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ type, qty }: { type: 'add' | 'deduct'; qty: number }) => {
      const idempotencyKey = `${type}-${productId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await inventoryApi.post(`/inventory/${type}`, {
        productId,
        quantity: qty,
      }, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      return response.data;
    },
    onMutate: async ({ type, qty }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['inventory', productId] });

      // Snapshot the previous value
      const previousInventory = queryClient.getQueryData<InventoryItem>(['inventory', productId]);

      // Optimistically update to the new value
      if (previousInventory) {
        queryClient.setQueryData<InventoryItem>(['inventory', productId], {
          ...previousInventory,
          quantity: type === 'add' ? previousInventory.quantity + qty : previousInventory.quantity - qty,
        });
      }

      return { previousInventory };
    },
    onError: (error: any, variables, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousInventory) {
        queryClient.setQueryData(['inventory', productId], context.previousInventory);
      }

      const message = error.response?.data?.message || 'Failed to update inventory';
      if (error.response?.status === 409) {
        toast.error('Insufficient Stock', {
          description: 'Cannot deduct more units than currently available.',
        });
      } else {
        toast.error('Error', { description: message });
      }
    },
    onSuccess: (data) => {
      toast.success('Inventory updated', {
        description: `New balance: ${data.quantity} units.`,
      });
      setQuantity('1');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the correct server state
      queryClient.invalidateQueries({ queryKey: ['inventory', productId] });
    },
  });

  const handleAction = (type: 'add' | 'deduct') => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Invalid quantity');
      return;
    }
    mutation.mutate({ type, qty });
  };

  return (
    <Card className="border-white/5 bg-black/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">Adjust Stock</CardTitle>
        <CardDescription>Update current physical inventory levels.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <span className="text-sm text-zinc-400 font-medium">Available Balance</span>
            <span className="text-xl font-bold text-white">{currentQuantity}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Adjustment Quantity</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="gap-2 border-green-500/20 hover:bg-green-500/10 hover:text-green-500"
              onClick={() => handleAction('add')}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
              Add Stock
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
              onClick={() => handleAction('deduct')}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackageMinus className="h-4 w-4" />}
              Deduct Stock
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
