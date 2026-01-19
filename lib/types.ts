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
