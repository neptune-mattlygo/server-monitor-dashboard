'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [config, setConfig] = useState<{ company_name: string; logo_url: string | null; logo_dark_url?: string | null } | null>(null);

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
  }, []);

  const handleAzureLogin = () => {
    window.location.href = '/api/auth/azure/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
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
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 hover:text-gray-900 border-gray-300"
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

          <div className="text-center text-sm">
            <a
              href="/status"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
            >
              View Public Status Page
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
