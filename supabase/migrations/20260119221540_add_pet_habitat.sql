-- Add habitat fields to pets table
ALTER TABLE pets ADD COLUMN habitat_type TEXT DEFAULT 'default';
ALTER TABLE pets ADD COLUMN habitat_decorations JSONB DEFAULT '[]';

-- Add comments for documentation
COMMENT ON COLUMN pets.habitat_type IS 'Type of habitat background (default, forest, ocean, sky, meadow, cave)';
COMMENT ON COLUMN pets.habitat_decorations IS 'Array of decoration IDs placed in the habitat';
