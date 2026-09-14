ALTER TABLE notes ADD COLUMN owner INTEGER NOT NULL DEFAULT 0 CHECK (owner IN (0, 1));

ALTER TABLE notes ADD COLUMN parent_id TEXT REFERENCES notes (id) ON DELETE CASCADE CHECK (parent_id IS NULL OR length(parent_id) = 36);

CREATE INDEX IF NOT EXISTS notes_thread ON notes (parent_id, hidden, created_at DESC, id DESC);
