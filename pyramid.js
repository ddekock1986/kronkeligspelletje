// Spellogica voor Rekenpiramide

// Piramide variabelen
let pyramidData = []; // 2D array: pyramidData[row][col] = {value, hidden, solved}
let pyramidLayers = 4;
let pyramidMaxBase = 10;
let pyramidHidePercent = 50;
let pyramidEmptyCells = 0;
let pyramidTimerInterval = null;
let pyramidStartTime = null;

// Moeilijkheidsgraad presets voor piramide
const pyramidDifficultyPresets = {
    makkelijk: {
        layers: 3,
        maxBase: 5,
        hidePercent: 35
    },
    normaal: {
        layers: 4,
        maxBase: 10,
        hidePercent: 50
    },
    moeilijk: {
        layers: 5,
        maxBase: 15,
        hidePercent: 60
    }
};

// Selecteer moeilijkheidsgraad voor piramide
function selectPyramidDifficulty(difficulty) {
    const preset = pyramidDifficultyPresets[difficulty];

    // Update UI
    document.querySelectorAll('#settings-screen-pyramid .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`#settings-screen-pyramid .difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('selected');

    // Vul de velden in
    document.getElementById('pyramid-layers').value = preset.layers;
    document.getElementById('pyramid-max-base').value = preset.maxBase;
    document.getElementById('pyramid-hide-percent').value = preset.hidePercent;
    document.getElementById('pyramid-hide-percent-display').textContent = preset.hidePercent + '%';
}

// Update slider display
document.getElementById('pyramid-hide-percent')?.addEventListener('input', function() {
    document.getElementById('pyramid-hide-percent-display').textContent = this.value + '%';
});

// Genereer de piramide data
function generatePyramid(layers, maxBase) {
    pyramidData = [];

    // Genereer de onderste rij met willekeurige getallen (minimaal 1)
    const bottomRow = [];
    for (let i = 0; i < layers; i++) {
        bottomRow.push({
            value: Math.floor(Math.random() * maxBase) + 1,
            hidden: false,
            solved: false
        });
    }
    pyramidData.push(bottomRow);

    // Bouw de piramide naar boven op
    for (let row = 1; row < layers; row++) {
        const newRow = [];
        const prevRow = pyramidData[row - 1];

        for (let col = 0; col < prevRow.length - 1; col++) {
            newRow.push({
                value: prevRow[col].value + prevRow[col + 1].value,
                hidden: false,
                solved: false
            });
        }
        pyramidData.push(newRow);
    }

    // Keer de array om zodat de top bovenaan staat (voor weergave)
    pyramidData.reverse();
}

// Verberg willekeurige cellen, maar zorg dat de puzzel oplosbaar blijft
function hidePyramidCells(hidePercent) {
    const totalCells = pyramidData.reduce((sum, row) => sum + row.length, 0);
    const cellsToHide = Math.floor(totalCells * (hidePercent / 100));

    // Maak een lijst van alle cel-posities
    const allCells = [];
    for (let row = 0; row < pyramidData.length; row++) {
        for (let col = 0; col < pyramidData[row].length; col++) {
            allCells.push({ row, col });
        }
    }

    // Shuffle de lijst
    allCells.sort(() => Math.random() - 0.5);

    // Verberg cellen, maar controleer of de puzzel oplosbaar blijft
    let hidden = 0;
    for (const cell of allCells) {
        if (hidden >= cellsToHide) break;

        // Tijdelijk verbergen
        pyramidData[cell.row][cell.col].hidden = true;

        // Check of de puzzel nog oplosbaar is
        if (isPyramidSolvable()) {
            hidden++;
        } else {
            // Maak weer zichtbaar
            pyramidData[cell.row][cell.col].hidden = false;
        }
    }

    pyramidEmptyCells = hidden;
}

// Check of de piramide oplosbaar is met de huidige zichtbare getallen
function isPyramidSolvable() {
    // Maak een kopie van de data met alleen zichtbare waarden
    const visible = pyramidData.map(row =>
        row.map(cell => cell.hidden ? null : cell.value)
    );

    // Probeer iteratief op te lossen
    let changed = true;
    let iterations = 0;
    const maxIterations = 100;

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        for (let row = 0; row < visible.length; row++) {
            for (let col = 0; col < visible[row].length; col++) {
                if (visible[row][col] !== null) continue;

                // Probeer te berekenen vanuit kinderen (rij eronder)
                if (row < visible.length - 1) {
                    const leftChild = visible[row + 1][col];
                    const rightChild = visible[row + 1][col + 1];

                    if (leftChild !== null && rightChild !== null) {
                        visible[row][col] = leftChild + rightChild;
                        changed = true;
                        continue;
                    }
                }

                // Probeer te berekenen vanuit ouder en sibling
                if (row > 0) {
                    const parent = visible[row - 1][col] ?? visible[row - 1][col - 1];
                    const parentCol = visible[row - 1][col] !== undefined ? col : col - 1;

                    if (parentCol >= 0 && parentCol < visible[row - 1].length) {
                        const parentVal = visible[row - 1][parentCol];

                        if (parentVal !== null) {
                            // Bepaal welke sibling we zijn (links of rechts)
                            const isLeftChild = (parentCol === col);
                            const siblingCol = isLeftChild ? col + 1 : col - 1;

                            if (siblingCol >= 0 && siblingCol < visible[row].length) {
                                const siblingVal = visible[row][siblingCol];

                                if (siblingVal !== null) {
                                    visible[row][col] = parentVal - siblingVal;
                                    changed = true;
                                    continue;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Check of alle cellen ingevuld zijn
    return visible.every(row => row.every(cell => cell !== null));
}

// Render de piramide
function renderPyramid() {
    const container = document.getElementById('pyramid-container');
    container.innerHTML = '';

    pyramidData.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'pyramid-row';

        row.forEach((cell, colIndex) => {
            const cellDiv = document.createElement('div');
            cellDiv.className = 'pyramid-cell';
            cellDiv.dataset.row = rowIndex;
            cellDiv.dataset.col = colIndex;

            if (cell.hidden && !cell.solved) {
                cellDiv.classList.add('empty');
                cellDiv.textContent = '?';
                cellDiv.addEventListener('click', () => openPyramidInput(rowIndex, colIndex));
            } else {
                cellDiv.classList.add('filled');
                if (cell.solved) {
                    cellDiv.classList.add('correct');
                }
                cellDiv.textContent = cell.value;
            }

            rowDiv.appendChild(cellDiv);
        });

        container.appendChild(rowDiv);
    });
}

// Open input popup voor piramide cel
function openPyramidInput(row, col) {
    currentInputCell = { type: 'pyramid', row, col };
    inputValue = '';
    updateInputDisplay();
    document.getElementById('number-input-popup').classList.remove('hidden');
}

// Bevestig input voor piramide
function confirmPyramidInput() {
    if (inputValue === '' || !currentInputCell || currentInputCell.type !== 'pyramid') return;

    const { row, col } = currentInputCell;
    const userAnswer = parseInt(inputValue);
    const correctAnswer = pyramidData[row][col].value;
    const cellElement = document.querySelector(`.pyramid-cell[data-row="${row}"][data-col="${col}"]`);

    if (userAnswer === correctAnswer) {
        // Goed!
        pyramidData[row][col].solved = true;
        cellElement.classList.remove('empty');
        cellElement.classList.add('filled', 'correct');
        cellElement.textContent = correctAnswer;

        // Verwijder click handler
        const newCell = cellElement.cloneNode(true);
        cellElement.parentNode.replaceChild(newCell, cellElement);

        playCorrectSound();
        pyramidEmptyCells--;

        closePopup();

        // Check of alles is opgelost
        if (pyramidEmptyCells === 0) {
            setTimeout(() => {
                stopPyramidTimer();
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

        inputValue = '';
        updateInputDisplay();
    }
}

// Start piramide spel
function startPyramidGame() {
    pyramidLayers = parseInt(document.getElementById('pyramid-layers').value) || 4;
    pyramidMaxBase = parseInt(document.getElementById('pyramid-max-base').value) || 10;
    pyramidHidePercent = parseInt(document.getElementById('pyramid-hide-percent').value) || 50;

    generatePyramid(pyramidLayers, pyramidMaxBase);
    hidePyramidCells(pyramidHidePercent);
    renderPyramid();

    showScreen('game-screen-pyramid');
    startPyramidTimer();
}

// Timer functies voor piramide
function startPyramidTimer() {
    pyramidStartTime = Date.now();
    updatePyramidTimerDisplay();
    pyramidTimerInterval = setInterval(updatePyramidTimerDisplay, 1000);
}

function stopPyramidTimer() {
    if (pyramidTimerInterval) {
        clearInterval(pyramidTimerInterval);
        pyramidTimerInterval = null;
    }
}

function updatePyramidTimerDisplay() {
    const elapsed = Math.floor((Date.now() - pyramidStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('pyramid-timer-display').textContent = `${minutes}:${seconds}`;
}

// Initialisatie piramide slider
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('pyramid-hide-percent');
    if (slider) {
        slider.addEventListener('input', function() {
            document.getElementById('pyramid-hide-percent-display').textContent = this.value + '%';
        });
    }
});
