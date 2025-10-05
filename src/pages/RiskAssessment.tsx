import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  DollarSign,
  User,
  Building,
  Clock
} from "lucide-react";

interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  status: "good" | "warning" | "risk";
  description: string;
}

export default function RiskAssessment() {
  const location = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [recommendation, setRecommendation] = useState<"approve" | "review" | "deny">("review");
  const [application, setApplication] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const applicationId = location.state?.applicationId;
  const applicationData = location.state?.applicationData;

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (error: any) {
        console.error('Error loading profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Risk factors for personal credit based on application data
  const [riskFactors] = useState<RiskFactor[]>([
    {
      name: "Credit History Score",
      score: applicationData?.creditHistoryScore ? parseInt(applicationData.creditHistoryScore) : 700,
      weight: 30,
      status: applicationData?.creditHistoryScore && parseInt(applicationData.creditHistoryScore) >= 700 ? "good" : applicationData?.creditHistoryScore && parseInt(applicationData.creditHistoryScore) >= 600 ? "warning" : "risk",
      description: applicationData?.creditHistoryScore 
        ? parseInt(applicationData.creditHistoryScore) >= 800 ? "Historial crediticio excelente sin reportes negativos" 
        : parseInt(applicationData.creditHistoryScore) >= 700 ? "Historial crediticio limitado o leve"
        : "Historial crediticio con reportes negativos"
        : "Historial crediticio no especificado"
    },
    {
      name: "Monthly Income Score", 
      score: (() => {
        if (!applicationData?.monthlyIncome) return 600;
        const incomeCOP = parseInt(applicationData.monthlyIncome);
        const minIncome = 800_000;
        const maxIncome = 4_000_000;
        const minScore = 400;
        const maxScore = 800;
        
        if (incomeCOP <= minIncome) return minScore;
        if (incomeCOP >= maxIncome) return maxScore;
        
        const slope = (maxScore - minScore) / (maxIncome - minIncome);
        const score = minScore + (incomeCOP - minIncome) * slope;
        return Math.round(Math.max(minScore, Math.min(maxScore, score)));
      })(),
      weight: 25,
      status: applicationData?.monthlyIncome && parseInt(applicationData.monthlyIncome) >= 2_500_000 ? "good" 
        : applicationData?.monthlyIncome && parseInt(applicationData.monthlyIncome) >= 1_500_000 ? "warning" 
        : "risk",
      description: "Evaluación basada en ingresos mensuales declarados (COP 800K - 4M)"
    },
    {
      name: "Debt Ratio Score",
      score: applicationData?.monthlyDebtPayment && applicationData?.monthlyIncome 
        ? Math.max(400, 800 - (parseInt(applicationData.monthlyDebtPayment) / parseInt(applicationData.monthlyIncome) * 1000))
        : 700,
      weight: 25,
      status: applicationData?.monthlyDebtPayment && applicationData?.monthlyIncome
        ? (parseInt(applicationData.monthlyDebtPayment) / parseInt(applicationData.monthlyIncome)) < 0.3 ? "good" : "warning"
        : "good",
      description: "Relación entre cuota mensual de deudas e ingreso mensual"
    },
    {
      name: "Employment Stability Score",
      score: applicationData?.yearsInEmployment ? Math.min(800, 500 + parseInt(applicationData.yearsInEmployment) * 50) : 600,
      weight: 15,
      status: applicationData?.yearsInEmployment && parseInt(applicationData.yearsInEmployment) > 2 ? "good" : "warning",
      description: "Estabilidad laboral basada en años en empleo actual"
    },
    {
      name: "Credit Purpose Score",
      score: applicationData?.purpose === "electrodomestico" || applicationData?.purpose === "tecnologia" ? 750 
        : applicationData?.purpose === "educativo" ? 700 : 600,
      weight: 5,
      status: "good",
      description: "Propósito del crédito evaluado"
    }
  ]);

  useEffect(() => {
    const calculateAndSave = async () => {
      // Calculate total weighted score
      const totalScore = riskFactors.reduce((total, factor) => {
        return total + (factor.score * factor.weight / 100);
      }, 0);
      
      const roundedScore = Math.round(totalScore);
      setOverallScore(roundedScore);
      
      // Decision based on total score
      let decision: "approve" | "review" | "deny";
      if (totalScore >= 700) {
        decision = "approve";
      } else if (totalScore >= 600) {
        decision = "review";
      } else {
        decision = "deny";
      }
      setRecommendation(decision);

      // Save to database if we have applicationId
      if (applicationId && user) {
        try {
          const { error } = await supabase
            .from('credit_applications')
            .update({
              risk_score: roundedScore,
              credit_history_factor_score: riskFactors[0].score,
              monthly_income_factor_score: riskFactors[1].score,
              debt_ratio_factor_score: riskFactors[2].score,
              employment_stability_factor_score: riskFactors[3].score,
              credit_purpose_factor_score: riskFactors[4].score,
              decision: decision,
              status: decision === 'approve' ? 'approved' : decision === 'deny' ? 'rejected' : 'under_review',
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', applicationId)
            .eq('user_id', user.id);

          if (error) throw error;
        } catch (error: any) {
          console.error('Error saving risk assessment:', error);
          toast.error('Error al guardar la evaluación');
        }
      }
      
      setIsLoading(false);
    };

    const timer = setTimeout(calculateAndSave, 2000);
    return () => clearTimeout(timer);
  }, [riskFactors, applicationId, user]);

  const getScoreColor = (score: number) => {
    if (score >= 700) return "text-secondary";
    if (score >= 600) return "text-amber-600";
    return "text-destructive";
  };

  const getRecommendationIcon = () => {
    switch (recommendation) {
      case "approve":
        return <CheckCircle className="w-6 h-6 text-secondary" />;
      case "review":
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case "deny":
        return <XCircle className="w-6 h-6 text-destructive" />;
    }
  };

  const getRecommendationText = () => {
    switch (recommendation) {
      case "approve":
        return "Solicitud aprobada automáticamente";
      case "review":
        return "En revisión manual";
      case "deny":
        return "Solicitud rechazada";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container-professional py-8">
          <div className="max-w-4xl mx-auto">
            <div className="card-professional p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-heading mb-2">Analizando Factores de Riesgo</h2>
              <p className="text-body text-muted-foreground mb-6">
                Nuestro sistema está evaluando la solicitud de crédito personal...
              </p>
              <div className="max-w-md mx-auto">
                <Progress value={75} className="h-2" />
                <p className="text-caption text-muted-foreground mt-2">Processing data...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-display">Evaluación de Riesgo Crediticio</h1>
              <p className="text-body text-muted-foreground">
                ID de Solicitud: {applicationId}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Assessment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Score */}
              <div className="card-professional p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-heading">Puntuación de Riesgo Total</h2>
                  <div className="flex items-center space-x-2">
                    {getRecommendationIcon()}
                    <span className={`font-semibold ${
                      recommendation === "approve" ? "text-secondary" :
                      recommendation === "review" ? "text-amber-600" : "text-destructive"
                    }`}>
                      {getRecommendationText()}
                    </span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold mb-2 ${getScoreColor(overallScore)}`}>
                    {overallScore}
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    {overallScore >= 700 ? (
                      <TrendingUp className="w-5 h-5 text-secondary" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    )}
                    <span className="text-caption">
                      {overallScore >= 700 ? "Low Risk" : overallScore >= 600 ? "Medium Risk" : "High Risk"}
                    </span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <Progress 
                    value={(overallScore / 850) * 100} 
                    className="h-3 mb-2"
                  />
                  <div className="flex justify-between text-caption text-muted-foreground">
                    <span>300 (High Risk)</span>
                    <span>850 (Low Risk)</span>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="card-professional p-6">
                <h2 className="text-heading mb-6">Análisis Detallado de Factores</h2>
                <div className="space-y-6">
                  {riskFactors.map((factor, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            factor.status === "good" ? "bg-secondary" :
                            factor.status === "warning" ? "bg-amber-500" : "bg-destructive"
                          }`} />
                          <h3 className="font-semibold text-foreground">{factor.name}</h3>
                          <span className="text-caption text-muted-foreground">
                            Weight: {factor.weight}%
                          </span>
                        </div>
                        <div className={`text-xl font-bold ${getScoreColor(factor.score)}`}>
                          {factor.score}
                        </div>
                      </div>
                      <p className="text-caption text-muted-foreground mb-3">
                        {factor.description}
                      </p>
                      <Progress 
                        value={(factor.score / 850) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Application Summary */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Resumen de Solicitud</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{userProfile?.full_name || "Cargando..."}</p>
                      <p className="text-caption">{userProfile?.email || ""}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        ${applicationData?.creditAmount ? parseInt(applicationData.creditAmount).toLocaleString() : "25,000"}
                      </p>
                      <p className="text-caption">Requested Amount</p>
                    </div>
                  </div>
                  
                  {applicationData?.monthlyIncome && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">${parseInt(applicationData.monthlyIncome).toLocaleString()}/mes</p>
                        <p className="text-caption">Ingreso Mensual</p>
                      </div>
                    </div>
                  )}
                  
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Hace 2 minutos</p>
                        <p className="text-caption">Evaluación Completada</p>
                      </div>
                    </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Acción Recomendada</h3>
                
                {recommendation === "approve" && (
                  <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-secondary" />
                      <span className="font-semibold text-secondary">Aprobar Crédito</span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Perfil de bajo riesgo cumple criterios de aprobación. Proceder con generación de contrato.
                    </p>
                  </div>
                )}

                {recommendation === "review" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-700">Revisión Manual Requerida</span>
                    </div>
                    <p className="text-caption text-amber-600">
                      Factores de riesgo medio detectados. Se recomienda revisión adicional antes de aprobar.
                    </p>
                  </div>
                )}

                {recommendation === "deny" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="font-semibold text-destructive">Rechazar Solicitud</span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Factores de alto riesgo exceden el umbral de aprobación. Considerar opciones alternativas.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {recommendation === "approve" && (
                    <Link to="/contract-review" state={{ applicationId, applicationData, riskScore: overallScore }}>
                      <Button className="btn-primary w-full">
                        Generar Contrato
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/">
                    <Button variant="outline" className="w-full">
                      Volver al Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Risk Factors Legend */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Guía de Niveles de Riesgo</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-secondary rounded-full" />
                    <div>
                      <p className="text-caption font-medium">Bajo Riesgo (700+)</p>
                      <p className="text-xs text-muted-foreground">Recomendado para aprobación</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <div>
                      <p className="text-caption font-medium">Riesgo Medio (600-699)</p>
                      <p className="text-xs text-muted-foreground">Requiere revisión manual</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-destructive rounded-full" />
                    <div>
                      <p className="text-caption font-medium">Alto Riesgo (&lt;600)</p>
                      <p className="text-xs text-muted-foreground">No recomendado</p>
                    </div>
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