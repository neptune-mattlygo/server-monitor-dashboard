/**
 * UptimeRobot API Polling Service
 * Fetches monitor status every 5 minutes
 */

interface UptimeRobotMonitor {
  id: number;
  friendly_name: string;
  url: string;
  status: number; // 0=paused, 1=not checked, 2=up, 8=seems down, 9=down
  create_datetime: number;
  monitor_type: number; // 1=HTTP(s), 2=keyword, 3=ping, 4=port
  sub_type?: string;
  keyword_type?: number;
  keyword_value?: string;
  port?: string;
  interval: number;
  response_times?: Array<{
    datetime: number;
    value: number;
  }>;
  logs?: Array<{
    type: number; // 1=down, 2=up, 98=started, 99=paused
    datetime: number;
    duration: number;
    reason?: {
      code?: string;
      detail?: string;
    };
  }>;
}

interface UptimeRobotResponse {
  stat: 'ok' | 'fail';
  monitors?: UptimeRobotMonitor[];
  error?: {
    type: string;
    message: string;
  };
}

export class UptimeRobotPoller {
  private apiKey: string;
  private baseUrl = 'https://api.uptimerobot.com/v2/getMonitors';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Map UptimeRobot status codes to our server status
   */
  private mapStatus(status: number): 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown' {
    switch (status) {
      case 2: return 'up';           // Up
      case 9: return 'down';          // Down
      case 8: return 'degraded';      // Seems down
      case 0: return 'maintenance';   // Paused
      case 1: // Not checked yet
      default: return 'unknown';
    }
  }

  /**
   * Fetch all monitors from UptimeRobot
   */
  async fetchMonitors(): Promise<UptimeRobotMonitor[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          format: 'json',
          logs: 1, // Include logs
          log_limit: 2, // Last 2 log entries
          response_times: 1, // Include response times
          response_times_limit: 1, // Last response time only
        }),
      });

      if (!response.ok) {
        throw new Error(`UptimeRobot API error: ${response.status} ${response.statusText}`);
      }

      const data: UptimeRobotResponse = await response.json();

      if (data.stat === 'fail') {
        throw new Error(`UptimeRobot API error: ${data.error?.message || 'Unknown error'}`);
      }

      return data.monitors || [];
    } catch (error) {
      console.error('Failed to fetch UptimeRobot monitors:', error);
      throw error;
    }
  }

  /**
   * Convert UptimeRobot monitor to our server format
   */
  transformMonitor(monitor: UptimeRobotMonitor) {
    const status = this.mapStatus(monitor.status);
    const responseTime = monitor.response_times?.[0]?.value || null;
    const lastLog = monitor.logs?.[0];

    return {
      external_id: `uptimerobot_${monitor.id}`,
      name: monitor.friendly_name,
      url: monitor.url,
      server_type: this.getMonitorType(monitor.monitor_type),
      current_status: status,
      last_check_at: lastLog ? new Date(lastLog.datetime * 1000).toISOString() : null,
      response_time_ms: responseTime,
      metadata: {
        monitor_id: monitor.id,
        interval: monitor.interval,
        monitor_type: monitor.monitor_type,
        last_down_reason: lastLog?.reason?.detail,
        uptimerobot_url: `https://uptimerobot.com/dashboard#${monitor.id}`,
      },
    };
  }

  /**
   * Get human-readable monitor type
   */
  private getMonitorType(type: number): string {
    switch (type) {
      case 1: return 'HTTP(s)';
      case 2: return 'Keyword';
      case 3: return 'Ping';
      case 4: return 'Port';
      default: return 'Unknown';
    }
  }
}

/**
 * Create poller instance
 */
export function createUptimeRobotPoller() {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  
  if (!apiKey) {
    throw new Error('UPTIMEROBOT_API_KEY environment variable not configured');
  }

  return new UptimeRobotPoller(apiKey);
}
