-- Create profiles table for customer information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  employment_status TEXT,
  monthly_income NUMERIC(12, 2),
  monthly_debt_payment NUMERIC(12, 2),
  years_in_employment INTEGER,
  credit_history_score INTEGER CHECK (credit_history_score IN (500, 700, 850)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create credit_applications table
CREATE TABLE public.credit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Application details
  credit_amount NUMERIC(12, 2) NOT NULL,
  purpose TEXT NOT NULL,
  term_months INTEGER NOT NULL,
  
  -- Financial information (snapshot at application time)
  monthly_income NUMERIC(12, 2) NOT NULL,
  monthly_debt_payment NUMERIC(12, 2),
  credit_history_score INTEGER NOT NULL,
  years_in_employment INTEGER,
  
  -- Risk assessment
  risk_score INTEGER,
  credit_history_factor_score INTEGER,
  monthly_income_factor_score INTEGER,
  debt_ratio_factor_score INTEGER,
  employment_stability_factor_score INTEGER,
  credit_purpose_factor_score INTEGER,
  
  -- Status and dates
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  decision TEXT CHECK (decision IN ('approve', 'review', 'deny')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on credit_applications
ALTER TABLE public.credit_applications ENABLE ROW LEVEL SECURITY;

-- Credit applications policies
CREATE POLICY "Users can view their own applications"
  ON public.credit_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
  ON public.credit_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending applications"
  ON public.credit_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL UNIQUE,
  application_id UUID NOT NULL REFERENCES public.credit_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Contract terms
  credit_amount NUMERIC(12, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  term_months INTEGER NOT NULL,
  monthly_payment NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  
  -- Payment terms
  first_payment_date DATE NOT NULL,
  late_fees_policy TEXT,
  early_payment_policy TEXT,
  additional_terms TEXT,
  
  -- Blockchain data
  ipfs_cid TEXT,
  blockchain_tx_hash TEXT,
  block_number BIGINT,
  contract_hash TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_customer', 'signed', 'active', 'completed', 'defaulted', 'cancelled')),
  signed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Contracts policies
CREATE POLICY "Users can view their own contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft contracts"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due NUMERIC(12, 2) NOT NULL,
  amount_paid NUMERIC(12, 2),
  
  -- Payment breakdown
  principal_amount NUMERIC(12, 2),
  interest_amount NUMERIC(12, 2),
  late_fee NUMERIC(12, 2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late', 'defaulted')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  transaction_reference TEXT,
  
  -- Blockchain verification
  blockchain_tx_hash TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(contract_id, payment_number)
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_credit_applications
  BEFORE UPDATE ON public.credit_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_contracts
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_credit_applications_user_id ON public.credit_applications(user_id);
CREATE INDEX idx_credit_applications_status ON public.credit_applications(status);
CREATE INDEX idx_credit_applications_submitted_at ON public.credit_applications(submitted_at DESC);

CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX idx_contracts_application_id ON public.contracts(application_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);

CREATE INDEX idx_payments_contract_id ON public.payments(contract_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);