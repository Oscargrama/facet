-- Create email notifications table for tracking
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  application_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view notifications for their applications
CREATE POLICY "Users can view their own email notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.credit_applications
    WHERE credit_applications.application_number = email_notifications.application_id
    AND credit_applications.user_id = auth.uid()
  )
);

-- Allow system to insert notifications
CREATE POLICY "Service role can insert notifications"
ON public.email_notifications
FOR INSERT
TO service_role
WITH CHECK (true);