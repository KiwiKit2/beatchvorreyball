// Main Game Logic
class BeachVolleyballGame {
    constructor() {
        this.engine = new GameEngine('gameCanvas');
        this.gameState = 'loading'; // loading, ready, playing, paused
        this.soundPresets = null;
        
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
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Load all images
            await this.loadAssets();
            
            // Initialize sound manager
            await soundManager.initialize();
            this.soundPresets = soundManager.createSoundPresets();
            
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
            this.showErrorMessage();
        }
    }
    
    async loadAssets() {
        // Load images
        const imagesToLoad = [
            { src: 'images/BeachBG.png', key: 'background' },
            { src: 'images/donQ.png', key: 'donQ' },
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
            }
        ];
        
        await soundManager.loadAllSounds(soundsToLoad);
    }
    
    createGameObjects() {
        // Calculate ground level based on screen height
        this.groundLevel = (this.engine.canvas.height * 0.75); // Higher ground
        
        // Create bigger player characters
        this.player1 = new Character(120, this.groundLevel - 140, 'donQ', true);
        this.player2 = new Character(this.engine.canvas.width - 260, this.groundLevel - 140, 'donQ', false);
        
        // Set ground level for characters
        this.player1.setGroundLevel(this.groundLevel);
        this.player2.setGroundLevel(this.groundLevel);
        
        // Create volleyball in starting position
        this.volleyball = new Volleyball(
            this.player1.getCenterX() + 50,
            this.groundLevel - 100
        );
        this.volleyball.setGroundLevel(this.groundLevel);
        
        // Add objects to engine
        this.engine.addGameObject(this.player1);
        this.engine.addGameObject(this.player2);
        this.engine.addGameObject(this.volleyball);
    }
    
    setupGameLogic() {
        // Start with a simple serve
        this.gameState = 'ready';
        this.rallyInProgress = false;
        this.lastHitBy = null;
        
        // Override player1's volleyball hitting
        this.player1.onHitVolleyball = () => {
            if (this.canPlayerHit(this.player1)) {
                this.onVolleyballHit(this.player1, 'player');
            }
        };
        
        // Set up enhanced NPC behavior for player2
        this.player2.setInteractable(false);
        this.player2.isNPC = true;
        this.player2.npcState = 'ready';
        this.player2.npcTimer = 0;
        this.player2.moveSpeed = 450; // Faster movement
        this.player2.reactionTime = 150; // Quick reactions
        this.player2.anticipation = 0; // Predictive movement
        this.player2.skillLevel = 0.8; // High skill level
    }
    
    canPlayerHit(player) {
        // Simple volleyball rules: can hit when ball is close and not moving too fast
        const distance = this.volleyball.isNearCharacter(player, 160);
        const notTooFast = Math.abs(this.volleyball.velocityY) < 600;
        const ballLowEnough = this.volleyball.y > this.groundLevel - 300; // Don't hit when too high
        
        return distance && notTooFast && ballLowEnough;
    }
    
    onVolleyballHit(player, side) {
        if (this.volleyball.hitFromCharacter(player)) {
            player.playHitAnimation();
            
            // Play both hit and voice sounds together
            this.soundPresets.volleyballPass();
            
            this.passCount++;
            this.lastHitBy = side;
            this.rallyInProgress = true;
            this.gameState = 'rally';
            
            console.log(`${side} hit! Rally continues - passes: ${this.passCount}`);
            
            // Enhanced NPC reaction for smoother gameplay
            if (side === 'player') {
                this.startAdvancedNPCReaction();
            } else {
                // When NPC hits, give player a moment to get ready
                setTimeout(() => {
                    this.gameState = 'ready';
                }, 200);
            }
        }
    }
    
    startAdvancedNPCReaction() {
        this.player2.npcState = 'tracking';
        this.player2.npcTimer = 0;
        this.player2.reactionTime = 100 + Math.random() * 150; // Very quick reactions
        this.player2.anticipation = Math.random() * 0.3; // Add some prediction
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
        
        switch (this.player2.npcState) {
            case 'tracking':
                // Advanced tracking with anticipation
                if (this.player2.npcTimer > this.player2.reactionTime) {
                    // Check if ball is coming to NPC's side
                    if (ballX > courtMiddle - 80 && ballVelX > 0) {
                        this.player2.npcState = 'positioning';
                        this.player2.targetX = this.calculateOptimalPosition(futureX, futureY);
                    }
                }
                break;
                
            case 'positioning':
                // Smart positioning with prediction
                const distanceToTarget = this.player2.targetX - npcX;
                
                if (Math.abs(distanceToTarget) > 20) {
                    // Move toward optimal position
                    const moveDirection = Math.sign(distanceToTarget);
                    this.player2.velocityX = moveDirection * this.player2.moveSpeed;
                    
                    // Dynamic speed adjustment based on urgency
                    const ballDistance = Math.abs(ballX - npcX);
                    if (ballDistance < 200) {
                        this.player2.velocityX *= 1.5; // Speed up when ball is close
                    }
                } else {
                    this.player2.velocityX *= 0.6; // Smooth deceleration
                    this.player2.npcState = 'ready';
                }
                
                // Update target position continuously
                this.player2.targetX = this.calculateOptimalPosition(futureX, futureY);
                break;
                
            case 'ready':
                // Enhanced ready state with micro-adjustments
                this.player2.velocityX *= 0.85;
                
                // Fine positioning adjustments
                const ballDistance = Math.abs(ballX - npcX);
                if (ballDistance < 150 && ballVelX > 0) {
                    const adjustment = (ballX - npcX) * 0.3;
                    this.player2.velocityX += adjustment;
                }
                
                // Check for hit opportunity with better timing
                if (this.canNPCHit()) {
                    this.npcHitVolleyball();
                }
                
                // Reset conditions
                if (this.volleyball.isOnGround() || ballX < courtMiddle - 150 || ballVelX < -100) {
                    this.player2.npcState = 'waiting';
                    this.rallyInProgress = false;
                    this.gameState = 'ready';
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
        const rightBound = this.engine.canvas.width - this.player2.width - 50;
        const leftBound = courtMiddle + 50;
        
        // Calculate where the ball will likely be when it reaches hitting height
        let optimalX = futureX;
        
        // Add some strategic positioning
        if (this.volleyball.velocityX > 300) {
            optimalX += 30; // Position slightly ahead for fast balls
        }
        
        // Keep within bounds
        optimalX = Math.max(leftBound, Math.min(rightBound, optimalX));
        
        return optimalX;
    }
    
    canNPCHit() {
        const ballDistance = this.volleyball.isNearCharacter(this.player2, 140);
        const ballHeight = this.volleyball.y + this.volleyball.height;
        const courtHeight = this.groundLevel;
        const ballNotTooHigh = ballHeight > courtHeight - 250;
        const ballNotTooFast = Math.abs(this.volleyball.velocityY) < 700;
        const ballInRange = Math.abs(this.volleyball.velocityX) > 50; // Ball must be moving
        
        return ballDistance && ballNotTooHigh && ballNotTooFast && ballInRange;
    }
    
    npcHitVolleyball() {
        if (this.volleyball.hitFromCharacter(this.player2)) {
            this.player2.playHitAnimation();
            
            // Play both hit and voice sounds together
            this.soundPresets.volleyballPass();
            
            this.passCount++;
            this.lastHitBy = 'npc';
            console.log(`NPC hit! Rally continues - passes: ${this.passCount}`);
            
            // Reset NPC state
            this.player2.npcState = 'waiting';
            this.player2.npcTimer = 0;
            
            // Keep rally going
            this.gameState = 'ready';
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
        
        // Play sound effects
        this.soundPresets.volleyballPass();
        
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
        
        // Check if we need to update UI or game state
        this.updateUI();
    }
    
    updateUI() {
        // Update any UI elements (could be extended for score, etc.)
        const hudElement = document.querySelector('.hud');
        if (hudElement) {
            const infoDiv = hudElement.children[3] || hudElement.appendChild(document.createElement('div'));
            
            if (this.gameState === 'loading') {
                infoDiv.textContent = 'Loading volleyball court...';
            } else if (this.gameState === 'serving') {
                infoDiv.textContent = `Ready to serve! Get close to the ball and press Space. Passes: ${this.passCount}`;
            } else if (this.gameState === 'ready') {
                infoDiv.textContent = `Volleyball ready! Move and press Space to bump/set. Passes: ${this.passCount}`;
            } else if (this.gameState === 'playing') {
                infoDiv.textContent = `Volleyball in play! Passes: ${this.passCount}`;
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
    const game = new BeachVolleyballGame();
    
    // Make game accessible globally for debugging
    window.game = game;
    
    // Add keyboard shortcuts for future features
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'r':
            case 'R':
                game.resetGame();
                break;
            case 'm':
            case 'M':
                soundManager.setMuted(!soundManager.muted);
                break;
        }
    });
    
    console.log('🏐 Limbus Company Beach Volleyball Game Started! 🏐');
    console.log('Controls:');
    console.log('- Click on left Don Quixote to pass volleyball');
    console.log('- Press R to reset game');
    console.log('- Press M to toggle mute');
});
