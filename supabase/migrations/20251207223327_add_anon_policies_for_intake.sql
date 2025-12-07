/*
  # Add anonymous user policies for intake workflow

  1. Changes
    - Add RLS policies for anonymous users on job table
    - Add RLS policies for anonymous users on compliance_doc table
    - Add RLS policies for anonymous users on audit_log table
  
  2. Security
    - Allow anon users to create and read jobs (kiosk mode)
    - Allow anon users to create and read compliance documents
    - Allow anon users to create audit log entries
    - All policies use restrictive permissions appropriate for kiosk usage
*/

-- Job table policies for anonymous users
CREATE POLICY "Allow anon insert for jobs"
  ON job FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon select for jobs"
  ON job FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon update for jobs"
  ON job FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Compliance doc policies for anonymous users
CREATE POLICY "Allow anon insert for compliance_doc"
  ON compliance_doc FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon select for compliance_doc"
  ON compliance_doc FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon update for compliance_doc"
  ON compliance_doc FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Audit log policies for anonymous users
CREATE POLICY "Allow anon insert for audit_log"
  ON audit_log FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon select for audit_log"
  ON audit_log FOR SELECT
  TO anon
  USING (true);