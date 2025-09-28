import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { CheckCircle, Clock, ArrowRight, Home, Eye } from "lucide-react";

export default function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [applicationId] = useState(`APP-${Date.now().toString().slice(-6)}`);
  
  const applicationData = location.state?.applicationData;

  useEffect(() => {
    if (!applicationData) {
      navigate("/credit-application");
    }
  }, [applicationData, navigate]);

  if (!applicationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-display text-secondary mb-2">Application Submitted Successfully!</h1>
            <p className="text-body text-muted-foreground">
              Your credit application has been received and is being processed.
            </p>
          </div>

          {/* Application Details Card */}
          <div className="card-professional p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-heading">Application Details</h2>
                <p className="text-caption text-muted-foreground">Reference ID: {applicationId}</p>
              </div>
              <div className="flex items-center space-x-2 text-amber-600">
                <Clock className="w-5 h-5" />
                <span className="status-pending">Processing</span>
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
                  {applicationData.annualIncome && (
                    <div className="flex justify-between">
                      <span className="text-caption">Annual Income</span>
                      <span className="text-body">${parseInt(applicationData.annualIncome).toLocaleString()}</span>
                    </div>
                  )}
                  {applicationData.existingDebt && (
                    <div className="flex justify-between">
                      <span className="text-caption">Existing Debt</span>
                      <span className="text-body">${parseInt(applicationData.existingDebt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Information */}
            {applicationData.businessName && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4">Business Information</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-caption">Business Name</span>
                      <span className="text-body">{applicationData.businessName}</span>
                    </div>
                    {applicationData.businessType && (
                      <div className="flex justify-between">
                        <span className="text-caption">Business Type</span>
                        <span className="text-body">{applicationData.businessType}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {applicationData.yearsInBusiness && (
                      <div className="flex justify-between">
                        <span className="text-caption">Years in Business</span>
                        <span className="text-body">{applicationData.yearsInBusiness} years</span>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
            
            <Link 
              to="/risk-assessment" 
              state={{ applicationId, applicationData }}
            >
              <Button className="btn-primary w-full sm:w-auto">
                <Eye className="w-4 h-4 mr-2" />
                View Risk Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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