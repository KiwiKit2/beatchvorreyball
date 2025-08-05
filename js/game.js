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
        
        // Multiplayer properties
        this.isMultiplayer = false;
        this.isHost = false;
        this.opponentId = null;
        
        // Performance optimization
        this.lastSyncTime = 0;
        this.syncInterval = 33; // Sync every 33ms (30fps sync for smoother feel)
        this.frameCount = 0;
        
        // Simplified multiplayer sync
        this.lastLocalHit = 0;
        this.hitCooldown = 500; // 500ms before accepting remote ball updates after local hit
        
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
        
        if (this.playerConfig.mode === 'local-multiplayer') {
            // Local multiplayer mode - 2 human players
            this.player1 = new Character(120, this.groundLevel - 180, this.playerConfig.character, true, 1);
            this.player2 = new Character(this.engine.canvas.width - 300, this.groundLevel - 180, this.playerConfig.character, true, 2);
            
        } else if (this.playerConfig.mode === 'online-multiplayer') {
            // Online multiplayer mode
            this.isMultiplayer = true;
            this.isHost = multiplayerManager.isHost;
            
            if (this.isHost) {
                // Host is player 1 (left side)
                this.player1 = new Character(120, this.groundLevel - 180, this.playerConfig.character, true, 1);
                this.player2 = new Character(this.engine.canvas.width - 300, this.groundLevel - 180, this.playerConfig.character, false, 2);
            } else {
                // Guest is player 2 (right side)
                this.player1 = new Character(120, this.groundLevel - 180, this.playerConfig.character, false, 1);
                this.player2 = new Character(this.engine.canvas.width - 300, this.groundLevel - 180, this.playerConfig.character, true, 2);
            }
            
        } else {
            // Regular 1v1 vs AI mode
            this.player1 = new Character(120, this.groundLevel - 180, this.playerConfig.character, true, 1);
            this.player2 = new Character(this.engine.canvas.width - 300, this.groundLevel - 180, this.playerConfig.character, false, 1);
        }
        
        // Set ground level for all characters
        this.player1.setGroundLevel(this.groundLevel);
        this.player2.setGroundLevel(this.groundLevel);
        
        // Add objects to engine
        this.engine.addGameObject(this.player1);
        this.engine.addGameObject(this.player2);
        
        // Create volleyball in starting position
        this.volleyball = new Volleyball(
            this.player1.getCenterX() + 50,
            this.groundLevel - 140 // Start volleyball higher for larger characters
        );
        this.volleyball.setGroundLevel(this.groundLevel);
        
        this.engine.addGameObject(this.volleyball);
        
        console.log('Created game objects:', this.engine.gameObjects.length);
    }
    
    setupGameLogic() {
        // Start with a simple serve
        this.gameState = 'ready';
        this.rallyInProgress = false;
        this.lastHitBy = null;
        
        if (this.playerConfig.mode === 'local-multiplayer') {
            // Local multiplayer mode setup - both players are human
            this.player1.setInteractable(true);
            this.player1.onHitVolleyball = () => {
                console.log("SIMPLE HIT: Player 1 trying to hit volleyball");
                this.tryPlayerHit(this.player1, 'player1');
            };
            
            this.player2.setInteractable(true);
            this.player2.onHitVolleyball = () => {
                console.log("SIMPLE HIT: Player 2 trying to hit volleyball");
                this.tryPlayerHit(this.player2, 'player2');
            };
            
        } else if (this.playerConfig.mode === 'online-multiplayer') {
            // Online multiplayer mode setup
            if (this.isHost) {
                // Host controls player1
                this.player1.setInteractable(true);
                this.player1.onHitVolleyball = () => {
                    console.log("ONLINE HIT: Host hitting volleyball");
                    this.tryPlayerHit(this.player1, 'host');
                };
                this.player2.setInteractable(false);
            } else {
                // Guest controls player2
                this.player1.setInteractable(false);
                this.player2.setInteractable(true);
                this.player2.onHitVolleyball = () => {
                    console.log("ONLINE HIT: Guest hitting volleyball");
                    this.tryPlayerHit(this.player2, 'guest');
                };
            }
            
            // Setup multiplayer sync
            this.setupMultiplayerSync();
            
        } else {
            // Regular 1v1 vs AI mode setup
            this.player1.setInteractable(true);
            this.player1.onHitVolleyball = () => {
                console.log("SIMPLE HIT: Player trying to hit volleyball");
                this.tryPlayerHit(this.player1, 'player');
            };
            
            // Set up NPC for player2
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
    }
    
    setupMultiplayerSync() {
        if (!this.isMultiplayer) return;
        
        // Listen for game state updates from opponent
        multiplayerManager.onGameStateUpdate((gameState) => {
            const currentTime = performance.now();
            
            // Apply ball updates with intelligent filtering
            if (gameState.ball) {
                // Only apply remote ball updates if we haven't hit recently
                const timeSinceLocalHit = currentTime - this.lastLocalHit;
                
                if (timeSinceLocalHit > this.hitCooldown) {
                    // Aggressive interpolation for smoother sync
                    const lerpFactor = 0.6; // Strong interpolation for responsiveness
                    
                    this.volleyball.x = lerp(this.volleyball.x, gameState.ball.x, lerpFactor);
                    this.volleyball.y = lerp(this.volleyball.y, gameState.ball.y, lerpFactor);
                    this.volleyball.velocityX = lerp(this.volleyball.velocityX, gameState.ball.velocityX, lerpFactor);
                    this.volleyball.velocityY = lerp(this.volleyball.velocityY, gameState.ball.velocityY, lerpFactor);
                    this.volleyball.isMoving = gameState.ball.isMoving;
                } else {
                    // Light interpolation only for position during hit cooldown
                    const lightLerp = 0.1;
                    this.volleyball.x = lerp(this.volleyball.x, gameState.ball.x, lightLerp);
                    this.volleyball.y = lerp(this.volleyball.y, gameState.ball.y, lightLerp);
                }
            }
            
            // Smooth interpolation for opponent player position
            const playerLerpFactor = 0.7; // More responsive for players
            
            if (this.isHost && gameState.player2) {
                this.player2.x = lerp(this.player2.x, gameState.player2.x, playerLerpFactor);
                this.player2.y = lerp(this.player2.y, gameState.player2.y, playerLerpFactor);
                this.player2.velocityX = lerp(this.player2.velocityX, gameState.player2.velocityX, playerLerpFactor);
                this.player2.velocityY = lerp(this.player2.velocityY, gameState.player2.velocityY, playerLerpFactor);
            } else if (!this.isHost && gameState.player1) {
                this.player1.x = lerp(this.player1.x, gameState.player1.x, playerLerpFactor);
                this.player1.y = lerp(this.player1.y, gameState.player1.y, playerLerpFactor);
                this.player1.velocityX = lerp(this.player1.velocityX, gameState.player1.velocityX, playerLerpFactor);
                this.player1.velocityY = lerp(this.player1.velocityY, gameState.player1.velocityY, playerLerpFactor);
            }
        });
    }
    
    syncGameState() {
        if (!this.isMultiplayer) return;
        
        // Throttle sync rate for performance
        const currentTime = performance.now();
        if (currentTime - this.lastSyncTime < this.syncInterval) {
            return;
        }
        this.lastSyncTime = currentTime;
        
        const updates = {
            ball: {
                x: Math.round(this.volleyball.x),
                y: Math.round(this.volleyball.y),
                velocityX: Math.round(this.volleyball.velocityX),
                velocityY: Math.round(this.volleyball.velocityY),
                isMoving: this.volleyball.isMoving
            }
        };
        
        // Sync our player position
        if (this.isHost) {
            updates.player1 = {
                x: Math.round(this.player1.x),
                y: Math.round(this.player1.y),
                velocityX: Math.round(this.player1.velocityX),
                velocityY: Math.round(this.player1.velocityY)
            };
        } else {
            updates.player2 = {
                x: Math.round(this.player2.x),
                y: Math.round(this.player2.y),
                velocityX: Math.round(this.player2.velocityX),
                velocityY: Math.round(this.player2.velocityY)
            };
        }
        
        multiplayerManager.updateGameState(updates);
    }
    
    tryPlayerHit(player, playerType) {
        // Better hit detection - check distance from player center to ball center
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const ballCenterX = this.volleyball.x + this.volleyball.width / 2;
        const ballCenterY = this.volleyball.y + this.volleyball.height / 2;
        
        const distance = Math.sqrt(
            (ballCenterX - playerCenterX) ** 2 + 
            (ballCenterY - playerCenterY) ** 2
        );
        
        console.log(`SIMPLE HIT: Distance to ball: ${Math.round(distance)} by ${playerType}`);
        
        if (distance < 180) { // Balanced hitting distance - not too far, not too close
            console.log("SIMPLE HIT: Close enough, hitting ball!");
            
            // Mark local hit time for sync filtering
            if (this.isMultiplayer) {
                this.lastLocalHit = performance.now();
                console.log('Local hit registered, filtering remote updates');
            }
            
            // Determine ball direction based on which player hit it
            let ballDirectionX = 350 + Math.random() * 150;
            if (this.playerConfig.mode === 'local-multiplayer') {
                // In local multiplayer, player1 hits to the right, player2 hits to the left
                if (playerType === 'player1') {
                    ballDirectionX = 350 + Math.random() * 150; // Hit to the right
                } else if (playerType === 'player2') {
                    ballDirectionX = -350 - Math.random() * 150; // Hit to the left
                }
            } else if (this.playerConfig.mode === 'online-multiplayer') {
                // In online multiplayer, host hits to the right, guest hits to the left
                if (playerType === 'host') {
                    ballDirectionX = 350 + Math.random() * 150; // Hit to the right
                } else if (playerType === 'guest') {
                    ballDirectionX = -350 - Math.random() * 150; // Hit to the left
                }
            } else {
                // In vs AI mode, player always hits to the right
                ballDirectionX = 350 + Math.random() * 150;
            }
            
            // Direct ball hitting - smoother velocities
            this.volleyball.velocityX = ballDirectionX;
            this.volleyball.velocityY = -450 - Math.random() * 150; // Better arc
            this.volleyball.isMoving = true; // CRITICAL: Mark ball as moving
            this.volleyball.isInAir = true; // Mark ball as in air
            
            // Play animation and sound
            player.playHitAnimation();
            this.soundPresets.volleyballPass();
            
            // Update counters and start rally
            this.passCount++;
            this.lastHitBy = playerType;
            this.rallyInProgress = true; // CRITICAL: Start rally tracking!
            
            // Start NPC reaction only if there's an NPC
            if (this.playerConfig.mode === 'vs-npc' && this.player2.isNPC) {
                this.startAdvancedNPCReaction(this.player2);
            }
            
            console.log(`SIMPLE HIT: Success! Ball velocity: ${Math.round(this.volleyball.velocityX)}, ${Math.round(this.volleyball.velocityY)}, isMoving: ${this.volleyball.isMoving}, Rally: ${this.rallyInProgress}`);
            return true;
        } else {
            console.log("SIMPLE HIT: Too far from ball");
            return false;
        }
    }
    
    startAdvancedNPCReaction(npcPlayer) {
        npcPlayer.npcState = 'tracking';
        npcPlayer.npcTimer = 0;
        npcPlayer.reactionTime = 50 + Math.random() * 100;
        npcPlayer.anticipation = Math.random() * 0.3;
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
        
        // Update NPC behavior (only for vs-npc mode)
        if (this.playerConfig.mode === 'vs-npc') {
            this.updateNPC(deltaTime);
        }
        
        // Sync multiplayer game state
        if (this.isMultiplayer) {
            this.syncGameState();
        }
        
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
        // Update controls text based on game mode
        const controlsElement = document.getElementById('controlsText');
        if (controlsElement && this.playerConfig) {
            if (this.playerConfig.mode === 'local-multiplayer') {
                controlsElement.textContent = 'P1: WASD + Space | P2: Arrows + Enter';
            } else if (this.playerConfig.mode === 'online-multiplayer') {
                if (this.isHost) {
                    controlsElement.textContent = 'You (Host): WASD + Space';
                } else {
                    controlsElement.textContent = 'You (Guest): Arrows + Enter';
                }
            } else {
                controlsElement.textContent = 'WASD to move and Space to jump + bump';
            }
        }
        
        // Keep HUD simple - just show basic controls
        const hudElement = document.querySelector('.hud');
        if (hudElement && this.player1) {
            // Hide title (first div)
            const titleDiv = hudElement.children[0];
            if (titleDiv) {
                titleDiv.style.display = 'none';
            }
            
            // Hide reset/mute instructions (third div)
            const resetDiv = hudElement.children[2];
            if (resetDiv) {
                resetDiv.style.display = 'none';
            }
            
            // Remove any dynamic info div that might have been added
            const infoDiv = hudElement.children[3];
            if (infoDiv) {
                infoDiv.style.display = 'none';
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
