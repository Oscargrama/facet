-- RWA lots (Facet)
CREATE TABLE IF NOT EXISTS public.rwa_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  originator_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  lot_id BIGINT NOT NULL,
  carats INT NOT NULL,
  physical_location TEXT NOT NULL,
  custody_provider TEXT NOT NULL,
  cert_hash TEXT NOT NULL,
  metadata_cid TEXT NOT NULL,
  lot_token_supply BIGINT NOT NULL,
  tx_hash TEXT,
  chain_id BIGINT,
  registry_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rwa_lots_lot_id ON public.rwa_lots(lot_id);
CREATE INDEX IF NOT EXISTS idx_rwa_lots_originator_user_id ON public.rwa_lots(originator_user_id);

ALTER TABLE public.rwa_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "originators can view their lots"
ON public.rwa_lots FOR SELECT
USING (auth.uid() = originator_user_id);

CREATE POLICY "originators can insert their lots"
ON public.rwa_lots FOR INSERT
WITH CHECK (auth.uid() = originator_user_id);

CREATE POLICY "service role can manage rwa lots"
ON public.rwa_lots FOR ALL
USING (auth.role() = 'service_role');

-- Event index for RWA lots
CREATE TABLE IF NOT EXISTS public.rwa_lot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id BIGINT,
  event_name TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rwa_lot_events_unique ON public.rwa_lot_events(tx_hash, log_index);
CREATE INDEX IF NOT EXISTS idx_rwa_lot_events_lot_id ON public.rwa_lot_events(lot_id);

ALTER TABLE public.rwa_lot_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can view rwa events"
ON public.rwa_lot_events FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "service role can manage rwa events"
ON public.rwa_lot_events FOR ALL
USING (auth.role() = 'service_role');

-- Indexer state (last processed block)
CREATE TABLE IF NOT EXISTS public.rwa_indexer_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registry_address TEXT NOT NULL,
  chain_id BIGINT NOT NULL,
  last_block BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rwa_indexer_state_registry_chain
ON public.rwa_indexer_state(registry_address, chain_id);

ALTER TABLE public.rwa_indexer_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can view indexer state"
ON public.rwa_indexer_state FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "service role can manage indexer state"
ON public.rwa_indexer_state FOR ALL
USING (auth.role() = 'service_role');
