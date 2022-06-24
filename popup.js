const getWordleShareText = (wordle) => {
    const now = Date.now();
    const totalTime = (wordle?.stopTs || now) - (wordle?.startTs || now);

    const rowDurations = (wordle.stopTs && wordle.startTs) ?
    (wordle?.rowTs ?? []).map((ts, i, rows) => {
        const nextI = i + 1;
        if (nextI < rows.length && rows[nextI]) {
            return Math.floor(((rows[nextI] - ts) / totalTime) * 100);
        }

        return null;
    }).filter(e => e) : [];

    const evals = wordle?.evaluations ?? [];
    let share = `Wordle ${wordle?.dayOffset ?? '???'} ${evals.filter(row => row).length}/6\n\n`;
    evals.forEach((row, i) => {
        if (row) {
            row.forEach(col => {
                if (col === 'absent') {
                    share += '\u2B1C';
                } else if (col === 'correct') {
                    share += '\ud83d\udfe9';
                } else {
                    share += '\ud83d\udfe8';
                }
            });
            const rowDurationIndex = i;
            if (rowDurationIndex >= 0 && rowDurationIndex < rowDurations.length) {
                share += ` ${rowDurations[rowDurationIndex]}%`;
            }

            share += '\n';
        }
    });

    if (wordle.startTs && wordle.stopTs) {
        const duration = Math.floor((wordle.stopTs - wordle.startTs) / 1000) * 1000;
        share += `Completed in ${humanizeDuration(duration)}`;
    }

    return share;
};

const shareClicked = () => {
    chrome.storage.local.get("wordle", ({ wordle }) => {
        const share = getWordleShareText(wordle);
        if (share) {
            navigator.clipboard.writeText(share);
        }
    });
}

const shareButton = document.getElementById("share");
shareButton.addEventListener('click', shareClicked);

chrome.storage.local.get("wordle", ({ wordle }) => {
    const share = getWordleShareText(wordle).replaceAll('\n', '<br/>');
    if (share) {
        console.log('updating div');
        const stateDiv = document.getElementById('state');
        stateDiv.innerHTML = share;
    }
});