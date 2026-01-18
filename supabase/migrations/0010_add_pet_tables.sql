-- Pet collection for each child
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  pet_type TEXT NOT NULL, -- 'cat', 'dinosaur', 'unicorn', etc.
  name TEXT NOT NULL,
  personality TEXT NOT NULL, -- AI-generated personality description
  image_url TEXT,
  image_storage_path TEXT,
  happiness INTEGER DEFAULT 100 CHECK (happiness >= 0 AND happiness <= 100),
  energy INTEGER DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  experience_points INTEGER DEFAULT 0,
  unlocked_behaviors TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interacted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by child
CREATE INDEX idx_pets_child_id ON pets(child_id);

-- Pet interaction history (for generating contextual behaviors)
CREATE TABLE pet_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('feed', 'play', 'pet', 'talk')),
  interaction_detail JSONB,
  pet_response TEXT,
  happiness_change INTEGER DEFAULT 0,
  energy_change INTEGER DEFAULT 0,
  xp_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for pet interactions
CREATE INDEX idx_pet_interactions_pet_id ON pet_interactions(pet_id);

-- Add pet_reward_id to practice_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_sessions' AND column_name = 'pet_reward_id'
  ) THEN
    ALTER TABLE practice_sessions ADD COLUMN pet_reward_id UUID REFERENCES pets(id);
  END IF;
END $$;

-- Add points_earned to practice_sessions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_sessions' AND column_name = 'points_earned'
  ) THEN
    ALTER TABLE practice_sessions ADD COLUMN points_earned INTEGER DEFAULT 0;
  END IF;
END $$;

-- Child total points for pet unlocks (stored on children table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'children' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE children ADD COLUMN total_points INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pets
CREATE POLICY "Users can view their children's pets"
  ON pets FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can create pets for their children"
  ON pets FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their children's pets"
  ON pets FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their children's pets"
  ON pets FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- RLS Policies for pet_interactions
CREATE POLICY "Users can view their children's pet interactions"
  ON pet_interactions FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create pet interactions for their children's pets"
  ON pet_interactions FOR INSERT
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));
