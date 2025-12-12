-- Add settings table for metadata refresh configuration
CREATE TABLE IF NOT EXISTS metadata_refresh_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  refresh_interval_days INTEGER DEFAULT 7,
  notification_emails TEXT[], -- Array of email addresses
  enabled BOOLEAN DEFAULT true,
  last_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add metadata refresh tracking to servers
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_metadata_refresh_at TIMESTAMPTZ;
ALTER TABLE servers ADD COLUMN IF NOT EXISTS metadata_refresh_status TEXT DEFAULT 'never'; -- 'success', 'failed', 'never'
ALTER TABLE servers ADD COLUMN IF NOT EXISTS last_metadata_error TEXT;

-- Insert default settings
INSERT INTO metadata_refresh_settings (refresh_interval_days, notification_emails, enabled) 
VALUES (7, '{}', true)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for metadata_refresh_settings
CREATE TRIGGER update_metadata_refresh_settings_updated_at 
    BEFORE UPDATE ON metadata_refresh_settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();