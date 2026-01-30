// Math-agotchi Game Module
// Virtueel huisdier verzorgen door rekensommen op te lossen

// ===== CONFIGURATIE =====
const TamagotchiConfig = {
    // Moeilijkheidsgraden met bijbehorende tafels
    difficulties: {
        makkelijk: {
            startTables: [1, 2, 10],
            allTables: [1, 2, 3, 10]
        },
        normaal: {
            startTables: [1, 2, 5, 10],
            allTables: [1, 2, 3, 4, 5, 10]
        },
        moeilijk: {
            startTables: [1, 2, 10],
            allTables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
    // Status afname per seconde (per 10 seconden effectief)
    decayRates: {
        hunger: 0.5,      // Honger neemt af (0.5% per 10 sec = 3% per minuut)
        happiness: 0.3,   // Blijheid neemt af
        energy: 0.2       // Energie neemt af
    },
    // Effecten van acties
    actionEffects: {
        feed: { hunger: 20, happiness: 5, energy: 0 },
        play: { hunger: -5, happiness: 20, energy: -10 },
        sleep: { hunger: -5, happiness: 5, energy: 30 }
    },
    // Hoeveel correcte antwoorden voor nieuwe tafel
    streakToUnlock: 10,
    // Opslag sleutel
    storageKey: 'mathagotchi_save',
    // Update interval (ms)
    updateInterval: 10000  // 10 seconden
};

// ===== GAME STATE =====
const TamagotchiState = {
    // Huisdier stats
    hunger: 100,
    happiness: 100,
    energy: 100,
    // Progressie
    currentStreak: 0,
    totalCorrect: 0,
    unlockedTables: [1, 2, 10],
    allTables: [1, 2, 3, 10],
    difficulty: 'makkelijk',
    // Huidige actie
    currentAction: null,
    currentMathProblem: null,
    inputValue: '',
    // Timing
    lastUpdateTime: Date.now(),
    updateInterval: null,
    // Pet mood
    mood: 'happy',
    isAsleep: false
};

// ===== INITIALISATIE =====
function initTamagotchi() {
    loadTamagotchiState();
    updateSaveStatusDisplay();
}

// ===== OPSLAAN EN LADEN =====
function saveTamagotchiState() {
    const saveData = {
        hunger: TamagotchiState.hunger,
        happiness: TamagotchiState.happiness,
        energy: TamagotchiState.energy,
        currentStreak: TamagotchiState.currentStreak,
        totalCorrect: TamagotchiState.totalCorrect,
        unlockedTables: TamagotchiState.unlockedTables,
        difficulty: TamagotchiState.difficulty,
        lastUpdateTime: Date.now()
    };

    try {
        localStorage.setItem(TamagotchiConfig.storageKey, JSON.stringify(saveData));
    } catch (e) {
        console.warn('Kon Math-agotchi niet opslaan:', e);
    }
}

function loadTamagotchiState() {
    try {
        const savedData = localStorage.getItem(TamagotchiConfig.storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);

            // Herstel state
            TamagotchiState.hunger = data.hunger || 100;
            TamagotchiState.happiness = data.happiness || 100;
            TamagotchiState.energy = data.energy || 100;
            TamagotchiState.currentStreak = data.currentStreak || 0;
            TamagotchiState.totalCorrect = data.totalCorrect || 0;
            TamagotchiState.unlockedTables = data.unlockedTables || [1, 2, 10];
            TamagotchiState.difficulty = data.difficulty || 'makkelijk';
            TamagotchiState.lastUpdateTime = data.lastUpdateTime || Date.now();

            // Bereken afname sinds laatste keer
            applyOfflineDecay();

            return true;
        }
    } catch (e) {
        console.warn('Kon Math-agotchi niet laden:', e);
    }
    return false;
}

function applyOfflineDecay() {
    const now = Date.now();
    const timePassed = now - TamagotchiState.lastUpdateTime;
    const intervals = timePassed / TamagotchiConfig.updateInterval;

    // Maximaal 1 uur aan afname toepassen (om te voorkomen dat huisdier direct dood is)
    const maxIntervals = (60 * 60 * 1000) / TamagotchiConfig.updateInterval; // 1 uur
    const actualIntervals = Math.min(intervals, maxIntervals);

    TamagotchiState.hunger = Math.max(0, TamagotchiState.hunger - (TamagotchiConfig.decayRates.hunger * actualIntervals));
    TamagotchiState.happiness = Math.max(0, TamagotchiState.happiness - (TamagotchiConfig.decayRates.happiness * actualIntervals));
    TamagotchiState.energy = Math.max(0, TamagotchiState.energy - (TamagotchiConfig.decayRates.energy * actualIntervals));

    TamagotchiState.lastUpdateTime = now;
}

function updateSaveStatusDisplay() {
    const statusEl = document.getElementById('tamagotchi-save-status');
    if (!statusEl) return;

    try {
        const savedData = localStorage.getItem(TamagotchiConfig.storageKey);
        if (savedData) {
            const data = JSON.parse(savedData);
            statusEl.textContent = `Opgeslagen huisdier gevonden! (${data.totalCorrect || 0} sommen opgelost)`;
            statusEl.classList.add('has-save');
        } else {
            statusEl.textContent = 'Geen opgeslagen huisdier gevonden - start een nieuw spel!';
            statusEl.classList.remove('has-save');
        }
    } catch (e) {
        statusEl.textContent = 'Geen opgeslagen huisdier gevonden - start een nieuw spel!';
        statusEl.classList.remove('has-save');
    }
}

// ===== MOEILIJKHEIDSGRAAD =====
function selectTamagotchiDifficulty(difficulty) {
    TamagotchiState.difficulty = difficulty;

    const config = TamagotchiConfig.difficulties[difficulty];
    if (config) {
        TamagotchiState.allTables = [...config.allTables];
        // Behoud ontgrendelde tafels als die er al zijn, anders start met basis
        if (TamagotchiState.unlockedTables.length === 0) {
            TamagotchiState.unlockedTables = [...config.startTables];
        }
    }

    // Update UI
    document.querySelectorAll('#settings-screen-tamagotchi .difficulty-btn').forEach(btn => {
        const isSelected = btn.dataset.difficulty === difficulty;
        btn.classList.toggle('selected', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
}

// ===== SPEL STARTEN =====
function startTamagotchiGame() {
    // Laad opgeslagen data of start nieuw
    const hasData = loadTamagotchiState();

    // Als geen opgeslagen data, initialiseer met moeilijkheidsgraad
    if (!hasData) {
        const config = TamagotchiConfig.difficulties[TamagotchiState.difficulty];
        TamagotchiState.hunger = 100;
        TamagotchiState.happiness = 100;
        TamagotchiState.energy = 100;
        TamagotchiState.currentStreak = 0;
        TamagotchiState.totalCorrect = 0;
        TamagotchiState.unlockedTables = [...config.startTables];
        TamagotchiState.allTables = [...config.allTables];
    }

    // Start update loop
    startTamagotchiUpdateLoop();

    // Render pet en status
    renderTamagotchiPet();
    updateTamagotchiStatusBars();
    updateUnlockedTablesDisplay();
    updateStreakDisplay();

    // Toon het spelscherm
    showScreen('game-screen-tamagotchi');
}

function stopTamagotchiGame() {
    if (TamagotchiState.updateInterval) {
        clearInterval(TamagotchiState.updateInterval);
        TamagotchiState.updateInterval = null;
    }
    saveTamagotchiState();
}

// ===== UPDATE LOOP =====
function startTamagotchiUpdateLoop() {
    // Stop bestaande loop indien aanwezig
    if (TamagotchiState.updateInterval) {
        clearInterval(TamagotchiState.updateInterval);
    }

    TamagotchiState.updateInterval = setInterval(() => {
        updateTamagotchiStats();
    }, TamagotchiConfig.updateInterval);
}

function updateTamagotchiStats() {
    // Als huisdier slaapt, alleen energie herstellen
    if (TamagotchiState.isAsleep) {
        TamagotchiState.energy = Math.min(100, TamagotchiState.energy + 5);
        if (TamagotchiState.energy >= 100) {
            wakeUpPet();
        }
    } else {
        // Normale afname
        TamagotchiState.hunger = Math.max(0, TamagotchiState.hunger - TamagotchiConfig.decayRates.hunger);
        TamagotchiState.happiness = Math.max(0, TamagotchiState.happiness - TamagotchiConfig.decayRates.happiness);
        TamagotchiState.energy = Math.max(0, TamagotchiState.energy - TamagotchiConfig.decayRates.energy);
    }

    // Update mood gebaseerd op stats
    updatePetMood();

    // Update UI
    updateTamagotchiStatusBars();
    renderTamagotchiPet();

    // Sla op
    TamagotchiState.lastUpdateTime = Date.now();
    saveTamagotchiState();
}

// ===== STATUS BARS =====
function updateTamagotchiStatusBars() {
    const hungerBar = document.getElementById('hunger-bar');
    const happinessBar = document.getElementById('happiness-bar');
    const energyBar = document.getElementById('energy-bar');

    if (hungerBar) {
        hungerBar.style.width = `${TamagotchiState.hunger}%`;
        hungerBar.parentElement.classList.toggle('low', TamagotchiState.hunger < 30);
        hungerBar.parentElement.classList.toggle('critical', TamagotchiState.hunger < 15);
    }

    if (happinessBar) {
        happinessBar.style.width = `${TamagotchiState.happiness}%`;
        happinessBar.parentElement.classList.toggle('low', TamagotchiState.happiness < 30);
        happinessBar.parentElement.classList.toggle('critical', TamagotchiState.happiness < 15);
    }

    if (energyBar) {
        energyBar.style.width = `${TamagotchiState.energy}%`;
        energyBar.parentElement.classList.toggle('low', TamagotchiState.energy < 30);
        energyBar.parentElement.classList.toggle('critical', TamagotchiState.energy < 15);
    }
}

// ===== PET RENDERING =====
function renderTamagotchiPet() {
    const container = document.getElementById('pet-container');
    if (!container) return;

    // Bepaal pet state voor animatie
    let petClass = 'pet-normal';
    let petEmoji = '🐱';

    if (TamagotchiState.isAsleep) {
        petClass = 'pet-sleeping';
        petEmoji = '😴';
    } else if (TamagotchiState.hunger < 20 || TamagotchiState.happiness < 20) {
        petClass = 'pet-sad';
        petEmoji = '😢';
    } else if (TamagotchiState.happiness > 80 && TamagotchiState.hunger > 80) {
        petClass = 'pet-happy';
        petEmoji = '😸';
    } else if (TamagotchiState.energy < 20) {
        petClass = 'pet-tired';
        petEmoji = '😫';
    }

    container.innerHTML = `
        <div class="pet-sprite ${petClass}">
            <svg viewBox="0 0 120 120" class="pet-svg">
                <!-- Lichaam -->
                <ellipse cx="60" cy="70" rx="40" ry="35" class="pet-body"/>
                <ellipse cx="60" cy="75" rx="35" ry="28" class="pet-body-inner"/>

                <!-- Ogen -->
                ${TamagotchiState.isAsleep ? `
                    <line x1="40" y1="55" x2="50" y2="55" class="pet-eye-closed" stroke-width="3" stroke-linecap="round"/>
                    <line x1="70" y1="55" x2="80" y2="55" class="pet-eye-closed" stroke-width="3" stroke-linecap="round"/>
                ` : `
                    <ellipse cx="45" cy="55" rx="8" ry="10" class="pet-eye"/>
                    <ellipse cx="75" cy="55" rx="8" ry="10" class="pet-eye"/>
                    <circle cx="47" cy="57" r="4" class="pet-pupil"/>
                    <circle cx="77" cy="57" r="4" class="pet-pupil"/>
                    <circle cx="48" cy="55" r="1.5" class="pet-eye-shine"/>
                    <circle cx="78" cy="55" r="1.5" class="pet-eye-shine"/>
                `}

                <!-- Mond -->
                ${TamagotchiState.isAsleep ? `
                    <ellipse cx="60" cy="75" rx="5" ry="3" class="pet-mouth-sleep"/>
                ` : TamagotchiState.mood === 'sad' ? `
                    <path d="M 50 80 Q 60 73 70 80" class="pet-mouth-sad"/>
                ` : `
                    <path d="M 50 75 Q 60 85 70 75" class="pet-mouth-happy"/>
                `}

                <!-- Wangen -->
                <ellipse cx="30" cy="70" rx="6" ry="4" class="pet-cheek"/>
                <ellipse cx="90" cy="70" rx="6" ry="4" class="pet-cheek"/>

                <!-- Oortjes -->
                <path d="M 25 35 Q 30 20 40 30 Q 35 40 30 45" class="pet-ear"/>
                <path d="M 95 35 Q 90 20 80 30 Q 85 40 90 45" class="pet-ear"/>

                ${TamagotchiState.isAsleep ? `
                    <!-- Zzz -->
                    <text x="85" y="30" class="pet-zzz" font-size="12">z</text>
                    <text x="95" y="20" class="pet-zzz pet-zzz-2" font-size="14">z</text>
                    <text x="105" y="10" class="pet-zzz pet-zzz-3" font-size="16">Z</text>
                ` : ''}
            </svg>
        </div>
    `;

    // Update mood text
    const moodEl = document.getElementById('pet-mood');
    if (moodEl) {
        moodEl.textContent = getMoodText();
    }
}

function getMoodText() {
    if (TamagotchiState.isAsleep) return 'Zzz... Lekker slapen...';
    if (TamagotchiState.hunger < 20) return 'Ik heb honger!';
    if (TamagotchiState.happiness < 20) return 'Ik verveel me...';
    if (TamagotchiState.energy < 20) return 'Ik ben zo moe...';
    if (TamagotchiState.happiness > 80 && TamagotchiState.hunger > 80) return 'Ik ben super blij!';
    return 'Ik voel me goed!';
}

function updatePetMood() {
    if (TamagotchiState.hunger < 20 || TamagotchiState.happiness < 20) {
        TamagotchiState.mood = 'sad';
    } else if (TamagotchiState.happiness > 80) {
        TamagotchiState.mood = 'happy';
    } else {
        TamagotchiState.mood = 'normal';
    }
}

// ===== ACTIES =====
function openTamagotchiShop(action) {
    if (TamagotchiState.isAsleep) {
        // Wakker maken als er actie wordt ondernomen
        wakeUpPet();
    }

    TamagotchiState.currentAction = action;
    TamagotchiState.inputValue = '';

    // Genereer rekensom
    generateMathProblem();

    // Update popup UI
    const iconEl = document.getElementById('shop-action-icon');
    const textEl = document.getElementById('shop-action-text');

    if (action === 'feed') {
        iconEl.textContent = '🍎';
        textEl.textContent = 'Voer je huisdier';
    } else if (action === 'play') {
        iconEl.textContent = '🎾';
        textEl.textContent = 'Speel met je huisdier';
    }

    // Update math display
    updateTamagotchiMathDisplay();
    updateTamagotchiInputDisplay();

    // Toon popup
    document.getElementById('tamagotchi-shop-popup').classList.remove('hidden');

    // Focus eerste knop
    setTimeout(() => {
        const firstBtn = document.querySelector('#tamagotchi-number-pad .num-btn');
        if (firstBtn) firstBtn.focus();
    }, 100);
}

function closeTamagotchiShop() {
    document.getElementById('tamagotchi-shop-popup').classList.add('hidden');
    TamagotchiState.currentAction = null;
    TamagotchiState.currentMathProblem = null;
    TamagotchiState.inputValue = '';
}

function tamagotchiSleep() {
    if (TamagotchiState.isAsleep) return;

    TamagotchiState.isAsleep = true;
    renderTamagotchiPet();

    // Disable action buttons behalve slapen
    document.querySelectorAll('.tamagotchi-action-btn').forEach(btn => {
        if (!btn.classList.contains('sleep-btn')) {
            btn.classList.add('disabled');
        }
    });

    // Update sleep button
    const sleepBtn = document.querySelector('.sleep-btn');
    if (sleepBtn) {
        sleepBtn.querySelector('.action-label').textContent = 'Wakker';
        sleepBtn.onclick = wakeUpPet;
    }

    if (typeof playTone === 'function') {
        playTone(200, 0.3, 0.2);
    }
}

function wakeUpPet() {
    TamagotchiState.isAsleep = false;
    renderTamagotchiPet();

    // Enable action buttons
    document.querySelectorAll('.tamagotchi-action-btn').forEach(btn => {
        btn.classList.remove('disabled');
    });

    // Reset sleep button
    const sleepBtn = document.querySelector('.sleep-btn');
    if (sleepBtn) {
        sleepBtn.querySelector('.action-label').textContent = 'Slapen';
        sleepBtn.onclick = tamagotchiSleep;
    }

    if (typeof playTone === 'function') {
        playTone(400, 0.2, 0.2);
    }
}

// ===== REKENSOMMEN =====
function generateMathProblem() {
    // Kies een willekeurige tafel uit de ontgrendelde tafels
    const table = TamagotchiState.unlockedTables[
        Math.floor(Math.random() * TamagotchiState.unlockedTables.length)
    ];

    // Kies een willekeurig getal van 1-10
    const multiplier = Math.floor(Math.random() * 10) + 1;

    TamagotchiState.currentMathProblem = {
        table: table,
        multiplier: multiplier,
        answer: table * multiplier
    };
}

function updateTamagotchiMathDisplay() {
    const problemEl = document.getElementById('math-problem');
    if (problemEl && TamagotchiState.currentMathProblem) {
        const { table, multiplier } = TamagotchiState.currentMathProblem;
        problemEl.textContent = `${table} x ${multiplier} = ?`;
    }
}

function updateTamagotchiInputDisplay() {
    const display = document.getElementById('tamagotchi-input-display');
    if (display) {
        display.textContent = TamagotchiState.inputValue || '_';
    }
}

function tamagotchiInputNumber(num) {
    if (TamagotchiState.inputValue.length < 3) {
        TamagotchiState.inputValue += num.toString();
        updateTamagotchiInputDisplay();
    }
}

function tamagotchiClearInput() {
    TamagotchiState.inputValue = TamagotchiState.inputValue.slice(0, -1);
    updateTamagotchiInputDisplay();
}

function tamagotchiConfirmAnswer() {
    if (!TamagotchiState.currentMathProblem || TamagotchiState.inputValue === '') return;

    const userAnswer = parseInt(TamagotchiState.inputValue);
    const correctAnswer = TamagotchiState.currentMathProblem.answer;

    const inputDisplay = document.getElementById('tamagotchi-input-display');

    if (userAnswer === correctAnswer) {
        // Correct antwoord!
        handleCorrectTamagotchiAnswer(inputDisplay);
    } else {
        // Fout antwoord
        handleWrongTamagotchiAnswer(inputDisplay);
    }
}

function handleCorrectTamagotchiAnswer(inputDisplay) {
    // Visuele feedback
    if (inputDisplay) {
        inputDisplay.classList.add('correct');
        setTimeout(() => inputDisplay.classList.remove('correct'), 500);
    }

    // Geluid
    if (typeof playCorrectSound === 'function') {
        playCorrectSound();
    }

    // Update stats gebaseerd op actie
    const effects = TamagotchiConfig.actionEffects[TamagotchiState.currentAction];
    if (effects) {
        TamagotchiState.hunger = Math.max(0, Math.min(100, TamagotchiState.hunger + effects.hunger));
        TamagotchiState.happiness = Math.max(0, Math.min(100, TamagotchiState.happiness + effects.happiness));
        TamagotchiState.energy = Math.max(0, Math.min(100, TamagotchiState.energy + effects.energy));
    }

    // Update streak en totaal
    TamagotchiState.currentStreak++;
    TamagotchiState.totalCorrect++;

    // Check voor nieuwe tafel ontgrendeling
    checkTableUnlock();

    // Update UI
    updateTamagotchiStatusBars();
    updateStreakDisplay();
    renderTamagotchiPet();

    // Pet animatie
    animatePetAction(TamagotchiState.currentAction);

    // Sluit popup na korte vertraging
    setTimeout(() => {
        closeTamagotchiShop();
        saveTamagotchiState();
    }, 600);
}

function handleWrongTamagotchiAnswer(inputDisplay) {
    // Visuele feedback
    if (inputDisplay) {
        inputDisplay.classList.add('wrong');
        setTimeout(() => inputDisplay.classList.remove('wrong'), 500);
    }

    // Geluid
    if (typeof playWrongSound === 'function') {
        playWrongSound();
    }

    // Reset streak
    TamagotchiState.currentStreak = 0;
    updateStreakDisplay();

    // Clear input voor nieuwe poging
    TamagotchiState.inputValue = '';
    updateTamagotchiInputDisplay();

    // Pet schudt nee
    const petContainer = document.getElementById('pet-container');
    if (petContainer) {
        petContainer.classList.add('pet-shake');
        setTimeout(() => petContainer.classList.remove('pet-shake'), 500);
    }
}

function checkTableUnlock() {
    if (TamagotchiState.currentStreak >= TamagotchiConfig.streakToUnlock) {
        // Vind de volgende te ontgrendelen tafel
        const availableTables = TamagotchiState.allTables.filter(
            t => !TamagotchiState.unlockedTables.includes(t)
        );

        if (availableTables.length > 0) {
            const newTable = availableTables[0];
            TamagotchiState.unlockedTables.push(newTable);
            TamagotchiState.unlockedTables.sort((a, b) => a - b);

            // Reset streak
            TamagotchiState.currentStreak = 0;

            // Toon melding
            showTableUnlockMessage(newTable);

            // Update display
            updateUnlockedTablesDisplay();

            // Vuurwerk!
            if (typeof startFireworks === 'function') {
                startFireworks();
            }
            if (typeof playVictorySound === 'function') {
                playVictorySound();
            }
        }
    }
}

function showTableUnlockMessage(table) {
    const moodEl = document.getElementById('pet-mood');
    if (moodEl) {
        moodEl.textContent = `Hoera! Tafel van ${table} ontgrendeld!`;
        moodEl.classList.add('unlock-message');
        setTimeout(() => {
            moodEl.classList.remove('unlock-message');
            moodEl.textContent = getMoodText();
        }, 3000);
    }
}

function updateStreakDisplay() {
    const streakCount = document.getElementById('streak-count');
    if (streakCount) {
        streakCount.textContent = TamagotchiState.currentStreak;
    }

    // Highlight als dicht bij unlock
    const streakContainer = document.getElementById('tamagotchi-streak');
    if (streakContainer) {
        streakContainer.classList.toggle('near-unlock',
            TamagotchiState.currentStreak >= TamagotchiConfig.streakToUnlock - 3);
    }
}

function updateUnlockedTablesDisplay() {
    const tablesEl = document.getElementById('unlocked-tables');
    if (tablesEl) {
        tablesEl.textContent = TamagotchiState.unlockedTables.join(', ');
    }
}

// ===== PET ANIMATIES =====
function animatePetAction(action) {
    const petContainer = document.getElementById('pet-container');
    if (!petContainer) return;

    let animClass = '';
    if (action === 'feed') {
        animClass = 'pet-eating';
    } else if (action === 'play') {
        animClass = 'pet-playing';
    }

    if (animClass) {
        petContainer.classList.add(animClass);
        setTimeout(() => petContainer.classList.remove(animClass), 1000);
    }
}

// ===== CLEANUP =====
function stopTamagotchiTimer() {
    stopTamagotchiGame();
}

// ===== INITIALISEER BIJ LADEN =====
document.addEventListener('DOMContentLoaded', () => {
    initTamagotchi();

    // Standaard moeilijkheidsgraad
    selectTamagotchiDifficulty('makkelijk');
});

// Maak functies globaal beschikbaar
if (typeof window !== 'undefined') {
    window.selectTamagotchiDifficulty = selectTamagotchiDifficulty;
    window.startTamagotchiGame = startTamagotchiGame;
    window.stopTamagotchiGame = stopTamagotchiGame;
    window.stopTamagotchiTimer = stopTamagotchiTimer;
    window.openTamagotchiShop = openTamagotchiShop;
    window.closeTamagotchiShop = closeTamagotchiShop;
    window.tamagotchiSleep = tamagotchiSleep;
    window.tamagotchiInputNumber = tamagotchiInputNumber;
    window.tamagotchiClearInput = tamagotchiClearInput;
    window.tamagotchiConfirmAnswer = tamagotchiConfirmAnswer;
}
