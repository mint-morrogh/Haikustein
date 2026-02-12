const SyllableCounter = (() => {
    let cmuDict = null;

    async function loadDictionary() {
        try {
            const response = await fetch('cmu-syllables.json');
            cmuDict = await response.json();
        } catch (e) {
            cmuDict = {};
        }
    }

    function heuristicCount(word) {
        let count = 0;
        const vowels = 'aeiouy';
        let prevIsVowel = false;

        for (let i = 0; i < word.length; i++) {
            const isVowel = vowels.includes(word[i]);
            if (isVowel && !prevIsVowel) {
                count++;
            }
            prevIsVowel = isVowel;
        }

        if (word.endsWith('e') && !word.endsWith('le') &&
            !word.endsWith('ee') && !word.endsWith('ie') &&
            !word.endsWith('ye') && word.length > 2) {
            count--;
        }

        if (word.endsWith('ed') && word.length > 3) {
            const beforeEd = word[word.length - 3];
            if (beforeEd !== 't' && beforeEd !== 'd') {
                count--;
            }
        }

        if (word.match(/[ie]ous$/)) {
            count++;
        }

        if (word.match(/i[ao]$/)) {
            count++;
        }

        return Math.max(1, count);
    }

    function countSyllables(word) {
        if (!word) return 0;

        word = word.toLowerCase().trim().replace(/[^a-z]/g, '');

        if (!word) return 0;

        if (cmuDict && cmuDict[word] !== undefined) {
            return cmuDict[word];
        }

        return heuristicCount(word);
    }

    function countPhraseSyllables(phrase) {
        const words = phrase.split(/\s+/).filter(w => w.replace(/[^a-z]/gi, '').length > 0);
        let total = 0;
        for (const word of words) {
            total += countSyllables(word);
        }
        return total;
    }

    function isKnownWord(word) {
        if (!word) return false;
        word = word.toLowerCase().trim().replace(/[^a-z]/g, '');
        if (!word) return false;
        return cmuDict !== null && cmuDict[word] !== undefined;
    }

    return {
        loadDictionary,
        countSyllables,
        countPhraseSyllables,
        isKnownWord
    };
})();
