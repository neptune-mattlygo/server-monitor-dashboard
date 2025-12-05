-- Status Page System Migration
-- Creates tables for public status page, client management, and incident tracking

-- Regions/Locations for server grouping
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regions_slug ON regions(slug);
CREATE INDEX idx_regions_display_order ON regions(display_order);

-- Link servers to regions
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS region_id UUID REFERENCES regions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_servers_region_id ON servers(region_id);

-- Clients/Organizations who subscribe to status updates
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT UNIQUE,
  unsubscribe_token TEXT UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_verification_token ON clients(verification_token);
CREATE INDEX idx_clients_unsubscribe_token ON clients(unsubscribe_token);
CREATE INDEX idx_clients_is_verified ON clients(is_verified) WHERE is_verified = true;

-- Client subscription preferences
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('all_servers', 'specific_servers', 'region', 'host')),
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  host_id UUID REFERENCES hosts(id) ON DELETE CASCADE,
  notify_on_status TEXT[] DEFAULT ARRAY['down', 'degraded']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subscription_target_check CHECK (
    (subscription_type = 'all_servers' AND server_id IS NULL AND region_id IS NULL AND host_id IS NULL) OR
    (subscription_type = 'specific_servers' AND server_id IS NOT NULL) OR
    (subscription_type = 'region' AND region_id IS NOT NULL) OR
    (subscription_type = 'host' AND host_id IS NOT NULL)
  )
);

CREATE INDEX idx_client_subscriptions_client_id ON client_subscriptions(client_id);
CREATE INDEX idx_client_subscriptions_server_id ON client_subscriptions(server_id);
CREATE INDEX idx_client_subscriptions_region_id ON client_subscriptions(region_id);
CREATE INDEX idx_client_subscriptions_host_id ON client_subscriptions(host_id);

-- Status incidents (manually created by admins)
CREATE TABLE IF NOT EXISTS status_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('outage', 'degraded', 'maintenance', 'resolved')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'info')),
  affected_servers UUID[] DEFAULT ARRAY[]::UUID[],
  affected_regions UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'identified', 'monitoring', 'resolved')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  notify_subscribers BOOLEAN DEFAULT TRUE,
  notified_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_incidents_status ON status_incidents(status);
CREATE INDEX idx_status_incidents_started_at ON status_incidents(started_at DESC);
CREATE INDEX idx_status_incidents_severity ON status_incidents(severity);

-- Incident updates (timeline of incident resolution)
CREATE TABLE IF NOT EXISTS incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES status_incidents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('investigating', 'update', 'resolved')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incident_updates_incident_id ON incident_updates(incident_id, created_at DESC);

-- Email notification log
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  incident_id UUID REFERENCES status_incidents(id) ON DELETE SET NULL,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('incident_created', 'incident_updated', 'incident_resolved', 'status_change', 'verification', 'subscription_confirm')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed', 'bounced')),
  error_message TEXT
);

CREATE INDEX idx_email_notifications_client_id ON email_notifications(client_id);
CREATE INDEX idx_email_notifications_sent_at ON email_notifications(sent_at DESC);
CREATE INDEX idx_email_notifications_delivery_status ON email_notifications(delivery_status);

-- Status page branding configuration
CREATE TABLE IF NOT EXISTS status_page_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'Server Monitor',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  favicon_url TEXT,
  custom_domain TEXT,
  support_email TEXT,
  support_url TEXT,
  twitter_handle TEXT,
  show_uptime_percentage BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO status_page_config (company_name) VALUES ('Server Monitor');

-- Triggers for updated_at
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_incidents_updated_at
  BEFORE UPDATE ON status_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_page_config_updated_at
  BEFORE UPDATE ON status_page_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_page_config ENABLE ROW LEVEL SECURITY;

-- Public read access for status page (no auth required)
CREATE POLICY "Public can read active regions"
  ON regions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Public can read incidents"
  ON status_incidents FOR SELECT
  USING (true);

CREATE POLICY "Public can read incident updates"
  ON incident_updates FOR SELECT
  USING (true);

CREATE POLICY "Public can read status page config"
  ON status_page_config FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage regions"
  ON regions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage clients"
  ON clients FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can view subscriptions"
  ON client_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage incidents"
  ON status_incidents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage incident updates"
  ON incident_updates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can view email notifications"
  ON email_notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can update status page config"
  ON status_page_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  ));
