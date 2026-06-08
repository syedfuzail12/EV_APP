-- ================================================================
-- DATABASE UPDATE SCRIPT FOR ROUND 2 IMPROVEMENTS
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add new columns to existing riders table
ALTER TABLE riders ADD COLUMN IF NOT EXISTS pin_code VARCHAR(6);
ALTER TABLE riders ADD COLUMN IF NOT EXISTS platforms TEXT[];
ALTER TABLE riders ADD COLUMN IF NOT EXISTS accessories TEXT[];
ALTER TABLE riders ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS lead_tags TEXT[];
ALTER TABLE riders ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(50) DEFAULT 'New';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_riders_pin_code ON riders(pin_code);
CREATE INDEX IF NOT EXISTS idx_riders_follow_up_status ON riders(follow_up_status);
CREATE INDEX IF NOT EXISTS idx_riders_lead_tags ON riders USING GIN (lead_tags);

-- Update existing riders to have empty arrays instead of NULL
UPDATE riders 
SET platforms = ARRAY[platform] 
WHERE platforms IS NULL AND platform IS NOT NULL;

UPDATE riders 
SET accessories = ARRAY[]::TEXT[] 
WHERE accessories IS NULL;

UPDATE riders 
SET lead_tags = ARRAY[]::TEXT[] 
WHERE lead_tags IS NULL;

UPDATE riders 
SET consent_given = true 
WHERE consent_given IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'riders'
ORDER BY ordinal_position;

-- ================================================================
-- SUCCESS! Your database is now updated for Round 2 features.
-- ================================================================
