export interface Child {
  id: string;
  user_id: string;
  name: string;
  age: number;
  reading_level: string;
  favorite_things: string[];
  parent_summary: string | null;
  default_text_size: FontSize;
  created_at: string;
  // Optional physical characteristics for illustration personalization
  profile_image_url: string | null;
  profile_image_storage_path: string | null;
  skin_tone: SkinTone | null;
  hair_color: HairColor | null;
  eye_color: EyeColor | null;
  gender: Gender | null;
  pronouns: Pronouns | null;
}

export interface Illustration {
  description: string;
  position: number;
  imageUrl?: string;
  customIllustrationId?: string;
}

export interface CustomIllustration {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_url: string;
  storage_path: string;
  created_at: string;
}

export interface Story {
  id: string;
  child_id: string;
  title: string;
  content: string;
  custom_prompt: string | null;
  illustrations: Illustration[] | null;
  is_favorited: boolean;
  source_illustration_url: string | null;
  created_at: string;
}

export interface StoryGenerationResponse {
  title: string;
  content: string;
  illustrations: Illustration[];
  warning?: string;
}

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export const FONT_SIZE_CLASSES: Record<FontSize, string> = {
  'small': 'text-base leading-relaxed',
  'medium': 'text-lg leading-relaxed',
  'large': 'text-xl leading-relaxed',
  'extra-large': 'text-2xl leading-relaxed',
};

export const READING_LEVELS = [
  'Pre-K',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
] as const;

export type ReadingLevel = typeof READING_LEVELS[number];

// Physical characteristics types for illustration personalization
// All default to null/"diverse" meaning the LLM can choose any characteristics

export const SKIN_TONES = [
  { id: 'diverse', label: 'Diverse (any)', color: null },
  { id: 'fair', label: 'Fair', color: '#FFDFC4' },
  { id: 'light', label: 'Light', color: '#F0D5BE' },
  { id: 'medium', label: 'Medium', color: '#D1A684' },
  { id: 'olive', label: 'Olive', color: '#C4A87C' },
  { id: 'tan', label: 'Tan', color: '#A67B5B' },
  { id: 'brown', label: 'Brown', color: '#8D5524' },
  { id: 'dark', label: 'Dark', color: '#5C3A21' },
] as const;

export type SkinTone = typeof SKIN_TONES[number]['id'];

export const HAIR_COLORS = [
  'diverse',
  'black',
  'dark brown',
  'brown',
  'light brown',
  'auburn',
  'red',
  'strawberry blonde',
  'blonde',
  'platinum blonde',
  'gray',
  'white',
] as const;

export type HairColor = typeof HAIR_COLORS[number];

export const EYE_COLORS = [
  'diverse',
  'brown',
  'dark brown',
  'hazel',
  'amber',
  'green',
  'blue',
  'gray',
  'black',
] as const;

export type EyeColor = typeof EYE_COLORS[number];

export const GENDERS = [
  { id: 'diverse', label: 'Diverse (any)' },
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'genderfluid', label: 'Genderfluid' },
  { id: 'genderqueer', label: 'Genderqueer' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
] as const;

export type Gender = typeof GENDERS[number]['id'];

export const PRONOUNS = [
  { id: 'diverse', label: 'Diverse (any)', value: null },
  { id: 'she-her', label: 'She/Her/Hers', value: 'she/her/hers' },
  { id: 'he-him', label: 'He/Him/His', value: 'he/him/his' },
  { id: 'they-them', label: 'They/Them/Theirs', value: 'they/them/theirs' },
] as const;

export type Pronouns = typeof PRONOUNS[number]['id'];

// ============================================
// Word Quest Types
// ============================================

export interface WordListItem {
  id: string;
  word: string;
  reading_level: ReadingLevel;
  category: 'sight_word' | 'phonics' | 'vocabulary' | null;
  difficulty_rank: number;
  created_at: string;
}

export interface WordProgress {
  id: string;
  child_id: string;
  word_list_id: string;
  times_practiced: number;
  times_correct: number;
  mastery_level: number; // 0-5 (0=new, 5=mastered)
  last_practiced_at: string | null;
  created_at: string;
}

export interface PracticeSession {
  id: string;
  child_id: string;
  words_practiced: number;
  words_correct: number;
  duration_seconds: number | null;
  session_date: string;
  started_at: string;
  completed_at: string | null;
}

export interface PracticeWord {
  id: string;
  word: string;
  mastery_level: number;
  word_list_id: string;
}

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export interface PracticeAttemptResult {
  word: string;
  spoken: string;
  correct: boolean;
  timestamp: Date;
}

// ============================================
// Pet System Types
// ============================================

// Pet Customization Colors
export const PET_COLORS = [
  { id: 'black', label: 'Black', hex: '#1a1a1a' },
  { id: 'white', label: 'White', hex: '#ffffff' },
  { id: 'gray', label: 'Gray', hex: '#6b7280' },
  { id: 'brown', label: 'Brown', hex: '#92400e' },
  { id: 'orange', label: 'Orange', hex: '#f97316' },
  { id: 'yellow', label: 'Yellow', hex: '#fbbf24' },
  { id: 'red', label: 'Red', hex: '#ef4444' },
  { id: 'pink', label: 'Pink', hex: '#f472b6' },
  { id: 'purple', label: 'Purple', hex: '#a855f7' },
  { id: 'blue', label: 'Blue', hex: '#3b82f6' },
  { id: 'green', label: 'Green', hex: '#22c55e' },
  { id: 'rainbow', label: 'Rainbow', hex: 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24, #22c55e, #3b82f6, #a855f7)' },
  { id: 'golden', label: 'Golden', hex: '#d4a017' },
] as const;

export type PetColor = (typeof PET_COLORS)[number]['id'];

// Pet Patterns
export const PET_PATTERNS = [
  { id: 'solid', label: 'Solid Color' },
  { id: 'spotted', label: 'Spotted' },
  { id: 'striped', label: 'Striped' },
  { id: 'tabby', label: 'Tabby' },
  { id: 'calico', label: 'Calico' },
  { id: 'tuxedo', label: 'Tuxedo' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'sparkly', label: 'Sparkly' },
  { id: 'galaxy', label: 'Galaxy' },
] as const;

export type PetPattern = (typeof PET_PATTERNS)[number]['id'];

// Pet Accessories
export const PET_ACCESSORIES = [
  { id: 'none', label: 'None' },
  { id: 'bow', label: 'Bow' },
  { id: 'collar', label: 'Collar' },
  { id: 'crown', label: 'Crown' },
  { id: 'hat', label: 'Hat' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'scarf', label: 'Scarf' },
  { id: 'bandana', label: 'Bandana' },
  { id: 'flower', label: 'Flower' },
  { id: 'star', label: 'Star' },
] as const;

export type PetAccessory = (typeof PET_ACCESSORIES)[number]['id'];

// Pet Customization interface
export interface PetCustomization {
  colorPrimary: PetColor | null;
  colorSecondary: PetColor | null;
  pattern: PetPattern | null;
  accessory: PetAccessory | null;
  customDescription: string | null;
}

// Child's pet preferences (saved for future pets)
export interface PetPreferences {
  defaultColorPrimary?: PetColor;
  defaultColorSecondary?: PetColor;
  defaultPattern?: PetPattern;
  favoriteAccessories?: PetAccessory[];
}

// Image generation status
export type ImageGenerationStatus = 'pending' | 'generating' | 'completed' | 'failed';

// Habitat Types for Phase 2
export const HABITAT_TYPES = {
  default: { label: 'Cozy Room', gradient: 'from-purple-100 to-pink-100' },
  forest: { label: 'Forest', gradient: 'from-green-200 to-emerald-100' },
  ocean: { label: 'Ocean', gradient: 'from-blue-200 to-cyan-100' },
  sky: { label: 'Sky', gradient: 'from-sky-200 to-indigo-100' },
  meadow: { label: 'Meadow', gradient: 'from-yellow-100 to-green-100' },
  cave: { label: 'Crystal Cave', gradient: 'from-purple-200 to-indigo-200' },
} as const;

export type HabitatType = keyof typeof HABITAT_TYPES;

// Map pet types to their default habitats
export const PET_DEFAULT_HABITATS: Record<PetType, HabitatType> = {
  cat: 'default',
  dog: 'meadow',
  dinosaur: 'forest',
  unicorn: 'meadow',
  dragon: 'cave',
  bunny: 'meadow',
  bear: 'forest',
  bird: 'sky',
  fish: 'ocean',
  butterfly: 'meadow',
};

export const PET_TYPES = [
  'cat',
  'dog',
  'dinosaur',
  'unicorn',
  'dragon',
  'bunny',
  'bear',
  'bird',
  'fish',
  'butterfly',
] as const;

export type PetType = (typeof PET_TYPES)[number];

export interface Pet {
  id: string;
  child_id: string;
  pet_type: PetType;
  name: string;
  personality: string;
  image_url: string | null;
  image_storage_path: string | null;
  // Customization fields (Phase 1)
  color_primary: PetColor | null;
  color_secondary: PetColor | null;
  pattern: PetPattern | null;
  accessory: PetAccessory | null;
  custom_description: string | null;
  image_generation_prompt: string | null;
  image_generation_status: ImageGenerationStatus;
  // Habitat fields (Phase 2)
  habitat_type: HabitatType | null;
  habitat_decorations: string[] | null;
  // Stats
  happiness: number; // 0-100
  energy: number; // 0-100
  level: number; // 1-10
  experience_points: number;
  unlocked_behaviors: string[];
  is_favorite: boolean;
  created_at: string;
  last_interacted_at: string;
}

export type InteractionType = 'feed' | 'play' | 'pet' | 'talk';

export interface PetInteraction {
  id: string;
  pet_id: string;
  interaction_type: InteractionType;
  interaction_detail: Record<string, unknown> | null;
  pet_response: string | null;
  happiness_change: number;
  energy_change: number;
  xp_gained: number;
  created_at: string;
}

// Interaction effects on pet stats
export const INTERACTION_EFFECTS: Record<
  InteractionType,
  { happiness: number; energy: number; xp: number }
> = {
  feed: { happiness: 10, energy: 20, xp: 5 },
  play: { happiness: 20, energy: -15, xp: 15 },
  pet: { happiness: 15, energy: 5, xp: 10 },
  talk: { happiness: 10, energy: 0, xp: 5 },
};

// XP required to reach each level (cumulative)
export const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000];

// Behaviors unlocked at each level by pet type
export const BEHAVIORS_BY_LEVEL: Record<PetType, string[][]> = {
  cat: [
    ['purr', 'meow'],
    ['stretch', 'yawn'],
    ['chase_tail', 'pounce'],
    ['nap_sunny_spot'],
    ['bring_gift', 'knead'],
    ['acrobatic_jump'],
    ['hide_and_seek'],
    ['sing_song'],
    ['dance'],
    ['magic_trick'],
  ],
  dog: [
    ['bark', 'wag_tail'],
    ['sit', 'roll_over'],
    ['fetch', 'shake_paw'],
    ['play_dead'],
    ['catch_frisbee', 'dig'],
    ['do_tricks'],
    ['howl_song'],
    ['dance'],
    ['skateboard'],
    ['superhero_pose'],
  ],
  dinosaur: [
    ['roar', 'stomp'],
    ['tail_wag', 'sniff'],
    ['dig_bones', 'run_fast'],
    ['eat_leaves', 'splash_water'],
    ['find_treasure', 'make_friends'],
    ['climb_mountain'],
    ['fly_short_distance'],
    ['dino_dance'],
    ['time_travel'],
    ['legendary_roar'],
  ],
  unicorn: [
    ['sparkle', 'neigh'],
    ['prance', 'toss_mane'],
    ['rainbow_trail', 'flutter'],
    ['magic_sparkle'],
    ['grant_wish', 'fly_low'],
    ['rainbow_jump'],
    ['starlight_dance'],
    ['aurora_display'],
    ['dream_weaving'],
    ['rainbow_magic'],
  ],
  dragon: [
    ['growl', 'puff_smoke'],
    ['flap_wings', 'curl_tail'],
    ['small_flame', 'glide'],
    ['treasure_hunt'],
    ['fire_breath', 'fly_circle'],
    ['loop_de_loop'],
    ['fire_juggle'],
    ['sky_dance'],
    ['storm_summon'],
    ['dragon_magic'],
  ],
  bunny: [
    ['hop', 'wiggle_nose'],
    ['binky', 'thump'],
    ['dig', 'zoom'],
    ['flop_over'],
    ['find_carrots', 'groom'],
    ['high_jump'],
    ['bunny_dance'],
    ['magic_hop'],
    ['disappear_trick'],
    ['rainbow_hop'],
  ],
  bear: [
    ['growl', 'wave'],
    ['stretch', 'yawn'],
    ['catch_fish', 'scratch'],
    ['berry_hunt'],
    ['climb_tree', 'splash'],
    ['honey_dance'],
    ['forest_song'],
    ['star_gaze'],
    ['nature_magic'],
    ['forest_guardian'],
  ],
  bird: [
    ['chirp', 'flap'],
    ['hop', 'preen'],
    ['fly_short', 'sing'],
    ['fetch_shiny'],
    ['acrobatic_fly', 'whistle'],
    ['loop_flight'],
    ['dawn_chorus'],
    ['sky_dance'],
    ['rainbow_feathers'],
    ['phoenix_glow'],
  ],
  fish: [
    ['bubble', 'swim'],
    ['splash', 'hide'],
    ['jump', 'shimmer'],
    ['treasure_find'],
    ['synchronized_swim', 'glow'],
    ['coral_dance'],
    ['wave_ride'],
    ['ocean_song'],
    ['bioluminescent'],
    ['ocean_magic'],
  ],
  butterfly: [
    ['flutter', 'land'],
    ['spiral', 'rest'],
    ['flower_dance', 'shimmer'],
    ['pollen_trail'],
    ['rainbow_wings', 'float'],
    ['garden_tour'],
    ['sky_ballet'],
    ['starlight_wings'],
    ['metamorphosis'],
    ['fairy_magic'],
  ],
};

// Map child's favorite things to pet types
export const PET_MAPPINGS: Record<string, PetType> = {
  cat: 'cat',
  cats: 'cat',
  kitten: 'cat',
  kitty: 'cat',
  dog: 'dog',
  dogs: 'dog',
  puppy: 'dog',
  puppies: 'dog',
  dinosaur: 'dinosaur',
  dinosaurs: 'dinosaur',
  dino: 'dinosaur',
  't-rex': 'dinosaur',
  trex: 'dinosaur',
  unicorn: 'unicorn',
  unicorns: 'unicorn',
  horse: 'unicorn',
  pony: 'unicorn',
  ponies: 'unicorn',
  dragon: 'dragon',
  dragons: 'dragon',
  bunny: 'bunny',
  rabbit: 'bunny',
  bunnies: 'bunny',
  rabbits: 'bunny',
  bear: 'bear',
  bears: 'bear',
  teddy: 'bear',
  bird: 'bird',
  birds: 'bird',
  parrot: 'bird',
  owl: 'bird',
  fish: 'fish',
  goldfish: 'fish',
  dolphin: 'fish',
  whale: 'fish',
  shark: 'fish',
  butterfly: 'butterfly',
  butterflies: 'butterfly',
  bug: 'butterfly',
  bugs: 'butterfly',
};

// Pet unlock thresholds (cumulative points needed)
export const PET_UNLOCK_THRESHOLDS = [0, 50, 150, 350, 650, 1000, 1500, 2100, 2800, 3600];

// Points earned per action
export const POINTS_SYSTEM = {
  correctWordFirstTry: 5,
  correctWordWithHint: 3,
  correctWordRetry: 2,
  dailyGoalBonus: 20,
  streakBonus: 5,
} as const;

// Pet Trick System (Phase 3)
export interface PetTrick {
  id: string;
  pet_id: string;
  trick_name: string;
  times_performed: number;
  mastery_level: number; // 0-5
  last_performed_at: string | null;
  created_at: string;
}

// XP rewards for performing tricks
export const TRICK_XP_REWARDS = {
  base: 10, // Base XP for performing a trick
  streak3Bonus: 25, // Bonus XP for performing 3 tricks in a row
  masteryBonus: 5, // Extra XP per mastery level
} as const;

// Animation duration in milliseconds for each trick animation
export const TRICK_ANIMATION_DURATIONS: Record<string, number> = {
  'animate-trick-spin': 1000,
  'animate-trick-bounce': 800,
  'animate-trick-pounce': 1000,
  'animate-trick-dance': 1500,
  'animate-trick-sparkle': 2000,
  'animate-trick-pulse': 1500,
  'animate-trick-stretch': 1500,
  'animate-trick-wag': 1000,
  'animate-trick-float': 2000,
};

// Map tricks to their CSS animation classes
export const TRICK_ANIMATIONS: Record<string, string> = {
  // Cat tricks
  purr: 'animate-trick-pulse',
  meow: 'animate-trick-bounce',
  stretch: 'animate-trick-stretch',
  yawn: 'animate-trick-stretch',
  chase_tail: 'animate-trick-spin',
  pounce: 'animate-trick-pounce',
  nap_sunny_spot: 'animate-trick-pulse',
  bring_gift: 'animate-trick-bounce',
  knead: 'animate-trick-pulse',
  acrobatic_jump: 'animate-trick-pounce',
  hide_and_seek: 'animate-trick-bounce',
  sing_song: 'animate-trick-dance',
  dance: 'animate-trick-dance',
  magic_trick: 'animate-trick-sparkle',

  // Dog tricks
  bark: 'animate-trick-bounce',
  wag_tail: 'animate-trick-wag',
  sit: 'animate-trick-bounce',
  roll_over: 'animate-trick-spin',
  fetch: 'animate-trick-pounce',
  shake_paw: 'animate-trick-bounce',
  play_dead: 'animate-trick-pulse',
  catch_frisbee: 'animate-trick-pounce',
  dig: 'animate-trick-bounce',
  do_tricks: 'animate-trick-dance',
  howl_song: 'animate-trick-stretch',
  skateboard: 'animate-trick-bounce',
  superhero_pose: 'animate-trick-sparkle',

  // Dinosaur tricks
  roar: 'animate-trick-bounce',
  stomp: 'animate-trick-bounce',
  tail_wag: 'animate-trick-wag',
  sniff: 'animate-trick-pulse',
  dig_bones: 'animate-trick-bounce',
  run_fast: 'animate-trick-pounce',
  eat_leaves: 'animate-trick-pulse',
  splash_water: 'animate-trick-bounce',
  find_treasure: 'animate-trick-sparkle',
  make_friends: 'animate-trick-dance',
  climb_mountain: 'animate-trick-pounce',
  fly_short_distance: 'animate-trick-float',
  dino_dance: 'animate-trick-dance',
  time_travel: 'animate-trick-sparkle',
  legendary_roar: 'animate-trick-sparkle',

  // Unicorn tricks
  sparkle: 'animate-trick-sparkle',
  neigh: 'animate-trick-bounce',
  prance: 'animate-trick-bounce',
  toss_mane: 'animate-trick-wag',
  rainbow_trail: 'animate-trick-sparkle',
  flutter: 'animate-trick-float',
  magic_sparkle: 'animate-trick-sparkle',
  grant_wish: 'animate-trick-sparkle',
  fly_low: 'animate-trick-float',
  rainbow_jump: 'animate-trick-pounce',
  starlight_dance: 'animate-trick-dance',
  aurora_display: 'animate-trick-sparkle',
  dream_weaving: 'animate-trick-sparkle',
  rainbow_magic: 'animate-trick-sparkle',

  // Dragon tricks
  growl: 'animate-trick-bounce',
  puff_smoke: 'animate-trick-pulse',
  flap_wings: 'animate-trick-float',
  curl_tail: 'animate-trick-wag',
  small_flame: 'animate-trick-sparkle',
  glide: 'animate-trick-float',
  treasure_hunt: 'animate-trick-sparkle',
  fire_breath: 'animate-trick-sparkle',
  fly_circle: 'animate-trick-spin',
  loop_de_loop: 'animate-trick-spin',
  fire_juggle: 'animate-trick-dance',
  sky_dance: 'animate-trick-dance',
  storm_summon: 'animate-trick-sparkle',
  dragon_magic: 'animate-trick-sparkle',

  // Bunny tricks
  hop: 'animate-trick-bounce',
  wiggle_nose: 'animate-trick-pulse',
  binky: 'animate-trick-pounce',
  thump: 'animate-trick-bounce',
  zoom: 'animate-trick-pounce',
  flop_over: 'animate-trick-spin',
  find_carrots: 'animate-trick-bounce',
  groom: 'animate-trick-pulse',
  high_jump: 'animate-trick-pounce',
  bunny_dance: 'animate-trick-dance',
  magic_hop: 'animate-trick-sparkle',
  disappear_trick: 'animate-trick-sparkle',
  rainbow_hop: 'animate-trick-sparkle',

  // Bear tricks
  wave: 'animate-trick-wag',
  scratch: 'animate-trick-pulse',
  catch_fish: 'animate-trick-pounce',
  berry_hunt: 'animate-trick-bounce',
  climb_tree: 'animate-trick-pounce',
  splash: 'animate-trick-bounce',
  honey_dance: 'animate-trick-dance',
  forest_song: 'animate-trick-pulse',
  star_gaze: 'animate-trick-sparkle',
  nature_magic: 'animate-trick-sparkle',
  forest_guardian: 'animate-trick-sparkle',

  // Bird tricks
  chirp: 'animate-trick-bounce',
  flap: 'animate-trick-float',
  preen: 'animate-trick-pulse',
  fly_short: 'animate-trick-float',
  sing: 'animate-trick-bounce',
  fetch_shiny: 'animate-trick-sparkle',
  acrobatic_fly: 'animate-trick-spin',
  whistle: 'animate-trick-bounce',
  loop_flight: 'animate-trick-spin',
  dawn_chorus: 'animate-trick-dance',
  rainbow_feathers: 'animate-trick-sparkle',
  phoenix_glow: 'animate-trick-sparkle',

  // Fish tricks
  bubble: 'animate-trick-pulse',
  swim: 'animate-trick-float',
  hide: 'animate-trick-pulse',
  jump: 'animate-trick-pounce',
  shimmer: 'animate-trick-sparkle',
  treasure_find: 'animate-trick-sparkle',
  synchronized_swim: 'animate-trick-dance',
  glow: 'animate-trick-sparkle',
  coral_dance: 'animate-trick-dance',
  wave_ride: 'animate-trick-float',
  ocean_song: 'animate-trick-pulse',
  bioluminescent: 'animate-trick-sparkle',
  ocean_magic: 'animate-trick-sparkle',

  // Butterfly tricks
  land: 'animate-trick-pulse',
  spiral: 'animate-trick-spin',
  rest: 'animate-trick-pulse',
  flower_dance: 'animate-trick-dance',
  pollen_trail: 'animate-trick-sparkle',
  rainbow_wings: 'animate-trick-sparkle',
  float: 'animate-trick-float',
  garden_tour: 'animate-trick-float',
  sky_ballet: 'animate-trick-dance',
  starlight_wings: 'animate-trick-sparkle',
  metamorphosis: 'animate-trick-sparkle',
  fairy_magic: 'animate-trick-sparkle',
};

// Get animation class for a trick, with default fallback
export function getTrickAnimation(trickName: string): string {
  return TRICK_ANIMATIONS[trickName] || 'animate-trick-bounce';
}

// Get animation duration for a trick
export function getTrickAnimationDuration(trickName: string): number {
  const animationClass = getTrickAnimation(trickName);
  return TRICK_ANIMATION_DURATIONS[animationClass] || 1000;
}

// ============================================
// Phase 4: Pet Accessories & Rewards Types
// ============================================

export const ACCESSORY_TYPES = ['hat', 'collar', 'body', 'background', 'effect'] as const;
export type AccessoryType = (typeof ACCESSORY_TYPES)[number];

export const ACCESSORY_RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type AccessoryRarity = (typeof ACCESSORY_RARITIES)[number];

export const RARITY_COLORS: Record<AccessoryRarity, { bg: string; text: string; border: string }> = {
  common: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  rare: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  epic: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
  legendary: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
};

export const ACCESSORY_TYPE_EMOJIS: Record<AccessoryType, string> = {
  hat: '🎩',
  collar: '📿',
  body: '👕',
  background: '🖼️',
  effect: '✨',
};

export type UnlockRequirementType = 'sessions' | 'words_mastered' | 'streak_days' | 'level';

export interface UnlockRequirement {
  type: UnlockRequirementType;
  count: number;
}

export interface Accessory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  type: AccessoryType;
  image_url: string | null;
  rarity: AccessoryRarity;
  unlock_requirement: UnlockRequirement;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ChildAccessory {
  id: string;
  child_id: string;
  accessory_id: string;
  unlocked_at: string;
  unlock_source: string | null;
  // Joined accessory data
  accessory?: Accessory;
}

export interface PetEquippedAccessory {
  id: string;
  pet_id: string;
  accessory_id: string;
  slot: AccessoryType;
  equipped_at: string;
  // Joined accessory data
  accessory?: Accessory;
}

// Helper to check if a requirement is met
export function isAccessoryUnlocked(
  requirement: UnlockRequirement,
  stats: { sessions: number; wordsMastered: number; streakDays: number; level: number }
): boolean {
  switch (requirement.type) {
    case 'sessions':
      return stats.sessions >= requirement.count;
    case 'words_mastered':
      return stats.wordsMastered >= requirement.count;
    case 'streak_days':
      return stats.streakDays >= requirement.count;
    case 'level':
      return stats.level >= requirement.count;
    default:
      return false;
  }
}

// Get progress toward unlocking an accessory (0-100)
export function getUnlockProgress(
  requirement: UnlockRequirement,
  stats: { sessions: number; wordsMastered: number; streakDays: number; level: number }
): number {
  let current = 0;
  switch (requirement.type) {
    case 'sessions':
      current = stats.sessions;
      break;
    case 'words_mastered':
      current = stats.wordsMastered;
      break;
    case 'streak_days':
      current = stats.streakDays;
      break;
    case 'level':
      current = stats.level;
      break;
  }
  return Math.min(100, Math.round((current / requirement.count) * 100));
}

// Format unlock requirement for display
export function formatUnlockRequirement(requirement: UnlockRequirement): string {
  switch (requirement.type) {
    case 'sessions':
      return `Complete ${requirement.count} practice sessions`;
    case 'words_mastered':
      return `Master ${requirement.count} words`;
    case 'streak_days':
      return `Reach a ${requirement.count}-day streak`;
    case 'level':
      return `Reach level ${requirement.count}`;
    default:
      return 'Unknown requirement';
  }
}

// ============================================
// Phase 5: Reading-Connected Pet Reactions Types
// ============================================

export const PET_MOODS = ['excited', 'happy', 'proud', 'content', 'sleepy', 'sad', 'lonely'] as const;
export type PetMood = (typeof PET_MOODS)[number];

export const MOOD_EMOJIS: Record<PetMood, string> = {
  excited: '🤩',
  happy: '😊',
  proud: '🥳',
  content: '😌',
  sleepy: '😴',
  sad: '😢',
  lonely: '🥺',
};

export const MOOD_COLORS: Record<PetMood, string> = {
  excited: 'text-yellow-500',
  happy: 'text-green-500',
  proud: 'text-purple-500',
  content: 'text-blue-400',
  sleepy: 'text-gray-400',
  sad: 'text-blue-600',
  lonely: 'text-gray-500',
};

export const READING_REACTION_TYPES = [
  'session_complete',
  'streak_milestone',
  'word_mastery',
  'perfect_session',
  'level_up',
  'comeback',
  'daily_first',
] as const;
export type ReadingReactionType = (typeof READING_REACTION_TYPES)[number];

export interface PetReadingReaction {
  id: string;
  pet_id: string;
  practice_session_id: string | null;
  reaction_type: ReadingReactionType;
  reaction_mood: PetMood;
  reaction_message: string | null;
  words_practiced: number;
  accuracy_percent: number;
  streak_days: number;
  xp_bonus: number;
  created_at: string;
}

// Streak milestone thresholds for special reactions
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

// Score threshold (percentage) to earn a new pet reward
export const PET_REWARD_SCORE_THRESHOLD = 90;

// Happiness decay rate per day without practice (minimum 20)
export const HAPPINESS_DECAY_PER_DAY = 5;
export const MINIMUM_HAPPINESS = 20;

// Calculate pet mood based on happiness and recent activity
export function calculatePetMood(
  happiness: number,
  daysSinceLastPractice: number,
  hasRecentStreak: boolean
): PetMood {
  if (daysSinceLastPractice >= 3) {
    return happiness < 40 ? 'sad' : 'lonely';
  }
  if (daysSinceLastPractice >= 1) {
    return happiness < 50 ? 'sleepy' : 'content';
  }
  // Practiced today
  if (hasRecentStreak && happiness >= 80) {
    return 'excited';
  }
  if (happiness >= 70) {
    return 'proud';
  }
  return 'happy';
}

// Calculate happiness after inactivity
export function calculateHappinessDecay(
  currentHappiness: number,
  daysSinceLastPractice: number
): number {
  const decay = daysSinceLastPractice * HAPPINESS_DECAY_PER_DAY;
  return Math.max(MINIMUM_HAPPINESS, currentHappiness - decay);
}

// Get reaction message templates by type and mood
export const REACTION_MESSAGES: Record<ReadingReactionType, Record<PetMood, string[]>> = {
  session_complete: {
    excited: [
      "WOW! You did amazing! I'm so proud of you!",
      "That was incredible! You're getting so good at reading!",
      "Yay! I loved practicing with you!",
    ],
    happy: [
      "Great job today! I had so much fun!",
      "You worked so hard! I'm happy!",
      "Nice practice session! You're doing great!",
    ],
    proud: [
      "Look at you go! You're becoming such a good reader!",
      "I knew you could do it! Keep it up!",
      "You should be proud of yourself!",
    ],
    content: ["Good practice today!", "Thanks for spending time with me!"],
    sleepy: ["*yawn* Good job... practice makes perfect..."],
    sad: ["Thanks for practicing... I missed you!"],
    lonely: ["You came back! I'm so happy to see you!"],
  },
  streak_milestone: {
    excited: [
      "AMAZING! You've practiced {days} days in a row!",
      "A {days}-day streak! You're unstoppable!",
      "WOW! {days} days! You're a reading superstar!",
    ],
    happy: [
      "{days} days in a row! Keep going!",
      "Streak milestone: {days} days! Great work!",
    ],
    proud: [
      "I'm so proud! {days} days of practice!",
      "{days}-day streak! You're dedicated!",
    ],
    content: ["{days} days! Nice streak!"],
    sleepy: ["{days} days... impressive..."],
    sad: ["You're back after your streak!"],
    lonely: ["Let's start a new streak together!"],
  },
  word_mastery: {
    excited: [
      "You mastered a new word! You're so smart!",
      "Another word mastered! Your brain is growing!",
    ],
    happy: ["New word mastered! Well done!", "You learned a new word! Yay!"],
    proud: ["I'm proud of you for mastering that word!"],
    content: ["Nice! Another word learned."],
    sleepy: ["Good... you learned a new word..."],
    sad: ["You're still learning new words!"],
    lonely: ["Welcome back, word master!"],
  },
  perfect_session: {
    excited: [
      "PERFECT! You got every word right!",
      "100%! You're absolutely amazing!",
      "A perfect score! I'm dancing with joy!",
    ],
    happy: ["Perfect session! Incredible work!"],
    proud: ["Every word correct! I'm so proud!"],
    content: ["Perfect! Well done."],
    sleepy: ["Perfect... *yawn* ...impressive..."],
    sad: ["A perfect session! That made me happy!"],
    lonely: ["A perfect comeback! Welcome back!"],
  },
  level_up: {
    excited: [
      "LEVEL UP! You reached level {level}!",
      "You're now level {level}! So exciting!",
    ],
    happy: ["Level {level}! Great progress!", "You leveled up! Congratulations!"],
    proud: ["Level {level}! I'm proud of how far you've come!"],
    content: ["Level up! Nice work."],
    sleepy: ["Level up... that's nice..."],
    sad: ["You leveled up! That cheered me up!"],
    lonely: ["You came back and leveled up!"],
  },
  comeback: {
    excited: [
      "You're back! I missed you so much!",
      "Yay! You came to practice! I'm so happy!",
    ],
    happy: ["Welcome back! I missed practicing with you!"],
    proud: ["You came back! Let's keep learning together!"],
    content: ["Nice to see you again!"],
    sleepy: ["*wakes up* Oh! You're back!"],
    sad: ["I was worried you forgot about me... but you came back!"],
    lonely: ["You finally came back! I was so lonely without you!"],
  },
  daily_first: {
    excited: [
      "Good morning! Ready to practice?",
      "A new day of learning! Let's go!",
    ],
    happy: ["First practice of the day! Let's do this!"],
    proud: ["Starting the day with practice! Smart choice!"],
    content: ["Time to practice!"],
    sleepy: ["*yawn* Good morning... let's practice..."],
    sad: ["Thanks for practicing today..."],
    lonely: ["Today's first practice! I'm glad you're here!"],
  },
};

// Get a random reaction message for a given type and mood
export function getReactionMessage(
  type: ReadingReactionType,
  mood: PetMood,
  context?: { days?: number; level?: number }
): string {
  const messages = REACTION_MESSAGES[type][mood] || REACTION_MESSAGES[type].happy;
  const message = messages[Math.floor(Math.random() * messages.length)];

  // Replace placeholders
  return message
    .replace('{days}', String(context?.days || 0))
    .replace('{level}', String(context?.level || 1));
}

// XP bonuses for different achievements
export const READING_XP_BONUSES = {
  perfectSession: 25,
  streakMilestone3: 15,
  streakMilestone7: 30,
  streakMilestone14: 50,
  streakMilestone30: 100,
  comeback: 10,
  dailyFirst: 5,
} as const;

// Update the Pet interface to include new fields
export interface PetWithReadingStats extends Pet {
  last_reading_session_at: string | null;
  reading_streak_days: number;
  current_mood: PetMood;
  mood_updated_at: string;
}

// Child stats for accessory unlocking
export interface ChildReadingStats {
  total_practice_sessions: number;
  total_words_mastered: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_practice_date: string | null;
}
