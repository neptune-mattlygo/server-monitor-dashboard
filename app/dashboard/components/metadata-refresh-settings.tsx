'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, TestTube } from 'lucide-react';

interface MetadataRefreshSettings {
  id: string;
  refresh_interval_days: number;
  notification_emails: string[];
  enabled: boolean;
  last_refresh_at: string | null;
}

export function MetadataRefreshSettings() {
  const [settings, setSettings] = useState<MetadataRefreshSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [testingEmails, setTestingEmails] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/metadata-refresh-settings');
      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
      } else {
        console.error('Failed to fetch settings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/metadata-refresh-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(data.settings);
        alert('Settings saved successfully!');
      } else {
        alert(`Failed to save settings: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    if (!newEmail || !settings) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    if (settings.notification_emails.includes(newEmail)) {
      alert('Email already exists');
      return;
    }

    setSettings({
      ...settings,
      notification_emails: [...settings.notification_emails, newEmail],
    });
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      notification_emails: settings.notification_emails.filter(email => email !== emailToRemove),
    });
  };

  const triggerManualRefresh = async () => {
    if (!confirm('This will manually trigger a metadata refresh for all servers. Continue?')) {
      return;
    }

    setTestingEmails(true);
    try {
      const response = await fetch('/api/admin/refresh-metadata', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer manual-trigger`, // We'll need to handle this on the backend
        },
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Manual refresh completed!\nSuccessful: ${data.results.successful}\nFailed: ${data.results.failed}`);
        fetchSettings(); // Refresh to get updated last_refresh_at
      } else {
        alert(`Failed to trigger refresh: ${data.error}`);
      }
    } catch (error) {
      console.error('Error triggering manual refresh:', error);
      alert('Failed to trigger manual refresh');
    } finally {
      setTestingEmails(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="p-6">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Metadata Refresh Settings</CardTitle>
          <CardDescription>
            Configure automatic metadata refresh for FileMaker servers with email notifications for failures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
            <Label htmlFor="enabled">Enable automatic metadata refresh</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interval">Refresh Interval (days)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="365"
              value={settings.refresh_interval_days}
              onChange={(e) => setSettings({ 
                ...settings, 
                refresh_interval_days: parseInt(e.target.value) || 7 
              })}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">
              How often to refresh metadata for all servers (1-365 days)
            </p>
          </div>

          {settings.last_refresh_at && (
            <div className="grid gap-2">
              <Label>Last Refresh</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(settings.last_refresh_at).toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Label>Notification Email Addresses</Label>
            <p className="text-sm text-muted-foreground">
              Email addresses to notify when servers are unreachable during refresh
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="admin@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                className="flex-1"
              />
              <Button onClick={addEmail} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {settings.notification_emails.map((email) => (
                <div key={email} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{email}</span>
                  <Button
                    onClick={() => removeEmail(email)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {settings.notification_emails.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No email addresses configured
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            
            <Button 
              onClick={triggerManualRefresh} 
              variant="outline" 
              disabled={testingEmails}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testingEmails ? 'Testing...' : 'Test Manual Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Badge variant="outline">Automatic Scheduling</Badge>
            <p className="text-sm text-muted-foreground">
              Runs every Sunday at 2:00 AM (configurable interval: every {settings.refresh_interval_days} day{settings.refresh_interval_days !== 1 ? 's' : ''})
            </p>
          </div>

          <div className="space-y-2">
            <Badge variant="outline">Smart Filtering</Badge>
            <p className="text-sm text-muted-foreground">
              Only attempts to refresh servers with admin credentials configured
            </p>
          </div>

          <div className="space-y-2">
            <Badge variant="outline">Failure Protection</Badge>
            <p className="text-sm text-muted-foreground">
              If a server is unreachable, existing metadata is preserved and an email alert is sent
            </p>
          </div>

          <div className="space-y-2">
            <Badge variant="outline">Error Tracking</Badge>
            <p className="text-sm text-muted-foreground">
              Failed refresh attempts are logged with detailed error messages
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Required</CardTitle>
          <CardDescription>
            Configure these in your Vercel dashboard for email notifications to work
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>RESEND_API_KEY</strong> - Your Resend API key</div>
            <div><strong>STATUS_PAGE_FROM_EMAIL</strong> - Verified sender email (e.g., admin@yourdomain.com)</div>
            <div><strong>STATUS_PAGE_FROM_NAME</strong> - Sender name (e.g., "Server Monitor")</div>
            <div><strong>CRON_SECRET</strong> - Secure token for cron authentication</div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            📧 Make sure your sender email is verified in your Resend dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}