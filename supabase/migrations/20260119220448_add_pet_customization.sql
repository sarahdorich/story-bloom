-- Add pet customization fields to pets table
ALTER TABLE pets ADD COLUMN color_primary TEXT;
ALTER TABLE pets ADD COLUMN color_secondary TEXT;
ALTER TABLE pets ADD COLUMN pattern TEXT;
ALTER TABLE pets ADD COLUMN accessory TEXT;
ALTER TABLE pets ADD COLUMN custom_description TEXT;
ALTER TABLE pets ADD COLUMN image_generation_prompt TEXT;
ALTER TABLE pets ADD COLUMN image_generation_status TEXT DEFAULT 'pending'
  CHECK (image_generation_status IN ('pending', 'generating', 'completed', 'failed'));

-- Add index for checking generation status
CREATE INDEX idx_pets_image_status ON pets(image_generation_status);

-- Add pet customization preferences to children table
ALTER TABLE children ADD COLUMN pet_preferences JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN pets.color_primary IS 'Primary color of the pet (e.g., black, orange, rainbow)';
COMMENT ON COLUMN pets.color_secondary IS 'Secondary/accent color (e.g., white spots, brown patches)';
COMMENT ON COLUMN pets.pattern IS 'Pattern type (e.g., solid, spotted, striped, tabby)';
COMMENT ON COLUMN pets.accessory IS 'Optional accessory shown in generated image (e.g., bow, collar, crown)';
COMMENT ON COLUMN pets.custom_description IS 'Free-form description from child for image generation';
COMMENT ON COLUMN pets.image_generation_prompt IS 'Full prompt used for DALL-E generation (for debugging/regeneration)';
COMMENT ON COLUMN pets.image_generation_status IS 'pending, generating, completed, failed';
COMMENT ON COLUMN children.pet_preferences IS 'JSON object storing default pet customization preferences';
