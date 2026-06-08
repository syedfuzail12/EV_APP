-- Create riders table
CREATE TABLE IF NOT EXISTS riders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(10) UNIQUE NOT NULL,
  city VARCHAR(100) NOT NULL,
  pin_code VARCHAR(6),
  platforms TEXT[],
  platform VARCHAR(100) NOT NULL,
  experience DECIMAL(3,1),
  vehicle_type VARCHAR(100) NOT NULL,
  vehicle_brand VARCHAR(255),
  fuel_method VARCHAR(100) NOT NULL,
  weekly_expense INTEGER,
  monthly_maintenance INTEGER,
  challenges TEXT[],
  ev_challenges TEXT[],
  petrol_challenges TEXT[],
  accident_insurance VARCHAR(50),
  health_insurance VARCHAR(50),
  paid_for_accident VARCHAR(10),
  switch_to_ev VARCHAR(50),
  switch_reasons TEXT[],
  interested TEXT[],
  accessories TEXT[],
  consent_given BOOLEAN DEFAULT false,
  referred_by_code VARCHAR(20),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  points INTEGER DEFAULT 10,
  referral_count INTEGER DEFAULT 0,
  segment VARCHAR(255),
  lead_tags TEXT[],
  follow_up_status VARCHAR(50) DEFAULT 'New',
  language VARCHAR(10) DEFAULT 'en',
  otp_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on whatsapp for faster lookups
CREATE INDEX IF NOT EXISTS idx_riders_whatsapp ON riders(whatsapp);

-- Create index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_riders_referral_code ON riders(referral_code);

-- Create index on segment for filtering
CREATE INDEX IF NOT EXISTS idx_riders_segment ON riders(segment);

-- Create index on city for filtering
CREATE INDEX IF NOT EXISTS idx_riders_city ON riders(city);

-- Create index on pin_code for filtering
CREATE INDEX IF NOT EXISTS idx_riders_pin_code ON riders(pin_code);

-- Create index on vehicle_type for filtering
CREATE INDEX IF NOT EXISTS idx_riders_vehicle_type ON riders(vehicle_type);

-- Create index on follow_up_status for filtering
CREATE INDEX IF NOT EXISTS idx_riders_follow_up_status ON riders(follow_up_status);

-- Create index on lead_tags for filtering
CREATE INDEX IF NOT EXISTS idx_riders_lead_tags ON riders USING GIN (lead_tags);

-- Enable Row Level Security (optional)
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your needs)
CREATE POLICY "Allow all operations" ON riders FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_riders_updated_at
    BEFORE UPDATE ON riders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
