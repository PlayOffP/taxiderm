/*
  # Add anonymous user policies for payment table

  1. Changes
    - Add RLS policies for anonymous users on payment table to support kiosk payment processing
  
  2. Security
    - Allow anon users to insert payment records (for cash/card payments in kiosk mode)
    - Allow anon users to read payment records (for receipt viewing)
    - This enables the kiosk intake workflow to process payments without authentication
*/

-- Payment table policies for anonymous users
CREATE POLICY "Allow anon insert for payment"
  ON payment FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon select for payment"
  ON payment FOR SELECT
  TO anon
  USING (true);
