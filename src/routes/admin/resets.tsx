import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { PasswordReset } from "@/components/system/PasswordReset";
import { UserDTO } from '@/lib/types';
import { getUsers } from '@/lib/api-actions';

function ResetsPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setUsers(data.filter(u => (u).reset_request) || []);
    } catch (err) {
      console.error('Failed to load reset requests:', err);
      setError('Failed to load reset requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (isLoading) return <div className="animate-pulse">Loading reset requests...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <PasswordReset
        users={users}
        onRefresh={fetchUsers}
    />
  );
}


export const Route = createFileRoute('/admin/resets')({
  head: () => ({ meta: [{ title: "Admin — Resets — SmartLMS" }] }),
  component: ResetsPage,
});
