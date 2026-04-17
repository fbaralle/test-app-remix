CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'public',
  coin_id TEXT NOT NULL,
  coin_name TEXT,
  coin_symbol TEXT,
  coin_image TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, coin_id)
);

-- Seed with some initial favorites
INSERT OR IGNORE INTO favorites (user_id, coin_id, coin_name, coin_symbol, coin_image, created_at) VALUES
  ('public', 'bitcoin', 'Bitcoin', 'BTC', 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png', 1713200000000),
  ('public', 'ethereum', 'Ethereum', 'ETH', 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png', 1713200100000),
  ('public', 'solana', 'Solana', 'SOL', 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png', 1713200200000);
