import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  signatureToken: string;
  phoneNumber: string;
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
    const { signatureToken, phoneNumber }: SendOTPRequest = await req.json();

    console.log('[send-otp] Request received for token:', signatureToken);

    // Normalize and validate phone number (E.164)
    const normalizedPhone = phoneNumber.replace(/[\s()-]/g, '');
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Formato de teléfono inválido. Use formato internacional (ej: +57 3001234567)',
          code: 'INVALID_PHONE'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify signature token exists and is valid
    const { data: signature, error: sigError } = await supabase
      .from('contract_signatures')
      .select('id,status,expires_at,client_email')
      .eq('signature_token', signatureToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sigError || !signature) {
      console.error('[send-otp] Invalid or expired signature token:', sigError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token de firma inválido o expirado',
          code: 'INVALID_TOKEN'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if this is demo mode
    const isDemo = signature.client_email === 'demo@zentrocredit.com';

    if (signature.status !== 'pending') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Esta firma ya ha sido procesada',
          code: 'ALREADY_PROCESSED'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Rate limiting: check recent OTPs for this phone (max 3 in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOTPs } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone_or_email', normalizedPhone)
      .gte('created_at', oneHourAgo);

    if (recentOTPs && recentOTPs.length >= 3) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Has excedido el límite de intentos. Por favor intenta en una hora.',
          code: 'RATE_LIMIT'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate 6-digit OTP (hardcoded for demo mode)
    const otpCode = isDemo ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[send-otp] Generated OTP:', otpCode.substring(0, 2) + '****');

    // Hash the OTP deterministically with signature.id as salt (no bcrypt)
    const otpHash = await sha256Hex(`${otpCode}:${signature.id}`);

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const { error: otpInsertError } = await supabase
      .from('otp_verifications')
      .insert({
        signature_id: signature.id,
        phone_or_email: normalizedPhone,
        otp_code_hash: otpHash,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      });

    if (otpInsertError) {
      console.error('[send-otp] Error storing OTP:', otpInsertError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al generar código de verificación',
          code: 'DB_ERROR'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if demo mode or test mode is enabled
    if (isDemo) {
      console.log('[send-otp] 🎭 DEMO MODE: OTP not sent via SMS. OTP:', otpCode);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Código generado (modo demo)',
          expiresAt: expiresAt.toISOString(),
          testOtp: otpCode,
          demoMode: true
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const testMode = Deno.env.get('OTP_TEST_MODE') === 'true';

    if (testMode) {
      // Test mode: skip Twilio, just store OTP and return
      console.log('[send-otp] TEST MODE: OTP =', otpCode);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Código enviado exitosamente (modo test)',
          expiresAt: expiresAt.toISOString(),
          testOtp: otpCode // Include OTP in response for testing
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Production mode: Send SMS via Twilio
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER') || '+18449961879';

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('[send-otp] Twilio credentials not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Servicio de SMS no configurado. Contacta al administrador.',
          code: 'CONFIG_ERROR'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const messageBody = `Tu código de verificación Zentro es: ${otpCode}. Válido por 5 minutos. No compartas este código.`;

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        From: twilioFromNumber,
        Body: messageBody,
      }),
    });

    if (!twilioResponse.ok) {
      const errorText = await twilioResponse.text();
      console.error('[send-otp] Twilio error:', errorText);
      
      // Parse Twilio error code
      let errorMessage = 'Error al enviar SMS. Por favor intenta nuevamente.';
      let errorCode = 'TWILIO_ERROR';
      let shouldFallbackToDemo = false;
      
      try {
        const errorJson = JSON.parse(errorText);
        const twilioErrorCode = errorJson.code;
        
        // Map Twilio errors to user-friendly messages
        switch (twilioErrorCode) {
          case 21608:  // Unverified number on Trial account
            console.log('[send-otp] 🎭 Twilio Trial error 21608 detected, falling back to DEMO MODE');
            shouldFallbackToDemo = true;
            break;
          case 21614:  // Trial account restriction
            console.log('[send-otp] 🎭 Twilio Trial error 21614 detected, falling back to DEMO MODE');
            shouldFallbackToDemo = true;
            break;
          case 21408:
            errorMessage = 'Tu cuenta Twilio no tiene permisos para enviar SMS a este país. Activa Geo Permissions en Twilio Console.';
            errorCode = 'TWILIO_21408';
            break;
          case 21659:
            errorMessage = 'El número Twilio configurado no es válido. Contacta al administrador.';
            errorCode = 'TWILIO_21659';
            break;
          case 21211:
            errorMessage = 'El número de teléfono no es válido. Verifica el formato.';
            errorCode = 'TWILIO_21211';
            break;
          default:
            errorMessage = `Error de Twilio (${twilioErrorCode}): ${errorJson.message || 'Error desconocido'}`;
            errorCode = `TWILIO_${twilioErrorCode}`;
        }
      } catch (e) {
        console.error('[send-otp] Could not parse Twilio error:', e);
      }
      
      // If Trial account error, activate demo mode (DON'T delete OTP)
      if (shouldFallbackToDemo) {
        console.log('[send-otp] 🎭 DEMO MODE ACTIVATED: OTP =', otpCode);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '🎭 Modo Demo: SMS no disponible. Código mostrado en pantalla.',
            expiresAt: expiresAt.toISOString(),
            testOtp: otpCode,
            demoMode: true,
            reason: 'twilio_trial_restriction'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Only delete OTP if it's a real error (not Trial)
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('signature_id', signature.id)
        .eq('verified', false);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          code: errorCode
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
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
        success: false,
        error: error.message || 'Error al enviar código de verificación',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
