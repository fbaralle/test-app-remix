CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  coin_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, coin_id)
);
