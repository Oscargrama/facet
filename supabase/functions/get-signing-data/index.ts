import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching signature data for token:', token);

    // Fetch signature data
    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('signature_token', token)
      .maybeSingle();

    if (sigError) {
      console.error('Error fetching signature:', sigError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch signature data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signature) {
      console.error('Signature not found for token:', token);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired signature link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if signature is expired
    if (new Date(signature.expires_at) < new Date()) {
      console.error('Signature expired:', signature.expires_at);
      return new Response(
        JSON.stringify({ error: 'This signature link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching contract data for contract_id:', signature.contract_id);

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', signature.contract_id)
      .maybeSingle();

    if (contractError) {
      console.error('Error fetching contract:', contractError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch contract data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!contract) {
      console.error('Contract not found for id:', signature.contract_id);
      return new Response(
        JSON.stringify({ error: 'Contract not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully fetched signing data');

    return new Response(
      JSON.stringify({
        signature,
        contract,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
