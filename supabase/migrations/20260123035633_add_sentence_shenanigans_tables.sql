-- Sentence Shenanigans Feature Migration
-- Creates tables for reading materials, sentences, practice sessions, and attempts

-- Reading materials uploaded by parents (scanned worksheets, book pages, etc.)
CREATE TABLE reading_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  image_storage_path TEXT,
  sentence_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient child lookups
CREATE INDEX idx_reading_materials_child ON reading_materials(child_id, is_active);

-- Individual sentences extracted from reading materials
CREATE TABLE material_sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES reading_materials(id) ON DELETE CASCADE NOT NULL,
  sentence_text TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  ocr_confidence REAL, -- 0.0-1.0 confidence from OCR
  is_edited BOOLEAN DEFAULT FALSE, -- True if parent manually edited
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  best_accuracy REAL, -- Best accuracy percentage achieved
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient ordering within a material
CREATE INDEX idx_material_sentences_material ON material_sentences(material_id, display_order);

-- Practice sessions for sentence reading
CREATE TABLE sentence_practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES reading_materials(id) ON DELETE CASCADE NOT NULL,
  sentences_practiced INTEGER DEFAULT 0,
  sentences_correct INTEGER DEFAULT 0, -- Sentences with >= 85% word accuracy
  total_words_attempted INTEGER DEFAULT 0,
  total_words_correct INTEGER DEFAULT 0,
  accuracy_percentage REAL, -- Overall session accuracy
  duration_seconds INTEGER,
  pet_reward_id UUID REFERENCES pets(id),
  points_earned INTEGER DEFAULT 0,
  session_date DATE DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for history lookups
CREATE INDEX idx_sentence_sessions_child_date ON sentence_practice_sessions(child_id, session_date DESC);
CREATE INDEX idx_sentence_sessions_material ON sentence_practice_sessions(material_id);

-- Individual sentence attempts within a session
CREATE TABLE sentence_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sentence_practice_sessions(id) ON DELETE CASCADE NOT NULL,
  sentence_id UUID REFERENCES material_sentences(id) ON DELETE CASCADE NOT NULL,
  spoken_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  words_correct INTEGER NOT NULL,
  accuracy_percentage REAL NOT NULL,
  word_results JSONB, -- [{"word": "the", "spoken": "the", "correct": true, "position": 0}, ...]
  attempt_number INTEGER DEFAULT 1,
  is_correct BOOLEAN NOT NULL, -- True if accuracy >= 85%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for session lookups
CREATE INDEX idx_sentence_attempts_session ON sentence_attempts(session_id);

-- Enable Row Level Security
ALTER TABLE reading_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentence_attempts ENABLE ROW LEVEL SECURITY;

-- reading_materials: Only parent can access their children's materials
CREATE POLICY "Users can view reading materials for their children"
  ON reading_materials FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert reading materials for their children"
  ON reading_materials FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update reading materials for their children"
  ON reading_materials FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete reading materials for their children"
  ON reading_materials FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- material_sentences: Access through reading_materials ownership
CREATE POLICY "Users can view sentences for their materials"
  ON material_sentences FOR SELECT
  USING (material_id IN (
    SELECT id FROM reading_materials
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can insert sentences for their materials"
  ON material_sentences FOR INSERT
  WITH CHECK (material_id IN (
    SELECT id FROM reading_materials
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can update sentences for their materials"
  ON material_sentences FOR UPDATE
  USING (material_id IN (
    SELECT id FROM reading_materials
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can delete sentences for their materials"
  ON material_sentences FOR DELETE
  USING (material_id IN (
    SELECT id FROM reading_materials
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

-- sentence_practice_sessions: Access through children ownership
CREATE POLICY "Users can view sentence sessions for their children"
  ON sentence_practice_sessions FOR SELECT
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert sentence sessions for their children"
  ON sentence_practice_sessions FOR INSERT
  WITH CHECK (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can update sentence sessions for their children"
  ON sentence_practice_sessions FOR UPDATE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete sentence sessions for their children"
  ON sentence_practice_sessions FOR DELETE
  USING (child_id IN (SELECT id FROM children WHERE user_id = auth.uid()));

-- sentence_attempts: Access through session ownership
CREATE POLICY "Users can view attempts for their children's sessions"
  ON sentence_attempts FOR SELECT
  USING (session_id IN (
    SELECT id FROM sentence_practice_sessions
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can insert attempts for their children's sessions"
  ON sentence_attempts FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM sentence_practice_sessions
    WHERE child_id IN (SELECT id FROM children WHERE user_id = auth.uid())
  ));

-- Storage bucket for scanned reading materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('reading-materials', 'reading-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Users can only access their own folder
CREATE POLICY "Users can upload reading material images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reading-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their reading material images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reading-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their reading material images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reading-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their reading material images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reading-materials'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Function to update reading_materials.updated_at on change
CREATE OR REPLACE FUNCTION update_reading_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reading_materials_updated_at
  BEFORE UPDATE ON reading_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_materials_updated_at();

-- Function to update sentence_count on reading_materials when sentences change
CREATE OR REPLACE FUNCTION update_material_sentence_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reading_materials
    SET sentence_count = (
      SELECT COUNT(*) FROM material_sentences
      WHERE material_id = NEW.material_id AND is_active = TRUE
    )
    WHERE id = NEW.material_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reading_materials
    SET sentence_count = (
      SELECT COUNT(*) FROM material_sentences
      WHERE material_id = OLD.material_id AND is_active = TRUE
    )
    WHERE id = OLD.material_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
    UPDATE reading_materials
    SET sentence_count = (
      SELECT COUNT(*) FROM material_sentences
      WHERE material_id = NEW.material_id AND is_active = TRUE
    )
    WHERE id = NEW.material_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sentence_count
  AFTER INSERT OR UPDATE OR DELETE ON material_sentences
  FOR EACH ROW
  EXECUTE FUNCTION update_material_sentence_count();
