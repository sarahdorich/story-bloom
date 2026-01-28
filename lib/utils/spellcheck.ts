/**
 * Spell checking utility using multiple methods.
 * Used to validate words added to a child's struggling words list.
 */

// Common English words that children learn to read - includes sight words,
// common verbs (with conjugations), articles, pronouns, prepositions, etc.
// This covers the most frequent words that Free Dictionary API might miss.
const COMMON_ENGLISH_WORDS = new Set([
  // Articles & determiners
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  // Pronouns
  'i', 'me', 'you', 'he', 'him', 'she', 'it', 'we', 'us', 'they', 'them', 'who', 'what', 'which',
  // Be verbs (all conjugations)
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  // Have verbs
  'have', 'has', 'had', 'having',
  // Do verbs
  'do', 'does', 'did', 'done', 'doing',
  // Modal verbs
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  // Common verbs and their forms
  'go', 'goes', 'went', 'gone', 'going',
  'get', 'gets', 'got', 'gotten', 'getting',
  'say', 'says', 'said', 'saying',
  'see', 'sees', 'saw', 'seen', 'seeing',
  'come', 'comes', 'came', 'coming',
  'make', 'makes', 'made', 'making',
  'know', 'knows', 'knew', 'known', 'knowing',
  'take', 'takes', 'took', 'taken', 'taking',
  'think', 'thinks', 'thought', 'thinking',
  'look', 'looks', 'looked', 'looking',
  'want', 'wants', 'wanted', 'wanting',
  'give', 'gives', 'gave', 'given', 'giving',
  'use', 'uses', 'used', 'using',
  'find', 'finds', 'found', 'finding',
  'tell', 'tells', 'told', 'telling',
  'ask', 'asks', 'asked', 'asking',
  'work', 'works', 'worked', 'working',
  'seem', 'seems', 'seemed', 'seeming',
  'feel', 'feels', 'felt', 'feeling',
  'try', 'tries', 'tried', 'trying',
  'leave', 'leaves', 'left', 'leaving',
  'call', 'calls', 'called', 'calling',
  'put', 'puts', 'putting',
  'run', 'runs', 'ran', 'running',
  'read', 'reads', 'reading',
  'write', 'writes', 'wrote', 'written', 'writing',
  'sit', 'sits', 'sat', 'sitting',
  'stand', 'stands', 'stood', 'standing',
  'hear', 'hears', 'heard', 'hearing',
  'let', 'lets', 'letting',
  'begin', 'begins', 'began', 'begun', 'beginning',
  'keep', 'keeps', 'kept', 'keeping',
  'hold', 'holds', 'held', 'holding',
  'bring', 'brings', 'brought', 'bringing',
  'happen', 'happens', 'happened', 'happening',
  'set', 'sets', 'setting',
  'learn', 'learns', 'learned', 'learnt', 'learning',
  'play', 'plays', 'played', 'playing',
  'move', 'moves', 'moved', 'moving',
  'live', 'lives', 'lived', 'living',
  'believe', 'believes', 'believed', 'believing',
  'stop', 'stops', 'stopped', 'stopping',
  'watch', 'watches', 'watched', 'watching',
  'follow', 'follows', 'followed', 'following',
  'speak', 'speaks', 'spoke', 'spoken', 'speaking',
  'meet', 'meets', 'met', 'meeting',
  'pay', 'pays', 'paid', 'paying',
  'send', 'sends', 'sent', 'sending',
  'build', 'builds', 'built', 'building',
  'stay', 'stays', 'stayed', 'staying',
  'fall', 'falls', 'fell', 'fallen', 'falling',
  'cut', 'cuts', 'cutting',
  'reach', 'reaches', 'reached', 'reaching',
  'kill', 'kills', 'killed', 'killing',
  'remain', 'remains', 'remained', 'remaining',
  'spend', 'spends', 'spent', 'spending',
  'grow', 'grows', 'grew', 'grown', 'growing',
  'open', 'opens', 'opened', 'opening',
  'walk', 'walks', 'walked', 'walking',
  'win', 'wins', 'won', 'winning',
  'teach', 'teaches', 'taught', 'teaching',
  'buy', 'buys', 'bought', 'buying',
  'eat', 'eats', 'ate', 'eaten', 'eating',
  'drink', 'drinks', 'drank', 'drunk', 'drinking',
  'sleep', 'sleeps', 'slept', 'sleeping',
  'wake', 'wakes', 'woke', 'woken', 'waking',
  'wear', 'wears', 'wore', 'worn', 'wearing',
  'draw', 'draws', 'drew', 'drawn', 'drawing',
  'break', 'breaks', 'broke', 'broken', 'breaking',
  'drive', 'drives', 'drove', 'driven', 'driving',
  'ride', 'rides', 'rode', 'ridden', 'riding',
  'swim', 'swims', 'swam', 'swum', 'swimming',
  'fly', 'flies', 'flew', 'flown', 'flying',
  'sing', 'sings', 'sang', 'sung', 'singing',
  'dance', 'dances', 'danced', 'dancing',
  'jump', 'jumps', 'jumped', 'jumping',
  'climb', 'climbs', 'climbed', 'climbing',
  'throw', 'throws', 'threw', 'thrown', 'throwing',
  'catch', 'catches', 'caught', 'catching',
  'carry', 'carries', 'carried', 'carrying',
  'pick', 'picks', 'picked', 'picking',
  'pull', 'pulls', 'pulled', 'pulling',
  'push', 'pushes', 'pushed', 'pushing',
  'help', 'helps', 'helped', 'helping',
  'love', 'loves', 'loved', 'loving',
  'like', 'likes', 'liked', 'liking',
  'need', 'needs', 'needed', 'needing',
  'start', 'starts', 'started', 'starting',
  'show', 'shows', 'showed', 'shown', 'showing',
  'turn', 'turns', 'turned', 'turning',
  'close', 'closes', 'closed', 'closing',
  'change', 'changes', 'changed', 'changing',
  'add', 'adds', 'added', 'adding',
  'wait', 'waits', 'waited', 'waiting',
  'save', 'saves', 'saved', 'saving',
  'smile', 'smiles', 'smiled', 'smiling',
  'laugh', 'laughs', 'laughed', 'laughing',
  'cry', 'cries', 'cried', 'crying',
  // Prepositions
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
  'beneath', 'under', 'above', 'below', 'between', 'through', 'during', 'before', 'after', 'behind',
  'beside', 'besides', 'beyond', 'near', 'off', 'out', 'around', 'among', 'along', 'across', 'against',
  // Conjunctions
  'and', 'or', 'but', 'so', 'if', 'because', 'when', 'while', 'although', 'though', 'unless', 'until',
  'as', 'than', 'whether', 'since', 'where', 'after', 'before',
  // Adverbs
  'not', 'just', 'only', 'also', 'very', 'even', 'still', 'already', 'always', 'never', 'often',
  'sometimes', 'usually', 'really', 'almost', 'perhaps', 'maybe', 'probably', 'certainly', 'surely',
  'here', 'there', 'now', 'then', 'today', 'yesterday', 'tomorrow', 'soon', 'later', 'ago', 'away',
  'back', 'well', 'much', 'more', 'most', 'less', 'least', 'too', 'enough', 'quite', 'rather',
  'again', 'ever', 'yet', 'once', 'twice', 'how', 'why', 'yes', 'no',
  // Question words
  'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whom', 'whose',
  // Common adjectives
  'good', 'better', 'best', 'bad', 'worse', 'worst', 'big', 'bigger', 'biggest',
  'small', 'smaller', 'smallest', 'little', 'large', 'larger', 'largest',
  'long', 'longer', 'longest', 'short', 'shorter', 'shortest',
  'old', 'older', 'oldest', 'young', 'younger', 'youngest',
  'new', 'newer', 'newest', 'first', 'last', 'next', 'other', 'same', 'different',
  'great', 'high', 'higher', 'highest', 'low', 'lower', 'lowest',
  'right', 'wrong', 'true', 'false', 'real', 'own', 'whole', 'full', 'empty',
  'happy', 'happier', 'happiest', 'sad', 'sadder', 'saddest',
  'hot', 'hotter', 'hottest', 'cold', 'colder', 'coldest',
  'fast', 'faster', 'fastest', 'slow', 'slower', 'slowest',
  'hard', 'harder', 'hardest', 'soft', 'softer', 'softest',
  'easy', 'easier', 'easiest', 'difficult',
  'beautiful', 'pretty', 'ugly', 'clean', 'dirty', 'nice', 'mean',
  'kind', 'friendly', 'funny', 'silly', 'smart', 'clever', 'brave',
  'scared', 'afraid', 'angry', 'tired', 'hungry', 'thirsty', 'sick',
  'ready', 'able', 'possible', 'important', 'special', 'free',
  'dark', 'darker', 'darkest', 'light', 'lighter', 'lightest', 'bright',
  'quiet', 'loud', 'strong', 'weak', 'rich', 'poor',
  // Common nouns - people
  'man', 'men', 'woman', 'women', 'child', 'children', 'boy', 'boys', 'girl', 'girls',
  'baby', 'babies', 'person', 'people', 'family', 'families', 'friend', 'friends',
  'mother', 'mom', 'mommy', 'father', 'dad', 'daddy', 'parent', 'parents',
  'sister', 'brother', 'son', 'daughter', 'grandma', 'grandpa', 'grandmother', 'grandfather',
  'aunt', 'uncle', 'cousin', 'teacher', 'student', 'doctor', 'nurse',
  // Common nouns - animals
  'dog', 'dogs', 'cat', 'cats', 'bird', 'birds', 'fish', 'bear', 'bears',
  'horse', 'horses', 'cow', 'cows', 'pig', 'pigs', 'sheep', 'chicken', 'chickens',
  'duck', 'ducks', 'rabbit', 'rabbits', 'mouse', 'mice', 'lion', 'tiger', 'elephant',
  'monkey', 'frog', 'snake', 'bug', 'bugs', 'bee', 'bees', 'butterfly',
  // Common nouns - things
  'thing', 'things', 'time', 'times', 'year', 'years', 'day', 'days', 'night', 'nights',
  'week', 'weeks', 'month', 'months', 'morning', 'afternoon', 'evening',
  'way', 'ways', 'place', 'places', 'world', 'country', 'city', 'town', 'home', 'house', 'room',
  'door', 'window', 'floor', 'wall', 'bed', 'table', 'chair', 'book', 'books',
  'paper', 'pen', 'pencil', 'word', 'words', 'name', 'names', 'number', 'numbers',
  'food', 'water', 'milk', 'bread', 'apple', 'banana', 'orange', 'cake', 'cookie',
  'car', 'cars', 'bus', 'train', 'plane', 'boat', 'bike', 'ball', 'toy', 'toys', 'game', 'games',
  'tree', 'trees', 'flower', 'flowers', 'grass', 'sun', 'moon', 'star', 'stars', 'sky', 'cloud',
  'rain', 'snow', 'wind', 'fire', 'earth', 'rock', 'stone', 'sand', 'river', 'lake', 'ocean', 'sea',
  'eye', 'eyes', 'ear', 'ears', 'nose', 'mouth', 'hand', 'hands', 'foot', 'feet', 'head', 'face',
  'hair', 'arm', 'arms', 'leg', 'legs', 'heart', 'body',
  'school', 'class', 'story', 'stories', 'picture', 'pictures', 'song', 'songs', 'color', 'colors',
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray',
  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
  'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand',
  // Contractions (without apostrophe for normalization)
  "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't",
  "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't",
  "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll", "you'd",
  "he's", "he'll", "he'd", "she's", "she'll", "she'd", "it's", "it'll",
  "we're", "we've", "we'll", "we'd", "they're", "they've", "they'll", "they'd",
  "that's", "there's", "here's", "what's", "who's", "let's",
])

/**
 * Validates if a word is a valid English word.
 * First checks against a list of common words, then falls back to the Free Dictionary API.
 */
export async function isValidEnglishWord(word: string): Promise<boolean> {
  const normalized = word.toLowerCase().trim()

  // Empty or whitespace-only
  if (!normalized) return false

  // Check against common words list first (fast, no API call needed)
  if (COMMON_ENGLISH_WORDS.has(normalized)) {
    return true
  }

  // Single character - only 'a' and 'i' are valid (already in common words, but double-check)
  if (normalized.length === 1) {
    return normalized === 'a' || normalized === 'i'
  }

  // Fall back to Free Dictionary API for less common words
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`
    )
    return response.ok // 200 = valid word, 404 = not found
  } catch (error) {
    // On network error, allow the word (fail open for better UX)
    console.error('Spell check API error:', error)
    return true
  }
}

/**
 * Validates a word for the struggling words feature.
 * Returns null if valid, or an error message if invalid.
 */
export async function validateWord(word: string): Promise<string | null> {
  const normalized = word.toLowerCase().trim()

  // Check for empty/whitespace
  if (!normalized) {
    return 'Please enter a word'
  }

  // Check for valid characters (letters and apostrophes only)
  if (!/^[a-z']+$/i.test(normalized)) {
    return 'Words can only contain letters'
  }

  // Spell check
  const isValid = await isValidEnglishWord(normalized)
  if (!isValid) {
    return `"${word}" doesn't appear to be a valid English word. Please check the spelling.`
  }

  return null // Valid
}
