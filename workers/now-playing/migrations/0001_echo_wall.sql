CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  created_at INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT '' CHECK (length(name) <= 24),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 140),
  sticker TEXT NOT NULL CHECK (length(sticker) <= 16),
  track_name TEXT CHECK (track_name IS NULL OR length(track_name) <= 256),
  track_artist TEXT CHECK (track_artist IS NULL OR length(track_artist) <= 256),
  track_album TEXT CHECK (track_album IS NULL OR length(track_album) <= 256),
  track_url TEXT CHECK (track_url IS NULL OR length(track_url) <= 512),
  track_image TEXT CHECK (track_image IS NULL OR length(track_image) <= 512),
  track_thumb TEXT CHECK (track_thumb IS NULL OR length(track_thumb) <= 512),
  track_live INTEGER NOT NULL DEFAULT 0 CHECK (track_live IN (0, 1)),
  track_played_at INTEGER,
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  author_hash TEXT NOT NULL CHECK (length(author_hash) = 32)
) STRICT;

CREATE INDEX IF NOT EXISTS notes_feed ON notes (hidden, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS notes_author ON notes (author_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_created ON notes (created_at);
