import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Navbar from "@/components/Navbar";
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
  Shield
} from "lucide-react";

export default function ContractReview() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const applicationId = location.state?.applicationId || "APP-123456";
  const applicationData = location.state?.applicationData;
  const riskScore = location.state?.riskScore || 720;
  
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

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    if (applicationData?.creditAmount && contractTerms.interestRate && contractTerms.termLength) {
      const principal = parseInt(applicationData.creditAmount);
      const monthlyRate = parseFloat(contractTerms.interestRate) / 100 / 12;
      const numPayments = parseInt(contractTerms.termLength);
      
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                           (Math.pow(1 + monthlyRate, numPayments) - 1);
      
      return Math.round(monthlyPayment);
    }
    return 0;
  };

  const monthlyPayment = calculateMonthlyPayment();

  const handleSendContract = async () => {
    setIsSending(true);
    // Simulate sending contract
    await new Promise(resolve => setTimeout(resolve, 2000));
    navigate("/", { 
      state: { 
        message: "Contract sent successfully to customer for signature",
        type: "success"
      }
    });
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
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "View Mode" : "Edit Terms"}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
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

                {/* Approval Section */}
                <div className="border-t border-border pt-6">
                  <div className="flex items-start space-x-3 mb-6">
                    <Checkbox
                      id="approve"
                      checked={isApproved}
                      onCheckedChange={(checked) => setIsApproved(!!checked)}
                    />
                    <label
                      htmlFor="approve"
                      className="text-body leading-relaxed"
                    >
                      I have reviewed all contract terms and approve this agreement for customer signature.
                      The terms accurately reflect the approved credit application and comply with company policies.
                    </label>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleSendContract}
                      disabled={!isApproved || isSending}
                      className="btn-primary"
                    >
                      {isSending ? (
                        <>Sending...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send to Customer
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Save Draft
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