/*
  # Update workflow to support new process flow

  1. Changes to `job` table
    - Add `deposit_paid` boolean to track 50% deposit payment
    - Add `deposit_amount` to store the deposit value
    - Add `mount_requested` boolean for mount/no mount decision
    - Add `hide_return_requested` boolean for hide return decision
    - Update status enum to include new workflow stages

  2. Changes to `payment` table
    - Add `payment_type` to distinguish between deposit and final payment

  3. Security
    - Maintain existing RLS policies
*/

-- Add new fields to job table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job' AND column_name = 'deposit_paid'
  ) THEN
    ALTER TABLE job ADD COLUMN deposit_paid boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE job ADD COLUMN deposit_amount numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job' AND column_name = 'mount_requested'
  ) THEN
    ALTER TABLE job ADD COLUMN mount_requested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job' AND column_name = 'hide_return_requested'
  ) THEN
    ALTER TABLE job ADD COLUMN hide_return_requested boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'job' AND column_name = 'taxidermy_stage'
  ) THEN
    ALTER TABLE job ADD COLUMN taxidermy_stage text;
    ALTER TABLE job ADD CONSTRAINT job_taxidermy_stage_check 
      CHECK (taxidermy_stage IS NULL OR taxidermy_stage IN (
        'prep', 'mounting', 'painting', 'drying', 'finishing', 'qa'
      ));
  END IF;
END $$;

-- Add payment_type to payment table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE payment ADD COLUMN payment_type text DEFAULT 'final';
    ALTER TABLE payment ADD CONSTRAINT payment_type_check 
      CHECK (payment_type IN ('deposit', 'final', 'refund'));
  END IF;
END $$;

-- Update status constraint to include new stages
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE job DROP CONSTRAINT IF EXISTS job_status_check;
  
  -- Add new constraint with expanded statuses
  ALTER TABLE job ADD CONSTRAINT job_status_check 
    CHECK (status IN (
      'received', 
      'in_cooler', 
      'hide_removed',
      'cut_and_bagged',
      'skinned_quartered', 
      'processing', 
      'freezer', 
      'ready', 
      'picked_up', 
      'paid'
    ));
END $$;
