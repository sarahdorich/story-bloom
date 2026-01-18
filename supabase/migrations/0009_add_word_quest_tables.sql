-- Word Quest Feature Migration
-- Creates tables for word lists, progress tracking, and practice sessions

-- Word lists organized by reading level
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word TEXT NOT NULL,
  reading_level TEXT NOT NULL,
  category TEXT, -- 'sight_word', 'phonics', 'vocabulary'
  difficulty_rank INTEGER NOT NULL DEFAULT 1, -- 1-10 within level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_reading_level CHECK (reading_level IN (
    'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade',
    '3rd Grade', '4th Grade', '5th Grade', '6th Grade'
  ))
);

-- Unique constraint to prevent duplicate words per level
CREATE UNIQUE INDEX idx_word_lists_word_level ON word_lists(word, reading_level);

-- Index for efficient querying by reading level
CREATE INDEX idx_word_lists_level ON word_lists(reading_level, difficulty_rank);

-- Child's word practice progress
CREATE TABLE word_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  word_list_id UUID REFERENCES word_lists(id) ON DELETE CASCADE NOT NULL,
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0, -- 0-5 (0=new, 5=mastered)
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(child_id, word_list_id)
);

-- Index for efficient child lookups
CREATE INDEX idx_word_progress_child ON word_progress(child_id, mastery_level);

-- Practice sessions for tracking daily progress
CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  words_practiced INTEGER DEFAULT 0,
  words_correct INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  session_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for daily/weekly summaries
CREATE INDEX idx_practice_sessions_child_date ON practice_sessions(child_id, session_date DESC);

-- Enable Row Level Security
ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- word_lists: Public read access for authenticated users
CREATE POLICY "Authenticated users can read word lists"
  ON word_lists FOR SELECT
  TO authenticated
  USING (true);

-- word_progress: Only parent can access their children's progress
CREATE POLICY "Users can view word progress for their children"
  ON word_progress FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert word progress for their children"
  ON word_progress FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update word progress for their children"
  ON word_progress FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete word progress for their children"
  ON word_progress FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- practice_sessions: Only parent can access their children's sessions
CREATE POLICY "Users can view practice sessions for their children"
  ON practice_sessions FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert practice sessions for their children"
  ON practice_sessions FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update practice sessions for their children"
  ON practice_sessions FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete practice sessions for their children"
  ON practice_sessions FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));
