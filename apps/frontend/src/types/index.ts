import { z } from 'zod';

// --- Auth Types ---

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
  isDisabled: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: UserSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// --- Product Types ---

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  priceUsd: z.number(),
  category: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  // Converted prices from dynamic response
  priceEUR: z.number().optional(),
  priceDOP: z.number().optional(),
  priceCNY: z.number().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

export const PriceHistorySchema = z.object({
  id: z.number(),
  productId: z.string(),
  oldPriceUsd: z.number(),
  newPriceUsd: z.number(),
  changedAt: z.string(),
});

export type PriceHistory = z.infer<typeof PriceHistorySchema>;

// --- Inventory Types ---

export const InventoryItemSchema = z.object({
  id: z.number(),
  productId: z.string(),
  quantity: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const InventoryMovementSchema = z.object({
  id: z.number(),
  productId: z.string(),
  delta: z.number(),
  action: z.string(),
  createdAt: z.string(),
});

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

export const StockMutationRequestSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

export type StockMutationRequest = z.infer<typeof StockMutationRequestSchema>;
