'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, inventoryApi } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const createProductSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  priceUsd: z.coerce.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  initialStock: z.coerce.number().min(0, 'Stock cannot be negative').default(0),
});

type CreateProductInput = z.infer<typeof createProductSchema>;

export function CreateProductModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      name: '',
      priceUsd: 0,
      category: '',
      description: '',
      initialStock: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      // 1. Create product
      const res = await productApi.post('/products', data);
      const newProduct = res.data;
      
      // 2. Add initial stock if > 0
      if (data.initialStock > 0 && newProduct?.id) {
        // Need a unique idempotency key for this
        const idempotencyKey = `init-stock-${newProduct.id}-${Date.now()}`;
        try {
          await inventoryApi.post('/inventory/add', {
            productId: newProduct.id,
            quantity: data.initialStock
          }, {
            headers: {
              'Idempotency-Key': idempotencyKey
            }
          });
        } catch (error) {
          toast.warning('Product created, but failed to set initial stock. Please add stock manually.', {
            description: 'Inventory service unreachable or unauthorized.'
          });
        }
      }
      return newProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Product created successfully');
      setOpen(false);
      form.reset();
    },
    onError: (error: unknown) => {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError.response?.data?.message || 'Failed to create product';
      toast.error('Error', { description: message });
    },
  });

  const onSubmit = (data: CreateProductInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'default', size: 'default' }),
          "gap-2 shadow-lg shadow-primary/20"
        )}
      >
        <Plus className="h-4 w-4" />
        New Product
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Create Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-zinc-400">
                Product Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Sony Headphones"
                className="bg-white/5 border-white/10 focus:ring-primary"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceUsd" className="text-sm font-medium text-zinc-400">
                  Price (USD)
                </Label>
                <Input
                  id="priceUsd"
                  type="number"
                  step="0.01"
                  placeholder="299.99"
                  className="bg-white/5 border-white/10"
                  {...form.register('priceUsd')}
                />
                {form.formState.errors.priceUsd && (
                  <p className="text-xs text-red-400">{form.formState.errors.priceUsd.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-zinc-400">
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="Electronics"
                  className="bg-white/5 border-white/10"
                  {...form.register('category')}
                />
                {form.formState.errors.category && (
                  <p className="text-xs text-red-400">{form.formState.errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-zinc-400">
                  Description (Optional)
                </Label>
                <Input
                  id="description"
                  placeholder="Brief product description"
                  className="bg-white/5 border-white/10"
                  {...form.register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialStock" className="text-sm font-medium text-zinc-400">
                  Initial Stock
                </Label>
                <Input
                  id="initialStock"
                  type="number"
                  placeholder="0"
                  className="bg-white/5 border-white/10"
                  {...form.register('initialStock')}
                />
                {form.formState.errors.initialStock && (
                  <p className="text-xs text-red-400">{form.formState.errors.initialStock.message}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-w-[100px] shadow-lg shadow-primary/20"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
