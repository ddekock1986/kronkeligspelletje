// Toetsenbordnavigatie Module
// Voegt volledige toetsenbordondersteuning toe aan alle spellen

const KeyboardNavigation = {
    // Huidige focus state
    focusedCellIndex: -1,
    focusableCells: [],
    currentGame: null,

    /**
     * Initialiseer toetsenbordnavigatie
     */
    init() {
        // Globale toetsenbord event listener
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        // Initialiseer focus trapping voor popups
        this.initPopupFocusTrapping();
    },

    /**
     * Handle globale toetsenbord events
     * @param {KeyboardEvent} e
     */
    handleGlobalKeydown(e) {
        // Escape sluit popups
        if (e.key === 'Escape') {
            this.closeActivePopup();
            return;
        }

        // Cijfertoetsen in nummer popup
        if (!document.getElementById('number-input-popup').classList.contains('hidden')) {
            this.handleNumberPopupKeys(e);
            return;
        }

        // Navigatie in actief spel
        if (this.currentGame) {
            this.handleGameNavigation(e);
        }
    },

    /**
     * Handle toetsen in nummer popup
     * @param {KeyboardEvent} e
     */
    handleNumberPopupKeys(e) {
        // Cijfers 0-9
        if (e.key >= '0' && e.key <= '9') {
            e.preventDefault();
            inputNumber(parseInt(e.key));
            return;
        }

        // Backspace = wissen
        if (e.key === 'Backspace') {
            e.preventDefault();
            clearInput();
            return;
        }

        // Enter = bevestigen
        if (e.key === 'Enter') {
            e.preventDefault();
            confirmInput();
            return;
        }
    },

    /**
     * Handle navigatie in spel grid
     * @param {KeyboardEvent} e
     */
    handleGameNavigation(e) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

        if (arrowKeys.includes(e.key)) {
            e.preventDefault();
            this.navigateGrid(e.key);
            return;
        }

        // Enter of spatie = selecteer cel
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.activateFocusedCell();
            return;
        }

        // Tab navigatie binnen grid
        if (e.key === 'Tab') {
            this.handleTabNavigation(e);
        }
    },

    /**
     * Navigeer door het grid met pijltjestoetsen
     * @param {string} direction
     */
    navigateGrid(direction) {
        this.updateFocusableCells();

        if (this.focusableCells.length === 0) return;

        if (this.focusedCellIndex === -1) {
            this.focusedCellIndex = 0;
        } else {
            const currentCell = this.focusableCells[this.focusedCellIndex];
            const currentRow = parseInt(currentCell.dataset.row || 0);
            const currentCol = parseInt(currentCell.dataset.col || 0);

            let newIndex = this.focusedCellIndex;

            switch (direction) {
                case 'ArrowUp':
                    newIndex = this.findCellInDirection(currentRow - 1, currentCol, -1, 0);
                    break;
                case 'ArrowDown':
                    newIndex = this.findCellInDirection(currentRow + 1, currentCol, 1, 0);
                    break;
                case 'ArrowLeft':
                    newIndex = this.findCellInDirection(currentRow, currentCol - 1, 0, -1);
                    break;
                case 'ArrowRight':
                    newIndex = this.findCellInDirection(currentRow, currentCol + 1, 0, 1);
                    break;
            }

            if (newIndex !== -1) {
                this.focusedCellIndex = newIndex;
            }
        }

        this.focusCell(this.focusedCellIndex);
    },

    /**
     * Vind een cel in een bepaalde richting
     * @param {number} targetRow
     * @param {number} targetCol
     * @param {number} rowDelta
     * @param {number} colDelta
     * @returns {number} Index of -1
     */
    findCellInDirection(targetRow, targetCol, rowDelta, colDelta) {
        // Probeer eerst de exacte positie
        let index = this.focusableCells.findIndex(cell => {
            const row = parseInt(cell.dataset.row || 0);
            const col = parseInt(cell.dataset.col || 0);
            return row === targetRow && col === targetCol;
        });

        if (index !== -1) return index;

        // Als niet gevonden, zoek de dichtstbijzijnde in die richting
        let bestIndex = -1;
        let bestDistance = Infinity;

        this.focusableCells.forEach((cell, i) => {
            const row = parseInt(cell.dataset.row || 0);
            const col = parseInt(cell.dataset.col || 0);

            // Controleer of cel in de juiste richting is
            const isCorrectDirection =
                (rowDelta < 0 && row < targetRow - rowDelta) ||
                (rowDelta > 0 && row > targetRow - rowDelta) ||
                (colDelta < 0 && col < targetCol - colDelta) ||
                (colDelta > 0 && col > targetCol - colDelta);

            if (!isCorrectDirection && (rowDelta !== 0 || colDelta !== 0)) {
                // Alleen de juiste richting
                if (rowDelta !== 0 && ((rowDelta > 0 && row <= targetRow - rowDelta) || (rowDelta < 0 && row >= targetRow - rowDelta))) return;
                if (colDelta !== 0 && ((colDelta > 0 && col <= targetCol - colDelta) || (colDelta < 0 && col >= targetCol - colDelta))) return;
            }

            const distance = Math.abs(row - targetRow) + Math.abs(col - targetCol);
            if (distance < bestDistance && distance > 0) {
                bestDistance = distance;
                bestIndex = i;
            }
        });

        return bestIndex;
    },

    /**
     * Update de lijst met focusbare cellen
     */
    updateFocusableCells() {
        let selector = '';

        switch (this.currentGame) {
            case 'snake':
                selector = '#snake-grid .number-box.empty';
                break;
            case 'pyramid':
                selector = '#pyramid-container .pyramid-cell.empty';
                break;
            case 'sudoku':
                selector = '#sudoku-grid .sudoku-cell.empty';
                break;
            case 'binary':
                selector = '#binary-grid .binary-cell.empty';
                break;
        }

        if (selector) {
            this.focusableCells = Array.from(document.querySelectorAll(selector));
        } else {
            this.focusableCells = [];
        }
    },

    /**
     * Focus een specifieke cel
     * @param {number} index
     */
    focusCell(index) {
        // Verwijder focus van alle cellen
        this.focusableCells.forEach(cell => {
            cell.classList.remove('keyboard-focus');
            cell.removeAttribute('tabindex');
        });

        if (index >= 0 && index < this.focusableCells.length) {
            const cell = this.focusableCells[index];
            cell.classList.add('keyboard-focus');
            cell.setAttribute('tabindex', '0');
            cell.focus();

            // Announce voor screen readers
            this.announce(`Cel rij ${parseInt(cell.dataset.row || 0) + 1}, kolom ${parseInt(cell.dataset.col || 0) + 1}`);
        }
    },

    /**
     * Activeer de gefocuste cel (open input)
     */
    activateFocusedCell() {
        if (this.focusedCellIndex >= 0 && this.focusedCellIndex < this.focusableCells.length) {
            const cell = this.focusableCells[this.focusedCellIndex];
            cell.click();
        }
    },

    /**
     * Handle tab navigatie
     * @param {KeyboardEvent} e
     */
    handleTabNavigation(e) {
        this.updateFocusableCells();

        if (this.focusableCells.length === 0) return;

        e.preventDefault();

        if (e.shiftKey) {
            // Shift+Tab = vorige
            this.focusedCellIndex = this.focusedCellIndex <= 0
                ? this.focusableCells.length - 1
                : this.focusedCellIndex - 1;
        } else {
            // Tab = volgende
            this.focusedCellIndex = this.focusedCellIndex >= this.focusableCells.length - 1
                ? 0
                : this.focusedCellIndex + 1;
        }

        this.focusCell(this.focusedCellIndex);
    },

    /**
     * Sluit actieve popup
     */
    closeActivePopup() {
        if (!document.getElementById('number-input-popup').classList.contains('hidden')) {
            closePopup();
        } else if (!document.getElementById('sudoku-input-popup').classList.contains('hidden')) {
            closeSudokuPopup();
        } else if (!document.getElementById('binary-input-popup').classList.contains('hidden')) {
            closeBinaryPopup();
        }
    },

    /**
     * Initialiseer focus trapping voor popups
     */
    initPopupFocusTrapping() {
        const popups = document.querySelectorAll('.popup');

        popups.forEach(popup => {
            popup.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocus(e, popup);
                }
            });
        });
    },

    /**
     * Trap focus binnen een popup
     * @param {KeyboardEvent} e
     * @param {HTMLElement} container
     */
    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    },

    /**
     * Set het huidige actieve spel
     * @param {string} game
     */
    setCurrentGame(game) {
        this.currentGame = game;
        this.focusedCellIndex = -1;
        this.focusableCells = [];
    },

    /**
     * Announce bericht voor screen readers
     * @param {string} message
     */
    announce(message) {
        const announcer = document.getElementById('announcer');
        if (announcer) {
            announcer.textContent = message;
            // Reset na korte tijd om herhaalde aankondigingen mogelijk te maken
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }
};

/**
 * Handle keydown op game cards (spelkeuze scherm)
 * @param {KeyboardEvent} event
 * @param {string} game
 */
function handleCardKeydown(event, game) {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectGame(game);
    }
}

/**
 * Announce een bericht voor screen readers
 * @param {string} message
 */
function announceMessage(message) {
    KeyboardNavigation.announce(message);
}

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', () => {
    KeyboardNavigation.init();
});

// Hook in game start functies om current game te updaten
const originalStartSnakeGame = typeof startSnakeGame !== 'undefined' ? startSnakeGame : null;
const originalStartPyramidGame = typeof startPyramidGame !== 'undefined' ? startPyramidGame : null;
const originalStartSudokuGame = typeof startSudokuGame !== 'undefined' ? startSudokuGame : null;
const originalStartBinaryGame = typeof startBinaryGame !== 'undefined' ? startBinaryGame : null;

// Deze worden overschreven nadat de game scripts geladen zijn
document.addEventListener('DOMContentLoaded', () => {
    // Wacht even tot alle scripts geladen zijn
    setTimeout(() => {
        // Overschrijf start functies om keyboard navigation te activeren
        if (typeof window.startSnakeGame === 'function') {
            const orig = window.startSnakeGame;
            window.startSnakeGame = function() {
                orig();
                KeyboardNavigation.setCurrentGame('snake');
            };
        }

        if (typeof window.startPyramidGame === 'function') {
            const orig = window.startPyramidGame;
            window.startPyramidGame = function() {
                orig();
                KeyboardNavigation.setCurrentGame('pyramid');
            };
        }

        if (typeof window.startSudokuGame === 'function') {
            const orig = window.startSudokuGame;
            window.startSudokuGame = function() {
                orig();
                KeyboardNavigation.setCurrentGame('sudoku');
            };
        }

        if (typeof window.startBinaryGame === 'function') {
            const orig = window.startBinaryGame;
            window.startBinaryGame = function() {
                orig();
                KeyboardNavigation.setCurrentGame('binary');
            };
        }

        // Reset game bij terug naar selectie
        if (typeof window.goToSelection === 'function') {
            const orig = window.goToSelection;
            window.goToSelection = function() {
                orig();
                KeyboardNavigation.setCurrentGame(null);
            };
        }
    }, 100);
});
