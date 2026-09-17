CREATE TABLE IF NOT EXISTS visit_totals (
  page TEXT PRIMARY KEY CHECK (page IN ('about')),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  updated_at INTEGER NOT NULL DEFAULT 0
) STRICT;

CREATE TABLE IF NOT EXISTS visit_days (
  page TEXT NOT NULL CHECK (page IN ('about')),
  day TEXT NOT NULL CHECK (length(day) = 10),
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  PRIMARY KEY (page, day)
) STRICT;

CREATE TABLE IF NOT EXISTS visit_seen (
  visitor TEXT PRIMARY KEY CHECK (length(visitor) = 32),
  day TEXT NOT NULL CHECK (length(day) = 10)
) STRICT;

CREATE INDEX IF NOT EXISTS visit_seen_day ON visit_seen (day);

INSERT OR IGNORE INTO visit_totals (page, total, updated_at) VALUES ('about', 0, 0);
