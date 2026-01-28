// Wisselgeld Spel
// Sleep de juiste munten naar het spaarvarken om het exacte bedrag te maken

// Beschikbare munten in centen
const COINS = [200, 100, 50, 20, 10, 5, 2, 1];
const COIN_LABELS = {
    200: '€2',
    100: '€1',
    50: '50c',
    20: '20c',
    10: '10c',
    5: '5c',
    2: '2c',
    1: '1c'
};

// Producten met prijzen (in centen)
const PRODUCTS = [
    { name: 'Appel', emoji: '🍎', minPrice: 30, maxPrice: 95 },
    { name: 'Banaan', emoji: '🍌', minPrice: 25, maxPrice: 75 },
    { name: 'Koekje', emoji: '🍪', minPrice: 15, maxPrice: 60 },
    { name: 'Lolly', emoji: '🍭', minPrice: 10, maxPrice: 50 },
    { name: 'Snoepje', emoji: '🍬', minPrice: 5, maxPrice: 35 },
    { name: 'IJs', emoji: '🍦', minPrice: 80, maxPrice: 250 },
    { name: 'Cupcake', emoji: '🧁', minPrice: 100, maxPrice: 300 },
    { name: 'Donut', emoji: '🍩', minPrice: 75, maxPrice: 180 },
    { name: 'Croissant', emoji: '🥐', minPrice: 90, maxPrice: 200 },
    { name: 'Broodje', emoji: '🥪', minPrice: 150, maxPrice: 350 },
    { name: 'Pizza', emoji: '🍕', minPrice: 200, maxPrice: 400 },
    { name: 'Popcorn', emoji: '🍿', minPrice: 120, maxPrice: 280 },
    { name: 'Chocolade', emoji: '🍫', minPrice: 80, maxPrice: 195 },
    { name: 'Kauwgom', emoji: '🫐', minPrice: 20, maxPrice: 65 }
];

// Spel staat
let changeTargetAmount = 0;
let changeCurrentAmount = 0;
let changeSelectedCoins = [];
let changeTimerInterval = null;
let changeStartTime = null;
let changeDifficulty = 'normaal';
let changeRoundsCompleted = 0;
let changeTotalRounds = 5;

// Moeilijkheidsgraad presets
const changeDifficultyPresets = {
    makkelijk: {
        minPrice: 10,
        maxPrice: 100,
        allowedCoins: [100, 50, 20, 10, 5],
        rounds: 5
    },
    normaal: {
        minPrice: 25,
        maxPrice: 250,
        allowedCoins: [200, 100, 50, 20, 10, 5],
        rounds: 7
    },
    moeilijk: {
        minPrice: 50,
        maxPrice: 400,
        allowedCoins: [200, 100, 50, 20, 10, 5, 2, 1],
        rounds: 10
    }
};

/**
 * Selecteer moeilijkheidsgraad voor wisselgeld
 */
function selectChangeDifficulty(difficulty) {
    changeDifficulty = difficulty;

    // Update UI
    document.querySelectorAll('#settings-screen-change .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
    });

    const selectedBtn = document.querySelector(`#settings-screen-change .difficulty-btn[data-difficulty="${difficulty}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
        selectedBtn.setAttribute('aria-pressed', 'true');
    }
}

/**
 * Start het wisselgeld spel
 */
function startChangeGame() {
    const preset = changeDifficultyPresets[changeDifficulty];
    changeTotalRounds = preset.rounds;
    changeRoundsCompleted = 0;

    showScreen('game-screen-change');
    startChangeTimer();
    generateChangeRound();
}

/**
 * Genereer een nieuwe ronde
 */
function generateChangeRound() {
    const preset = changeDifficultyPresets[changeDifficulty];

    // Kies een willekeurig product
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];

    // Bereken prijs binnen de limieten
    const minPrice = Math.max(product.minPrice, preset.minPrice);
    const maxPrice = Math.min(product.maxPrice, preset.maxPrice);

    // Genereer een prijs die altijd een veelvoud van 5 cent is
    // (behalve op moeilijk waar 1c en 2c munten beschikbaar zijn)
    let price;
    if (changeDifficulty === 'moeilijk') {
        // Op moeilijk: alle bedragen mogelijk, maar rond af op hele centen
        price = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
    } else {
        // Op makkelijk en normaal: alleen veelvouden van 5 cent
        price = Math.round((Math.random() * (maxPrice - minPrice) + minPrice) / 5) * 5;
    }

    changeTargetAmount = price;
    changeCurrentAmount = 0;
    changeSelectedCoins = [];

    renderChangeGame(product, price, preset.allowedCoins);
}

/**
 * Formatteer bedrag in euros
 */
function formatPrice(cents) {
    const euros = Math.floor(cents / 100);
    const restCents = cents % 100;

    if (euros > 0 && restCents > 0) {
        return `€${euros},${restCents.toString().padStart(2, '0')}`;
    } else if (euros > 0) {
        return `€${euros},-`;
    } else {
        return `€0,${restCents.toString().padStart(2, '0')}`;
    }
}

/**
 * Render het spel
 */
function renderChangeGame(product, price, allowedCoins) {
    const container = document.getElementById('change-game-container');
    if (!container) return;

    // Update ronde indicator
    const roundDisplay = document.getElementById('change-round-display');
    if (roundDisplay) {
        roundDisplay.textContent = `Ronde ${changeRoundsCompleted + 1}/${changeTotalRounds}`;
    }

    container.innerHTML = `
        <div class="change-product">
            <div class="product-emoji">${product.emoji}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatPrice(price)}</div>
        </div>

        <div class="change-target-area" id="change-target"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event)"
             role="region"
             aria-label="Sleep munten hierheen">
            <div class="piggy-bank">🐷</div>
            <div class="current-amount" id="current-amount-display">€0,00</div>
            <div class="target-hint">Sleep de juiste munten hierheen!</div>
        </div>

        <div class="change-coins-area">
            <div class="coins-grid" id="coins-grid">
                ${allowedCoins.map(coin => `
                    <div class="coin-stack" data-coin="${coin}">
                        <button class="coin"
                                draggable="true"
                                ondragstart="handleDragStart(event, ${coin})"
                                onclick="addCoin(${coin})"
                                aria-label="${COIN_LABELS[coin]} toevoegen">
                            ${COIN_LABELS[coin]}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="selected-coins-area" id="selected-coins">
            <div class="selected-coins-label">Geselecteerde munten:</div>
            <div class="selected-coins-list" id="selected-coins-list"></div>
        </div>

        <div class="change-actions">
            <button class="reset-btn" onclick="resetCoins()" aria-label="Reset munten">🔄 Opnieuw</button>
            <button class="check-btn" onclick="checkChangeAnswer()" aria-label="Controleer antwoord">✓ Controleer</button>
        </div>
    `;

    updateCurrentAmountDisplay();
}

/**
 * Handle drag start
 */
function handleDragStart(event, coinValue) {
    event.dataTransfer.setData('text/plain', coinValue);
    event.dataTransfer.effectAllowed = 'copy';
}

/**
 * Handle drag over
 */
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    event.currentTarget.classList.add('drag-over');
}

/**
 * Handle drop
 */
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');

    const coinValue = parseInt(event.dataTransfer.getData('text/plain'));
    if (coinValue) {
        addCoin(coinValue);
    }
}

/**
 * Voeg een munt toe
 */
function addCoin(value) {
    changeSelectedCoins.push(value);
    changeCurrentAmount += value;

    updateSelectedCoinsDisplay();
    updateCurrentAmountDisplay();

    // Geluid afspelen
    if (typeof playTone === 'function') {
        playTone(600 + (value * 2), 0.1, 0.2);
    }
}

/**
 * Verwijder een munt
 */
function removeCoin(index) {
    const value = changeSelectedCoins[index];
    changeSelectedCoins.splice(index, 1);
    changeCurrentAmount -= value;

    updateSelectedCoinsDisplay();
    updateCurrentAmountDisplay();
}

/**
 * Reset alle munten
 */
function resetCoins() {
    changeSelectedCoins = [];
    changeCurrentAmount = 0;

    updateSelectedCoinsDisplay();
    updateCurrentAmountDisplay();
}

/**
 * Update het display van geselecteerde munten
 */
function updateSelectedCoinsDisplay() {
    const container = document.getElementById('selected-coins-list');
    if (!container) return;

    if (changeSelectedCoins.length === 0) {
        container.innerHTML = '<span class="no-coins">Nog geen munten</span>';
        return;
    }

    container.innerHTML = changeSelectedCoins.map((coin, index) => `
        <button class="selected-coin"
                onclick="removeCoin(${index})"
                aria-label="${COIN_LABELS[coin]} verwijderen">
            ${COIN_LABELS[coin]}
            <span class="remove-coin">×</span>
        </button>
    `).join('');
}

/**
 * Update het huidige bedrag display
 */
function updateCurrentAmountDisplay() {
    const display = document.getElementById('current-amount-display');
    if (display) {
        display.textContent = formatPrice(changeCurrentAmount);

        // Kleur aanpassen op basis van status
        if (changeCurrentAmount === changeTargetAmount) {
            display.classList.add('correct');
            display.classList.remove('over');
        } else if (changeCurrentAmount > changeTargetAmount) {
            display.classList.add('over');
            display.classList.remove('correct');
        } else {
            display.classList.remove('correct', 'over');
        }
    }
}

/**
 * Controleer het antwoord
 */
function checkChangeAnswer() {
    if (changeCurrentAmount === changeTargetAmount) {
        // Correct!
        changeRoundsCompleted++;

        if (typeof playCorrectSound === 'function') {
            playCorrectSound();
        }

        // Visuele feedback
        const targetArea = document.getElementById('change-target');
        if (targetArea) {
            targetArea.classList.add('correct-answer');
            setTimeout(() => targetArea.classList.remove('correct-answer'), 500);
        }

        // Check of alle rondes voltooid zijn
        if (changeRoundsCompleted >= changeTotalRounds) {
            setTimeout(() => {
                stopChangeTimer();
                if (typeof playVictorySound === 'function') playVictorySound();
                if (typeof startFireworks === 'function') startFireworks();
            }, 500);
        } else {
            // Volgende ronde na korte pauze
            setTimeout(() => {
                generateChangeRound();
            }, 800);
        }
    } else {
        // Fout
        if (typeof playWrongSound === 'function') {
            playWrongSound();
        }

        // Visuele feedback
        const targetArea = document.getElementById('change-target');
        if (targetArea) {
            targetArea.classList.add('wrong-answer');
            setTimeout(() => targetArea.classList.remove('wrong-answer'), 500);
        }

        // Hint geven
        const hint = document.querySelector('.target-hint');
        if (hint) {
            if (changeCurrentAmount < changeTargetAmount) {
                hint.textContent = 'Te weinig! Voeg meer munten toe.';
            } else {
                hint.textContent = 'Te veel! Verwijder wat munten.';
            }
            hint.classList.add('hint-error');
            setTimeout(() => {
                hint.classList.remove('hint-error');
                hint.textContent = 'Sleep de juiste munten hierheen!';
            }, 2000);
        }
    }
}

/**
 * Start de timer
 */
function startChangeTimer() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.start('change');
        return;
    }

    changeStartTime = Date.now();
    updateChangeTimerDisplay();
    changeTimerInterval = setInterval(updateChangeTimerDisplay, 1000);
}

/**
 * Stop de timer
 */
function stopChangeTimer() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.stop('change');
    }
    if (changeTimerInterval) {
        clearInterval(changeTimerInterval);
        changeTimerInterval = null;
    }
}

/**
 * Update timer display
 */
function updateChangeTimerDisplay() {
    const elapsed = Math.floor((Date.now() - changeStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');

    const display = document.getElementById('change-timer-display');
    if (display) {
        display.textContent = `${minutes}:${seconds}`;
    }
}

// Exporteer functies
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startChangeGame,
        selectChangeDifficulty
    };
}
