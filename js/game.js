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
        
        // Set up NPC behavior for player2
        this.player2.setInteractable(false);
        this.player2.isNPC = true;
        this.player2.npcState = 'ready';
        this.player2.npcTimer = 0;
        this.player2.moveSpeed = 300;
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
            
            // Trigger NPC reaction
            if (side === 'player') {
                this.startNPCReaction();
            }
        }
    }
    
    startNPCReaction() {
        this.player2.npcState = 'tracking';
        this.player2.npcTimer = 0;
        this.player2.reactionDelay = 300 + Math.random() * 400; // Quick reaction
    }
    
    updateNPC(deltaTime) {
        if (!this.player2.isNPC) return;
        
        this.player2.npcTimer += deltaTime;
        const dt = deltaTime / 1000;
        const courtMiddle = this.engine.canvas.width / 2;
        const ballX = this.volleyball.x + this.volleyball.width / 2;
        const ballY = this.volleyball.y + this.volleyball.height / 2;
        
        switch (this.player2.npcState) {
            case 'tracking':
                // Watch the ball and start moving when it's coming
                if (this.player2.npcTimer > this.player2.reactionDelay) {
                    if (ballX > courtMiddle - 100 && this.volleyball.velocityX > 0) {
                        this.player2.npcState = 'moving';
                    }
                }
                break;
                
            case 'moving':
                // Move to intercept the ball
                const targetX = this.predictBallPosition();
                const npcX = this.player2.getCenterX();
                const distanceToTarget = targetX - npcX;
                
                if (Math.abs(distanceToTarget) > 30) {
                    this.player2.velocityX = Math.sign(distanceToTarget) * this.player2.moveSpeed;
                } else {
                    this.player2.velocityX *= 0.7; // Slow down when close
                    this.player2.npcState = 'ready';
                }
                break;
                
            case 'ready':
                // Ready to hit
                this.player2.velocityX *= 0.8; // Gentle stop
                
                if (this.canPlayerHit(this.player2)) {
                    this.npcHitVolleyball();
                }
                
                // Reset if ball goes away or lands
                if (this.volleyball.isOnGround() || ballX < courtMiddle - 150) {
                    this.player2.npcState = 'waiting';
                    this.rallyInProgress = false;
                    this.gameState = 'ready';
                }
                break;
                
            case 'waiting':
                // Just chill and wait
                this.player2.velocityX *= 0.9;
                break;
        }
    }
    
    predictBallPosition() {
        // Simple prediction where ball will be
        const ballX = this.volleyball.x + this.volleyball.width / 2;
        const velX = this.volleyball.velocityX;
        
        if (velX > 0) {
            // Predict where ball will be in 1 second
            const futureX = ballX + velX * 1.0;
            return Math.max(this.engine.canvas.width / 2 + 50, 
                   Math.min(this.engine.canvas.width - 180, futureX));
        }
        
        return this.player2.x; // Stay put
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
