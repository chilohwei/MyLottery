-- Lotteries table
CREATE TABLE IF NOT EXISTS lotteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '我的抽奖活动',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  config JSONB NOT NULL DEFAULT '{
    "introMessages": [],
    "emojiList": ["🎉", "🎊", "✨", "🌟", "💫"],
    "contactPerson": "",
    "prizes": [],
    "avatarUrl": ""
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_lotteries_clerk_user_id ON lotteries (clerk_user_id);

-- Index for slug lookups (public lottery page)
CREATE INDEX IF NOT EXISTS idx_lotteries_slug ON lotteries (slug);

-- Prize logs table
CREATE TABLE IF NOT EXISTS prize_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES lotteries (id) ON DELETE CASCADE,
  time TIMESTAMPTZ NOT NULL DEFAULT now(),
  prize TEXT NOT NULL,
  prize_text TEXT NOT NULL,
  prize_icon TEXT NOT NULL DEFAULT '',
  notification TEXT,
  ip TEXT,
  location TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing logs by lottery
CREATE INDEX IF NOT EXISTS idx_prize_logs_lottery_id ON prize_logs (lottery_id);

-- Auto-update updated_at on lotteries
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lotteries_updated_at
  BEFORE UPDATE ON lotteries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
