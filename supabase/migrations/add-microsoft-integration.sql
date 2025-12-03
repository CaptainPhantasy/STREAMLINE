-- Microsoft Integration Schema Update
-- Adds Microsoft/Outlook as a provider option

-- Update the provider check constraint to include 'microsoft'
ALTER TABLE email_providers 
DROP CONSTRAINT IF EXISTS email_providers_provider_check;

ALTER TABLE email_providers 
ADD CONSTRAINT email_providers_provider_check 
CHECK (provider IN ('resend', 'gmail', 'microsoft', 'sendgrid', 'mailgun'));

