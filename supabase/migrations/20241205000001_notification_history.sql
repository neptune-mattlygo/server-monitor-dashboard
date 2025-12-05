-- Create notification history table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES status_incidents(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_notification_history_incident ON notification_history(incident_id);
CREATE INDEX idx_notification_history_email ON notification_history(recipient_email);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at DESC);

-- Add RLS policies
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
  ON notification_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for service role"
  ON notification_history FOR INSERT
  TO service_role
  WITH CHECK (true);
