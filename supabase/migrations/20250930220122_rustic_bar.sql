/*
  # Fix Customer RLS Policy for Anonymous Users

  1. Security Changes
    - Add policy to allow anonymous users to insert customer records
    - This is needed for the kiosk mode where users aren't authenticated
    - Maintains existing authenticated user policies

  2. Changes Made
    - Create policy "Allow anon insert for customers" for INSERT operations by anon role
    - Allows unauthenticated users to create customer records in kiosk mode
*/

-- Create policy to allow anonymous users to insert customer records
CREATE POLICY "Allow anon insert for customers" 
  ON public.customer 
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Also allow anonymous users to select customers (needed for duplicate checking)
CREATE POLICY "Allow anon select for customers" 
  ON public.customer 
  FOR SELECT 
  TO anon 
  USING (true);