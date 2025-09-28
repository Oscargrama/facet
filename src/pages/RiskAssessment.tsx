import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
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
  const [isLoading, setIsLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [recommendation, setRecommendation] = useState<"approve" | "review" | "deny">("review");
  
  const applicationId = location.state?.applicationId || "APP-123456";
  const applicationData = location.state?.applicationData;

  // Mock risk factors based on application data
  const [riskFactors] = useState<RiskFactor[]>([
    {
      name: "Credit Score",
      score: 720,
      weight: 30,
      status: "good",
      description: "Strong credit history with minimal late payments"
    },
    {
      name: "Income Stability", 
      score: applicationData?.annualIncome ? Math.min(850, parseInt(applicationData.annualIncome) / 100) : 650,
      weight: 25,
      status: applicationData?.annualIncome && parseInt(applicationData.annualIncome) > 50000 ? "good" : "warning",
      description: "Consistent income history with current employment"
    },
    {
      name: "Debt-to-Income Ratio",
      score: applicationData?.existingDebt && applicationData?.annualIncome 
        ? Math.max(400, 800 - (parseInt(applicationData.existingDebt) / parseInt(applicationData.annualIncome) * 1000))
        : 700,
      weight: 20,
      status: "good",
      description: "Manageable existing debt levels"
    },
    {
      name: "Business Longevity",
      score: applicationData?.yearsInBusiness ? Math.min(800, 500 + parseInt(applicationData.yearsInBusiness) * 50) : 600,
      weight: 15,
      status: applicationData?.yearsInBusiness && parseInt(applicationData.yearsInBusiness) > 3 ? "good" : "warning",
      description: "Established business with proven track record"
    },
    {
      name: "Loan Purpose",
      score: applicationData?.purpose === "business-expansion" || applicationData?.purpose === "equipment-purchase" ? 750 : 650,
      weight: 10,
      status: "good",
      description: "Productive use of credit funds"
    }
  ]);

  useEffect(() => {
    // Simulate loading and calculation
    const timer = setTimeout(() => {
      const calculatedScore = riskFactors.reduce((total, factor) => {
        return total + (factor.score * factor.weight / 100);
      }, 0) / riskFactors.length;
      
      setOverallScore(Math.round(calculatedScore));
      
      if (calculatedScore >= 700) {
        setRecommendation("approve");
      } else if (calculatedScore >= 600) {
        setRecommendation("review");
      } else {
        setRecommendation("deny");
      }
      
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [riskFactors]);

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
        return "Recommended for Approval";
      case "review":
        return "Requires Manual Review";
      case "deny":
        return "Not Recommended";
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
              <h2 className="text-heading mb-2">Analyzing Risk Factors</h2>
              <p className="text-body text-muted-foreground mb-6">
                Our AI system is evaluating the credit application...
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
              <h1 className="text-display">Risk Assessment</h1>
              <p className="text-body text-muted-foreground">
                Application ID: {applicationId}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Assessment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overall Score */}
              <div className="card-professional p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-heading">Overall Risk Score</h2>
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
                <h2 className="text-heading mb-6">Detailed Risk Analysis</h2>
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
                      <p className="text-caption">Requested Amount</p>
                    </div>
                  </div>
                  
                  {applicationData?.businessName && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{applicationData.businessName}</p>
                        <p className="text-caption">{applicationData.businessType || "Business"}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">2 minutes ago</p>
                      <p className="text-caption">Assessment Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Recommended Action</h3>
                
                {recommendation === "approve" && (
                  <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-secondary" />
                      <span className="font-semibold text-secondary">Approve Credit</span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      Low risk profile meets approval criteria. Proceed with contract generation.
                    </p>
                  </div>
                )}

                {recommendation === "review" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-amber-700">Manual Review Required</span>
                    </div>
                    <p className="text-caption text-amber-600">
                      Medium risk factors detected. Additional review recommended before approval.
                    </p>
                  </div>
                )}

                {recommendation === "deny" && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="font-semibold text-destructive">Decline Application</span>
                    </div>
                    <p className="text-caption text-muted-foreground">
                      High risk factors exceed approval threshold. Consider alternative options.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {recommendation === "approve" && (
                    <Link to="/contract-review" state={{ applicationId, applicationData, riskScore: overallScore }}>
                      <Button className="btn-primary w-full">
                        Generate Contract
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/">
                    <Button variant="outline" className="w-full">
                      Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Risk Factors Legend */}
              <div className="card-professional p-6">
                <h3 className="text-heading mb-4">Risk Level Guide</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-secondary rounded-full" />
                    <div>
                      <p className="text-caption font-medium">Low Risk (700+)</p>
                      <p className="text-xs text-muted-foreground">Recommended for approval</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <div>
                      <p className="text-caption font-medium">Medium Risk (600-699)</p>
                      <p className="text-xs text-muted-foreground">Requires manual review</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-destructive rounded-full" />
                    <div>
                      <p className="text-caption font-medium">High Risk (&lt;600)</p>
                      <p className="text-xs text-muted-foreground">Not recommended</p>
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