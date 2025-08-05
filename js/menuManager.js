// Menu Manager for Beach Volleyball Game
class MenuManager {
    constructor() {
        this.selectedCharacter = 'donQ';
        this.selectedMode = 'vs-npc';
        this.playerName = '';
        this.menuElement = null;
        this.gameStartCallback = null;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupMenu());
        } else {
            this.setupMenu();
        }
    }
    
    setupMenu() {
        this.menuElement = document.getElementById('gameMenu');
        
        // Setup character selection
        this.setupCharacterSelection();
        
        // Setup game mode selection
        this.setupGameModeSelection();
        
        // Setup nickname input
        this.setupNicknameInput();
        
        // Setup start button
        this.setupStartButton();
        
        // Show menu initially
        this.showMenu();
    }
    
    setupCharacterSelection() {
        const characterOptions = document.querySelectorAll('.character-option:not(.coming-soon)');
        
        characterOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                characterOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update selected character
                this.selectedCharacter = option.dataset.character;
                
                console.log(`Selected character: ${this.selectedCharacter}`);
            });
        });
    }
    
    setupGameModeSelection() {
        const modeButtons = document.querySelectorAll('.mode-button:not(.coming-soon)');
        
        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove selected styling from all buttons
                modeButtons.forEach(btn => btn.style.background = '');
                
                // Add selected styling to clicked button
                button.style.background = 'linear-gradient(135deg, #228B22, #32CD32)';
                
                // Update selected mode
                this.selectedMode = button.dataset.mode;
                
                console.log(`Selected mode: ${this.selectedMode}`);
            });
        });
        
        // Select VS NPC by default
        const defaultButton = document.querySelector('[data-mode="vs-npc"]');
        if (defaultButton) {
            defaultButton.style.background = 'linear-gradient(135deg, #228B22, #32CD32)';
        }
    }
    
    setupNicknameInput() {
        const nameInput = document.getElementById('playerName');
        
        nameInput.addEventListener('input', (e) => {
            this.playerName = e.target.value.trim();
            console.log(`Player name: ${this.playerName}`);
        });
        
        // Set default name
        nameInput.value = 'Player';
        this.playerName = 'Player';
    }
    
    setupStartButton() {
        const startButton = document.getElementById('startGameBtn');
        
        if (!startButton) {
            console.error('Start button not found!');
            return;
        }
        
        startButton.addEventListener('click', () => {
            console.log('Start button clicked!');
            this.startGame();
        });
    }
    
    startGame() {
        console.log('startGame method called');
        
        const gameConfig = {
            character: this.selectedCharacter,
            mode: this.selectedMode,
            playerName: this.playerName || 'Player'
        };
        
        console.log('Starting game with config:', gameConfig);
        
        // Hide menu
        this.hideMenu();
        
        // Call the global start function
        if (typeof window.startBeachVolleyball === 'function') {
            console.log('Calling window.startBeachVolleyball');
            window.startBeachVolleyball(gameConfig);
        } else if (this.gameStartCallback) {
            console.log('Calling gameStartCallback');
            this.gameStartCallback(gameConfig);
        } else {
            console.error('No start function available!');
        }
    }
    
    showMenu() {
        if (this.menuElement) {
            this.menuElement.classList.remove('hidden');
        }
    }
    
    hideMenu() {
        if (this.menuElement) {
            this.menuElement.classList.add('hidden');
        }
    }
    
    // Method for game to register start callback
    onGameStart(callback) {
        this.gameStartCallback = callback;
    }
    
    // Method to show menu again (for returning to menu)
    returnToMenu() {
        this.showMenu();
    }
    
    // Get current player configuration
    getPlayerConfig() {
        return {
            character: this.selectedCharacter,
            mode: this.selectedMode,
            playerName: this.playerName || 'Player'
        };
    }
}

// Create global menu manager instance
const menuManager = new MenuManager();
