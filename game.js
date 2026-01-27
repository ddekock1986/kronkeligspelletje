// Spellogica voor Rekenslang

// Globale variabelen
let currentScreen = 'game-selection';
let snakeData = []; // Array van {value, hidden, solved, row, col}
let arrowData = []; // Array van {operation, operand, fromRow, fromCol, toRow, toCol, direction}
let selectedOperators = ['+', '-'];
let currentInputCell = null;
let inputValue = '';
let timerInterval = null;
let startTime = null;
let emptyCellsRemaining = 0;
let gridWidth = 5;
let gridRows = 4;
let maxValue = 50; // Maximum waarde (5x hoogste getal)

// Moeilijkheidsgraad presets
const difficultyPresets = {
    makkelijk: {
        startNumber: 5,
        maxOperation: 5,
        gridWidth: 4,
        gridRows: 3,
        operators: ['+', '-'],
        hidePercentage: 0.35
    },
    normaal: {
        startNumber: 10,
        maxOperation: 10,
        gridWidth: 5,
        gridRows: 4,
        operators: ['+', '-', '*'],
        hidePercentage: 0.45
    },
    moeilijk: {
        startNumber: 15,
        maxOperation: 12,
        gridWidth: 6,
        gridRows: 5,
        operators: ['+', '-', '*', '/'],
        hidePercentage: 0.55
    }
};

let currentDifficulty = 'normaal';
let hidePercentage = 0.45;

// Schermen wisselen
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function selectGame(game) {
    if (game === 'rekenslang') {
        showScreen('settings-screen');
    }
}

function goToSelection() {
    stopTimer();
    showScreen('game-selection');
}

function goToSettings() {
    stopTimer();
    showScreen('settings-screen');
}

// Moeilijkheidsgraad selectie
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    const preset = difficultyPresets[difficulty];

    // Update UI
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`.difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('selected');

    // Vul de velden in met de preset waarden
    document.getElementById('start-number').value = preset.startNumber;
    document.getElementById('max-operation').value = preset.maxOperation;
    document.getElementById('grid-width').value = preset.gridWidth;
    document.getElementById('grid-rows').value = preset.gridRows;

    // Update operator knoppen
    document.querySelectorAll('.operator-btn').forEach(btn => {
        const op = btn.dataset.op;
        if (preset.operators.includes(op)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    selectedOperators = [...preset.operators];
    hidePercentage = preset.hidePercentage;
}

// Operator knoppen
document.querySelectorAll('.operator-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('selected');
        updateSelectedOperators();
    });
});

function updateSelectedOperators() {
    selectedOperators = [];
    document.querySelectorAll('.operator-btn.selected').forEach(btn => {
        selectedOperators.push(btn.dataset.op);
    });

    // Zorg dat er minstens één operator geselecteerd is
    if (selectedOperators.length === 0) {
        document.querySelector('.operator-btn[data-op="+"]').classList.add('selected');
        selectedOperators = ['+'];
    }
}

// Genereer een kronkelend pad door de grid
function generateSnakePath(width, rows) {
    const path = [];
    let direction = 1; // 1 = rechts, -1 = links

    for (let row = 0; row < rows; row++) {
        if (direction === 1) {
            // Van links naar rechts
            for (let col = 0; col < width; col++) {
                path.push({ row, col });
            }
        } else {
            // Van rechts naar links
            for (let col = width - 1; col >= 0; col--) {
                path.push({ row, col });
            }
        }
        direction *= -1; // Wissel richting voor volgende rij
    }

    return path;
}

// Bepaal de richting van een pijl tussen twee cellen
function getArrowDirection(from, to) {
    if (to.col > from.col) return 'right';
    if (to.col < from.col) return 'left';
    if (to.row > from.row) return 'down';
    if (to.row < from.row) return 'up';
    return 'right';
}

// Genereer een bewerking die geldig is
// minValue = 1, maxValue = 5 * maxOp (ingesteld bij start)
function generateOperation(currentValue, operators, maxOp, minValue, maxAllowedValue) {
    let op = operators[Math.floor(Math.random() * operators.length)];
    let operand, nextValue;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        attempts++;

        // Als we te veel pogingen doen, probeer een andere operator
        if (attempts > 10 && attempts % 10 === 0) {
            op = operators[Math.floor(Math.random() * operators.length)];
        }

        switch (op) {
            case '+':
                // Zorg dat we niet boven maxAllowedValue komen
                const maxAdd = Math.min(maxOp, maxAllowedValue - currentValue);
                if (maxAdd < 1) {
                    operand = 1;
                    nextValue = currentValue + 1;
                } else {
                    operand = Math.floor(Math.random() * maxAdd) + 1;
                    nextValue = currentValue + operand;
                }
                break;

            case '-':
                // Zorg dat we niet onder minValue (1) komen
                const maxSub = Math.min(maxOp, currentValue - minValue);
                if (maxSub < 1) {
                    // Kan niet aftrekken, doe optelling
                    operand = Math.floor(Math.random() * Math.min(maxOp, maxAllowedValue - currentValue)) + 1;
                    nextValue = currentValue + operand;
                    op = '+';
                } else {
                    operand = Math.floor(Math.random() * maxSub) + 1;
                    nextValue = currentValue - operand;
                }
                break;

            case '*':
                // Zoek vermenigvuldigers die niet boven maxAllowedValue uitkomen
                const validMultipliers = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter(m =>
                    m <= maxOp && currentValue * m <= maxAllowedValue
                );
                if (validMultipliers.length > 0) {
                    operand = validMultipliers[Math.floor(Math.random() * validMultipliers.length)];
                    nextValue = currentValue * operand;
                } else {
                    // Geen geldige vermenigvuldiger, doe optelling
                    operand = Math.floor(Math.random() * Math.min(maxOp, maxAllowedValue - currentValue)) + 1;
                    nextValue = currentValue + operand;
                    op = '+';
                }
                break;

            case '/':
                // Zoek delers die een heel getal >= minValue opleveren
                const divisors = [];
                for (let d = 2; d <= Math.min(maxOp, currentValue); d++) {
                    if (currentValue % d === 0 && currentValue / d >= minValue) {
                        divisors.push(d);
                    }
                }
                if (divisors.length > 0) {
                    operand = divisors[Math.floor(Math.random() * divisors.length)];
                    nextValue = currentValue / operand;
                } else {
                    // Geen geldige deler, doe optelling
                    operand = Math.floor(Math.random() * Math.min(maxOp, maxAllowedValue - currentValue)) + 1;
                    nextValue = currentValue + operand;
                    op = '+';
                }
                break;
        }
    } while ((nextValue < minValue || nextValue > maxAllowedValue || !Number.isInteger(nextValue)) && attempts < maxAttempts);

    // Fallback als niets werkt
    if (nextValue < minValue || nextValue > maxAllowedValue || !Number.isInteger(nextValue)) {
        return { op: '+', operand: 1, nextValue: Math.min(currentValue + 1, maxAllowedValue) };
    }

    return { op, operand, nextValue };
}

// Genereer de rekenslang data
function generateSnake(startNumber, maxOp, width, rows, operators) {
    const path = generateSnakePath(width, rows);
    snakeData = [];
    arrowData = [];

    const minValue = 1; // Nooit onder 1
    const maxAllowedValue = maxOp * 5; // Maximum 5x het hoogste getal in bewerking

    let currentValue = Math.max(startNumber, minValue); // Zorg dat startgetal minstens 1 is

    // Eerste vakje
    snakeData.push({
        value: currentValue,
        hidden: false,
        solved: false,
        row: path[0].row,
        col: path[0].col,
        pathIndex: 0
    });

    // Genereer rest van de slang
    for (let i = 1; i < path.length; i++) {
        const { op, operand, nextValue } = generateOperation(currentValue, operators, maxOp, minValue, maxAllowedValue);

        // Voeg pijl toe
        arrowData.push({
            operation: op,
            operand: operand,
            fromRow: path[i - 1].row,
            fromCol: path[i - 1].col,
            toRow: path[i].row,
            toCol: path[i].col,
            direction: getArrowDirection(path[i - 1], path[i])
        });

        // Voeg getal toe
        snakeData.push({
            value: nextValue,
            hidden: false,
            solved: false,
            row: path[i].row,
            col: path[i].col,
            pathIndex: i
        });

        currentValue = nextValue;
    }

    // Maak sommige getallen verborgen (om in te vullen)
    const indicesToHide = [];
    for (let i = 1; i < snakeData.length; i++) {
        indicesToHide.push(i);
    }

    // Shuffle en selecteer
    indicesToHide.sort(() => Math.random() - 0.5);
    const numToHide = Math.floor(snakeData.length * hidePercentage);

    for (let i = 0; i < numToHide && i < indicesToHide.length; i++) {
        snakeData[indicesToHide[i]].hidden = true;
    }
}

// Format operator voor weergave
function formatOperator(op) {
    switch (op) {
        case '*': return '×';
        case '/': return '÷';
        case '-': return '−';
        default: return op;
    }
}

// Render de rekenslang in de grid
function renderSnake() {
    const grid = document.getElementById('snake-grid');
    grid.innerHTML = '';

    // Grid kolommen: number + arrow + number + arrow + ... + number
    const gridCols = gridWidth * 2 - 1;

    // Grid rijen: voor elke dataRij een number-rij, en daartussen een pijl-rij
    const gridRowCount = gridRows * 2 - 1;

    grid.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    grid.style.gridTemplateRows = `repeat(${gridRowCount}, auto)`;

    // Maak een 2D map van wat er in elke grid-cel komt
    const gridMap = [];
    for (let r = 0; r < gridRowCount; r++) {
        gridMap[r] = [];
        for (let c = 0; c < gridCols; c++) {
            gridMap[r][c] = null;
        }
    }

    // Plaats de getallen
    snakeData.forEach((cell, idx) => {
        const gridRow = cell.row * 2;
        const gridCol = cell.col * 2;
        gridMap[gridRow][gridCol] = { type: 'number', data: cell, index: idx };
    });

    // Plaats de pijlen
    arrowData.forEach((arrow, idx) => {
        if (arrow.direction === 'right' || arrow.direction === 'left') {
            // Horizontale pijl
            const gridRow = arrow.fromRow * 2;
            const gridCol = Math.min(arrow.fromCol, arrow.toCol) * 2 + 1;
            gridMap[gridRow][gridCol] = { type: 'arrow', data: arrow, direction: arrow.direction };
        } else {
            // Verticale pijl
            const gridRow = Math.min(arrow.fromRow, arrow.toRow) * 2 + 1;
            const gridCol = arrow.fromCol * 2;
            gridMap[gridRow][gridCol] = { type: 'arrow', data: arrow, direction: arrow.direction };
        }
    });

    // Render de grid
    emptyCellsRemaining = 0;

    for (let r = 0; r < gridRowCount; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cellData = gridMap[r][c];

            if (!cellData) {
                // Lege cel
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-cell';
                grid.appendChild(emptyDiv);
            } else if (cellData.type === 'number') {
                // Getal vakje
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';

                const numberBox = document.createElement('div');
                numberBox.className = 'number-box';
                numberBox.dataset.index = cellData.index;

                if (cellData.data.hidden && !cellData.data.solved) {
                    numberBox.classList.add('empty');
                    numberBox.textContent = '?';
                    numberBox.addEventListener('click', () => openInputPopup(cellData.index));
                    emptyCellsRemaining++;
                } else {
                    numberBox.classList.add('filled');
                    if (cellData.data.solved) {
                        numberBox.classList.add('correct');
                    }
                    numberBox.textContent = cellData.data.value;
                }

                cellDiv.appendChild(numberBox);
                grid.appendChild(cellDiv);
            } else if (cellData.type === 'arrow') {
                // Pijl cel
                const arrowDiv = document.createElement('div');
                const isHorizontal = cellData.direction === 'right' || cellData.direction === 'left';

                arrowDiv.className = 'arrow-cell ' + (isHorizontal ? 'horizontal' : 'vertical');

                if (cellData.direction === 'left') {
                    arrowDiv.classList.add('left');
                }
                if (cellData.direction === 'up') {
                    arrowDiv.classList.add('up');
                }

                const arrow = document.createElement('div');
                arrow.className = 'arrow';
                arrowDiv.appendChild(arrow);

                const label = document.createElement('div');
                label.className = 'operation-label';
                const opSymbol = formatOperator(cellData.data.operation);
                label.textContent = `${opSymbol}${cellData.data.operand}`;
                arrowDiv.appendChild(label);

                grid.appendChild(arrowDiv);
            }
        }
    }
}

// Start het spel
function startGame() {
    const startNumber = parseInt(document.getElementById('start-number').value) || 1;
    const maxOp = parseInt(document.getElementById('max-operation').value) || 10;
    gridWidth = parseInt(document.getElementById('grid-width').value) || 5;
    gridRows = parseInt(document.getElementById('grid-rows').value) || 4;

    if (selectedOperators.length === 0) {
        selectedOperators = ['+'];
    }

    generateSnake(startNumber, maxOp, gridWidth, gridRows, selectedOperators);
    renderSnake();
    showScreen('game-screen');
    startTimer();
}

// Timer functies
function startTimer() {
    startTime = Date.now();
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${minutes}:${seconds}`;
}

// Popup functies
function openInputPopup(cellIndex) {
    currentInputCell = cellIndex;
    inputValue = '';
    updateInputDisplay();
    document.getElementById('number-input-popup').classList.remove('hidden');
}

function closePopup() {
    document.getElementById('number-input-popup').classList.add('hidden');
    currentInputCell = null;
    inputValue = '';
}

function inputNumber(num) {
    if (inputValue.length < 5) {
        inputValue += num.toString();
        updateInputDisplay();
    }
}

function clearInput() {
    inputValue = inputValue.slice(0, -1);
    updateInputDisplay();
}

function updateInputDisplay() {
    document.getElementById('input-display').textContent = inputValue || '_';
}

function confirmInput() {
    if (inputValue === '' || currentInputCell === null) return;

    const userAnswer = parseInt(inputValue);
    const correctAnswer = snakeData[currentInputCell].value;
    const cellElement = document.querySelector(`.number-box[data-index="${currentInputCell}"]`);

    if (userAnswer === correctAnswer) {
        // Goed!
        snakeData[currentInputCell].solved = true;
        cellElement.classList.remove('empty');
        cellElement.classList.add('correct');
        cellElement.textContent = correctAnswer;

        // Verwijder click handler
        const newCell = cellElement.cloneNode(true);
        cellElement.parentNode.replaceChild(newCell, cellElement);

        playCorrectSound();
        emptyCellsRemaining--;

        closePopup();

        // Check of alles is opgelost
        if (emptyCellsRemaining === 0) {
            setTimeout(() => {
                stopTimer();
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

        // Reset input maar sluit popup niet
        inputValue = '';
        updateInputDisplay();
    }
}

// Initialisatie
document.addEventListener('DOMContentLoaded', () => {
    // Zorg dat audio werkt op mobiel
    document.body.addEventListener('touchstart', initAudio, { once: true });
    document.body.addEventListener('click', initAudio, { once: true });

    // Zet standaard moeilijkheidsgraad
    selectDifficulty('normaal');
});
