import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  signatureToken: string;
  otpCode: string;
}

// Simple SHA-256 hex helper (Deno crypto)
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signatureToken, otpCode }: VerifyOTPRequest = await req.json();

    console.log('[verify-otp] Verifying OTP for token:', signatureToken);

    if (!otpCode || otpCode.length !== 6) {
      throw new Error('Código OTP inválido');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get signature record
    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .select('*')
      .eq('signature_token', signatureToken)
      .single();

    if (sigError || !signature) {
      console.error('[verify-otp] Signature not found:', sigError);
      throw new Error('Token de firma no encontrado');
    }

    // Check if already verified
    if (signature.status !== 'pending') {
      throw new Error('Esta firma ya ha sido procesada');
    }

    // Get the most recent unverified OTP for this signature
    const { data: otpRecords, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('signature_id', signature.id)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpRecords || otpRecords.length === 0) {
      console.error('[verify-otp] No valid OTP found:', otpError);
      throw new Error('No se encontró un código válido. Por favor solicita uno nuevo.');
    }

    const otpRecord = otpRecords[0];

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      throw new Error('Has excedido el número máximo de intentos. Solicita un nuevo código.');
    }

    // Verify OTP hash (same scheme as send-otp)
    const expectedHash = await sha256Hex(`${otpCode}:${signature.id}`);
    const isValid = expectedHash === otpRecord.otp_code_hash;

    if (!isValid) {
      // Increment attempts
      await supabase
        .from('otp_verifications')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remainingAttempts = 3 - (otpRecord.attempts + 1);
      throw new Error(
        `Código incorrecto. Te quedan ${remainingAttempts} intento(s).`
      );
    }

    console.log('[verify-otp] OTP verified successfully');

    // Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ 
        verified: true,
        attempts: otpRecord.attempts + 1 
      })
      .eq('id', otpRecord.id);

    // Update signature status to otp_verified
    const { error: updateError } = await supabase
      .from('contract_signatures')
      .update({
        status: 'otp_verified',
        otp_verified_at: new Date().toISOString()
      })
      .eq('id', signature.id);

    if (updateError) {
      console.error('[verify-otp] Error updating signature:', updateError);
      throw new Error('Error al actualizar estado de firma');
    }

    return new Response(
      JSON.stringify({ 
        verified: true, 
        message: 'Código verificado exitosamente',
        signatureId: signature.id
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[verify-otp] Error:', error);
    return new Response(
      JSON.stringify({ 
        verified: false,
        error: error.message || 'Error al verificar código' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
