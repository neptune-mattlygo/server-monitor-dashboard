'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { CheckCircle2, AlertCircle, AlertTriangle, Clock, Mail } from 'lucide-react';

interface StatusData {
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  config: {
    company_name: string;
    logo_url?: string;
    logo_dark_url?: string;
    primary_color: string;
    support_email?: string;
    support_url?: string;
    show_uptime_percentage: boolean;
  };
  servers: {
    total: number;
    up: number;
    down: number;
    degraded: number;
    maintenance: number;
  };
  uptime_percentage: string | null;
  active_incidents: any[];
  resolved_incidents: any[];
  regions: any[];
  last_updated: string;
}

export function StatusPageClient() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeForm, setSubscribeForm] = useState({ name: '', email: '', company: '' });
  const [subscribeMessage, setSubscribeMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchStatus();
    checkAuth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      const result = await response.json();
      setIsAuthenticated(result.authenticated || false);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribing(true);
    setSubscribeMessage('');

    try {
      const response = await fetch('/api/status/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscribeForm),
      });

      const result = await response.json();

      if (response.ok) {
        setSubscribeMessage(result.message || 'Please check your email to verify your subscription');
        setSubscribeForm({ name: '', email: '', company: '' });
        setShowSubscribe(false);
      } else {
        setSubscribeMessage(result.error || 'Failed to subscribe');
      }
    } catch (error) {
      setSubscribeMessage('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading status...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case 'operational':
        return <CheckCircle2 className="h-8 w-8 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-8 w-8 text-yellow-600" />;
      case 'outage':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
      case 'maintenance':
        return <Clock className="h-8 w-8 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Partial Service Degradation';
      case 'outage':
        return 'Service Outage';
      case 'maintenance':
        return 'Scheduled Maintenance';
    }
  };

  const getStatusColor = () => {
    switch (data.status) {
      case 'operational':
        return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'degraded':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
      case 'outage':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
      case 'maintenance':
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    }
  };

  const getIncidentStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      investigating: { variant: 'default', label: 'Investigating' },
      identified: { variant: 'default', label: 'Identified' },
      monitoring: { variant: 'secondary', label: 'Monitoring' },
      resolved: { variant: 'outline', label: 'Resolved' },
    };
    return variants[status] || { variant: 'default', label: status };
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {data.config.logo_url && (
                <>
                  <img
                    src={data.config.logo_url}
                    alt={data.config.company_name}
                    className="h-10 w-auto object-contain dark:hidden"
                  />
                  <img
                    src={data.config.logo_dark_url || data.config.logo_url}
                    alt={data.config.company_name}
                    className="h-10 w-auto object-contain hidden dark:block"
                  />
                </>
              )}
            </div>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.config.company_name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">System Status</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowSubscribe(!showSubscribe)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Subscribe to Updates
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Subscribe Form */}
        {showSubscribe && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Subscribe to Status Updates</CardTitle>
              <CardDescription>
                Get notified via email about service incidents and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Your Name"
                    value={subscribeForm.name}
                    onChange={(e) => setSubscribeForm({ ...subscribeForm, name: e.target.value })}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={subscribeForm.email}
                    onChange={(e) => setSubscribeForm({ ...subscribeForm, email: e.target.value })}
                    required
                  />
                </div>
                <Input
                  placeholder="Company (optional)"
                  value={subscribeForm.company}
                  onChange={(e) => setSubscribeForm({ ...subscribeForm, company: e.target.value })}
                />
                <Button type="submit" disabled={subscribing}>
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
              {subscribeMessage && (
                <Alert className="mt-4">
                  <AlertDescription>{subscribeMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overall Status */}
        <Card className={`mb-6 border-2 ${getStatusColor()}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{getStatusText()}</h2>
                {data.config.show_uptime_percentage && data.uptime_percentage && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {data.uptime_percentage}% uptime (last 90 days)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status Message */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 py-4">
              {data.status === 'operational' ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                    All systems operational
                  </div>
                </>
              ) : data.status === 'degraded' ? (
                <>
                  <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
                    Degraded performance
                  </div>
                </>
              ) : data.status === 'outage' ? (
                <>
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    Service outage
                  </div>
                </>
              ) : (
                <>
                  <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                    Scheduled maintenance
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        {data.active_incidents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Active Incidents</h2>
            <div className="space-y-4">
              {data.active_incidents.map((incident) => {
                const statusInfo = getIncidentStatusBadge(incident.status);
                return (
                  <Card key={incident.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle>{incident.title}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                            <Badge
                              variant={
                                incident.severity === 'critical'
                                  ? 'destructive'
                                  : incident.severity === 'major'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {incident.severity}
                            </Badge>
                          </div>
                          <CardDescription className="mt-2">
                            {incident.description}
                          </CardDescription>
                          {incident.affected_region_names && incident.affected_region_names.length > 0 && (
                            <div className="mt-3 flex items-start gap-2">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Affected Regions:
                              </span>
                              <span className="text-xs text-gray-700 dark:text-gray-300">
                                {incident.affected_region_names.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {incident.incident_updates?.length > 0 && (
                      <CardContent>
                        <h4 className="font-semibold text-sm mb-2">Updates:</h4>
                        <div className="space-y-2">
                          {incident.incident_updates.slice(0, 3).map((update: any) => (
                            <div key={update.id} className="text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                              <p className="text-gray-700 dark:text-gray-300">{update.message}</p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                {new Date(update.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Resolved Incidents (Last 7 Days) */}
        {data.resolved_incidents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Recent Resolutions</h2>
            <div className="space-y-4">
              {data.resolved_incidents.map((incident) => (
                <Card key={incident.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base">{incident.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Resolved</Badge>
                          <Badge
                            variant="secondary"
                          >
                            {incident.severity}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Resolved {new Date(incident.resolved_at).toLocaleDateString()}
                          </span>
                        </div>
                        {incident.affected_region_names && incident.affected_region_names.length > 0 && (
                          <div className="mt-2 flex items-start gap-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Affected Regions:
                            </span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {incident.affected_region_names.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Last updated: {new Date(data.last_updated).toLocaleString()}</p>
          {data.config.support_email && (
            <p className="mt-2">
              Questions? Contact{' '}
              <a href={`mailto:${data.config.support_email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                {data.config.support_email}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
