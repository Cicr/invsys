'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UserX, ShieldCheck, Loader2, UserCog } from 'lucide-react';
import { CreateUserModal } from './create-user-modal';
import { EditUserModal } from './edit-user-modal';
import { useState } from 'react';

interface User {
  id: string | number;
  username: string;
  role: string;
  disabled: boolean;
}

export function UserManagement() {
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<{ username: string; role: string } | null>(null);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await authApi.get('/auth');
      return response.data;
    },
  });

  const disableMutation = useMutation({
    mutationFn: (username: string) => authApi.post('/auth/disable', { username }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User account updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update user', {
        description: error.response?.data?.message || 'Permission denied',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateUserModal />
      </div>
      
      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
        <div className="p-4 bg-white/5 border-b border-white/10 font-bold text-sm tracking-wider uppercase text-zinc-400">
          Active System Users
        </div>
        
        <div className="divide-y divide-white/5">
          {users?.map((user) => (
            <div key={user.username} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center font-bold border border-white/10 text-white">
                  {user.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{user.username}</p>
                    {user.disabled && (
                      <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase">
                        Disabled
                      </span>
                    )}
                    {user.role === 'admin' && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">ID: {user.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {user.username !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingUser(user)}
                    className="text-zinc-400 hover:text-white hover:bg-white/10"
                  >
                    <UserCog className="h-4 w-4 mr-2" /> Edit
                  </Button>
                )}
                {user.username !== 'admin' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disableMutation.mutate(user.username)}
                    disabled={disableMutation.isPending}
                    className={user.disabled 
                      ? "text-green-500 hover:text-green-400 hover:bg-green-500/10" 
                      : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
                    }
                  >
                    {user.disabled ? (
                      <><ShieldCheck className="h-4 w-4 mr-2" /> Enable</>
                    ) : (
                      <><UserX className="h-4 w-4 mr-2" /> Disable</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <EditUserModal 
        user={editingUser} 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)} 
      />
    </div>
  );
}
