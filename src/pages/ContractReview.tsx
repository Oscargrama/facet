import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
import ContractTimeline, { TimelineStep } from "@/components/ContractTimeline";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { IPFSUploader } from "@/services/IPFSUploader";
import { CreditRegistryService } from "@/services/CreditRegistryService";
import { generateContractPDF, blobToFile } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  Edit,
  Send,
  Eye,
  Calendar,
  DollarSign,
  User,
  Shield,
  Wallet,
  Link2,
  Upload,
  Loader2
} from "lucide-react";

export default function ContractReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const applicationId = location.state?.applicationId || "APP-123456";
  const applicationData = location.state?.applicationData;
  const riskScore = location.state?.riskScore || 720;
  
  // Real data from database
  const [realApplicationData, setRealApplicationData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [contractTerms, setContractTerms] = useState({
    interestRate: "8.5",
    termLength: "24",
    monthlyPayment: "",
    lateFeesPolicy: "5% of monthly payment or $25, whichever is greater",
    earlyPaymentPolicy: "No penalty for early payment",
    additionalTerms: ""
  });
  
  const [isApproved, setIsApproved] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Web3 states
  const wallet = usePolkadotWallet();
  const [contractSigned, setContractSigned] = useState(false);
  const [ipfsCID, setIpfsCID] = useState<string | null>(null);
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<"idle" | "signing" | "uploading" | "anchoring" | "completed">("idle");

  // Load real data from database
  useEffect(() => {
    const loadRealData = async () => {
      if (!user) {
        setIsLoadingData(false);
        return;
      }

      try {
        // Load user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profile);

        // Load application data if we have an applicationId
        if (applicationId && applicationId !== "APP-123456") {
          const { data: application, error: appError } = await supabase
            .from('credit_applications')
            .select('*')
            .eq('application_number', applicationId)
            .single();

          if (appError) throw appError;
          setRealApplicationData(application);
          
          // Update contract terms based on real data
          if (application) {
            setContractTerms(prev => ({
              ...prev,
              termLength: application.term_months?.toString() || prev.termLength,
            }));
          }
        }
      } catch (error: any) {
        console.error('Error loading real data:', error);
        toast.error("Error al cargar los datos de la aplicación");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadRealData();
  }, [user, applicationId]);

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const creditAmount = realApplicationData?.credit_amount || applicationData?.creditAmount;
    if (creditAmount && contractTerms.interestRate && contractTerms.termLength) {
      const principal = parseFloat(creditAmount);
      const monthlyRate = parseFloat(contractTerms.interestRate) / 100 / 12;
      const numPayments = parseInt(contractTerms.termLength);
      
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                           (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      return Math.round(monthlyPayment);
    }
    return 0;
  };

  const monthlyPayment = calculateMonthlyPayment();

  // Get real customer data
  const getCustomerData = () => {
    return {
      name: userProfile?.full_name || applicationData?.customerName || "Cliente",
      email: userProfile?.email || applicationData?.customerEmail || user?.email || "",
      phone: userProfile?.phone || applicationData?.customerPhone || "N/A",
      creditAmount: realApplicationData?.credit_amount || applicationData?.creditAmount || 0,
    };
  };

  const customerData = getCustomerData();

  const handleSignContract = async () => {
    if (!wallet.isConnected) {
      toast.error("Por favor conecta tu wallet primero");
      return;
    }

    setIsProcessing(true);
    setProcessStep("signing");

    try {
      // Generate contract content with real data
      const contractData = {
        applicationId,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        creditAmount: parseFloat(customerData.creditAmount).toLocaleString(),
        interestRate: contractTerms.interestRate,
        termLength: contractTerms.termLength,
        monthlyPayment: monthlyPayment.toLocaleString(),
        lateFeesPolicy: contractTerms.lateFeesPolicy,
        earlyPaymentPolicy: contractTerms.earlyPaymentPolicy
      };

      const contractText = generateContractPDF(contractData);
      
      // Generate hash
      const pdfHash = CreditRegistryService.generatePDFHash(contractText);
      
      // Sign the hash
      const signature = await wallet.signMessage(pdfHash);
      
      setContractSigned(true);
      toast.success("Contrato firmado exitosamente");
      
      // Upload to IPFS
      setProcessStep("uploading");
      const contractFile = blobToFile(new Blob([contractText]), `contract-${applicationId}.txt`);
      
      // Using mock upload for demo - replace with real IPFS in production
      const ipfsResult = await IPFSUploader.mockUpload(contractFile);
      setIpfsCID(ipfsResult.cid);
      toast.success("Contrato subido a IPFS");
      
      // Register on blockchain
      setProcessStep("anchoring");
      if (wallet.signer) {
        const registryService = new CreditRegistryService(wallet.signer);
        const txResult = await registryService.registerCredit(ipfsResult.cid, pdfHash);
        
        setBlockchainTxHash(txResult.txHash);
        setBlockNumber(txResult.blockNumber);
        setExplorerUrl(txResult.explorerUrl);
        
        toast.success("Contrato registrado en blockchain");
      }
      
      setProcessStep("completed");
      setIsApproved(true);
      
    } catch (error: any) {
      console.error("Error in contract flow:", error);
      toast.error(error.message || "Error al procesar contrato");
      setProcessStep("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendContract = async () => {
    setIsSending(true);
    
    try {
      // Generate PDF contract
      const contractData = {
        applicationId,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        creditAmount: parseFloat(customerData.creditAmount).toLocaleString(),
        interestRate: contractTerms.interestRate,
        termLength: contractTerms.termLength,
        monthlyPayment: monthlyPayment.toLocaleString(),
        lateFeesPolicy: contractTerms.lateFeesPolicy,
        earlyPaymentPolicy: contractTerms.earlyPaymentPolicy,
        additionalTerms: contractTerms.additionalTerms,
        approvalDate: new Date().toLocaleDateString(),
        firstPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        contractNumber: `CONTRACT-${applicationId}`,
        ipfsCID: ipfsCID || "Pending blockchain registration",
        blockchainTxHash: blockchainTxHash || "Pending blockchain registration"
      };

      toast.info("Generando contrato PDF...");
      const contractText = generateContractPDF(contractData);
      
      // Convert text to base64
      const base64 = btoa(unescape(encodeURIComponent(contractText)));

      toast.info("Enviando correo al cliente...");

      // Call edge function to send email with real data
      const { data, error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          contractPdfBase64: base64,
          applicationId,
          creditAmount: parseFloat(customerData.creditAmount).toLocaleString(),
          termLength: contractTerms.termLength,
          interestRate: contractTerms.interestRate,
          monthlyPayment: monthlyPayment.toLocaleString(),
        }
      });

      if (error) {
        throw new Error(error.message || "Error al enviar el correo");
      }

      toast.success("¡Contrato enviado exitosamente al cliente!");
      
      console.log("Contract email sent:", data);
      
      navigate("/", { 
        state: { 
          message: `Contrato preparado y guardado para ${customerData.email}. El email con el contrato y términos está listo para ser enviado una vez que configures el dominio de correo.`,
          type: "success"
        }
      });
    } catch (error: any) {
      console.error("Error sending contract:", error);
      toast.error(error.message || "Error al enviar el contrato");
    } finally {
      setIsSending(false);
    }
  };

  // Timeline steps for Web3 process
  const getTimelineSteps = (): TimelineStep[] => {
    return [
      {
        id: "sign",
        label: "Firmar Contrato",
        status: contractSigned ? "completed" : processStep === "signing" ? "current" : "pending",
        timestamp: contractSigned ? new Date().toLocaleTimeString() : undefined,
        details: contractSigned ? "Contrato firmado digitalmente" : "Firma el hash del contrato con tu wallet"
      },
      {
        id: "ipfs",
        label: "Subir a IPFS",
        status: ipfsCID ? "completed" : processStep === "uploading" ? "current" : "pending",
        timestamp: ipfsCID ? new Date().toLocaleTimeString() : undefined,
        details: ipfsCID ? `CID: ${ipfsCID.substring(0, 20)}...` : "Almacenamiento descentralizado"
      },
      {
        id: "blockchain",
        label: "Anclar en Blockchain",
        status: blockchainTxHash ? "completed" : processStep === "anchoring" ? "current" : "pending",
        timestamp: blockchainTxHash ? new Date().toLocaleTimeString() : undefined,
        details: blockchainTxHash ? `Block: ${blockNumber}` : "Registro inmutable en Polkadot"
      },
      {
        id: "verify",
        label: "Verificación Completa",
        status: processStep === "completed" ? "completed" : "pending",
        timestamp: processStep === "completed" ? new Date().toLocaleTimeString() : undefined,
        details: processStep === "completed" ? "Contrato verificado y almacenado" : "Validación final"
      }
    ];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link to="/risk-assessment">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-display">Digital Contract</h1>
                <p className="text-body text-muted-foreground">
                  Review and finalize contract terms for {applicationData?.customerName || "Customer"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!wallet.isConnected ? (
                <Button onClick={wallet.connectWallet} disabled={wallet.isConnecting}>
                  <Wallet className="w-4 h-4 mr-2" />
                  {wallet.isConnecting ? "Conectando..." : "Conectar Wallet"}
                </Button>
              ) : (
                <div className="flex items-center space-x-2 px-3 py-2 bg-secondary/10 rounded-lg">
                  <Wallet className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-mono">
                    {wallet.address?.substring(0, 6)}...{wallet.address?.substring(38)}
                  </span>
                </div>
              )}
              
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Ver Modo" : "Editar Términos"}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contract Content */}
            <div className="lg:col-span-2">
              <div className="card-professional p-8">
                {/* Contract Header */}
                <div className="text-center mb-8 pb-6 border-b border-border">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Credit Agreement</h2>
                  <p className="text-body text-muted-foreground">
                    Contract ID: {applicationId}-CONTRACT
                  </p>
                  <p className="text-caption text-muted-foreground">
                    Generated on {new Date().toLocaleDateString()}
                  </p>
                </div>

                {/* Parties */}
                <div className="mb-8">
                  <h3 className="text-heading mb-4">Parties</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Lender</h4>
                      <p className="text-body">Zentro Financial Services</p>
                      <p className="text-caption text-muted-foreground">
                        123 Business Ave, Suite 100<br />
                        New York, NY 10001<br />
                        Tax ID: 12-3456789
                      </p>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Borrower</h4>
                      <p className="text-body">{applicationData?.customerName || "John Doe"}</p>
                      <p className="text-caption text-muted-foreground">
                        {applicationData?.customerEmail || "john@example.com"}<br />
                        {applicationData?.customerPhone || "+1 (555) 123-4567"}<br />
                        {applicationData?.customerAddress || "Address on file"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loan Terms */}
                <div className="mb-8">
                  <h3 className="text-heading mb-4">Loan Terms</h3>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="interestRate">Annual Interest Rate (%)</Label>
                          <input
                            id="interestRate"
                            type="number"
                            step="0.1"
                            value={contractTerms.interestRate}
                            onChange={(e) => setContractTerms(prev => ({ ...prev, interestRate: e.target.value }))}
                            className="w-full px-3 py-2 border border-input rounded-md"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="termLength">Term Length (months)</Label>
                          <input
                            id="termLength"
                            type="number"
                            value={contractTerms.termLength}
                            onChange={(e) => setContractTerms(prev => ({ ...prev, termLength: e.target.value }))}
                            className="w-full px-3 py-2 border border-input rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lateFeesPolicy">Late Fees Policy</Label>
                        <Textarea
                          id="lateFeesPolicy"
                          value={contractTerms.lateFeesPolicy}
                          onChange={(e) => setContractTerms(prev => ({ ...prev, lateFeesPolicy: e.target.value }))}
                          className="input-professional"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="earlyPaymentPolicy">Early Payment Policy</Label>
                        <Textarea
                          id="earlyPaymentPolicy"
                          value={contractTerms.earlyPaymentPolicy}
                          onChange={(e) => setContractTerms(prev => ({ ...prev, earlyPaymentPolicy: e.target.value }))}
                          className="input-professional"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="additionalTerms">Additional Terms</Label>
                        <Textarea
                          id="additionalTerms"
                          value={contractTerms.additionalTerms}
                          onChange={(e) => setContractTerms(prev => ({ ...prev, additionalTerms: e.target.value }))}
                          placeholder="Any additional contract terms or conditions"
                          className="input-professional"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-caption text-muted-foreground">Principal Amount</p>
                          <p className="text-xl font-bold text-foreground">
                            ${applicationData?.creditAmount ? parseInt(applicationData.creditAmount).toLocaleString() : "25,000"}
                          </p>
                        </div>
                        <div>
                          <p className="text-caption text-muted-foreground">Interest Rate</p>
                          <p className="text-xl font-bold text-foreground">{contractTerms.interestRate}% APR</p>
                        </div>
                        <div>
                          <p className="text-caption text-muted-foreground">Term Length</p>
                          <p className="text-xl font-bold text-foreground">{contractTerms.termLength} months</p>
                        </div>
                        <div>
                          <p className="text-caption text-muted-foreground">Monthly Payment</p>
                          <p className="text-xl font-bold text-primary">${monthlyPayment.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="font-medium text-foreground mb-1">Late Fees Policy:</p>
                          <p className="text-muted-foreground">{contractTerms.lateFeesPolicy}</p>
                        </div>
                        
                        <div>
                          <p className="font-medium text-foreground mb-1">Early Payment Policy:</p>
                          <p className="text-muted-foreground">{contractTerms.earlyPaymentPolicy}</p>
                        </div>
                        
                        {contractTerms.additionalTerms && (
                          <div>
                            <p className="font-medium text-foreground mb-1">Additional Terms:</p>
                            <p className="text-muted-foreground">{contractTerms.additionalTerms}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Schedule Preview */}
                <div className="mb-8">
                  <h3 className="text-heading mb-4">Payment Schedule Preview</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-caption text-muted-foreground mb-2">
                      <span>Payment #</span>
                      <span>Due Date</span>
                      <span>Amount</span>
                    </div>
                    {[1, 2, 3].map((payment) => {
                      const dueDate = new Date();
                      dueDate.setMonth(dueDate.getMonth() + payment);
                      return (
                        <div key={payment} className="grid grid-cols-3 gap-4 py-2 text-body">
                          <span>{payment}</span>
                          <span>{dueDate.toLocaleDateString()}</span>
                          <span>${monthlyPayment.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <div className="text-caption text-muted-foreground mt-2">
                      ... and {parseInt(contractTerms.termLength) - 3} more payments
                    </div>
                  </div>
                </div>

                {/* Legal Terms */}
                <div className="mb-8">
                  <h3 className="text-heading mb-4">Terms and Conditions</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>1. This agreement constitutes the entire agreement between the parties.</p>
                    <p>2. The borrower agrees to make payments on time as specified in this contract.</p>
                    <p>3. Default occurs when payment is more than 30 days late.</p>
                    <p>4. This agreement is governed by the laws of the state of New York.</p>
                    <p>5. Any disputes will be resolved through binding arbitration.</p>
                  </div>
                </div>

                {/* Web3 Integration Section */}
                {wallet.isConnected && (
                  <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                    <h3 className="text-heading mb-4 flex items-center">
                      <Link2 className="w-5 h-5 mr-2 text-primary" />
                      Blockchain Integration
                    </h3>
                    
                    <ContractTimeline steps={getTimelineSteps()} />
                    
                    {blockchainTxHash && (
                      <div className="mt-6 p-4 bg-background rounded-lg border border-border space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-caption text-muted-foreground">Transaction Hash:</span>
                          <a 
                            href={explorerUrl || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-primary hover:underline break-all text-right ml-4"
                          >
                            {blockchainTxHash.substring(0, 20)}...
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-caption text-muted-foreground">Block Number:</span>
                          <span className="text-sm font-medium">{blockNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-caption text-muted-foreground">IPFS CID:</span>
                          <span className="text-xs font-mono">{ipfsCID?.substring(0, 20)}...</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => window.open(explorerUrl || "#", "_blank")}
                        >
                          Ver en Block Explorer
                        </Button>
                      </div>
                    )}
                    
                    {!contractSigned && (
                      <Button 
                        onClick={handleSignContract}
                        disabled={isProcessing}
                        className="w-full mt-4 btn-primary"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Firmar y Anclar en Blockchain
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Approval Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-start space-x-3 mb-6">
                    <Checkbox
                      id="approve"
                      checked={isApproved}
                      onCheckedChange={(checked) => setIsApproved(!!checked)}
                      disabled={wallet.isConnected && !contractSigned}
                    />
                    <label
                      htmlFor="approve"
                      className="text-body leading-relaxed"
                    >
                      He revisado todos los términos del contrato y apruebo este acuerdo para la firma del cliente.
                      Los términos reflejan con precisión la solicitud de crédito aprobada y cumplen con las políticas de la empresa.
                    </label>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleSendContract}
                      disabled={!isApproved || isSending || (wallet.isConnected && !contractSigned)}
                      className="btn-primary"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar al Cliente
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Guardar Borrador
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Summary */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Application Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{applicationData?.customerName || "John Doe"}</p>
                      <p className="text-caption">{applicationData?.customerEmail || "john@example.com"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        ${applicationData?.creditAmount ? parseInt(applicationData.creditAmount).toLocaleString() : "25,000"}
                      </p>
                      <p className="text-caption">Credit Amount</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-secondary">{riskScore}</p>
                      <p className="text-caption">Risk Score</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{new Date().toLocaleDateString()}</p>
                      <p className="text-caption">Contract Date</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Status */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Contract Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-body">Generated</span>
                    <CheckCircle className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body">Terms Reviewed</span>
                    {isApproved ? (
                      <CheckCircle className="w-5 h-5 text-secondary" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted rounded-full" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body">Sent to Customer</span>
                    <div className="w-5 h-5 border-2 border-muted rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-body">Customer Signed</span>
                    <div className="w-5 h-5 border-2 border-muted rounded-full" />
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-caption">Principal</span>
                    <span className="font-medium">
                      ${applicationData?.creditAmount ? parseInt(applicationData.creditAmount).toLocaleString() : "25,000"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-caption">Total Interest</span>
                    <span className="font-medium">
                      ${(monthlyPayment * parseInt(contractTerms.termLength) - (applicationData?.creditAmount ? parseInt(applicationData.creditAmount) : 25000)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-caption">Monthly Payment</span>
                    <span className="font-medium text-primary">${monthlyPayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <span className="text-caption">Total Amount</span>
                    <span className="font-semibold">
                      ${(monthlyPayment * parseInt(contractTerms.termLength)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}