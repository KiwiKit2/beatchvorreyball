// Volleyball class - Handles the ball physics and animations
class Volleyball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50; // Bigger volleyball
        this.height = 50;
        this.zIndex = 3;
        
        // Physics properties
        this.velocityX = 0;
        this.velocityY = 0;
        this.gravity = 800; // Lighter gravity for volleyball float
        this.bounce = 0.3; // Less bouncy like a real volleyball
        this.friction = 0.98;
        this.airResistance = 0.999; // Minimal air resistance
        this.isMoving = false;
        
        // Animation properties
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.scale = 1;
        this.targetScale = 1;
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 6;
        
        // State
        this.isInAir = false;
        this.groundY = 0;
        this.lastHitTime = 0;
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
                
                // Stop if moving slowly
                if (Math.abs(this.velocityX) < 30 && Math.abs(this.velocityY) < 30) {
                    this.velocityX = 0;
                    this.velocityY = 0;
                    this.isMoving = false;
                    this.rotationSpeed = 0;
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
        
        // Smooth scale transitions
        this.scale = lerp(this.scale, this.targetScale, deltaTime * 0.01);
    }
    
    render(ctx) {
        // Draw trail
        this.drawTrail(ctx);
        
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
    
    // Volleyball rally mechanics - proper back and forth
    hitFromCharacter(character) {
        const now = Date.now();
        if (now - this.lastHitTime < 500) return false; // Prevent spam, allow proper timing
        
        this.lastHitTime = now;
        
        // Calculate distance to character
        const charCenterX = character.getCenterX();
        const charCenterY = character.getCenterY();
        const ballCenterX = this.x + this.width / 2;
        const ballCenterY = this.y + this.height / 2;
        
        const distance = Math.sqrt((ballCenterX - charCenterX) ** 2 + (ballCenterY - charCenterY) ** 2);
        
        // Only hit if within reach
        if (distance > 140) return false;
        
        // Determine which side and create rally-style pass
        const courtMiddle = this.engine?.canvas.width / 2 || 400;
        const isLeftSide = character.x < courtMiddle;
        
        // Create proper volleyball rally arc
        let targetX, targetY;
        
        if (isLeftSide) {
            // Left side player - send to right side
            targetX = courtMiddle + 150 + Math.random() * 200;
        } else {
            // Right side player - send to left side  
            targetX = courtMiddle - 350 + Math.random() * 200;
        }
        
        targetY = this.groundY - 100; // Land nicely for next hit
        
        // Calculate beautiful volleyball arc
        const horizontalDistance = targetX - ballCenterX;
        const verticalDistance = targetY - ballCenterY;
        
        // Time for a nice volleyball flight
        const flightTime = 1.8 + Math.random() * 0.4; // 1.8-2.2 seconds
        
        // Calculate velocities for perfect arc
        this.velocityX = horizontalDistance / flightTime;
        
        // Calculate Y velocity to reach peak and land at target
        const peakHeight = 250; // High volleyball arc
        this.velocityY = -(peakHeight + this.gravity * flightTime * flightTime * 0.5) / flightTime;
        
        // Add slight randomness for realism
        this.velocityX += (Math.random() - 0.5) * 40;
        this.velocityY += (Math.random() - 0.5) * 30;
        
        this.isMoving = true;
        this.isInAir = true;
        this.targetScale = 1.4;
        
        // Nice volleyball rotation
        this.rotationSpeed = this.velocityX * 0.008;
        
        // Clear trail
        this.trail = [];
        
        return true;
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
