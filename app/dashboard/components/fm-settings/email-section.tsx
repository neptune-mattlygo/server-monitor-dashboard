'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailNotifications } from '@/lib/supabase';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';

interface EmailSectionProps {
  settings: EmailNotifications;
  serverId: string;
  hasSmtpPassword: boolean;
  onSave: (category: string, settingKey: string, value: any) => Promise<{ success: boolean }>;
}

// Email validation schema
const emailSchema = z.string().email();
const emailListSchema = z.string().refine(
  (val) => {
    if (!val) return true;
    const emails = val.split(',').map(e => e.trim());
    return emails.every(email => emailSchema.safeParse(email).success);
  },
  { message: 'Invalid email addresses' }
);

export function EmailSection({ settings, serverId, hasSmtpPassword, onSave }: EmailSectionProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFetched, setPasswordFetched] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update local state when props change
  useState(() => {
    setLocalSettings(settings);
  });

  const handleTextChange = (key: keyof EmailNotifications, value: string) => {
    setLocalSettings({ ...localSettings, [key]: value });
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' });
    }
  };

  const handleNumberChange = (key: keyof EmailNotifications, value: string) => {
    const numValue = parseInt(value, 10);
    setLocalSettings({ ...localSettings, [key]: isNaN(numValue) ? 0 : numValue });
    
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' });
    }
  };

  const handleSelectChange = (key: keyof EmailNotifications, value: string) => {
    setLocalSettings({ ...localSettings, [key]: parseInt(value, 10) });
  };

  const fetchSmtpPassword = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/fm-settings/smtp-password`);
      const data = await response.json();
      
      if (response.ok) {
        setSmtpPassword(data.password || '');
        setPasswordFetched(true);
        setShowPassword(true);
      } else {
        setErrors({ ...errors, smtpPassword: data.error || 'Failed to fetch password' });
      }
    } catch (error) {
      setErrors({ ...errors, smtpPassword: 'Failed to fetch password' });
    }
  };

  const validateAndSave = async (key: keyof EmailNotifications) => {
    const value = localSettings[key];

    // Validate specific fields
    if (key === 'emailSenderAddress') {
      if (value && !emailSchema.safeParse(value).success) {
        setErrors({ ...errors, [key]: 'Invalid email address' });
        return;
      }
    }

    if (key === 'emailRecipients') {
      if (value && !emailListSchema.safeParse(value).success) {
        setErrors({ ...errors, [key]: 'Invalid email addresses (comma-separated)' });
        return;
      }
    }

    if (key === 'smtpServerPort') {
      const port = value as number;
      if (port < 1 || port > 65535) {
        setErrors({ ...errors, [key]: 'Port must be between 1 and 65535' });
        return;
      }
    }

    setSaving({ ...saving, [key]: true });
    setErrors({ ...errors, [key]: '' });

    try {
      // For SMTP password, use the password state
      const saveValue = key === 'smtpPassword' ? smtpPassword : value;
      await onSave('email', key, saveValue);
      
      if (key === 'smtpPassword') {
        // After saving password, hide it again
        setShowPassword(false);
        setPasswordFetched(false);
        setSmtpPassword('');
      }
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
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          SMTP settings for server notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SMTP Server Address */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="smtpServerAddress" className="pt-2">
            SMTP Server
          </Label>
          <div className="space-y-1">
            <Input
              id="smtpServerAddress"
              type="text"
              placeholder="smtp.example.com"
              value={localSettings.smtpServerAddress}
              onChange={(e) => handleTextChange('smtpServerAddress', e.target.value)}
              disabled={saving.smtpServerAddress}
            />
            {errors.smtpServerAddress && (
              <p className="text-sm text-destructive">{errors.smtpServerAddress}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('smtpServerAddress')}
            disabled={saving.smtpServerAddress || localSettings.smtpServerAddress === settings.smtpServerAddress}
            size="sm"
          >
            {saving.smtpServerAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* SMTP Port */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="smtpServerPort" className="pt-2">
            SMTP Port
          </Label>
          <div className="space-y-1">
            <Input
              id="smtpServerPort"
              type="number"
              min={1}
              max={65535}
              value={localSettings.smtpServerPort}
              onChange={(e) => handleNumberChange('smtpServerPort', e.target.value)}
              disabled={saving.smtpServerPort}
            />
            {errors.smtpServerPort && (
              <p className="text-sm text-destructive">{errors.smtpServerPort}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('smtpServerPort')}
            disabled={saving.smtpServerPort || localSettings.smtpServerPort === settings.smtpServerPort}
            size="sm"
          >
            {saving.smtpServerPort ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* SMTP Username */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="smtpUsername" className="pt-2">
            SMTP Username
          </Label>
          <div className="space-y-1">
            <Input
              id="smtpUsername"
              type="text"
              value={localSettings.smtpUsername}
              onChange={(e) => handleTextChange('smtpUsername', e.target.value)}
              disabled={saving.smtpUsername}
            />
            {errors.smtpUsername && (
              <p className="text-sm text-destructive">{errors.smtpUsername}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('smtpUsername')}
            disabled={saving.smtpUsername || localSettings.smtpUsername === settings.smtpUsername}
            size="sm"
          >
            {saving.smtpUsername ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* SMTP Password */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="smtpPassword" className="pt-2">
            SMTP Password
          </Label>
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                id="smtpPassword"
                type={showPassword ? 'text' : 'password'}
                value={passwordFetched ? smtpPassword : (hasSmtpPassword ? '••••••••' : '')}
                onChange={(e) => setSmtpPassword(e.target.value)}
                disabled={!passwordFetched || saving.smtpPassword}
                placeholder={hasSmtpPassword ? 'Password set' : 'No password set'}
              />
              {!passwordFetched && hasSmtpPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSmtpPassword}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              {passwordFetched && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {errors.smtpPassword && (
              <p className="text-sm text-destructive">{errors.smtpPassword}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('smtpPassword')}
            disabled={saving.smtpPassword || !passwordFetched || smtpPassword === ''}
            size="sm"
          >
            {saving.smtpPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Email Sender */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="emailSenderAddress" className="pt-2">
            From Address
          </Label>
          <div className="space-y-1">
            <Input
              id="emailSenderAddress"
              type="email"
              placeholder="noreply@example.com"
              value={localSettings.emailSenderAddress}
              onChange={(e) => handleTextChange('emailSenderAddress', e.target.value)}
              disabled={saving.emailSenderAddress}
            />
            {errors.emailSenderAddress && (
              <p className="text-sm text-destructive">{errors.emailSenderAddress}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('emailSenderAddress')}
            disabled={saving.emailSenderAddress || localSettings.emailSenderAddress === settings.emailSenderAddress}
            size="sm"
          >
            {saving.emailSenderAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Email Recipients */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="emailRecipients" className="pt-2">
            Recipients
          </Label>
          <div className="space-y-1">
            <Input
              id="emailRecipients"
              type="text"
              placeholder="admin@example.com, alerts@example.com"
              value={localSettings.emailRecipients}
              onChange={(e) => handleTextChange('emailRecipients', e.target.value)}
              disabled={saving.emailRecipients}
            />
            <p className="text-xs text-muted-foreground">Comma-separated email addresses</p>
            {errors.emailRecipients && (
              <p className="text-sm text-destructive">{errors.emailRecipients}</p>
            )}
          </div>
          <Button
            onClick={() => validateAndSave('emailRecipients')}
            disabled={saving.emailRecipients || localSettings.emailRecipients === settings.emailRecipients}
            size="sm"
          >
            {saving.emailRecipients ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Auth Type */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="smtpAuthType" className="pt-2">
            Authentication
          </Label>
          <Select
            value={String(localSettings.smtpAuthType)}
            onValueChange={(value) => handleSelectChange('smtpAuthType', value)}
            disabled={saving.smtpAuthType}
          >
            <SelectTrigger id="smtpAuthType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="1">Login</SelectItem>
              <SelectItem value="2">Plain</SelectItem>
              <SelectItem value="3">CRAM-MD5</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => validateAndSave('smtpAuthType')}
            disabled={saving.smtpAuthType || localSettings.smtpAuthType === settings.smtpAuthType}
            size="sm"
          >
            {saving.smtpAuthType ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Security Type */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="smtpSecurity" className="pt-2">
            Security
          </Label>
          <Select
            value={String(localSettings.smtpSecurity)}
            onValueChange={(value) => handleSelectChange('smtpSecurity', value)}
            disabled={saving.smtpSecurity}
          >
            <SelectTrigger id="smtpSecurity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="1">SSL</SelectItem>
              <SelectItem value="2">TLS</SelectItem>
              <SelectItem value="3">STARTTLS</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => validateAndSave('smtpSecurity')}
            disabled={saving.smtpSecurity || localSettings.smtpSecurity === settings.smtpSecurity}
            size="sm"
          >
            {saving.smtpSecurity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Notification Level */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 items-start">
          <Label htmlFor="notifyLevel" className="pt-2">
            Notification Level
          </Label>
          <Select
            value={String(localSettings.notifyLevel)}
            onValueChange={(value) => handleSelectChange('notifyLevel', value)}
            disabled={saving.notifyLevel}
          >
            <SelectTrigger id="notifyLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">None</SelectItem>
              <SelectItem value="1">Errors Only</SelectItem>
              <SelectItem value="2">All Events</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => validateAndSave('notifyLevel')}
            disabled={saving.notifyLevel || localSettings.notifyLevel === settings.notifyLevel}
            size="sm"
          >
            {saving.notifyLevel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
