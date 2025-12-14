/*
  # Add Stripe Payment Fields
  
  1. Changes
    - Add `stripe_payment_intent_id` to payment table for tracking Stripe Payment Intents
    - Add `stripe_charge_id` for tracking the charge ID
    - Add `stripe_customer_id` for tracking Stripe customer records
    - Add `card_last4` for displaying card information
    - Add `card_brand` for displaying card brand (Visa, Mastercard, etc.)
    - Add `processing_fee` for tracking Stripe processing fees
    
  2. Notes
    - These fields enable full Stripe payment tracking
    - Supports both deposit and final payment flows
    - Allows for proper receipt generation with card details
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE payment ADD COLUMN stripe_payment_intent_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'stripe_charge_id'
  ) THEN
    ALTER TABLE payment ADD COLUMN stripe_charge_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE payment ADD COLUMN stripe_customer_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'card_last4'
  ) THEN
    ALTER TABLE payment ADD COLUMN card_last4 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'card_brand'
  ) THEN
    ALTER TABLE payment ADD COLUMN card_brand text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment' AND column_name = 'processing_fee'
  ) THEN
    ALTER TABLE payment ADD COLUMN processing_fee numeric DEFAULT 0;
  END IF;
END $$;

-- Create index on stripe_payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_stripe_intent ON payment(stripe_payment_intent_id);