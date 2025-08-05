// Volleyball class - Handles the ball physics and animations
class Volleyball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 65; // Larger volleyball
        this.height = 65;
        this.zIndex = 3;
        
        // Physics properties - tuned for smooth gameplay
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 900; // Slightly higher for more responsive feel
        this.bounce = 0.4; // Good bounce for gameplay
        this.friction = 0.95; // Less friction for smoother movement
        this.airResistance = 0.9995; // Minimal air resistance for smoothness
        this.isMoving = false;
        
        // Animation properties
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.scale = 1;
        this.targetScale = 1;
        this.scaleSpeed = 0.1;
        
        // Enhanced trail effect
        this.trail = [];
        this.maxTrailLength = 8;
        
        // State
        this.isInAir = false;
        this.groundY = 0;
        this.lastHitTime = 0;
        this.lastHitType = 'bump';
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        if (this.isMoving || !this.isOnGround()) {
            // Update position
            this.x += this.velocityX * dt;
            this.y += this.velocityY * dt;
            
            // Apply gravity
            this.velocityY += this.gravity * dt;
            
            // Apply air resistance
            this.velocityX *= this.airResistance;
            
            // Update rotation based on movement
            this.rotation += this.rotationSpeed * dt;
            this.rotationSpeed = this.velocityX * 0.02;
            
            // Add to trail
            if (Math.abs(this.velocityX) > 50 || Math.abs(this.velocityY) > 50) {
                this.trail.push({ x: this.x, y: this.y, time: Date.now() });
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
            }
            
            // Clean old trail points
            const now = Date.now();
            this.trail = this.trail.filter(point => now - point.time < 500);
            
            // Check for ground collision
            if (this.y + this.height >= this.groundY) {
                this.y = this.groundY - this.height;
                this.velocityY *= -this.bounce;
                this.velocityX *= this.friction;
                
                // Stop small bounces
                if (Math.abs(this.velocityY) < 50) {
                    this.velocityY = 0;
                }
                
                // Visual impact effect on ground hit
                this.targetScale = 1.15;
                
                // Stop if moving slowly - lowered threshold for smoother feel
                if (Math.abs(this.velocityX) < 30 && Math.abs(this.velocityY) < 30) {
                    this.velocityX = 0;
                    this.velocityY = 0;
                    this.isMoving = false;
                    this.rotationSpeed = 0;
                    this.targetScale = 1;
                    this.trail = []; // Clear trail when stopped
                }
            }
            
            // Keep within screen bounds
            if (this.x < 0) {
                this.x = 0;
                this.velocityX *= -0.8;
            }
            if (this.x + this.width > (this.engine?.canvas.width || 800)) {
                this.x = (this.engine?.canvas.width || 800) - this.width;
                this.velocityX *= -0.8;
            }
        }
        
        // Enhanced smooth scale transitions with better timing
        this.scale = lerp(this.scale, this.targetScale, deltaTime * 0.008);
        
        // Return to normal scale gradually
        if (Math.abs(this.targetScale - 1) > 0.01 && this.targetScale > 1) {
            this.targetScale = lerp(this.targetScale, 1, deltaTime * 0.003);
        }
    }
    
    render(ctx) {
        // Trail removed for cleaner appearance
        
        ctx.save();
        
        // Apply transformations
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.scale, this.scale);
        ctx.rotate(this.rotation);
        
        // Draw volleyball
        const image = this.engine?.getImage('volleyball');
        if (image) {
            ctx.drawImage(image, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            // Fallback volleyball drawing
            this.drawFallbackVolleyball(ctx);
        }
        
        ctx.restore();
        
        // Draw shadow when in air
        if (this.isInAir || this.y + this.height < this.groundY) {
            this.drawShadow(ctx);
        }
    }
    
    drawTrail(ctx) {
        if (this.trail.length < 2) return;
        
        ctx.save();
        const now = Date.now();
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const point = this.trail[i];
            const nextPoint = this.trail[i + 1];
            const age = (now - point.time) / 500;
            const opacity = Math.max(0, 1 - age);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
            ctx.lineWidth = (this.width / 4) * opacity;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(point.x + this.width / 2, point.y + this.height / 2);
            ctx.lineTo(nextPoint.x + this.width / 2, nextPoint.y + this.height / 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawShadow(ctx) {
        const shadowY = this.groundY - 10;
        const distance = Math.abs(this.y + this.height - shadowY);
        const shadowScale = Math.max(0.3, 1 - distance / 200);
        const shadowOpacity = Math.max(0.1, shadowScale);
        
        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(
            this.x + this.width / 2,
            shadowY,
            (this.width / 2) * shadowScale,
            (this.height / 4) * shadowScale,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    }
    
    drawFallbackVolleyball(ctx) {
        // Draw basic volleyball pattern
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw volleyball lines
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(this.width / 2, 0);
        ctx.stroke();
        
        // Curved lines
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 3, Math.PI - Math.PI / 3, Math.PI + Math.PI / 3);
        ctx.stroke();
    }
    
    isOnGround() {
        return Math.abs(this.y + this.height - this.groundY) < 5;
    }
    
    // Enhanced volleyball rally mechanics - polished and satisfying
    // Enhanced volleyball rally mechanics - polished and satisfying
    hitFromCharacter(character) {
        const now = Date.now();
        if (now - this.lastHitTime < 200) return false; // Prevent rapid hits
        
        // Calculate distance to character
        const charCenterX = character.getCenterX();
        const charCenterY = character.getCenterY();
        const ballCenterX = this.x + this.width / 2;
        const ballCenterY = this.y + this.height / 2;
        
        const distance = Math.sqrt((ballCenterX - charCenterX) ** 2 + (ballCenterY - charCenterY) ** 2);
        
        // Generous but not too forgiving hit detection
        if (distance > 200) return false;
        
        // Check if ball is at a reasonable height to hit
        const ballHeight = ballCenterY;
        const charHeight = charCenterY;
        if (Math.abs(ballHeight - charHeight) > 150) return false;
        
        this.lastHitTime = now;
        
        // Determine which side and create natural volleyball trajectory
        const courtMiddle = this.engine?.canvas.width / 2 || 400;
        const isLeftSide = character.x < courtMiddle;
        
        // Create natural volleyball physics
        let targetX, targetY;
        let hitType = this.determineHitType(character, distance);
        
        if (isLeftSide) {
            // Left side player - send to right side
            targetX = courtMiddle + 80 + Math.random() * 200;
        } else {
            // Right side player - send to left side  
            targetX = courtMiddle - 280 + Math.random() * 200;
        }
        
        // Target height based on hit type
        switch(hitType) {
            case 'spike':
                targetY = this.groundY - 50; // Lower, faster
                break;
            case 'set':
                targetY = this.groundY - 120; // Higher, softer
                break;
            default: // bump
                targetY = this.groundY - 80; // Medium height
        }
        
        // Calculate satisfying volleyball trajectory
        const horizontalDistance = targetX - ballCenterX;
        const verticalDistance = targetY - ballCenterY;
        
        // Adjust flight time based on hit type
        let flightTime;
        switch(hitType) {
            case 'spike':
                flightTime = 0.8 + Math.random() * 0.2; // Fast spike
                break;
            case 'set':
                flightTime = 1.4 + Math.random() * 0.3; // Slow, high set
                break;
            default:
                flightTime = 1.1 + Math.random() * 0.2; // Normal bump
        }
        
        // Calculate velocities with proper volleyball arc
        this.velocityX = horizontalDistance / flightTime;
        
        // Arc height based on hit type
        let peakHeight;
        switch(hitType) {
            case 'spike':
                peakHeight = 100; // Low, aggressive
                break;
            case 'set':
                peakHeight = 250; // High, floaty
                break;
            default:
                peakHeight = 180; // Normal arc
        }
        
        this.velocityY = -(peakHeight + this.gravity * flightTime * flightTime * 0.5) / flightTime;
        
        // Add character direction influence for more control
        const characterDirection = character.velocityX;
        this.velocityX += characterDirection * 0.3; // Add some player influence
        
        // Add slight variation for realism but keep it predictable
        this.velocityX += (Math.random() - 0.5) * 20;
        this.velocityY += (Math.random() - 0.5) * 15;
        
        this.isMoving = true;
        this.isInAir = true;
        
        // Visual feedback based on hit type
        switch(hitType) {
            case 'spike':
                this.targetScale = 1.6; // Dramatic spike
                this.rotationSpeed = this.velocityX * 0.015; // Fast spin
                break;
            case 'set':
                this.targetScale = 1.2; // Gentle set
                this.rotationSpeed = this.velocityX * 0.005; // Slow spin
                break;
            default:
                this.targetScale = 1.4; // Normal hit
                this.rotationSpeed = this.velocityX * 0.01; // Medium spin
        }
        
        // Clear trail for fresh trajectory
        this.trail = [];
        
        // Store hit type for animation feedback
        this.lastHitType = hitType;
        
        return true;
    }
    
    // Determine hit type based on ball position and character state
    determineHitType(character, distance) {
        const ballCenterY = this.y + this.height / 2;
        const charCenterY = character.getCenterY();
        const relativeHeight = ballCenterY - charCenterY;
        
        // Check if character is jumping (for spikes)
        const isJumping = character.velocityY < -100;
        
        if (isJumping && relativeHeight < -20) {
            return 'spike'; // Jumping and ball is above
        } else if (relativeHeight < -30) {
            return 'set'; // Ball is high, gentle set
        } else {
            return 'bump'; // Normal bump/pass
        }
    }
    
    passToTarget(targetX, targetY, arc = 0.8) {
        const deltaX = targetX - (this.x + this.width / 2);
        const deltaY = targetY - (this.y + this.width / 2);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Calculate trajectory with arc
        const time = distance / 400;
        this.velocityX = deltaX / time;
        this.velocityY = (deltaY / time) - (this.gravity * time * 0.5 * arc);
        
        this.isMoving = true;
        this.isInAir = true;
        this.targetScale = 1.1;
        
        // Add some initial rotation
        this.rotationSpeed = (Math.random() - 0.5) * 5;
        
        // Clear trail
        this.trail = [];
    }
    
    setGroundLevel(groundY) {
        this.groundY = groundY;
    }
    
    // Check if volleyball is near a character
    isNearCharacter(character, threshold = 80) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const charCenterX = character.getCenterX();
        const charCenterY = character.getCenterY();
        return distance(centerX, centerY, charCenterX, charCenterY) < threshold;
    }
    
    // Check if volleyball has reached target area
    isNearTarget(targetX, targetY, threshold = 80) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        return distance(centerX, centerY, targetX, targetY) < threshold;
    }
    
    // Reset volleyball to initial position
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.isMoving = false;
        this.isInAir = false;
        this.scale = 1;
        this.targetScale = 1;
        this.trail = [];
        this.lastHitTime = 0;
    }
}
