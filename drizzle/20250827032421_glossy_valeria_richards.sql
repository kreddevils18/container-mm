CREATE INDEX "vehicles_search_vector_idx" ON "vehicles" USING gin ((
        setweight(to_tsvector('simple', COALESCE("license_plate", '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE("driver_name", '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE("driver_phone", '')), 'C')
      ));