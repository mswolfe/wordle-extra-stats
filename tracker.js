const WORDLE_LOCAL_STORAGE_KEY = 'nyt-wordle-state';
const WORDLE_ANON_LOCAL_STORAGE_KEY = 'nyt-wordle-moogle/ANON';
const getWordleState = () => {
    const local = JSON.parse(window.localStorage.getItem(WORDLE_LOCAL_STORAGE_KEY));
    const anon = JSON.parse(window.localStorage.getItem(WORDLE_ANON_LOCAL_STORAGE_KEY));
    return {
        dayOffset: anon?.game?.dayOffset,
        gameStatus: local?.gameStatus,
        evaluations: local?.evaluations,
        rowIndex: local?.rowIndex,
        lastPlayedTs: local?.lastPlayedTs,
        lastCompletedTs: local?.lastCompletedTs
    };
}

let prevState = null;

// Push updated game state to background worker
function storageUpdated() {
    // Give wordle some time to update the local storage.
    setTimeout(() => {
        const state = getWordleState();
        if (prevState === null || JSON.stringify(prevState) !== JSON.stringify(state)) {
            chrome.runtime.sendMessage({ type: 'state-update', state });
        }
        prevState = state;
    }, 250);
};

const getEnterButton = () => {
    return getButton(null, 'enter');
}

// Lot's of variability in how the page renders so it was easiest to just search the DOM top down through shadow DOM and look for the
// enter button.
const getButton = (root, text) => {
    const elements = Array.from((root ?? document).querySelectorAll('*'));
    const key = elements.find(e => e.nodeName === 'BUTTON' && e.childNodes.length > 0 && e.childNodes[0].textContent.trim() === text);
    if (key) {
        console.log(`Found the ${text} key: ${key}`);
        return key;
    }
    else {
        const shadows = elements.filter(e => e.shadowRoot);
        for (const shadow of shadows) {
            const ret = getButton(shadow.shadowRoot, text);
            if (ret) {
                return ret;
            }
        }
    }
};

// Give the page some time to load all of the DOM elements and render.
setTimeout(() => {
    document.addEventListener("keyup", storageUpdated);

    const enterKey = getEnterButton();
    enterKey.addEventListener('click', storageUpdated);

    console.log('Wordle Extra Stats Loaded');
    chrome.runtime.sendMessage({ type: 'state-update', state: getWordleState() });
}, 1000);