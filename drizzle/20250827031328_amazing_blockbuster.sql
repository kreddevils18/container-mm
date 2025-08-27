CREATE INDEX "orders_search_vector_idx" ON "orders" USING gin ((
          setweight(to_tsvector('simple', COALESCE("container_code", '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE("description", '')), 'B')
        ));