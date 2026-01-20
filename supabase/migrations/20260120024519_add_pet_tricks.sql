-- Track trick performance and mastery for pets
CREATE TABLE pet_tricks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  trick_name TEXT NOT NULL,
  times_performed INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  last_performed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pet_id, trick_name)
);

-- Index for efficient lookups by pet
CREATE INDEX idx_pet_tricks_pet_id ON pet_tricks(pet_id);

-- Enable RLS
ALTER TABLE pet_tricks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their children's pet tricks
CREATE POLICY "Users can view their children's pet tricks"
  ON pet_tricks FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Policy: Users can insert tricks for their children's pets
CREATE POLICY "Users can insert their children's pet tricks"
  ON pet_tricks FOR INSERT
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Policy: Users can update their children's pet tricks
CREATE POLICY "Users can update their children's pet tricks"
  ON pet_tricks FOR UPDATE
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Policy: Users can delete their children's pet tricks
CREATE POLICY "Users can delete their children's pet tricks"
  ON pet_tricks FOR DELETE
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Add comments for documentation
COMMENT ON TABLE pet_tricks IS 'Tracks individual trick performance and mastery levels for each pet';
COMMENT ON COLUMN pet_tricks.trick_name IS 'Name of the trick (matches unlocked_behaviors in pets table)';
COMMENT ON COLUMN pet_tricks.times_performed IS 'Total number of times this trick has been performed';
COMMENT ON COLUMN pet_tricks.mastery_level IS 'Mastery level 0-5, increases every 5 performances';
