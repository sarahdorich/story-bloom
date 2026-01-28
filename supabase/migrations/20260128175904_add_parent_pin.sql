-- Add parent PIN columns to app_settings table
-- PIN is optional - parents can choose to enable it

ALTER TABLE app_settings
ADD COLUMN parent_pin_hash TEXT DEFAULT NULL,
ADD COLUMN pin_reset_token TEXT DEFAULT NULL,
ADD COLUMN pin_reset_token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN app_settings.parent_pin_hash IS 'Bcrypt hash of the 4-digit parent PIN (null if not set)';
COMMENT ON COLUMN app_settings.pin_reset_token IS 'Token for PIN reset flow (null when not in reset process)';
COMMENT ON COLUMN app_settings.pin_reset_token_expires_at IS 'Expiry timestamp for PIN reset token';
