-- Migration: S12 IMEI lifecycle + seller payouts
-- Adds 3 enums, 4 tables, and 1 column on products.

-- =========================================================================
-- Enums
-- =========================================================================

CREATE TYPE "ImeiStatus" AS ENUM (
  'IN_STOCK',
  'RESERVED',
  'SHIPPED',
  'ACTIVATED',
  'RETURNED',
  'FAULTY'
);

CREATE TYPE "PayoutStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'REVERSED'
);

CREATE TYPE "WalletEntryKind" AS ENUM (
  'ORDER_CREDIT',
  'COMMISSION_DEBIT',
  'REFUND_DEBIT',
  'PAYOUT_DEBIT',
  'ADJUSTMENT'
);

-- =========================================================================
-- Add column to products
-- =========================================================================

ALTER TABLE "products"
  ADD COLUMN "requires_imei" BOOLEAN NOT NULL DEFAULT TRUE;

-- =========================================================================
-- Add columns to sellers (bank info needed for payouts)
-- =========================================================================

ALTER TABLE "sellers"
  ADD COLUMN "bank_name"        TEXT,
  ADD COLUMN "bank_account"     TEXT,
  ADD COLUMN "bank_account_name" TEXT;

-- =========================================================================
-- imei_records
-- =========================================================================

CREATE TABLE "imei_records" (
  "id"           UUID         PRIMARY KEY DEFAULT uuidv7(),
  "imei"         CHAR(15)     NOT NULL UNIQUE,
  "product_id"   UUID         NOT NULL,
  "seller_id"    UUID         NOT NULL,
  "status"       "ImeiStatus" NOT NULL DEFAULT 'IN_STOCK',
  "order_id"     UUID,
  "order_item_id" UUID,
  "activated_at" TIMESTAMPTZ,
  "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "imei_records_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT,
  CONSTRAINT "imei_records_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT,
  CONSTRAINT "imei_records_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "imei_records_order_item_id_fkey"
    FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL
);

CREATE INDEX "imei_records_seller_id_status_idx" ON "imei_records" ("seller_id", "status");
CREATE INDEX "imei_records_order_id_idx"         ON "imei_records" ("order_id");
CREATE INDEX "imei_records_product_id_status_idx" ON "imei_records" ("product_id", "status");

-- =========================================================================
-- seller_wallets
-- =========================================================================

CREATE TABLE "seller_wallets" (
  "id"            UUID         PRIMARY KEY DEFAULT uuidv7(),
  "seller_id"     UUID         NOT NULL UNIQUE,
  "balance_vnd"   DECIMAL(14,0) NOT NULL DEFAULT 0,
  "pending_vnd"   DECIMAL(14,0) NOT NULL DEFAULT 0,
  "lifetime_vnd"  DECIMAL(14,0) NOT NULL DEFAULT 0,
  "currency"      CHAR(3)      NOT NULL DEFAULT 'VND',
  "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT "seller_wallets_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,

  CONSTRAINT "seller_wallets_balance_nonneg" CHECK ("balance_vnd"   >= 0),
  CONSTRAINT "seller_wallets_pending_nonneg" CHECK ("pending_vnd"   >= 0),
  CONSTRAINT "seller_wallets_lifetime_nonneg" CHECK ("lifetime_vnd" >= 0)
);

-- =========================================================================
-- wallet_entries
-- =========================================================================

CREATE TABLE "wallet_entries" (
  "id"                UUID             PRIMARY KEY DEFAULT uuidv7(),
  "wallet_id"         UUID             NOT NULL,
  "kind"              "WalletEntryKind" NOT NULL,
  "amount_vnd"        DECIMAL(14,0)    NOT NULL,
  "balance_after_vnd" DECIMAL(14,0)    NOT NULL,
  "reference_type"    TEXT,
  "reference_id"      UUID,
  "description"       TEXT,
  "created_at"        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT "wallet_entries_wallet_id_fkey"
    FOREIGN KEY ("wallet_id") REFERENCES "seller_wallets"("id") ON DELETE CASCADE
);

CREATE INDEX "wallet_entries_wallet_id_created_at_idx"
  ON "wallet_entries" ("wallet_id", "created_at" DESC);
CREATE INDEX "wallet_entries_reference_idx"
  ON "wallet_entries" ("reference_type", "reference_id");

-- =========================================================================
-- payouts
-- =========================================================================

CREATE TABLE "payouts" (
  "id"                 UUID            PRIMARY KEY DEFAULT uuidv7(),
  "seller_id"          UUID            NOT NULL,
  "wallet_id"          UUID            NOT NULL,
  "amount_vnd"         DECIMAL(14,0)   NOT NULL,
  "status"             "PayoutStatus"  NOT NULL DEFAULT 'PENDING',
  "bank_name"          TEXT            NOT NULL,
  "bank_account"       TEXT            NOT NULL,
  "bank_account_name"  TEXT            NOT NULL,
  "transfer_ref"       TEXT,
  "failure_reason"     TEXT,
  "requested_at"       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  "processed_at"       TIMESTAMPTZ,
  "paid_at"            TIMESTAMPTZ,

  CONSTRAINT "payouts_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE RESTRICT,
  CONSTRAINT "payouts_wallet_id_fkey"
    FOREIGN KEY ("wallet_id") REFERENCES "seller_wallets"("id") ON DELETE RESTRICT,

  CONSTRAINT "payouts_amount_positive" CHECK ("amount_vnd" > 0)
);

CREATE INDEX "payouts_seller_id_status_idx" ON "payouts" ("seller_id", "status");
CREATE INDEX "payouts_status_requested_at_idx" ON "payouts" ("status", "requested_at");
