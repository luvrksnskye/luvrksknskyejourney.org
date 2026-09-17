ALTER TABLE notes ADD COLUMN topic TEXT NOT NULL DEFAULT 'wall' CHECK (topic = 'wall' OR (topic LIKE 'note:%' AND length(topic) BETWEEN 8 AND 69));

CREATE INDEX IF NOT EXISTS notes_topic_feed ON notes (topic, hidden, created_at DESC, id DESC);
