/**
 * Syllable counter for English words.
 * Uses a heuristic approach based on vowel patterns, common suffixes,
 * and special cases. Not perfect, but solid enough for haiku generation.
 */

const SyllableCounter = (() => {
    // Common words with irregular syllable counts
    const EXCEPTIONS = {
        // 1 syllable
        'the': 1, 'to': 1, 'and': 1, 'a': 1, 'of': 1, 'in': 1, 'is': 1,
        'it': 1, 'for': 1, 'that': 1, 'was': 1, 'on': 1, 'are': 1, 'as': 1,
        'with': 1, 'his': 1, 'they': 1, 'be': 1, 'at': 1, 'one': 1, 'have': 1,
        'this': 1, 'from': 1, 'or': 1, 'had': 1, 'by': 1, 'but': 1, 'some': 1,
        'what': 1, 'there': 1, 'we': 1, 'can': 1, 'out': 1, 'were': 1,
        'all': 1, 'your': 1, 'when': 1, 'use': 1, 'said': 1, 'each': 1,
        'which': 1, 'she': 1, 'do': 1, 'their': 1, 'if': 1, 'will': 1,
        'way': 1, 'could': 1, 'would': 1, 'made': 1, 'eye': 1, 'eyes': 1,
        'filed': 1, 'fire': 1, 'our': 1, 'through': 1, 'where': 1, 'judge': 1,
        'case': 1, 'court': 1, 'law': 1, 'rights': 1, 'state': 1, 'states': 1,
        'charge': 1, 'charged': 1, 'crime': 1, 'crimes': 1, 'time': 1,
        'place': 1, 'name': 1, 'names': 1, 'sealed': 1, 'caused': 1,
        'does': 1, 'done': 1, 'those': 1, 'these': 1, 'make': 1,
        'called': 1, 'closed': 1, 'claimed': 1, 'forced': 1, 'based': 1,
        'whole': 1, 'while': 1, 'source': 1, 'once': 1,
        // 2 syllables
        'about': 2, 'over': 2, 'after': 2, 'again': 2, 'also': 2,
        'being': 2, 'before': 2, 'between': 2, 'because': 2, 'under': 2,
        'every': 2, 'people': 2, 'into': 2, 'only': 2, 'order': 2,
        'other': 2, 'even': 2, 'given': 2, 'never': 2, 'island': 2,
        'minor': 2, 'minors': 2, 'victim': 2, 'victims': 2, 'alleged': 2,
        'abuse': 2, 'justice': 2, 'plaintiff': 2, 'counsel': 2,
        'motion': 2, 'trial': 2, 'filed': 1, 'witness': 2, 'prison': 2,
        'federal': 3, 'evidence': 3, 'attorney': 3, 'agreement': 3,
        'defendant': 3, 'document': 3, 'documents': 3, 'amendment': 3,
        'unsealed': 2, 'massage': 2, 'travel': 2, 'private': 2,
        // 3 syllables
        'however': 3, 'another': 3, 'continue': 3, 'government': 3,
        'following': 3, 'pursuant': 3, 'violation': 4, 'deposition': 4,
        'prosecution': 4, 'conspiracy': 4, 'trafficking': 3,
        'allegations': 4, 'investigation': 5,
        // Legal terms
        'subpoena': 3, 'indictment': 3, 'testimony': 4, 'jurisdiction': 4,
        'confidential': 4, 'proceedings': 3, 'allegation': 4,
    };

    // Suffixes that add syllables
    const ADD_SYLLABLE_SUFFIXES = [
        /[^aeiou]ied$/,   // studied
        /[^td]ed$/,       // waited, but not 'red', 'bed'
        /[^lnr]es$/,      // watches, but not 'rules', 'scenes'
    ];

    // Suffixes that don't add syllables (silent e patterns)
    const SILENT_SUFFIXES = [
        /[^aeiou]e$/,     // silent e: make, take, etc.
        /le$/,            // but handle 'le' carefully below
    ];

    function countSyllables(word) {
        if (!word) return 0;

        word = word.toLowerCase().trim().replace(/[^a-z]/g, '');

        if (!word) return 0;

        // Check exceptions first
        if (EXCEPTIONS[word] !== undefined) {
            return EXCEPTIONS[word];
        }

        let count = 0;
        const vowels = 'aeiouy';
        let prevIsVowel = false;

        // Count vowel groups
        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i]);
            if (isVowel && !prevIsVowel) {
                count++;
            }
            prevIsVowel = isVowel;
        }

        // Adjustments

        // Silent e at end
        if (word.endsWith('e') && !word.endsWith('le') &&
            !word.endsWith('ee') && !word.endsWith('ie') &&
            !word.endsWith('ye') && word.length > 2) {
            count--;
        }

        // -le at end of word after consonant = syllable
        if (word.length > 2 && word.endsWith('le') &&
            !vowels.includes(word[word.length - 3])) {
            // Already counted if preceded by vowel group, don't double count
        }

        // -ed endings: usually not a syllable unless preceded by t or d
        if (word.endsWith('ed') && word.length > 3) {
            const beforeEd = word[word.length - 3];
            if (beforeEd !== 't' && beforeEd !== 'd') {
                count--;
            }
        }

        // -es endings: not a syllable after most consonants
        if (word.endsWith('es') && word.length > 3) {
            const beforeEs = word[word.length - 3];
            if (!['s', 'z', 'x', 'ch', 'sh'].some(s => word.endsWith(s + 'es')) &&
                !vowels.includes(beforeEs)) {
                // Already handled by vowel counting
            }
        }

        // -tion, -sion = 1 syllable
        if (word.match(/[ts]ion$/)) {
            // Already correctly counted as 1 vowel group
        }

        // -ious, -eous = 2 syllables
        if (word.match(/[ie]ous$/)) {
            count++;
        }

        // -ia, -io at end
        if (word.match(/i[ao]$/)) {
            count++;
        }

        // -ual
        if (word.match(/ual$/)) {
            // Usually 2 syllables: actual, sexual, etc.
        }

        // Minimum 1 syllable
        return Math.max(1, count);
    }

    function countPhraseSyllables(phrase) {
        const words = phrase.split(/\s+/).filter(w => w.replace(/[^a-z]/gi, '').length > 0);
        let total = 0;
        for (const word of words) {
            total += countSyllables(word);
        }
        return total;
    }

    return {
        countSyllables,
        countPhraseSyllables
    };
})();
