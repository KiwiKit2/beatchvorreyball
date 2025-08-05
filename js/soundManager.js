// Sound Manager - Handles all audio with easy extensibility
class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.volume = 1.0;
        this.muted = false;
        
        // Audio context for better browser compatibility
        this.audioContext = null;
        this.initialized = false;
    }
    
    async initialize() {
        try {
            // Initialize audio context on user interaction
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }
    
    async loadSound(src, key, options = {}) {
        try {
            const audio = new Audio(src);
            audio.preload = 'auto';
            audio.volume = (options.volume || 1.0) * this.volume;
            audio.loop = options.loop || false;
            
            // Return a promise that resolves when the audio can play
            return new Promise((resolve, reject) => {
                audio.addEventListener('canplaythrough', () => {
                    this.sounds.set(key, {
                        audio: audio,
                        volume: options.volume || 1.0,
                        category: options.category || 'sfx'
                    });
                    resolve(audio);
                });
                
                audio.addEventListener('error', (e) => {
                    console.error(`Failed to load sound: ${src}`, e);
                    reject(e);
                });
                
                // Start loading
                audio.load();
            });
        } catch (error) {
            console.error(`Error loading sound ${key}:`, error);
            throw error;
        }
    }
    
    async loadAllSounds(soundList) {
        const promises = soundList.map(item => 
            this.loadSound(item.src, item.key, item.options || {})
        );
        
        try {
            await Promise.all(promises);
            console.log('All sounds loaded successfully');
        } catch (error) {
            console.warn('Some sounds failed to load:', error);
        }
    }
    
    playSound(key, options = {}) {
        if (!this.initialized) {
            // Auto-initialize on first play attempt
            this.initialize();
        }
        
        if (this.muted) return;
        
        const soundData = this.sounds.get(key);
        if (!soundData) {
            console.warn(`Sound not found: ${key}`);
            return;
        }
        
        try {
            const audio = soundData.audio.cloneNode();
            audio.volume = (options.volume || soundData.volume) * this.volume;
            audio.playbackRate = options.playbackRate || 1.0;
            
            // Add random pitch variation if specified
            if (options.randomPitch) {
                const pitchVariation = (Math.random() - 0.5) * options.randomPitch;
                audio.playbackRate = Math.max(0.5, Math.min(2.0, 1.0 + pitchVariation));
            }
            
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Audio play failed for ${key}:`, error);
                });
            }
            
            return audio;
        } catch (error) {
            console.error(`Error playing sound ${key}:`, error);
        }
    }
    
    // Play with delay
    playSoundDelayed(key, delay, options = {}) {
        setTimeout(() => {
            this.playSound(key, options);
        }, delay);
    }
    
    // Play multiple sounds in sequence
    playSoundSequence(soundKeys, interval = 500) {
        soundKeys.forEach((key, index) => {
            this.playSoundDelayed(key, index * interval);
        });
    }
    
    stopSound(key) {
        const soundData = this.sounds.get(key);
        if (soundData) {
            soundData.audio.pause();
            soundData.audio.currentTime = 0;
        }
    }
    
    stopAllSounds() {
        this.sounds.forEach((soundData, key) => {
            this.stopSound(key);
        });
    }
    
    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        
        // Update all loaded sounds
        this.sounds.forEach(soundData => {
            soundData.audio.volume = soundData.volume * this.volume;
        });
    }
    
    setMuted(muted) {
        this.muted = muted;
        if (muted) {
            this.stopAllSounds();
        }
    }
    
    // Get sound duration (useful for timing)
    getSoundDuration(key) {
        const soundData = this.sounds.get(key);
        return soundData ? soundData.audio.duration : 0;
    }
    
    // Create sound presets for different game events
    createSoundPresets(selectedCharacter = 'donQ') {
        // Map character to their voice sound
        const characterVoices = {
            'donQ': 'donQsays',
            'ryoshu': 'donQsays', // Using same voice for now, can add more later
            'ideal': 'donQsays'   // Using same voice for now, can add more later
        };
        
        const voiceSound = characterVoices[selectedCharacter] || 'donQsays';
        
        return {
            // Volleyball hit with both sounds
            volleyballPass: () => {
                // Play hit sound immediately
                this.playSound('hit', {
                    randomPitch: 0.1,
                    volume: 0.8
                });
                
                // Play character's voice almost simultaneously
                this.playSoundDelayed(voiceSound, 100, {
                    volume: 0.9
                });
            },
            
            // Just hit sound for other effects
            volleyballHit: () => {
                this.playSound('hit', {
                    randomPitch: 0.2,
                    volume: 0.7
                });
            },
            
            // Just Don Quixote voice
            donQuixoteSays: () => {
                this.playSound('donQsays', {
                    volume: 0.8
                });
            },
            
            // Rally ended sound
            rallyEnd: () => {
                console.log("Attempting to play awh sound...");
                this.playSound('awh', {
                    volume: 0.9
                });
            }
        };
    }
}

// Global sound manager instance
const soundManager = new SoundManager();
