import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  FileText
} from "lucide-react";

interface Payment {
  id: string;
  payment_number: number;
  contract_id: string;
  amount_due: number;
  amount_paid: number | null;
  due_date: string;
  paid_at: string | null;
  status: string;
  payment_method: string | null;
  contracts: {
    contract_number: string;
    profiles: {
      full_name: string;
    };
  };
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          contracts!inner(
            contract_number,
            user_id,
            profiles!inner(
              full_name
            )
          )
        `)
        .eq('contracts.user_id', user?.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar el historial de pagos');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.contracts.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.contracts.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return Number(b.amount_due) - Number(a.amount_due);
      case "customer":
        return a.contracts.profiles.full_name.localeCompare(b.contracts.profiles.full_name);
      case "date":
      default:
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    }
  });

  // Calculate statistics from real data
  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
  
  const onTimePayments = payments
    .filter(p => p.status === 'paid' && p.paid_at && p.paid_at <= p.due_date)
    .length;
  
  const onTimeRate = payments.length > 0 
    ? Math.round((onTimePayments / payments.filter(p => p.status === 'paid').length) * 100) || 0
    : 0;
  
  const pendingPayments = payments.filter(p => p.status === 'pending').length;
  
  const averagePayment = payments.length > 0
    ? Math.round(payments.reduce((sum, p) => sum + Number(p.amount_due), 0) / payments.length)
    : 0;

  const stats = [
    {
      title: "Total Pagos Recibidos",
      value: `$${totalPaid.toLocaleString()}`,
      change: "",
      changeType: "neutral" as const,
      icon: DollarSign,
      description: "total acumulado"
    },
    {
      title: "Pagos a Tiempo",
      value: `${onTimeRate}%`,
      change: "",
      changeType: "positive" as const,
      icon: CheckCircle,
      description: "tasa de cumplimiento"
    },
    {
      title: "Pagos Pendientes",
      value: pendingPayments.toString(),
      change: "",
      changeType: "neutral" as const,
      icon: Clock,
      description: "por cobrar"
    },
    {
      title: "Pago Promedio",
      value: `$${averagePayment.toLocaleString()}`,
      change: "",
      changeType: "neutral" as const,
      icon: TrendingUp,
      description: "promedio mensual"
    }
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "status-approved";
      case "pending":
        return "status-pending";
      case "overdue":
        return "status-denied";
      default:
        return "status-pending";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-display">Payment History</h1>
            <p className="text-body text-muted-foreground">
              Track and manage customer payments and outstanding balances
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="card-professional p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, application ID, or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-professional pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Due Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="card-professional">
          <div className="p-6 border-b border-border">
            <h2 className="text-heading">Payment Records</h2>
            <p className="text-caption text-muted-foreground mt-1">
              {sortedPayments.length} payment{sortedPayments.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-caption">Pago #</th>
                      <th className="text-left p-4 font-medium text-caption">Contrato</th>
                      <th className="text-left p-4 font-medium text-caption">Monto</th>
                      <th className="text-left p-4 font-medium text-caption">Fecha Venc.</th>
                      <th className="text-left p-4 font-medium text-caption">Estado</th>
                      <th className="text-left p-4 font-medium text-caption">Método</th>
                      <th className="text-left p-4 font-medium text-caption">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment, index) => (
                      <tr key={payment.id} className={`border-b border-border hover:bg-accent/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">#{payment.payment_number}</p>
                            <p className="text-caption text-muted-foreground">{payment.contracts.contract_number}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{payment.contracts.profiles.full_name}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-foreground">${Number(payment.amount_due).toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-body">{new Date(payment.due_date).toLocaleDateString()}</span>
                          </div>
                          {payment.paid_at && (
                            <p className="text-caption text-muted-foreground">
                              Pagado: {new Date(payment.paid_at).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className={`flex items-center space-x-1 ${getStatusStyle(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              <span>{payment.status === 'paid' ? 'Pagado' : payment.status === 'pending' ? 'Pendiente' : 'Vencido'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-body">{payment.payment_method || '-'}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => navigate("/contract-review", {
                                state: {
                                  contractId: payment.contract_id
                                }
                              })}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {sortedPayments.length === 0 && !loading && (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-body text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'No se encontraron pagos con los filtros seleccionados' 
                        : 'No hay pagos registrados aún'}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Summary Card */}
        {!loading && payments.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="card-professional p-6">
              <h3 className="text-heading mb-4">Resumen de Pagos</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-caption">Total Pagado</span>
                  <span className="font-semibold text-foreground">${totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption">Saldo Pendiente</span>
                  <span className="font-semibold text-foreground">
                    ${payments
                      .filter(p => p.status === 'pending')
                      .reduce((sum, p) => sum + Number(p.amount_due), 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-caption">Tasa de Cumplimiento</span>
                  <span className="font-semibold text-secondary">{onTimeRate}%</span>
                </div>
              </div>
            </div>

            <div className="card-professional p-6">
              <h3 className="text-heading mb-4">Próximos Pagos</h3>
              <div className="space-y-3">
                {payments
                  .filter(p => p.status === 'pending')
                  .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                  .slice(0, 3)
                  .map(payment => {
                    const daysUntilDue = Math.ceil((new Date(payment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{payment.contracts.profiles.full_name}</p>
                          <p className={`text-caption ${daysUntilDue < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {daysUntilDue < 0 
                              ? `Vencido hace ${Math.abs(daysUntilDue)} días` 
                              : `Vence en ${daysUntilDue} días`}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">${Number(payment.amount_due).toLocaleString()}</p>
                      </div>
                    );
                  })}
                {payments.filter(p => p.status === 'pending').length === 0 && (
                  <p className="text-caption text-muted-foreground text-center py-4">
                    No hay pagos pendientes
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}