'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SecurityConfig } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface SecuritySectionProps {
  settings: SecurityConfig;
  onSave: (category: string, settingKey: string, value: any) => Promise<{ success: boolean }>;
}

export function SecuritySection({ settings, onSave }: SecuritySectionProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local state when props change
  useState(() => {
    setLocalSettings(settings);
  });

  const handleToggle = async (key: keyof SecurityConfig, value: boolean) => {
    setLocalSettings({ ...localSettings, [key]: value });

    setSaving({ ...saving, [key]: true });
    setErrors({ ...errors, [key]: '' });

    try {
      await onSave('security', key, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      setErrors({ ...errors, [key]: message });
      // Revert on error
      setLocalSettings({ ...localSettings, [key]: !value });
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Configuration</CardTitle>
        <CardDescription>
          Server security settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Require Secure DB */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="requireSecureDB">Require Encrypted Connections</Label>
            <p className="text-sm text-muted-foreground">
              Only allow connections from databases with encryption at rest enabled
            </p>
            {errors.requireSecureDB && (
              <p className="text-sm text-destructive">{errors.requireSecureDB}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.requireSecureDB && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="requireSecureDB"
              checked={localSettings.requireSecureDB}
              onCheckedChange={(checked) => handleToggle('requireSecureDB', checked)}
              disabled={saving.requireSecureDB}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
