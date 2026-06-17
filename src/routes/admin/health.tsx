import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { SystemHealth } from "@/components/system/SystemMisc";

function HealthPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) return <div className="animate-pulse">Loading system health...</div>;

  return <SystemHealth />;
}


export const Route = createFileRoute('/admin/health')({
  head: () => ({ meta: [{ title: "Admin — Health — SmartLMS" }] }),
  component: HealthPage,
});
