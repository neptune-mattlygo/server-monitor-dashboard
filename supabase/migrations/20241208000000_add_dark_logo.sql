-- Add dark mode logo URL to status_page_config
ALTER TABLE status_page_config 
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT;

COMMENT ON COLUMN status_page_config.logo_dark_url IS 'Logo URL for dark mode (optional)';
