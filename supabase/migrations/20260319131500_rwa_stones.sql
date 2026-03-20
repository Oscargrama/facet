-- RWA stones (Facet)
CREATE TABLE IF NOT EXISTS public.rwa_stones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  originator_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lot_id BIGINT NOT NULL,
  token_id BIGINT NOT NULL,
  stone_name TEXT NOT NULL,
  carats NUMERIC NOT NULL,
  cut_type TEXT,
  cutter TEXT,
  metadata_cid TEXT NOT NULL,
  photo_cid TEXT,
  video_cid TEXT,
  cert_cid TEXT,
  certified BOOLEAN DEFAULT FALSE,
  cert_hash TEXT,
  cert_issuer TEXT,
  cert_date DATE,
  tx_hash TEXT,
  chain_id BIGINT,
  nft_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rwa_stones_unique
  ON public.rwa_stones(token_id, nft_address, chain_id);
CREATE INDEX IF NOT EXISTS idx_rwa_stones_lot_id ON public.rwa_stones(lot_id);
CREATE INDEX IF NOT EXISTS idx_rwa_stones_originator_user_id ON public.rwa_stones(originator_user_id);

ALTER TABLE public.rwa_stones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "originators can view their stones"
ON public.rwa_stones FOR SELECT
USING (auth.uid() = originator_user_id);

CREATE POLICY "originators can insert their stones"
ON public.rwa_stones FOR INSERT
WITH CHECK (auth.uid() = originator_user_id);

CREATE POLICY "authenticated can view rwa stones"
ON public.rwa_stones FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "service role can manage rwa stones"
ON public.rwa_stones FOR ALL
USING (auth.role() = 'service_role');
