// Klokkijken Spel
// Leer klok lezen door de juiste tijd te kiezen

// Spel staat
let clockTargetHours = 0;
let clockTargetMinutes = 0;
let clockDifficulty = 'normaal';
let clockTimerInterval = null;
let clockStartTime = null;
let clockRoundsCompleted = 0;
let clockTotalRounds = 5;
let clockMode = 'choice'; // 'choice' of 'drag'

// Moeilijkheidsgraad presets
const clockDifficultyPresets = {
    makkelijk: {
        minuteIntervals: [0, 30], // Hele en halve uren
        rounds: 5,
        mode: 'choice',
        optionCount: 3
    },
    normaal: {
        minuteIntervals: [0, 15, 30, 45], // Kwartieren
        rounds: 7,
        mode: 'choice',
        optionCount: 3
    },
    moeilijk: {
        minuteIntervals: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], // Per 5 minuten
        rounds: 10,
        mode: 'choice', // Kan later naar 'drag' voor sleepfunctie
        optionCount: 4
    }
};

/**
 * Selecteer moeilijkheidsgraad voor klokkijken
 */
function selectClockDifficulty(difficulty) {
    clockDifficulty = difficulty;

    // Update UI
    document.querySelectorAll('#settings-screen-clock .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
    });

    const selectedBtn = document.querySelector(`#settings-screen-clock .difficulty-btn[data-difficulty="${difficulty}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        selectedBtn.setAttribute('aria-pressed', 'true');
    }
}

/**
 * Start het klokkijken spel
 */
function startClockGame() {
    const preset = clockDifficultyPresets[clockDifficulty];
    clockTotalRounds = preset.rounds;
    clockMode = preset.mode;
    clockRoundsCompleted = 0;

    showScreen('game-screen-clock');
    startClockTimer();
    generateClockRound();
}

/**
 * Genereer een nieuwe ronde
 */
function generateClockRound() {
    const preset = clockDifficultyPresets[clockDifficulty];

    // Genereer willekeurige tijd
    clockTargetHours = Math.floor(Math.random() * 12) + 1; // 1-12
    clockTargetMinutes = preset.minuteIntervals[Math.floor(Math.random() * preset.minuteIntervals.length)];

    // Update ronde indicator
    const roundDisplay = document.getElementById('clock-round-display');
    if (roundDisplay) {
        roundDisplay.textContent = `Ronde ${clockRoundsCompleted + 1}/${clockTotalRounds}`;
    }

    if (clockMode === 'choice') {
        renderClockChoiceMode(preset.optionCount);
    } else {
        renderClockDragMode();
    }
}

/**
 * Render de klok
 */
function renderAnalogClock(hours, minutes, container) {
    // Bereken hoeken voor de wijzers
    const hourAngle = (hours % 12) * 30 + (minutes / 60) * 30; // 30 graden per uur + fractie voor minuten
    const minuteAngle = minutes * 6; // 6 graden per minuut

    const clockHTML = `
        <div class="analog-clock">
            <div class="clock-face">
                ${generateClockNumbers()}
            </div>
            <div class="hour-hand clock-hand" style="transform: rotate(${hourAngle}deg)"></div>
            <div class="minute-hand clock-hand" style="transform: rotate(${minuteAngle}deg)"></div>
            <div class="clock-center"></div>
        </div>
    `;

    return clockHTML;
}

/**
 * Genereer de uurcijfers voor de klok
 */
function generateClockNumbers() {
    const numbers = [];
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const radius = 80;
        const x = 110 + radius * Math.cos(angle) - 15;
        const y = 110 + radius * Math.sin(angle) - 15;

        numbers.push(`<div class="clock-number" style="left: ${x}px; top: ${y}px;">${i}</div>`);
    }
    return numbers.join('');
}

/**
 * Render keuze modus
 */
function renderClockChoiceMode(optionCount) {
    const container = document.getElementById('clock-game-container');
    if (!container) return;

    // Genereer foute opties
    const options = generateTimeOptions(optionCount);

    container.innerHTML = `
        <div class="clock-question">Hoe laat is het?</div>
        ${renderAnalogClock(clockTargetHours, clockTargetMinutes)}
        <div class="time-options">
            ${options.map((opt, idx) => `
                <button class="time-option"
                        onclick="checkClockAnswer(${opt.hours}, ${opt.minutes}, this)"
                        aria-label="${formatTime(opt.hours, opt.minutes)}">
                    ${formatTime(opt.hours, opt.minutes)}
                </button>
            `).join('')}
        </div>
    `;
}

/**
 * Genereer tijd opties inclusief het juiste antwoord
 */
function generateTimeOptions(count) {
    const preset = clockDifficultyPresets[clockDifficulty];
    const options = [{ hours: clockTargetHours, minutes: clockTargetMinutes }];

    while (options.length < count) {
        let newHours, newMinutes;

        // Genereer een andere tijd
        if (Math.random() < 0.5) {
            // Varieer de uren
            newHours = Math.floor(Math.random() * 12) + 1;
            newMinutes = clockTargetMinutes;
        } else {
            // Varieer de minuten
            newHours = clockTargetHours;
            newMinutes = preset.minuteIntervals[Math.floor(Math.random() * preset.minuteIntervals.length)];
        }

        // Soms volledig willekeurig
        if (Math.random() < 0.3) {
            newHours = Math.floor(Math.random() * 12) + 1;
            newMinutes = preset.minuteIntervals[Math.floor(Math.random() * preset.minuteIntervals.length)];
        }

        // Check of het niet duplicate is
        const isDuplicate = options.some(opt => opt.hours === newHours && opt.minutes === newMinutes);
        if (!isDuplicate) {
            options.push({ hours: newHours, minutes: newMinutes });
        }
    }

    // Shuffle de opties
    return options.sort(() => Math.random() - 0.5);
}

/**
 * Formatteer tijd als string
 */
function formatTime(hours, minutes) {
    const h = hours.toString().padStart(2, '0');
    const m = minutes.toString().padStart(2, '0');
    return `${h}:${m}`;
}

/**
 * Formatteer tijd in woorden (Nederlands)
 */
function formatTimeInWords(hours, minutes) {
    const hourNames = ['', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];

    if (minutes === 0) {
        return `${hourNames[hours]} uur`;
    } else if (minutes === 15) {
        return `kwart over ${hourNames[hours]}`;
    } else if (minutes === 30) {
        return `half ${hourNames[hours === 12 ? 1 : hours + 1]}`;
    } else if (minutes === 45) {
        return `kwart voor ${hourNames[hours === 12 ? 1 : hours + 1]}`;
    } else {
        return `${minutes} over ${hourNames[hours]}`;
    }
}

/**
 * Controleer het antwoord
 */
function checkClockAnswer(hours, minutes, buttonElement) {
    const isCorrect = hours === clockTargetHours && minutes === clockTargetMinutes;

    // Disable alle knoppen
    document.querySelectorAll('.time-option').forEach(btn => {
        btn.disabled = true;
    });

    if (isCorrect) {
        buttonElement.classList.add('correct');
        clockRoundsCompleted++;

        if (typeof playCorrectSound === 'function') {
            playCorrectSound();
        }

        // Check of alle rondes voltooid zijn
        if (clockRoundsCompleted >= clockTotalRounds) {
            setTimeout(() => {
                stopClockTimer();
                if (typeof playVictorySound === 'function') playVictorySound();
                if (typeof startFireworks === 'function') startFireworks();
            }, 500);
        } else {
            // Volgende ronde na korte pauze
            setTimeout(() => {
                generateClockRound();
            }, 800);
        }
    } else {
        buttonElement.classList.add('wrong');

        if (typeof playWrongSound === 'function') {
            playWrongSound();
        }

        // Toon het juiste antwoord
        document.querySelectorAll('.time-option').forEach(btn => {
            const btnText = btn.textContent.trim();
            const correctText = formatTime(clockTargetHours, clockTargetMinutes);
            if (btnText === correctText) {
                btn.classList.add('correct');
            }
        });

        // Volgende ronde na langere pauze
        setTimeout(() => {
            generateClockRound();
        }, 2000);
    }
}

/**
 * Render sleep modus (voor moeilijk niveau - toekomstige uitbreiding)
 */
function renderClockDragMode() {
    // Voorlopig terugvallen op choice mode
    renderClockChoiceMode(4);
}

/**
 * Start de timer
 */
function startClockTimer() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.start('clock');
        return;
    }

    clockStartTime = Date.now();
    updateClockTimerDisplay();
    clockTimerInterval = setInterval(updateClockTimerDisplay, 1000);
}

/**
 * Stop de timer
 */
function stopClockTimer() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.stop('clock');
    }
    if (clockTimerInterval) {
        clearInterval(clockTimerInterval);
        clockTimerInterval = null;
    }
}

/**
 * Update timer display
 */
function updateClockTimerDisplay() {
    const elapsed = Math.floor((Date.now() - clockStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');

    const display = document.getElementById('clock-timer-display');
    if (display) {
        display.textContent = `${minutes}:${seconds}`;
    }
}

// Exporteer functies
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startClockGame,
        selectClockDifficulty
    };
}
