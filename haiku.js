/**
 * Haiku generator: picks random phrases from the Epstein document corpus
 * and assembles them into proper 5-7-5 syllable haikus.
 */

let phraseBank = [];
let wordBank = [];
let isLoaded = false;

// ===== TAGLINES =====
const TAGLINES = [
    "found poetry from sealed places",
    "five, seven, five to life",
    "the documents speak in verse",
    "where redactions become stanzas",
    "court-ordered tranquility",
    "declassified one syllable at a time",
    "evidence has never been this elegant",
    "legally obtained. poetically arranged.",
    "what the foia intended",
    "finding inner peace in public records",
    "exhibit a in the art of calm",
    "unsealed for your enlightenment",
    "the most relaxing use of federal documents",
    "mindfulness through court filings",
    "therapeutic jurisprudence, literally",
    "depositions, distilled",
    "inhale testimony, exhale verdict",
    "every redaction is a pause for reflection",
    "the flight log of the soul",
    "putting the zen in subpoena",
    "namaste in the court of law",
    "plea deals in iambic pentameter, almost",
    "wellness content from unwellness documents",
    "classified serenity, now declassified",
];

function setRandomTagline() {
    const el = document.getElementById('tagline');
    if (el) {
        el.textContent = TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
    }
}

// ===== DATA LOADING =====

async function loadCorpus() {
    try {
        const response = await fetch('phrases.json');
        const data = await response.json();
        phraseBank = data.phrases || [];
        wordBank = data.words || [];
        isLoaded = true;
        console.log(`Loaded ${phraseBank.length} phrases, ${wordBank.length} words`);
        initBackgroundText(data.backgroundSnippets || phraseBank.slice(0, 500));
    } catch (err) {
        console.error('Failed to load corpus:', err);
        // Fallback: try loading from text file
        try {
            const response = await fetch('phrases.txt');
            const text = await response.text();
            phraseBank = text.split('\n').filter(l => l.trim().length > 3);
            wordBank = extractWords(phraseBank);
            isLoaded = true;
            console.log(`Loaded ${phraseBank.length} phrases from text`);
            initBackgroundText(phraseBank.slice(0, 500));
        } catch (err2) {
            console.error('Failed to load any corpus:', err2);
        }
    }
}

function extractWords(phrases) {
    const words = new Set();
    for (const phrase of phrases) {
        for (const word of phrase.split(/\s+/)) {
            const clean = word.replace(/[^a-zA-Z']/g, '').toLowerCase();
            if (clean.length >= 2) {
                words.add(clean);
            }
        }
    }
    return Array.from(words);
}

// ===== BACKGROUND SCROLLING TEXT =====

function initBackgroundText(snippets) {
    const layers = document.querySelectorAll('.bg-scroll-layer');
    const chunkSize = Math.ceil(snippets.length / layers.length);
    // Target scroll speed: ~15 pixels per second (very serene)
    const PIXELS_PER_SECOND = 15;

    layers.forEach((layer, i) => {
        const start = i * chunkSize;
        const chunk = snippets.slice(start, start + chunkSize);
        // Double the content so the scroll loop is seamless
        const text = chunk.join('  \u00B7  ');
        layer.textContent = text + '  \u00B7  ' + text;

        // Calculate duration based on actual content height
        requestAnimationFrame(() => {
            const contentHeight = layer.scrollHeight / 2; // half because we duplicated
            const duration = Math.max(contentHeight / PIXELS_PER_SECOND, 120);
            layer.style.animationDuration = `${duration}s`;
            layer.classList.add('loaded');
        });
    });
}

// ===== HAIKU GENERATION =====

// Words that should NOT end a line (dangling prepositions, articles, conjunctions)
const BAD_ENDINGS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'at',
    'by', 'for', 'with', 'from', 'as', 'is', 'was', 'were', 'are', 'be',
    'that', 'this', 'these', 'those', 'it', 'its', 'my', 'his', 'her',
    'our', 'your', 'their', 'not', 'no', 'so', 'if', 'then', 'than',
    'had', 'has', 'have', 'been', 'being', 'do', 'did', 'does', 'will',
    'would', 'could', 'should', 'shall', 'may', 'might', 'can', 'just',
    'very', 'also', 'about', 'into', 'onto', 'upon', 'over', 'under',
    'between', 'through', 'during', 'before', 'after', 'while', 'when',
    'where', 'which', 'who', 'whom', 'whose', 'what', 'how', 'because',
    'although', 'whether', 'i', 'we', 'you', 'he', 'she', 'they',
    'me', 'him', 'us', 'them', 'some', 'any', 'each', 'every',
]);

// Words that should NOT start a line
const BAD_STARTS = new Set([
    'and', 'or', 'but', 'so', 'yet', 'nor', 'for',
]);

function endsWell(words) {
    if (words.length === 0) return false;
    const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    return !BAD_ENDINGS.has(lastWord);
}

function startsWell(words) {
    if (words.length === 0) return false;
    const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, '');
    return !BAD_STARTS.has(firstWord);
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Build a line with exactly the target syllable count.
 * Lines must end on a "strong" word (noun, verb, adjective)
 * and not start with a conjunction.
 */
function buildLine(targetSyllables, maxAttempts = 300) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Strategy 1: Try to find a phrase subset that matches exactly
        if (phraseBank.length > 0) {
            const phrase = randomChoice(phraseBank);
            const words = phrase.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, ''));

            // Try the whole phrase
            if (SyllableCounter.countPhraseSyllables(phrase) === targetSyllables) {
                const cleaned = cleanPhrase(phrase);
                const cWords = cleaned.split(/\s+/);
                if (endsWell(cWords) && startsWell(cWords)) {
                    return cleaned;
                }
            }

            // Try subsets of consecutive words from this phrase
            for (let start = 0; start < words.length; start++) {
                let syllables = 0;
                let selectedWords = [];
                for (let j = start; j < words.length; j++) {
                    const word = words[j].replace(/[^a-zA-Z']/g, '');
                    if (!word) continue;
                    const s = SyllableCounter.countSyllables(word);
                    if (syllables + s <= targetSyllables) {
                        syllables += s;
                        selectedWords.push(word);
                        if (syllables === targetSyllables && selectedWords.length >= 2) {
                            if (endsWell(selectedWords) && startsWell(selectedWords)) {
                                return selectedWords.join(' ');
                            }
                            break; // right count but bad ending, try next start
                        }
                    } else {
                        break;
                    }
                }
            }
        }

        // Strategy 2: Build word by word, but ensure good ending
        if (attempt > 150 && wordBank.length > 0) {
            let syllables = 0;
            let selectedWords = [];
            let stuck = 0;

            while (syllables < targetSyllables && stuck < 50) {
                const word = randomChoice(wordBank);
                const s = SyllableCounter.countSyllables(word);

                if (syllables + s === targetSyllables) {
                    // Only accept if it ends well
                    if (!BAD_ENDINGS.has(word.toLowerCase())) {
                        selectedWords.push(word);
                        syllables += s;
                        break;
                    } else {
                        stuck++;
                    }
                } else if (syllables + s < targetSyllables) {
                    // For non-final words, skip bad starts if it's the first word
                    if (selectedWords.length === 0 && BAD_STARTS.has(word.toLowerCase())) {
                        stuck++;
                        continue;
                    }
                    selectedWords.push(word);
                    syllables += s;
                } else {
                    stuck++;
                }
            }

            if (syllables === targetSyllables && selectedWords.length >= 2
                && endsWell(selectedWords) && startsWell(selectedWords)) {
                return selectedWords.join(' ');
            }
        }
    }

    // Last resort: greedy with ending check
    return buildLineGreedy(targetSyllables);
}

function buildLineGreedy(target) {
    // Group words by syllable count for quick lookup
    const bySyllables = {};
    for (const word of wordBank) {
        const s = SyllableCounter.countSyllables(word);
        if (s <= target) {
            if (!bySyllables[s]) bySyllables[s] = [];
            bySyllables[s].push(word);
        }
    }

    // Try multiple times to get a good ending
    for (let attempt = 0; attempt < 20; attempt++) {
        let remaining = target;
        const words = [];

        while (remaining > 0) {
            // For the final word, filter to good endings
            if (remaining <= 3 && bySyllables[remaining]) {
                const goodEndings = bySyllables[remaining].filter(
                    w => !BAD_ENDINGS.has(w.toLowerCase())
                );
                if (goodEndings.length > 0) {
                    words.push(randomChoice(goodEndings));
                    remaining = 0;
                    break;
                }
            }

            if (bySyllables[remaining] && bySyllables[remaining].length > 0) {
                words.push(randomChoice(bySyllables[remaining]));
                break;
            }
            const options = [];
            for (let s = 1; s <= remaining; s++) {
                if (bySyllables[s]) {
                    for (const w of bySyllables[s]) {
                        options.push({ word: w, syllables: s });
                    }
                }
            }
            if (options.length === 0) break;
            const pick = randomChoice(options);
            // Skip bad starts for first word
            if (words.length === 0 && BAD_STARTS.has(pick.word.toLowerCase())) continue;
            words.push(pick.word);
            remaining -= pick.syllables;
        }

        if (endsWell(words) && startsWell(words)) {
            return words.join(' ');
        }
    }

    return 'silence falls here';
}

function cleanPhrase(phrase) {
    return phrase
        .replace(/[^\w\s']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function generateHaikuLines() {
    if (!isLoaded) return null;

    const line1 = buildLine(5);
    const line2 = buildLine(7);
    const line3 = buildLine(5);

    return { line1, line2, line3 };
}

// ===== UI INTERACTION =====

async function generateHaiku() {
    const btn = document.getElementById('generate-btn');
    const card = document.getElementById('haiku-card');
    const line1El = document.getElementById('line1');
    const line2El = document.getElementById('line2');
    const line3El = document.getElementById('line3');
    const sourceEl = document.getElementById('haiku-source');

    if (!isLoaded) {
        btn.querySelector('.btn-text').textContent = 'Loading...';
        return;
    }

    // Disable button during animation
    btn.classList.add('generating');

    // === PHASE 1: Fade out everything simultaneously ===
    sourceEl.classList.remove('visible');
    line1El.classList.remove('visible');
    line2El.classList.remove('visible');
    line3El.classList.remove('visible');

    // Wait for CSS transition to fully finish (0.5s transition + buffer)
    await sleep(650);

    // === PHASE 2: Swap content while fully invisible ===
    const haiku = generateHaikuLines();
    if (!haiku) {
        btn.classList.remove('generating');
        return;
    }

    line1El.textContent = haiku.line1;
    line2El.textContent = haiku.line2;
    line3El.textContent = haiku.line3;

    const s1 = SyllableCounter.countPhraseSyllables(haiku.line1);
    const s2 = SyllableCounter.countPhraseSyllables(haiku.line2);
    const s3 = SyllableCounter.countPhraseSyllables(haiku.line3);
    sourceEl.textContent = `${s1} \u2022 ${s2} \u2022 ${s3}`;

    // === PHASE 3: Fade in one line at a time ===
    await sleep(200);

    line1El.classList.add('visible');
    await waitForTransition(line1El);

    line2El.classList.add('visible');
    await waitForTransition(line2El);

    line3El.classList.add('visible');
    await waitForTransition(line3El);

    await sleep(300);
    sourceEl.classList.add('visible');

    // Re-enable button
    btn.classList.remove('generating');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForTransition(el) {
    return new Promise(resolve => {
        function onEnd(e) {
            if (e.target === el && e.propertyName === 'opacity') {
                el.removeEventListener('transitionend', onEnd);
                resolve();
            }
        }
        el.addEventListener('transitionend', onEnd);
        // Safety timeout in case transitionend doesn't fire
        setTimeout(resolve, 600);
    });
}

// ===== ENTRY ANIMATIONS =====
async function animateEntry() {
    // Stagger the .entered class to trigger CSS transitions
    const panel = document.querySelector('.content-panel');
    const header = document.querySelector('.header');
    const haikuDisplay = document.querySelector('.haiku-display');
    const btn = document.getElementById('generate-btn');
    const footer = document.querySelector('.footer');

    // Small initial delay to let the page render
    await sleep(100);

    panel.classList.add('entered');
    await sleep(200);
    header.classList.add('entered');
    await sleep(300);
    haikuDisplay.classList.add('entered');
    await sleep(400);
    btn.classList.add('entered');
    await sleep(200);
    footer.classList.add('entered');

    // Wait for the longest transition to finish (1.4s)
    await sleep(1500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    setRandomTagline();
    // Run entry animations and corpus loading in parallel
    const [_] = await Promise.all([animateEntry(), loadCorpus()]);
    // Generate first haiku after everything has settled
    await sleep(300);
    generateHaiku();
});
