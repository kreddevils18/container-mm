DROP INDEX "customers_search_vector_idx";--> statement-breakpoint
CREATE INDEX "customers_search_vector_idx" ON "customers" USING gin ((
      setweight(to_tsvector('simple', COALESCE("name", '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE("email", '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE("address", '')), 'C') ||
      setweight(to_tsvector('simple', COALESCE("tax_id", '')), 'D')
    ));