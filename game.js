// Gedeelde spellogica
// Refactored met gecentraliseerde state, input validatie en timer module

// ===== GECENTRALISEERDE GAME STATE =====
const GameState = {
    currentScreen: 'game-selection',
    currentGame: null,
    currentInputCell: null,
    inputValue: '',
    snake: {
        data: [],
        arrows: [],
        selectedOperators: ['+', '-'],
        emptyCells: 0,
        gridWidth: 5,
        gridRows: 4,
        hidePercentage: 0.45
    }
};

// Globale variabelen (backward compatible)
let currentScreen = 'game-selection';
let currentGame = null;
let currentInputCell = null;
let inputValue = '';

// Snake variabelen
let snakeData = [];
let arrowData = [];
let selectedOperators = ['+', '-'];
let snakeTimerInterval = null;
let snakeStartTime = null;
let snakeEmptyCells = 0;
let gridWidth = 5;
let gridRows = 4;
let snakeHidePercentage = 0.45;

// Moeilijkheidsgraad presets voor slang (fallback als config.js niet geladen)
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
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    currentScreen = screenId;
    GameState.currentScreen = screenId;
}

function selectGame(game) {
    if (game === 'rekenslang') {
        currentGame = 'snake';
        GameState.currentGame = 'snake';
        showScreen('settings-screen-snake');
    } else if (game === 'rekenpiramide') {
        currentGame = 'pyramid';
        GameState.currentGame = 'pyramid';
        showScreen('settings-screen-pyramid');
    } else if (game === 'sudoku') {
        currentGame = 'sudoku';
        GameState.currentGame = 'sudoku';
        showScreen('settings-screen-sudoku');
    } else if (game === 'binary') {
        currentGame = 'binary';
        GameState.currentGame = 'binary';
        showScreen('settings-screen-binary');
    } else if (game === 'wisselgeld') {
        currentGame = 'change';
        GameState.currentGame = 'change';
        showScreen('settings-screen-change');
    } else if (game === 'klokkijken') {
        currentGame = 'clock';
        GameState.currentGame = 'clock';
        showScreen('settings-screen-clock');
    } else if (game === 'tamagotchi') {
        currentGame = 'tamagotchi';
        GameState.currentGame = 'tamagotchi';
        showScreen('settings-screen-tamagotchi');
    }
}

function goToSelection() {
    // Stop alle timers via TimerManager of legacy
    if (typeof TimerManager !== 'undefined') {
        TimerManager.stopAll();
    } else {
        stopSnakeTimer();
        if (typeof stopPyramidTimer === 'function') stopPyramidTimer();
        if (typeof stopSudokuTimer === 'function') stopSudokuTimer();
        if (typeof stopBinaryTimer === 'function') stopBinaryTimer();
        if (typeof stopChangeTimer === 'function') stopChangeTimer();
        if (typeof stopClockTimer === 'function') stopClockTimer();
    }
    // Stop tamagotchi game loop
    if (typeof stopTamagotchiTimer === 'function') stopTamagotchiTimer();
    showScreen('game-selection');
}

function goToSettings(game) {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.stop(game);
    }

    if (game === 'snake') {
        stopSnakeTimer();
        showScreen('settings-screen-snake');
    } else if (game === 'pyramid') {
        if (typeof stopPyramidTimer === 'function') stopPyramidTimer();
        showScreen('settings-screen-pyramid');
    } else if (game === 'sudoku') {
        if (typeof stopSudokuTimer === 'function') stopSudokuTimer();
        showScreen('settings-screen-sudoku');
    } else if (game === 'binary') {
        if (typeof stopBinaryTimer === 'function') stopBinaryTimer();
        showScreen('settings-screen-binary');
    } else if (game === 'change') {
        if (typeof stopChangeTimer === 'function') stopChangeTimer();
        showScreen('settings-screen-change');
    } else if (game === 'clock') {
        if (typeof stopClockTimer === 'function') stopClockTimer();
        showScreen('settings-screen-clock');
    } else if (game === 'tamagotchi') {
        if (typeof stopTamagotchiTimer === 'function') stopTamagotchiTimer();
        showScreen('settings-screen-tamagotchi');
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
    } else if (game === 'sudoku') {
        if (typeof selectSudokuDifficulty === 'function') {
            selectSudokuDifficulty(difficulty);
        }
    } else if (game === 'binary') {
        if (typeof selectBinaryDifficulty === 'function') {
            selectBinaryDifficulty(difficulty);
        }
    }

    // Update aria-pressed attributen
    updateDifficultyAriaState(game, difficulty);
}

function updateDifficultyAriaState(game, selectedDifficulty) {
    const screenId = `settings-screen-${game}`;
    const buttons = document.querySelectorAll(`#${screenId} .difficulty-btn`);
    buttons.forEach(btn => {
        const isSelected = btn.dataset.difficulty === selectedDifficulty;
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
}

function selectSnakeDifficulty(difficulty) {
    // Gebruik GameConfig als beschikbaar, anders fallback
    const preset = (typeof GameConfig !== 'undefined' && GameConfig.snake)
        ? GameConfig.snake.difficulties[difficulty]
        : snakeDifficultyPresets[difficulty];

    if (!preset) return;

    // Update UI
    document.querySelectorAll('#settings-screen-snake .difficulty-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    const selectedBtn = document.querySelector(`#settings-screen-snake .difficulty-btn[data-difficulty="${difficulty}"]`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }

    // Vul de velden in
    document.getElementById('snake-start-number').value = preset.startNumber;
    document.getElementById('snake-max-operation').value = preset.maxOperation;
    document.getElementById('snake-grid-width').value = preset.gridWidth;
    document.getElementById('snake-grid-rows').value = preset.gridRows;

    // Update operator knoppen met aria-pressed
    document.querySelectorAll('#snake-operators .operator-btn').forEach(btn => {
        const op = btn.dataset.op;
        const isSelected = preset.operators.includes(op);
        if (isSelected) {
            btn.classList.add('selected');
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.classList.remove('selected');
            btn.setAttribute('aria-pressed', 'false');
        }
    });

    selectedOperators = [...preset.operators];
    GameState.snake.selectedOperators = [...preset.operators];
    snakeHidePercentage = preset.hidePercentage;
    GameState.snake.hidePercentage = preset.hidePercentage;
}

// ===== OPERATOR KNOPPEN =====
document.querySelectorAll('#snake-operators .operator-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('selected');
        const isSelected = this.classList.contains('selected');
        this.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        updateSelectedOperators();
    });
});

function updateSelectedOperators() {
    selectedOperators = [];
    document.querySelectorAll('#snake-operators .operator-btn.selected').forEach(btn => {
        selectedOperators.push(btn.dataset.op);
    });

    if (selectedOperators.length === 0) {
        const plusBtn = document.querySelector('#snake-operators .operator-btn[data-op="+"]');
        if (plusBtn) {
            plusBtn.classList.add('selected');
            plusBtn.setAttribute('aria-pressed', 'true');
        }
        selectedOperators = ['+'];
    }

    GameState.snake.selectedOperators = [...selectedOperators];
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

    // Bepaal beschikbare ruimte voor operaties
    const roomToGrow = maxAllowedValue - currentValue;
    const roomToShrink = currentValue - minValue;

    do {
        attempts++;

        // Wissel van operator als we vastzitten
        if (attempts > 10 && attempts % 10 === 0) {
            op = operators[Math.floor(Math.random() * operators.length)];
        }

        // Als we aan de max zitten, forceer een aftrek operatie
        if (roomToGrow <= 0 && (op === '+' || op === '*')) {
            if (operators.includes('-') && roomToShrink >= 1) {
                op = '-';
            } else if (operators.includes('/') && currentValue >= 2) {
                op = '/';
            }
        }

        // Als we aan de min zitten, forceer een optelling
        if (roomToShrink <= 0 && (op === '-' || op === '/')) {
            if (operators.includes('+') && roomToGrow >= 1) {
                op = '+';
            } else if (operators.includes('*') && currentValue * 2 <= maxAllowedValue) {
                op = '*';
            }
        }

        switch (op) {
            case '+':
                const maxAdd = Math.min(maxOp, roomToGrow);
                if (maxAdd < 1) {
                    // Kan niet optellen, probeer aftrekken
                    if (roomToShrink >= 1) {
                        op = '-';
                        operand = Math.floor(Math.random() * Math.min(maxOp, roomToShrink)) + 1;
                        nextValue = currentValue - operand;
                    } else {
                        // Zit vast aan max, blijf op huidige waarde (wordt later afgehandeld)
                        operand = 0;
                        nextValue = currentValue;
                    }
                } else {
                    operand = Math.floor(Math.random() * maxAdd) + 1;
                    nextValue = currentValue + operand;
                }
                break;

            case '-':
                const maxSub = Math.min(maxOp, roomToShrink);
                if (maxSub < 1) {
                    // Kan niet aftrekken, probeer optellen
                    if (roomToGrow >= 1) {
                        op = '+';
                        operand = Math.floor(Math.random() * Math.min(maxOp, roomToGrow)) + 1;
                        nextValue = currentValue + operand;
                    } else {
                        operand = 0;
                        nextValue = currentValue;
                    }
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
                    // Kan niet vermenigvuldigen, probeer iets anders
                    if (roomToGrow >= 1) {
                        op = '+';
                        operand = Math.floor(Math.random() * Math.min(maxOp, roomToGrow)) + 1;
                        nextValue = currentValue + operand;
                    } else if (roomToShrink >= 1) {
                        op = '-';
                        operand = Math.floor(Math.random() * Math.min(maxOp, roomToShrink)) + 1;
                        nextValue = currentValue - operand;
                    } else {
                        operand = 0;
                        nextValue = currentValue;
                    }
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
                    // Kan niet delen, probeer iets anders
                    if (roomToShrink >= 1) {
                        op = '-';
                        operand = Math.floor(Math.random() * Math.min(maxOp, roomToShrink)) + 1;
                        nextValue = currentValue - operand;
                    } else if (roomToGrow >= 1) {
                        op = '+';
                        operand = Math.floor(Math.random() * Math.min(maxOp, roomToGrow)) + 1;
                        nextValue = currentValue + operand;
                    } else {
                        operand = 0;
                        nextValue = currentValue;
                    }
                }
                break;
        }
    } while ((nextValue < minValue || nextValue > maxAllowedValue || !Number.isInteger(nextValue) || operand === 0) && attempts < maxAttempts);

    // Fallback: zorg dat operand en nextValue ALTIJD correct zijn t.o.v. elkaar
    if (nextValue < minValue || nextValue > maxAllowedValue || !Number.isInteger(nextValue) || operand === 0) {
        // Probeer eerst aftrekken als we hoog zitten
        if (currentValue > minValue + 1) {
            const safeOperand = Math.min(maxOp, Math.floor((currentValue - minValue) / 2));
            if (safeOperand >= 1) {
                return { op: '-', operand: safeOperand, nextValue: currentValue - safeOperand };
            }
        }
        // Anders optellen als er ruimte is
        if (currentValue < maxAllowedValue - 1) {
            const safeOperand = Math.min(maxOp, Math.floor((maxAllowedValue - currentValue) / 2));
            if (safeOperand >= 1) {
                return { op: '+', operand: safeOperand, nextValue: currentValue + safeOperand };
            }
        }
        // Laatste redmiddel: kleine stap in beschikbare richting
        if (roomToShrink >= 1) {
            return { op: '-', operand: 1, nextValue: currentValue - 1 };
        }
        if (roomToGrow >= 1) {
            return { op: '+', operand: 1, nextValue: currentValue + 1 };
        }
        // Absoluut geen beweging mogelijk (zou niet moeten gebeuren)
        return { op: '+', operand: 0, nextValue: currentValue };
    }

    return { op, operand, nextValue };
}

function generateSnake(startNumber, maxOp, width, rows, operators) {
    const path = generateSnakePath(width, rows);
    snakeData = [];
    arrowData = [];
    GameState.snake.data = [];
    GameState.snake.arrows = [];

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

    GameState.snake.data = [...snakeData];
    GameState.snake.arrows = [...arrowData];
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
    if (!grid) return;

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
    GameState.snake.emptyCells = 0;

    // DocumentFragment voor betere performance
    const fragment = document.createDocumentFragment();

    for (let r = 0; r < gridRowCount; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cellData = gridMap[r][c];

            if (!cellData) {
                const emptyDiv = document.createElement('div');
                emptyDiv.className = 'empty-cell';
                emptyDiv.setAttribute('aria-hidden', 'true');
                fragment.appendChild(emptyDiv);
            } else if (cellData.type === 'number') {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';
                cellDiv.setAttribute('role', 'gridcell');

                const numberBox = document.createElement('div');
                numberBox.className = 'number-box';
                numberBox.dataset.index = cellData.index;
                numberBox.dataset.row = cellData.data.row;
                numberBox.dataset.col = cellData.data.col;

                if (cellData.data.hidden && !cellData.data.solved) {
                    numberBox.classList.add('empty');
                    numberBox.textContent = '?';
                    numberBox.setAttribute('role', 'button');
                    numberBox.setAttribute('aria-label', `Leeg veld rij ${cellData.data.row + 1}, kolom ${cellData.data.col + 1}`);
                    numberBox.setAttribute('tabindex', '0');
                    numberBox.addEventListener('click', () => openSnakeInput(cellData.index));
                    numberBox.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openSnakeInput(cellData.index);
                        }
                    });
                    snakeEmptyCells++;
                    GameState.snake.emptyCells++;
                } else {
                    numberBox.classList.add('filled');
                    if (cellData.data.solved) {
                        numberBox.classList.add('correct');
                    }
                    numberBox.textContent = cellData.data.value;
                    numberBox.setAttribute('aria-label', `Getal ${cellData.data.value}`);
                }

                cellDiv.appendChild(numberBox);
                fragment.appendChild(cellDiv);
            } else if (cellData.type === 'arrow') {
                const arrowDiv = document.createElement('div');
                const isHorizontal = cellData.direction === 'right' || cellData.direction === 'left';

                arrowDiv.className = 'arrow-cell ' + (isHorizontal ? 'horizontal' : 'vertical');
                arrowDiv.setAttribute('aria-hidden', 'true');

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

                fragment.appendChild(arrowDiv);
            }
        }
    }

    grid.appendChild(fragment);
}

function startSnakeGame() {
    // Lees input waarden
    const rawStartNumber = document.getElementById('snake-start-number').value;
    const rawMaxOp = document.getElementById('snake-max-operation').value;
    const rawGridWidth = document.getElementById('snake-grid-width').value;
    const rawGridRows = document.getElementById('snake-grid-rows').value;

    // Valideer input
    let startNumber, maxOp;

    if (typeof InputValidator !== 'undefined') {
        const validated = InputValidator.validateSnakeSettings({
            startNumber: rawStartNumber,
            maxOperation: rawMaxOp,
            gridWidth: rawGridWidth,
            gridRows: rawGridRows,
            operators: selectedOperators,
            hidePercentage: snakeHidePercentage
        });
        startNumber = validated.startNumber;
        maxOp = validated.maxOperation;
        gridWidth = validated.gridWidth;
        gridRows = validated.gridRows;
    } else {
        // Fallback validatie
        startNumber = Math.max(1, Math.min(100, parseInt(rawStartNumber) || 10));
        maxOp = Math.max(1, Math.min(50, parseInt(rawMaxOp) || 10));
        gridWidth = Math.max(3, Math.min(8, parseInt(rawGridWidth) || 5));
        gridRows = Math.max(2, Math.min(8, parseInt(rawGridRows) || 4));
    }

    GameState.snake.gridWidth = gridWidth;
    GameState.snake.gridRows = gridRows;

    if (selectedOperators.length === 0) {
        selectedOperators = ['+'];
    }

    generateSnake(startNumber, maxOp, gridWidth, gridRows, selectedOperators);
    renderSnake();
    showScreen('game-screen-snake');

    // Start timer
    if (typeof TimerManager !== 'undefined') {
        TimerManager.start('snake');
    } else {
        startSnakeTimer();
    }
}

// ===== SNAKE TIMER =====
function startSnakeTimer() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.start('snake');
        return;
    }
    snakeStartTime = Date.now();
    updateSnakeTimerDisplay();
    snakeTimerInterval = setInterval(updateSnakeTimerDisplay, 1000);
}

function stopSnakeTimer() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.stop('snake');
    }
    if (snakeTimerInterval) {
        clearInterval(snakeTimerInterval);
        snakeTimerInterval = null;
    }
}

function updateSnakeTimerDisplay() {
    const elapsed = Math.floor((Date.now() - snakeStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    const display = document.getElementById('snake-timer-display');
    if (display) {
        display.textContent = `${minutes}:${seconds}`;
    }
}

// ===== INPUT POPUP =====
function openSnakeInput(cellIndex) {
    currentInputCell = { type: 'snake', index: cellIndex };
    GameState.currentInputCell = currentInputCell;
    inputValue = '';
    GameState.inputValue = '';
    updateInputDisplay();
    document.getElementById('number-input-popup').classList.remove('hidden');

    // Focus eerste knop voor toegankelijkheid
    setTimeout(() => {
        const firstBtn = document.querySelector('#number-pad .num-btn');
        if (firstBtn) firstBtn.focus();
    }, 100);
}

function closePopup() {
    document.getElementById('number-input-popup').classList.add('hidden');
    currentInputCell = null;
    GameState.currentInputCell = null;
    inputValue = '';
    GameState.inputValue = '';
}

function inputNumber(num) {
    if (inputValue.length < 5) {
        inputValue += num.toString();
        GameState.inputValue = inputValue;
        updateInputDisplay();
    }
}

function clearInput() {
    inputValue = inputValue.slice(0, -1);
    GameState.inputValue = inputValue;
    updateInputDisplay();
}

function updateInputDisplay() {
    const display = document.getElementById('input-display');
    if (display) {
        display.textContent = inputValue || '_';
    }
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

    if (!cellElement) return;

    if (userAnswer === correctAnswer) {
        snakeData[cellIndex].solved = true;
        if (GameState.snake.data[cellIndex]) {
            GameState.snake.data[cellIndex].solved = true;
        }

        // Gebruik VictoryHandler als beschikbaar
        if (typeof VictoryHandler !== 'undefined') {
            VictoryHandler.handleCorrectAnswer(cellElement, correctAnswer, () => {
                snakeEmptyCells--;
                GameState.snake.emptyCells--;
                closePopup();
                VictoryHandler.checkAndHandleVictory(snakeEmptyCells, 'snake');
            });
        } else {
            cellElement.classList.remove('empty');
            cellElement.classList.add('correct');
            cellElement.textContent = correctAnswer;

            const newCell = cellElement.cloneNode(true);
            cellElement.parentNode.replaceChild(newCell, cellElement);

            if (typeof playCorrectSound === 'function') playCorrectSound();
            snakeEmptyCells--;
            GameState.snake.emptyCells--;

            closePopup();

            if (snakeEmptyCells === 0) {
                setTimeout(() => {
                    stopSnakeTimer();
                    if (typeof playVictorySound === 'function') playVictorySound();
                    if (typeof startFireworks === 'function') startFireworks();
                }, 500);
            }
        }
    } else {
        if (typeof VictoryHandler !== 'undefined') {
            VictoryHandler.handleWrongAnswer(cellElement, () => {
                inputValue = '';
                GameState.inputValue = '';
                updateInputDisplay();
            });
        } else {
            cellElement.classList.add('wrong');
            if (typeof playWrongSound === 'function') playWrongSound();

            setTimeout(() => {
                cellElement.classList.remove('wrong');
            }, 1000);

            inputValue = '';
            GameState.inputValue = '';
            updateInputDisplay();
        }
    }
}

// ===== INPUT VALIDATIE =====
function addInputValidation() {
    const inputConfigs = [
        { id: 'snake-start-number', min: 1, max: 100 },
        { id: 'snake-max-operation', min: 1, max: 50 },
        { id: 'snake-grid-width', min: 3, max: 8 },
        { id: 'snake-grid-rows', min: 2, max: 8 },
        { id: 'pyramid-layers', min: 3, max: 7 },
        { id: 'pyramid-max-base', min: 1, max: 20 }
    ];

    inputConfigs.forEach(config => {
        const input = document.getElementById(config.id);
        if (input) {
            input.addEventListener('change', function() {
                let value = parseInt(this.value);
                if (isNaN(value) || value < config.min) {
                    this.value = config.min;
                } else if (value > config.max) {
                    this.value = config.max;
                }
            });

            input.addEventListener('keydown', function(e) {
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                if (!allowedKeys.includes(e.key) && (e.key < '0' || e.key > '9')) {
                    e.preventDefault();
                }
            });
        }
    });

    // Pyramid slider ARIA update
    const pyramidSlider = document.getElementById('pyramid-hide-percent');
    if (pyramidSlider) {
        pyramidSlider.addEventListener('input', function() {
            this.setAttribute('aria-valuenow', this.value);
            this.setAttribute('aria-valuetext', this.value + ' procent');
        });
    }
}

// ===== INITIALISATIE =====
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('touchstart', initAudio, { once: true });
    document.body.addEventListener('click', initAudio, { once: true });

    // Standaard moeilijkheidsgraad
    selectSnakeDifficulty('normaal');

    setTimeout(() => {
        if (typeof selectPyramidDifficulty === 'function') {
            selectPyramidDifficulty('normaal');
        }
    }, 100);

    // Input validatie toevoegen
    addInputValidation();
});
