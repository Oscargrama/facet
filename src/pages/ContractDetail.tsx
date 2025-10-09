import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ContractTimeline, { TimelineStep } from "@/components/ContractTimeline";
import { usePolkadotWallet } from "@/hooks/usePolkadotWallet";
import { IPFSUploader } from "@/services/IPFSUploader";
import { CreditRegistryService } from "@/services/CreditRegistryService";
import { generateContractPDF, blobToFile } from "@/utils/pdfGenerator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
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
  Loader2,
  ArrowLeft
} from "lucide-react";

interface ContractDetailProps {
  contractId: string;
  applicationId: string;
  onBack: () => void;
}

export default function ContractDetail({ contractId, applicationId, onBack }: ContractDetailProps) {
  const { user } = useAuth();
  
  // Real data from database
  const [realApplicationData, setRealApplicationData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [riskScore, setRiskScore] = useState(720);
  
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
  const [alreadySigned, setAlreadySigned] = useState(false);

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

        // Load contract data
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', contractId)
          .single();

        if (contractError) {
          console.error('Error loading contract:', contractError);
          toast.error("Error al cargar el contrato");
        } else if (contract) {
          setContractTerms(prev => ({
            ...prev,
            termLength: contract.term_months?.toString() || prev.termLength,
            interestRate: contract.interest_rate?.toString() || prev.interestRate,
          }));

          // Check if contract is already signed and anchored in blockchain
          if (contract.blockchain_tx_hash && contract.signed_at) {
            setAlreadySigned(true);
            setContractSigned(true);
            setBlockchainTxHash(contract.blockchain_tx_hash);
            setBlockNumber(contract.block_number || null);
            setIpfsCID(contract.ipfs_cid || null);
            setProcessStep("completed");
            
            // Build explorer URL from blockchain config
            const EXPLORER_URL = "https://polkadot.js.org/apps/?rpc=wss://paseo-asset-hub-rpc.polkadot.io#/explorer";
            setExplorerUrl(`${EXPLORER_URL}/query/${contract.blockchain_tx_hash}`);
          }
        }

        // Load application data
        const { data: application, error: appError } = await supabase
          .from('credit_applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (appError) {
          console.error('Error loading application:', appError);
        } else {
          setRealApplicationData(application);
          setRiskScore(application.risk_score || 720);
        }
      } catch (error: any) {
        console.error('Error loading real data:', error);
        toast.error("Error al cargar los datos de la aplicación");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadRealData();
  }, [user, contractId, applicationId]);

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const creditAmount = realApplicationData?.credit_amount;
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
      name: userProfile?.full_name || realApplicationData?.client_name || user?.email || "",
      email: userProfile?.email || realApplicationData?.client_email || user?.email || "",
      phone: userProfile?.phone || realApplicationData?.client_phone || "",
      creditAmount: realApplicationData?.credit_amount || 0,
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
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      toast.info("Generando contrato PDF...");

      const firstPaymentDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Generate a temporary contract number for PDF (will be replaced with actual after DB update)
      const tempContractNumber = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
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
        firstPaymentDate: firstPaymentDate.toLocaleDateString(),
        contractNumber: tempContractNumber,
        ipfsCID: "Pending upload",
        blockchainTxHash: "Pending signature"
      };

      const contractText = generateContractPDF(contractData);
      
      // Generate actual contract number
      const contractNumber = `CONTRACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload to IPFS
      toast.info("Subiendo contrato a IPFS...");
      const contractFile = blobToFile(new Blob([contractText]), `contract-${contractNumber}.txt`);
      const ipfsResult = await IPFSUploader.mockUpload(contractFile);
      
      // Generate contract hash
      const pdfHash = CreditRegistryService.generatePDFHash(contractText);

      // Update contract with IPFS CID, hash, and contract number
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          ipfs_cid: ipfsResult.cid,
          contract_hash: pdfHash,
          status: 'sent_for_signature',
          contract_number: contractNumber
        })
        .eq('id', contractId);

      if (updateError) {
        console.error('Error updating contract:', updateError);
        throw new Error('Error al actualizar el contrato: ' + updateError.message);
      }

      // Convert text to base64 for email
      const base64 = btoa(unescape(encodeURIComponent(contractText)));

      toast.info("Enviando correo al cliente...");

      // Call edge function to send email
      const { data, error } = await supabase.functions.invoke('send-contract-email', {
        body: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          customerPhone: customerData.phone,
          contractPdfBase64: base64,
          applicationId: contractId,
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

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-display">Detalle del Contrato</h1>
            <p className="text-body text-muted-foreground">
              Revisión de contrato para {customerData.name}
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
            <h2 className="text-heading mb-4">Términos del Contrato</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="creditAmount">Monto del Crédito</Label>
                  <p className="text-body font-semibold">
                    ${parseInt(customerData.creditAmount).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label htmlFor="interestRate">Tasa de Interés Anual</Label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="interestRate"
                      className="input"
                      value={contractTerms.interestRate}
                      onChange={(e) => setContractTerms({ ...contractTerms, interestRate: e.target.value })}
                    />
                  ) : (
                    <p className="text-body font-semibold">{contractTerms.interestRate}%</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="termLength">Plazo del Crédito (meses)</Label>
                  {isEditing ? (
                    <input
                      type="number"
                      id="termLength"
                      className="input"
                      value={contractTerms.termLength}
                      onChange={(e) => setContractTerms({ ...contractTerms, termLength: e.target.value })}
                    />
                  ) : (
                    <p className="text-body font-semibold">{contractTerms.termLength} meses</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="monthlyPayment">Pago Mensual Estimado</Label>
                  <p className="text-body font-semibold">
                    ${monthlyPayment.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="lateFeesPolicy">Política de Cargos por Pago Atrasado</Label>
                {isEditing ? (
                  <Textarea
                    id="lateFeesPolicy"
                    className="input"
                    value={contractTerms.lateFeesPolicy}
                    onChange={(e) => setContractTerms({ ...contractTerms, lateFeesPolicy: e.target.value })}
                  />
                ) : (
                  <p className="text-body">{contractTerms.lateFeesPolicy}</p>
                )}
              </div>

              <div>
                <Label htmlFor="earlyPaymentPolicy">Política de Pago Anticipado</Label>
                {isEditing ? (
                  <Textarea
                    id="earlyPaymentPolicy"
                    className="input"
                    value={contractTerms.earlyPaymentPolicy}
                    onChange={(e) => setContractTerms({ ...contractTerms, earlyPaymentPolicy: e.target.value })}
                  />
                ) : (
                  <p className="text-body">{contractTerms.earlyPaymentPolicy}</p>
                )}
              </div>

              <div>
                <Label htmlFor="additionalTerms">Términos Adicionales</Label>
                {isEditing ? (
                  <Textarea
                    id="additionalTerms"
                    className="input"
                    value={contractTerms.additionalTerms}
                    onChange={(e) => setContractTerms({ ...contractTerms, additionalTerms: e.target.value })}
                  />
                ) : (
                  <p className="text-body">{contractTerms.additionalTerms}</p>
                )}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-heading mb-4">Calendario de Pagos Estimado</h3>
              <p className="text-muted-foreground">
                Aquí hay un calendario de pagos estimado basado en los términos del contrato.
              </p>

              <div className="overflow-x-auto mt-4">
                <table className="table-auto w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-2">Mes</th>
                      <th className="px-4 py-2">Pago Mensual</th>
                      <th className="px-4 py-2">Interés</th>
                      <th className="px-4 py-2">Principal</th>
                      <th className="px-4 py-2">Saldo Restante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: parseInt(contractTerms.termLength) }).map((_, index) => {
                      const paymentNumber = index + 1;
                      const interestPayment = Math.round((parseFloat(contractTerms.interestRate) / 100 / 12) * realApplicationData?.credit_amount);
                      const principalPayment = monthlyPayment - interestPayment;
                      const remainingBalance = realApplicationData?.credit_amount - principalPayment * paymentNumber;

                      return (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-secondary/5' : ''}`}>
                          <td className="border px-4 py-2">{paymentNumber}</td>
                          <td className="border px-4 py-2">${monthlyPayment.toLocaleString()}</td>
                          <td className="border px-4 py-2">${interestPayment.toLocaleString()}</td>
                          <td className="border px-4 py-2">${principalPayment.toLocaleString()}</td>
                          <td className="border px-4 py-2">${remainingBalance.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Summary */}
          <div className="card-professional p-6">
            <h3 className="text-heading mb-4">Resumen de Aplicación</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{customerData.name}</p>
                  <p className="text-caption">{customerData.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">
                    ${parseInt(customerData.creditAmount).toLocaleString()}
                  </p>
                  <p className="text-caption">Monto del Crédito</p>
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
                  <p className="text-caption">Fecha del Contrato</p>
                </div>
              </div>
            </div>
          </div>

          {/* Web3 Anchoring */}
          <div className="card-professional p-6">
            <h3 className="text-heading mb-4">Anclaje Web3</h3>
            <p className="text-body text-muted-foreground mb-4">
              Firma y ancla el contrato en la blockchain para mayor seguridad y transparencia.
            </p>

            <ContractTimeline steps={getTimelineSteps()} />

            {processStep === "completed" ? (
              <div className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  Contrato anclado exitosamente en la blockchain.
                </p>
                <div className="flex items-center space-x-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <a
                    href={explorerUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Ver en el explorador
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {alreadySigned ? (
                  <div className="flex items-center space-x-2 text-green-500">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-sm font-semibold">Este contrato ya fue firmado.</p>
                  </div>
                ) : (
                  <Button
                    onClick={handleSignContract}
                    variant="secondary"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </div>
                    ) : (
                      "Firmar y Anclar Contrato"
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card-professional p-6">
            <h3 className="text-heading mb-4">Acciones</h3>
            <p className="text-body text-muted-foreground mb-4">
              Opciones para gestionar y compartir el contrato.
            </p>
            <div className="space-y-3">
              <Button variant="outline" disabled={isSending} onClick={handleSendContract}>
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Contrato al Cliente
                  </>
                )}
              </Button>
              <Button variant="secondary">
                <FileText className="w-4 h-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
