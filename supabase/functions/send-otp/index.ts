import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  signatureToken: string;
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signatureToken, phoneNumber }: SendOTPRequest = await req.json();

    console.log('[send-otp] Request received for token:', signatureToken);

    // Validate phone number format (simple E.164 check)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s()-]/g, ''))) {
      throw new Error('Formato de teléfono inválido. Use formato internacional (ej: +1234567890)');
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify signature token exists and is valid
    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .select('*, contracts(*)')
      .eq('signature_token', signatureToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sigError || !signature) {
      console.error('[send-otp] Invalid or expired signature token:', sigError);
      throw new Error('Token de firma inválido o expirado');
    }

    if (signature.status !== 'pending') {
      throw new Error('Esta firma ya ha sido procesada');
    }

    // Rate limiting: check recent OTPs for this phone (max 3 in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOTPs } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone_or_email', phoneNumber)
      .gte('created_at', oneHourAgo);

    if (recentOTPs && recentOTPs.length >= 3) {
      throw new Error('Has excedido el límite de intentos. Por favor intenta en una hora.');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[send-otp] Generated OTP:', otpCode.substring(0, 2) + '****');

    // Hash the OTP
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otpCode, salt);

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const { error: otpInsertError } = await supabase
      .from('otp_verifications')
      .insert({
        signature_id: signature.id,
        phone_or_email: phoneNumber,
        otp_code_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      });

    if (otpInsertError) {
      console.error('[send-otp] Error storing OTP:', otpInsertError);
      throw new Error('Error al generar código de verificación');
    }

    // Send SMS via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = '+18449961879'; // Twilio number

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    
    const messageBody = `Tu código de verificación Zentro es: ${otpCode}. Válido por 5 minutos. No compartas este código.`;

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phoneNumber,
        From: twilioPhoneNumber,
        Body: messageBody,
      }),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('[send-otp] Twilio error:', errorText);
      throw new Error('Error al enviar SMS. Verifica el número de teléfono.');
    }

    const twilioData = await twilioResponse.json();
    console.log('[send-otp] SMS sent successfully. SID:', twilioData.sid);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado exitosamente',
        expiresAt: expiresAt.toISOString()
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('[send-otp] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error al enviar código de verificación' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
