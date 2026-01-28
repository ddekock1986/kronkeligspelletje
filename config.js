// Gecentraliseerde Configuratie Module
// Bevat alle difficulty presets en game configuraties

const GameConfig = {
    // ===== REKENSLANG CONFIGURATIE =====
    snake: {
        difficulties: {
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
        },
        defaults: {
            startNumber: 10,
            maxOperation: 10,
            gridWidth: 5,
            gridRows: 4,
            operators: ['+', '-'],
            hidePercentage: 0.45
        },
        limits: {
            startNumber: { min: 1, max: 100 },
            maxOperation: { min: 1, max: 50 },
            gridWidth: { min: 3, max: 8 },
            gridRows: { min: 2, max: 8 }
        }
    },

    // ===== REKENPIRAMIDE CONFIGURATIE =====
    pyramid: {
        difficulties: {
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
        },
        defaults: {
            layers: 4,
            maxBase: 10,
            hidePercent: 50
        },
        limits: {
            layers: { min: 3, max: 7 },
            maxBase: { min: 1, max: 20 },
            hidePercent: { min: 30, max: 70 }
        }
    },

    // ===== SUDOKU CONFIGURATIE =====
    sudoku: {
        difficulties: {
            makkelijk: {
                hidePercent4x4: 35,
                hidePercent6x6: 40
            },
            normaal: {
                hidePercent4x4: 50,
                hidePercent6x6: 50
            },
            moeilijk: {
                hidePercent4x4: 60,
                hidePercent6x6: 60
            }
        },
        defaults: {
            size: 4,
            difficulty: 'normaal'
        },
        sizes: [4, 6],
        blockDimensions: {
            4: { height: 2, width: 2 },
            6: { height: 2, width: 3 }
        }
    },

    // ===== BINARY CONFIGURATIE =====
    binary: {
        difficulties: {
            makkelijk: {
                hidePercent4x4: 30,
                hidePercent6x6: 35,
                hidePercent8x8: 35
            },
            normaal: {
                hidePercent4x4: 45,
                hidePercent6x6: 45,
                hidePercent8x8: 45
            },
            moeilijk: {
                hidePercent4x4: 55,
                hidePercent6x6: 55,
                hidePercent8x8: 55
            }
        },
        defaults: {
            size: 4,
            difficulty: 'normaal'
        },
        sizes: [4, 6, 8]
    }
};

// ===== INPUT VALIDATIE UTILITIES =====
const InputValidator = {
    /**
     * Valideer en corrigeer een numerieke waarde binnen limieten
     * @param {number|string} value - De waarde om te valideren
     * @param {number} min - Minimum toegestane waarde
     * @param {number} max - Maximum toegestane waarde
     * @param {number} defaultValue - Standaardwaarde bij ongeldige input
     * @returns {number}
     */
    validateNumber(value, min, max, defaultValue) {
        const num = parseInt(value, 10);
        if (isNaN(num)) return defaultValue;
        if (num < min) return min;
        if (num > max) return max;
        return num;
    },

    /**
     * Valideer snake game instellingen
     * @param {object} settings
     * @returns {object} Gevalideerde instellingen
     */
    validateSnakeSettings(settings) {
        const limits = GameConfig.snake.limits;
        const defaults = GameConfig.snake.defaults;

        return {
            startNumber: this.validateNumber(
                settings.startNumber,
                limits.startNumber.min,
                limits.startNumber.max,
                defaults.startNumber
            ),
            maxOperation: this.validateNumber(
                settings.maxOperation,
                limits.maxOperation.min,
                limits.maxOperation.max,
                defaults.maxOperation
            ),
            gridWidth: this.validateNumber(
                settings.gridWidth,
                limits.gridWidth.min,
                limits.gridWidth.max,
                defaults.gridWidth
            ),
            gridRows: this.validateNumber(
                settings.gridRows,
                limits.gridRows.min,
                limits.gridRows.max,
                defaults.gridRows
            ),
            operators: settings.operators && settings.operators.length > 0
                ? settings.operators
                : defaults.operators,
            hidePercentage: settings.hidePercentage || defaults.hidePercentage
        };
    },

    /**
     * Valideer pyramid game instellingen
     * @param {object} settings
     * @returns {object} Gevalideerde instellingen
     */
    validatePyramidSettings(settings) {
        const limits = GameConfig.pyramid.limits;
        const defaults = GameConfig.pyramid.defaults;

        return {
            layers: this.validateNumber(
                settings.layers,
                limits.layers.min,
                limits.layers.max,
                defaults.layers
            ),
            maxBase: this.validateNumber(
                settings.maxBase,
                limits.maxBase.min,
                limits.maxBase.max,
                defaults.maxBase
            ),
            hidePercent: this.validateNumber(
                settings.hidePercent,
                limits.hidePercent.min,
                limits.hidePercent.max,
                defaults.hidePercent
            )
        };
    },

    /**
     * Valideer sudoku game instellingen
     * @param {object} settings
     * @returns {object} Gevalideerde instellingen
     */
    validateSudokuSettings(settings) {
        const validSizes = GameConfig.sudoku.sizes;
        const defaults = GameConfig.sudoku.defaults;

        return {
            size: validSizes.includes(settings.size) ? settings.size : defaults.size,
            difficulty: GameConfig.sudoku.difficulties[settings.difficulty]
                ? settings.difficulty
                : defaults.difficulty
        };
    },

    /**
     * Valideer binary game instellingen
     * @param {object} settings
     * @returns {object} Gevalideerde instellingen
     */
    validateBinarySettings(settings) {
        const validSizes = GameConfig.binary.sizes;
        const defaults = GameConfig.binary.defaults;

        return {
            size: validSizes.includes(settings.size) ? settings.size : defaults.size,
            difficulty: GameConfig.binary.difficulties[settings.difficulty]
                ? settings.difficulty
                : defaults.difficulty
        };
    }
};

// ===== HELPER FUNCTIES VOOR DIFFICULTY SELECTIE =====
const DifficultyHelper = {
    /**
     * Haal de preset configuratie op voor een specifiek spel en moeilijkheidsgraad
     * @param {string} game - 'snake', 'pyramid', 'sudoku', of 'binary'
     * @param {string} difficulty - 'makkelijk', 'normaal', of 'moeilijk'
     * @returns {object|null}
     */
    getPreset(game, difficulty) {
        const gameConfig = GameConfig[game];
        if (!gameConfig || !gameConfig.difficulties) return null;
        return gameConfig.difficulties[difficulty] || null;
    },

    /**
     * Update de difficulty knoppen UI voor een spel
     * @param {string} screenId - ID van het settings scherm
     * @param {string} difficulty - Geselecteerde moeilijkheidsgraad
     */
    updateDifficultyButtons(screenId, difficulty) {
        const buttons = document.querySelectorAll(`#${screenId} .difficulty-btn`);
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.difficulty === difficulty) {
                btn.classList.add('selected');
            }
        });
    },

    /**
     * Update de grid size knoppen UI
     * @param {string} screenId - ID van het settings scherm
     * @param {number} size - Geselecteerde grootte
     */
    updateSizeButtons(screenId, size) {
        const buttons = document.querySelectorAll(`#${screenId} .grid-size-btn`);
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.size) === size) {
                btn.classList.add('selected');
            }
        });
    }
};

// Exporteer voor gebruik in andere modules (indien nodig)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConfig, InputValidator, DifficultyHelper };
}
