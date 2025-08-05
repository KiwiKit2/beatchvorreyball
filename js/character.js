// Character class - Extensible for different characters
class Character {
    constructor(x, y, characterType = 'donQ', isPlayer = true) {
        this.x = x;
        this.y = y;
        this.width = 220; // Even larger characters
        this.height = 220;
        this.characterType = characterType;
        this.isPlayer = isPlayer;
        this.zIndex = 2;
        
        // Movement properties - Enhanced for better feel
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 420; // Faster movement
        this.jumpPower = -650; // Stronger jump
        this.gravity = 1800;
        this.onGround = true;
        this.groundY = 0;
        this.acceleration = 1200; // Quick acceleration
        this.friction = 0.88; // Better stopping
        
        // Animation properties
        this.scale = 1;
        this.targetScale = 1;
        this.rotation = 0;
        this.isAnimating = false;
        this.animationTime = 0;
        this.animationOffsetY = 0; // For smoother hit animations
        
        // Interaction properties
        this.isHovered = false;
        this.canInteract = true;
        
        // Character-specific properties (extensible for future characters)
        this.characterData = this.getCharacterData(characterType);
    }
    
    getCharacterData(type) {
        const characterDatabase = {
            'donQ': {
                imageKey: 'donQ',
                name: 'Don Quixote',
                idleAnimation: 'default',
                hitAnimation: 'excited',
                color: '#FFD700'
            },
            'ryoshu': {
                imageKey: 'ryoshu',
                name: 'Ryoshu',
                idleAnimation: 'default',
                hitAnimation: 'excited',
                color: '#DC143C'
            },
            'ideal': {
                imageKey: 'ideal',
                name: 'Ideal',
                idleAnimation: 'default',
                hitAnimation: 'excited',
                color: '#4169E1'
            }
            // Future characters can be added here:
            // 'sinclair': { ... },
            // 'ishmael': { ... }
        };
        
        return characterDatabase[type] || characterDatabase['donQ'];
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Handle player movement
        if (this.isPlayer && this.engine) {
            this.handleMovement(dt);
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.velocityY += this.gravity * dt;
        }
        
        // Update position
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        
        // Ground collision
        if (this.y + this.height >= this.groundY) {
            this.y = this.groundY - this.height;
            this.velocityY = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Keep within screen bounds
        this.x = Math.max(0, Math.min(this.x, this.engine?.canvas.width - this.width || 800));
        
        // Apply friction
        this.velocityX *= 0.85;
        
        // Handle enhanced animations
        if (this.isAnimating && this.currentAnimation) {
            this.animationTime += deltaTime;
            const totalDuration = this.currentAnimation.duration * 1000; // Convert to ms
            
            if (this.animationTime < totalDuration) {
                const progress = this.animationTime / totalDuration;
                
                // Interpolate through animation sequences
                const seqLength = this.currentAnimation.scaleSequence.length;
                const exactIndex = progress * (seqLength - 1);
                const animIndex = Math.floor(exactIndex);
                const nextIndex = Math.min(animIndex + 1, seqLength - 1);
                const localProgress = exactIndex - animIndex;
                
                // Smooth interpolation between keyframes
                this.scale = lerp(
                    this.currentAnimation.scaleSequence[animIndex],
                    this.currentAnimation.scaleSequence[nextIndex],
                    localProgress
                );
                
                this.animationOffsetY = lerp(
                    this.currentAnimation.offsetSequence[animIndex],
                    this.currentAnimation.offsetSequence[nextIndex],
                    localProgress
                );
                
                this.rotation = lerp(
                    this.currentAnimation.rotationSequence[animIndex],
                    this.currentAnimation.rotationSequence[nextIndex],
                    localProgress
                );
            } else {
                // Animation finished - return to normal
                this.isAnimating = false;
                this.scale = 1;
                this.animationOffsetY = 0;
                this.rotation = 0;
                this.currentAnimation = null;
            }
        } else if (this.isAnimating) {
            // Fallback to simple animation if no currentAnimation
            this.animationTime += deltaTime;
            
            if (this.animationTime < 300) {
                const progress = this.animationTime / 300;
                const jumpProgress = Math.sin(progress * Math.PI);
                
                this.animationOffsetY = -jumpProgress * 15;
                this.scale = lerp(1, 1.15, jumpProgress);
                this.rotation = jumpProgress * 0.1;
            } else if (this.animationTime < 600) {
                const returnProgress = (this.animationTime - 300) / 300;
                const easeOut = 1 - Math.pow(1 - returnProgress, 3);
                
                this.animationOffsetY = lerp(-15, 0, easeOut);
                this.scale = lerp(1.15, 1, easeOut);
                this.rotation = lerp(0.1, 0, easeOut);
            } else {
                this.isAnimating = false;
                this.animationTime = 0;
                this.animationOffsetY = 0;
                this.scale = 1;
                this.rotation = 0;
            }
        } else {
            // Ensure animation values are reset
            this.animationOffsetY = this.animationOffsetY || 0;
        }
    }
    
    handleMovement(dt) {
        // Arrow key movement
        if (this.engine.isKeyPressed('arrowleft') || this.engine.isKeyPressed('a')) {
            this.velocityX = -this.speed;
        }
        if (this.engine.isKeyPressed('arrowright') || this.engine.isKeyPressed('d')) {
            this.velocityX = this.speed;
        }
        
        // Jump
        if ((this.engine.isKeyPressed('arrowup') || this.engine.isKeyPressed('w') || this.engine.isKeyPressed(' ')) && this.onGround) {
            this.velocityY = this.jumpPower;
            this.onGround = false;
        }
    }
    
    handleKeyDown(key, code) {
        // Handle space bar for hitting volleyball
        if ((key === ' ' || code === 'Space') && this.isPlayer) {
            console.log(`SIMPLE KEYDOWN: ${this.characterData.name} space pressed`);
            this.hitVolleyball();
        }
    }

    hitVolleyball() {
        // Super simple hit detection
        console.log(`SIMPLE HIT: ${this.characterData.name} trying to hit`);
        if (this.onHitVolleyball) {
            console.log(`SIMPLE HIT: ${this.characterData.name} calling callback`);
            this.onHitVolleyball();
        } else {
            console.log(`SIMPLE HIT: ${this.characterData.name} no callback set`);
        }
    }    setGroundLevel(groundY) {
        this.groundY = groundY;
    }
    
    render(ctx) {
        const image = this.engine?.getImage(this.characterData.imageKey);
        
        ctx.save();
        
        // Apply transformations with animation offset
        const renderY = this.y + (this.animationOffsetY || 0);
        ctx.translate(this.x + this.width / 2, renderY + this.height / 2);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.rotation);
        
        // Draw character image
        if (image) {
            ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback rectangle with character color
            ctx.fillStyle = this.characterData.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            // Add text label
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.characterData.name, 0, 0);
        }
        
        // Draw interaction indicator for player characters
        if (this.isPlayer && this.canInteract && this.isHovered) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    handleClick(x, y) {
        if (this.isPlayer && this.canInteract && this.isPointInside(x, y)) {
            this.onInteract();
        }
    }
    
    isPointInside(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
    
    onInteract() {
        // This will be overridden by the game logic
        console.log(`${this.characterData.name} was clicked!`);
    }
    
    playHitAnimation() {
        this.isAnimating = true;
        this.animationTime = 0;
        
        // Create satisfying hit animation with different types
        const hitAnimations = [
            { // Spike animation
                duration: 0.4,
                scaleSequence: [1, 1.3, 1.1, 1],
                offsetSequence: [0, -15, -10, 0],
                rotationSequence: [0, 0.1, 0, 0]
            },
            { // Set animation  
                duration: 0.5,
                scaleSequence: [1, 1.2, 1.15, 1],
                offsetSequence: [0, -20, -8, 0],
                rotationSequence: [0, -0.05, 0, 0]
            },
            { // Bump animation
                duration: 0.3,
                scaleSequence: [1, 1.25, 1],
                offsetSequence: [0, -12, 0],
                rotationSequence: [0, 0.05, 0]
            }
        ];
        
        // Choose random animation for variety
        this.currentAnimation = hitAnimations[Math.floor(Math.random() * hitAnimations.length)];
        
        // Add slight screen shake effect for impact
        if (this.engine && this.engine.addScreenShake) {
            this.engine.addScreenShake(2, 100); // Small shake for 100ms
        }
    }
    
    setInteractable(canInteract) {
        this.canInteract = canInteract;
    }
    
    // Method to change character type (for future extensibility)
    changeCharacter(newType) {
        this.characterType = newType;
        this.characterData = this.getCharacterData(newType);
    }
    
    setGroundLevel(groundY) {
        this.groundY = groundY;
    }
    
    // Get center position (useful for volleyball targeting)
    getCenterX() {
        return this.x + this.width / 2;
    }
    
    getCenterY() {
        return this.y + this.height / 2;
    }
}
