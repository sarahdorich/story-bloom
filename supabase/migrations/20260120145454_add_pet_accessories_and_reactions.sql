-- Phase 4: Pet Accessories & Rewards System
-- Phase 5: Reading-Connected Pet Reactions

-- =============================================
-- PHASE 4: Accessories & Rewards Tables
-- =============================================

-- Master list of all available accessories
CREATE TABLE accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL, -- Friendly name shown to children
  description TEXT, -- Fun description for the accessory
  type TEXT NOT NULL CHECK (type IN ('hat', 'collar', 'body', 'background', 'effect')),
  image_url TEXT, -- URL to accessory image asset
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  -- Unlock requirements stored as JSONB for flexibility
  -- Examples: { "type": "sessions", "count": 10 }
  --           { "type": "words_mastered", "count": 50 }
  --           { "type": "streak_days", "count": 7 }
  --           { "type": "level", "value": 5 }
  unlock_requirement JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0, -- For display ordering
  is_active BOOLEAN DEFAULT TRUE, -- Can be used to disable/hide accessories
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track which accessories each child has unlocked
CREATE TABLE child_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  accessory_id UUID REFERENCES accessories(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unlock_source TEXT, -- 'achievement', 'milestone', 'reward', 'gift'
  UNIQUE(child_id, accessory_id)
);

-- Track which accessories are equipped on each pet (one per slot)
CREATE TABLE pet_equipped_accessories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  accessory_id UUID REFERENCES accessories(id) ON DELETE CASCADE NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('hat', 'collar', 'body', 'background', 'effect')),
  equipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pet_id, slot) -- Only one accessory per slot per pet
);

-- Indexes for efficient queries
CREATE INDEX idx_accessories_type ON accessories(type);
CREATE INDEX idx_accessories_rarity ON accessories(rarity);
CREATE INDEX idx_child_accessories_child_id ON child_accessories(child_id);
CREATE INDEX idx_child_accessories_accessory_id ON child_accessories(accessory_id);
CREATE INDEX idx_pet_equipped_accessories_pet_id ON pet_equipped_accessories(pet_id);

-- =============================================
-- PHASE 5: Reading-Connected Pet Reactions
-- =============================================

-- Add reading-related fields to pets table
ALTER TABLE pets ADD COLUMN IF NOT EXISTS last_reading_session_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS reading_streak_days INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_mood TEXT DEFAULT 'happy'
  CHECK (current_mood IN ('excited', 'happy', 'proud', 'content', 'sleepy', 'sad', 'lonely'));
ALTER TABLE pets ADD COLUMN IF NOT EXISTS mood_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Track reading reactions for analytics and history
CREATE TABLE pet_reading_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  practice_session_id UUID REFERENCES practice_sessions(id) ON DELETE SET NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN (
    'session_complete', 'streak_milestone', 'word_mastery',
    'perfect_session', 'level_up', 'comeback', 'daily_first'
  )),
  reaction_mood TEXT NOT NULL, -- The mood shown during reaction
  reaction_message TEXT, -- AI-generated or template message
  words_practiced INTEGER DEFAULT 0,
  accuracy_percent INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  xp_bonus INTEGER DEFAULT 0, -- Any bonus XP awarded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient reaction lookups
CREATE INDEX idx_pet_reading_reactions_pet_id ON pet_reading_reactions(pet_id);
CREATE INDEX idx_pet_reading_reactions_created_at ON pet_reading_reactions(created_at);
CREATE INDEX idx_pet_reading_reactions_type ON pet_reading_reactions(reaction_type);

-- Add reading streak tracking to children table
ALTER TABLE children ADD COLUMN IF NOT EXISTS last_practice_date DATE;
ALTER TABLE children ADD COLUMN IF NOT EXISTS current_streak_days INTEGER DEFAULT 0;
ALTER TABLE children ADD COLUMN IF NOT EXISTS longest_streak_days INTEGER DEFAULT 0;
ALTER TABLE children ADD COLUMN IF NOT EXISTS total_words_mastered INTEGER DEFAULT 0;
ALTER TABLE children ADD COLUMN IF NOT EXISTS total_practice_sessions INTEGER DEFAULT 0;

-- =============================================
-- RLS Policies for Accessories
-- =============================================

ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_equipped_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_reading_reactions ENABLE ROW LEVEL SECURITY;

-- Accessories are readable by all authenticated users
CREATE POLICY "Authenticated users can view accessories"
  ON accessories FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Child accessories policies
CREATE POLICY "Users can view their children's accessories"
  ON child_accessories FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can unlock accessories for their children"
  ON child_accessories FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can remove their children's accessories"
  ON child_accessories FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- Pet equipped accessories policies
CREATE POLICY "Users can view their children's pet equipped accessories"
  ON pet_equipped_accessories FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can equip accessories on their children's pets"
  ON pet_equipped_accessories FOR INSERT
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can update equipped accessories on their children's pets"
  ON pet_equipped_accessories FOR UPDATE
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can unequip accessories from their children's pets"
  ON pet_equipped_accessories FOR DELETE
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- Pet reading reactions policies
CREATE POLICY "Users can view their children's pet reading reactions"
  ON pet_reading_reactions FOR SELECT
  USING (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create reading reactions for their children's pets"
  ON pet_reading_reactions FOR INSERT
  WITH CHECK (pet_id IN (
    SELECT p.id FROM pets p
    JOIN children c ON p.child_id = c.id
    WHERE c.user_id = auth.uid()
  ));

-- =============================================
-- Seed Initial Accessories
-- =============================================

INSERT INTO accessories (name, display_name, description, type, rarity, unlock_requirement, sort_order) VALUES
-- Common accessories (easy to unlock)
('bow_red', 'Red Bow', 'A cheerful red bow!', 'hat', 'common', '{"type": "sessions", "count": 3}', 10),
('collar_blue', 'Blue Collar', 'A sparkly blue collar.', 'collar', 'common', '{"type": "sessions", "count": 5}', 20),
('scarf_green', 'Green Scarf', 'A cozy green scarf.', 'body', 'common', '{"type": "words_mastered", "count": 10}', 30),
('bg_clouds', 'Fluffy Clouds', 'Float among the clouds!', 'background', 'common', '{"type": "sessions", "count": 7}', 40),
('effect_sparkle', 'Sparkle Trail', 'Leave sparkles wherever you go!', 'effect', 'common', '{"type": "streak_days", "count": 3}', 50),

-- Rare accessories (moderate effort)
('crown_silver', 'Silver Crown', 'A shiny silver crown fit for royalty!', 'hat', 'rare', '{"type": "sessions", "count": 15}', 110),
('collar_rainbow', 'Rainbow Collar', 'All the colors of the rainbow!', 'collar', 'rare', '{"type": "words_mastered", "count": 30}', 120),
('cape_purple', 'Purple Cape', 'A majestic purple cape.', 'body', 'rare', '{"type": "streak_days", "count": 7}', 130),
('bg_forest', 'Enchanted Forest', 'A magical forest background.', 'background', 'rare', '{"type": "sessions", "count": 20}', 140),
('effect_hearts', 'Floating Hearts', 'Hearts float around your pet!', 'effect', 'rare', '{"type": "words_mastered", "count": 50}', 150),

-- Epic accessories (significant achievement)
('crown_gold', 'Golden Crown', 'The most magnificent golden crown!', 'hat', 'epic', '{"type": "sessions", "count": 30}', 210),
('collar_diamond', 'Diamond Collar', 'Sparkling with diamonds!', 'collar', 'epic', '{"type": "words_mastered", "count": 75}', 220),
('wings_angel', 'Angel Wings', 'Beautiful feathered wings.', 'body', 'epic', '{"type": "streak_days", "count": 14}', 230),
('bg_space', 'Outer Space', 'Adventure among the stars!', 'background', 'epic', '{"type": "sessions", "count": 40}', 240),
('effect_stars', 'Starshine', 'Surrounded by twinkling stars!', 'effect', 'epic', '{"type": "streak_days", "count": 21}', 250),

-- Legendary accessories (exceptional dedication)
('crown_cosmic', 'Cosmic Crown', 'A crown made of stardust and dreams!', 'hat', 'legendary', '{"type": "sessions", "count": 50}', 310),
('collar_legendary', 'Legendary Collar', 'Only the most dedicated readers earn this!', 'collar', 'legendary', '{"type": "words_mastered", "count": 100}', 320),
('wings_dragon', 'Dragon Wings', 'Magnificent dragon wings!', 'body', 'legendary', '{"type": "streak_days", "count": 30}', 330),
('bg_rainbow', 'Rainbow Paradise', 'A beautiful rainbow world!', 'background', 'legendary', '{"type": "sessions", "count": 75}', 340),
('effect_aurora', 'Aurora Borealis', 'The northern lights dance around your pet!', 'effect', 'legendary', '{"type": "streak_days", "count": 60}', 350);

-- =============================================
-- Comments for Documentation
-- =============================================

COMMENT ON TABLE accessories IS 'Master list of all available pet accessories that can be unlocked';
COMMENT ON TABLE child_accessories IS 'Tracks which accessories each child has unlocked';
COMMENT ON TABLE pet_equipped_accessories IS 'Tracks which accessories are currently equipped on each pet';
COMMENT ON TABLE pet_reading_reactions IS 'Records pet reactions to reading activities for engagement tracking';

COMMENT ON COLUMN accessories.unlock_requirement IS 'JSON object defining how to unlock: {type: "sessions"|"words_mastered"|"streak_days"|"level", count: number}';
COMMENT ON COLUMN pets.current_mood IS 'Current emotional state affecting pet display and reactions';
COMMENT ON COLUMN pets.reading_streak_days IS 'Current consecutive days of reading practice';
COMMENT ON COLUMN children.current_streak_days IS 'Number of consecutive days the child has practiced';
COMMENT ON COLUMN children.longest_streak_days IS 'The child''s longest ever practice streak';
