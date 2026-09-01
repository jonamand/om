/*
# Link K-Pay external references to orders

## Overview
Adds a dedicated non-destructive column for the external transaction
reference sent to K-Pay. This separates our order reference from K-Pay's
payment ID and lets signed webhooks find the correct order reliably.

## Modified Tables
- `orders.payment_external_id` (text, unique, nullable) — the externalId
  submitted to K-Pay.
- Existing `orders.payment_id` remains the K-Pay payment ID.

## Modified Functions
- `update_order_from_payment()` now looks up orders by
  `payment_external_id`, with a legacy fallback to `payment_id`.

## Security
- Existing owner-scoped order policies remain unchanged.
- The webhook update function remains restricted to the server-side service role.

## Important Notes
1. No existing rows or columns are deleted or renamed.
2. The unique index prevents duplicate external references.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_external_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_external_id text;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_external_id
  ON orders(payment_external_id)
  WHERE payment_external_id IS NOT NULL;

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
  SELECT id INTO v_order_id
  FROM orders
  WHERE payment_external_id = p_external_id OR payment_id = p_external_id
  LIMIT 1;

  IF v_order_id IS NULL THEN
    RETURN;
  END IF;

  v_new_order_status := CASE p_status
    WHEN 'COMPLETED' THEN 'paid'
    WHEN 'FAILED' THEN 'failed'
    WHEN 'CANCELLED' THEN 'failed'
    ELSE NULL
  END;

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

  IF v_new_order_status IS NOT NULL THEN
    SELECT status INTO v_current_status FROM orders WHERE id = v_order_id;
    IF v_current_status = 'pending' THEN
      UPDATE orders SET status = v_new_order_status, payment_id = p_kpay_id
      WHERE id = v_order_id;
    END IF;
  END IF;
END;
$$;
