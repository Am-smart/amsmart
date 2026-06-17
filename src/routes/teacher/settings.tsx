import { createFileRoute } from '@tanstack/react-router';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { TeacherSettings } from "@/components/system/TeacherSettings";

function SettingsPage() {
  const { user, updateProfile } = useAuth();

  if (!user) return null;

  return (
    <TeacherSettings
        user={user}
        onUpdate={updateProfile}
    />
  );
}


export const Route = createFileRoute('/teacher/settings')({
  head: () => ({ meta: [{ title: "Teacher — Settings — SmartLMS" }] }),
  component: SettingsPage,
});
