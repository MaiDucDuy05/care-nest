-- Migration: S15 reviews + seller rating aggregation
-- Adds the reviews table; rating aggregates live on sellers (already present).

-- =========================================================================
-- reviews
-- One review per order. sellerId is denormalized so we can aggregate
-- without joining orders. rating is a 1..5 integer; comment is optional.
-- =========================================================================

CREATE TABLE "reviews" (
  "id"         UUID          PRIMARY KEY DEFAULT uuidv7(),
  "order_id"   UUID          NOT NULL,
  "seller_id"  UUID          NOT NULL,
  "buyer_id"   UUID          NOT NULL,
  "rating"     INTEGER       NOT NULL,
  "comment"    TEXT,
  "created_at" TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5),

  CONSTRAINT "reviews_order_id_fkey"
    FOREIGN KEY ("order_id")  REFERENCES "orders"("id")   ON DELETE CASCADE,
  CONSTRAINT "reviews_seller_id_fkey"
    FOREIGN KEY ("seller_id") REFERENCES "sellers"("id") ON DELETE CASCADE,
  CONSTRAINT "reviews_buyer_id_fkey"
    FOREIGN KEY ("buyer_id")  REFERENCES "users"("id")   ON DELETE RESTRICT
);

-- One review per order.
CREATE UNIQUE INDEX "reviews_order_id_key" ON "reviews" ("order_id");

-- Aggregation queries: "recent reviews for a seller".
CREATE INDEX "reviews_seller_id_created_at_idx"
  ON "reviews" ("seller_id", "created_at" DESC);

-- =========================================================================
-- Trigger: keep sellers.rating_avg / rating_count in sync on every insert.
-- Done in plpgsql so the aggregation is consistent with what public storefronts
-- read. Update / delete on reviews are not exposed by API in S15, so we only
-- handle the INSERT case here. If we ever allow edits, we'll add an
-- AFTER UPDATE/DELETE trigger that recomputes from scratch.
-- =========================================================================

CREATE OR REPLACE FUNCTION "reviews_after_insert_recompute_seller_rating"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg   NUMERIC(3, 2);
  v_count INTEGER;
BEGIN
  SELECT
    COALESCE(AVG("rating"), 0)::NUMERIC(3, 2),
    COUNT(*)::INTEGER
  INTO v_avg, v_count
  FROM "reviews"
  WHERE "seller_id" = NEW."seller_id";

  UPDATE "sellers"
  SET "rating_avg"   = v_avg,
      "rating_count" = v_count,
      "updated_at"   = NOW()
  WHERE "id" = NEW."seller_id";

  RETURN NEW;
END;
$$;

CREATE TRIGGER "reviews_after_insert_recompute_seller_rating"
  AFTER INSERT ON "reviews"
  FOR EACH ROW
  EXECUTE FUNCTION "reviews_after_insert_recompute_seller_rating"();
