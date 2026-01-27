// Spellogica voor Sudoku (kindervariant)

// Sudoku variabelen
let sudokuGrid = []; // 2D array met de volledige oplossing
let sudokuPuzzle = []; // 2D array met de puzzel (sommige cellen verborgen)
let sudokuSize = 4; // 4x4 of 6x6
let sudokuEmptyCells = 0;
let sudokuTimerInterval = null;
let sudokuStartTime = null;
let currentSudokuCell = null;

// Moeilijkheidsgraad presets voor sudoku
const sudokuDifficultyPresets = {
    makkelijk: {
        hidePercent4x4: 35,  // ~5-6 lege cellen bij 4x4
        hidePercent6x6: 40   // ~14-15 lege cellen bij 6x6
    },
    normaal: {
        hidePercent4x4: 50,  // ~8 lege cellen bij 4x4
        hidePercent6x6: 50   // ~18 lege cellen bij 6x6
    },
    moeilijk: {
        hidePercent4x4: 60,  // ~9-10 lege cellen bij 4x4
        hidePercent6x6: 60   // ~21-22 lege cellen bij 6x6
    }
};

let currentSudokuDifficulty = 'normaal';

// Selecteer moeilijkheidsgraad voor sudoku
function selectSudokuDifficulty(difficulty) {
    currentSudokuDifficulty = difficulty;

    // Update UI
    document.querySelectorAll('#settings-screen-sudoku .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`#settings-screen-sudoku .difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('selected');
}

// Selecteer grid grootte
function selectSudokuSize(size) {
    sudokuSize = size;

    // Update UI
    document.querySelectorAll('#settings-screen-sudoku .grid-size-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`#settings-screen-sudoku .grid-size-btn[data-size="${size}"]`).classList.add('selected');
}

// Genereer een opgeloste sudoku grid
function generateSolvedSudoku(size) {
    const grid = [];
    for (let i = 0; i < size; i++) {
        grid.push(new Array(size).fill(0));
    }

    // Vul de grid met een geldige oplossing
    fillSudoku(grid, size);
    return grid;
}

// Vul de sudoku grid recursief (backtracking)
function fillSudoku(grid, size) {
    const emptyCell = findEmptyCell(grid, size);
    if (!emptyCell) return true; // Grid is vol

    const [row, col] = emptyCell;
    const numbers = shuffleArray([...Array(size)].map((_, i) => i + 1));

    for (const num of numbers) {
        if (isValidPlacement(grid, row, col, num, size)) {
            grid[row][col] = num;

            if (fillSudoku(grid, size)) {
                return true;
            }

            grid[row][col] = 0;
        }
    }

    return false;
}

// Vind een lege cel
function findEmptyCell(grid, size) {
    for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
            if (grid[row][col] === 0) {
                return [row, col];
            }
        }
    }
    return null;
}

// Controleer of een getal geldig geplaatst kan worden
function isValidPlacement(grid, row, col, num, size) {
    // Check rij
    for (let c = 0; c < size; c++) {
        if (grid[row][c] === num) return false;
    }

    // Check kolom
    for (let r = 0; r < size; r++) {
        if (grid[r][col] === num) return false;
    }

    // Check blok
    const blockHeight = size === 4 ? 2 : 2;
    const blockWidth = size === 4 ? 2 : 3;

    const blockStartRow = Math.floor(row / blockHeight) * blockHeight;
    const blockStartCol = Math.floor(col / blockWidth) * blockWidth;

    for (let r = blockStartRow; r < blockStartRow + blockHeight; r++) {
        for (let c = blockStartCol; c < blockStartCol + blockWidth; c++) {
            if (grid[r][c] === num) return false;
        }
    }

    return true;
}

// Shuffle een array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Maak puzzel door cellen te verbergen
function createPuzzle(solvedGrid, size, hidePercent) {
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
    shuffleArray(allCells);

    for (let i = 0; i < cellsToHide && i < allCells.length; i++) {
        const { row, col } = allCells[i];
        puzzle[row][col].hidden = true;
        puzzle[row][col].original = false;
    }

    return puzzle;
}

// Render de sudoku grid
function renderSudoku() {
    const container = document.getElementById('sudoku-grid');
    container.innerHTML = '';

    const blockHeight = sudokuSize === 4 ? 2 : 2;
    const blockWidth = sudokuSize === 4 ? 2 : 3;

    // Stel grid grootte in
    container.style.gridTemplateColumns = `repeat(${sudokuSize}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${sudokuSize}, 1fr)`;
    container.className = `sudoku-grid size-${sudokuSize}`;

    sudokuEmptyCells = 0;

    for (let row = 0; row < sudokuSize; row++) {
        for (let col = 0; col < sudokuSize; col++) {
            const cell = sudokuPuzzle[row][col];
            const cellDiv = document.createElement('div');
            cellDiv.className = 'sudoku-cell';
            cellDiv.dataset.row = row;
            cellDiv.dataset.col = col;

            // Voeg dikke randen toe voor blokken
            if (col % blockWidth === 0 && col !== 0) {
                cellDiv.classList.add('block-left');
            }
            if (row % blockHeight === 0 && row !== 0) {
                cellDiv.classList.add('block-top');
            }

            if (cell.hidden && !cell.solved) {
                cellDiv.classList.add('empty');
                cellDiv.textContent = '';
                cellDiv.addEventListener('click', () => openSudokuInput(row, col));
                sudokuEmptyCells++;
            } else {
                cellDiv.classList.add('filled');
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
function openSudokuInput(row, col) {
    currentSudokuCell = { row, col };

    // Vul de nummer grid
    const numberGrid = document.getElementById('sudoku-number-grid');
    numberGrid.innerHTML = '';
    numberGrid.className = `sudoku-number-grid size-${sudokuSize}`;

    for (let num = 1; num <= sudokuSize; num++) {
        const btn = document.createElement('button');
        btn.className = 'sudoku-num-btn';
        btn.textContent = num;
        btn.addEventListener('click', () => selectSudokuNumber(num));
        numberGrid.appendChild(btn);
    }

    document.getElementById('sudoku-input-popup').classList.remove('hidden');
}

// Sluit sudoku popup
function closeSudokuPopup() {
    document.getElementById('sudoku-input-popup').classList.add('hidden');
    currentSudokuCell = null;
}

// Selecteer een nummer
function selectSudokuNumber(num) {
    if (!currentSudokuCell) return;

    const { row, col } = currentSudokuCell;
    const correctAnswer = sudokuGrid[row][col];
    const cellElement = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);

    if (num === correctAnswer) {
        // Goed!
        sudokuPuzzle[row][col].solved = true;
        sudokuPuzzle[row][col].hidden = false;
        cellElement.classList.remove('empty');
        cellElement.classList.add('filled', 'correct');
        cellElement.textContent = correctAnswer;

        // Verwijder click handler
        const newCell = cellElement.cloneNode(true);
        cellElement.parentNode.replaceChild(newCell, cellElement);

        playCorrectSound();
        sudokuEmptyCells--;

        closeSudokuPopup();

        // Check of alles is opgelost
        if (sudokuEmptyCells === 0) {
            setTimeout(() => {
                stopSudokuTimer();
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

// Start sudoku spel
function startSudokuGame() {
    const preset = sudokuDifficultyPresets[currentSudokuDifficulty];
    const hidePercent = sudokuSize === 4 ? preset.hidePercent4x4 : preset.hidePercent6x6;

    // Genereer opgeloste grid
    sudokuGrid = generateSolvedSudoku(sudokuSize);

    // Maak puzzel
    sudokuPuzzle = createPuzzle(sudokuGrid, sudokuSize, hidePercent);

    // Render
    renderSudoku();

    showScreen('game-screen-sudoku');
    startSudokuTimer();
}

// Timer functies voor sudoku
function startSudokuTimer() {
    sudokuStartTime = Date.now();
    updateSudokuTimerDisplay();
    sudokuTimerInterval = setInterval(updateSudokuTimerDisplay, 1000);
}

function stopSudokuTimer() {
    if (sudokuTimerInterval) {
        clearInterval(sudokuTimerInterval);
        sudokuTimerInterval = null;
    }
}

function updateSudokuTimerDisplay() {
    const elapsed = Math.floor((Date.now() - sudokuStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('sudoku-timer-display').textContent = `${minutes}:${seconds}`;
}

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    // Zet standaard moeilijkheidsgraad
    selectSudokuDifficulty('normaal');
    selectSudokuSize(4);
});
