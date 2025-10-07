import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  Loader2,
  History as HistoryIcon
} from "lucide-react";

interface Application {
  id: string;
  application_number: string;
  client_name: string;
  credit_amount: number;
  status: string;
  risk_score: number | null;
  submitted_at: string;
  term_months: number;
  monthly_income: number;
  monthly_debt_payment: number;
  credit_history_score: number;
  years_in_employment: number;
  purpose: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalValue: 0,
  });
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Load applications
        const { data: apps, error } = await supabase
          .from('credit_applications')
          .select('*')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setApplications(apps || []);

        // Load contracts pending signature
        const { data: contractsData, error: contractsError } = await supabase
          .from('contracts')
          .select(`
            *,
            contract_signatures (
              status,
              created_at,
              expires_at
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'sent_for_signature')
          .order('created_at', { ascending: false });

        if (contractsError) {
          console.error('Error loading contracts:', contractsError);
        } else {
          setContracts(contractsData || []);
        }

        // Calculate stats
        const total = apps?.length || 0;
        const approved = apps?.filter(a => a.status === 'approved').length || 0;
        const pending = apps?.filter(a => a.status === 'pending' || a.status === 'under_review').length || 0;
        const totalValue = apps?.reduce((sum, app) => sum + (app.credit_amount || 0), 0) || 0;

        setStats({
          total,
          approved,
          pending,
          totalValue,
        });
      } catch (error: any) {
        console.error('Error loading dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: "bg-secondary/10 text-secondary border border-secondary/20",
      pending: "bg-amber-50 text-amber-700 border border-amber-200",
      under_review: "bg-blue-50 text-blue-700 border border-blue-200",
      rejected: "bg-destructive/10 text-destructive border border-destructive/20",
      cancelled: "bg-muted text-muted-foreground border border-border",
    };

    const labels = {
      approved: "Aprobado",
      pending: "Pendiente",
      under_review: "En Revisión",
      rejected: "Rechazado",
      cancelled: "Cancelado",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getRiskBadge = (score: number | null) => {
    if (!score) return <span className="text-muted-foreground">-</span>;
    
    if (score >= 700) {
      return <span className="text-secondary font-medium">Bajo</span>;
    } else if (score >= 600) {
      return <span className="text-amber-600 font-medium">Medio</span>;
    } else {
      return <span className="text-destructive font-medium">Alto</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-professional py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Mis Solicitudes",
      value: stats.total.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: CreditCard,
      description: "Total de solicitudes"
    },
    {
      title: "Créditos Aprobados",
      value: stats.approved.toString(),
      change: "",
      changeType: "positive" as const,
      icon: CheckCircle,
      description: "Solicitudes aprobadas"
    },
    {
      title: "En Proceso",
      value: stats.pending.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: Clock,
      description: "Pendientes y en revisión"
    },
    {
      title: "Valor Total",
      value: `$${(stats.totalValue / 1_000_000).toFixed(1)}M`,
      change: "",
      changeType: "positive" as const,
      icon: DollarSign,
      description: "Monto total solicitado"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-display">Dashboard</h1>
            <p className="text-body text-muted-foreground mt-1">
              Resumen de tus solicitudes de crédito
            </p>
          </div>
          <Link to="/credit-application">
            <Button className="btn-primary mt-4 md:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Contracts Pending Signature */}
        {contracts.length > 0 && (
          <div className="card-professional p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-heading">Contratos Pendientes de Firma</h2>
                <p className="text-caption text-muted-foreground mt-1">
                  Contratos enviados esperando firma digital
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {contracts.map((contract) => {
                const signature = contract.contract_signatures?.[0];
                const expiresAt = signature?.expires_at ? new Date(signature.expires_at) : null;
                const isExpired = expiresAt ? expiresAt < new Date() : false;
                
                return (
                  <div key={contract.id} className="bg-muted/30 border border-border rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono text-sm font-semibold">{contract.contract_number}</span>
                          {isExpired ? (
                            <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                              Expirado
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                              Pendiente de Firma
                            </span>
                          )}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Monto</p>
                            <p className="font-semibold">${contract.credit_amount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Plazo</p>
                            <p className="font-semibold">{contract.term_months} meses</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Enviado</p>
                            <p className="font-semibold">
                              {signature?.created_at ? new Date(signature.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        {expiresAt && !isExpired && (
                          <p className="text-caption text-muted-foreground mt-2">
                            ⏰ Expira: {expiresAt.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex md:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/contract-review', {
                            state: { contractId: contract.id }
                          })}
                        >
                          <Eye className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Ver Detalles</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Applications */}
        <div className="card-professional p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading">Solicitudes Recientes</h2>
            <div className="flex gap-2">
              <Link to="/payment-history">
                <Button variant="outline" size="sm">
                  <HistoryIcon className="w-4 h-4 mr-2" />
                  Historial de Pagos
                </Button>
              </Link>
              <Link to="/credit-application">
                <Button variant="outline" size="sm">
                  Ver Todas
                </Button>
              </Link>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay solicitudes</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera solicitud de crédito
              </p>
              <Link to="/credit-application">
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      Monto
                    </th>
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      Riesgo
                    </th>
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      Fecha
                    </th>
                    <th className="text-left py-3 px-4 text-caption font-semibold text-muted-foreground">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm">{app.application_number}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-medium">{app.client_name}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-foreground">
                          ${app.credit_amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="py-4 px-4">
                        {getRiskBadge(app.risk_score)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-caption">
                            {new Date(app.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate('/risk-assessment', {
                            state: {
                              applicationId: app.id,
                              applicationData: {
                                creditAmount: app.credit_amount,
                                termMonths: app.term_months,
                                monthlyIncome: app.monthly_income,
                                monthlyDebtPayment: app.monthly_debt_payment,
                                creditHistoryScore: app.credit_history_score,
                                yearsInEmployment: app.years_in_employment,
                                purpose: app.purpose
                              }
                            }
                          })}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
