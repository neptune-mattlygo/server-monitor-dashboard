'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { GeneralConfig } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

interface GeneralConfigSectionProps {
  settings: GeneralConfig;
  onSave: (category: string, settingKey: string, value: any) => Promise<{ success: boolean }>;
}

// Validation schema based on FileMaker 19 limits
const validationRules = {
  cacheSize: { min: 1, max: 1024, label: 'Cache size must be between 1 and 1024 MB' },
  maxFiles: { min: 1, max: 250, label: 'Max files must be between 1 and 250' },
  maxProConnections: { min: 0, max: 2000, label: 'Max connections must be between 0 and 2000 (0 = unlimited)' },
  maxPSOS: { min: 0, max: 1000, label: 'Max PSOS must be between 0 and 1000 (0 = disabled)' },
};

export function GeneralConfigSection({ settings, onSave }: GeneralConfigSectionProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local state when props change
  useState(() => {
    setLocalSettings(settings);
  });

  const handleNumberChange = (key: keyof GeneralConfig, value: string) => {
    const numValue = parseInt(value, 10);
    setLocalSettings({ ...localSettings, [key]: isNaN(numValue) ? 0 : numValue });
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' });
    }
  };

  const handleBooleanChange = (key: keyof GeneralConfig, value: boolean) => {
    setLocalSettings({ ...localSettings, [key]: value });
  };

  const validateAndSave = async (key: keyof GeneralConfig) => {
    const value = localSettings[key];

    // Validate numeric fields
    if (key !== 'useSchedules') {
      const rules = validationRules[key as keyof typeof validationRules];
      const numValue = value as number;

      if (numValue < rules.min || numValue > rules.max) {
        setErrors({ ...errors, [key]: rules.label });
        return;
      }
    }

    setSaving({ ...saving, [key]: true });
    setErrors({ ...errors, [key]: '' });

    try {
      await onSave('general', key, value);
      // Success - settings will be updated from parent
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      setErrors({ ...errors, [key]: message });
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Configuration</CardTitle>
        <CardDescription>
          Server performance and capacity settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Size */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="cacheSize" className="pt-2">
            Cache Size (MB)
          </Label>
          <div className="space-y-1">
            <Input
              id="cacheSize"
              type="number"
              min={1}
              max={1024}
              value={localSettings.cacheSize}
              onChange={(e) => handleNumberChange('cacheSize', e.target.value)}
              disabled={saving.cacheSize}
            />
            {errors.cacheSize && (
              <p className="text-sm text-destructive">{errors.cacheSize}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('cacheSize')}
            disabled={saving.cacheSize || !settings || localSettings.cacheSize === settings.cacheSize}
            size="sm"
          >
            {saving.cacheSize ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Max Files */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="maxFiles" className="pt-2">
            Max Hosted Files
          </Label>
          <div className="space-y-1">
            <Input
              id="maxFiles"
              type="number"
              min={1}
              max={125}
              value={localSettings.maxFiles}
              onChange={(e) => handleNumberChange('maxFiles', e.target.value)}
              disabled={saving.maxFiles}
            />
            {errors.maxFiles && (
              <p className="text-sm text-destructive">{errors.maxFiles}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('maxFiles')}
            disabled={saving.maxFiles || !settings || localSettings.maxFiles === settings.maxFiles}
            size="sm"
          >
            {saving.maxFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Max Pro Connections */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="maxProConnections" className="pt-2">
            Max Pro Connections
          </Label>
          <div className="space-y-1">
            <Input
              id="maxProConnections"
              type="number"
              min={0}
              max={2000}
              value={localSettings.maxProConnections}
              onChange={(e) => handleNumberChange('maxProConnections', e.target.value)}
              disabled={saving.maxProConnections}
            />
            <p className="text-xs text-muted-foreground">0 = unlimited</p>
            {errors.maxProConnections && (
              <p className="text-sm text-destructive">{errors.maxProConnections}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('maxProConnections')}
            disabled={saving.maxProConnections || !settings || localSettings.maxProConnections === settings.maxProConnections}
            size="sm"
          >
            {saving.maxProConnections ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Max PSOS */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="maxPSOS" className="pt-2">
            Max Server Scripts
          </Label>
          <div className="space-y-1">
            <Input
              id="maxPSOS"
              type="number"
              min={0}
              max={1000}
              value={localSettings.maxPSOS}
              onChange={(e) => handleNumberChange('maxPSOS', e.target.value)}
              disabled={saving.maxPSOS}
            />
            <p className="text-xs text-muted-foreground">0 = disabled</p>
            {errors.maxPSOS && (
              <p className="text-sm text-destructive">{errors.maxPSOS}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('maxPSOS')}
            disabled={saving.maxPSOS || !settings || localSettings.maxPSOS === settings.maxPSOS}
            size="sm"
          >
            {saving.maxPSOS ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Use Schedules */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-center">
          <Label htmlFor="useSchedules">
            Enable Schedules
          </Label>
          <Switch
            id="useSchedules"
            checked={localSettings.useSchedules}
            onCheckedChange={(checked) => handleBooleanChange('useSchedules', checked)}
            disabled={saving.useSchedules}
          />
          <Button
            onClick={() => validateAndSave('useSchedules')}
            disabled={saving.useSchedules || !settings || localSettings.useSchedules === settings.useSchedules}
            size="sm"
          >
            {saving.useSchedules ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
