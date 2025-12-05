'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export function AdminHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b bg-white sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}
