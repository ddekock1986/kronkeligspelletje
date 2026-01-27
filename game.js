// Gedeelde spellogica

// Globale variabelen
let currentScreen = 'game-selection';
let currentGame = null; // 'snake' of 'pyramid'
let currentInputCell = null;
let inputValue = '';

// ===== REKENSLANG VARIABELEN =====
let snakeData = [];
let arrowData = [];
let selectedOperators = ['+', '-'];
let snakeTimerInterval = null;
let snakeStartTime = null;
let snakeEmptyCells = 0;
let gridWidth = 5;
let gridRows = 4;
let snakeHidePercentage = 0.45;

// Moeilijkheidsgraad presets voor slang
const snakeDifficultyPresets = {
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

// ===== SCHERM NAVIGATIE =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

function selectGame(game) {
    if (game === 'rekenslang') {
        currentGame = 'snake';
        showScreen('settings-screen-snake');
    } else if (game === 'rekenpiramide') {
        currentGame = 'pyramid';
        showScreen('settings-screen-pyramid');
    }
}

function goToSelection() {
    stopSnakeTimer();
    if (typeof stopPyramidTimer === 'function') stopPyramidTimer();
    showScreen('game-selection');
}

function goToSettings(game) {
    if (game === 'snake') {
        stopSnakeTimer();
        showScreen('settings-screen-snake');
    } else if (game === 'pyramid') {
        if (typeof stopPyramidTimer === 'function') stopPyramidTimer();
        showScreen('settings-screen-pyramid');
    }
}

// ===== MOEILIJKHEIDSGRAAD =====
function selectDifficulty(difficulty, game) {
    if (game === 'snake') {
        selectSnakeDifficulty(difficulty);
    } else if (game === 'pyramid') {
        if (typeof selectPyramidDifficulty === 'function') {
            selectPyramidDifficulty(difficulty);
        }
    }
}

function selectSnakeDifficulty(difficulty) {
    const preset = snakeDifficultyPresets[difficulty];

    // Update UI
    document.querySelectorAll('#settings-screen-snake .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`#settings-screen-snake .difficulty-btn[data-difficulty="${difficulty}"]`).classList.add('selected');

    // Vul de velden in
    document.getElementById('snake-start-number').value = preset.startNumber;
    document.getElementById('snake-max-operation').value = preset.maxOperation;
    document.getElementById('snake-grid-width').value = preset.gridWidth;
    document.getElementById('snake-grid-rows').value = preset.gridRows;

    // Update operator knoppen
    document.querySelectorAll('#snake-operators .operator-btn').forEach(btn => {
        const op = btn.dataset.op;
        if (preset.operators.includes(op)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    selectedOperators = [...preset.operators];
    snakeHidePercentage = preset.hidePercentage;
}

// ===== OPERATOR KNOPPEN =====
document.querySelectorAll('#snake-operators .operator-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('selected');
        updateSelectedOperators();
    });
});

function updateSelectedOperators() {
    selectedOperators = [];
    document.querySelectorAll('#snake-operators .operator-btn.selected').forEach(btn => {
        selectedOperators.push(btn.dataset.op);
    });

    if (selectedOperators.length === 0) {
        document.querySelector('#snake-operators .operator-btn[data-op="+"]').classList.add('selected');
        selectedOperators = ['+'];
    }
}

// ===== REKENSLANG LOGICA =====
function generateSnakePath(width, rows) {
    const path = [];
    let direction = 1;

    for (let row = 0; row < rows; row++) {
        if (direction === 1) {
            for (let col = 0; col < width; col++) {
                path.push({ row, col });
            }
        } else {
            for (let col = width - 1; col >= 0; col--) {
                path.push({ row, col });
            }
        }
        direction *= -1;
    }

    return path;
}

function getArrowDirection(from, to) {
    if (to.col > from.col) return 'right';
    if (to.col < from.col) return 'left';
    if (to.row > from.row) return 'down';
    if (to.row < from.row) return 'up';
    return 'right';
}

function generateOperation(currentValue, operators, maxOp, minValue, maxAllowedValue) {
    let op = operators[Math.floor(Math.random() * operators.length)];
    let operand, nextValue;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        attempts++;

        if (attempts > 10 && attempts % 10 === 0) {
            op = operators[Math.floor(Math.random() * operators.length)];
        }

        switch (op) {
            case '+':
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
                const maxSub = Math.min(maxOp, currentValue - minValue);
                if (maxSub < 1) {
                    operand = Math.floor(Math.random() * Math.min(maxOp, maxAllowedValue - currentValue)) + 1;
                    nextValue = currentValue + operand;
                    op = '+';
                } else {
                    operand = Math.floor(Math.random() * maxSub) + 1;
                    nextValue = currentValue - operand;
                }
                break;

            case '*':
                const validMultipliers = [2, 3, 4, 5, 6, 7, 8, 9, 10].filter(m =>
                    m <= maxOp && currentValue * m <= maxAllowedValue
                );
                if (validMultipliers.length > 0) {
                    operand = validMultipliers[Math.floor(Math.random() * validMultipliers.length)];
                    nextValue = currentValue * operand;
                } else {
                    operand = Math.floor(Math.random() * Math.min(maxOp, maxAllowedValue - currentValue)) + 1;
                    nextValue = currentValue + operand;
                    op = '+';
                }
                break;

            case '/':
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
                    operand = Math.floor(Math.random() * Math.min(maxOp, maxAllowedValue - currentValue)) + 1;
                    nextValue = currentValue + operand;
                    op = '+';
                }
                break;
        }
    } while ((nextValue < minValue || nextValue > maxAllowedValue || !Number.isInteger(nextValue)) && attempts < maxAttempts);

    if (nextValue < minValue || nextValue > maxAllowedValue || !Number.isInteger(nextValue)) {
        return { op: '+', operand: 1, nextValue: Math.min(currentValue + 1, maxAllowedValue) };
    }

    return { op, operand, nextValue };
}

function generateSnake(startNumber, maxOp, width, rows, operators) {
    const path = generateSnakePath(width, rows);
    snakeData = [];
    arrowData = [];

    const minValue = 1;
    const maxAllowedValue = maxOp * 5;

    let currentValue = Math.max(startNumber, minValue);

    snakeData.push({
        value: currentValue,
        hidden: false,
        solved: false,
        row: path[0].row,
        col: path[0].col,
        pathIndex: 0
    });

    for (let i = 1; i < path.length; i++) {
        const { op, operand, nextValue } = generateOperation(currentValue, operators, maxOp, minValue, maxAllowedValue);

        arrowData.push({
            operation: op,
            operand: operand,
            fromRow: path[i - 1].row,
            fromCol: path[i - 1].col,
            toRow: path[i].row,
            toCol: path[i].col,
            direction: getArrowDirection(path[i - 1], path[i])
        });

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

    const indicesToHide = [];
    for (let i = 1; i < snakeData.length; i++) {
        indicesToHide.push(i);
    }

    indicesToHide.sort(() => Math.random() - 0.5);
    const numToHide = Math.floor(snakeData.length * snakeHidePercentage);

    for (let i = 0; i < numToHide && i < indicesToHide.length; i++) {
        snakeData[indicesToHide[i]].hidden = true;
    }
}

function formatOperator(op) {
    switch (op) {
        case '*': return '×';
        case '/': return '÷';
        case '-': return '−';
        default: return op;
    }
}

function renderSnake() {
    const grid = document.getElementById('snake-grid');
    grid.innerHTML = '';

    const gridCols = gridWidth * 2 - 1;
    const gridRowCount = gridRows * 2 - 1;

    grid.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    grid.style.gridTemplateRows = `repeat(${gridRowCount}, auto)`;

    const gridMap = [];
    for (let r = 0; r < gridRowCount; r++) {
        gridMap[r] = [];
        for (let c = 0; c < gridCols; c++) {
            gridMap[r][c] = null;
        }
    }

    snakeData.forEach((cell, idx) => {
        const gridRow = cell.row * 2;
        const gridCol = cell.col * 2;
        gridMap[gridRow][gridCol] = { type: 'number', data: cell, index: idx };
    });

    arrowData.forEach((arrow, idx) => {
        if (arrow.direction === 'right' || arrow.direction === 'left') {
            const gridRow = arrow.fromRow * 2;
            const gridCol = Math.min(arrow.fromCol, arrow.toCol) * 2 + 1;
            gridMap[gridRow][gridCol] = { type: 'arrow', data: arrow, direction: arrow.direction };
        } else {
            const gridRow = Math.min(arrow.fromRow, arrow.toRow) * 2 + 1;
            const gridCol = arrow.fromCol * 2;
            gridMap[gridRow][gridCol] = { type: 'arrow', data: arrow, direction: arrow.direction };
        }
    });

    snakeEmptyCells = 0;

    for (let r = 0; r < gridRowCount; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cellData = gridMap[r][c];

            if (!cellData) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-cell';
                grid.appendChild(emptyDiv);
            } else if (cellData.type === 'number') {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';

                const numberBox = document.createElement('div');
                numberBox.className = 'number-box';
                numberBox.dataset.index = cellData.index;

                if (cellData.data.hidden && !cellData.data.solved) {
                    numberBox.classList.add('empty');
                    numberBox.textContent = '?';
                    numberBox.addEventListener('click', () => openSnakeInput(cellData.index));
                    snakeEmptyCells++;
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

function startSnakeGame() {
    const startNumber = parseInt(document.getElementById('snake-start-number').value) || 1;
    const maxOp = parseInt(document.getElementById('snake-max-operation').value) || 10;
    gridWidth = parseInt(document.getElementById('snake-grid-width').value) || 5;
    gridRows = parseInt(document.getElementById('snake-grid-rows').value) || 4;

    if (selectedOperators.length === 0) {
        selectedOperators = ['+'];
    }

    generateSnake(startNumber, maxOp, gridWidth, gridRows, selectedOperators);
    renderSnake();
    showScreen('game-screen-snake');
    startSnakeTimer();
}

// ===== SNAKE TIMER =====
function startSnakeTimer() {
    snakeStartTime = Date.now();
    updateSnakeTimerDisplay();
    snakeTimerInterval = setInterval(updateSnakeTimerDisplay, 1000);
}

function stopSnakeTimer() {
    if (snakeTimerInterval) {
        clearInterval(snakeTimerInterval);
        snakeTimerInterval = null;
    }
}

function updateSnakeTimerDisplay() {
    const elapsed = Math.floor((Date.now() - snakeStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('snake-timer-display').textContent = `${minutes}:${seconds}`;
}

// ===== INPUT POPUP (GEDEELD) =====
function openSnakeInput(cellIndex) {
    currentInputCell = { type: 'snake', index: cellIndex };
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
    if (!currentInputCell) return;

    if (currentInputCell.type === 'snake') {
        confirmSnakeInput();
    } else if (currentInputCell.type === 'pyramid') {
        if (typeof confirmPyramidInput === 'function') {
            confirmPyramidInput();
        }
    }
}

function confirmSnakeInput() {
    if (inputValue === '' || !currentInputCell || currentInputCell.type !== 'snake') return;

    const cellIndex = currentInputCell.index;
    const userAnswer = parseInt(inputValue);
    const correctAnswer = snakeData[cellIndex].value;
    const cellElement = document.querySelector(`.number-box[data-index="${cellIndex}"]`);

    if (userAnswer === correctAnswer) {
        snakeData[cellIndex].solved = true;
        cellElement.classList.remove('empty');
        cellElement.classList.add('correct');
        cellElement.textContent = correctAnswer;

        const newCell = cellElement.cloneNode(true);
        cellElement.parentNode.replaceChild(newCell, cellElement);

        playCorrectSound();
        snakeEmptyCells--;

        closePopup();

        if (snakeEmptyCells === 0) {
            setTimeout(() => {
                stopSnakeTimer();
                playVictorySound();
                startFireworks();
            }, 500);
        }
    } else {
        cellElement.classList.add('wrong');
        playWrongSound();

        setTimeout(() => {
            cellElement.classList.remove('wrong');
        }, 1000);

        inputValue = '';
        updateInputDisplay();
    }
}

// ===== INITIALISATIE =====
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('touchstart', initAudio, { once: true });
    document.body.addEventListener('click', initAudio, { once: true });

    // Zet standaard moeilijkheidsgraad voor slang
    selectSnakeDifficulty('normaal');

    // Zet standaard moeilijkheidsgraad voor piramide (als die geladen is)
    setTimeout(() => {
        if (typeof selectPyramidDifficulty === 'function') {
            selectPyramidDifficulty('normaal');
        }
    }, 100);
});
