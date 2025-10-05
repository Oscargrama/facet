import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Send, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  creditAmount: string;
  purpose: string;
  employmentStatus: string;
  monthlyIncome: string;
  monthlyDebtPayment: string;
  yearsInEmployment: string;
  creditHistoryScore: string;
  notes: string;
}

export default function CreditApplication() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    creditAmount: "",
    purpose: "",
    employmentStatus: "",
    monthlyIncome: "",
    monthlyDebtPayment: "",
    yearsInEmployment: "",
    creditHistoryScore: "",
    notes: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile) {
          setFormData(prev => ({
            ...prev,
            customerName: profile.full_name || "",
            customerEmail: profile.email || "",
            customerPhone: profile.phone || "",
            customerAddress: profile.address || "",
            employmentStatus: profile.employment_status || "",
            monthlyIncome: profile.monthly_income?.toString() || "",
            monthlyDebtPayment: profile.monthly_debt_payment?.toString() || "",
            yearsInEmployment: profile.years_in_employment?.toString() || "",
            creditHistoryScore: profile.credit_history_score?.toString() || "",
          }));
        }
      } catch (error: any) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update profile with latest information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.customerAddress,
          employment_status: formData.employmentStatus,
          monthly_income: parseFloat(formData.monthlyIncome),
          monthly_debt_payment: parseFloat(formData.monthlyDebtPayment || '0'),
          years_in_employment: parseInt(formData.yearsInEmployment || '0'),
          credit_history_score: parseInt(formData.creditHistoryScore),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create credit application
      const applicationNumber = `APP-${Date.now()}`;
      const { data: application, error: applicationError } = await supabase
        .from('credit_applications')
        .insert({
          application_number: applicationNumber,
          user_id: user.id,
          credit_amount: parseFloat(formData.creditAmount),
          purpose: formData.purpose,
          term_months: 24, // Default term
          monthly_income: parseFloat(formData.monthlyIncome),
          monthly_debt_payment: parseFloat(formData.monthlyDebtPayment || '0'),
          credit_history_score: parseInt(formData.creditHistoryScore),
          years_in_employment: parseInt(formData.yearsInEmployment || '0'),
          status: 'pending',
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      toast.success('Solicitud creada exitosamente');
      
      // Navigate to confirmation page
      navigate("/confirmation", { 
        state: { 
          applicationId: application.id,
          applicationNumber: application.application_number,
          applicationData: formData 
        } 
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Error al crear la solicitud');
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-display">Personal Credit Application</h1>
            <p className="text-body text-muted-foreground">
              Submit a new personal credit application
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
                        <SelectItem value="freelancer">Freelancer</SelectItem>
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
                      placeholder="5000"
                      value={formData.creditAmount}
                      onChange={(e) => handleInputChange("creditAmount", e.target.value)}
                      className="input-professional"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Monthly Income</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      placeholder="3000"
                      value={formData.monthlyIncome}
                      onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="monthlyDebtPayment">Monthly Debt Payment</Label>
                    <Input
                      id="monthlyDebtPayment"
                      type="number"
                      placeholder="500"
                      value={formData.monthlyDebtPayment}
                      onChange={(e) => handleInputChange("monthlyDebtPayment", e.target.value)}
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
                        <SelectItem value="electrodomestico">Electrodoméstico</SelectItem>
                        <SelectItem value="tecnologia">Tecnología</SelectItem>
                        <SelectItem value="educativo">Educativo</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Employment & Credit History */}
              <div className="card-professional p-6">
                <h2 className="text-heading mb-6">Employment & Credit History</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="yearsInEmployment">Years in Current Employment</Label>
                    <Input
                      id="yearsInEmployment"
                      type="number"
                      placeholder="3"
                      value={formData.yearsInEmployment}
                      onChange={(e) => handleInputChange("yearsInEmployment", e.target.value)}
                      className="input-professional"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="creditHistoryScore">Credit History</Label>
                    <Select
                      value={formData.creditHistoryScore}
                      onValueChange={(value) => handleInputChange("creditHistoryScore", value)}
                    >
                      <SelectTrigger className="input-professional">
                        <SelectValue placeholder="Select credit history" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="850">Excelente (sin reportes negativos)</SelectItem>
                        <SelectItem value="700">Limitado o leve</SelectItem>
                        <SelectItem value="500">Negativo</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <span className="text-caption">Monthly Income</span>
                  <span className="text-body">{formData.monthlyIncome ? `$${parseInt(formData.monthlyIncome).toLocaleString()}` : "—"}</span>
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
              {formData.creditAmount && formData.monthlyIncome && (
                <div className="space-y-3">
                  <div className="bg-primary/10 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-caption">Estimated Monthly Payment</p>
                      <p className="text-2xl font-bold text-primary">
                        ${Math.round((parseInt(formData.creditAmount) * 1.08) / 12).toLocaleString()}
                      </p>
                      <p className="text-caption">Based on 8% APR, 12 months</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-caption">Debt-to-Income Impact</p>
                    <p className="text-sm font-semibold">
                      {((Math.round((parseInt(formData.creditAmount) * 1.08) / 12) / parseInt(formData.monthlyIncome)) * 100).toFixed(1)}%
                    </p>
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