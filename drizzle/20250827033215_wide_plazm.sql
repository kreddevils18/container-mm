CREATE INDEX "cost_types_search_vector_idx" ON "cost_types" USING gin ((
        setweight(to_tsvector('simple', COALESCE("name", '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE("description", '')), 'B')
      ));--> statement-breakpoint
CREATE INDEX "costs_search_vector_idx" ON "costs" USING gin ((
        setweight(to_tsvector('simple', COALESCE("description", '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE("amount"::text, '')), 'B')
      ));