// Kippenspel Game Module
// Laat een ei groeien naar een kip door keersommen op te lossen

// ===== CONFIGURATIE =====
const ChickenConfig = {
    // Levels met bijbehorende drempels en tafels
    levels: [
        {
            name: 'ei',
            emoji: '\u{1F95A}',
            threshold: 0,       // Start
            bars: ['warmte'],
            actions: {
                warmte: { tables: [1, 2], icons: ['\u{1F525}', '\u{1F4A1}'], label: 'Warmte' }
            }
        },
        {
            name: 'kuiken_ei',
            emoji: '\u{1F423}',
            threshold: 10,      // Na 10 cumulatief
            bars: ['warmte', 'voeding'],
            actions: {
                warmte: { tables: [1, 2], icons: ['\u{1F525}', '\u{1F4A1}'], label: 'Warmte' },
                voeding: { tables: [5, 10], icons: ['\u{1F34E}', '\u{1FAB1}', '\u{1F41B}'], label: 'Eten' }
            }
        },
        {
            name: 'kuiken',
            emoji: '\u{1F425}',
            threshold: 25,      // Na 25 cumulatief
            bars: ['warmte', 'voeding', 'plezier'],
            actions: {
                warmte: { tables: [1, 2], icons: ['\u{1F525}', '\u{1F4A1}'], label: 'Warmte' },
                voeding: { tables: [5, 10], icons: ['\u{1F34E}', '\u{1FAB1}', '\u{1F41B}'], label: 'Eten' },
                plezier: { tables: [3, 4, 6], icons: ['\u{1FA81}', '\u{1FA80}', '\u{1F6DD}'], label: 'Spelen' }
            }
        },
        {
            name: 'kip',
            emoji: '\u{1F414}',
            threshold: 45,      // Na 45 cumulatief
            bars: ['warmte', 'voeding', 'plezier', 'nestje'],
            actions: {
                warmte: { tables: [1, 2], icons: ['\u{1F525}', '\u{1F4A1}'], label: 'Warmte' },
                voeding: { tables: [5, 10], icons: ['\u{1F34E}', '\u{1FAB1}', '\u{1F41B}'], label: 'Eten' },
                plezier: { tables: [3, 4, 6], icons: ['\u{1FA81}', '\u{1FA80}', '\u{1F6DD}'], label: 'Spelen' },
                nestje: { tables: [7, 8, 9], icons: ['\u{1FAB9}', '\u{1FABA}', '\u{1F3E0}'], label: 'Nestje' }
            }
        }
    ],
    // Na 70 sommen: herstart
    restartThreshold: 70,
    // Basistempo: balk loopt leeg in 60 seconden (100% / 60s = 1.67%/s)
    baseDecayPerSecond: 100 / 60,
    // Vertraging factor per level verschil (hoe ouder de balk, hoe trager)
    decaySlowdownFactor: 1.5,
    // Hoeveel % een correcte som oplevert
    correctBonus: 25,
    // Update interval in ms
    updateInterval: 1000,
    // Opslag
    storageKey: 'kippenspel_save'
};

// ===== GAME STATE =====
const ChickenState = {
    // Balkwaarden (0-100)
    bars: {
        warmte: 100,
        voeding: 100,
        plezier: 100,
        nestje: 100
    },
    // Progressie
    totalCorrect: 0,
    currentLevel: 0,        // Index in ChickenConfig.levels
    // Huidige actie/som
    currentAction: null,
    currentMathProblem: null,
    inputValue: '',
    // Timing
    lastUpdateTime: Date.now(),
    updateInterval: null,
    // Statistieken
    totalRounds: 0           // Hoeveel keer het spel is herstart (ei -> kip cyclus)
};

// ===== INITIALISATIE =====
function initChicken() {
    loadChickenState();
    updateChickenSaveStatusDisplay();
}

// ===== OPSLAAN EN LADEN =====
function saveChickenState() {
    const saveData = {
        bars: { ...ChickenState.bars },
        totalCorrect: ChickenState.totalCorrect,
        currentLevel: ChickenState.currentLevel,
        totalRounds: ChickenState.totalRounds,
        lastUpdateTime: Date.now()
    };

    try {
        localStorage.setItem(ChickenConfig.storageKey, JSON.stringify(saveData));
    } catch (e) {
        console.warn('Kon Kippenspel niet opslaan:', e);
    }
}

function loadChickenState() {
    try {
        const savedData = localStorage.getItem(ChickenConfig.storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);

            ChickenState.bars = data.bars || { warmte: 100, voeding: 100, plezier: 100, nestje: 100 };
            ChickenState.totalCorrect = data.totalCorrect || 0;
            ChickenState.currentLevel = data.currentLevel || 0;
            ChickenState.totalRounds = data.totalRounds || 0;
            ChickenState.lastUpdateTime = data.lastUpdateTime || Date.now();

            // Bereken afname sinds laatste keer
            applyChickenOfflineDecay();

            return true;
        }
    } catch (e) {
        console.warn('Kon Kippenspel niet laden:', e);
    }
    return false;
}

function applyChickenOfflineDecay() {
    const now = Date.now();
    const secondsPassed = (now - ChickenState.lastUpdateTime) / 1000;

    // Maximaal 10 minuten aan afname toepassen
    const maxSeconds = 600;
    const actualSeconds = Math.min(secondsPassed, maxSeconds);

    const level = ChickenConfig.levels[ChickenState.currentLevel];
    if (!level) return;

    level.bars.forEach((barName, index) => {
        const decayRate = getDecayRateForBar(barName, ChickenState.currentLevel);
        ChickenState.bars[barName] = Math.max(0, ChickenState.bars[barName] - (decayRate * actualSeconds));
    });

    ChickenState.lastUpdateTime = now;
}

function updateChickenSaveStatusDisplay() {
    const statusEl = document.getElementById('chicken-save-status');
    if (!statusEl) return;

    try {
        const savedData = localStorage.getItem(ChickenConfig.storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            const levelName = ChickenConfig.levels[data.currentLevel || 0].emoji;
            statusEl.textContent = `Opgeslagen spel gevonden! ${levelName} (${data.totalCorrect || 0} sommen opgelost)`;
            statusEl.classList.add('has-save');
        } else {
            statusEl.textContent = 'Geen opgeslagen spel - begin met een nieuw ei!';
            statusEl.classList.remove('has-save');
        }
    } catch (e) {
        statusEl.textContent = 'Geen opgeslagen spel - begin met een nieuw ei!';
        statusEl.classList.remove('has-save');
    }
}

// ===== DECAY BEREKENING =====
function getDecayRateForBar(barName, currentLevel) {
    const level = ChickenConfig.levels[currentLevel];
    if (!level) return 0;

    const barIndex = level.bars.indexOf(barName);
    if (barIndex === -1) return 0;

    // De nieuwste balk (laatste in de array) heeft het basistempo
    // Oudere balken worden trager
    const barsCount = level.bars.length;
    const ageFromNewest = (barsCount - 1) - barIndex;

    // Hoe ouder de balk (hoger ageFromNewest), hoe trager
    const slowdown = Math.pow(ChickenConfig.decaySlowdownFactor, ageFromNewest);
    return ChickenConfig.baseDecayPerSecond / slowdown;
}

// ===== SPEL STARTEN =====
function startChickenGame() {
    const hasData = loadChickenState();

    if (!hasData) {
        // Nieuw spel
        ChickenState.bars = { warmte: 100, voeding: 100, plezier: 100, nestje: 100 };
        ChickenState.totalCorrect = 0;
        ChickenState.currentLevel = 0;
        ChickenState.totalRounds = 0;
    }

    // Start update loop
    startChickenUpdateLoop();

    // Render UI
    renderChickenGame();

    // Toon spelscherm
    showScreen('game-screen-chicken');
}

function stopChickenGame() {
    if (ChickenState.updateInterval) {
        clearInterval(ChickenState.updateInterval);
        ChickenState.updateInterval = null;
    }
    saveChickenState();
}

// ===== UPDATE LOOP =====
function startChickenUpdateLoop() {
    if (ChickenState.updateInterval) {
        clearInterval(ChickenState.updateInterval);
    }

    ChickenState.updateInterval = setInterval(() => {
        updateChickenStats();
    }, ChickenConfig.updateInterval);
}

function updateChickenStats() {
    const level = ChickenConfig.levels[ChickenState.currentLevel];
    if (!level) return;

    // Verminder actieve balken
    level.bars.forEach(barName => {
        const decayRate = getDecayRateForBar(barName, ChickenState.currentLevel);
        // Decay per interval (1 seconde)
        ChickenState.bars[barName] = Math.max(0, ChickenState.bars[barName] - decayRate);
    });

    // Update UI
    updateChickenBars();

    // Sla op
    ChickenState.lastUpdateTime = Date.now();
    saveChickenState();
}

// ===== UI RENDERING =====
function renderChickenGame() {
    renderChickenPet();
    renderChickenBars();
    renderChickenActions();
    updateChickenProgress();
}

function renderChickenPet() {
    const container = document.getElementById('chicken-pet-container');
    if (!container) return;

    const level = ChickenConfig.levels[ChickenState.currentLevel];
    container.innerHTML = `<span class="chicken-pet-emoji">${level.emoji}</span>`;

    // Update mood tekst
    const moodEl = document.getElementById('chicken-mood');
    if (moodEl) {
        moodEl.textContent = getChickenMoodText();
    }
}

function getChickenMoodText() {
    const level = ChickenConfig.levels[ChickenState.currentLevel];

    // Check of een balk kritiek laag is
    for (const barName of level.bars) {
        if (ChickenState.bars[barName] < 15) {
            const barLabels = { warmte: 'warmte', voeding: 'eten', plezier: 'plezier', nestje: 'een nestje' };
            return `Ik heb ${barLabels[barName]} nodig!`;
        }
    }

    // Gebaseerd op level
    switch (ChickenState.currentLevel) {
        case 0: return 'Houd me lekker warm!';
        case 1: return 'Piep piep! Ik heb honger!';
        case 2: return 'Wil je met me spelen?';
        case 3: return 'Tok tok! Laten we een nestje bouwen!';
        default: return '';
    }
}

function renderChickenBars() {
    const container = document.getElementById('chicken-bars-container');
    if (!container) return;

    const level = ChickenConfig.levels[ChickenState.currentLevel];

    const barConfig = {
        warmte: { icon: '\u{1F525}', label: 'Warmte', colorClass: 'chicken-bar-warmte' },
        voeding: { icon: '\u{1F34E}', label: 'Voeding', colorClass: 'chicken-bar-voeding' },
        plezier: { icon: '\u{1FA80}', label: 'Plezier', colorClass: 'chicken-bar-plezier' },
        nestje: { icon: '\u{1FAB9}', label: 'Nestje', colorClass: 'chicken-bar-nestje' }
    };

    let html = '';
    level.bars.forEach(barName => {
        const config = barConfig[barName];
        const value = ChickenState.bars[barName];
        const lowClass = value < 30 ? 'low' : '';
        const criticalClass = value < 15 ? 'critical' : '';

        html += `
            <div class="status-bar-container">
                <span class="status-icon" aria-hidden="true">${config.icon}</span>
                <div class="status-bar ${lowClass} ${criticalClass}">
                    <div class="status-fill ${config.colorClass}" id="chicken-bar-${barName}" style="width: ${value}%"></div>
                </div>
                <span class="status-label">${config.label}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

function updateChickenBars() {
    const level = ChickenConfig.levels[ChickenState.currentLevel];
    if (!level) return;

    level.bars.forEach(barName => {
        const barEl = document.getElementById(`chicken-bar-${barName}`);
        if (barEl) {
            const value = ChickenState.bars[barName];
            barEl.style.width = `${value}%`;

            const parentBar = barEl.parentElement;
            parentBar.classList.toggle('low', value < 30 && value >= 15);
            parentBar.classList.toggle('critical', value < 15);
        }
    });
}

function renderChickenActions() {
    const container = document.getElementById('chicken-actions-container');
    if (!container) return;

    const level = ChickenConfig.levels[ChickenState.currentLevel];

    let html = '';
    Object.entries(level.actions).forEach(([actionKey, actionConfig]) => {
        const icon = actionConfig.icons[Math.floor(Math.random() * actionConfig.icons.length)];
        html += `
            <button class="chicken-action-btn chicken-action-${actionKey}"
                    onclick="openChickenAction('${actionKey}')"
                    aria-label="${actionConfig.label}">
                <span class="action-icon">${actionConfig.icons[0]}</span>
                <span class="action-label">${actionConfig.label}</span>
            </button>
        `;
    });

    container.innerHTML = html;
}

function updateChickenProgress() {
    const progressEl = document.getElementById('chicken-progress-text');
    if (progressEl) {
        const nextThreshold = getNextThreshold();
        if (nextThreshold !== null) {
            progressEl.textContent = `${ChickenState.totalCorrect} / ${nextThreshold} sommen`;
        } else {
            progressEl.textContent = `${ChickenState.totalCorrect} sommen`;
        }
    }

    const roundsEl = document.getElementById('chicken-rounds-text');
    if (roundsEl && ChickenState.totalRounds > 0) {
        roundsEl.textContent = `Ronde ${ChickenState.totalRounds + 1}`;
    }
}

function getNextThreshold() {
    const nextLevel = ChickenState.currentLevel + 1;
    if (nextLevel < ChickenConfig.levels.length) {
        return ChickenConfig.levels[nextLevel].threshold;
    }
    return ChickenConfig.restartThreshold;
}

// ===== ACTIES & SOMMEN =====
function openChickenAction(action) {
    ChickenState.currentAction = action;
    ChickenState.inputValue = '';

    // Genereer rekensom
    generateChickenMathProblem(action);

    // Update popup UI
    const level = ChickenConfig.levels[ChickenState.currentLevel];
    const actionConfig = level.actions[action];

    const iconEl = document.getElementById('chicken-shop-action-icon');
    const textEl = document.getElementById('chicken-shop-action-text');

    if (iconEl) iconEl.textContent = actionConfig.icons[0];
    if (textEl) textEl.textContent = actionConfig.label;

    // Update wiskunde display
    updateChickenMathDisplay();
    updateChickenInputDisplay();

    // Toon popup
    document.getElementById('chicken-shop-popup').classList.remove('hidden');

    // Focus eerste knop
    setTimeout(() => {
        const firstBtn = document.querySelector('#chicken-number-pad .num-btn');
        if (firstBtn) firstBtn.focus();
    }, 100);
}

function closeChickenShop() {
    const popup = document.getElementById('chicken-shop-popup');
    if (popup) popup.classList.add('hidden');
    ChickenState.currentAction = null;
    ChickenState.currentMathProblem = null;
    ChickenState.inputValue = '';
}

function generateChickenMathProblem(action) {
    const level = ChickenConfig.levels[ChickenState.currentLevel];
    const actionConfig = level.actions[action];
    if (!actionConfig) return;

    // Kies een willekeurige tafel uit de beschikbare tafels voor deze actie
    const tables = actionConfig.tables;
    const table = tables[Math.floor(Math.random() * tables.length)];

    // Kies een willekeurig getal van 1-10
    const multiplier = Math.floor(Math.random() * 10) + 1;

    ChickenState.currentMathProblem = {
        table: table,
        multiplier: multiplier,
        answer: table * multiplier
    };
}

function updateChickenMathDisplay() {
    const problemEl = document.getElementById('chicken-math-problem');
    if (problemEl && ChickenState.currentMathProblem) {
        const { table, multiplier } = ChickenState.currentMathProblem;
        problemEl.textContent = `${table} \u00D7 ${multiplier} = ?`;
    }
}

function updateChickenInputDisplay() {
    const display = document.getElementById('chicken-input-display');
    if (display) {
        display.textContent = ChickenState.inputValue || '_';
    }
}

function chickenInputNumber(num) {
    if (ChickenState.inputValue.length < 3) {
        ChickenState.inputValue += num.toString();
        updateChickenInputDisplay();
    }
}

function chickenClearInput() {
    ChickenState.inputValue = ChickenState.inputValue.slice(0, -1);
    updateChickenInputDisplay();
}

function chickenConfirmAnswer() {
    if (!ChickenState.currentMathProblem || ChickenState.inputValue === '') return;

    const userAnswer = parseInt(ChickenState.inputValue);
    const correctAnswer = ChickenState.currentMathProblem.answer;

    const inputDisplay = document.getElementById('chicken-input-display');

    if (userAnswer === correctAnswer) {
        handleCorrectChickenAnswer(inputDisplay);
    } else {
        handleWrongChickenAnswer(inputDisplay);
    }
}

function handleCorrectChickenAnswer(inputDisplay) {
    // Visuele feedback
    if (inputDisplay) {
        inputDisplay.classList.add('correct');
        setTimeout(() => inputDisplay.classList.remove('correct'), 500);
    }

    // Geluid
    if (typeof playCorrectSound === 'function') {
        playCorrectSound();
    }

    // Vul de balk aan
    const action = ChickenState.currentAction;
    if (action && ChickenState.bars[action] !== undefined) {
        ChickenState.bars[action] = Math.min(100, ChickenState.bars[action] + ChickenConfig.correctBonus);
    }

    // Update totaal
    ChickenState.totalCorrect++;

    // Update UI
    updateChickenBars();
    updateChickenProgress();

    // Pet animatie
    animateChickenPet();

    // Sluit popup na korte vertraging
    setTimeout(() => {
        closeChickenShop();

        // Check voor level-up of herstart
        checkChickenProgression();

        saveChickenState();
    }, 600);
}

function handleWrongChickenAnswer(inputDisplay) {
    // Visuele feedback
    if (inputDisplay) {
        inputDisplay.classList.add('wrong');
        setTimeout(() => inputDisplay.classList.remove('wrong'), 500);
    }

    // Geluid
    if (typeof playWrongSound === 'function') {
        playWrongSound();
    }

    // Clear input voor nieuwe poging
    ChickenState.inputValue = '';
    updateChickenInputDisplay();

    // Pet schudt nee
    const petContainer = document.getElementById('chicken-pet-container');
    if (petContainer) {
        petContainer.classList.add('chicken-shake');
        setTimeout(() => petContainer.classList.remove('chicken-shake'), 500);
    }
}

// ===== PROGRESSIE =====
function checkChickenProgression() {
    // Check herstart
    if (ChickenState.totalCorrect >= ChickenConfig.restartThreshold) {
        chickenRestart();
        return;
    }

    // Check level-up
    for (let i = ChickenConfig.levels.length - 1; i > ChickenState.currentLevel; i--) {
        if (ChickenState.totalCorrect >= ChickenConfig.levels[i].threshold) {
            chickenLevelUp(i);
            return;
        }
    }
}

function chickenLevelUp(newLevel) {
    const oldLevel = ChickenState.currentLevel;
    ChickenState.currentLevel = newLevel;

    // Initialiseer nieuwe balken op 100%
    const newBars = ChickenConfig.levels[newLevel].bars;
    const oldBars = ChickenConfig.levels[oldLevel].bars;
    newBars.forEach(barName => {
        if (!oldBars.includes(barName)) {
            ChickenState.bars[barName] = 100;
        }
    });

    // Toon level-up bericht
    const level = ChickenConfig.levels[newLevel];
    showChickenLevelUpMessage(level);

    // Vuurwerk
    if (typeof startFireworks === 'function') {
        startFireworks();
    }
    if (typeof playVictorySound === 'function') {
        playVictorySound();
    }

    // Render alles opnieuw
    renderChickenGame();
    saveChickenState();
}

function showChickenLevelUpMessage(level) {
    const moodEl = document.getElementById('chicken-mood');
    if (moodEl) {
        const messages = {
            'kuiken_ei': 'Het ei is uitgekomen! Welkom kuikentje!',
            'kuiken': 'Het kuikentje groeit! Tijd om te spelen!',
            'kip': 'Wat een mooie kip! Laten we een nestje bouwen!'
        };
        moodEl.textContent = messages[level.name] || 'Level up!';
        moodEl.classList.add('chicken-levelup-message');
        setTimeout(() => {
            moodEl.classList.remove('chicken-levelup-message');
            moodEl.textContent = getChickenMoodText();
        }, 3000);
    }
}

function chickenRestart() {
    ChickenState.totalRounds++;
    ChickenState.totalCorrect = 0;
    ChickenState.currentLevel = 0;
    ChickenState.bars = { warmte: 100, voeding: 100, plezier: 100, nestje: 100 };

    // Toon herstart bericht
    const moodEl = document.getElementById('chicken-mood');
    if (moodEl) {
        moodEl.textContent = 'De kip heeft een nieuw ei gelegd!';
        moodEl.classList.add('chicken-levelup-message');
        setTimeout(() => {
            moodEl.classList.remove('chicken-levelup-message');
            moodEl.textContent = getChickenMoodText();
        }, 3000);
    }

    // Vuurwerk en geluid
    if (typeof startFireworks === 'function') {
        startFireworks();
    }
    if (typeof playVictorySound === 'function') {
        playVictorySound();
    }

    // Render alles opnieuw
    renderChickenGame();
    saveChickenState();
}

// ===== ANIMATIES =====
function animateChickenPet() {
    const petContainer = document.getElementById('chicken-pet-container');
    if (!petContainer) return;

    petContainer.classList.add('chicken-happy');
    setTimeout(() => petContainer.classList.remove('chicken-happy'), 1000);
}

// ===== CLEANUP =====
function stopChickenTimer() {
    stopChickenGame();
}

// ===== INITIALISEER BIJ LADEN =====
document.addEventListener('DOMContentLoaded', () => {
    initChicken();
});

// Maak functies globaal beschikbaar
if (typeof window !== 'undefined') {
    window.startChickenGame = startChickenGame;
    window.stopChickenGame = stopChickenGame;
    window.stopChickenTimer = stopChickenTimer;
    window.openChickenAction = openChickenAction;
    window.closeChickenShop = closeChickenShop;
    window.chickenInputNumber = chickenInputNumber;
    window.chickenClearInput = chickenClearInput;
    window.chickenConfirmAnswer = chickenConfirmAnswer;
}
