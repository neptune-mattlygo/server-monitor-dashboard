'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [config, setConfig] = useState<{ company_name: string; logo_url: string | null; logo_dark_url?: string | null } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [azureEnabled, setAzureEnabled] = useState(false);
  const [showLocalAuth, setShowLocalAuth] = useState(false);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setConfig(data.config);
        }
      })
      .catch(() => {
        setConfig({ company_name: 'Server Monitor', logo_url: null });
      });
    
    // Check if Azure AD is configured
    fetch('/api/auth/azure/status')
      .then((res) => res.json())
      .then((data) => {
        setAzureEnabled(data.enabled === true);
      })
      .catch(() => {
        setAzureEnabled(false);
      });
  }, []);

  const handleAzureLogin = () => {
    window.location.href = '/api/auth/azure/login';
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/local/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          {config?.logo_url && (
            <div className="flex justify-center">
              <img
                src={config.logo_url}
                alt={config.company_name}
                className="h-12 w-auto object-contain dark:hidden"
              />
              <img
                src={config.logo_dark_url || config.logo_url}
                alt={config.company_name}
                className="h-12 w-auto object-contain hidden dark:block"
              />
            </div>
          )}
          <div className="text-center">
            <CardDescription>
              Server Dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Azure AD Login - Primary Option */}
          <Button
            type="button"
            variant="default"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleAzureLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0h10.931v10.931H0z" fill="#f25022"/>
              <path d="M12.069 0H23v10.931H12.069z" fill="#7fba00"/>
              <path d="M0 12.069h10.931V23H0z" fill="#00a4ef"/>
              <path d="M12.069 12.069H23V23H12.069z" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </Button>

          {/* Toggle for Local Auth */}
          {!showLocalAuth ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowLocalAuth(true)}
            >
              Use username and password instead
            </Button>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              {/* Local Login Form */}
              <form onSubmit={handleLocalLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setShowLocalAuth(false)}
                >
                  Back to Microsoft sign in
                </Button>
              </form>
            </>
          )}

          <div className="text-center text-sm space-y-2">
            <a
              href="/status"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block"
            >
              View Public Status Page
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
