import type { PetType, PetColor, PetPattern, PetAccessory, PetCustomization } from './types';

interface PetTypeOptions {
  allowedColors: PetColor[];
  allowedPatterns: PetPattern[];
  suggestedAccessories: PetAccessory[];
  defaultPromptStyle: string;
}

/**
 * Customization options available for each pet type.
 * Controls which colors, patterns, and accessories are appropriate for each animal.
 */
export const PET_TYPE_OPTIONS: Record<PetType, PetTypeOptions> = {
  cat: {
    allowedColors: ['black', 'white', 'gray', 'orange', 'brown', 'golden'],
    allowedPatterns: ['solid', 'spotted', 'striped', 'tabby', 'calico', 'tuxedo'],
    suggestedAccessories: ['bow', 'collar', 'bandana'],
    defaultPromptStyle: 'cute fluffy cat with big expressive eyes',
  },
  dog: {
    allowedColors: ['black', 'white', 'brown', 'golden', 'gray', 'orange'],
    allowedPatterns: ['solid', 'spotted', 'gradient'],
    suggestedAccessories: ['collar', 'bandana', 'bow'],
    defaultPromptStyle: 'adorable friendly puppy with a happy expression',
  },
  dinosaur: {
    allowedColors: ['green', 'purple', 'blue', 'orange', 'red', 'rainbow'],
    allowedPatterns: ['solid', 'spotted', 'striped', 'gradient'],
    suggestedAccessories: ['crown', 'hat', 'scarf'],
    defaultPromptStyle: 'cute baby dinosaur with a friendly smile',
  },
  unicorn: {
    allowedColors: ['white', 'pink', 'purple', 'blue', 'rainbow', 'golden'],
    allowedPatterns: ['solid', 'gradient', 'sparkly', 'galaxy'],
    suggestedAccessories: ['crown', 'flower', 'star'],
    defaultPromptStyle: 'magical unicorn with a shimmering horn and flowing mane',
  },
  dragon: {
    allowedColors: ['red', 'purple', 'blue', 'green', 'black', 'golden', 'rainbow'],
    allowedPatterns: ['solid', 'gradient', 'sparkly', 'galaxy'],
    suggestedAccessories: ['crown', 'scarf', 'star'],
    defaultPromptStyle: 'friendly baby dragon with small wings and a cute snout',
  },
  bunny: {
    allowedColors: ['white', 'brown', 'gray', 'black', 'pink', 'golden'],
    allowedPatterns: ['solid', 'spotted'],
    suggestedAccessories: ['bow', 'flower', 'bandana'],
    defaultPromptStyle: 'fluffy bunny with long soft ears and a twitchy nose',
  },
  bear: {
    allowedColors: ['brown', 'black', 'white', 'golden', 'pink'],
    allowedPatterns: ['solid', 'gradient'],
    suggestedAccessories: ['bow', 'scarf', 'hat'],
    defaultPromptStyle: 'cuddly teddy bear with a warm friendly expression',
  },
  bird: {
    allowedColors: ['blue', 'yellow', 'red', 'green', 'orange', 'rainbow'],
    allowedPatterns: ['solid', 'gradient', 'spotted'],
    suggestedAccessories: ['bow', 'hat', 'scarf'],
    defaultPromptStyle: 'cheerful little bird with colorful feathers',
  },
  fish: {
    allowedColors: ['orange', 'blue', 'purple', 'pink', 'rainbow', 'golden'],
    allowedPatterns: ['solid', 'spotted', 'striped', 'gradient', 'sparkly'],
    suggestedAccessories: ['crown', 'bow', 'star'],
    defaultPromptStyle: 'friendly tropical fish with shimmering scales',
  },
  butterfly: {
    allowedColors: ['purple', 'blue', 'pink', 'orange', 'rainbow'],
    allowedPatterns: ['spotted', 'gradient', 'sparkly', 'galaxy'],
    suggestedAccessories: ['crown', 'flower', 'star'],
    defaultPromptStyle: 'beautiful butterfly with delicate patterned wings',
  },
};

/**
 * Pattern descriptions for DALL-E prompts
 */
const PATTERN_DESCRIPTIONS: Record<PetPattern, string> = {
  solid: '',
  spotted: 'with cute spots',
  striped: 'with gentle stripes',
  tabby: 'with classic tabby markings',
  calico: 'with calico patches',
  tuxedo: 'with tuxedo markings (white chest)',
  gradient: 'with beautiful gradient coloring',
  sparkly: 'with magical sparkles',
  galaxy: 'with mystical galaxy patterns',
};

/**
 * Accessory descriptions for DALL-E prompts
 */
const ACCESSORY_DESCRIPTIONS: Record<PetAccessory, string> = {
  none: '',
  bow: 'wearing a cute bow',
  collar: 'wearing a pretty collar',
  crown: 'wearing a tiny golden crown',
  hat: 'wearing an adorable hat',
  glasses: 'wearing cute round glasses',
  scarf: 'wearing a cozy scarf',
  bandana: 'wearing a colorful bandana',
  flower: 'with a flower tucked nearby',
  star: 'with a magical star accessory',
};

/**
 * Builds a DALL-E image generation prompt from pet customization options.
 * Creates a child-friendly, consistent art style prompt.
 */
export function buildPetImagePrompt(
  petType: PetType,
  name: string,
  customization: PetCustomization
): string {
  const options = PET_TYPE_OPTIONS[petType];
  const parts: string[] = [];

  // Base style - children's book illustration
  parts.push(`Children's book illustration style, cute and friendly ${options.defaultPromptStyle}`);

  // Name inclusion for personality
  parts.push(`This pet is named ${name}`);

  // Colors
  if (customization.colorPrimary) {
    parts.push(`primarily ${customization.colorPrimary} colored`);
  }
  if (customization.colorSecondary) {
    parts.push(`with ${customization.colorSecondary} markings`);
  }

  // Pattern
  if (customization.pattern && customization.pattern !== 'solid') {
    const patternDesc = PATTERN_DESCRIPTIONS[customization.pattern];
    if (patternDesc) {
      parts.push(patternDesc);
    }
  }

  // Accessory
  if (customization.accessory && customization.accessory !== 'none') {
    const accessoryDesc = ACCESSORY_DESCRIPTIONS[customization.accessory];
    if (accessoryDesc) {
      parts.push(accessoryDesc);
    }
  }

  // Custom description from child
  if (customization.customDescription) {
    parts.push(customization.customDescription);
  }

  // Style requirements (consistent with story illustrations)
  parts.push('IMPORTANT: Do NOT include any text, words, letters, or writing in the image.');
  parts.push('Style should be warm, inviting, whimsical, with soft colors suitable for children.');
  parts.push('The pet should be centered, facing forward with a happy expression.');
  parts.push('Background should be simple and not distracting - soft gradient or gentle pattern.');

  return parts.filter(Boolean).join('. ');
}

/**
 * Gets the default customization for a pet type.
 */
export function getDefaultCustomization(petType: PetType): PetCustomization {
  const options = PET_TYPE_OPTIONS[petType];
  return {
    colorPrimary: options.allowedColors[0] || null,
    colorSecondary: null,
    pattern: options.allowedPatterns[0] || null,
    accessory: 'none',
    customDescription: null,
  };
}

/**
 * Validates that customization options are allowed for the pet type.
 */
export function validateCustomization(
  petType: PetType,
  customization: PetCustomization
): { valid: boolean; errors: string[] } {
  const options = PET_TYPE_OPTIONS[petType];
  const errors: string[] = [];

  if (customization.colorPrimary && !options.allowedColors.includes(customization.colorPrimary)) {
    errors.push(`Color "${customization.colorPrimary}" is not available for ${petType}`);
  }

  if (customization.colorSecondary && !options.allowedColors.includes(customization.colorSecondary)) {
    errors.push(`Color "${customization.colorSecondary}" is not available for ${petType}`);
  }

  if (customization.pattern && !options.allowedPatterns.includes(customization.pattern)) {
    errors.push(`Pattern "${customization.pattern}" is not available for ${petType}`);
  }

  // Accessories are more flexible - we allow any accessory even if not "suggested"
  // The suggested ones are just UI hints

  return {
    valid: errors.length === 0,
    errors,
  };
}
