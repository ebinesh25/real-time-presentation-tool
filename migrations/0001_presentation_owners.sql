CREATE TABLE IF NOT EXISTS presentation_owners (
  presentation_id integer PRIMARY KEY REFERENCES presentations(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  original_blob_url text NOT NULL,
  original_filename text NOT NULL
);
