const canvas = document.getElementById('gameCanvas')
const c = canvas.getContext('2d')
const scoreC = document.getElementById('scoreC')
const startDiv = document.getElementById('start')
const gameOverDiv = document.getElementById('game-over')
const finalScore = document.getElementById('finalScore')
const forestElements = document.querySelector('.forest-elements')
let score = 0;

// Create decorative leaves
function createForestElements() {
    for (let i = 0; i < 15; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');
        
        // Randomize leaf properties
        leaf.style.left = `${Math.random() * 100}%`;
        leaf.style.top = `${Math.random() * 100}%`;
        leaf.style.width = `${30 + Math.random() * 40}px`;
        leaf.style.height = `${30 + Math.random() * 40}px`;
        leaf.style.opacity = `${0.1 + Math.random() * 0.2}`;
        leaf.style.animationDuration = `${15 + Math.random() * 20}s`;
        leaf.style.animationDelay = `${Math.random() * 10}s`;
        
        // Vary leaf colors
        const hue = 100 + Math.floor(Math.random() * 40); // green to yellow-green
        leaf.style.backgroundColor = `hsl(${hue}, 80%, 70%)`;
        
        forestElements.appendChild(leaf);
    }
}

// Set canvas size to be responsive but maintain aspect ratio
function setCanvasSize() {
    const parentWidth = canvas.parentElement.clientWidth * 0.8;
    const parentHeight = canvas.parentElement.clientHeight * 0.8;
    
    // For mobile, make the canvas taller
    if (window.innerWidth < 768) {
        canvas.width = Math.min(parentWidth, parentHeight * 0.7);
        canvas.height = canvas.width * 1.3;
    } else {
        // Standard 4:3 aspect ratio for desktop
        canvas.width = Math.min(parentWidth, parentHeight * 1.33);
        canvas.height = canvas.width * 0.75;
    }
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    // Set canvas size and initialize forest elements
    setCanvasSize();
    createForestElements();
    
    // Start preloading assets
    preloadAssets();
    
    // Add resize listener
    window.addEventListener('resize', setCanvasSize);
    
    // Add delayed class to loading overlay to show fallback option
    setTimeout(() => {
        loadingOverlay.classList.add('delayed');
    }, 3000);
    
    // Add event listener for manual continue button
    const manualContinue = document.getElementById('manualContinue');
    if (manualContinue) {
        manualContinue.addEventListener('click', function(e) {
            e.preventDefault();
            forceStartGameInterface();
        });
    }
});

function startGame() {
    score = 0;
    scoreC.innerHTML = score;
    startDiv.style.display = "none";
    gameOverDiv.style.display = "none";
    canvas.style.display = "block";
    
    // Reset game elements
    lightOrbs.length = 0;
    beetles.length = 0;
    initializeGameElements();
    
    animation();
}

function gameOver() {
    gameOverDiv.style.display = "block";
    canvas.style.display = "none";
    finalScore.innerHTML = score;
}

function restartGame() {
    location.reload();
    startGame();
}

// Boundary class for vine/branch maze elements
class Boundary {
    static width = 40
    static height = 40
    constructor({ position, image }) {
        this.position = position
        this.width = 40
        this.height = 40
        this.image = image
    }
    draw() {
        c.drawImage(this.image, this.position.x, this.position.y)
    }
}

// Player character (forest spirit)
class ForestSpirit {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 12;
        this.baseColor = '#7affb9'; // Glowing green
        this.color = this.baseColor;
        this.glowSize = 0;
        this.glowDirection = 0.1;
        this.pulseRate = 0.02;
        this.innerGlow = 0;
        this.trailPositions = [];
        this.maxTrail = 5;
    }

    draw() {
        // Draw trail
        this.trailPositions.forEach((pos, i) => {
            const alpha = 0.2 * (1 - i / this.maxTrail);
            c.beginPath();
            c.arc(pos.x, pos.y, this.radius * 0.7, 0, Math.PI * 2);
            c.fillStyle = `rgba(122, 255, 185, ${alpha})`;
            c.fill();
            c.closePath();
        });

        // Outer glow effect
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius + this.glowSize, 0, Math.PI * 2);
        c.fillStyle = `rgba(122, 255, 185, 0.3)`;
        c.fill();
        c.closePath();
        
        // Middle glow
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius * 0.8 + this.innerGlow, 0, Math.PI * 2);
        c.fillStyle = `rgba(210, 255, 230, 0.6)`;
        c.fill();
        c.closePath();
        
        // Main sprite
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius * 0.7, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
        
        // Eyes
        c.beginPath();
        c.arc(this.position.x - 3, this.position.y - 2, 2, 0, Math.PI * 2);
        c.arc(this.position.x + 3, this.position.y - 2, 2, 0, Math.PI * 2);
        c.fillStyle = 'black';
        c.fill();
        c.closePath();
        
        // Smile
        c.beginPath();
        c.arc(this.position.x, this.position.y + 1, 4, 0, Math.PI);
        c.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        c.lineWidth = 1;
        c.stroke();
        c.closePath();
    }

    update() {
        // Add current position to trail
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            this.trailPositions.unshift({x: this.position.x, y: this.position.y});
            
            // Limit trail length
            if (this.trailPositions.length > this.maxTrail) {
                this.trailPositions.pop();
            }
        }
        
        this.draw();
        
        // Update position
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Update glow effects
        this.glowSize += this.glowDirection;
        if (this.glowSize > 5 || this.glowSize < 0) {
            this.glowDirection *= -1;
        }
        
        this.innerGlow += this.pulseRate;
        if (this.innerGlow > 3 || this.innerGlow < 0) {
            this.pulseRate *= -1;
        }
        
        // Color shift based on movement
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > 0) {
            // Shift towards brighter color when moving
            this.color = '#a0ffdb';
        } else {
            // Return to base color when still
            this.color = this.baseColor;
        }
    }
}

// Enemy class (poisonous beetles)
class Beetle {
    static speed = 2
    constructor({position, velocity, color = 'red', image}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 13;
        this.color = color;
        this.prevCollisions = [];
        this.speed = 2;
        this.image = image;
        this.rotation = 0;
        this.scaleX = 1;
        this.hueShift = 0;
        this.hueDirection = 1;
    }

    draw() {
        c.save();
        c.translate(this.position.x, this.position.y);
        
        // Rotate to face direction of movement
        if (this.velocity.x > 0) {
            this.rotation = 0;
            this.scaleX = 1;
        } else if (this.velocity.x < 0) {
            this.rotation = 0;
            this.scaleX = -1;
        } else if (this.velocity.y < 0) {
            this.rotation = -Math.PI / 2;
            this.scaleX = 1;
        } else if (this.velocity.y > 0) {
            this.rotation = Math.PI / 2;
            this.scaleX = 1;
        }
        
        c.rotate(this.rotation);
        c.scale(this.scaleX, 1);
        
        if (this.image) {
            // Apply color shift filter
            c.filter = `hue-rotate(${this.hueShift}deg)`;
            c.drawImage(this.image, -15, -15, 30, 30);
            
            // Glowing eyes effect
            c.beginPath();
            c.arc(-5, -5, 2, 0, Math.PI * 2);
            c.arc(5, -5, 2, 0, Math.PI * 2);
            c.fillStyle = '#ff0000';
            c.fill();
            c.closePath();
        } else {
            // Fallback if image not loaded
            c.beginPath();
            c.arc(0, 0, this.radius, 0, Math.PI * 2);
            c.fillStyle = this.color;
            c.fill();
            c.closePath();
        }
        
        c.restore();
        
        // Update hue shift for color cycling effect
        this.hueShift += this.hueDirection;
        if (this.hueShift > 30 || this.hueShift < 0) {
            this.hueDirection *= -1;
        }
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

// Collectible class (dew drops/light orbs)
class LightOrb {
    constructor({position}) {
        this.position = position;
        this.radius = 8; // Slightly larger orbs
        this.alpha = 1;
        this.decreasing = true;
        this.hue = 50 + Math.random() * 20; // Gold to yellow
        this.rotationAngle = Math.random() * Math.PI * 2; // Random initial angle
        this.rotationSpeed = 0.01 + Math.random() * 0.02;
        this.sparklePositions = [];
        this.floatOffset = Math.random() * Math.PI * 2; // Random starting phase
        this.floatSpeed = 0.02 + Math.random() * 0.02;
        this.floatAmount = 3 + Math.random() * 4;
        this.originalY = position.y;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.03 + Math.random() * 0.02;
        this.scaleVariation = 0.2;
        this.glowIntensity = 0.8 + Math.random() * 0.4;
        this.innerRotation = 0;
        this.innerRotationSpeed = 0.03 + Math.random() * 0.02;
        
        // Create more random sparkle positions
        for (let i = 0; i < 6; i++) {
            this.sparklePositions.push({
                angle: Math.random() * Math.PI * 2,
                distance: this.radius * (1.5 + Math.random() * 1.5),
                size: 1 + Math.random() * 2,
                alpha: 0.7 + Math.random() * 0.3,
                speed: 0.02 + Math.random() * 0.03,
                pulse: Math.random() * Math.PI * 2
            });
        }
        
        // Create light rays with varied properties
        this.rays = [];
        for (let i = 0; i < 12; i++) {
            this.rays.push({
                angle: (Math.PI * 2 / 12) * i,
                length: this.radius * (1.5 + Math.random() * 1.0),
                width: 1 + Math.random() * 1.5,
                speed: 0.01 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2,
                hueShift: Math.random() * 20 - 10
            });
        }
        
        // Create secondary particles
        this.particles = [];
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                distance: this.radius * (0.5 + Math.random() * 0.3),
                angle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.02,
                size: this.radius * (0.15 + Math.random() * 0.1),
                hue: this.hue + Math.random() * 30 - 15
            });
        }
    }

    draw() {
        this.rotationAngle += this.rotationSpeed;
        this.floatOffset += this.floatSpeed;
        this.pulsePhase += this.pulseSpeed;
        this.innerRotation += this.innerRotationSpeed;
        
        // Float animation
        const floatY = Math.sin(this.floatOffset) * this.floatAmount;
        this.position.y = this.originalY + floatY;
        
        // Outer glow effect
        const gradientOuter = c.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius * 3
        );
        gradientOuter.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${this.alpha * 0.5})`);
        gradientOuter.addColorStop(1, `hsla(${this.hue}, 100%, 70%, 0)`);
        
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius * 3, 0, Math.PI * 2);
        c.fillStyle = gradientOuter;
        c.fill();
        c.closePath();
        
        // Main orb with gradient
        const gradient = c.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 90%, ${this.alpha})`);
        gradient.addColorStop(0.7, `hsla(${this.hue}, 100%, 80%, ${this.alpha})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 60%, ${this.alpha})`);
        
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = gradient;
        c.fill();
        c.closePath();
        
        // Draw sparkles
        this.sparklePositions.forEach(sparkle => {
            sparkle.pulse += sparkle.speed;
            sparkle.angle += sparkle.speed;
            
            const x = this.position.x + Math.cos(this.rotationAngle + sparkle.angle) * sparkle.distance;
            const y = this.position.y + Math.sin(this.rotationAngle + sparkle.angle) * sparkle.distance;
            
            const size = sparkle.size + Math.sin(sparkle.pulse) * this.scaleVariation;
            
            c.beginPath();
            c.arc(x, y, size, 0, Math.PI * 2);
            c.fillStyle = `hsla(${this.hue}, 100%, 90%, ${sparkle.alpha * this.alpha})`;
            c.fill();
            c.closePath();
        });
        
        // Draw light rays
        this.rays.forEach(ray => {
            ray.phase += ray.speed;
            
            const x1 = this.position.x + Math.cos(this.rotationAngle + ray.angle) * this.radius;
            const y1 = this.position.y + Math.sin(this.rotationAngle + ray.angle) * this.radius;
            
            const x2 = this.position.x + Math.cos(this.rotationAngle + ray.angle) * (this.radius + ray.length);
            const y2 = this.position.y + Math.sin(this.rotationAngle + ray.angle) * (this.radius + ray.length);
            
            const gradient = c.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `hsla(${this.hue + ray.hueShift}, 100%, 90%, ${this.alpha * this.glowIntensity})`);
            gradient.addColorStop(1, `hsla(${this.hue + ray.hueShift}, 100%, 90%, 0)`);
            
            c.beginPath();
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.lineWidth = ray.width;
            c.strokeStyle = gradient;
            c.stroke();
            c.closePath();
        });
        
        // Draw secondary particles
        this.particles.forEach(particle => {
            particle.angle += particle.speed;
            
            const x = this.position.x + Math.cos(this.innerRotation + particle.angle) * particle.distance;
            const y = this.position.y + Math.sin(this.innerRotation + particle.angle) * particle.distance;
            
            c.beginPath();
            c.arc(x, y, particle.size, 0, Math.PI * 2);
            c.fillStyle = `hsla(${particle.hue}, 100%, 90%, ${this.alpha * 0.8})`;
            c.fill();
            c.closePath();
        });
        
        // Update alpha for pulsing effect
        if (this.decreasing) {
            this.alpha -= 0.01;
            if (this.alpha <= 0.6) {
                this.decreasing = false;
            }
        } else {
            this.alpha += 0.01;
            if (this.alpha >= 1) {
                this.decreasing = true;
            }
        }
    }
}

// Power-up class
class PowerUp {
    constructor({position, type}) {
        this.position = position;
        this.radius = 12;
        this.type = type || this.getRandomType();
        this.alpha = 1;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotationAngle = Math.random() * Math.PI * 2;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
        this.originalY = position.y;
    }
    
    getRandomType() {
        const types = ['speed', 'invincibility', 'freeze'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    draw() {
        if (this.collected) return;
        
        this.pulsePhase += 0.05;
        this.rotationAngle += 0.02;
        this.floatOffset += 0.03;
        
        // Float animation
        const floatY = Math.sin(this.floatOffset) * 5;
        this.position.y = this.originalY + floatY;
        
        // Outer glow
        const glowSize = this.radius * 3 + Math.sin(this.pulsePhase) * 2;
        let glowColor;
        
        switch(this.type) {
            case 'speed':
                glowColor = 'rgba(0, 150, 255, 0.3)';
                break;
            case 'invincibility':
                glowColor = 'rgba(255, 215, 0, 0.3)';
                break;
            case 'freeze':
                glowColor = 'rgba(200, 255, 255, 0.3)';
                break;
        }
        
        const gradientOuter = c.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, glowSize
        );
        
        gradientOuter.addColorStop(0, glowColor.replace('0.3', '0.6'));
        gradientOuter.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        c.beginPath();
        c.arc(this.position.x, this.position.y, glowSize, 0, Math.PI * 2);
        c.fillStyle = gradientOuter;
        c.fill();
        
        // Main body
        c.save();
        c.translate(this.position.x, this.position.y);
        c.rotate(this.rotationAngle);
        
        let mainColor;
        let iconColor = 'white';
        
        switch(this.type) {
            case 'speed':
                mainColor = '#0096ff';
                break;
            case 'invincibility':
                mainColor = '#ffd700';
                break;
            case 'freeze':
                mainColor = '#a0ffff';
                break;
        }
        
        // Draw power-up circle
        c.beginPath();
        c.arc(0, 0, this.radius, 0, Math.PI * 2);
        
        const gradient = c.createRadialGradient(
            0, 0, 0,
            0, 0, this.radius
        );
        
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.3, mainColor);
        gradient.addColorStop(1, mainColor.replace('ff', '80'));
        
        c.fillStyle = gradient;
        c.fill();
        
        c.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        c.lineWidth = 2;
        c.stroke();
        
        // Draw icon based on type
        c.fillStyle = iconColor;
        
        switch(this.type) {
            case 'speed':
                // Lightning bolt
                c.beginPath();
                c.moveTo(-3, -6);
                c.lineTo(2, -1);
                c.lineTo(-1, 1);
                c.lineTo(3, 6);
                c.lineTo(-2, 0);
                c.lineTo(1, -2);
                c.closePath();
                c.fill();
                break;
            case 'invincibility':
                // Star
                c.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                    const outerX = Math.cos(angle) * this.radius * 0.7;
                    const outerY = Math.sin(angle) * this.radius * 0.7;
                    
                    const innerAngle = angle + Math.PI / 5;
                    const innerX = Math.cos(innerAngle) * this.radius * 0.3;
                    const innerY = Math.sin(innerAngle) * this.radius * 0.3;
                    
                    if (i === 0) {
                        c.moveTo(outerX, outerY);
                    } else {
                        c.lineTo(outerX, outerY);
                    }
                    
                    c.lineTo(innerX, innerY);
                }
                c.closePath();
                c.fill();
                break;
            case 'freeze':
                // Snowflake
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 / 6) * i;
                    c.save();
                    c.rotate(angle);
                    
                    c.beginPath();
                    c.moveTo(0, 0);
                    c.lineTo(0, -this.radius * 0.7);
                    c.strokeStyle = iconColor;
                    c.lineWidth = 1.5;
                    c.stroke();
                    
                    // Cross lines
                    c.beginPath();
                    c.moveTo(-2, -this.radius * 0.4);
                    c.lineTo(2, -this.radius * 0.5);
                    c.moveTo(2, -this.radius * 0.4);
                    c.lineTo(-2, -this.radius * 0.5);
                    c.stroke();
                    
                    c.restore();
                }
                break;
        }
        
        c.restore();
    }
}

// Game elements
const lightOrbs = [];
const boundaries = [];
const beetles = [];
const powerUps = [];

// Player power-up states
const playerState = {
    speedBoost: false,
    speedTimer: 0,
    invincible: false,
    invincibleTimer: 0,
    freezeEnemies: false,
    freezeTimer: 0
};

// Create player character
const forestSpirit = new ForestSpirit({
    position: {
        x: Boundary.width + Boundary.width/2,
        y: Boundary.height + Boundary.height/2
    },
    velocity: {
        x: 0,
        y: 0
    }
});

// Controls
let lastKey = '';
const keys = {
    w: { pressed: false },
    a: { pressed: false },
    s: { pressed: false },
    d: { pressed: false }
};

// Create a more organic, circular maze layout
const map = [
    ['1','_','_','_','_','_','_','_','_','_','2'],
    ['|','.','.','.','.','.','.','.','.','.','|'],
    ['|','.','b','.','l','bc','r','.','b','.','|'],
    ['|','.','.','.','.','d','.','.','.','.','|'],
    ['|','.','l','r','.','.','.','l','r','.','|'],
    ['|','.','.','.','.','t','.','.','.','.','|'],
    ['|','.','b','.','l','c','r','.','b','.','|'],
    ['|','.','.','.','.','d','.','.','.','.','|'],
    ['|','.','l','r','.','.','.','l','r','.','|'],
    ['|','.','.','.','.','t','.','.','.','.','|'],
    ['|','.','b','.','l','tc','r','.','b','.','|'],
    ['|','.','.','.','.','.','.','.','.','.','|'],
    ['4','_','_','_','_','_','_','_','_','_','3']
];

// Helper function to create images
function createImage(src) {
    const image = new Image();
    image.src = src;
    return image;
}

// Initialize all game elements based on the map
function initializeGameElements() {
    // Create boundaries from map
    map.forEach((row, i) => {
        row.forEach((symbol, j) => {
            switch (symbol) {
                case '_':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeHorizontal.png')
                    }));
                    break;
                case '|':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeVertical.png')
                    }));
                    break;
                case '1':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner1.png')
                    }));
                    break;
                case '2':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner2.png')
                    }));
                    break;
                case '3':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner3.png')
                    }));
                    break;
                case '4':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner4.png')
                    }));
                    break;
                case 'b':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/block.png')
                    }));
                    break;
                case 't':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capTop.png')
                    }));
                    break;
                case 'd':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capBottom.png')
                    }));
                    break;
                case 'l':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capLeft.png')
                    }));
                    break;
                case 'r':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capRight.png')
                    }));
                    break;
                case 'bc':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeConnectorBottom.png')
                    }));
                    break;
                case 'tc':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeConnectorTop.png')
                    }));
                    break;
                case 'c':
                    boundaries.push(new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCross.png')
                    }));
                    break;
                case '.':
                    lightOrbs.push(new LightOrb({
                        position: {
                            x: Boundary.width * j + Boundary.width / 2,
                            y: Boundary.height * i + Boundary.height / 2
                        },
                    }));
                    break;
            }
        });
    });

    // Create beetles (enemies)
    beetles.push(
        new Beetle({
            position: {
                x: Boundary.width * 6 + Boundary.width/2,
                y: Boundary.height + Boundary.height/2
            },
            velocity: {
                x: Beetle.speed,
                y: 0
            },
            color: '#8B4513', // Brown
            image: createImage('./img/greenG.png')
        }),
        new Beetle({
            position: {
                x: Boundary.width * 6 + Boundary.width/2,
                y: Boundary.height * 6 + Boundary.height/2
            },
            velocity: {
                x: Beetle.speed,
                y: 0
            },
            color: '#556B2F', // Dark olive green
            image: createImage('./img/pinkG.png')
        }),
        new Beetle({
            position: {
                x: Boundary.width * 4 + Boundary.width/2,
                y: Boundary.height * 9 + Boundary.height/2
            },
            velocity: {
                x: Beetle.speed,
                y: 0
            },
            color: '#A0522D', // Sienna
            image: createImage('./img/blueG.png')
        })
    );
}

// Initialize game elements when page loads
initializeGameElements();

// Collision detection
function circleWithRect({ circle, rectangle }) {
    return (
        circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height &&
        circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x &&
        circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y &&
        circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width
    );
}

// Game animation loop
let animationId;

function animation() {
    if (!gamePaused) {
        animationId = requestAnimationFrame(animation);
        c.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw forest background
        c.fillStyle = '#0a3d0a';
        c.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background elements
        background.draw();
        
        // Update and draw particles
        particleSystem.update();
        particleSystem.draw();
        
        // Update player power-up states
        updatePlayerState();
        
        // Handle player movement with speed boost if active
        let moveSpeed = playerState.speedBoost ? 4.5 : 3;
        let isMoving = false;
        
        // Draw power-ups and check collection
        powerUps.forEach((powerUp, i) => {
            if (!powerUp.collected) {
                powerUp.draw();
                
                // Check if player collects the power-up
                if (Math.hypot(
                    powerUp.position.x - forestSpirit.position.x,
                    powerUp.position.y - forestSpirit.position.y)
                    < powerUp.radius + forestSpirit.radius) 
                {
                    // Apply power-up effect
                    applyPowerUp(powerUp.type);
                    
                    // Create collection effect
                    particleSystem.createParticles(
                        powerUp.position.x, 
                        powerUp.position.y, 
                        20, 
                        { min: 180, max: 240 }
                    );
                    
                    // Play sound
                    playSound('levelUp');
                    
                    // Mark as collected
                    powerUp.collected = true;
                    
                    // Remove after a delay
                    setTimeout(() => {
                        powerUps.splice(i, 1);
                    }, 100);
                }
            }
        });
        
        // Handle player movement with modified speed
        if (keys.w.pressed) {
            forestSpirit.velocity.x = 0;
            forestSpirit.velocity.y = -moveSpeed;
            isMoving = true;
        
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
        
                if (circleWithRect({
                    circle: forestSpirit,
                    rectangle: boundary
                })) {
                    forestSpirit.velocity.y = 0;
                    isMoving = false;
                    break;
                }
            }
        } else if (keys.a.pressed) {
            forestSpirit.velocity.x = -moveSpeed;
            forestSpirit.velocity.y = 0;
            isMoving = true;
        
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
        
                if (circleWithRect({
                    circle: forestSpirit,
                    rectangle: boundary
                })) {
                    forestSpirit.velocity.x = 0;
                    isMoving = false;
                    break;
                }
            }
        } else if (keys.s.pressed) {
            forestSpirit.velocity.x = 0;
            forestSpirit.velocity.y = moveSpeed;
            isMoving = true;
        
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
        
                if (circleWithRect({
                    circle: forestSpirit,
                    rectangle: boundary
                })) {
                    forestSpirit.velocity.y = 0;
                    isMoving = false;
                    break;
                }
            }
        } else if (keys.d.pressed) {
            forestSpirit.velocity.x = moveSpeed;
            forestSpirit.velocity.y = 0;
            isMoving = true;
        
            for (let i = 0; i < boundaries.length; i++) {
                const boundary = boundaries[i];
        
                if (circleWithRect({
                    circle: forestSpirit,
                    rectangle: boundary
                })) {
                    forestSpirit.velocity.x = 0;
                    isMoving = false;
                    break;
                }
            }
        }
        
        // Play movement sound if moving
        if (isMoving && (Math.abs(forestSpirit.velocity.x) > 0 || Math.abs(forestSpirit.velocity.y) > 0)) {
            // Only play sound occasionally to avoid too many sounds
            if (Math.random() < 0.05) {
                playSound('move');
            }
        }
        
        // Draw boundaries
        boundaries.forEach((boundary) => {
            boundary.draw();
            if (circleWithRect({
                circle: forestSpirit,
                rectangle: boundary
            })) {
                forestSpirit.velocity.x = 0;
                forestSpirit.velocity.y = 0;
            }
        });
        
        // Draw visual effect for player power-ups
        if (playerState.invincible || playerState.speedBoost) {
            c.save();
            c.globalAlpha = 0.4 + Math.sin(Date.now() / 100) * 0.2;
            
            let powerUpColor = 'rgba(255, 255, 255, 0.3)';
            if (playerState.invincible) {
                powerUpColor = 'rgba(255, 215, 0, 0.3)';
            } else if (playerState.speedBoost) {
                powerUpColor = 'rgba(0, 150, 255, 0.3)';
            }
            
            c.beginPath();
            c.arc(
                forestSpirit.position.x, 
                forestSpirit.position.y, 
                forestSpirit.radius * 1.8, 
                0, 
                Math.PI * 2
            );
            c.fillStyle = powerUpColor;
            c.fill();
            c.restore();
        }
        
        // Handle orb collection
        lightOrbs.forEach((orb, i) => {
            if (Math.hypot(
                orb.position.x - forestSpirit.position.x,
                orb.position.y - forestSpirit.position.y)
                < orb.radius + forestSpirit.radius) 
            {
                // Visual effect when collecting orb
                createCollectionEffect(orb.position.x, orb.position.y);
                
                // Remove orb and update score
                lightOrbs.splice(i, 1);
                score += 10;
                scoreC.innerHTML = score;
            } 
            else 
            {
                orb.draw();
            }
        });
        
        // Win condition
        if (lightOrbs.length === 0) {
            refillLightOrbs();
        }
        
        // Update player
        forestSpirit.update();
        
        // Handle beetles (enemies)
        beetles.forEach((beetle) => {
            // Only update beetles if not frozen
            if (!playerState.freezeEnemies) {
                beetle.update();
            } else {
                // Just draw beetles without updating if frozen
                beetle.draw();
                
                // Add frost effect to frozen beetles
                c.beginPath();
                c.arc(
                    beetle.position.x, 
                    beetle.position.y, 
                    beetle.radius * 1.3, 
                    0, 
                    Math.PI * 2
                );
                c.fillStyle = 'rgba(200, 255, 255, 0.3)';
                c.fill();
                
                // Add frost crystals
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI * 2 / 6 * i;
                    const x = beetle.position.x + Math.cos(angle) * beetle.radius * 1.3;
                    const y = beetle.position.y + Math.sin(angle) * beetle.radius * 1.3;
                    
                    c.beginPath();
                    c.arc(x, y, 2, 0, Math.PI * 2);
                    c.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    c.fill();
                }
            }
    
            // Lose condition - but only if not invincible
            if (!playerState.invincible && 
                Math.hypot(
                    beetle.position.x - forestSpirit.position.x,
                    beetle.position.y - forestSpirit.position.y
                ) < beetle.radius + forestSpirit.radius
            ) {
                // Create death effect
                particleSystem.createParticles(
                    forestSpirit.position.x, 
                    forestSpirit.position.y, 
                    30, 
                    { min: 100, max: 160 }
                );
                
                cancelAnimationFrame(animationId);
                gameOver();
            }
            
            // Beetle movement AI - only if not frozen
            if (!playerState.freezeEnemies) {
                const collisions = [];
                boundaries.forEach((boundary) => {
                    if (
                        !collisions.includes('right') &&
                        circleWithRect({
                            circle: { ...beetle, velocity: { x: 3, y: 0 } },
                            rectangle: boundary,
                        })
                    ) {
                        collisions.push('right');
                    }
                    if (
                        !collisions.includes('left') &&
                        circleWithRect({
                            circle: { ...beetle, velocity: { x: -3, y: 0 } },
                            rectangle: boundary,
                        })
                    ) {
                        collisions.push('left');
                    }
                    if (
                        !collisions.includes('up') &&
                        circleWithRect({
                            circle: { ...beetle, velocity: { x: 0, y: -3 } },
                            rectangle: boundary,
                        })
                    ) {
                        collisions.push('up');
                    }
                    if (
                        !collisions.includes('down') &&
                        circleWithRect({
                            circle: { ...beetle, velocity: { x: 0, y: 3 } },
                            rectangle: boundary,
                        })
                    ) {
                        collisions.push('down');
                    }
                });
            
                // If there are collisions, change direction
                if (collisions.length > 0) {
                    const directions = ['up', 'down', 'left', 'right'].filter(
                        direction => !collisions.includes(direction)
                    );
                    
                    if (directions.length > 0) {
                        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
                        
                        switch (randomDirection) {
                            case 'up':
                                beetle.velocity.y = -beetle.speed;
                                beetle.velocity.x = 0;
                                break;
                            case 'down':
                                beetle.velocity.y = beetle.speed;
                                beetle.velocity.x = 0;
                                break;
                            case 'left':
                                beetle.velocity.y = 0;
                                beetle.velocity.x = -beetle.speed;
                                break;
                            case 'right':
                                beetle.velocity.y = 0;
                                beetle.velocity.x = beetle.speed;
                                break;
                        }
                    }
                }
            }
        });
        
        // Reset player velocity after all checks
        forestSpirit.velocity.x = 0;
        forestSpirit.velocity.y = 0;
    }
}

// Visual effect when collecting an orb
function createCollectionEffect(x, y) {
    // Optional: Add particle effects or visual indicator when collecting orbs
}

// Refill orbs when all are collected
function refillLightOrbs() {
    currentLevel++;
    levelCounter.innerHTML = currentLevel;
    levelCounter.classList.add('level-change');
    setTimeout(() => {
        levelCounter.classList.remove('level-change');
    }, 500);
    
    // Increase difficulty with each level by making beetles faster
    beetles.forEach(beetle => {
        beetle.speed = 2 + Math.min(currentLevel * 0.3, 3); // Cap speed increase at level 10
    });
    
    // Play level up sound
    playSound('levelUp');
    
    // Create level up visual effect
    createLevelUpEffect();
    
    // Try to spawn a power-up
    spawnPowerUp();
    
    // Add slight delay before refilling orbs for better effect
    setTimeout(() => {
        map.forEach((row, i) => {
            row.forEach((symbol, j) => {
                if (symbol === '.') {
                    lightOrbs.push(new LightOrb({
                        position: {
                            x: Boundary.width * j + Boundary.width / 2,
                            y: Boundary.height * i + Boundary.height / 2
                        },
                    }));
                }
            });
        });
    }, 1000);
}

// Event listeners for controls
window.addEventListener('keydown', ({ key }) => {
    switch (key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
            keys.w.pressed = true;
            lastKey = 'w';
            break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
            keys.a.pressed = true;
            lastKey = 'a';
            break;
        case 's':
        case 'S':
        case 'ArrowDown':
            keys.s.pressed = true;
            lastKey = 's';
            break;
        case 'd':
        case 'D':
        case 'ArrowRight':
            keys.d.pressed = true;
            lastKey = 'd';
            break;
        case 'Escape':
        case 'p':
        case 'P':
            togglePause();
            break;
        case 'm':
        case 'M':
            toggleSound();
            break;
    }
});

window.addEventListener('keyup', ({ key }) => {
    switch (key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
            keys.w.pressed = false;
            break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
            keys.a.pressed = false;
            break;
        case 's':
        case 'S':
        case 'ArrowDown':
            keys.s.pressed = false;
            break;
        case 'd':
        case 'D':
        case 'ArrowRight':
            keys.d.pressed = false;
            break;
    }
});

// Background elements
class Background {
    constructor() {
        this.elements = [];
        this.createElements();
    }
    
    createElements() {
        // Create scattered leaves in the background
        for (let i = 0; i < 30; i++) {
            this.elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 3 + Math.random() * 7,
                alpha: 0.05 + Math.random() * 0.1,
                hue: 80 + Math.random() * 40,
                rotation: Math.random() * Math.PI * 2,
                type: 'leaf'
            });
        }
        
        // Create some ground texture/moss
        for (let i = 0; i < 50; i++) {
            this.elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 10 + Math.random() * 30,
                alpha: 0.03 + Math.random() * 0.05,
                hue: 100 + Math.random() * 20,
                type: 'moss'
            });
        }
    }
    
    draw() {
        this.elements.forEach(element => {
            c.save();
            
            if (element.type === 'leaf') {
                c.translate(element.x, element.y);
                c.rotate(element.rotation);
                
                // Draw a simple leaf shape
                c.beginPath();
                c.ellipse(0, 0, element.size * 2, element.size, 0, 0, Math.PI * 2);
                c.fillStyle = `hsla(${element.hue}, 70%, 40%, ${element.alpha})`;
                c.fill();
                c.closePath();
                
                // Draw leaf vein
                c.beginPath();
                c.moveTo(-element.size * 2, 0);
                c.lineTo(element.size * 2, 0);
                c.strokeStyle = `hsla(${element.hue - 10}, 70%, 30%, ${element.alpha * 2})`;
                c.lineWidth = 1;
                c.stroke();
                c.closePath();
            } else if (element.type === 'moss') {
                // Draw a moss patch
                c.beginPath();
                c.arc(element.x, element.y, element.size, 0, Math.PI * 2);
                c.fillStyle = `hsla(${element.hue}, 60%, 25%, ${element.alpha})`;
                c.fill();
                c.closePath();
            }
            
            c.restore();
        });
    }
}

// Initialize background
const background = new Background();

// Update player state timers
function updatePlayerState() {
    if (playerState.speedBoost) {
        playerState.speedTimer--;
        if (playerState.speedTimer <= 0) {
            playerState.speedBoost = false;
        }
    }
    
    if (playerState.invincible) {
        playerState.invincibleTimer--;
        if (playerState.invincibleTimer <= 0) {
            playerState.invincible = false;
        }
    }
    
    if (playerState.freezeEnemies) {
        playerState.freezeTimer--;
        if (playerState.freezeTimer <= 0) {
            playerState.freezeEnemies = false;
        }
    }
}

// Apply power-up effect
function applyPowerUp(type) {
    switch(type) {
        case 'speed':
            playerState.speedBoost = true;
            playerState.speedTimer = 600; // 10 seconds at 60 FPS
            break;
        case 'invincibility':
            playerState.invincible = true;
            playerState.invincibleTimer = 300; // 5 seconds
            break;
        case 'freeze':
            playerState.freezeEnemies = true;
            playerState.freezeTimer = 180; // 3 seconds
            break;
    }
    
    // Visual feedback for power-up activation
    const feedbackText = document.createElement('div');
    feedbackText.style.position = 'fixed';
    feedbackText.style.top = '20%';
    feedbackText.style.left = '50%';
    feedbackText.style.transform = 'translate(-50%, -50%)';
    feedbackText.style.color = 'white';
    feedbackText.style.fontSize = '2rem';
    feedbackText.style.fontWeight = 'bold';
    feedbackText.style.zIndex = '100';
    feedbackText.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
    feedbackText.style.transition = 'opacity 1s, transform 1s';
    feedbackText.style.opacity = '1';
    
    switch(type) {
        case 'speed':
            feedbackText.textContent = '⚡ SPEED BOOST!';
            feedbackText.style.color = '#0096ff';
            break;
        case 'invincibility':
            feedbackText.textContent = '★ INVINCIBLE!';
            feedbackText.style.color = '#ffd700';
            break;
        case 'freeze':
            feedbackText.textContent = '❄ FREEZE!';
            feedbackText.style.color = '#a0ffff';
            break;
    }
    
    document.body.appendChild(feedbackText);
    
    setTimeout(() => {
        feedbackText.style.opacity = '0';
        feedbackText.style.transform = 'translate(-50%, -100%)';
        
        setTimeout(() => {
            document.body.removeChild(feedbackText);
        }, 1000);
    }, 2000);
}

// Spawn power-up with some randomness
function spawnPowerUp() {
    // Check if we already have power-ups
    if (powerUps.length >= 1) return;
    
    // Only spawn power-ups after level 2
    if (currentLevel < 2) return;
    
    // Only spawn with 5% chance each refill
    if (Math.random() > 0.05 * currentLevel) return;
    
    // Find a suitable position (in an open area)
    let position = null;
    let attempts = 0;
    
    while (!position && attempts < 20) {
        attempts++;
        
        const testX = Boundary.width * (1 + Math.floor(Math.random() * (map[0].length - 2)));
        const testY = Boundary.height * (1 + Math.floor(Math.random() * (map.length - 2)));
        
        // Check if this position overlaps with boundaries
        let validPosition = true;
        
        for (const boundary of boundaries) {
            if (
                testX >= boundary.position.x - Boundary.width/2 &&
                testX <= boundary.position.x + Boundary.width*1.5 &&
                testY >= boundary.position.y - Boundary.height/2 &&
                testY <= boundary.position.y + Boundary.height*1.5
            ) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            position = { x: testX, y: testY };
        }
    }
    
    if (position) {
        powerUps.push(new PowerUp({ position }));
    }
}

// Update loading progress
function updateLoadingProgress() {
    if (assetsLoaded >= totalAssets) {
        // All assets loaded
        setTimeout(() => {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500); // Short delay to ensure everything is ready
        }, 500); // Short delay to ensure everything is ready
    }
}

// Add a safety timeout to ensure loading overlay is hidden even if some assets fail to load
setTimeout(() => {
    if (loadingOverlay.style.display !== 'none') {
        console.log('Forcing loading screen to hide after timeout');
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }
}, 5000); // Force-hide after 5 seconds 

// Assets loading system
function preloadAssets() {
    // List of all images to preload
    const imagePaths = [
        './img/pipeHorizontal.png',
        './img/pipeVertical.png',
        './img/pipeCorner1.png',
        './img/pipeCorner2.png',
        './img/pipeCorner3.png',
        './img/pipeCorner4.png',
        './img/block.png',
        './img/capTop.png',
        './img/capBottom.png',
        './img/capLeft.png',
        './img/capRight.png',
        './img/pipeConnectorBottom.png',
        './img/pipeConnectorTop.png',
        './img/pipeCross.png',
        './img/greenG.png',
        './img/pinkG.png',
        './img/blueG.png'
    ];

    totalAssets = imagePaths.length;
    
    // Safety check - if no assets are found, force completion
    if (totalAssets === 0) {
        console.warn('No assets found to preload');
        assetsLoaded = 0;
        totalAssets = 1; // Prevent division by zero
        updateLoadingProgress();
        return;
    }

    // Preload all images
    imagePaths.forEach(path => {
        const img = new Image();
        img.src = path;
        img.onload = () => {
            assetsLoaded++;
            updateLoadingProgress();
        };
        img.onerror = () => {
            console.warn(`Failed to load image: ${path}`);
            assetsLoaded++;
            updateLoadingProgress();
        };
        
        // Add a timeout for each image to ensure we don't wait forever
        setTimeout(() => {
            if (img.complete) return; // Already loaded or failed
            console.warn(`Timed out loading image: ${path}`);
            assetsLoaded++;
            updateLoadingProgress();
        }, 3000); // 3 second timeout per image
    });

    // Initialize audio (doesn't count towards loading progress)
    initAudio();
    
    // Create character preview in start screen
    renderCharacterPreview();
}

// Function to force start the game interface if loading is stuck
function forceStartGameInterface() {
    // Hide loading overlay
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.display = 'none';
    
    // Show start screen
    startDiv.style.display = "block";
    canvas.style.display = "block";
    
    // Make sure essential elements are initialized
    if (boundaries.length === 0) {
        console.warn("Boundaries not initialized, forcing initialization");
        initializeGameElements();
    }
    
    console.log("Game interface forcefully started");
}

// Add a more aggressive timeout that will force the game to start
setTimeout(forceStartGameInterface, 8000); // 8 seconds 

// Initialize audio
function initAudio() {
    try {
        // Create audio elements
        sounds.background = new Audio();
        sounds.background.src = 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-music-689.mp3';
        sounds.background.loop = true;
        sounds.background.volume = 0.3;

        sounds.collect = new Audio();
        sounds.collect.src = 'https://assets.mixkit.co/sfx/preview/mixkit-fairy-magic-sparkle-875.mp3';
        sounds.collect.volume = 0.5;

        sounds.gameOver = new Audio();
        sounds.gameOver.src = 'https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3';
        sounds.gameOver.volume = 0.5;

        sounds.move = new Audio();
        sounds.move.src = 'https://assets.mixkit.co/sfx/preview/mixkit-quick-magic-wet-sweep-2583.mp3';
        sounds.move.volume = 0.2;
        
        sounds.levelUp = new Audio();
        sounds.levelUp.src = 'https://assets.mixkit.co/sfx/preview/mixkit-magical-coin-win-1936.mp3';
        sounds.levelUp.volume = 0.6;

        // Toggle sound button event
        soundToggle.addEventListener('click', toggleSound);
        
        console.log("Audio initialized successfully");
    } catch (error) {
        console.error("Error initializing audio:", error);
        // If audio fails to initialize, make sure we set soundEnabled to false
        soundEnabled = false;
        if (soundToggle) {
            soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
            soundToggle.classList.add('muted');
        }
    }
}

// Play sound if enabled
function playSound(sound) {
    if (!soundEnabled || !sounds[sound]) return;
    
    try {
        // For short sounds, reset to start to allow rapid play
        if (sound !== 'background') {
            sounds[sound].currentTime = 0;
        }
        sounds[sound].play().catch(error => {
            console.warn('Audio play failed:', error);
        });
    } catch (error) {
        console.warn('Error playing sound:', error);
    }
}

// Render character preview in the start screen
function renderCharacterPreview() {
    try {
        if (!characterPreview) {
            console.warn("Character preview element not found");
            return;
        }
        
        // Clear any existing content
        characterPreview.innerHTML = '';
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 100;
        previewCanvas.height = 100;
        const ctx = previewCanvas.getContext('2d');
        
        if (!ctx) {
            console.warn("Could not get canvas context for character preview");
            return;
        }
        
        // Animation function
        function animatePreview() {
            if (!ctx) return;
            
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            
            // Simple green circle as fallback
            const centerX = previewCanvas.width / 2;
            const centerY = previewCanvas.height / 2;
            const radius = 15;
            
            // Draw main body
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#7affb9';
            ctx.fill();
            
            // Draw eyes
            ctx.beginPath();
            ctx.arc(centerX - 5, centerY - 4, 2, 0, Math.PI * 2);
            ctx.arc(centerX + 5, centerY - 4, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            
            // Draw smile
            ctx.beginPath();
            ctx.arc(centerX, centerY + 2, 6, 0, Math.PI);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            // Call next frame if still in preview mode
            if (!gameStarted) {
                requestAnimationFrame(animatePreview);
            }
        }
        
        // Start animation
        animatePreview();
        
        // Add to DOM
        characterPreview.appendChild(previewCanvas);
        
        console.log("Character preview rendered successfully");
    } catch (error) {
        console.error("Error rendering character preview:", error);
    }
} 