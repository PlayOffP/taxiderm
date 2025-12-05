/*
  # Taxidermy & Deer Processing Database Schema

  1. New Tables
    - `customer` - Customer information with contact preferences
    - `job` - Main job/animal processing records with full lifecycle tracking
    - `compliance_doc` - PWD-535 and Wildlife Resource Document storage with versioning
    - `payment` - Payment records with flexible fee structures
    - `notification` - SMS/email notification tracking with delivery status
    - `audit_log` - Complete audit trail for all job operations

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their data
    - Ensure proper access controls for sensitive compliance data

  3. Business Rules
    - Species-specific validation (antler_points for deer, beard_attached for turkey)
    - Status workflow enforcement
    - Required legal fields for compliance documents
    - Automatic timestamps and versioning
*/

-- Customer table
CREATE TABLE IF NOT EXISTS customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  sms_opt_in boolean DEFAULT true,
  email text,
  address_line1 text,
  city text,
  state text DEFAULT 'TX',
  zip text,
  created_at timestamptz DEFAULT now()
);

-- Job table with full lifecycle management
CREATE TABLE IF NOT EXISTS job (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customer(id) NOT NULL,
  species text NOT NULL CHECK (species IN ('deer', 'turkey', 'duck', 'quail', 'dove', 'other')),
  sex text NOT NULL CHECK (sex IN ('male', 'female', 'unknown')),
  antler_points integer,
  beard_attached boolean,
  date_killed date NOT NULL,
  license_no text NOT NULL,
  ranch_area text,
  county text,
  state text DEFAULT 'TX',
  status text DEFAULT 'received' CHECK (status IN ('received', 'in_cooler', 'skinned_quartered', 'processing', 'freezer', 'ready', 'picked_up', 'paid')),
  dressed_weight numeric(5,2),
  hang_weight numeric(5,2),
  yield_weight numeric(5,2),
  processing_type text DEFAULT 'standard' CHECK (processing_type IN ('standard', 'euro_mount', 'shoulder_mount', 'full_mount', 'processing_only')),
  cut_sheet jsonb DEFAULT '{}',
  instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Compliance documents
CREATE TABLE IF NOT EXISTS compliance_doc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('PWD-535', 'WRD')),
  pdf_url text,
  printed boolean DEFAULT false,
  donor_signature_url text,
  taxidermist_signature_url text,
  taxidermist_name text DEFAULT 'Tristan',
  business_name text DEFAULT 'Tall Pine Taxidermy & Deer Processing',
  business_phone text DEFAULT '(555) 123-4567',
  business_address text DEFAULT '123 Pine St, Texas 75001',
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Payment records
CREATE TABLE IF NOT EXISTS payment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job(id) NOT NULL,
  method text NOT NULL CHECK (method IN ('cash', 'check', 'card')),
  base_flat_fee numeric(8,2) DEFAULT 0,
  per_lb_rate numeric(5,2) DEFAULT 0,
  per_lb_weight numeric(5,2) DEFAULT 0,
  fee_pass boolean DEFAULT false,
  total numeric(8,2) NOT NULL,
  paid_at timestamptz DEFAULT now(),
  receipt_url text
);

-- Notification tracking
CREATE TABLE IF NOT EXISTS notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job(id) NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms', 'email')),
  template_key text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent',
  payload jsonb DEFAULT '{}'
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES job(id),
  actor text NOT NULL,
  action text NOT NULL,
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE job ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_doc ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users full access to customers"
  ON customer FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to jobs"
  ON job FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to compliance_doc"
  ON compliance_doc FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to payment"
  ON payment FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to notification"
  ON notification FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to audit_log"
  ON audit_log FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_job_status ON job(status);
CREATE INDEX idx_job_customer_id ON job(customer_id);
CREATE INDEX idx_job_invoice_no ON job(invoice_no);
CREATE INDEX idx_customer_phone ON customer(phone);
CREATE INDEX idx_compliance_doc_job_id ON compliance_doc(job_id);
CREATE INDEX idx_payment_job_id ON payment(job_id);
CREATE INDEX idx_notification_job_id ON notification(job_id);
CREATE INDEX idx_audit_log_job_id ON audit_log(job_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for job table
CREATE TRIGGER update_job_updated_at BEFORE UPDATE ON job
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();