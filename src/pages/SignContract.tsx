import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { 
  FileText, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { POLKADOT_CONFIG } from "@/config/blockchain";

type SigningStep = "review" | "phone" | "otp" | "blockchain" | "complete";

export default function SignContract() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<SigningStep>("review");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Contract data
  const [signature, setSignature] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  
  // Form states
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpAttempts, setOtpAttempts] = useState(0);
  
  // Blockchain result
  const [blockchainData, setBlockchainData] = useState<any>(null);

  // Load contract data
  useEffect(() => {
    const loadContractData = async () => {
      if (!token) {
        toast.error("Token de firma no proporcionado");
        navigate("/");
        return;
      }

      try {
        console.log('[SignContract] Loading contract with token:', token);
        
        // Call edge function to get signing data (bypasses RLS)
        const response = await supabase.functions.invoke('get-signing-data', {
          body: { token }
        });

        console.log('[SignContract] Full response:', JSON.stringify(response, null, 2));

        // Check for HTTP-level errors
        if (response.error) {
          console.error('[SignContract] HTTP Error:', response.error);
          
          // Try to extract error message from response
          const errorMessage = response.error.message || 
                              (typeof response.error === 'string' ? response.error : null) ||
                              "Error al cargar los datos de firma";
          
          toast.error(errorMessage);
          setIsLoading(false);
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        const data = response.data;

        // Check if data has the expected structure
        if (!data) {
          console.error('[SignContract] No data in response');
          toast.error("No se recibieron datos del servidor");
          setIsLoading(false);
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        // Check if data contains an error (from edge function response body)
        if (data.error) {
          console.error('[SignContract] Error from edge function:', data.error);
          toast.error(data.error);
          setIsLoading(false);
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        console.log('[SignContract] Data structure:', {
          hasSignature: !!data.signature,
          hasContract: !!data.contract,
          dataKeys: Object.keys(data)
        });

        if (!data.signature || !data.contract) {
          console.error('[SignContract] Invalid response structure:', data);
          toast.error("Respuesta inválida del servidor");
          setIsLoading(false);
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        const signatureData = data.signature;
        const contractData = data.contract;
        
        console.log('[SignContract] Loaded signature status:', signatureData.status);

        if (signatureData.status === 'completed') {
          // Already signed, go directly to complete step
          setSignature(signatureData);
          setContract(contractData);
          setBlockchainData({
            txHash: signatureData.blockchain_tx_hash,
            blockNumber: signatureData.block_number,
            explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${signatureData.blockchain_tx_hash}`
          });
          setCurrentStep("complete");
        } else if (signatureData.status === 'otp_verified') {
          // OTP verified, waiting for blockchain
          setSignature(signatureData);
          setContract(contractData);
          setCurrentStep("blockchain");
          startBlockchainPolling(signatureData.id);
        } else {
          setSignature(signatureData);
          setContract(contractData);
          setExpiresAt(new Date(signatureData.expires_at));
          setPhoneNumber(signatureData.client_phone || "");
        }
      } catch (error: any) {
        console.error('[SignContract] Error:', error);
        toast.error("Error al cargar el contrato");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadContractData();
  }, [token, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const distance = expiry - now;

      if (distance < 0) {
        setTimeRemaining("Expirado");
        clearInterval(interval);
        toast.error("El token de firma ha expirado");
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      toast.error("Por favor ingresa tu número de teléfono");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          signatureToken: token,
          phoneNumber: phoneNumber
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Error al enviar código");
      }

      toast.success("Código enviado a tu teléfono");
      setCurrentStep("otp");
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || "Error al enviar código OTP");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error("El código debe tener 6 dígitos");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          signatureToken: token,
          otpCode: otpCode
        }
      });

      if (error) throw error;

      if (!data.verified) {
        setOtpAttempts(prev => prev + 1);
        throw new Error(data.error || "Código incorrecto");
      }

      toast.success("Código verificado exitosamente");
      setCurrentStep("blockchain");
      
      // Start blockchain registration
      await initiateBlockchainRegistration(data.signatureId);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || "Error al verificar código");
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateBlockchainRegistration = async (signatureId: string) => {
    try {
      console.log('[SignContract] Initiating blockchain registration for:', signatureId);
      
      // Call the blockchain registration function
      const { data, error } = await supabase.functions.invoke('register-signature-blockchain', {
        body: { signatureId }
      });

      if (error) {
        console.error('[SignContract] Blockchain error:', error);
        toast.error("Error al iniciar registro blockchain");
        return;
      }

      console.log('[SignContract] Blockchain registration response:', data);

      // If successful, immediately show completion with returned data
      if (data?.success && data.txHash) {
        setBlockchainData({
          txHash: data.txHash,
          blockNumber: data.blockNumber,
          explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${data.txHash}`
        });
        setCurrentStep("complete");
        toast.success("¡Firma registrada en blockchain!");
        
        // Start light polling to confirm database update
        startBlockchainPolling(signatureId, true);
      } else {
        // Fallback: start polling if no immediate data
        console.log('[SignContract] No immediate blockchain data, starting polling');
        startBlockchainPolling(signatureId, false);
      }
    } catch (error: any) {
      console.error('[SignContract] Error initiating blockchain:', error);
      toast.error("Error al registrar en blockchain");
    }
  };

  const startBlockchainPolling = (signatureId: string, lightMode: boolean = false) => {
    const maxAttempts = lightMode ? 20 : 40; // 60s for light mode, 120s for full mode
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        if (!lightMode) {
          toast.error("Tiempo de espera agotado. Por favor contacta soporte.", {
            duration: 5000,
          });
        }
        return;
      }

      try {
        // Use the new edge function to fetch status (bypasses RLS)
        const { data, error } = await supabase.functions.invoke('get-signature-status', {
          body: { signatureId }
        });

        if (error) {
          console.error('[SignContract] Polling error:', error);
          return;
        }

        console.log('[SignContract] Poll result:', data);

        if (data?.status === 'completed') {
          clearInterval(pollInterval);
          
          // Update blockchain data if not in light mode or if data changed
          if (!lightMode || !blockchainData) {
            setBlockchainData({
              txHash: data.blockchain_tx_hash,
              blockNumber: data.block_number,
              explorerUrl: `${POLKADOT_CONFIG.explorerUrl}/tx/${data.blockchain_tx_hash}`
            });
            setCurrentStep("complete");
            toast.success("¡Firma completada exitosamente!");
          }
        }
      } catch (error) {
        console.error('[SignContract] Polling error:', error);
      }
    }, 3000);

    // Cleanup on unmount
    return () => clearInterval(pollInterval);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container-professional max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-display mb-2">Firma de Contrato Digital</h1>
          <p className="text-body text-muted-foreground">
            Firma segura con verificación OTP + Blockchain
          </p>
          {expiresAt && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-caption text-amber-800">
                Tiempo restante: <strong>{timeRemaining}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { id: "review", label: "Revisar", icon: FileText },
              { id: "phone", label: "Teléfono", icon: Smartphone },
              { id: "otp", label: "Verificar", icon: Shield },
              { id: "blockchain", label: "Blockchain", icon: Clock },
              { id: "complete", label: "Completo", icon: CheckCircle }
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = ["review", "phone", "otp", "blockchain", "complete"].indexOf(currentStep) > 
                                  ["review", "phone", "otp", "blockchain", "complete"].indexOf(step.id);
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted ? "bg-secondary text-white" : 
                    isActive ? "bg-primary text-white" : 
                    "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-caption mt-2 ${isActive ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {/* Step 1: Review Contract */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-heading mb-4">Revisión del Contrato</h2>
                <p className="text-body text-muted-foreground">
                  Por favor revisa los términos del contrato antes de proceder con la firma.
                </p>
              </div>

              {!contract ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Cargando detalles del contrato...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Contract Details */}
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Detalles del Contrato</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <p className="text-caption text-muted-foreground">Monto del Crédito</p>
                        <p className="text-heading text-foreground">${contract.credit_amount?.toLocaleString()}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <p className="text-caption text-muted-foreground">Plazo</p>
                        <p className="text-heading text-foreground">{contract.term_months} meses</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <p className="text-caption text-muted-foreground">Tasa de Interés</p>
                        <p className="text-heading text-foreground">{contract.interest_rate}% anual</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-border">
                        <p className="text-caption text-muted-foreground">Pago Mensual</p>
                        <p className="text-heading text-foreground">${contract.monthly_payment?.toLocaleString()}</p>
                      </div>
                    </div>

                    {(contract.pdf_url || contract.ipfs_cid) && (
                      <div className="pt-4 border-t border-border">
                        <a 
                          href={contract.pdf_url || `https://gateway.pinata.cloud/ipfs/${contract.ipfs_cid}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 text-primary hover:underline"
                        >
                          <FileText className="w-4 h-4" />
                          <span>Ver PDF del Contrato Completo</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Important Notice */}
                  <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-amber-900">
                        <strong>Importante:</strong> Al aceptar, estás firmando un contrato legalmente vinculante. 
                        Asegúrate de haber leído y comprendido todos los términos.
                      </p>
                    </div>
                  </div>

                  {/* Terms Acceptance */}
                  <div className="flex items-start space-x-3 p-4 bg-background border border-border rounded-lg">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer flex-1">
                      He leído y acepto los términos y condiciones del contrato. Confirmo que he revisado todos los detalles incluyendo el monto del crédito, plazo, tasa de interés y pago mensual.
                    </Label>
                  </div>
                </div>
              )}

              <Button
                onClick={() => setCurrentStep("phone")}
                disabled={!acceptedTerms || !contract}
                className="w-full btn-primary"
              >
                Proceder a Firmar
              </Button>
            </div>
          )}

          {/* Step 2: Enter Phone Number */}
          {currentStep === "phone" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-heading mb-4">Verificación por SMS</h2>
                <p className="text-body text-muted-foreground">
                  Ingresa tu número de teléfono para recibir un código de verificación.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Número de Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-caption text-muted-foreground mt-2">
                    Usa formato internacional (ej: +525512345678)
                  </p>
                </div>

                <Button
                  onClick={handleSendOTP}
                  disabled={isProcessing || !phoneNumber}
                  className="w-full btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Código"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verify OTP */}
          {currentStep === "otp" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-heading mb-4">Verifica tu Código</h2>
                <p className="text-body text-muted-foreground">
                  Ingresa el código de 6 dígitos que recibiste por SMS
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => setOtpCode(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {otpAttempts > 0 && (
                  <p className="text-caption text-destructive text-center">
                    Intentos fallidos: {otpAttempts}/3
                  </p>
                )}

                <Button
                  onClick={handleVerifyOTP}
                  disabled={isProcessing || otpCode.length !== 6}
                  className="w-full btn-primary"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>

                <button
                  onClick={() => setCurrentStep("phone")}
                  className="w-full text-caption text-primary hover:underline"
                  disabled={isProcessing}
                >
                  Solicitar nuevo código
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Blockchain Registration */}
          {currentStep === "blockchain" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
              </div>
              <div>
                <h2 className="text-heading mb-2">Registrando en Blockchain</h2>
                <p className="text-body text-muted-foreground">
                  Estamos registrando tu firma de forma inmutable en la blockchain de Polkadot.
                  Este proceso puede tomar algunos segundos...
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-secondary" />
                  <span className="text-sm">Código OTP verificado</span>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm">Firmando con wallet corporativa...</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Esperando confirmación de blockchain...</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === "complete" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-secondary" />
                </div>
              </div>
              <div>
                <h2 className="text-heading mb-2">¡Firma Completada Exitosamente!</h2>
                <p className="text-body text-muted-foreground">
                  Tu contrato ha sido firmado y registrado de forma inmutable en la blockchain de Polkadot.
                </p>
              </div>

              {blockchainData && (
                <div className="bg-muted/50 rounded-lg p-6 text-left space-y-3">
                  <div>
                    <p className="text-caption text-muted-foreground">Transaction Hash</p>
                    <p className="text-sm font-mono break-all">{blockchainData.txHash}</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Block Number</p>
                    <p className="text-sm font-mono">{blockchainData.blockNumber}</p>
                  </div>
                  <a
                    href={blockchainData.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-primary hover:underline"
                  >
                    <span className="text-sm">Ver en Block Explorer</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <Button
                onClick={() => navigate("/")}
                className="w-full btn-primary"
              >
                Finalizar
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
