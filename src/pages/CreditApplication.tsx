import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Send, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  creditAmount: string;
  purpose: string;
  employmentStatus: string;
  annualIncome: string;
  existingDebt: string;
  businessName: string;
  businessType: string;
  yearsInBusiness: string;
  notes: string;
}

export default function CreditApplication() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    creditAmount: "",
    purpose: "",
    employmentStatus: "",
    annualIncome: "",
    existingDebt: "",
    businessName: "",
    businessType: "",
    yearsInBusiness: "",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate to confirmation page with application data
    navigate("/confirmation", { state: { applicationData: formData } });
  };

  const isFormValid = formData.customerName && formData.customerEmail && formData.creditAmount;

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
          <div>
            <h1 className="text-display">Credit Application</h1>
            <p className="text-body text-muted-foreground">
              Submit a new credit application for your customer
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Application Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="card-professional p-6">
                <h2 className="text-heading mb-6">Customer Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      placeholder="Enter customer's full name"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange("customerName", e.target.value)}
                      className="input-professional"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      placeholder="customer@example.com"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange("customerEmail", e.target.value)}
                      className="input-professional"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone Number</Label>
                    <Input
                      id="customerPhone"
                      placeholder="+1 (555) 123-4567"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employmentStatus">Employment Status</Label>
                    <Select
                      value={formData.employmentStatus}
                      onValueChange={(value) => handleInputChange("employmentStatus", value)}
                    >
                      <SelectTrigger className="input-professional">
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self-employed">Self-employed</SelectItem>
                        <SelectItem value="business-owner">Business Owner</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="customerAddress">Address</Label>
                    <Textarea
                      id="customerAddress"
                      placeholder="Enter customer's full address"
                      value={formData.customerAddress}
                      onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                      className="input-professional min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="card-professional p-6">
                <h2 className="text-heading mb-6">Financial Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="creditAmount">Requested Credit Amount *</Label>
                    <Input
                      id="creditAmount"
                      type="number"
                      placeholder="25000"
                      value={formData.creditAmount}
                      onChange={(e) => handleInputChange("creditAmount", e.target.value)}
                      className="input-professional"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="annualIncome">Annual Income</Label>
                    <Input
                      id="annualIncome"
                      type="number"
                      placeholder="75000"
                      value={formData.annualIncome}
                      onChange={(e) => handleInputChange("annualIncome", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="existingDebt">Existing Debt</Label>
                    <Input
                      id="existingDebt"
                      type="number"
                      placeholder="15000"
                      value={formData.existingDebt}
                      onChange={(e) => handleInputChange("existingDebt", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Credit</Label>
                    <Select
                      value={formData.purpose}
                      onValueChange={(value) => handleInputChange("purpose", value)}
                    >
                      <SelectTrigger className="input-professional">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business-expansion">Business Expansion</SelectItem>
                        <SelectItem value="equipment-purchase">Equipment Purchase</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="working-capital">Working Capital</SelectItem>
                        <SelectItem value="personal">Personal Use</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div className="card-professional p-6">
                <h2 className="text-heading mb-6">Business Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      placeholder="Enter business name"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => handleInputChange("businessType", value)}
                    >
                      <SelectTrigger className="input-professional">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearsInBusiness">Years in Business</Label>
                    <Input
                      id="yearsInBusiness"
                      type="number"
                      placeholder="5"
                      value={formData.yearsInBusiness}
                      onChange={(e) => handleInputChange("yearsInBusiness", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information about the application"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="input-professional min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="card-professional p-6">
              <h3 className="text-heading mb-4">Application Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-caption">Customer</span>
                  <span className="text-body">{formData.customerName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption">Credit Amount</span>
                  <span className="text-body font-semibold">
                    {formData.creditAmount ? `$${parseInt(formData.creditAmount).toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption">Purpose</span>
                  <span className="text-body">{formData.purpose || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption">Business</span>
                  <span className="text-body">{formData.businessName || "—"}</span>
                </div>
              </div>
            </div>

            <div className="card-professional p-6">
              <h3 className="text-heading mb-4">
                <Calculator className="w-5 h-5 inline mr-2" />
                Quick Calculator
              </h3>
              <p className="text-caption mb-4">
                Estimated monthly payment for requested amount
              </p>
              {formData.creditAmount && (
                <div className="bg-primary/10 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-caption">Estimated Monthly Payment</p>
                    <p className="text-2xl font-bold text-primary">
                      ${Math.round((parseInt(formData.creditAmount) * 0.08) / 12).toLocaleString()}
                    </p>
                    <p className="text-caption">Based on 8% APR, 12 months</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}