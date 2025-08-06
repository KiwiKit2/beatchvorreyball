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
        
        // Setup dropdown menu
        this.setupDropdownMenu();
        
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
                modeButtons.forEach(btn => {
                    btn.style.background = '';
                    btn.classList.remove('selected-green');
                });
                
                // Add selected styling to clicked button
                button.classList.add('selected-green');
                
                // Update selected mode
                this.selectedMode = button.dataset.mode;
                
                // Show/hide online options
                this.toggleOnlineOptions();
                
                console.log(`Selected mode: ${this.selectedMode}`);
            });
        });
        
        // Select VS NPC by default
        const defaultButton = document.querySelector('[data-mode="vs-npc"]');
        if (defaultButton) {
            defaultButton.classList.add('selected-green');
        }
        
        // Setup online multiplayer functionality
        this.setupOnlineMultiplayer();
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
    
    toggleOnlineOptions() {
        const onlineOptions = document.getElementById('onlineOptions');
        if (this.selectedMode === 'online-multiplayer') {
            onlineOptions.style.display = 'block';
        } else {
            onlineOptions.style.display = 'none';
            this.hideRoomInfo();
        }
    }
    
    setupOnlineMultiplayer() {
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        const joinRoomInput = document.getElementById('joinRoomInput');
        const joinRoomConfirmBtn = document.getElementById('joinRoomConfirmBtn');
        const roomCodeInput = document.getElementById('roomCodeInput');
        
        // Create room functionality
        createRoomBtn.addEventListener('click', async (event) => {
            event.stopPropagation(); // Prevent bubbling to parent elements
            this.showConnectionStatus('Creating room...', 'connecting');
            
            try {
                await multiplayerManager.initialize();
                const roomCode = await multiplayerManager.createRoom();
                
                if (roomCode) {
                    this.showRoomInfo(roomCode, true);
                    this.showConnectionStatus('Room created! Waiting for opponent...', 'connected');
                }
            } catch (error) {
                this.showConnectionStatus('Failed to create room', 'disconnected');
            }
        });
        
        // Join room functionality
        joinRoomBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent bubbling to parent elements
            joinRoomInput.style.display = 'block';
            roomCodeInput.focus();
        });
        
        joinRoomConfirmBtn.addEventListener('click', async (event) => {
            event.stopPropagation(); // Prevent bubbling to parent elements
            const roomCode = roomCodeInput.value.trim().toUpperCase();
            if (!roomCode) return;
            
            this.showConnectionStatus('Joining room...', 'connecting');
            
            try {
                await multiplayerManager.initialize();
                const success = await multiplayerManager.joinRoom(roomCode);
                
                if (success) {
                    this.showRoomInfo(roomCode, false);
                    this.showConnectionStatus('Connected! Ready to play!', 'connected');
                }
            } catch (error) {
                this.showConnectionStatus('Failed to join room', 'disconnected');
            }
        });
        
        // Allow Enter key to join room
        roomCodeInput.addEventListener('keypress', (e) => {
            e.stopPropagation(); // Prevent bubbling
            if (e.key === 'Enter') {
                joinRoomConfirmBtn.click();
            }
        });
        
        // Prevent input from triggering mode selection
        roomCodeInput.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling to parent elements
        });
        
        // Setup multiplayer callbacks
        multiplayerManager.onRoomJoined((roomCode, isHost) => {
            this.showRoomInfo(roomCode, isHost);
        });
        
        multiplayerManager.onOpponentJoined((opponent) => {
            this.showConnectionStatus('Opponent joined! Ready to play!', 'connected');
        });
        
        multiplayerManager.onOpponentLeft(() => {
            this.showConnectionStatus('Opponent left the game', 'disconnected');
        });
        
        multiplayerManager.onError((error) => {
            this.showConnectionStatus(error, 'disconnected');
        });
    }
    
    showRoomInfo(roomCode, isHost) {
        const roomInfo = document.getElementById('roomInfo');
        const roomCodeDisplay = document.getElementById('roomCodeDisplay');
        
        roomCodeDisplay.textContent = `Room Code: ${roomCode}`;
        roomInfo.style.display = 'block';
        
        // Hide join input if showing
        document.getElementById('joinRoomInput').style.display = 'none';
    }
    
    hideRoomInfo() {
        const roomInfo = document.getElementById('roomInfo');
        const joinRoomInput = document.getElementById('joinRoomInput');
        
        roomInfo.style.display = 'none';
        joinRoomInput.style.display = 'none';
    }
    
    showConnectionStatus(message, status) {
        const connectionStatus = document.getElementById('connectionStatus');
        const statusClass = status || 'disconnected';
        
        connectionStatus.innerHTML = `<span class="online-status ${statusClass}"></span>${message}`;
    }
    
    setupDropdownMenu() {
        const dropdownToggle = document.getElementById('dropdownToggle');
        const dropdownContent = document.getElementById('dropdownContent');
        const aboutBtn = document.getElementById('aboutBtn');
        const aboutModal = document.getElementById('aboutModal');
        const closeModal = document.getElementById('closeModal');
        
        // Force hide modal on initialization
        if (aboutModal) {
            aboutModal.classList.add('hidden');
            console.log('Modal forced to hidden state');
        }
        
        if (!dropdownToggle || !dropdownContent) {
            console.warn('Dropdown elements not found');
            return;
        }
        
        // Toggle dropdown
        dropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownToggle.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
        
        // About modal functionality
        if (aboutBtn && aboutModal && closeModal) {
            // Make sure modal starts hidden
            aboutModal.classList.add('hidden');
            
            aboutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdownContent.classList.remove('show');
                aboutModal.classList.remove('hidden');
                console.log('About modal opened');
            });
            
            // Multiple ways to close the modal
            const closeModalFunction = () => {
                aboutModal.classList.add('hidden');
                console.log('About modal closed');
            };
            
            // Close button with debugging
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                closeModalFunction();
            });
            
            // Click outside modal
            aboutModal.addEventListener('click', (e) => {
                if (e.target === aboutModal) {
                    closeModalFunction();
                }
            });
            
            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !aboutModal.classList.contains('hidden')) {
                    closeModalFunction();
                }
            });
            
            // Add a backup close method - click anywhere on modal content
            const modalContent = aboutModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    // Don't close if clicking on text/content, only on padding areas
                    if (e.target === modalContent) {
                        closeModalFunction();
                    }
                });
            }
        }
    }
}

// Create global menu manager instance
const menuManager = new MenuManager();
