import { Suspense } from 'react';
import { StatusPageClient } from './components/status-page-client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function StatusPage() {
  return (
    <Suspense fallback={<StatusPageSkeleton />}>
      <StatusPageClient />
    </Suspense>
  );
}

function StatusPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
