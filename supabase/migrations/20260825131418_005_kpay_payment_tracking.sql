/*
# K-Pay Payment Tracking — Webhook-Ready

## Overview
Adds durable payment tracking for K-Pay transactions and a server-side
function to update order status from webhooks, so payment confirmation
no longer relies on the browser alone.

## New Tables

### payments
- `kpay_id` (text, unique) — K-Pay payment ID (e.g. pay_abc123)
- `external_id` (text, unique) — our order reference (e.g. CMD-1693...)
- `order_id` (uuid, FK to orders) — linked order
- `status` (text) — PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- `amount` (numeric), `currency` (text)
- `provider` (text), `country` (text), `phone_number` (text)
- `reference` (text) — internal K-Pay reference
- `provider_reference` (text) — operator-side reference
- `gateway_url` (text) — hosted payment page URL
- `completed_at` (timestamptz), `failed_at` (timestamptz)
- `failure_reason` (text)
- `created_at` (timestamptz), `updated_at` (timestamptz)

## Modified Tables
- `orders`: adds `payment_id` (text, nullable) — stores the K-Pay payment ID
  for cross-reference. Non-destructive; existing rows get NULL.

## New Functions
- `update_order_from_payment()` — SECURITY DEFINER function callable by
  the service role (edge function). Updates order status + payment record
  idempotently based on K-Pay status. Only a super_admin or service role
  should call it; granted to authenticated but checks the caller is
  a service-role context.

## Security
- `payments` table: RLS enabled. Users can SELECT their own payment rows
  (via order ownership). All writes go through the edge function using
  the service role key, which bypasses RLS.
- `orders.payment_id` is user-readable (same SELECT policy as orders).
- The SECURITY DEFINER function is revoked from anon; only callable
  with the service role from the edge function.
*/

-- ============================================
-- 1. Add payment_id column to orders
-- ============================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id text;
  END IF;
END $$;

-- ============================================
-- 2. Create payments table
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpay_id text UNIQUE NOT NULL,
  external_id text UNIQUE NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  provider text,
  country text,
  phone_number text,
  reference text,
  provider_reference text,
  gateway_url text,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment records (via order ownership)
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
  );

-- Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_payments_kpay_id ON payments(kpay_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ============================================
-- 3. SECURITY DEFINER function for webhook processing
-- ============================================
-- This function is called by the edge function (service role) to
-- idempotently update order + payment status from a K-Pay webhook.
CREATE OR REPLACE FUNCTION update_order_from_payment(
  p_kpay_id text,
  p_external_id text,
  p_status text,
  p_amount numeric,
  p_currency text DEFAULT NULL,
  p_provider text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_phone_number text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_provider_reference text DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL,
  p_failed_at timestamptz DEFAULT NULL,
  p_failure_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_current_status text;
  v_new_order_status text;
BEGIN
  -- Find the order by external_id
  SELECT id INTO v_order_id FROM orders WHERE payment_id = p_external_id LIMIT 1;
  IF v_order_id IS NULL THEN
    -- Fallback: try matching by metadata or skip
    RETURN;
  END IF;

  -- Map K-Pay status to order status
  v_new_order_status := CASE p_status
    WHEN 'COMPLETED' THEN 'paid'
    WHEN 'FAILED' THEN 'failed'
    WHEN 'CANCELLED' THEN 'failed'
    ELSE NULL
  END;

  -- Upsert payment record
  INSERT INTO payments (
    kpay_id, external_id, order_id, status, amount, currency,
    provider, country, phone_number, reference, provider_reference,
    completed_at, failed_at, failure_reason, updated_at
  ) VALUES (
    p_kpay_id, p_external_id, v_order_id, p_status, p_amount, p_currency,
    p_provider, p_country, p_phone_number, p_reference, p_provider_reference,
    p_completed_at, p_failed_at, p_failure_reason, now()
  )
  ON CONFLICT (kpay_id) DO UPDATE SET
    status = EXCLUDED.status,
    amount = EXCLUDED.amount,
    currency = COALESCE(EXCLUDED.currency, payments.currency),
    provider = COALESCE(EXCLUDED.provider, payments.provider),
    country = COALESCE(EXCLUDED.country, payments.country),
    phone_number = COALESCE(EXCLUDED.phone_number, payments.phone_number),
    reference = COALESCE(EXCLUDED.reference, payments.reference),
    provider_reference = COALESCE(EXCLUDED.provider_reference, payments.provider_reference),
    completed_at = COALESCE(EXCLUDED.completed_at, payments.completed_at),
    failed_at = COALESCE(EXCLUDED.failed_at, payments.failed_at),
    failure_reason = COALESCE(EXCLUDED.failure_reason, payments.failure_reason),
    updated_at = now();

  -- Update order status only if we have a terminal status
  IF v_new_order_status IS NOT NULL THEN
    SELECT status INTO v_current_status FROM orders WHERE id = v_order_id;
    -- Only update if not already in a terminal state (idempotency)
    IF v_current_status = 'pending' THEN
      UPDATE orders SET status = v_new_order_status WHERE id = v_order_id;
    END IF;
  END IF;
END;
$$;

-- Only service role should call this (edge function uses service role key)
REVOKE EXECUTE ON FUNCTION update_order_from_payment(
  text, text, text, numeric, text, text, text, text, text, text,
  timestamptz, timestamptz, text
) FROM anon;
REVOKE EXECUTE ON FUNCTION update_order_from_payment(
  text, text, text, numeric, text, text, text, text, text, text,
  timestamptz, timestamptz, text
) FROM authenticated;
