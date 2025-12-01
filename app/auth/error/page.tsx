'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    login_failed: 'Failed to initiate Azure AD login. Please try again.',
    callback_failed: 'Authentication callback failed. Please try again.',
    no_code: 'No authorization code received from Azure AD.',
    default: 'An authentication error occurred. Please try again.',
  };

  const message = errorMessages[error || 'default'] || errorMessages.default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <a href="/api/auth/azure/login">Try Again</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
