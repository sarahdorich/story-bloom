# StoryBloom Games

StoryBloom has two interactive games designed to help children practice reading while earning virtual pet rewards.

## Games Overview

| Game | Description | Reward Threshold |
|------|-------------|------------------|
| **Word Quest** | Read individual sight words aloud | 90% accuracy for new pet |
| **Sentence Shenanigans** | Read full sentences from uploaded materials | 50% accuracy for new pet |

---

## Word Quest

**Location:** `app/(protected)/games/word-quest/`

### How It Works

1. Child is presented with one word at a time (10 words per session)
2. Child reads the word aloud using the microphone
3. Speech recognition captures the spoken word
4. Fuzzy matching algorithm determines correctness
5. Session completes after all words are practiced

### Key Mechanics

- **Words per session:** 10
- **Word levels:** Pre-K through 6th Grade
- **Word selection:** Based on child's reading level, prioritizing unmastered words
- **Matching:** Fuzzy matching with Levenshtein distance and phonetic variation handling

### Rewards

| Condition | Reward |
|-----------|--------|
| First session ever (any score) | New pet with customization |
| 90%+ accuracy (subsequent sessions) | New pet with customization |
| Any completed session | Pet XP for existing pets |

### Key Files

- Practice UI: `app/(protected)/games/word-quest/practice/page.tsx`
- Hook: `lib/hooks/useWordQuest.ts`
- API: `app/api/word-quest/`

---

## Sentence Shenanigans

**Location:** `app/(protected)/games/sentence-shenanigans/`

### How It Works

1. Parent uploads an image of reading material (worksheet, book page, etc.)
2. OCR extracts sentences from the image
3. Parent reviews and can edit extracted sentences
4. Child practices reading each sentence aloud
5. Word-by-word accuracy is calculated

### Key Mechanics

- **Accuracy calculation:** Word-level matching with alignment algorithm
- **Sentence "correct" threshold:** 50% word accuracy
- **XP system:** Base 5 XP per sentence + accuracy bonuses + completion bonus

### XP Rewards

```
Base per sentence:     5 XP
90%+ accuracy bonus:  10 XP
95%+ accuracy bonus:  20 XP
100% accuracy bonus:  35 XP
Completion bonus:     15 XP (all sentences practiced)
```

### Pet Rewards

| Condition | Reward |
|-----------|--------|
| First session with 50%+ accuracy (no pets) | New pet with customization |
| 50%+ accuracy (subsequent sessions) | New pet with customization |
| Any session with 50%+ accuracy | Pet XP for existing pets |

### Key Files

- Practice UI: `app/(protected)/games/sentence-shenanigans/materials/[materialId]/practice/page.tsx`
- Hook: `lib/hooks/useSentenceShenanigans.ts`
- Components: `app/(protected)/games/sentence-shenanigans/components/`
- API: `app/api/sentence-shenanigans/`

---

## Pet System

Pets are the primary reward mechanism for both games.

### Pet Types

Pet type is selected based on the child's favorite things:
- cat, dog, dinosaur, unicorn, dragon, bunny, bear, bird, fish, butterfly, axolotl

### Adding a New Pet Type

When adding a new pet type, update the following files:

1. **`lib/types.ts`** - Add to these records:
   - `PET_TYPES` array
   - `PET_DEFAULT_HABITATS` (assign a default habitat)
   - `BEHAVIORS_BY_LEVEL` (10 levels of behaviors)
   - `PET_MAPPINGS` (keywords that map to this pet type)

2. **`lib/pet-customization-options.ts`** - Add to `PET_TYPE_OPTIONS`:
   - `allowedColors` - Available color options
   - `allowedPatterns` - Available pattern options
   - `suggestedAccessories` - Recommended accessories for this pet
   - `defaultPromptStyle` - DALL-E prompt description for image generation

3. **`app/api/word-quest/pets/route.ts`** - Add to these records:
   - `PET_NAMES` - Array of suggested names
   - `PERSONALITIES` - Array of personality descriptions

### Pet Customization

When earning a new pet, children can customize:
- Name
- Primary and secondary colors
- Pattern (solid, spotted, striped, etc.)
- Accessories

### Accessories

Accessories are unlocked through achievements (not purchases):

| Unlock Type | Examples |
|-------------|----------|
| Sessions completed | 3, 10, 15, 30, 50 sessions |
| Words mastered | 10, 30, 50, 75, 100 words |
| Streak days | 3, 7, 14, 21, 30 day streaks |

Accessories come in 4 rarities: Common, Rare, Epic, Legendary

### Key Files

- Pet hook: `lib/hooks/usePets.ts`
- Pet types: `lib/types.ts` (PET_MAPPINGS)
- Customization options: `lib/pet-customization-options.ts`
- Accessory inventory: `components/word-quest/AccessoryInventory.tsx`

---

## Shared Components

Both games use shared UI components in `components/word-quest/`:

| Component | Purpose |
|-----------|---------|
| `SpeechButton.tsx` | Microphone button with status animations |
| `ProgressBar.tsx` | Shows current progress and correct count |
| `SuccessAnimation.tsx` | Celebration animation on completion |
| `PetRewardModal.tsx` | Pet customization modal |
| `PostSessionPetReaction.tsx` | Pet response after sessions |
| `PetCustomizationForm.tsx` | Color/pattern selection form |

### Speech Recognition

- **Hook:** `lib/hooks/useSpeechRecognition.ts`
- **Browser support:** Chrome and Edge only (Web Speech API)
- **Requires:** Microphone permission

---

## Database Tables

### Word Quest

```
word_lists          - Available words by reading level
word_progress       - Child's progress on each word
practice_sessions   - Completed sessions
```

### Sentence Shenanigans

```
reading_materials       - Parent-uploaded materials
material_sentences      - Extracted sentences per material
sentence_practice_sessions - Completed sessions
sentence_attempts       - Per-sentence results within a session
```

### Pets

```
pets                    - Child's pets
accessories             - Available accessories
child_accessories       - Unlocked accessories per child
pet_equipped_accessories - Currently equipped accessories
```

---

## Constants

Key thresholds defined in `lib/types.ts`:

```typescript
PET_REWARD_SCORE_THRESHOLD = 90    // Word Quest: 90% for new pet
SENTENCE_ACCURACY_THRESHOLD = 50   // Sentence Shenanigans: 50% for new pet
```
