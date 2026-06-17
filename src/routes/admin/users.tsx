import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { dynamic } from '@/lib/next-compat';

const UserManagement = dynamic(() => import('@/components/users/UserManagement').then(mod => mod.UserManagement), {
    loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />
});

const UserEditor = dynamic(() => import('@/components/users/UserEditor').then(mod => mod.UserEditor), {
    loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />
});
import { UserDTO } from '@/lib/types';
import { getUsers, deleteUser, saveUser } from '@/lib/api-actions';

function UsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchUsers = useCallback(async () => {
      const data = await getUsers();
      setUsers(data || []);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isAdding || editingUser) {
      return (
          <UserEditor
              user={editingUser || undefined}
              onSave={() => { setEditingUser(null); setIsAdding(false); fetchUsers(); }}
              onCancel={() => { setEditingUser(null); setIsAdding(false); }}
          />
      );
  }

  return (
    <div className="space-y-6">
        <UserManagement
            users={users}
            onEdit={setEditingUser}
            onDelete={async (id: string) => {
                if (!confirm('Are you sure you want to delete this user?')) return;
                await deleteUser(id);
                fetchUsers();
            }}
            onUpdate={async (id: string, updates: Record<string, unknown>) => {
                const res = await saveUser({ ...updates, id });
                if (res.success) fetchUsers();
            }}
            onAdd={() => setIsAdding(true)}
        />
    </div>
  );
}


export const Route = createFileRoute('/admin/users')({
  head: () => ({ meta: [{ title: "Admin — Users — SmartLMS" }] }),
  component: UsersPage,
});
