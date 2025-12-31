-- Enable Row Level Security on metadata_refresh_settings table
ALTER TABLE metadata_refresh_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin users can view metadata refresh settings" ON metadata_refresh_settings;
DROP POLICY IF EXISTS "Admin users can update metadata refresh settings" ON metadata_refresh_settings;

-- Policy: Only admins can view metadata refresh settings
CREATE POLICY "Admin users can view metadata refresh settings"
  ON metadata_refresh_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can update metadata refresh settings
CREATE POLICY "Admin users can update metadata refresh settings"
  ON metadata_refresh_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can insert metadata refresh settings
CREATE POLICY "Admin users can insert metadata refresh settings"
  ON metadata_refresh_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only admins can delete metadata refresh settings
CREATE POLICY "Admin users can delete metadata refresh settings"
  ON metadata_refresh_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
