// Game Engine - Core game loop and utilities
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Make canvas fullscreen
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game objects
        this.gameObjects = [];
        this.images = new Map();
        this.imagesLoaded = 0;
        this.totalImages = 0;
        
        // Input handling
        this.mouse = { x: 0, y: 0, clicked: false };
        this.keys = {};
        this.setupInputHandlers();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupInputHandlers() {
        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.mouse.clicked = true;
            this.handleClick(this.mouse.x, this.mouse.y);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            this.keys[e.code.toLowerCase()] = true;
            this.handleKeyDown(e.key, e.code);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keys[e.code.toLowerCase()] = false;
        });
    }
    
    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }
    
    handleKeyDown(key, code) {
        // Propagate keydown to all game objects
        this.gameObjects.forEach(obj => {
            if (obj.handleKeyDown) {
                obj.handleKeyDown(key, code);
            }
        });
    }
    
    loadImage(src, key) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(key, img);
                this.imagesLoaded++;
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    async loadAllImages(imageList) {
        this.totalImages = imageList.length;
        const promises = imageList.map(item => this.loadImage(item.src, item.key));
        await Promise.all(promises);
    }
    
    getImage(key) {
        return this.images.get(key);
    }
    
    addGameObject(obj) {
        this.gameObjects.push(obj);
        obj.engine = this;
    }
    
    removeGameObject(obj) {
        const index = this.gameObjects.indexOf(obj);
        if (index > -1) {
            this.gameObjects.splice(index, 1);
        }
    }
    
    handleClick(x, y) {
        // Propagate click to all game objects
        this.gameObjects.forEach(obj => {
            if (obj.handleClick) {
                obj.handleClick(x, y);
            }
        });
    }
    
    update(deltaTime) {
        this.gameObjects.forEach(obj => {
            if (obj.update) {
                obj.update(deltaTime);
            }
        });
        this.mouse.clicked = false;
        
        // Call game-specific update if provided
        if (this.gameUpdate) {
            this.gameUpdate(deltaTime);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Render all game objects (sort by z-index first)
        const sortedObjects = [...this.gameObjects].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        sortedObjects.forEach(obj => {
            if (obj.render) {
                obj.render(this.ctx);
            }
        });
    }
    
    drawBackground() {
        const bgImage = this.getImage('background');
        if (bgImage) {
            this.ctx.drawImage(bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Clean, beautiful beach volleyball atmosphere
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#87CEEB');    // Sky blue at top
            gradient.addColorStop(0.4, '#B0E0E6');  // Powder blue 
            gradient.addColorStop(0.7, '#F0E68C');  // Khaki for horizon
            gradient.addColorStop(1, '#DEB887');    // Sandy beach
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Add some very subtle clouds for atmosphere
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(this.canvas.width * 0.15, this.canvas.height * 0.12, 35, 0, Math.PI * 2);
            this.ctx.arc(this.canvas.width * 0.85, this.canvas.height * 0.18, 28, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Clean court - no distracting net
        this.drawCleanCourt();
    }
    
    drawCleanCourt() {
        // Just a subtle ground line for reference
        const ctx = this.ctx;
        const courtY = this.canvas.height * 0.75;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, courtY);
        ctx.lineTo(this.canvas.width, courtY);
        ctx.stroke();
        ctx.restore();
    }
    

    
    gameLoop(currentTime) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(this.deltaTime);
        this.render();
        
        if (this.isRunning) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    stop() {
        this.isRunning = false;
    }
}

// Utility functions
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
