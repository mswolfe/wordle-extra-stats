const getWordleStorage = async () => {
    const data = await chrome.storage.local.get('wordle');
    if (!data || !data.wordle) {
        return {};
    }
    return data.wordle;
}

const setWordleStorage = (data) => {
    chrome.storage.local.set({ wordle: data }, () => {
        console.log('Storage updated!');
    });
}

chrome.runtime.onMessage.addListener(async (request, sender, response) => {
    let data = await getWordleStorage();

    if (request.type === 'state-update') {
        const { state } = request;

        if (state.dayOffset !== data.dayOffset || state.rowIndex === 0) {
            data = {
                dayOffset: data.dayOffset,
                rowTs: []
            };
        }

        // We moved on to row index 1 which means the first guess was made and the last played ts
        // is our start time.
        if (state.rowIndex === 1 && state.lastPlayedTs) {
            data.startTs = state.lastPlayedTs;
        }

        // The game is over and we want to capture the completed time.
        if (state.gameStatus !== 'IN_PROGRESS' && state.lastCompletedTs) {
            data.stopTs = state.lastCompletedTs;
        }

        // Capture end time of each row.
        const rowTimeIndex = state.rowIndex - 1;
        if (rowTimeIndex >= 0 && !data.rowTs[rowTimeIndex] && state.lastPlayedTs) {
            data.rowTs[rowTimeIndex] = state.lastPlayedTs;
        }

        // Just keep these updated for good measure.
        data.dayOffset = state.dayOffset;
        data.rowIndex = state.rowIndex;
        data.evaluations = state.evaluations;
        setWordleStorage(data);
        console.log(data.rowTs);
    }
});