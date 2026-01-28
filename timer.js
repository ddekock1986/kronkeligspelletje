// Gedeelde Timer Utility Module
// Vervangt de gedupliceerde timer logica in alle spel-bestanden

class GameTimer {
    constructor(displayElementId) {
        this.displayElementId = displayElementId;
        this.startTime = null;
        this.interval = null;
        this.elapsed = 0;
    }

    /**
     * Start de timer
     */
    start() {
        this.startTime = Date.now();
        this.updateDisplay();
        this.interval = setInterval(() => this.updateDisplay(), 1000);
    }

    /**
     * Stop de timer
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    /**
     * Reset de timer naar 0
     */
    reset() {
        this.stop();
        this.elapsed = 0;
        this.startTime = null;
        const display = document.getElementById(this.displayElementId);
        if (display) {
            display.textContent = '00:00';
        }
    }

    /**
     * Haal de verstreken tijd op in seconden
     * @returns {number}
     */
    getElapsedSeconds() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Formatteer seconden naar MM:SS formaat
     * @param {number} totalSeconds
     * @returns {string}
     */
    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    /**
     * Update de display met de huidige tijd
     */
    updateDisplay() {
        const display = document.getElementById(this.displayElementId);
        if (display) {
            this.elapsed = this.getElapsedSeconds();
            display.textContent = this.formatTime(this.elapsed);
        }
    }

    /**
     * Controleer of de timer actief is
     * @returns {boolean}
     */
    isRunning() {
        return this.interval !== null;
    }
}

// Timer Manager - beheert alle game timers centraal
const TimerManager = {
    timers: {},

    /**
     * Maak een nieuwe timer aan voor een spel
     * @param {string} gameId - Unieke identifier voor het spel (bijv. 'snake', 'pyramid')
     * @param {string} displayElementId - ID van het DOM element voor de timer display
     * @returns {GameTimer}
     */
    createTimer(gameId, displayElementId) {
        if (this.timers[gameId]) {
            this.timers[gameId].stop();
        }
        this.timers[gameId] = new GameTimer(displayElementId);
        return this.timers[gameId];
    },

    /**
     * Haal een bestaande timer op
     * @param {string} gameId
     * @returns {GameTimer|null}
     */
    getTimer(gameId) {
        return this.timers[gameId] || null;
    },

    /**
     * Start een timer
     * @param {string} gameId
     */
    start(gameId) {
        const timer = this.timers[gameId];
        if (timer) {
            timer.start();
        }
    },

    /**
     * Stop een timer
     * @param {string} gameId
     */
    stop(gameId) {
        const timer = this.timers[gameId];
        if (timer) {
            timer.stop();
        }
    },

    /**
     * Stop alle actieve timers
     */
    stopAll() {
        Object.values(this.timers).forEach(timer => timer.stop());
    },

    /**
     * Reset een timer
     * @param {string} gameId
     */
    reset(gameId) {
        const timer = this.timers[gameId];
        if (timer) {
            timer.reset();
        }
    }
};

// Initialiseer timers voor alle spellen
document.addEventListener('DOMContentLoaded', () => {
    TimerManager.createTimer('snake', 'snake-timer-display');
    TimerManager.createTimer('pyramid', 'pyramid-timer-display');
    TimerManager.createTimer('sudoku', 'sudoku-timer-display');
    TimerManager.createTimer('binary', 'binary-timer-display');
});
