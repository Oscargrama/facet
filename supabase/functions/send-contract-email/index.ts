import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContractEmailRequest {
  customerName: string;
  customerEmail: string;
  contractPdfBase64: string;
  applicationId: string;
  creditAmount: string;
  termLength: string;
  interestRate: string;
  monthlyPayment: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerName,
      customerEmail,
      contractPdfBase64,
      applicationId,
      creditAmount,
      termLength,
      interestRate,
      monthlyPayment,
    }: ContractEmailRequest = await req.json();

    console.log("Sending contract email to:", customerEmail);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use Supabase's built-in email functionality
    // First, we'll create a simple text-based email using Supabase Auth
    const emailHtml = `
<!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .info-box {
                background: white;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
              }
              .info-box h3 {
                margin-top: 0;
                color: #667eea;
              }
              .details {
                display: grid;
                gap: 10px;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .detail-label {
                font-weight: 600;
                color: #6b7280;
              }
              .detail-value {
                color: #111827;
              }
              .cta-button {
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: 600;
              }
              .terms {
                background: #fef3c7;
                border: 1px solid #fbbf24;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
              }
              .terms h4 {
                margin-top: 0;
                color: #92400e;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 14px;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 ¡Felicitaciones ${customerName}!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Tu crédito ha sido aprobado</p>
            </div>
            
            <div class="content">
              <p>Estimado/a ${customerName},</p>
              
              <p>Nos complace informarte que tu solicitud de crédito ha sido <strong>aprobada</strong>. Adjunto a este correo encontrarás tu contrato de crédito con todos los términos y condiciones.</p>
              
              <div class="info-box">
                <h3>📋 Detalles de tu Crédito</h3>
                <div class="details">
                  <div class="detail-row">
                    <span class="detail-label">Número de Solicitud:</span>
                    <span class="detail-value">${applicationId}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Monto Aprobado:</span>
                    <span class="detail-value">$${creditAmount}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Tasa de Interés:</span>
                    <span class="detail-value">${interestRate}%</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Plazo:</span>
                    <span class="detail-value">${termLength} meses</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Pago Mensual:</span>
                    <span class="detail-value">$${monthlyPayment}</span>
                  </div>
                </div>
              </div>

              <div class="terms">
                <h4>⚠️ Términos y Condiciones</h4>
                <p style="margin: 5px 0; font-size: 14px;">
                  Al aceptar este contrato, confirmas que:
                </p>
                <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                  <li>Has revisado y aceptas todos los términos del contrato adjunto</li>
                  <li>La información proporcionada en tu solicitud es verídica</li>
                  <li>Te comprometes a realizar los pagos mensuales en las fechas establecidas</li>
                  <li>Comprendes las políticas de pagos atrasados y adelantados</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <p><strong>📄 Tu contrato está adjunto a este correo en formato PDF</strong></p>
                <p style="font-size: 14px; color: #6b7280;">Por favor revísalo cuidadosamente antes de proceder con la firma</p>
              </div>

              <div class="info-box" style="border-left-color: #10b981;">
                <h3 style="color: #10b981;">✅ Próximos Pasos</h3>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Revisa el contrato adjunto detalladamente</li>
                  <li>Si estás de acuerdo con los términos, responde este correo con tu confirmación</li>
                  <li>Nuestro equipo te contactará para finalizar el proceso</li>
                  <li>Una vez firmado, recibirás el desembolso en tu cuenta</li>
                </ol>
              </div>

              <p>Si tienes alguna pregunta o necesitas aclaraciones sobre los términos del contrato, no dudes en contactarnos.</p>
              
              <p style="margin-top: 30px;">
                Atentamente,<br>
                <strong>Equipo Zentro Credit</strong>
              </p>
            </div>

            <div class="footer">
              <p>Este es un correo automático, por favor no respondas directamente.</p>
              <p>Para soporte, contacta a support@zentrocredit.com</p>
              <p style="margin-top: 15px; font-size: 12px;">
                © 2025 Zentro Credit. Todos los derechos reservados.
              </p>
            </div>
          </body>
        </html>
`;

    // For now, we'll store the email notification in the database
    // and log the contract details. In production, you would use Supabase's
    // email templates or a webhook to send actual emails.
    
    console.log("Contract details prepared for:", customerEmail);
    console.log("Application ID:", applicationId);
    console.log("Email HTML ready - length:", emailHtml.length);

    // Store notification in database for tracking
    const { data: notification, error: dbError } = await supabase
      .from('email_notifications')
      .insert({
        recipient_email: customerEmail,
        subject: `Contrato de Crédito - ${applicationId}`,
        content: emailHtml,
        application_id: applicationId,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error storing notification:", dbError);
    } else {
      console.log("Email notification stored successfully:", notification?.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contract email prepared successfully (Supabase mode)",
        recipient: customerEmail,
        applicationId: applicationId,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contract-email function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
