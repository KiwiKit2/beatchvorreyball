// Main Game Logic
class BeachVolleyballGame {
    constructor() {
        this.engine = new GameEngine('gameCanvas');
        this.gameState = 'menu'; // menu, loading, ready, playing, paused
        this.soundPresets = null;
        
        // Player configuration from menu
        this.playerConfig = {
            character: 'donQ',
            mode: 'vs-npc',
            playerName: 'Player'
        };
        
        // Game objects
        this.player1 = null;
        this.player2 = null;
        this.volleyball = null;
        
        // Game settings
        this.groundLevel = 480;
        this.passCount = 0;
        this.isPlayerTurn = true;
        
        // Animation timing
        this.lastPassTime = 0;
        this.passDelay = 1500; // Delay between AI passes
        this.rallyJustEnded = false; // Track if rally just ended
        
        // Don't initialize immediately - wait for menu
        this.setupMenuIntegration();
    }
    
    setupMenuIntegration() {
        // Register with menu manager to receive start game callback
        menuManager.onGameStart((config) => {
            this.playerConfig = config;
            this.initialize();
        });
    }
    
    async initialize() {
        // Prevent multiple initializations
        if (this.gameState !== 'menu') {
            console.log('Game already initialized, skipping...');
            return;
        }
        
        this.gameState = 'loading';
        
        try {
            // Load all images
            await this.loadAssets();
            
            // Initialize sound manager
            await soundManager.initialize();
            this.soundPresets = soundManager.createSoundPresets(this.playerConfig.character);
            
            // Create game objects
            this.createGameObjects();
            
            // Setup game logic
            this.setupGameLogic();
            
            // Start the game
            this.gameState = 'ready';
            
            // Set up engine update callback
            this.engine.gameUpdate = (deltaTime) => this.update(deltaTime);
            
            this.engine.start();
            
            console.log('Beach Volleyball Game initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.gameState = 'menu'; // Reset state on error
            this.showErrorMessage();
        }
    }
    
    async loadAssets() {
        // Load images
        const imagesToLoad = [
            { src: 'images/BeachBG.png', key: 'background' },
            { src: 'images/donQ.png', key: 'donQ' },
            { src: 'images/ryoshu.png', key: 'ryoshu' },
            { src: 'images/ideal.png', key: 'ideal' },
            { src: 'images/volleyball.png', key: 'volleyball' }
        ];
        
        await this.engine.loadAllImages(imagesToLoad);
        
        // Load sounds
        const soundsToLoad = [
            { 
                src: 'sounds/donQsays.mp3', 
                key: 'donQsays',
                options: { category: 'voice', volume: 0.8 }
            },
            { 
                src: 'sounds/hit.mp3', 
                key: 'hit',
                options: { category: 'sfx', volume: 0.7 }
            },
            { 
                src: 'sounds/awh.mp3', 
                key: 'awh',
                options: { category: 'voice', volume: 0.9 }
            }
        ];
        
        await soundManager.loadAllSounds(soundsToLoad);
        console.log("All sounds loaded:", soundManager.sounds.keys());
    }
    
    createGameObjects() {
        // Prevent duplicate creation
        if (this.player1 || this.player2 || this.volleyball) {
            console.log('Game objects already exist, skipping creation');
            return;
        }
        
        // Calculate ground level even lower on screen for final polish
        this.groundLevel = (this.engine.canvas.height * 0.88); // Much lower position
        
        // Create player characters with selected character type
        this.player1 = new Character(120, this.groundLevel - 180, this.playerConfig.character, true);
        this.player2 = new Character(this.engine.canvas.width - 300, this.groundLevel - 180, this.playerConfig.character, false);
        
        // Set ground level for characters
        this.player1.setGroundLevel(this.groundLevel);
        this.player2.setGroundLevel(this.groundLevel);
        
        // Create volleyball in starting position
        this.volleyball = new Volleyball(
            this.player1.getCenterX() + 50,
            this.groundLevel - 140 // Start volleyball higher for larger characters
        );
        this.volleyball.setGroundLevel(this.groundLevel);
        
        // Add objects to engine
        this.engine.addGameObject(this.player1);
        this.engine.addGameObject(this.player2);
        this.engine.addGameObject(this.volleyball);
        
        console.log('Created game objects:', this.engine.gameObjects.length);
    }
    
    setupGameLogic() {
        // Start with a simple serve
        this.gameState = 'ready';
        this.rallyInProgress = false;
        this.lastHitBy = null;
        
        // Simple, direct player hitting - no complex state management
        this.player1.setInteractable(true);
        this.player1.onHitVolleyball = () => {
            console.log("SIMPLE HIT: Player trying to hit volleyball");
            this.tryPlayerHit();
        };
        
        // Set up enhanced NPC behavior for player2
        this.player2.setInteractable(false);
        this.player2.isNPC = true;
        this.player2.npcState = 'ready';
        this.player2.npcTimer = 0;
        this.player2.moveSpeed = 500;
        this.player2.reactionTime = 100;
        this.player2.anticipation = 0;
        this.player2.skillLevel = 0.9;
        this.player2.hitWindow = 250;
    }
    
    tryPlayerHit() {
        // Better hit detection - check distance from player center to ball center
        const playerCenterX = this.player1.x + this.player1.width / 2;
        const playerCenterY = this.player1.y + this.player1.height / 2;
        const ballCenterX = this.volleyball.x + this.volleyball.width / 2;
        const ballCenterY = this.volleyball.y + this.volleyball.height / 2;
        
        const distance = Math.sqrt(
            (ballCenterX - playerCenterX) ** 2 + 
            (ballCenterY - playerCenterY) ** 2
        );
        
        console.log(`SIMPLE HIT: Distance to ball: ${Math.round(distance)}`);
        
        if (distance < 180) { // Balanced hitting distance - not too far, not too close
            console.log("SIMPLE HIT: Close enough, hitting ball!");
            
            // Direct ball hitting - smoother velocities
            this.volleyball.velocityX = 350 + Math.random() * 150; // Smoother speed range
            this.volleyball.velocityY = -450 - Math.random() * 150; // Better arc
            this.volleyball.isMoving = true; // CRITICAL: Mark ball as moving
            this.volleyball.isInAir = true; // Mark ball as in air
            
            // Play animation and sound
            this.player1.playHitAnimation();
            this.soundPresets.volleyballPass();
            
            // Update counters and start rally
            this.passCount++;
            this.lastHitBy = 'player';
            this.rallyInProgress = true; // CRITICAL: Start rally tracking!
            
            // Start NPC reaction
            this.startAdvancedNPCReaction();
            
            console.log(`SIMPLE HIT: Success! Ball velocity: ${Math.round(this.volleyball.velocityX)}, ${Math.round(this.volleyball.velocityY)}, isMoving: ${this.volleyball.isMoving}, Rally: ${this.rallyInProgress}`);
            return true;
        } else {
            console.log("SIMPLE HIT: Too far from ball");
            return false;
        }
    }
    
    startAdvancedNPCReaction() {
        this.player2.npcState = 'tracking';
        this.player2.npcTimer = 0;
        this.player2.reactionTime = 50 + Math.random() * 100;
        this.player2.anticipation = Math.random() * 0.3;
        console.log("NPC starting to track ball!");
    }
    
    updateNPC(deltaTime) {
        if (!this.player2.isNPC) return;
        
        this.player2.npcTimer += deltaTime;
        const dt = deltaTime / 1000;
        const courtMiddle = this.engine.canvas.width / 2;
        const ballX = this.volleyball.x + this.volleyball.width / 2;
        const ballY = this.volleyball.y + this.volleyball.height / 2;
        const npcX = this.player2.getCenterX();
        
        // Enhanced ball tracking and prediction
        const ballVelX = this.volleyball.velocityX;
        const ballVelY = this.volleyball.velocityY;
        const gravity = this.volleyball.gravity;
        
        // Predict where ball will be in the future
        const predictionTime = 0.5; // Look ahead 0.5 seconds
        const futureX = ballX + ballVelX * predictionTime;
        const futureY = ballY + ballVelY * predictionTime + 0.5 * gravity * predictionTime * predictionTime;
        
        // Debug: Log NPC state occasionally
        if (Math.random() < 0.01) { // 1% chance to log
            console.log(`NPC State: ${this.player2.npcState}, Ball at: (${Math.round(ballX)}, ${Math.round(ballY)}), NPC at: ${Math.round(npcX)}, BallVelX: ${Math.round(ballVelX)}`);
        }
        
        switch (this.player2.npcState) {
            case 'tracking':
                // Enhanced tracking with better anticipation
                if (this.player2.npcTimer > this.player2.reactionTime) {
                    // Much more lenient tracking conditions
                    if (ballX > courtMiddle - 200 && ballVelX > -100) { // Very forgiving tracking
                        this.player2.npcState = 'positioning';
                        this.player2.targetX = this.calculateOptimalPosition(futureX, futureY);
                        console.log("NPC switching to positioning mode");
                    }
                }
                break;
                
            case 'positioning':
                // Smarter positioning with better prediction
                const distanceToTarget = this.player2.targetX - npcX;
                
                if (Math.abs(distanceToTarget) > 30) { // More lenient positioning tolerance
                    // Move toward optimal position with adaptive speed
                    const moveDirection = Math.sign(distanceToTarget);
                    let moveSpeed = this.player2.moveSpeed;
                    
                    // Dynamic speed adjustment based on ball proximity and urgency
                    const ballDistance = Math.abs(ballX - npcX);
                    if (ballDistance < 250) {
                        moveSpeed *= 1.3; // Speed up when ball is close
                    }
                    if (Math.abs(ballVelX) > 200) {
                        moveSpeed *= 1.2; // Speed up for fast balls
                    }
                    
                    this.player2.velocityX = moveDirection * moveSpeed;
                } else {
                    this.player2.velocityX *= 0.5; // Quick deceleration
                    this.player2.npcState = 'ready';
                    console.log("NPC ready to hit!");
                }
                
                // Continuously update target position for better tracking
                this.player2.targetX = this.calculateOptimalPosition(futureX, futureY);
                break;
                
            case 'ready':
                // Enhanced ready state with better hit timing
                this.player2.velocityX *= 0.75; // Controlled deceleration
                
                // Fine positioning adjustments with appropriate tolerance
                const ballDistance = Math.abs(ballX - npcX);
                if (ballDistance < 250) { // Reasonable approach range
                    const adjustment = (ballX - npcX) * 0.4;
                    this.player2.velocityX += adjustment;
                }
                
                // Try to hit if close enough to the ball
                if (ballDistance < 220) { // Approach distance before attempting hit
                    console.log(`NPC attempting hit - distance: ${ballDistance}`);
                    const hitSuccess = this.npcHitVolleyball();
                    if (hitSuccess) {
                        console.log("NPC hit successful!");
                    } else {
                        console.log("NPC hit failed!");
                    }
                }
                
                // Much more lenient reset conditions
                if (this.volleyball.isOnGround()) {
                    console.log("Ball hit ground, ending rally");
                    this.endRally();
                }
                break;
                
            case 'waiting':
                // Return to neutral position
                this.player2.velocityX *= 0.92;
                const neutralX = this.engine.canvas.width * 0.75;
                const distanceToNeutral = neutralX - npcX;
                
                if (Math.abs(distanceToNeutral) > 30) {
                    this.player2.velocityX += Math.sign(distanceToNeutral) * 50;
                }
                break;
        }
        
        // Keep NPC in bounds
        const rightBound = this.engine.canvas.width - this.player2.width - 20;
        const leftBound = courtMiddle + 20;
        
        if (this.player2.x > rightBound) {
            this.player2.x = rightBound;
            this.player2.velocityX = Math.min(0, this.player2.velocityX);
        }
        if (this.player2.x < leftBound) {
            this.player2.x = leftBound;
            this.player2.velocityX = Math.max(0, this.player2.velocityX);
        }
    }
    
    calculateOptimalPosition(futureX, futureY) {
        const courtMiddle = this.engine.canvas.width / 2;
        const rightBound = this.engine.canvas.width - this.player2.width - 40;
        const leftBound = courtMiddle + 40;
        
        // Calculate where the ball will likely be when it reaches hitting height
        let optimalX = futureX;
        
        // Add strategic positioning based on ball speed and direction
        if (this.volleyball.velocityX > 200) {
            optimalX += 40; // Position ahead for fast balls
        } else if (this.volleyball.velocityX > 100) {
            optimalX += 20; // Slight positioning for medium speed
        }
        
        // Ensure the NPC stays in a good position to hit back
        const centerBias = (courtMiddle + rightBound) / 2;
        optimalX = optimalX * 0.7 + centerBias * 0.3; // Bias toward center
        
        // Keep within bounds with padding
        optimalX = Math.max(leftBound, Math.min(rightBound, optimalX));
        
        return optimalX;
    }
    
    endRally() {
        console.log(`Rally ending - Pass count: ${this.passCount}, Rally was in progress: ${this.rallyInProgress}`);
        
        // Check if we had a meaningful rally (2+ passes for more frequent sounds)
        if (this.passCount >= 2 && this.rallyInProgress) {
            console.log("Playing awh sound - rally ended!");
            this.soundPresets.rallyEnd();
            console.log(`Rally ended! Total passes: ${this.passCount}`);
        }
        
        // Reset game state
        this.player2.npcState = 'waiting';
        this.rallyInProgress = false;
        this.gameState = 'ready';
        this.passCount = 0;
    }
    
    npcHitVolleyball() {
        // Better NPC hit detection - check distance from NPC center to ball center
        const npcCenterX = this.player2.x + this.player2.width / 2;
        const npcCenterY = this.player2.y + this.player2.height / 2;
        const ballCenterX = this.volleyball.x + this.volleyball.width / 2;
        const ballCenterY = this.volleyball.y + this.volleyball.height / 2;
        
        const distance = Math.sqrt(
            (ballCenterX - npcCenterX) ** 2 + 
            (ballCenterY - npcCenterY) ** 2
        );
        
        console.log(`NPC HIT: Distance to ball: ${Math.round(distance)}`);
        
        if (distance < 200) { // Slightly more generous for NPC
            console.log("NPC HIT: Close enough, hitting ball!");
            
            // Send ball back to player side with smoother velocities
            this.volleyball.velocityX = -350 - Math.random() * 150; // Smoother speed to left
            this.volleyball.velocityY = -450 - Math.random() * 150; // Better arc
            this.volleyball.isMoving = true; // CRITICAL: Mark ball as moving
            this.volleyball.isInAir = true; // Mark ball as in air
            
            // Play animation and sound
            this.player2.playHitAnimation();
            this.soundPresets.volleyballPass();
            
            // Update counters and maintain rally
            this.passCount++;
            this.lastHitBy = 'npc';
            this.rallyInProgress = true; // Keep rally going
            
            // Reset NPC state
            this.player2.npcState = 'waiting';
            
            console.log(`NPC HIT: Success! Ball velocity: ${Math.round(this.volleyball.velocityX)}, ${Math.round(this.volleyball.velocityY)}, isMoving: ${this.volleyball.isMoving}, Rally: ${this.rallyInProgress}`);
            return true;
        } else {
            console.log("NPC HIT: Too far from ball");
            return false;
        }
    }
    
    passVolleyball(fromPlayer, toPlayer) {
        if (this.volleyball.isMoving) return;
        
        this.gameState = 'playing';
        this.passCount++;
        
        // Play hit animation on the passing player
        fromPlayer.playHitAnimation();
        
        // Calculate target position (slightly in front of the receiving player)
        const targetX = toPlayer.getCenterX() + (Math.random() - 0.5) * 40;
        const targetY = toPlayer.getCenterY() - 50;
        
        // Pass the volleyball
        this.volleyball.passToTarget(targetX, targetY);
        
        // Sound handled by main hit detection system
        
        // Update game state
        this.isPlayerTurn = !this.isPlayerTurn;
        this.lastPassTime = Date.now();
        
        // Temporarily disable interactions
        this.player1.setInteractable(false);
        
        // Schedule re-enabling interactions and AI response
        setTimeout(() => {
            this.onVolleyballLanded(toPlayer);
        }, 1000);
        
        console.log(`Pass #${this.passCount}: ${fromPlayer.characterData.name} → ${toPlayer.characterData.name}`);
    }
    
    onVolleyballLanded(receivingPlayer) {
        // Play receiving animation
        receivingPlayer.playHitAnimation();
        
        // Reset volleyball scale
        this.volleyball.targetScale = 1;
        
        if (receivingPlayer === this.player2) {
            // AI player received the ball - schedule AI response
            setTimeout(() => {
                if (this.gameState === 'playing') {
                    this.aiPass();
                }
            }, this.passDelay + Math.random() * 1000); // Add some randomness
        } else {
            // Human player received the ball
            this.player1.setInteractable(true);
            this.gameState = 'ready';
        }
    }
    
    aiPass() {
        if (this.volleyball.isMoving) return;
        
        // AI automatically passes back to player
        this.passVolleyball(this.player2, this.player1);
    }
    
    update(deltaTime) {
        // Let the engine handle basic updates
        // Add any additional game-specific logic here
        
        // Update NPC behavior
        this.updateNPC(deltaTime);
        
        // Check for rally end conditions globally
        this.checkRallyEnd();
        
        // Check if we need to update UI or game state
        this.updateUI();
    }
    
    checkRallyEnd() {
        // Global check for rally end - covers all scenarios
        if (this.rallyInProgress && this.volleyball.isOnGround()) {
            console.log("Global rally end check triggered - ball hit ground");
            this.endRally();
        }
    }
    
    updateUI() {
        // Update HUD title with selected character
        const hudElement = document.querySelector('.hud');
        if (hudElement && this.player1) {
            const titleDiv = hudElement.children[0];
            if (titleDiv) {
                titleDiv.textContent = `Beach Volleyball with ${this.player1.characterData.name}`;
            }
            
            const infoDiv = hudElement.children[3] || hudElement.appendChild(document.createElement('div'));
            
            if (this.gameState === 'loading') {
                infoDiv.textContent = 'Loading volleyball court...';
            } else if (this.gameState === 'serving') {
                infoDiv.textContent = `${this.playerConfig.playerName}, ready to serve! Get close to the ball and press Space. Passes: ${this.passCount}`;
            } else if (this.gameState === 'ready') {
                infoDiv.textContent = `${this.playerConfig.playerName} - Move and press Space to bump/set. Passes: ${this.passCount}`;
            } else if (this.gameState === 'playing') {
                infoDiv.textContent = `${this.playerConfig.playerName} - Rally in progress! Passes: ${this.passCount}`;
            }
        }
    }
    
    showErrorMessage() {
        const hudElement = document.querySelector('.hud');
        if (hudElement) {
            const errorDiv = hudElement.appendChild(document.createElement('div'));
            errorDiv.textContent = 'Error loading game assets. Please check console for details.';
            errorDiv.style.color = 'red';
        }
    }
    
    // Methods for future extensibility
    addNewCharacter(characterType, position) {
        // Future method to add different characters
        console.log(`Adding new character: ${characterType} at position:`, position);
    }
    
    enableMultiplayer() {
        // Future method to enable multiplayer functionality
        console.log('Multiplayer mode would be enabled here');
    }
    
    changeGameMode(mode) {
        // Future method to change between different game modes
        console.log(`Changing to game mode: ${mode}`);
    }
    
    // Debug methods
    toggleDebugMode() {
        // Future debugging tools
        console.log('Debug mode toggled');
    }
    
    resetGame() {
        this.passCount = 0;
        this.isPlayerTurn = true;
        this.gameState = 'ready';
        
        if (this.volleyball) {
            this.volleyball.reset(
                this.engine.canvas.width / 2 - 20,
                this.groundLevel - 150
            );
        }
        
        if (this.player1) {
            this.player1.x = 100;
            this.player1.y = this.groundLevel - 100;
            this.player1.velocityX = 0;
            this.player1.velocityY = 0;
        }
        
        if (this.player2) {
            this.player2.x = this.engine.canvas.width - 200;
            this.player2.y = this.groundLevel - 100;
            this.player2.velocityX = 0;
            this.player2.velocityY = 0;
            this.player2.npcState = 'waiting';
            this.player2.npcTimer = 0;
        }
        
        this.updateUI();
    }
}

// Initialize and start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the menu manager first
    const menuManager = new MenuManager();
    
    // Set up the game start callback
    menuManager.gameStartCallback = (config) => {
        startBeachVolleyball(config);
    };
    
    // Start background rendering immediately
    initializeGameBackground();
    
    console.log('🏐 Beach Volleyball Game Loaded! 🏐');
});

// Function to initialize just the background
function initializeGameBackground() {
    const gameEngine = new GameEngine('gameCanvas');
    
    // Load the background image
    const bgImage = new Image();
    bgImage.onload = () => {
        gameEngine.images.set('background', bgImage);
        
        let backgroundRunning = true;
        
        // Start the background rendering loop
        function renderBackground() {
            if (!backgroundRunning) return; // Stop if game has started
            
            gameEngine.ctx.clearRect(0, 0, gameEngine.canvas.width, gameEngine.canvas.height);
            gameEngine.drawBackground();
            requestAnimationFrame(renderBackground);
        }
        
        renderBackground();
        
        // Stop background when game starts
        window.stopBackgroundLoop = () => {
            backgroundRunning = false;
        };
    };
    bgImage.src = 'images/BeachBG.png';
}

// Function called by menu to start the actual game
function startBeachVolleyball(config) {
    console.log('startBeachVolleyball called with:', config);
    
    // Prevent multiple game starts
    if (window.game && window.game.gameState !== 'menu') {
        console.log('Game already running, ignoring duplicate start request');
        return;
    }
    
    // Stop any existing game first
    if (window.game && window.game.engine) {
        window.game.engine.stop();
        window.game = null;
    }
    
    // Stop background loop
    if (window.stopBackgroundLoop) {
        window.stopBackgroundLoop();
    }
    
    try {
        const game = new BeachVolleyballGame();
        game.playerConfig = config;
        
        // Make game accessible globally immediately
        window.game = game;
        
        // Clear any existing game objects from the engine
        game.engine.gameObjects = [];
        
        // Initialize the full game
        game.initialize().then(() => {
            console.log('Game initialization complete');
            console.log('Game started successfully with config:', config);
        }).catch(error => {
            console.error('Error starting game:', error);
            // Show error in HUD
            const hudElement = document.querySelector('.hud');
            if (hudElement) {
                const errorDiv = document.createElement('div');
                errorDiv.textContent = `Error: ${error.message}`;
                errorDiv.style.color = 'red';
                hudElement.appendChild(errorDiv);
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'r':
                case 'R':
                    if (game.resetGame) game.resetGame();
                    break;
                case 'm':
                case 'M':
                    if (soundManager && soundManager.setMuted) {
                        soundManager.setMuted(!soundManager.muted);
                    }
                    break;
            }
        });
    } catch (error) {
        console.error('Error in startBeachVolleyball:', error);
    }
}

// Make the function globally accessible
window.startBeachVolleyball = startBeachVolleyball;
