import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface Contract {
  id: string;
  contract_number: string;
  credit_amount: number;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  status: string;
  created_at: string;
  signed_at: string | null;
  blockchain_tx_hash: string | null;
  application_id: string;
  credit_applications?: {
    client_name: string;
    client_email: string;
    risk_score: number;
  };
}

interface ContractListProps {
  onSelectContract: (contractId: string, applicationId: string) => void;
}

export default function ContractList({ onSelectContract }: ContractListProps) {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "signed">("all");

  useEffect(() => {
    loadContracts();
  }, [user]);

  const loadContracts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id,
          contract_number,
          credit_amount,
          term_months,
          interest_rate,
          monthly_payment,
          status,
          created_at,
          signed_at,
          blockchain_tx_hash,
          application_id,
          credit_applications!contracts_application_id_fkey (
            client_name,
            client_email,
            risk_score
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContracts(data as any || []);
    } catch (error: any) {
      console.error("Error loading contracts:", error);
      toast.error("Error al cargar los contratos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (contract: Contract) => {
    if (contract.blockchain_tx_hash && contract.signed_at) {
      return (
        <Badge className="bg-secondary/20 text-secondary border-secondary/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Firmado
        </Badge>
      );
    }
    
    if (contract.status === "sent_for_signature") {
      return (
        <Badge variant="outline" className="border-primary/30 text-primary">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente Firma
        </Badge>
      );
    }

    return (
      <Badge variant="outline">
        <FileText className="w-3 h-3 mr-1" />
        Borrador
      </Badge>
    );
  };

  const filteredContracts = contracts.filter((contract) => {
    if (filter === "signed") {
      return contract.blockchain_tx_hash && contract.signed_at;
    }
    if (filter === "pending") {
      // Only show contracts sent for signature that haven't been signed on blockchain yet
      return contract.status === "sent_for_signature" && !contract.blockchain_tx_hash;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display">Contratos</h2>
          <p className="text-body text-muted-foreground">
            Gestiona y revisa todos tus contratos de crédito
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
          >
            Todos ({contracts.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
            size="sm"
          >
            Pendientes ({contracts.filter(c => !c.blockchain_tx_hash && c.status === "sent_for_signature").length})
          </Button>
          <Button
            variant={filter === "signed" ? "default" : "outline"}
            onClick={() => setFilter("signed")}
            size="sm"
          >
            Firmados ({contracts.filter(c => c.blockchain_tx_hash && c.signed_at).length})
          </Button>
        </div>
      </div>

      {/* Contract List */}
      {filteredContracts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-heading mb-2">No hay contratos</h3>
          <p className="text-body text-muted-foreground">
            {filter === "all" 
              ? "Aún no tienes contratos creados."
              : `No hay contratos ${filter === "signed" ? "firmados" : "pendientes"}.`
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                {/* Contract Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-heading font-semibold">
                      {contract.contract_number}
                    </h3>
                    {getStatusBadge(contract)}
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-caption text-muted-foreground">Monto</p>
                        <p className="text-body font-semibold">
                          ${contract.credit_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-caption text-muted-foreground">Plazo</p>
                        <p className="text-body font-semibold">
                          {contract.term_months} meses
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-caption text-muted-foreground">Tasa</p>
                        <p className="text-body font-semibold">
                          {contract.interest_rate}% APR
                        </p>
                      </div>
                    </div>

                    {contract.credit_applications?.risk_score && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-caption text-muted-foreground">Risk Score</p>
                          <p className="text-body font-semibold text-secondary">
                            {contract.credit_applications.risk_score}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {contract.credit_applications && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Cliente:</span>{" "}
                        <span className="font-medium">{contract.credit_applications.client_name}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contract.credit_applications.client_email}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-caption text-muted-foreground">
                    <span>Creado: {format(new Date(contract.created_at), "dd/MM/yyyy")}</span>
                    {contract.signed_at && (
                      <span>Firmado: {format(new Date(contract.signed_at), "dd/MM/yyyy")}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => onSelectContract(contract.id, contract.application_id)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalle
                  </Button>

                  {contract.blockchain_tx_hash && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      En Blockchain
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
