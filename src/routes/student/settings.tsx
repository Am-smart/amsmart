import { createFileRoute } from '@tanstack/react-router';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { StudentSettings } from "@/components/system/StudentSettings";

function SettingsPage() {
  const { user, updateProfile } = useAuth();

  if (!user) return null;

  return (
    <StudentSettings
        user={user}
        onUpdate={updateProfile}
    />
  );
}


export const Route = createFileRoute('/student/settings')({
  head: () => ({ meta: [{ title: "Student — Settings — SmartLMS" }] }),
  component: SettingsPage,
});
