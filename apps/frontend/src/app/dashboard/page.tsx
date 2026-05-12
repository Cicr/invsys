'use client';

import { ProductTable } from '@/features/products/product-table';
import { CreateProductModal } from '@/features/products/create-product-modal';
import { useAuthStore } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Plus,
  Users
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { UserManagement } from '@/features/auth/user-management';
import { InventoryLogsView } from '@/features/inventory/inventory-logs-view';

import { useQuery } from '@tanstack/react-query';
import { productApi, inventoryApi } from '@/lib/api/client';
import { Product, InventoryItem } from '@/types';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();
  const [activeView, setActiveView] = useState<'dashboard' | 'products' | 'inventory' | 'users'>('dashboard');

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await productApi.get('/products');
      return response.data;
    },
  });

  const { data: inventoryItems } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-all'],
    queryFn: async () => {
      const response = await inventoryApi.get('/inventory');
      return response.data;
    },
  });

  // Calculate stats
  const totalSKUs = products?.length ?? 0;
  const totalInventoryValue = products?.reduce((total, product) => {
    const inv = inventoryItems?.find(i => i.productId === product.id);
    const qty = inv?.quantity ?? 0;
    const price = Number(product.priceUsd) || 0;
    return total + (qty * price);
  }, 0) ?? 0;

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated || !isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-black">
              IN
            </div>
            <span className="text-xl font-bold tracking-tight text-white">INVSYS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => setActiveView('dashboard')}
            className={cn(
              "w-full justify-start gap-3",
              activeView === 'dashboard' ? "bg-white/5 text-white" : "hover:bg-white/5"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveView('products')}
            className={cn(
              "w-full justify-start gap-3",
              activeView === 'products' ? "bg-white/5 text-white" : "hover:bg-white/5"
            )}
          >
            <Package className="h-4 w-4" />
            Products
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setActiveView('inventory')}
            className={cn(
              "w-full justify-start gap-3",
              activeView === 'inventory' ? "bg-white/5 text-white" : "hover:bg-white/5"
            )}
          >
            <History className="h-4 w-4" />
            Inventory Logs
          </Button>
          {user?.role === 'admin' && (
            <Button 
              variant="ghost" 
              onClick={() => setActiveView('users')}
              className={cn(
                "w-full justify-start gap-3",
                activeView === 'users' ? "bg-white/5 text-white" : "hover:bg-white/5"
              )}
            >
              <Users className="h-4 w-4" />
              User Management
            </Button>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button variant="ghost" onClick={logout} className="w-full justify-start gap-3 text-zinc-400 hover:text-white hover:bg-white/5">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Search products, SKUs, transactions..." 
                className="pl-10 bg-white/5 border-white/5 focus:border-primary/20 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative hover:bg-white/5">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <div className="h-8 w-px bg-white/5" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{user?.role}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
                {user?.username?.[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          {activeView === 'dashboard' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-white">Executive Dashboard</h1>
                  <p className="text-zinc-500 mt-1">Real-time overview of your warehouse and product operations.</p>
                </div>
                {user?.role === 'admin' && <CreateProductModal />}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm shadow-xl">
                  <p className="text-sm font-medium text-zinc-500">Total SKU Items</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{totalSKUs.toLocaleString()}</h3>
                  <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                    System active
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm shadow-xl">
                  <p className="text-sm font-medium text-zinc-500">Inventory Value (USD)</p>
                  <h3 className="text-3xl font-bold text-white mt-2">
                    ${totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    Live valuation active
                  </p>
                </div>
                <div className="p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm shadow-xl">
                  <p className="text-sm font-medium text-zinc-500">System Health</p>
                  <h3 className="text-3xl font-bold text-white mt-2">99.9%</h3>
                  <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                    All services operational
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ProductTable />
                </div>
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Recent System Activity
                  </h3>
                  <div className="space-y-4">
                    {[
                      { action: 'Price Updated', item: 'Sony MX4', user: 'admin', time: '2m ago' },
                      { action: 'Stock Added', item: 'MacBook Pro', user: 'admin', time: '15m ago' },
                      { action: 'New User Registered', item: 'warehouse_mgr', user: 'system', time: '1h ago' },
                      { action: 'Product Archived', item: 'Old Cables', user: 'admin', time: '3h ago' },
                    ].map((activity, i) => (
                      <div key={i} className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white">{activity.action}</p>
                          <p className="text-xs text-zinc-500">{activity.item} • by {activity.user}</p>
                          <p className="text-[10px] text-zinc-600 mt-1 uppercase font-bold">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full text-xs text-zinc-500 hover:text-white border border-white/5">
                    View Full Audit Log
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeView === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Product Catalog</h1>
                {user?.role === 'admin' && <CreateProductModal />}
              </div>
              <ProductTable />
            </div>
          )}

          {activeView === 'inventory' && <InventoryLogsView />}

          {activeView === 'users' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight text-white">User Management</h1>
              <UserManagement />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
