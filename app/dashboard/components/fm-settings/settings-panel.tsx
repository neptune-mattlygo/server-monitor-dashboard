'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { FileMakerSettings } from '@/lib/supabase';
import { GeneralConfigSection } from './general-config-section';
import { WebPublishingSection } from './web-publishing-section';
import { SecuritySection } from './security-section';
import { EmailSection } from './email-section';

interface SettingsPanelProps {
  serverId: string;
}

interface SettingsResponse {
  settings?: FileMakerSettings;
  hasSmtpPassword?: boolean;
  lastUpdated?: string;
  updatedBy?: string;
  lastError?: string;
  error?: string;
  concurrentUpdateWarning?: boolean;
}

interface SettingChangeEvent {
  id: string;
  created_at: string;
  message: string;
  payload: {
    category: string;
    settingKey: string;
    oldValue: any;
    newValue: any;
    changedByEmail: string;
  };
}

export function SettingsPanel({ serverId }: SettingsPanelProps) {
  const [settings, setSettings] = useState<FileMakerSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [concurrentWarning, setConcurrentWarning] = useState(false);
  const [recentChanges, setRecentChanges] = useState<SettingChangeEvent[]>([]);
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);

  // Fetch settings
  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    setConcurrentWarning(false);

    try {
      const response = await fetch(`/api/servers/${serverId}/fm-settings`);
      const data: SettingsResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch settings');
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.lastUpdated) {
          setLastUpdated(data.lastUpdated);
        }
        return;
      }

      setSettings(data.settings || null);
      setLastUpdated(data.lastUpdated || null);
      setHasSmtpPassword(data.hasSmtpPassword || false);
      setError(null);

    } catch (err) {
      setError('Failed to fetch settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent changes
  const fetchRecentChanges = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/events?type=setting_change&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setRecentChanges(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching recent changes:', err);
    }
  };

  // Handle setting save
  const handleSave = async (category: string, settingKey: string, value: any) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/fm-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, settingKey, value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update setting');
      }

      // Update local state with new settings
      if (data.settings) {
        setSettings(data.settings);
        setLastUpdated(data.lastUpdated);
      }

      // Show concurrent update warning if detected
      if (data.concurrentUpdateWarning) {
        setConcurrentWarning(true);
      }

      // Refresh recent changes
      fetchRecentChanges();

      return { success: true };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update setting';
      console.error('Error updating setting:', err);
      throw new Error(message);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Load recent changes on mount
  useEffect(() => {
    fetchRecentChanges();
  }, [serverId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">FileMaker Server Settings</h3>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {formatTimestamp(lastUpdated)}
            </p>
          )}
        </div>
        <Button 
          onClick={fetchSettings} 
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Fetching...' : 'Fetch Settings'}
        </Button>
      </div>

      {/* Concurrent Update Warning */}
      {concurrentWarning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Another admin updated settings recently. Click "Fetch Settings" to refresh and see the latest values.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recent Changes */}
      {recentChanges.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="recent-changes">
            <AccordionTrigger>Recent Changes ({recentChanges.length})</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {recentChanges.map((event) => (
                  <div key={event.id} className="flex justify-between items-start py-2 border-b last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {event.payload.category} → {event.payload.settingKey}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {event.payload.changedByEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <Badge variant="outline" className="font-mono text-xs">
                        {String(event.payload.oldValue)}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className="font-mono text-xs">
                        {String(event.payload.newValue)}
                      </Badge>
                    </div>
                    <div className="ml-4">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(event.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Settings Sections */}
      {settings ? (
        <div className="space-y-6">
          <GeneralConfigSection 
            settings={settings.general} 
            onSave={handleSave}
          />
          <WebPublishingSection 
            settings={settings.webPublishing} 
            onSave={handleSave}
          />
          <SecuritySection 
            settings={settings.security} 
            onSave={handleSave}
          />
          <EmailSection 
            settings={settings.email}
            serverId={serverId}
            hasSmtpPassword={hasSmtpPassword}
            onSave={handleSave}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Click "Fetch Settings" to load FileMaker Server settings</p>
        </div>
      )}
    </div>
  );
}
