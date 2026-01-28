// Victory/Celebration Module
// Gedeelde logica voor het afhandelen van gewonnen spellen

const VictoryHandler = {
    /**
     * Behandel het voltooien van een spel
     * @param {string} gameId - ID van het spel ('snake', 'pyramid', 'sudoku', 'binary')
     * @param {object} options - Extra opties
     * @param {number} options.delay - Vertraging voor de viering (standaard 500ms)
     * @param {function} options.onVictory - Extra callback na de viering
     */
    handleVictory(gameId, options = {}) {
        const delay = options.delay || 500;

        setTimeout(() => {
            // Stop de timer voor dit spel
            if (typeof TimerManager !== 'undefined') {
                TimerManager.stop(gameId);
            }

            // Speel het victory geluid
            if (typeof playVictorySound === 'function') {
                playVictorySound();
            }

            // Start het vuurwerk
            if (typeof startFireworks === 'function') {
                startFireworks();
            }

            // Roep eventuele extra callback aan
            if (typeof options.onVictory === 'function') {
                options.onVictory();
            }
        }, delay);
    },

    /**
     * Behandel een correct antwoord
     * @param {HTMLElement} cellElement - Het DOM element van de cel
     * @param {string|number} answer - Het correcte antwoord om te tonen
     * @param {function} onCorrect - Callback na correct antwoord
     */
    handleCorrectAnswer(cellElement, answer, onCorrect) {
        if (!cellElement) return;

        // Update de cel visueel
        cellElement.classList.remove('empty');
        cellElement.classList.add('filled', 'correct');
        cellElement.textContent = answer;

        // Verwijder click handler door element te klonen
        const newCell = cellElement.cloneNode(true);
        if (cellElement.parentNode) {
            cellElement.parentNode.replaceChild(newCell, cellElement);
        }

        // Speel het correcte geluid
        if (typeof playCorrectSound === 'function') {
            playCorrectSound();
        }

        // Roep callback aan
        if (typeof onCorrect === 'function') {
            onCorrect(newCell);
        }

        return newCell;
    },

    /**
     * Behandel een fout antwoord
     * @param {HTMLElement} cellElement - Het DOM element van de cel
     * @param {function} onWrong - Callback na fout antwoord
     * @param {number} animationDuration - Duur van de fout animatie (standaard 1000ms)
     */
    handleWrongAnswer(cellElement, onWrong, animationDuration = 1000) {
        if (!cellElement) return;

        // Voeg de fout klasse toe
        cellElement.classList.add('wrong');

        // Speel het foute geluid
        if (typeof playWrongSound === 'function') {
            playWrongSound();
        }

        // Verwijder de fout klasse na de animatie
        setTimeout(() => {
            cellElement.classList.remove('wrong');

            // Roep callback aan
            if (typeof onWrong === 'function') {
                onWrong();
            }
        }, animationDuration);
    },

    /**
     * Controleer of het spel is voltooid en handel de victory af
     * @param {number} emptyCells - Aantal resterende lege cellen
     * @param {string} gameId - ID van het spel
     * @param {object} options - Extra opties voor handleVictory
     * @returns {boolean} True als het spel is voltooid
     */
    checkAndHandleVictory(emptyCells, gameId, options = {}) {
        if (emptyCells === 0) {
            this.handleVictory(gameId, options);
            return true;
        }
        return false;
    }
};

// Maak beschikbaar als globale variabele
if (typeof window !== 'undefined') {
    window.VictoryHandler = VictoryHandler;
}
