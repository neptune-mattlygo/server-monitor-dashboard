'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface Config {
  id: string;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  favicon_url: string | null;
  custom_domain: string | null;
  support_email: string | null;
  support_url: string | null;
  twitter_handle: string | null;
  show_uptime_percentage: boolean;
}

interface Props {
  initialConfig: Config | null;
}

export function ConfigForm({ initialConfig }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company_name: initialConfig?.company_name || 'Server Monitor',
    logo_url: initialConfig?.logo_url || '',
    primary_color: initialConfig?.primary_color || '#3b82f6',
    favicon_url: initialConfig?.favicon_url || '',
    custom_domain: initialConfig?.custom_domain || '',
    support_email: initialConfig?.support_email || '',
    support_url: initialConfig?.support_url || '',
    twitter_handle: initialConfig?.twitter_handle || '',
    show_uptime_percentage: initialConfig?.show_uptime_percentage ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update configuration');
      }

      toast.success('Configuration updated');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Branding & Appearance</CardTitle>
          <CardDescription>
            Customize how your status page appears to your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Your Company Name"
                required
              />
            </div>

            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="favicon_url">Favicon URL</Label>
              <Input
                id="favicon_url"
                value={formData.favicon_url}
                onChange={(e) => setFormData({ ...formData, favicon_url: e.target.value })}
                placeholder="https://example.com/favicon.ico"
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#3b82f6"
                />
                <Input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-16"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="custom_domain">Custom Domain</Label>
              <Input
                id="custom_domain"
                value={formData.custom_domain}
                onChange={(e) => setFormData({ ...formData, custom_domain: e.target.value })}
                placeholder="status.yourdomain.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Configure DNS CNAME record to point to your app
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Contact & Support</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="support_email">Support Email</Label>
                <Input
                  id="support_email"
                  type="email"
                  value={formData.support_email}
                  onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>

              <div>
                <Label htmlFor="support_url">Support URL</Label>
                <Input
                  id="support_url"
                  type="url"
                  value={formData.support_url}
                  onChange={(e) => setFormData({ ...formData, support_url: e.target.value })}
                  placeholder="https://support.example.com"
                />
              </div>

              <div>
                <Label htmlFor="twitter_handle">Twitter Handle</Label>
                <Input
                  id="twitter_handle"
                  value={formData.twitter_handle}
                  onChange={(e) => setFormData({ ...formData, twitter_handle: e.target.value })}
                  placeholder="@yourcompany"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="show_uptime_percentage"
                checked={formData.show_uptime_percentage}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, show_uptime_percentage: checked })
                }
              />
              <Label htmlFor="show_uptime_percentage">
                Show 90-day uptime percentage on status page
              </Label>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
