# StoryBloom

**Personalized Reading Adventures for Young Readers**

StoryBloom is an AI-powered reading application designed to transform reluctant readers into confident, enthusiastic ones through personalized stories and gamified word practice.

---

## Who Is StoryBloom For?

### Primary Audience: Reluctant Young Readers

StoryBloom is built specifically for children ages 3-12 who struggle with or resist reading. These are kids who:

- Find traditional reading materials boring or intimidating
- Need extra encouragement and motivation to practice
- Benefit from personalized, interest-driven content
- Learn better through interactive, game-like experiences

### Supporting Parents

Parents use StoryBloom to:

- Provide engaging, educational content tailored to their child
- Track reading progress and celebrate achievements
- Manage multiple children with individual profiles and reading levels

---

## Features

### Personalized Story Generation

Every story is custom-created for each child:

- **Child as the Hero**: Stories feature the child as the main character, using their name, appearance, and personality
- **Interest-Driven Narratives**: Favorite things (dinosaurs, unicorns, soccer, etc.) are woven into each adventure
- **Age-Appropriate Content**: Stories match reading levels from Pre-K through 6th Grade
- **AI-Generated Illustrations**: Each story includes custom artwork to bring the narrative to life

**Story Creation Modes:**
- Random generation based on child's profile
- Topic-based stories (parent specifies a theme)
- Illustration-inspired stories (upload artwork to spark a narrative)

### Story Library

- Save and organize generated stories
- Mark favorites for easy access
- Adjustable font sizes for reading comfort
- Re-read beloved stories anytime

### Word Quest: Gamified Reading Practice

A speech-based word practice game that makes learning fun:

**How It Works:**
1. Children see words matched to their reading level
2. They tap the microphone and read aloud
3. Speech recognition evaluates pronunciation
4. Correct answers earn stars and rewards
5. Progress is tracked and celebrated

**Learning Features:**
- Curated word lists by grade level (sight words, phonics, vocabulary)
- Spaced repetition for optimal retention
- Adaptive difficulty based on mastery

### Virtual Pet Companions

Children earn and nurture virtual pets through reading practice:

**Pet Types:** Cat, dog, dinosaur, unicorn, dragon, bunny, bear, bird, fish, butterfly

**Pet Features:**
- Customizable appearance (colors, patterns, accessories)
- AI-generated unique pet portraits
- Personality and behaviors that evolve with leveling
- Interactive play: feed, pet, play, and talk with your companion
- Pets respond with AI-generated dialogue

**Progression System:**
- Earn XP through word practice
- Level up pets to unlock new behaviors and abilities
- Track happiness and energy stats

### Child Profile Management

- Multiple profiles per family account
- Detailed customization: name, age, reading level, interests
- Physical characteristics for story personalization
- Parent notes and summaries

---

## Technology

StoryBloom is built with modern, secure, and scalable technologies:

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling and responsive design |
| React 18 | UI components with Server Components |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database and authentication |
| Next.js API Routes | Server-side API endpoints |
| Supabase Auth | Secure user authentication |

### AI & External Services
| Technology | Purpose |
|------------|---------|
| Anthropic Claude (Sonnet 4) | Story generation and pet dialogue |
| OpenAI DALL-E 3 | Story and pet illustration generation |
| Web Speech API | Voice recognition for word practice |
| Web Speech Synthesis | Text-to-speech for pet interactions |

### Deployment
| Technology | Purpose |
|------------|---------|
| Vercel | Hosting and serverless functions |
| Supabase Cloud | Managed database hosting |

### Security
- All AI API keys are server-side only (never exposed to browsers)
- Secure authentication with Supabase Auth SSR
- Protected routes for all child and family data

---

## Platform

StoryBloom is a web application optimized for tablets and mobile devices.

**Production URL:** https://story-bloom.shredstack.net

A native iOS app is planned using Capacitor WebView, allowing web updates to appear in the app without requiring App Store resubmission.

---

## Why StoryBloom Works

1. **Personalization Creates Connection**: When children see themselves in stories with their favorite things, reading becomes personally meaningful

2. **Gamification Builds Habits**: Points, streaks, achievements, and pet companions transform practice into play

3. **Speech-Based Learning**: Reading aloud with instant feedback builds pronunciation confidence without typing barriers

4. **Adaptive Difficulty**: Content adjusts to each child's level, preventing frustration while encouraging growth

5. **Emotional Investment**: Virtual pets create ongoing motivation to return and practice

---

*StoryBloom: Where every child becomes the hero of their own reading adventure.*
