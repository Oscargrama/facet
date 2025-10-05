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
  Loader2
} from "lucide-react";

interface Application {
  id: string;
  application_number: string;
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
  profiles: {
    full_name: string;
  };
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;

      try {
        // Load applications
        const { data: apps, error } = await supabase
          .from('credit_applications')
          .select(`
            *,
            profiles!credit_applications_user_id_fkey (
              full_name
            )
          `)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setApplications(apps || []);

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

        {/* Recent Applications */}
        <div className="card-professional p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-heading">Solicitudes Recientes</h2>
            <Link to="/credit-application">
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </Link>
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
                        <span className="font-medium">{app.profiles?.full_name}</span>
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
