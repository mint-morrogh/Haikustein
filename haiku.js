let phraseBank = [];
let wordBank = [];
let isLoaded = false;

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

async function loadCorpus() {
    try {
        const response = await fetch('phrases.json');
        const data = await response.json();
        phraseBank = data.phrases || [];
        wordBank = data.words || [];
        isLoaded = true;
        initBackgroundText(data.backgroundSnippets || phraseBank.slice(0, 500));
    } catch (err) {
        try {
            const response = await fetch('phrases.txt');
            const text = await response.text();
            phraseBank = text.split('\n').filter(l => l.trim().length > 3);
            wordBank = extractWords(phraseBank);
            isLoaded = true;
            initBackgroundText(phraseBank.slice(0, 500));
        } catch (err2) {
            console.error('Failed to load corpus:', err2);
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

function initBackgroundText(snippets) {
    const layers = document.querySelectorAll('.bg-scroll-layer');
    const chunkSize = Math.ceil(snippets.length / layers.length);
    const PIXELS_PER_SECOND = 15;

    layers.forEach((layer, i) => {
        const start = i * chunkSize;
        const chunk = snippets.slice(start, start + chunkSize);
        const text = chunk.join('  \u00B7  ');
        layer.textContent = text + '  \u00B7  ' + text;

        requestAnimationFrame(() => {
            const contentHeight = layer.scrollHeight / 2;
            const duration = Math.max(contentHeight / PIXELS_PER_SECOND, 120);
            layer.style.animationDuration = `${duration}s`;
            layer.classList.add('loaded');
        });
    });
}

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

function buildLine(targetSyllables, maxAttempts = 300) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (phraseBank.length > 0) {
            const phrase = randomChoice(phraseBank);
            const words = phrase.split(/\s+/).filter(w => w.replace(/[^a-zA-Z]/g, ''));

            if (SyllableCounter.countPhraseSyllables(phrase) === targetSyllables) {
                const cleaned = cleanPhrase(phrase);
                const cWords = cleaned.split(/\s+/);
                if (endsWell(cWords) && startsWell(cWords)) {
                    return cleaned;
                }
            }

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
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }
        }

        if (attempt > 150 && wordBank.length > 0) {
            let syllables = 0;
            let selectedWords = [];
            let stuck = 0;

            while (syllables < targetSyllables && stuck < 50) {
                const word = randomChoice(wordBank);
                const s = SyllableCounter.countSyllables(word);

                if (syllables + s === targetSyllables) {
                    if (!BAD_ENDINGS.has(word.toLowerCase())) {
                        selectedWords.push(word);
                        syllables += s;
                        break;
                    } else {
                        stuck++;
                    }
                } else if (syllables + s < targetSyllables) {
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

    return buildLineGreedy(targetSyllables);
}

function buildLineGreedy(target) {
    const bySyllables = {};
    for (const word of wordBank) {
        const s = SyllableCounter.countSyllables(word);
        if (s <= target) {
            if (!bySyllables[s]) bySyllables[s] = [];
            bySyllables[s].push(word);
        }
    }

    for (let attempt = 0; attempt < 20; attempt++) {
        let remaining = target;
        const words = [];

        while (remaining > 0) {
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

async function generateHaiku() {
    const btn = document.getElementById('generate-btn');
    const line1El = document.getElementById('line1');
    const line2El = document.getElementById('line2');
    const line3El = document.getElementById('line3');
    const sourceEl = document.getElementById('haiku-source');

    if (!isLoaded) {
        btn.querySelector('.btn-text').textContent = 'Loading...';
        return;
    }

    btn.classList.add('generating');

    sourceEl.classList.remove('visible');
    line1El.classList.remove('visible');
    line2El.classList.remove('visible');
    line3El.classList.remove('visible');

    await sleep(650);

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

    await sleep(200);

    line1El.classList.add('visible');
    await waitForTransition(line1El);

    line2El.classList.add('visible');
    await waitForTransition(line2El);

    line3El.classList.add('visible');
    await waitForTransition(line3El);

    await sleep(300);
    sourceEl.classList.add('visible');

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
        setTimeout(resolve, 600);
    });
}

async function animateEntry() {
    const panel = document.querySelector('.content-panel');
    const header = document.querySelector('.header');
    const haikuDisplay = document.querySelector('.haiku-display');
    const btn = document.getElementById('generate-btn');
    const footer = document.querySelector('.footer');

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

    await sleep(1500);
}

document.addEventListener('DOMContentLoaded', async () => {
    setRandomTagline();
    const [_] = await Promise.all([animateEntry(), loadCorpus()]);
    await sleep(300);
    generateHaiku();
});
