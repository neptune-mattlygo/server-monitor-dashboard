'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { WebPublishing } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface WebPublishingSectionProps {
  settings: WebPublishing;
  onSave: (category: string, settingKey: string, value: any) => Promise<{ success: boolean }>;
}

export function WebPublishingSection({ settings, onSave }: WebPublishingSectionProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local state when props change
  useState(() => {
    setLocalSettings(settings);
  });

  const handleToggle = async (key: keyof WebPublishing, value: boolean) => {
    setLocalSettings({ ...localSettings, [key]: value });

    setSaving({ ...saving, [key]: true });
    setErrors({ ...errors, [key]: '' });

    try {
      await onSave('webPublishing', key, value);
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
        <CardTitle>Web Publishing</CardTitle>
        <CardDescription>
          Enable or disable web publishing technologies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PHP */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="phpEnabled">PHP Web Publishing</Label>
            <p className="text-sm text-muted-foreground">Custom Web Publishing with PHP</p>
            {errors.phpEnabled && (
              <p className="text-sm text-destructive">{errors.phpEnabled}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.phpEnabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="phpEnabled"
              checked={localSettings.phpEnabled}
              onCheckedChange={(checked) => handleToggle('phpEnabled', checked)}
              disabled={saving.phpEnabled}
            />
          </div>
        </div>

        {/* XML */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="xmlEnabled">XML Web Publishing</Label>
            <p className="text-sm text-muted-foreground">Custom Web Publishing with XML</p>
            {errors.xmlEnabled && (
              <p className="text-sm text-destructive">{errors.xmlEnabled}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.xmlEnabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="xmlEnabled"
              checked={localSettings.xmlEnabled}
              onCheckedChange={(checked) => handleToggle('xmlEnabled', checked)}
              disabled={saving.xmlEnabled}
            />
          </div>
        </div>

        {/* ODBC/JDBC */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="xdbcEnabled">ODBC/JDBC Access</Label>
            <p className="text-sm text-muted-foreground">External SQL access via ODBC and JDBC</p>
            {errors.xdbcEnabled && (
              <p className="text-sm text-destructive">{errors.xdbcEnabled}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.xdbcEnabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="xdbcEnabled"
              checked={localSettings.xdbcEnabled}
              onCheckedChange={(checked) => handleToggle('xdbcEnabled', checked)}
              disabled={saving.xdbcEnabled}
            />
          </div>
        </div>

        {/* FileMaker Data API */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dataApiEnabled">FileMaker Data API</Label>
            <p className="text-sm text-muted-foreground">RESTful API for database access</p>
            {errors.dataApiEnabled && (
              <p className="text-sm text-destructive">{errors.dataApiEnabled}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.dataApiEnabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="dataApiEnabled"
              checked={localSettings.dataApiEnabled}
              onCheckedChange={(checked) => handleToggle('dataApiEnabled', checked)}
              disabled={saving.dataApiEnabled}
            />
          </div>
        </div>

        {/* OData */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="odataEnabled">OData Publishing</Label>
            <p className="text-sm text-muted-foreground">Open Data Protocol access</p>
            {errors.odataEnabled && (
              <p className="text-sm text-destructive">{errors.odataEnabled}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.odataEnabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="odataEnabled"
              checked={localSettings.odataEnabled}
              onCheckedChange={(checked) => handleToggle('odataEnabled', checked)}
              disabled={saving.odataEnabled}
            />
          </div>
        </div>

        {/* WebDirect */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="webDirectEnabled">FileMaker WebDirect</Label>
            <p className="text-sm text-muted-foreground">Access databases via web browser</p>
            {errors.webDirectEnabled && (
              <p className="text-sm text-destructive">{errors.webDirectEnabled}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {saving.webDirectEnabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="webDirectEnabled"
              checked={localSettings.webDirectEnabled}
              onCheckedChange={(checked) => handleToggle('webDirectEnabled', checked)}
              disabled={saving.webDirectEnabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
