-- Migration: S17 payment webhook audit log
-- Adds payment_webhook_events table for idempotent webhook processing
-- and post-hoc debugging.

CREATE TABLE "payment_webhook_events" (
  "id"               UUID          PRIMARY KEY DEFAULT uuidv7(),
  "gateway"          TEXT          NOT NULL,
  "gateway_event_id" TEXT,
  "transaction_ref"  TEXT,
  "signature_valid"  BOOLEAN       NOT NULL,
  "response_code"    TEXT,
  "processed_action" TEXT,
  "payload"          JSONB         NOT NULL,
  "received_at"      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Same gateway + same gateway-supplied event id = duplicate. NULL
  -- gateway_event_id is treated as "no dedup key" so the unique
  -- constraint only catches real retries.
  CONSTRAINT "payment_webhook_events_gateway_event_id_key"
    UNIQUE ("gateway", "gateway_event_id")
);

CREATE INDEX "payment_webhook_events_gateway_received_at_idx"
  ON "payment_webhook_events" ("gateway", "received_at" DESC);
CREATE INDEX "payment_webhook_events_transaction_ref_idx"
  ON "payment_webhook_events" ("transaction_ref")
  WHERE "transaction_ref" IS NOT NULL;
