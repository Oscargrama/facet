import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignatureStatusRequest {
  signatureId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { signatureId } = await req.json() as SignatureStatusRequest;

    if (!signatureId) {
      console.error('Missing signatureId');
      return new Response(
        JSON.stringify({ error: 'Missing signatureId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching signature status for:', signatureId);

    // Fetch signature status using service role (bypasses RLS)
    const { data: signature, error } = await supabase
      .from('contract_signatures')
      .select('status, blockchain_tx_hash, block_number')
      .eq('id', signatureId)
      .single();

    if (error) {
      console.error('Error fetching signature:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch signature status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signature status:', signature);

    return new Response(
      JSON.stringify({
        status: signature.status,
        blockchain_tx_hash: signature.blockchain_tx_hash,
        block_number: signature.block_number,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-signature-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
