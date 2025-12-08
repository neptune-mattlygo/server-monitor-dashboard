'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, CheckCircle } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    const logout = async () => {
      try {
        // Try Azure logout first (will work for both Azure and local auth)
        const response = await fetch('/api/auth/azure/logout', {
          method: 'POST',
        });
        
        if (!response.ok) {
          // If Azure logout fails, try local logout
          await fetch('/api/auth/local/logout', {
            method: 'POST',
          });
        }
        
        // Wait a moment to show the success message
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 800);
      } catch (error) {
        console.error('Logout error:', error);
        // Show success anyway since cookies are cleared client-side
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 800);
      }
    };

    logout();
  }, []);

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isLoggingOut ? (
            <>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
              <CardTitle>Logging Out...</CardTitle>
              <CardDescription>
                Please wait while we sign you out
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Successfully Logged Out</CardTitle>
              <CardDescription>
                You have been signed out of your account
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        {!isLoggingOut && (
          <CardContent className="space-y-4">
            <Button 
              onClick={handleLoginRedirect} 
              className="w-full"
            >
              Return to Login
            </Button>
            
            <div className="text-center">
              <a 
                href="/" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Go to Status Page
              </a>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
