/**
 * Simple English syllabification for the Word Coach feature.
 * Uses basic phonetic rules - not perfect but good enough for reading practice.
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'y']);

// Common prefixes and suffixes to preserve
const COMMON_PREFIXES = ['un', 're', 'pre', 'dis', 'mis', 'over', 'under', 'out', 'sub'];
const COMMON_SUFFIXES = ['ing', 'ed', 'ly', 'er', 'est', 'tion', 'sion', 'ness', 'ment', 'ful', 'less', 'able', 'ible'];

// Letter combinations that shouldn't be split
const CONSONANT_BLENDS = new Set([
  'bl', 'br', 'ch', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
  'pl', 'pr', 'sc', 'sh', 'sk', 'sl', 'sm', 'sn', 'sp', 'st',
  'sw', 'th', 'tr', 'tw', 'wh', 'wr', 'sch', 'scr', 'shr', 'spl',
  'spr', 'squ', 'str', 'thr', 'ck', 'ng', 'nk', 'ph', 'gh',
]);

// Vowel digraphs that shouldn't be split
const VOWEL_DIGRAPHS = new Set([
  'ai', 'au', 'aw', 'ay', 'ea', 'ee', 'ei', 'eu', 'ew',
  'ey', 'ie', 'oa', 'oe', 'oi', 'oo', 'ou', 'ow', 'oy', 'ue', 'ui',
]);

function isVowel(char: string): boolean {
  return VOWELS.has(char.toLowerCase());
}

function isConsonant(char: string): boolean {
  return /[a-z]/i.test(char) && !isVowel(char);
}

/**
 * Syllabifies a word into an array of syllables.
 * Uses basic English phonetic rules.
 */
export function syllabify(word: string): string[] {
  const normalized = word.toLowerCase().trim();

  // Very short words don't need splitting
  if (normalized.length <= 3) {
    return [normalized];
  }

  // Count vowels - if only one vowel sound, it's one syllable
  const vowelCount = normalized.split('').filter(isVowel).length;
  if (vowelCount <= 1) {
    return [normalized];
  }

  const syllables: string[] = [];
  let current = '';
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];
    const nextNextChar = normalized[i + 2];

    current += char;

    // Check if we're at a syllable boundary
    if (isVowel(char) && i < normalized.length - 1) {
      // Check for vowel digraphs (don't split)
      const twoChars = char + (nextChar || '');
      if (VOWEL_DIGRAPHS.has(twoChars)) {
        current += nextChar;
        i += 2;
        continue;
      }

      // Check what follows the vowel
      if (nextChar && isConsonant(nextChar)) {
        // VCV pattern: split before single consonant
        // VCCV pattern: split between consonants (usually)

        const restOfWord = normalized.slice(i + 1);

        // Check for consonant blends
        const twoConsonants = (nextChar || '') + (nextNextChar || '');
        const threeConsonants = twoConsonants + (normalized[i + 3] || '');

        if (nextNextChar && isVowel(nextNextChar)) {
          // VCV: keep consonant with next syllable
          if (current.length >= 2) {
            syllables.push(current);
            current = '';
          }
        } else if (nextNextChar && isConsonant(nextNextChar)) {
          // VCCV: check if they're a blend
          if (CONSONANT_BLENDS.has(twoConsonants) || CONSONANT_BLENDS.has(threeConsonants)) {
            // Keep blend with next syllable
            if (current.length >= 2) {
              syllables.push(current);
              current = '';
            }
          } else {
            // Split between consonants
            current += nextChar;
            i++;
            if (current.length >= 2) {
              syllables.push(current);
              current = '';
            }
          }
        }
      }
    }

    i++;
  }

  // Add remaining characters
  if (current) {
    // If we have existing syllables, check if we should merge
    if (syllables.length > 0 && current.length === 1 && isConsonant(current)) {
      syllables[syllables.length - 1] += current;
    } else if (syllables.length > 0 && current.length <= 2 && !current.split('').some(isVowel)) {
      // Merge consonant-only endings
      syllables[syllables.length - 1] += current;
    } else {
      syllables.push(current);
    }
  }

  // Clean up: merge very short syllables
  const cleaned = mergeShortSyllables(syllables);

  // If we somehow ended up with no splits, return the original word
  if (cleaned.length === 0) {
    return [normalized];
  }

  return cleaned;
}

/**
 * Merges syllables that are too short (single consonants, etc.)
 */
function mergeShortSyllables(syllables: string[]): string[] {
  if (syllables.length <= 1) return syllables;

  const result: string[] = [];

  for (let i = 0; i < syllables.length; i++) {
    const syllable = syllables[i];
    const hasVowel = syllable.split('').some(isVowel);

    if (!hasVowel && result.length > 0) {
      // Merge consonant-only syllable with previous
      result[result.length - 1] += syllable;
    } else if (!hasVowel && i < syllables.length - 1) {
      // Merge with next syllable
      syllables[i + 1] = syllable + syllables[i + 1];
    } else if (syllable.length === 1 && i > 0 && !isVowel(syllable)) {
      // Single consonant - merge with previous
      result[result.length - 1] += syllable;
    } else {
      result.push(syllable);
    }
  }

  return result;
}

/**
 * Formats syllables for display with separator.
 */
export function formatSyllables(syllables: string[], separator: string = ' • '): string {
  return syllables.join(separator);
}

/**
 * Normalizes a word for comparison and storage.
 * Removes punctuation except apostrophes, converts to lowercase.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/^[^a-z']+|[^a-z']+$/g, '') // Remove leading/trailing non-letters (keep apostrophes)
    .replace(/[^a-z']/g, ''); // Remove any remaining non-letters except apostrophes
}

