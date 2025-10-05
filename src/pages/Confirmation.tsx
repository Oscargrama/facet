import { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { CheckCircle, Clock, ArrowRight, Home, Eye, Loader2 } from "lucide-react";

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const applicationId = location.state?.applicationId;
  const applicationNumber = location.state?.applicationNumber;
  const applicationData = location.state?.applicationData;

  useEffect(() => {
    if (!applicationData || !applicationId) {
      navigate("/credit-application");
      return;
    }

    // Auto-redirect to risk assessment after 3 seconds
    const timer = setTimeout(() => {
      navigate("/risk-assessment", { 
        state: { applicationId, applicationData } 
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [applicationData, applicationId, navigate]);

  if (!applicationData || !applicationId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-display text-secondary mb-2">¡Solicitud Enviada Exitosamente!</h1>
            <p className="text-body text-muted-foreground">
              Tu solicitud de crédito ha sido recibida y está siendo procesada.
            </p>
          </div>

          {/* Application Details Card */}
          <div className="card-professional p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-heading">Detalles de la Solicitud</h2>
                <p className="text-caption text-muted-foreground">ID de Referencia: {applicationNumber}</p>
              </div>
              <div className="flex items-center space-x-2 text-amber-600">
                <Clock className="w-5 h-5" />
                <span className="status-pending">Procesando</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-caption">Name</span>
                    <span className="text-body font-medium">{applicationData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-caption">Email</span>
                    <span className="text-body">{applicationData.customerEmail}</span>
                  </div>
                  {applicationData.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-caption">Phone</span>
                      <span className="text-body">{applicationData.customerPhone}</span>
                    </div>
                  )}
                  {applicationData.employmentStatus && (
                    <div className="flex justify-between">
                      <span className="text-caption">Employment</span>
                      <span className="text-body">{applicationData.employmentStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Financial Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-caption">Credit Amount</span>
                    <span className="text-body font-semibold text-primary">
                      ${parseInt(applicationData.creditAmount).toLocaleString()}
                    </span>
                  </div>
                  {applicationData.purpose && (
                    <div className="flex justify-between">
                      <span className="text-caption">Purpose</span>
                      <span className="text-body">{applicationData.purpose}</span>
                    </div>
                  )}
                  {applicationData.monthlyIncome && (
                    <div className="flex justify-between">
                      <span className="text-caption">Monthly Income</span>
                      <span className="text-body">${parseInt(applicationData.monthlyIncome).toLocaleString()}</span>
                    </div>
                  )}
                  {applicationData.monthlyDebtPayment && (
                    <div className="flex justify-between">
                      <span className="text-caption">Monthly Debt Payment</span>
                      <span className="text-body">${parseInt(applicationData.monthlyDebtPayment).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Employment Information */}
            {applicationData.yearsInEmployment && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4">Employment Information</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-caption">Years in Employment</span>
                      <span className="text-body">{applicationData.yearsInEmployment} years</span>
                    </div>
                    {applicationData.creditHistoryScore && (
                      <div className="flex justify-between">
                        <span className="text-caption">Credit History</span>
                        <span className="text-body">
                          {applicationData.creditHistoryScore === "850" ? "Excelente" : 
                           applicationData.creditHistoryScore === "700" ? "Limitado" : "Negativo"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="card-professional p-6 mb-8">
            <h3 className="text-heading mb-4">What Happens Next?</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Automated Risk Assessment</p>
                  <p className="text-caption text-muted-foreground">
                    Our system will automatically evaluate the credit application and assess risk factors.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Decision & Notification</p>
                  <p className="text-caption text-muted-foreground">
                    You'll receive an email notification with the decision within 2-4 business hours.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Contract Generation</p>
                  <p className="text-caption text-muted-foreground">
                    If approved, a digital contract will be automatically generated for review and signing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-body">Redirigiendo a evaluación de riesgo...</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
              
              <Link 
                to="/risk-assessment" 
                state={{ applicationId, applicationData }}
              >
                <Button className="btn-primary w-full sm:w-auto">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Evaluación de Riesgo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div className="text-center mt-8 p-6 bg-muted/50 rounded-lg">
            <p className="text-caption text-muted-foreground">
              Questions about your application? Contact our support team at{" "}
              <a href="mailto:support@zentro.com" className="text-primary hover:underline">
                support@zentro.com
              </a>{" "}
              or call{" "}
              <a href="tel:+1-555-123-4567" className="text-primary hover:underline">
                +1 (555) 123-4567
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}