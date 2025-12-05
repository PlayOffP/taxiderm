/*
  # Fix Row-Level Security Policies

  1. Security Updates
    - Update RLS policies to properly allow authenticated users to perform CRUD operations
    - Ensure all tables have proper INSERT, SELECT, UPDATE, DELETE policies
    - Fix policy conditions to work with authenticated users

  2. Policy Changes
    - Allow authenticated users full access to all tables
    - Remove overly restrictive policies that were blocking operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users full access to customers" ON customer;
DROP POLICY IF EXISTS "Allow authenticated users full access to jobs" ON job;
DROP POLICY IF EXISTS "Allow authenticated users full access to compliance_doc" ON compliance_doc;
DROP POLICY IF EXISTS "Allow authenticated users full access to payment" ON payment;
DROP POLICY IF EXISTS "Allow authenticated users full access to notification" ON notification;
DROP POLICY IF EXISTS "Allow authenticated users full access to audit_log" ON audit_log;

-- Customer policies
CREATE POLICY "Enable all operations for authenticated users" ON customer
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Job policies
CREATE POLICY "Enable all operations for authenticated users" ON job
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Compliance document policies
CREATE POLICY "Enable all operations for authenticated users" ON compliance_doc
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Payment policies
CREATE POLICY "Enable all operations for authenticated users" ON payment
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification policies
CREATE POLICY "Enable all operations for authenticated users" ON notification
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Audit log policies
CREATE POLICY "Enable all operations for authenticated users" ON audit_log
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);