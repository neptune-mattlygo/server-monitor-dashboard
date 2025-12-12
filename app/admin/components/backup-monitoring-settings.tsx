'use client';

import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Bell, Clock, Mail, Play, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BackupMonitoringConfig {
  id: string;
  is_enabled: boolean;
  threshold_hours: number;
  email_recipients: string[];
  alert_on_never_backed_up: boolean;
  check_schedule: string;
  last_check_at: string | null;
}

interface MonitoringResult {
  id: string;
  check_run_at: string;
  servers_checked: number;
  servers_overdue: number;
  notification_sent: boolean;
  notification_error: string | null;
}

export function BackupMonitoringSettings() {
  const [config, setConfig] = useState<BackupMonitoringConfig | null>(null);
  const [recentResults, setRecentResults] = useState<MonitoringResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [thresholdHours, setThresholdHours] = useState(24);
  const [alertOnNeverBackedUp, setAlertOnNeverBackedUp] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [emailList, setEmailList] = useState<string[]>([]);

  useEffect(() => {
    fetchConfig();
    fetchRecentResults();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/backup-monitoring');
      if (!response.ok) throw new Error('Failed to fetch configuration');
      const data = await response.json();
      
      if (data.config) {
        setConfig(data.config);
        setIsEnabled(data.config.is_enabled);
        setThresholdHours(data.config.threshold_hours);
        setAlertOnNeverBackedUp(data.config.alert_on_never_backed_up ?? true);
        setEmailList(data.config.email_recipients || []);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentResults = async () => {
    try {
      const response = await fetch('/api/admin/backup-monitoring/results');
      if (!response.ok) return;
      const data = await response.json();
      setRecentResults(data.results || []);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/backup-monitoring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_enabled: isEnabled,
          threshold_hours: thresholdHours,
          email_recipients: emailList,
          alert_on_never_backed_up: alertOnNeverBackedUp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }

      const data = await response.json();
      setConfig(data.config);
      setMessage({ type: 'success', text: 'Configuration saved successfully' });
    } catch (error: any) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestRun = async () => {
    setTesting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/backup-monitoring/test', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMsg = error.error || 'Test run failed';
        
        if (error.details) {
          const details = typeof error.details === 'string' 
            ? error.details 
            : JSON.stringify(error.details, null, 2);
          errorMsg += `: ${details}`;
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Build detailed message including email status
      let messageText = `Test completed: ${data.data.servers_checked} servers checked, ${data.data.servers_overdue} overdue`;
      
      if (data.data.servers_overdue > 0) {
        if (data.data.notification_sent) {
          messageText += ` • Email sent to ${emailList.length} recipient(s)`;
        } else if (data.data.notification_error) {
          messageText += ` • Email failed: ${data.data.notification_error}`;
        } else {
          messageText += ` • No email sent (check configuration)`;
        }
      }
      
      setMessage({ 
        type: data.data.notification_error ? 'error' : 'success', 
        text: messageText
      });
      fetchRecentResults();
    } catch (error: any) {
      console.error('Test run failed:', error);
      setMessage({ type: 'error', text: error.message || 'Test run failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleHealthCheck = async () => {
    setCheckingHealth(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/backup-monitoring/health', {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Health check failed');
      }

      const data = await response.json();
      
      if (data.healthy) {
        setMessage({ 
          type: 'success', 
          text: 'All environment variables are configured correctly' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Missing environment variables: ${data.missing_variables.join(', ')}` 
        });
      }
    } catch (error: any) {
      console.error('Health check failed:', error);
      setMessage({ type: 'error', text: error.message || 'Health check failed' });
    } finally {
      setCheckingHealth(false);
    }
  };

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Invalid email address' });
      return;
    }

    if (emailList.includes(email)) {
      setMessage({ type: 'error', text: 'Email already in list' });
      return;
    }

    setEmailList([...emailList, email]);
    setEmailInput('');
    setMessage(null);
  };

  const handleRemoveEmail = (email: string) => {
    setEmailList(emailList.filter(e => e !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Loading configuration...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Backup Monitoring</h2>
            <p className="text-sm text-gray-600">
              Automated checks for server backup freshness
            </p>
          </div>
        </div>

        {message && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Monitoring</Label>
              <p className="text-sm text-gray-600">
                Automatically check for overdue backups
              </p>
            </div>
            <Switch
              id="enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          {/* Threshold Hours */}
          <div className="space-y-2">
            <Label htmlFor="threshold">
              <Clock className="inline h-4 w-4 mr-1" />
              Alert Threshold (hours)
            </Label>
            <Input
              id="threshold"
              type="number"
              min="1"
              max="168"
              value={thresholdHours}
              onChange={(e) => setThresholdHours(parseInt(e.target.value) || 24)}
              className="max-w-xs"
              disabled={!isEnabled}
            />
            <p className="text-sm text-gray-600">
              Alert if a backup hasn't been made within this many hours
            </p>
          </div>

          {/* Alert on Never Backed Up */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="alert-never-backed-up">
                  Alert on Never Backed Up Servers
                </Label>
                <p className="text-sm text-gray-600">
                  Send alerts for servers that have never had a successful backup
                </p>
              </div>
              <Switch
                id="alert-never-backed-up"
                checked={alertOnNeverBackedUp}
                onCheckedChange={setAlertOnNeverBackedUp}
                disabled={!isEnabled}
              />
            </div>
          </div>

          {/* Email Recipients */}
          <div className="space-y-3">
            <Label htmlFor="email">
              <Mail className="inline h-4 w-4 mr-1" />
              Email Distribution List
            </Label>
            <p className="text-sm text-gray-600">
              All recipients receive a single aggregated alert
            </p>
            
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={!isEnabled}
              />
              <Button
                type="button"
                onClick={handleAddEmail}
                disabled={!isEnabled || !emailInput.trim()}
              >
                Add
              </Button>
            </div>

            {emailList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {emailList.map((email) => (
                  <Badge key={email} variant="secondary" className="pl-3 pr-1 py-1">
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-2 hover:bg-transparent"
                      onClick={() => handleRemoveEmail(email)}
                      disabled={!isEnabled}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || !isEnabled && emailList.length === 0}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestRun}
              disabled={testing || !config?.is_enabled}
            >
              <Play className="h-4 w-4 mr-2" />
              {testing ? 'Running...' : 'Run Test Check'}
            </Button>
            <Button
              variant="outline"
              onClick={handleHealthCheck}
              disabled={checkingHealth}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {checkingHealth ? 'Checking...' : 'Check Health'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Schedule Information */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Automated Check Schedule</p>
            <p className="text-sm">
              Backup checks run automatically at <strong>6:00 AM UTC</strong> daily.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              To change the schedule, update the cron expression in <code className="bg-muted px-1 py-0.5 rounded text-xs">vercel.json</code> (currently: <code className="bg-muted px-1 py-0.5 rounded text-xs">0 6 * * *</code>) and redeploy the application.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Check Results</h3>
          <div className="space-y-3">
            {recentResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {result.servers_overdue > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {result.servers_overdue > 0
                          ? `${result.servers_overdue} server(s) overdue`
                          : 'All servers up to date'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(result.check_run_at).toLocaleString()} • 
                        {result.servers_checked} servers checked
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.notification_sent ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Email Sent
                    </Badge>
                  ) : result.notification_error ? (
                    <Badge variant="destructive">
                      Failed
                    </Badge>
                  ) : result.servers_overdue === 0 ? (
                    <Badge variant="secondary">
                      No Alert
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
