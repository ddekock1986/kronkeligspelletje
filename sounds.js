// Geluidsfuncties met Web Audio API
// Met verbeterde foutafhandeling en fallbacks

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let audioEnabled = true;
let audioMuted = false;

// Laad mute staat uit localStorage bij opstarten
try {
    const savedMuteState = localStorage.getItem('audioMuted');
    if (savedMuteState !== null) {
        audioMuted = savedMuteState === 'true';
    }
} catch (e) {
    // localStorage niet beschikbaar
}

/**
 * Initialiseer de audio context
 * @returns {boolean} True als audio succesvol is geinitialiseerd
 */
function initAudio() {
    try {
        if (!AudioContext) {
            console.warn('Web Audio API wordt niet ondersteund in deze browser');
            audioEnabled = false;
            return false;
        }

        if (!audioContext) {
            audioContext = new AudioContext();
        }

        if (audioContext.state === 'suspended') {
            audioContext.resume().catch(err => {
                console.warn('Kon audio context niet hervatten:', err);
            });
        }

        return true;
    } catch (error) {
        console.warn('Fout bij initialiseren van audio:', error);
        audioEnabled = false;
        return false;
    }
}

/**
 * Controleer of audio beschikbaar is
 * @returns {boolean}
 */
function isAudioAvailable() {
    return audioEnabled && audioContext !== null && !audioMuted;
}

/**
 * Controleer of geluid gedempt is
 * @returns {boolean}
 */
function isAudioMuted() {
    return audioMuted;
}

/**
 * Zet geluid aan of uit (toggle)
 * @returns {boolean} Nieuwe mute staat
 */
function toggleMute() {
    audioMuted = !audioMuted;
    try {
        localStorage.setItem('audioMuted', audioMuted.toString());
    } catch (e) {
        // localStorage niet beschikbaar
    }
    updateMuteButtonUI();
    return audioMuted;
}

/**
 * Zet mute staat expliciet
 * @param {boolean} muted
 */
function setMuted(muted) {
    audioMuted = muted;
    try {
        localStorage.setItem('audioMuted', audioMuted.toString());
    } catch (e) {
        // localStorage niet beschikbaar
    }
    updateMuteButtonUI();
}

/**
 * Update alle mute knop UIs
 */
function updateMuteButtonUI() {
    const muteBtns = document.querySelectorAll('.mute-btn');
    muteBtns.forEach(muteBtn => {
        muteBtn.innerHTML = audioMuted ? '🔇' : '🔊';
        muteBtn.setAttribute('aria-label', audioMuted ? 'Geluid aanzetten' : 'Geluid uitzetten');
        muteBtn.setAttribute('aria-pressed', audioMuted ? 'true' : 'false');
    });
}

/**
 * Maak een oscillator met gain node
 * @param {number} frequency - Frequentie in Hz
 * @param {number} startTime - Starttijd
 * @param {number} duration - Duur in seconden
 * @param {number} volume - Volume (0-1)
 * @returns {object|null} Object met oscillator en gainNode, of null bij fout
 */
function createOscillator(frequency, startTime, duration, volume = 0.3) {
    try {
        if (!audioContext) return null;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        return { oscillator, gainNode };
    } catch (error) {
        console.warn('Fout bij maken van oscillator:', error);
        return null;
    }
}

/**
 * Vrolijke piep bij goed antwoord
 */
function playCorrectSound() {
    if (!initAudio() || !audioEnabled || audioMuted) return;

    try {
        const currentTime = audioContext.currentTime;
        const frequencies = [800, 1000, 1200];
        const duration = 0.3;

        frequencies.forEach((freq, index) => {
            const startTime = currentTime + (index * 0.1);
            const result = createOscillator(freq, startTime, duration - (index * 0.1));

            if (result) {
                const { oscillator } = result;
                oscillator.start(startTime);
                oscillator.stop(startTime + duration - (index * 0.1));
            }
        });
    } catch (error) {
        console.warn('Fout bij afspelen correct geluid:', error);
    }
}

/**
 * "Wa wa wa wah" geluid bij fout antwoord
 */
function playWrongSound() {
    if (!initAudio() || !audioEnabled || audioMuted) return;

    try {
        const currentTime = audioContext.currentTime;
        const notes = [
            { freq: 400, time: 0, duration: 0.2 },
            { freq: 350, time: 0.2, duration: 0.2 },
            { freq: 300, time: 0.4, duration: 0.2 },
            { freq: 250, time: 0.6, duration: 0.4 }
        ];

        notes.forEach(note => {
            const startTime = currentTime + note.time;
            const result = createOscillator(note.freq, startTime, note.duration);

            if (result) {
                const { oscillator } = result;
                oscillator.start(startTime);
                oscillator.stop(startTime + note.duration);
            }
        });
    } catch (error) {
        console.warn('Fout bij afspelen fout geluid:', error);
    }
}

/**
 * Feestelijk geluid bij voltooiing
 */
function playVictorySound() {
    if (!initAudio() || !audioEnabled || audioMuted) return;

    try {
        const currentTime = audioContext.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        const noteDuration = 0.3;
        const noteSpacing = 0.15;

        notes.forEach((freq, index) => {
            const startTime = currentTime + (index * noteSpacing);
            const result = createOscillator(freq, startTime, noteDuration);

            if (result) {
                const { oscillator } = result;
                oscillator.start(startTime);
                oscillator.stop(startTime + noteDuration);
            }
        });
    } catch (error) {
        console.warn('Fout bij afspelen victory geluid:', error);
    }
}

/**
 * Speel een custom toon
 * @param {number} frequency - Frequentie in Hz
 * @param {number} duration - Duur in seconden
 * @param {number} volume - Volume (0-1)
 */
function playTone(frequency, duration = 0.2, volume = 0.3) {
    if (!initAudio() || !audioEnabled || audioMuted) return;

    try {
        const currentTime = audioContext.currentTime;
        const result = createOscillator(frequency, currentTime, duration, volume);

        if (result) {
            const { oscillator } = result;
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);
        }
    } catch (error) {
        console.warn('Fout bij afspelen toon:', error);
    }
}

/**
 * Schakel audio in/uit
 * @param {boolean} enabled
 */
function setAudioEnabled(enabled) {
    audioEnabled = enabled;
    if (!enabled && audioContext) {
        try {
            audioContext.suspend();
        } catch (error) {
            // Negeer fouten bij suspenden
        }
    } else if (enabled && audioContext) {
        try {
            audioContext.resume();
        } catch (error) {
            // Negeer fouten bij hervatten
        }
    }
}

// Initialiseer mute knop UI bij laden
document.addEventListener('DOMContentLoaded', () => {
    updateMuteButtonUI();
});

// Exporteer functies als module indien nodig
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAudio,
        isAudioAvailable,
        isAudioMuted,
        toggleMute,
        setMuted,
        playCorrectSound,
        playWrongSound,
        playVictorySound,
        playTone,
        setAudioEnabled
    };
}
