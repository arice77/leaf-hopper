// DOM Elements
const canvas = document.getElementById('gameCanvas');
const c = canvas.getContext('2d');
const scoreC = document.getElementById('scoreC');
const startDiv = document.getElementById('start');
const gameOverDiv = document.getElementById('game-over');
const finalScore = document.getElementById('finalScore');
const forestElements = document.querySelector('.forest-elements');
const loadingOverlay = document.getElementById('loadingOverlay');
const soundToggle = document.getElementById('soundToggle');
const characterPreview = document.querySelector('.character-preview');
const levelCounter = document.getElementById('levelCounter');
const manualContinue = document.getElementById('manualContinue');
const authOverlay = document.getElementById('authOverlay');
const connectWalletBtn = document.getElementById('connectWallet');
const skipAuthBtn = document.getElementById('skipAuth');
const walletInfo = document.getElementById('walletInfo');
const accountDisplay = document.getElementById('accountDisplay');
const startAfterAuthBtn = document.getElementById('startAfterAuth');
const walletAddressShort = document.getElementById('walletAddressShort');
const headerWalletAddress = document.getElementById('headerWalletAddress');

// Wallet and Web3 variables
let userAccount = null;
let web3 = null;
let isAuthenticating = false;
let isAuthenticated = false;
let gameTokens = 0;
let nftsMinted = 0;

// NFT and Token Contract variables
const NFT_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with your actual contract address
const TOKEN_CONTRACT_ADDRESS = "0x0987654321098765432109876543210987654321"; // Replace with your actual contract address
let nftContract = null;
let tokenContract = null;

// NFT Contract ABI - simplified version for demo
const NFT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "tokenURI", "type": "string"},
            {"internalType": "uint256", "name": "score", "type": "uint256"}
        ],
        "name": "mintAchievement",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Token Contract ABI - simplified version for demo
const TOKEN_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "recipient", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// Game variables
let score = 0;
let currentLevel = 1;
let soundEnabled = true;
let assetsLoaded = 0;
let totalAssets = 0;
let gameStarted = false;
let gamePaused = false;
let pauseOverlay = null;
let animationId;
let forestSpirit;

// Sound effects
const sounds = {
    background: null,
    collect: null,
    gameOver: null,
    move: null,
    levelUp: null
};

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

// Controls
const keys = {
    w: { pressed: false },
    a: { pressed: false },
    s: { pressed: false },
    d: { pressed: false }
};
let lastKey = '';

// Boundary class
class Boundary {
    static width = 40;
    static height = 40;
    constructor({ position, image }) {
        this.position = position;
        this.width = Boundary.width;
        this.height = Boundary.height;
        this.image = image;
    }
    
    draw() {
        if (this.image) {
            c.drawImage(
                this.image,
                this.position.x,
                this.position.y,
                this.width,
                this.height
            );
        }
    }
}

// Player character
class ForestSpirit {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 15;
        this.color = '#7affb9';
        this.trailPositions = [];
        this.maxTrail = 8;
        this.glowSize = 20;
        this.glowOpacity = 0.6;
        this.pulseDirection = 1;
        this.pulseSpeed = 0.02;
        this.wingAngle = 0;
    }

    draw() {
        // Update animation values
        this.wingAngle += 0.1;
        this.glowOpacity += this.pulseDirection * this.pulseSpeed;
        
        if (this.glowOpacity >= 0.7) {
            this.pulseDirection = -1;
        } else if (this.glowOpacity <= 0.4) {
            this.pulseDirection = 1;
        }
        
        // Draw glow effect
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius + this.glowSize, 0, Math.PI * 2);
        const gradient = c.createRadialGradient(
            this.position.x, this.position.y, this.radius,
            this.position.x, this.position.y, this.radius + this.glowSize
        );
        gradient.addColorStop(0, `rgba(122, 255, 185, ${this.glowOpacity})`);
        gradient.addColorStop(1, 'rgba(122, 255, 185, 0)');
        c.fillStyle = gradient;
        c.fill();
        
        // Draw trail
        this.trailPositions.forEach((pos, i) => {
            const alpha = 0.3 * (1 - i / this.maxTrail);
            const size = this.radius * (0.7 - i * 0.05);
            
            c.beginPath();
            c.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            c.fillStyle = `rgba(122, 255, 185, ${alpha})`;
            c.fill();
        });
        
        // Draw main body
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        
        // Draw wings (fluttering)
        const wingSpread = 15;
        const wingFlutter = Math.sin(this.wingAngle) * 5;
        
        // Left wing
        c.beginPath();
        c.moveTo(this.position.x - 5, this.position.y - 2);
        c.quadraticCurveTo(
            this.position.x - 20, 
            this.position.y - wingFlutter - 10,
            this.position.x - wingSpread, 
            this.position.y + 5
        );
        c.quadraticCurveTo(
            this.position.x - 10, 
            this.position.y,
            this.position.x - 5, 
            this.position.y - 2
        );
        c.fillStyle = 'rgba(122, 255, 185, 0.7)';
        c.fill();
        
        // Right wing
        c.beginPath();
        c.moveTo(this.position.x + 5, this.position.y - 2);
        c.quadraticCurveTo(
            this.position.x + 20, 
            this.position.y - wingFlutter - 10,
            this.position.x + wingSpread, 
            this.position.y + 5
        );
        c.quadraticCurveTo(
            this.position.x + 10, 
            this.position.y,
            this.position.x + 5, 
            this.position.y - 2
        );
        c.fillStyle = 'rgba(122, 255, 185, 0.7)';
        c.fill();
        
        // Draw eyes
        c.beginPath();
        c.arc(this.position.x - 5, this.position.y - 4, 2, 0, Math.PI * 2);
        c.arc(this.position.x + 5, this.position.y - 4, 2, 0, Math.PI * 2);
        c.fillStyle = 'black';
        c.fill();
        
        // Draw smile
        c.beginPath();
        c.arc(this.position.x, this.position.y + 2, 6, 0, Math.PI);
        c.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        c.lineWidth = 1.5;
        c.stroke();
    }

    update() {
        // Add current position to trail when moving
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            this.trailPositions.unshift({x: this.position.x, y: this.position.y});
            
            // Limit trail length
            if (this.trailPositions.length > this.maxTrail) {
                this.trailPositions.pop();
            }
        }
        
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

// Enemy class improved with consistent design
class Beetle {
    static speed = 2;
    constructor({position, velocity, color = 'red', size = 16, type = 'standard'}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = size;
        this.baseColor = color;
        this.color = color;
        this.prevCollisions = [];
        this.speed = 2;
        this.type = type;
        this.wiggleAngle = 0;
        this.wiggleSpeed = 0.1;
        this.pulseAmount = 0;
        this.pulseDirection = 1;
        this.bodySegments = 3; // Number of body segments for beetles
        this.faceAngle = 0;    // Angle used to determine which way the beetle is facing
    }

    draw() {
        // Update animation values
        this.wiggleAngle += this.wiggleSpeed;
        this.pulseAmount += 0.02 * this.pulseDirection;
        
        if (this.pulseAmount >= 1) {
            this.pulseDirection = -1;
        } else if (this.pulseAmount <= 0) {
            this.pulseDirection = 1;
        }
        
        // Update face angle based on movement direction
        if (this.velocity.x > 0) this.faceAngle = 0;
        else if (this.velocity.x < 0) this.faceAngle = Math.PI;
        else if (this.velocity.y > 0) this.faceAngle = Math.PI / 2;
        else if (this.velocity.y < 0) this.faceAngle = Math.PI * 1.5;
        
        // Draw effects based on beetle type
        if (this.type === 'fire') {
            // Fire beetle with glowing effect
            this.drawFireEffects();
        } else if (this.type === 'poison') {
            // Poison beetle with sickly green color
            this.drawPoisonEffects();
        } else if (this.type === 'shadow') {
            // Shadow beetle with dark smoky effect
            this.drawShadowEffects();
        } else {
            // Standard beetle
            this.drawStandardEffects();
        }
        
        // Draw beetle body (segmented)
        this.drawSegmentedBody();
        
        // Draw beetle details (except for shadow type)
        if (this.type !== 'shadow') {
            this.drawBeetleDetails();
        }
    }
    
    drawFireEffects() {
        // Fire glow
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius + 5 + this.pulseAmount * 3, 0, Math.PI * 2);
        const glowGradient = c.createRadialGradient(
            this.position.x, this.position.y, this.radius,
            this.position.x, this.position.y, this.radius + 8
        );
        glowGradient.addColorStop(0, 'rgba(255, 100, 0, 0.5)');
        glowGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        c.fillStyle = glowGradient;
        c.fill();
        
        // Fire particles
        for (let i = 0; i < 3; i++) {
            const angle = this.wiggleAngle * 2 + i * (Math.PI * 2 / 3);
            const distance = this.radius * 0.8;
            const x = this.position.x + Math.cos(angle) * distance;
            const y = this.position.y + Math.sin(angle) * distance;
            const size = 2 + Math.sin(this.wiggleAngle * 3 + i) * 1;
            
            c.beginPath();
            c.arc(x, y, size, 0, Math.PI * 2);
            c.fillStyle = 'rgba(255, 200, 50, 0.8)';
            c.fill();
        }
    }
    
    drawPoisonEffects() {
        // Toxic bubbles
        for (let i = 0; i < 4; i++) {
            const angle = this.wiggleAngle + i * (Math.PI * 2 / 4);
            const bubbleX = this.position.x + Math.cos(angle) * (this.radius * 0.9);
            const bubbleY = this.position.y + Math.sin(angle) * (this.radius * 0.9);
            const bubbleSize = 3 + Math.sin(this.wiggleAngle * 2 + i) * 1;
            
            c.beginPath();
            c.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            c.fillStyle = 'rgba(200, 255, 150, 0.8)';
            c.fill();
        }
        
        // Poison cloud
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius + 3, 0, Math.PI * 2);
        const poisonGradient = c.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.5,
            this.position.x, this.position.y, this.radius + 3
        );
        poisonGradient.addColorStop(0, 'rgba(170, 255, 0, 0.4)');
        poisonGradient.addColorStop(1, 'rgba(170, 255, 0, 0)');
        c.fillStyle = poisonGradient;
        c.fill();
    }
    
    drawShadowEffects() {
        // Shadow trail
        for (let i = 1; i <= 3; i++) {
            const trailX = this.position.x - this.velocity.x * i * 1.5;
            const trailY = this.position.y - this.velocity.y * i * 1.5;
            
            c.beginPath();
            c.arc(trailX, trailY, this.radius * (1 - i * 0.2), 0, Math.PI * 2);
            c.fillStyle = `rgba(20, 20, 30, ${0.3 - i * 0.1})`;
            c.fill();
        }
        
        // Main shadow body
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'rgba(40, 40, 60, 0.9)';
        c.fill();
        
        // Glowing eyes
        const eyeAngle = 0.3;
        const eyeDistance = this.radius * 0.4;
        
        // Left eye
        c.beginPath();
        c.arc(
            this.position.x + Math.cos(this.faceAngle + eyeAngle) * eyeDistance,
            this.position.y + Math.sin(this.faceAngle + eyeAngle) * eyeDistance,
            2,
            0,
            Math.PI * 2
        );
        // Right eye
        c.arc(
            this.position.x + Math.cos(this.faceAngle - eyeAngle) * eyeDistance,
            this.position.y + Math.sin(this.faceAngle - eyeAngle) * eyeDistance,
            2,
            0,
            Math.PI * 2
        );
        c.fillStyle = 'rgba(255, 0, 0, 0.8)';
        c.fill();
    }
    
    drawStandardEffects() {
        // Nothing special for standard beetles
    }
    
    drawSegmentedBody() {
        // Draw beetle body segments
        for (let i = 0; i < this.bodySegments; i++) {
            const segmentOffsetX = -this.velocity.x * (i * 3);
            const segmentOffsetY = -this.velocity.y * (i * 3);
            const segmentSize = this.radius * (1 - i * 0.15);
            
            c.beginPath();
            c.arc(
                this.position.x + segmentOffsetX,
                this.position.y + segmentOffsetY,
                segmentSize,
                0,
                Math.PI * 2
            );
            
            // Different fill styles based on beetle type
            if (this.type === 'fire') {
                const gradient = c.createRadialGradient(
                    this.position.x + segmentOffsetX,
                    this.position.y + segmentOffsetY,
                    0,
                    this.position.x + segmentOffsetX,
                    this.position.y + segmentOffsetY,
                    segmentSize
                );
                gradient.addColorStop(0, '#ff9900');
                gradient.addColorStop(0.6, '#ff3300');
                gradient.addColorStop(1, '#990000');
                c.fillStyle = gradient;
            } else if (this.type === 'poison') {
                const gradient = c.createRadialGradient(
                    this.position.x + segmentOffsetX,
                    this.position.y + segmentOffsetY,
                    0,
                    this.position.x + segmentOffsetX,
                    this.position.y + segmentOffsetY,
                    segmentSize
                );
                gradient.addColorStop(0, '#aaff00');
                gradient.addColorStop(0.6, '#88cc00');
                gradient.addColorStop(1, '#446600');
                c.fillStyle = gradient;
            } else if (this.type === 'shadow') {
                c.fillStyle = `rgba(40, 40, 60, ${0.9 - i * 0.2})`;
            } else {
                // Standard beetle
                c.fillStyle = this.baseColor;
            }
            
            c.fill();
        }
    }
    
    drawBeetleDetails() {
        // Draw beetle legs
        const legCount = 6;
        const legLength = this.radius * 0.8;
        
        for (let i = 0; i < legCount; i++) {
            const angle = (i / legCount) * Math.PI * 2 + Math.sin(this.wiggleAngle) * 0.2;
            const legStartX = this.position.x + Math.cos(angle) * this.radius;
            const legStartY = this.position.y + Math.sin(angle) * this.radius;
            const legEndX = this.position.x + Math.cos(angle) * (this.radius + legLength);
            const legEndY = this.position.y + Math.sin(angle) * (this.radius + legLength);
            
            c.beginPath();
            c.moveTo(legStartX, legStartY);
            c.lineTo(legEndX, legEndY);
            c.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            c.lineWidth = 1.5;
            c.stroke();
        }
        
        // Draw antennae
        c.beginPath();
        c.moveTo(
            this.position.x + Math.cos(this.faceAngle - 0.3) * this.radius * 0.7,
            this.position.y + Math.sin(this.faceAngle - 0.3) * this.radius * 0.7
        );
        c.lineTo(
            this.position.x + Math.cos(this.faceAngle - 0.3) * this.radius * 1.7,
            this.position.y + Math.sin(this.faceAngle - 0.3) * this.radius * 1.7
        );
        
        c.moveTo(
            this.position.x + Math.cos(this.faceAngle + 0.3) * this.radius * 0.7,
            this.position.y + Math.sin(this.faceAngle + 0.3) * this.radius * 0.7
        );
        c.lineTo(
            this.position.x + Math.cos(this.faceAngle + 0.3) * this.radius * 1.7,
            this.position.y + Math.sin(this.faceAngle + 0.3) * this.radius * 1.7
        );
        
        c.strokeStyle = 'rgba(0, 0, 0, 0.7)';
        c.lineWidth = 1;
        c.stroke();
        
        // Draw eyes
        const eyeAngle = 0.3;
        const eyeDistance = this.radius * 0.4;
        
        c.beginPath();
        c.arc(
            this.position.x + Math.cos(this.faceAngle + eyeAngle) * eyeDistance,
            this.position.y + Math.sin(this.faceAngle + eyeAngle) * eyeDistance,
            2,
            0,
            Math.PI * 2
        );
        c.arc(
            this.position.x + Math.cos(this.faceAngle - eyeAngle) * eyeDistance,
            this.position.y + Math.sin(this.faceAngle - eyeAngle) * eyeDistance,
            2,
            0,
            Math.PI * 2
        );
        c.fillStyle = 'black';
        c.fill();
    }

    update() {
        this.draw();
        
        // Don't move if frozen
        if (!playerState.freezeEnemies) {
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }
    }
}

// Collectible class
class LightOrb {
    constructor({position}) {
        this.position = position;
        this.radius = 8;
        this.hue = 50 + Math.random() * 20;
    }

    draw() {
        // Draw orb
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        c.fill();
        
        // Draw glow
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2);
        const gradient = c.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius * 2
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 0.5)`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 70%, 0)`);
        c.fillStyle = gradient;
        c.fill();
    }
}

// Create a new more organic, complex maze layout
const map = [
    ['1','_','_','_','_','_','_','_','_','_','_','_','_','2'],
    ['|','.','.','.','.','.','.','.','.','.','.','.','.','/'],
    ['|','.','1','_','2','.','1','_','_','2','.','b','.','/'],
    ['|','.','|','b','|','.','|','.','.','/','.','.','.','|'],
    ['|','.','4','_','3','.','4','_','_','3','.','b','.','|'],
    ['|','.','.','.','.','.','.','.','.','.','.','.','.','|'],
    ['|','.','b','.','b','.','b','.','b','.','b','.','b','|'],
    ['|','.','.','.','.','.','.','.','.','.','.','.','.','|'],
    ['|','.','1','_','2','.','1','_','_','2','.','1','_','3'],
    ['|','.','|','.','/','.','/','.','.','|','.','|','.','|'],
    ['|','.','|','.','b','.','b','.','b','|','.','|','.','|'],
    ['|','.','4','_','_','_','_','_','_','3','.','4','_','3'],
    ['|','.','.','.','.','.','.','.','.','.','.','.','.','|'],
    ['4','_','_','_','_','_','_','_','_','_','_','_','_','3']
];

// Helper function to create images
function createImage(src) {
    const image = new Image();
    image.src = src;
    return image;
}

// Collision detection
function circleWithRect({ circle, rectangle }) {
    return (
        circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height &&
        circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x &&
        circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y &&
        circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width
    );
}

// Initialize all game elements based on the map
function initializeGameElements() {
    try {
        // Clear existing elements
        boundaries.length = 0;
        lightOrbs.length = 0;
        beetles.length = 0;
        
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

        // Create player character
        forestSpirit = new ForestSpirit({
            position: {
                x: Boundary.width + Boundary.width/2,
                y: Boundary.height + Boundary.height/2
            },
            velocity: {
                x: 0,
                y: 0
            }
        });

        // Create beetles (enemies) - now with 4 different types
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
                type: 'standard'
            }),
            new Beetle({
                position: {
                    x: Boundary.width * 3 + Boundary.width/2,
                    y: Boundary.height * 6 + Boundary.height/2
                },
                velocity: {
                    x: Beetle.speed,
                    y: 0
                },
                color: '#556B2F', // Dark olive green
                type: 'poison',
                size: 18
            }),
            new Beetle({
                position: {
                    x: Boundary.width * 10 + Boundary.width/2,
                    y: Boundary.height * 10 + Boundary.height/2
                },
                velocity: {
                    x: 0,
                    y: Beetle.speed
                },
                color: '#8B0000', // Dark red
                type: 'fire',
                size: 17
            }),
            new Beetle({
                position: {
                    x: Boundary.width * 8 + Boundary.width/2,
                    y: Boundary.height * 3 + Boundary.height/2
                },
                velocity: {
                    x: 0,
                    y: Beetle.speed
                },
                color: '#2F4F4F', // Dark slate
                type: 'shadow',
                size: 15
            })
        );
    } catch (error) {
        console.error("Error initializing game elements:", error);
    }
}

// Create visual effect when collecting an orb
function createCollectionEffect(x, y) {
    // Play sound
    playSound('collect');
    
    // Add score animation
    scoreC.classList.add('score-change');
    setTimeout(() => {
        scoreC.classList.remove('score-change');
    }, 500);
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
    
    // Reward tokens when leveling up
    if (isAuthenticated && currentLevel % 2 === 0) { // Every other level
        rewardTokens(Math.floor(currentLevel / 2));
    }
    
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

// Toggle pause state
function togglePause() {
    if (!gameStarted) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        // Pause game
        cancelAnimationFrame(animationId);
        
        // Create pause overlay
        pauseOverlay = document.createElement('div');
        pauseOverlay.style.position = 'fixed';
        pauseOverlay.style.top = '0';
        pauseOverlay.style.left = '0';
        pauseOverlay.style.width = '100%';
        pauseOverlay.style.height = '100%';
        pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        pauseOverlay.style.zIndex = '20';
        pauseOverlay.style.display = 'flex';
        pauseOverlay.style.flexDirection = 'column';
        pauseOverlay.style.justifyContent = 'center';
        pauseOverlay.style.alignItems = 'center';
        
        const pauseText = document.createElement('h2');
        pauseText.textContent = 'GAME PAUSED';
        pauseText.style.color = 'var(--light-green)';
        pauseText.style.fontSize = '3rem';
        pauseText.style.marginBottom = '20px';
        
        const resumeText = document.createElement('p');
        resumeText.textContent = 'Press ESC or P to resume';
        resumeText.style.color = 'var(--gold)';
        resumeText.style.fontSize = '1.5rem';
        
        pauseOverlay.appendChild(pauseText);
        pauseOverlay.appendChild(resumeText);
        
        document.body.appendChild(pauseOverlay);
        
        // Pause background music if playing
        if (sounds.background && !sounds.background.paused && soundEnabled) {
            sounds.background.pause();
        }
    } else {
        // Remove pause overlay
        if (pauseOverlay) {
            document.body.removeChild(pauseOverlay);
            pauseOverlay = null;
        }
        
        // Resume game
        animation();
        
        // Resume background music if it was playing
        if (sounds.background && soundEnabled) {
            sounds.background.play().catch(error => {
                console.warn('Audio play failed:', error);
            });
        }
    }
}

// Define animation loop
function animation() {
    if (!gamePaused) {
        animationId = requestAnimationFrame(animation);
        c.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw forest background
        c.fillStyle = '#0a3d0a';
        c.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw background elements
        background.draw();
        
        // Draw boundaries first (as background)
        boundaries.forEach((boundary) => {
            boundary.draw();
        });
        
        // Handle player movement with improved boundary detection
        let playerMoved = false;
        const playerSpeed = playerState.speedBoost ? 4.5 : 3;
        let nextX = forestSpirit.position.x;
        let nextY = forestSpirit.position.y;
        
        if (keys.w.pressed) {
            nextY -= playerSpeed;
            playerMoved = true;
        } else if (keys.a.pressed) {
            nextX -= playerSpeed;
            playerMoved = true;
        } else if (keys.s.pressed) {
            nextY += playerSpeed;
            playerMoved = true;
        } else if (keys.d.pressed) {
            nextX += playerSpeed;
            playerMoved = true;
        }
        
        // Check boundary collisions before moving
        let colliding = false;
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            
            if (circleCollidesWithRectangle({
                circle: {
                    ...forestSpirit,
                    position: {
                        x: nextX,
                        y: nextY
                    }
                },
                rectangle: boundary
            })) {
                colliding = true;
                break;
            }
        }
        
        // Only move if not colliding with any boundary
        if (!colliding) {
            forestSpirit.position.x = nextX;
            forestSpirit.position.y = nextY;
        }
        
        // Draw orbs
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
            beetle.update();
    
            // Lose condition
            if (!playerState.invincible && Math.hypot(
                beetle.position.x - forestSpirit.position.x,
                beetle.position.y - forestSpirit.position.y)
                < beetle.radius + forestSpirit.radius) 
            {
                cancelAnimationFrame(animationId);
                gameOver();
            }
            
            // Beetle boundary collision detection and movement logic
            const collisions = [];
            boundaries.forEach((boundary) => {
                if (
                    !collisions.includes('right') &&
                    circleCollidesWithRectangle({
                        circle: { 
                            ...beetle, 
                            position: {
                                x: beetle.position.x + beetle.speed,
                                y: beetle.position.y
                            }
                        },
                        rectangle: boundary,
                    })
                ) {
                    collisions.push('right');
                }
                if (
                    !collisions.includes('left') &&
                    circleCollidesWithRectangle({
                        circle: { 
                            ...beetle, 
                            position: {
                                x: beetle.position.x - beetle.speed,
                                y: beetle.position.y
                            }
                        },
                        rectangle: boundary,
                    })
                ) {
                    collisions.push('left');
                }
                if (
                    !collisions.includes('up') &&
                    circleCollidesWithRectangle({
                        circle: { 
                            ...beetle, 
                            position: {
                                x: beetle.position.x,
                                y: beetle.position.y - beetle.speed
                            }
                        },
                        rectangle: boundary,
                    })
                ) {
                    collisions.push('up');
                }
                if (
                    !collisions.includes('down') &&
                    circleCollidesWithRectangle({
                        circle: { 
                            ...beetle, 
                            position: {
                                x: beetle.position.x,
                                y: beetle.position.y + beetle.speed
                            }
                        },
                        rectangle: boundary,
                    })
                ) {
                    collisions.push('down');
                }
            });
            
            // Check if current direction is in collisions
            if (beetle.velocity.x > 0 && collisions.includes('right') ||
                beetle.velocity.x < 0 && collisions.includes('left') ||
                beetle.velocity.y > 0 && collisions.includes('down') ||
                beetle.velocity.y < 0 && collisions.includes('up')) {
                
                // Current direction has collision, choose a new random direction
                const possibleDirections = ['up', 'down', 'left', 'right'].filter(
                    direction => !collisions.includes(direction)
                );
                
                if (possibleDirections.length > 0) {
                    const randomDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                    
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
                } else {
                    // All directions blocked, stop
                    beetle.velocity.x = 0;
                    beetle.velocity.y = 0;
                }
            }
            
            // Random chance to change direction even without collision
            if (Math.random() < 0.005 && !playerState.freezeEnemies) {
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
        });
    }
}

// Improved collision detection
function circleCollidesWithRectangle({ circle, rectangle }) {
    // Calculate the closest point on the rectangle to the circle
    const closestX = Math.max(rectangle.position.x, Math.min(circle.position.x, rectangle.position.x + rectangle.width));
    const closestY = Math.max(rectangle.position.y, Math.min(circle.position.y, rectangle.position.y + rectangle.height));
    
    // Calculate the distance between the circle's center and this closest point
    const distanceX = circle.position.x - closestX;
    const distanceY = circle.position.y - closestY;
    
    // If the distance is less than the circle's radius, an intersection occurs
    const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared <= (circle.radius * circle.radius);
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

// Render character preview
function renderCharacterPreview() {
    try {
        if (!characterPreview) return;
        
        // Clear any existing content
        characterPreview.innerHTML = '';
        
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 100;
        previewCanvas.height = 100;
        const ctx = previewCanvas.getContext('2d');
        
        if (!ctx) return;
        
        // Animation function
        function animatePreview() {
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            
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
    } catch (error) {
        console.error("Error rendering character preview:", error);
    }
}

// Background class for forest elements
class Background {
    constructor() {
        this.elements = [];
        
        // Create ambient lights
        for (let i = 0; i < 5; i++) {
            this.elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 20 + Math.random() * 30,
                alpha: 0.03 + Math.random() * 0.05,
                hue: 120 + Math.random() * 60,
                type: 'light'
            });
        }
    }
    
    draw() {
        // Draw ambient lights
        this.elements.forEach(element => {
            if (element.type === 'light') {
                c.beginPath();
                c.arc(element.x, element.y, element.radius, 0, Math.PI * 2);
                c.fillStyle = `hsla(${element.hue}, 80%, 60%, ${element.alpha})`;
                c.fill();
            }
        });
    }
}

// Initialize background
const background = new Background();

// MetaMask Auth Functions
async function initializeWeb3() {
    try {
        // Modern dapp browsers
        if (window.ethereum) {
            console.log("Modern ethereum browser detected");
            web3 = new Web3(window.ethereum);
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (_chainId) => {
                console.log("Chain changed, reloading...");
                window.location.reload();
            });
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log("Account changed");
                if (accounts.length === 0) {
                    // User disconnected their wallet
                    handleDisconnect();
                } else {
                    userAccount = accounts[0];
                    updateWalletDisplay();
                }
            });
            
            return true;
        } 
        // Legacy dapp browsers
        else if (window.web3) {
            console.log("Legacy web3 browser detected");
            web3 = new Web3(window.web3.currentProvider);
            return true;
        }
        // No web3 injection
        else {
            console.log("No web3 browser detected");
            return false;
        }
    } catch (error) {
        console.error("Error initializing Web3:", error);
        return false;
    }
}

async function connectWallet() {
    if (isAuthenticating) return;
    
    try {
        isAuthenticating = true;
        
        if (!web3) {
            const initialized = await initializeWeb3();
            if (!initialized) {
                alert("Please install MetaMask to use this feature");
                isAuthenticating = false;
                return;
            }
        }
        
        // Request accounts access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        isAuthenticated = true;
        
        console.log("Connected:", userAccount);
        
        // Save authentication to local storage
        localStorage.setItem('leafHopperAuth', JSON.stringify({
            address: userAccount,
            timestamp: new Date().getTime(),
            mode: 'wallet'
        }));
        
        // Initialize contract interfaces
        initializeContracts();
        
        // Update UI
        updateWalletDisplay();
        
        // Show wallet info section
        walletInfo.style.display = "block";
        connectWalletBtn.style.display = "none";
        
        // Get token balance
        await updateTokenBalance();
        
        // Hide auth overlay and proceed to game
        if (authOverlay) {
            authOverlay.style.display = "none";
        }
        
        // Show loading screen briefly
        if (loadingOverlay) {
            loadingOverlay.style.display = "flex";
            
            // Start the game after a brief loading period
            setTimeout(() => {
                forceStartGameInterface();
            }, 1500);
        } else {
            // If no loading overlay, start game directly
            forceStartGameInterface();
        }
        
    } catch (error) {
        console.error("Error connecting wallet:", error);
        if (error.code === 4001) {
            // User rejected the request
            alert("Please connect MetaMask to play the game");
        } else {
            alert("Error connecting to MetaMask. Please try again.");
        }
    } finally {
        isAuthenticating = false;
    }
}

function initializeContracts() {
    try {
        if (!web3) return;
        
        // Initialize NFT contract
        nftContract = new web3.eth.Contract(NFT_ABI, NFT_CONTRACT_ADDRESS);
        
        // Initialize Token contract
        tokenContract = new web3.eth.Contract(TOKEN_ABI, TOKEN_CONTRACT_ADDRESS);
        
        console.log("Contracts initialized");
    } catch (error) {
        console.error("Error initializing contracts:", error);
    }
}

async function updateTokenBalance() {
    try {
        if (!userAccount || !tokenContract || userAccount === "demo-mode") return;
        
        const balance = await tokenContract.methods.balanceOf(userAccount).call();
        gameTokens = web3.utils.fromWei(balance, 'ether');
        
        console.log("Token balance:", gameTokens);
        
        // Update UI with token balance
        document.getElementById('tokenBalanceDisplay').textContent = gameTokens;
    } catch (error) {
        console.error("Error updating token balance:", error);
    }
}

async function mintNFT(score, level) {
    try {
        if (!userAccount || !nftContract || userAccount === "demo-mode") {
            // In demo mode, simulate minting
            showNFTMintedMessage(true, 'Demo Mode');
            return;
        }
        
        // Show direct minting notification with white background and black text
        const notification = document.createElement('div');
        notification.className = 'blockchain-notification minting';
        notification.style.backgroundColor = 'white';
        notification.style.color = 'black';
        notification.style.border = '3px solid #f6851b';
        notification.style.zIndex = '99999';
        notification.style.position = 'fixed';
        notification.style.bottom = '30px';
        notification.style.right = '30px';
        notification.style.padding = '20px';
        notification.style.borderRadius = '10px';
        notification.style.display = 'flex';
        notification.style.gap = '15px';
        notification.style.maxWidth = '400px';
        notification.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
        
        notification.innerHTML = `
            <div style="font-size: 2rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #f6851b;">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div style="flex: 1;">
                <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #000;">NFT Minting Notice</h3>
                <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #000;">Your NFT is about to be minted:</p>
                <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9rem; color: #000;">
                    <li>A MetaMask transaction popup will appear</li>
                    <li>You'll need to click "Review" then "Confirm"</li>
                    <li>Your achievement will be saved to the blockchain</li>
                </ul>
            </div>
        `;
        document.body.appendChild(notification);
        
        // Small delay to ensure notification is visible
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Prepare token URI
        const tokenURI = `ipfs://QmHashPlaceholder/${score}-${level}`;
        
        // Keep the transaction call as simple as possible
        const tx = nftContract.methods.mintAchievement(tokenURI, score);
        const receipt = await tx.send({ from: userAccount });
        
        // Remove notification after transaction
        notification.remove();
        
        console.log("NFT minted:", receipt);
        nftsMinted++;
        
        // Show success message
        showNFTMintedMessage(true, receipt.transactionHash);
        
    } catch (error) {
        console.error("Error minting NFT:", error);
        showNFTMintedMessage(false, error.message);
    }
}

async function rewardTokens(level) {
    try {
        if (!userAccount || !tokenContract || userAccount === "demo-mode") {
            // In demo mode, simulate token reward
            showTokenRewardMessage(true, 'Demo Mode');
            return;
        }
        
        // Calculate token reward based on level
        // In this example: level 1 = 1 token, level 2 = 2 tokens, etc.
        const tokenAmount = web3.utils.toWei(level.toString(), 'ether');
        
        // Show rewarding notification
        showRewardingTokensNotification(level);
        
        // In a real scenario, this would be called by the game contract
        // For demo, we'll just simulate receiving tokens
        
        // This would be implemented on the contract side in production:
        // const result = await tokenContract.methods.transfer(userAccount, tokenAmount)
        //    .send({ from: CONTRACT_OWNER_ADDRESS });
        
        // Simulate success
        setTimeout(() => {
            gameTokens = (parseFloat(gameTokens) + parseFloat(level)).toString();
            document.getElementById('tokenBalanceDisplay').textContent = gameTokens;
            showTokenRewardMessage(true, "Success");
        }, 2000);
        
    } catch (error) {
        console.error("Error rewarding tokens:", error);
        showTokenRewardMessage(false, error.message);
    }
}

function showMintingNotification() {
    // Remove any existing minting notifications
    const existingNotifications = document.querySelectorAll('.blockchain-notification.minting');
    existingNotifications.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'blockchain-notification minting metamask-confirm-transaction-notification';
    notification.style.position = 'fixed';
    notification.style.bottom = '30px';
    notification.style.right = '30px';
    notification.style.maxWidth = '350px';
    notification.style.zIndex = '9999';
    notification.style.pointerEvents = 'none'; // Make notification non-interactive
    
    notification.innerHTML = `
        <div class="notification-icon"><i class="fas fa-spinner fa-spin"></i></div>
        <div class="notification-content">
            <h3>Minting Achievement NFT</h3>
            <p>Please confirm the transaction in MetaMask</p>
            <p style="font-size:12px;margin-top:8px;">Look for the MetaMask popup and click the blue confirmation button</p>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
}

function showRewardingTokensNotification(amount) {
    const notification = document.createElement('div');
    notification.className = 'blockchain-notification rewarding';
    
    // Apply direct styling for visibility
    notification.style.backgroundColor = 'white';
    notification.style.color = 'black';
    notification.style.border = '3px solid #f8d347';
    notification.style.zIndex = '99999';
    notification.style.position = 'fixed';
    notification.style.bottom = '30px';
    notification.style.right = '30px';
    notification.style.padding = '20px';
    notification.style.borderRadius = '10px';
    notification.style.display = 'flex';
    notification.style.gap = '15px';
    notification.style.maxWidth = '400px';
    notification.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
    
    notification.innerHTML = `
        <div style="font-size: 2rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #f8d347;">
            <i class="fas fa-coins"></i>
        </div>
        <div style="flex: 1;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #000;">Receiving ${amount} Forest Tokens</h3>
            <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #000;">Processing your reward...</p>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showNFTMintedMessage(success, details) {
    // Remove previous notifications
    const existingNotifications = document.querySelectorAll('.blockchain-notification.minting');
    existingNotifications.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `blockchain-notification ${success ? 'success' : 'error'}`;
    
    // Apply direct styling to ensure visibility
    notification.style.backgroundColor = 'white';
    notification.style.color = 'black';
    notification.style.border = `3px solid ${success ? '#62c462' : '#ee5f5b'}`;
    notification.style.zIndex = '99999';
    notification.style.position = 'fixed';
    notification.style.bottom = '30px';
    notification.style.right = '30px';
    notification.style.padding = '20px';
    notification.style.borderRadius = '10px';
    notification.style.display = 'flex';
    notification.style.gap = '15px';
    notification.style.maxWidth = '400px';
    notification.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
    
    notification.innerHTML = `
        <div style="font-size: 2rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: ${success ? '#62c462' : '#ee5f5b'};">
            <i class="fas ${success ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div style="flex: 1;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #000;">${success ? 'NFT Minted Successfully!' : 'Minting Failed'}</h3>
            <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #000;">${success ? 'Your achievement is now on the blockchain.' : 'There was an error minting your NFT.'}</p>
            <div style="font-size: 0.8rem; color: #555; word-break: break-all;">${details.substring(0, 20)}${details.length > 20 ? '...' : ''}</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showTokenRewardMessage(success, details) {
    // Remove previous notifications
    const existingNotifications = document.querySelectorAll('.blockchain-notification.rewarding');
    existingNotifications.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `blockchain-notification ${success ? 'success' : 'error'}`;
    
    // Apply direct styling to ensure visibility
    notification.style.backgroundColor = 'white';
    notification.style.color = 'black';
    notification.style.border = `3px solid ${success ? '#f8d347' : '#ee5f5b'}`;
    notification.style.zIndex = '99999';
    notification.style.position = 'fixed';
    notification.style.bottom = '30px';
    notification.style.right = '30px';
    notification.style.padding = '20px';
    notification.style.borderRadius = '10px';
    notification.style.display = 'flex';
    notification.style.gap = '15px';
    notification.style.maxWidth = '400px';
    notification.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
    
    notification.innerHTML = `
        <div style="font-size: 2rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: ${success ? '#f8d347' : '#ee5f5b'};">
            <i class="fas ${success ? 'fa-coins' : 'fa-exclamation-circle'}"></i>
        </div>
        <div style="flex: 1;">
            <h3 style="margin: 0 0 5px 0; font-size: 1.1rem; color: #000;">${success ? 'Tokens Received!' : 'Token Reward Failed'}</h3>
            <p style="margin: 0 0 5px 0; font-size: 0.9rem; color: #000;">${success ? 'Forest Tokens have been added to your wallet.' : 'There was an error sending tokens.'}</p>
            <div style="font-size: 0.8rem; color: #555; word-break: break-all;">${details.substring(0, 20)}${details.length > 20 ? '...' : ''}</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function updateWalletDisplay() {
    if (!userAccount) return;
    
    // Format address for display (0x1234...5678)
    const shortAddress = userAccount.substring(0, 6) + '...' + userAccount.substring(userAccount.length - 4);
    
    // Update address display in both auth overlay and game UI
    if (accountDisplay) {
        accountDisplay.textContent = shortAddress;
    }
    
    if (walletAddressShort) {
        walletAddressShort.textContent = shortAddress;
    }
    
    // Update the header wallet address display
    if (headerWalletAddress) {
        headerWalletAddress.textContent = shortAddress;
    }
}

function handleDisconnect() {
    userAccount = null;
    isAuthenticated = false;
    
    // Update UI
    if (walletInfo) {
        walletInfo.style.display = "none";
    }
    
    if (connectWalletBtn) {
        connectWalletBtn.style.display = "block";
    }
    
    if (accountDisplay) {
        accountDisplay.textContent = "Not connected";
    }
    
    if (walletAddressShort) {
        walletAddressShort.textContent = "Not Connected";
    }
    
    // Update the header wallet address display
    if (headerWalletAddress) {
        headerWalletAddress.textContent = "Not Connected";
    }
}

function continueWithoutAuth() {
    console.log("Continuing without authentication (demo mode)");
    
    // Save demo mode authentication to local storage
    localStorage.setItem('leafHopperAuth', JSON.stringify({
        timestamp: new Date().getTime(),
        mode: 'demo'
    }));
    
    // Hide auth overlay and continue to game
    if (authOverlay) {
        authOverlay.style.display = "none";
    }
    
    userAccount = "demo-mode";
    isAuthenticated = true;
    
    // Update wallet displays with "Demo Mode"
    if (walletAddressShort) {
        walletAddressShort.textContent = "Demo Mode";
    }
    
    // Update the header wallet address display
    if (headerWalletAddress) {
        headerWalletAddress.textContent = "Demo Mode";
    }
    
    // Set demo token balance
    gameTokens = "10"; // Give some demo tokens to start with
    if (document.getElementById('tokenBalanceDisplay')) {
        document.getElementById('tokenBalanceDisplay').textContent = gameTokens;
    }
    
    // Show loading screen briefly
    if (loadingOverlay) {
        loadingOverlay.style.display = "flex";
    }
    
    // Notify the user they're in demo mode
    const demoNotification = document.createElement('div');
    demoNotification.className = 'blockchain-notification info';
    demoNotification.innerHTML = `
        <div class="notification-icon"><i class="fas fa-info-circle"></i></div>
        <div class="notification-content">
            <h3>Demo Mode Active</h3>
            <p>Playing in demo mode without real blockchain transactions</p>
        </div>
    `;
    document.body.appendChild(demoNotification);
    
    setTimeout(() => {
        demoNotification.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            demoNotification.classList.remove('show');
            setTimeout(() => {
                demoNotification.remove();
            }, 500);
        }, 5000);
    }, 100);
    
    // Force start the game interface after a slight delay
    setTimeout(() => {
        forceStartGameInterface();
    }, 1500);
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    // Set canvas size
    setCanvasSize();
    
    // Create forest elements
    createForestElements();
    
    // Check for saved authentication
    checkSavedAuth();
    
    // Add manual continue button event
    if (manualContinue) {
        manualContinue.addEventListener('click', function(e) {
            e.preventDefault();
            forceStartGameInterface();
        });
    }
    
    // Setup MetaMask auth components
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    if (skipAuthBtn) {
        skipAuthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            continueWithoutAuth();
        });
    }
    
    if (startAfterAuthBtn) {
        startAfterAuthBtn.addEventListener('click', function(e) {
            e.preventDefault();
            authOverlay.style.display = "none";
            loadingOverlay.style.display = "flex";
            
            // Start the game after a brief loading period
            setTimeout(() => {
                forceStartGameInterface();
            }, 1500);
        });
    }
    
    // Setup NFT collection button
    const viewNftCollectionBtn = document.getElementById('viewNftCollectionBtn');
    if (viewNftCollectionBtn) {
        viewNftCollectionBtn.addEventListener('click', function() {
            showNftCollection();
        });
    }
    
    // Initialize web3 in background
    initializeWeb3().then(hasWeb3 => {
        console.log("Web3 initialization status:", hasWeb3);
    });
    
    // Start preloading assets
    preloadAssets();
    
    // Add resize listener
    window.addEventListener('resize', setCanvasSize);
    
    // Add force show fallback after 3 seconds
    setTimeout(() => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('delayed');
        }
    }, 3000);
    
    // Force hide loading screen after 8 seconds
    setTimeout(() => {
        forceStartGameInterface();
    }, 8000);
});

// Helper function to check for saved authentication
function checkSavedAuth() {
    try {
        // Check local storage for saved auth data
        const savedAuth = localStorage.getItem('leafHopperAuth');
        if (savedAuth) {
            const authData = JSON.parse(savedAuth);
            
            // Check if auth is still valid (less than 1 day old)
            const now = new Date().getTime();
            if (now - authData.timestamp < 24 * 60 * 60 * 1000) {
                console.log("Found valid saved authentication");
                
                // If in demo mode
                if (authData.mode === 'demo') {
                    // Skip auth and go to demo mode
                    setTimeout(() => {
                        continueWithoutAuth();
                    }, 500);
                    return;
                }
                
                // Automatically connect if MetaMask is available
                if (window.ethereum) {
                    // Auto-connect wallet
                    setTimeout(() => {
                        connectWallet();
                    }, 500);
                }
            } else {
                // Auth expired, remove it
                localStorage.removeItem('leafHopperAuth');
            }
        }
    } catch (error) {
        console.error("Error checking saved authentication:", error);
    }
}

// Force start game interface
function forceStartGameInterface() {
    console.log("Game interface forcefully started");
    
    // Hide auth overlay if it exists
    if (authOverlay) {
        authOverlay.style.display = "none";
    }
    
    // Hide loading overlay
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.display = 'none';
    }
    
    // Show start screen
    if (startDiv) {
        startDiv.style.display = "block";
    }
    
    if (canvas) {
        canvas.style.display = "block";
    }
    
    // Make sure essential elements are initialized
    if (boundaries.length === 0) {
        console.log("Boundaries not initialized, forcing initialization");
        initializeGameElements();
    }
    
    // If authentication is complete, start the game directly
    if (isAuthenticated) {
        startGame();
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
            }, 500);
        }, 500);
    }
}

// Audio initialization
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
        if (soundToggle) {
            soundToggle.addEventListener('click', toggleSound);
        }
        
        console.log("Audio initialized successfully");
    } catch (error) {
        console.error("Error initializing audio:", error);
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

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundToggle.classList.remove('muted');
        if (gameStarted && sounds.background) {
            playSound('background');
        }
    } else {
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundToggle.classList.add('muted');
        if (sounds.background) {
            sounds.background.pause();
        }
    }
}

// Set canvas size to be responsive but maintain aspect ratio
function setCanvasSize() {
    try {
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) return;
        
        // Get container dimensions
        const containerWidth = gameContainer.clientWidth;
        const containerHeight = gameContainer.clientHeight;
        
        // Determine available space (accounting for other UI elements)
        const availableHeight = window.innerHeight - 120; // Account for header and other UI
        
        if (window.innerWidth < 768) {
            // Mobile layout
            canvas.width = Math.min(containerWidth - 20, 650);
            canvas.height = Math.min(availableHeight * 0.9, canvas.width * 1.2);
        } else {
            // Desktop layout - maintain aspect ratio
            const aspectRatio = 0.85; // Slightly taller than wide for a maze
            
            // Start with width-based calculation
            let proposedWidth = Math.min(containerWidth * 0.92, 900);
            let proposedHeight = proposedWidth * aspectRatio;
            
            // If height exceeds available space, recalculate based on height
            if (proposedHeight > availableHeight * 0.9) {
                proposedHeight = availableHeight * 0.9;
                proposedWidth = proposedHeight / aspectRatio;
            }
            
            canvas.width = Math.floor(proposedWidth);
            canvas.height = Math.floor(proposedHeight);
        }
        
        // Center canvas horizontally within game container (handled by CSS now)
        canvas.style.margin = '0 auto';
        
        // Update boundary dimensions based on canvas size and map dimensions
        const mapWidth = 14; // Width of the map array
        const mapHeight = 13; // Height of the map array
        
        // Calculate the maximum possible cell size while keeping aspect ratio
        const maxCellWidth = canvas.width / mapWidth;
        const maxCellHeight = canvas.height / mapHeight;
        
        // Choose the smaller dimension to ensure everything fits
        const cellSize = Math.floor(Math.min(maxCellWidth, maxCellHeight));
        
        // Update boundary dimensions
        Boundary.width = cellSize;
        Boundary.height = cellSize;
        
        // Log for debugging
        console.log(`Canvas size set to ${canvas.width}x${canvas.height}, cell size: ${cellSize}`);
    } catch (error) {
        console.error("Error setting canvas size:", error);
        // Set default values if there's an error
        Boundary.width = 40;
        Boundary.height = 40;
    }
}
// Assets loading system
function preloadAssets() {
    try {
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
        setTimeout(() => {
            renderCharacterPreview();
        }, 500);
        
    } catch (error) {
        console.error("Error preloading assets:", error);
        forceStartGameInterface();
    }
}

// Start the game
function startGame() {
    try {
        // Don't start if not authenticated (unless in demo mode)
        if (!isAuthenticated && !userAccount) {
            alert("Please connect with MetaMask before playing!");
            return;
        }
        
        gameStarted = true;
        score = 0;
        currentLevel = 1;
        scoreC.innerHTML = score;
        if (levelCounter) levelCounter.innerHTML = currentLevel;
        startDiv.style.display = "none";
        gameOverDiv.style.display = "none";
        canvas.style.display = "block";
        
        // Play background music
        playSound('background');
        
        // Reset game elements
        lightOrbs.length = 0;
        beetles.length = 0;
        initializeGameElements();
        
        // Start animation loop
        animation();
    } catch (error) {
        console.error("Error starting game:", error);
        alert("There was an error starting the game. Please refresh the page and try again.");
    }
}

// Game over
function gameOver() {
    try {
        gameStarted = false;
        gameOverDiv.style.display = "block";
        canvas.style.display = "none";
        finalScore.innerHTML = score;
        
        // Add level information to game over screen
        const finalLevelElem = document.getElementById('finalLevel');
        if (finalLevelElem) {
            finalLevelElem.innerHTML = currentLevel;
        }
        
        // Play game over sound
        if (sounds.background) sounds.background.pause();
        playSound('gameOver');
        
        // Mint NFT if score is high enough
        if (isAuthenticated && score > 100) {
            // Small delay to allow game over screen to display first
            setTimeout(() => {
                mintNFT(score, currentLevel);
            }, 2000);
        }
    } catch (error) {
        console.error("Error handling game over:", error);
    }

}

// Restart game
function restartGame() {
    location.reload();
    startGame();
}

// Create decorative forest elements
function createForestElements() {
    try {
        if (!forestElements) return;
        
        // This function is a placeholder for adding decorative elements
        // Implement forest element creation if needed
    } catch (error) {
        console.error("Error creating forest elements:", error);
    }
}

// Show NFT collection
function showNftCollection() {
    // If not authenticated, prompt to connect
    if (!isAuthenticated || !userAccount) {
        alert("Please connect your wallet to view your NFT collection");
        return;
    }
    
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'nft-modal-overlay';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'nft-modal-content';
    
    // Create header
    const modalHeader = document.createElement('div');
    modalHeader.className = 'nft-modal-header';
    modalHeader.innerHTML = `
        <h2>Your NFT Collection</h2>
        <button class="close-modal-btn"><i class="fas fa-times"></i></button>
    `;
    
    // Create NFT container
    const nftContainer = document.createElement('div');
    nftContainer.className = 'nft-container';
    
    if (userAccount === "demo-mode") {
        // Demo mode - show sample NFTs
        nftContainer.innerHTML = `
            <div class="nft-card">
                <div class="nft-image"><img src="https://via.placeholder.com/200x200.png?text=Demo+NFT"></div>
                <div class="nft-info">
                    <h3>Leaf Hopper Achievement - Level 3</h3>
                    <p>Score: 450</p>
                    <p>Level: 3</p>
                    <p class="nft-date">Minted: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
            <div class="nft-card">
                <div class="nft-image"><img src="https://via.placeholder.com/200x200.png?text=Demo+NFT+2"></div>
                <div class="nft-info">
                    <h3>Leaf Hopper Achievement - Level 5</h3>
                    <p>Score: 820</p>
                    <p>Level: 5</p>
                    <p class="nft-date">Minted: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
    } else if (nftsMinted > 0) {
        // Show user's NFTs
        // In a real implementation, you would fetch the NFTs from the blockchain
        nftContainer.innerHTML = `
            <div class="nft-card">
                <div class="nft-image"><img src="https://via.placeholder.com/200x200.png?text=NFT"></div>
                <div class="nft-info">
                    <h3>Leaf Hopper Achievement - Level ${currentLevel}</h3>
                    <p>Score: ${score}</p>
                    <p>Level: ${currentLevel}</p>
                    <p class="nft-date">Minted: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        `;
    } else {
        // No NFTs yet
        nftContainer.innerHTML = `
            <div class="no-nfts">
                <i class="fas fa-medal"></i>
                <p>You haven't earned any NFTs yet. Reach a higher score to earn your first achievement NFT!</p>
            </div>
        `;
    }
    
    // Assemble modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(nftContainer);
    modalOverlay.appendChild(modalContent);
    
    // Add to document
    document.body.appendChild(modalOverlay);
    
    // Show modal with animation
    setTimeout(() => {
        modalOverlay.classList.add('show');
    }, 10);
    
    // Add close functionality
    const closeBtn = modalOverlay.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(modalOverlay);
        }, 300);
    });
    
    // Close on clicking overlay
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(modalOverlay);
            }, 300);
        }
    });
}

// Add MetaMask interaction handler
document.addEventListener('DOMContentLoaded', function() {
    // Create a global handler for MetaMask popups
    window.handleMetaMaskPopup = function() {
        // Check if MetaMask is active
        if (window.ethereum) {
            // Create an observer to watch for MetaMask UI elements
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length) {
                        // Look for MetaMask confirmation dialogs
                        const metamaskDialogs = document.querySelectorAll('[data-testid="confirmation-footer"], [data-testid="page-container-footer-next"]');
                        
                        if (metamaskDialogs.length > 0) {
                            // Ensure they're clickable and visible
                            metamaskDialogs.forEach(dialog => {
                                dialog.style.pointerEvents = 'auto';
                                dialog.style.zIndex = '999999';
                                dialog.style.position = 'relative';
                                
                                // Find confirmation buttons
                                const buttons = dialog.querySelectorAll('button');
                                buttons.forEach(button => {
                                    button.style.pointerEvents = 'auto';
                                    button.style.position = 'relative';
                                    button.style.zIndex = '999999';
                                });
                            });
                            
                            console.log('MetaMask dialog detected and fixed');
                        }
                    }
                }
            });
            
            // Start observing the body
            observer.observe(document.body, { childList: true, subtree: true });
        }
    };
    
    // Initialize the handler
    if (window.ethereum) {
        window.handleMetaMaskPopup();
    }
});



