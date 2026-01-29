/**
 * Fuzzy word matching utilities for young readers
 * Tolerates common speech recognition errors and pronunciation variations
 *
 * This file is intentionally NOT marked as 'use client' so it can be
 * imported by both client components and server-side API routes.
 */

/**
 * Fuzzy word matching for young readers
 * Tolerates common speech recognition errors and pronunciation variations
 */
export function isWordMatch(spoken: string, target: string): boolean {
  const cleanSpoken = spoken.toLowerCase().trim()
  const cleanTarget = target.toLowerCase().trim()

  // Exact match
  if (cleanSpoken === cleanTarget) return true

  // Check if the word is contained in a phrase (e.g., "the word is cat")
  const words = cleanSpoken.split(/\s+/)
  if (words.includes(cleanTarget)) return true

  // Levenshtein distance for fuzzy matching
  const maxDistance = cleanTarget.length <= 3 ? 1 : 2
  if (levenshteinDistance(cleanSpoken, cleanTarget) <= maxDistance) return true

  // Check against each word in the spoken phrase
  for (const word of words) {
    if (levenshteinDistance(word, cleanTarget) <= maxDistance) return true
  }

  // Common phonetic substitutions
  if (arePhoneticallySimilar(cleanSpoken, cleanTarget)) return true

  return false
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

function arePhoneticallySimilar(spoken: string, target: string): boolean {
  // Common speech recognition substitutions for young readers
  // Extended set to better handle children's pronunciation variations
  const substitutions: [RegExp, string][] = [
    // TH sounds - children often substitute these
    [/th/g, 'f'],   // "the" -> "fe", "three" -> "free"
    [/th/g, 'd'],   // "the" -> "de", "this" -> "dis"
    [/th/g, 'v'],   // "the" -> "ve", "father" -> "faver"
    [/th/g, 's'],   // "think" -> "sink"
    [/th/g, 't'],   // "three" -> "tree"

    // W sounds
    [/wh/g, 'w'],   // "what" -> "wat"
    [/w/g, 'v'],    // Some accents: "water" -> "vater"

    // R sounds - children often struggle with R
    [/r/g, 'w'],    // "rabbit" -> "wabbit"
    [/er$/g, 'a'],  // "water" -> "wata"
    [/or$/g, 'a'],  // "doctor" -> "docta"

    // L sounds
    [/l/g, 'w'],    // "little" -> "wittle"
    [/l/g, 'y'],    // "love" -> "yove"

    // Other common substitutions
    [/ph/g, 'f'],   // "phone" -> "fone"
    [/ck/g, 'k'],   // "back" -> "bak"
    [/ght/g, 't'],  // "night" -> "nit"
    [/tion/g, 'shun'], // "action" -> "akshun"
    [/sion/g, 'zhun'], // "vision" -> "vizhun"

    // S and SH sounds
    [/sh/g, 's'],   // "ship" -> "sip"
    [/s/g, 'th'],   // "sun" -> "thun" (lisp)
    [/ch/g, 'sh'],  // "chip" -> "ship"
    [/ch/g, 't'],   // "chip" -> "tip"

    // Vowel reductions common in children's speech
    [/ing$/g, 'in'], // "running" -> "runnin"
    [/ed$/g, 'd'],   // "walked" -> "walkd"
    [/ed$/g, 't'],   // "jumped" -> "jumpt"

    // Double letters simplified
    [/ll/g, 'l'],   // "ball" -> "bal"
    [/ss/g, 's'],   // "miss" -> "mis"
    [/tt/g, 't'],   // "butter" -> "buter"
    [/ff/g, 'f'],   // "stuff" -> "stuf"

    // Silent letters and common drops
    [/kn/g, 'n'],   // "know" -> "now"
    [/wr/g, 'r'],   // "write" -> "rite"
    [/gn/g, 'n'],   // "gnome" -> "nome"
    [/mb$/g, 'm'],  // "climb" -> "clim"
  ]

  let normalizedSpoken = spoken
  let normalizedTarget = target

  for (const [pattern, replacement] of substitutions) {
    normalizedSpoken = normalizedSpoken.replace(pattern, replacement)
    normalizedTarget = normalizedTarget.replace(pattern, replacement)
  }

  // Direct match after phonetic normalization
  if (normalizedSpoken === normalizedTarget) return true

  // Also check with Levenshtein distance after phonetic normalization
  // This catches cases where multiple substitutions compound
  const distance = levenshteinDistance(normalizedSpoken, normalizedTarget)
  return distance <= 1
}
