-- Create contract_signatures table for hybrid signature system
CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE NOT NULL,
  signature_token UUID UNIQUE DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Client validation data (NO WALLET needed)
  client_phone TEXT,
  client_email TEXT NOT NULL,
  otp_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Digital signature data
  signature_hash TEXT,
  device_fingerprint TEXT,
  ip_address TEXT,
  user_agent TEXT,
  geolocation TEXT,
  
  -- Blockchain data (corporate wallet handles this)
  blockchain_tx_hash TEXT,
  ipfs_cid TEXT,
  block_number BIGINT,
  
  -- Timestamps
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create OTP verifications table for audit trail
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_id UUID REFERENCES contract_signatures(id) ON DELETE CASCADE,
  phone_or_email TEXT NOT NULL,
  otp_code_hash TEXT NOT NULL,
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update contracts table with signature tracking columns
ALTER TABLE contracts 
ADD COLUMN signature_token UUID,
ADD COLUMN client_signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN client_signature_method TEXT DEFAULT 'hybrid_otp';

-- Enable RLS on new tables
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow public read access with valid token (for signing page)
CREATE POLICY "Anyone can view pending signatures with valid token"
ON contract_signatures FOR SELECT
USING (expires_at > NOW() AND status = 'pending');

-- RLS Policy: Service role can manage all signatures
CREATE POLICY "Service role can manage signatures"
ON contract_signatures FOR ALL
USING (auth.role() = 'service_role');

-- RLS Policy: Service role can manage OTP verifications
CREATE POLICY "Service role can manage otp verifications"
ON otp_verifications FOR ALL
USING (auth.role() = 'service_role');

-- Create trigger for updated_at on contract_signatures
CREATE TRIGGER update_contract_signatures_updated_at
BEFORE UPDATE ON contract_signatures
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create index for faster token lookups
CREATE INDEX idx_contract_signatures_token ON contract_signatures(signature_token) WHERE status = 'pending';
CREATE INDEX idx_contract_signatures_status ON contract_signatures(status);
CREATE INDEX idx_otp_verifications_signature_id ON otp_verifications(signature_id);