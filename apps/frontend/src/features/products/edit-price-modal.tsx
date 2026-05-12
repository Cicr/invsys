'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productApi } from '@/lib/api/client';
import { DollarSign, Loader2 } from 'lucide-react';

interface EditPriceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  currentPrice: number;
}

export function EditPriceModal({ 
  open, 
  onOpenChange, 
  productId, 
  productName, 
  currentPrice 
}: EditPriceModalProps) {
  const [newPrice, setNewPrice] = useState<string>(currentPrice.toString());
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (price: number) => {
      return productApi.patch(`/products/${productId}`, { priceUsd: price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-history', productId] });
      toast.success('Price updated successfully');
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to update price';
      toast.error('Error', { description: message });
    },
  });

  const handleSave = () => {
    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Invalid price', { description: 'Please enter a valid positive number' });
      return;
    }
    mutation.mutate(priceNum);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Update Product Price</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Change the base USD price for <span className="text-primary font-medium">{productName}</span>.
            This will be recorded in the price history ledger.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-zinc-400">New Price (USD)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 text-white h-12 text-lg"
                autoFocus
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={mutation.isPending}
            className="bg-primary text-black hover:bg-primary/90 font-bold"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Price Change'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
