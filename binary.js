// Spellogica voor Binary (Takuzu/Binairo)

// Binary variabelen
let binaryGrid = []; // 2D array met de volledige oplossing
let binaryPuzzle = []; // 2D array met de puzzel (sommige cellen verborgen)
let binarySize = 4; // 4x4, 6x6 of 8x8
let binaryEmptyCells = 0;
let binaryTimerInterval = null;
let binaryStartTime = null;
let currentBinaryCell = null;

// Moeilijkheidsgraad presets voor binary
const binaryDifficultyPresets = {
    makkelijk: {
        hidePercent4x4: 30,  // ~5 lege cellen
        hidePercent6x6: 35,  // ~13 lege cellen
        hidePercent8x8: 35   // ~22 lege cellen
    },
    normaal: {
        hidePercent4x4: 45,  // ~7 lege cellen
        hidePercent6x6: 45,  // ~16 lege cellen
        hidePercent8x8: 45   // ~29 lege cellen
    },
    moeilijk: {
        hidePercent4x4: 55,  // ~9 lege cellen
        hidePercent6x6: 55,  // ~20 lege cellen
        hidePercent8x8: 55   // ~35 lege cellen
    }
};

let currentBinaryDifficulty = 'normaal';

// Selecteer moeilijkheidsgraad voor binary
function selectBinaryDifficulty(difficulty) {
    currentBinaryDifficulty = difficulty;

    // Update UI
    document.querySelectorAll('#settings-screen-binary .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`#settings-screen-binary .difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('selected');
}

// Selecteer grid grootte
function selectBinarySize(size) {
    binarySize = size;

    // Update UI
    document.querySelectorAll('#settings-screen-binary .grid-size-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`#settings-screen-binary .grid-size-btn[data-size="${size}"]`).classList.add('selected');
}

// Genereer een opgeloste binary grid
function generateSolvedBinary(size) {
    const grid = [];
    for (let i = 0; i < size; i++) {
        grid.push(new Array(size).fill(-1));
    }

    // Vul de grid met een geldige oplossing
    if (fillBinary(grid, size, 0, 0)) {
        return grid;
    }

    // Als het niet lukt, probeer opnieuw
    return generateSolvedBinary(size);
}

// Vul de binary grid recursief (backtracking)
function fillBinary(grid, size, row, col) {
    // Als we voorbij de laatste rij zijn, is de grid compleet
    if (row >= size) return true;

    // Bereken volgende positie
    const nextCol = (col + 1) % size;
    const nextRow = nextCol === 0 ? row + 1 : row;

    // Probeer 0 en 1 in willekeurige volgorde
    const values = Math.random() < 0.5 ? [0, 1] : [1, 0];

    for (const value of values) {
        if (isValidBinaryPlacement(grid, row, col, value, size)) {
            grid[row][col] = value;

            if (fillBinary(grid, size, nextRow, nextCol)) {
                return true;
            }

            grid[row][col] = -1;
        }
    }

    return false;
}

// Controleer of een waarde geldig geplaatst kan worden
function isValidBinaryPlacement(grid, row, col, value, size) {
    // Tijdelijk plaatsen voor controle
    const oldValue = grid[row][col];
    grid[row][col] = value;

    const valid = checkBinaryRules(grid, row, col, size);

    // Terugzetten
    grid[row][col] = oldValue;

    return valid;
}

// Controleer alle binary regels
function checkBinaryRules(grid, row, col, size) {
    const value = grid[row][col];
    if (value === -1) return true;

    // Regel 1: Niet meer dan 2 dezelfde waarden naast elkaar (horizontaal)
    if (!checkNoThreeInRow(grid, row, size)) return false;

    // Regel 2: Niet meer dan 2 dezelfde waarden naast elkaar (verticaal)
    if (!checkNoThreeInCol(grid, col, size)) return false;

    // Regel 3: Evenveel 0'en als 1'en per rij (alleen controleren als rij vol is)
    if (!checkEqualCountInRow(grid, row, size)) return false;

    // Regel 4: Evenveel 0'en als 1'en per kolom (alleen controleren als kolom vol is)
    if (!checkEqualCountInCol(grid, col, size)) return false;

    return true;
}

// Check of er niet 3 dezelfde waarden naast elkaar staan in een rij
function checkNoThreeInRow(grid, row, size) {
    for (let col = 0; col < size - 2; col++) {
        const a = grid[row][col];
        const b = grid[row][col + 1];
        const c = grid[row][col + 2];

        if (a !== -1 && a === b && b === c) {
            return false;
        }
    }
    return true;
}

// Check of er niet 3 dezelfde waarden naast elkaar staan in een kolom
function checkNoThreeInCol(grid, col, size) {
    for (let row = 0; row < size - 2; row++) {
        const a = grid[row][col];
        const b = grid[row + 1][col];
        const c = grid[row + 2][col];

        if (a !== -1 && a === b && b === c) {
            return false;
        }
    }
    return true;
}

// Check of er evenveel 0'en als 1'en in een rij zijn
function checkEqualCountInRow(grid, row, size) {
    let zeros = 0;
    let ones = 0;
    let empty = 0;

    for (let col = 0; col < size; col++) {
        if (grid[row][col] === 0) zeros++;
        else if (grid[row][col] === 1) ones++;
        else empty++;
    }

    const half = size / 2;

    // Als de rij vol is, moeten er exact evenveel zijn
    if (empty === 0) {
        return zeros === half && ones === half;
    }

    // Anders mag geen van beide meer dan de helft hebben
    return zeros <= half && ones <= half;
}

// Check of er evenveel 0'en als 1'en in een kolom zijn
function checkEqualCountInCol(grid, col, size) {
    let zeros = 0;
    let ones = 0;
    let empty = 0;

    for (let row = 0; row < size; row++) {
        if (grid[row][col] === 0) zeros++;
        else if (grid[row][col] === 1) ones++;
        else empty++;
    }

    const half = size / 2;

    // Als de kolom vol is, moeten er exact evenveel zijn
    if (empty === 0) {
        return zeros === half && ones === half;
    }

    // Anders mag geen van beide meer dan de helft hebben
    return zeros <= half && ones <= half;
}

// Maak puzzel door cellen te verbergen
function createBinaryPuzzle(solvedGrid, size, hidePercent) {
    const puzzle = solvedGrid.map(row => row.map(cell => ({
        value: cell,
        hidden: false,
        solved: false,
        original: true
    })));

    const totalCells = size * size;
    const cellsToHide = Math.floor(totalCells * (hidePercent / 100));

    // Maak een lijst van alle cel-posities
    const allCells = [];
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            allCells.push({ row, col });
        }
    }

    // Shuffle en verberg cellen
    shuffleBinaryArray(allCells);

    for (let i = 0; i < cellsToHide && i < allCells.length; i++) {
        const { row, col } = allCells[i];
        puzzle[row][col].hidden = true;
        puzzle[row][col].original = false;
    }

    return puzzle;
}

// Shuffle array helper
function shuffleBinaryArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Render de binary grid
function renderBinary() {
    const container = document.getElementById('binary-grid');
    container.innerHTML = '';

    // Stel grid grootte in
    container.style.gridTemplateColumns = `repeat(${binarySize}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${binarySize}, 1fr)`;
    container.className = `binary-grid size-${binarySize}`;

    binaryEmptyCells = 0;

    for (let row = 0; row < binarySize; row++) {
        for (let col = 0; col < binarySize; col++) {
            const cell = binaryPuzzle[row][col];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'binary-cell';
            cellDiv.dataset.row = row;
            cellDiv.dataset.col = col;

            if (cell.hidden && !cell.solved) {
                cellDiv.classList.add('empty');
                cellDiv.textContent = '';
                cellDiv.addEventListener('click', () => openBinaryInput(row, col));
                binaryEmptyCells++;
            } else {
                cellDiv.classList.add('filled');
                if (cell.value === 0) {
                    cellDiv.classList.add('zero');
                } else {
                    cellDiv.classList.add('one');
                }
                if (cell.solved) {
                    cellDiv.classList.add('correct');
                } else if (cell.original) {
                    cellDiv.classList.add('original');
                }
                cellDiv.textContent = cell.value;
            }

            container.appendChild(cellDiv);
        }
    }
}

// Open de nummer selectie popup
function openBinaryInput(row, col) {
    currentBinaryCell = { row, col };
    document.getElementById('binary-input-popup').classList.remove('hidden');
}

// Sluit binary popup
function closeBinaryPopup() {
    document.getElementById('binary-input-popup').classList.add('hidden');
    currentBinaryCell = null;
}

// Selecteer een nummer (0 of 1)
function selectBinaryNumber(num) {
    if (!currentBinaryCell) return;

    const { row, col } = currentBinaryCell;
    const correctAnswer = binaryGrid[row][col];
    const cellElement = document.querySelector(`.binary-cell[data-row="${row}"][data-col="${col}"]`);

    if (num === correctAnswer) {
        // Goed!
        binaryPuzzle[row][col].solved = true;
        binaryPuzzle[row][col].hidden = false;
        cellElement.classList.remove('empty');
        cellElement.classList.add('filled', 'correct');
        if (num === 0) {
            cellElement.classList.add('zero');
        } else {
            cellElement.classList.add('one');
        }
        cellElement.textContent = correctAnswer;

        // Verwijder click handler
        const newCell = cellElement.cloneNode(true);
        cellElement.parentNode.replaceChild(newCell, cellElement);

        playCorrectSound();
        binaryEmptyCells--;

        closeBinaryPopup();

        // Check of alles is opgelost
        if (binaryEmptyCells === 0) {
            setTimeout(() => {
                stopBinaryTimer();
                playVictorySound();
                startFireworks();
            }, 500);
        }
    } else {
        // Fout!
        cellElement.classList.add('wrong');
        playWrongSound();

        setTimeout(() => {
            cellElement.classList.remove('wrong');
        }, 1000);
    }
}

// Start binary spel
function startBinaryGame() {
    const preset = binaryDifficultyPresets[currentBinaryDifficulty];
    let hidePercent;
    if (binarySize === 4) {
        hidePercent = preset.hidePercent4x4;
    } else if (binarySize === 6) {
        hidePercent = preset.hidePercent6x6;
    } else {
        hidePercent = preset.hidePercent8x8;
    }

    // Genereer opgeloste grid
    binaryGrid = generateSolvedBinary(binarySize);

    // Maak puzzel
    binaryPuzzle = createBinaryPuzzle(binaryGrid, binarySize, hidePercent);

    // Render
    renderBinary();

    showScreen('game-screen-binary');
    startBinaryTimer();
}

// Timer functies voor binary
function startBinaryTimer() {
    binaryStartTime = Date.now();
    updateBinaryTimerDisplay();
    binaryTimerInterval = setInterval(updateBinaryTimerDisplay, 1000);
}

function stopBinaryTimer() {
    if (binaryTimerInterval) {
        clearInterval(binaryTimerInterval);
        binaryTimerInterval = null;
    }
}

function updateBinaryTimerDisplay() {
    const elapsed = Math.floor((Date.now() - binaryStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('binary-timer-display').textContent = `${minutes}:${seconds}`;
}

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    // Zet standaard moeilijkheidsgraad
    selectBinaryDifficulty('normaal');
    selectBinarySize(4);
});
