-- Word Rescue Feature Migration
-- Creates tables for struggling words, practice sessions, attempts, app settings, and cash rewards

-- Struggling words captured from Sentence Shenanigans (or added manually by parents)
CREATE TABLE struggling_words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('sentence_shenanigans', 'word_quest', 'manual')),
  source_sentence_id UUID REFERENCES material_sentences(id) ON DELETE SET NULL,

  -- Teaching data
  syllable_breakdown TEXT[], -- e.g., ['fan', 'tas', 'tic']
  example_sentence TEXT,
  phonetic_hint TEXT,

  -- Progress tracking
  times_seen INTEGER DEFAULT 1,
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  current_stage TEXT DEFAULT 'seedling' CHECK (current_stage IN ('seedling', 'growing', 'blooming', 'mastered')),
  mastered_at TIMESTAMP WITH TIME ZONE,

  -- Audio (optional parent recording)
  parent_audio_url TEXT,
  parent_audio_storage_path TEXT,

  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(child_id, word)
);

-- Indexes for efficient querying
CREATE INDEX idx_struggling_words_child ON struggling_words(child_id, is_active, current_stage);
CREATE INDEX idx_struggling_words_practice ON struggling_words(child_id, last_practiced_at);

-- Word Rescue practice sessions
CREATE TABLE word_rescue_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  buddy_pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,

  -- Session stats
  words_practiced INTEGER DEFAULT 0,
  words_correct INTEGER DEFAULT 0,
  words_mastered INTEGER DEFAULT 0, -- Words that hit mastery threshold this session

  -- Rewards earned
  coins_earned INTEGER DEFAULT 0,
  gems_earned INTEGER DEFAULT 0,
  stars_earned INTEGER DEFAULT 0,
  cash_earned DECIMAL(5,2) DEFAULT 0.00,

  -- Timing
  duration_seconds INTEGER,
  session_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for session history
CREATE INDEX idx_word_rescue_sessions_child_date ON word_rescue_sessions(child_id, session_date DESC);

-- Individual word attempts within a session
CREATE TABLE word_rescue_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES word_rescue_sessions(id) ON DELETE CASCADE NOT NULL,
  struggling_word_id UUID REFERENCES struggling_words(id) ON DELETE CASCADE NOT NULL,

  spoken_text TEXT,
  is_correct BOOLEAN NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  used_word_coach BOOLEAN DEFAULT FALSE, -- Did they need the teaching sequence?

  -- Rewards for this attempt
  coins_earned INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for attempt lookups
CREATE INDEX idx_word_rescue_attempts_session ON word_rescue_attempts(session_id);

-- App settings (user-level, applies to all their children)
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Mastery settings
  mastery_correct_threshold INTEGER DEFAULT 2, -- Times correct to consider "mastered"
  mastery_require_different_days BOOLEAN DEFAULT FALSE, -- Must be on different days?

  -- Cash reward settings
  cash_reward_enabled BOOLEAN DEFAULT FALSE,
  cash_per_mastered_word DECIMAL(4,2) DEFAULT 0.10, -- $0.10 per word
  cash_milestone_bonus_enabled BOOLEAN DEFAULT TRUE,
  cash_milestone_10_words DECIMAL(4,2) DEFAULT 1.00, -- Bonus at 10 words
  cash_milestone_25_words DECIMAL(4,2) DEFAULT 3.00, -- Bonus at 25 words
  cash_milestone_50_words DECIMAL(4,2) DEFAULT 5.00, -- Bonus at 50 words
  weekly_cash_cap DECIMAL(5,2) DEFAULT 20.00, -- Maximum per week

  -- Game settings
  words_per_session INTEGER DEFAULT 10,
  show_word_coach_automatically BOOLEAN DEFAULT TRUE, -- Auto-show for new words

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly cash tracking
CREATE TABLE cash_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,

  -- Week tracking (Monday of the week)
  week_start_date DATE NOT NULL,
  words_mastered_this_week INTEGER DEFAULT 0,
  cash_earned DECIMAL(6,2) DEFAULT 0.00,

  -- Payout tracking
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(6,2),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(child_id, week_start_date)
);

-- Index for cash reward lookups
CREATE INDEX idx_cash_rewards_child_week ON cash_rewards(child_id, week_start_date DESC);

-- Enable Row Level Security
ALTER TABLE struggling_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_rescue_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_rescue_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_rewards ENABLE ROW LEVEL SECURITY;

-- struggling_words: Only parent can access their children's words
CREATE POLICY "Users can view struggling words for their children"
  ON struggling_words FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert struggling words for their children"
  ON struggling_words FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update struggling words for their children"
  ON struggling_words FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete struggling words for their children"
  ON struggling_words FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- word_rescue_sessions: Access through children ownership
CREATE POLICY "Users can view word rescue sessions for their children"
  ON word_rescue_sessions FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert word rescue sessions for their children"
  ON word_rescue_sessions FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update word rescue sessions for their children"
  ON word_rescue_sessions FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete word rescue sessions for their children"
  ON word_rescue_sessions FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- word_rescue_attempts: Access through session ownership
CREATE POLICY "Users can view word rescue attempts for their children"
  ON word_rescue_attempts FOR SELECT
  USING (session_id IN (
    SELECT id FROM word_rescue_sessions
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can insert word rescue attempts for their children"
  ON word_rescue_attempts FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM word_rescue_sessions
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

-- app_settings: Users can only access their own settings
CREATE POLICY "Users can view their own settings"
  ON app_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON app_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON app_settings FOR UPDATE
  USING (user_id = auth.uid());

-- cash_rewards: Access through children ownership
CREATE POLICY "Users can view cash rewards for their children"
  ON cash_rewards FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert cash rewards for their children"
  ON cash_rewards FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update cash rewards for their children"
  ON cash_rewards FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- Function to update app_settings.updated_at on change
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- Function to update cash_rewards.updated_at on change
CREATE OR REPLACE FUNCTION update_cash_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cash_rewards_updated_at
  BEFORE UPDATE ON cash_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_cash_rewards_updated_at();

-- Helper function to get the Monday of a given date's week
CREATE OR REPLACE FUNCTION get_week_start_date(input_date DATE)
RETURNS DATE AS $$
BEGIN
  -- Returns the Monday of the week containing the input date
  RETURN input_date - EXTRACT(ISODOW FROM input_date)::INTEGER + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to increment times_seen for existing struggling words (used by capture)
CREATE OR REPLACE FUNCTION increment_struggling_word_seen(p_child_id UUID, p_word TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE struggling_words
  SET times_seen = times_seen + 1
  WHERE child_id = p_child_id AND word = p_word;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for parent audio recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('word-audio', 'word-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for word audio
CREATE POLICY "Users can upload word audio recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'word-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their word audio recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'word-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their word audio recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'word-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
