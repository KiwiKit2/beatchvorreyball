// Character class - Extensible for different characters
class Character {
    constructor(x, y, characterType = 'donQ', isPlayer = true) {
        this.x = x;
        this.y = y;
        this.width = 140; // Much bigger characters
        this.height = 140;
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
        
        // Handle animations
        if (this.isAnimating) {
            this.animationTime += deltaTime;
            
            // Bounce animation when hitting volleyball
            if (this.animationTime < 500) {
                const progress = this.animationTime / 500;
                const bounceProgress = Math.sin(progress * Math.PI);
                this.scale = lerp(1, 1.3, bounceProgress);
                this.rotation = lerp(0, 0.2, bounceProgress) * (Math.random() > 0.5 ? 1 : -1);
            } else {
                // Return to normal
                this.scale = lerp(this.scale, 1, deltaTime * 0.005);
                this.rotation = lerp(this.rotation, 0, deltaTime * 0.005);
                
                if (Math.abs(this.scale - 1) < 0.01 && Math.abs(this.rotation) < 0.01) {
                    this.isAnimating = false;
                    this.animationTime = 0;
                    this.scale = 1;
                    this.rotation = 0;
                }
            }
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
            this.hitVolleyball();
        }
    }
    
    hitVolleyball() {
        // This will be overridden by the game logic
        if (this.onHitVolleyball) {
            this.onHitVolleyball();
        }
    }
    
    setGroundLevel(groundY) {
        this.groundY = groundY;
    }
    
    render(ctx) {
        const image = this.engine?.getImage(this.characterData.imageKey);
        
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
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
