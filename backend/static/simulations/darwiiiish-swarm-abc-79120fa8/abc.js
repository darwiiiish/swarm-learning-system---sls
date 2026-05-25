const canvas = document.getElementById('abc-canvas');
const ctx = canvas.getContext('2d');

const beeImg = new Image();
beeImg.src = 'assets/bee.png';
const flowerImg = new Image();
flowerImg.src = 'assets/bunch_of_flowers.png';
const hiveImg = new Image();
hiveImg.src = 'assets/hive.png';
const gardenImg = new Image();
gardenImg.src = 'assets/garden.png';

// UI Elements
const beeCountSlider = document.getElementById('bee-count');
const beeCountValue = document.getElementById('bee-count-value');
const limitSlider = document.getElementById('limit-slider');
const limitValue = document.getElementById('limit-value');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const currentBestNectar = document.getElementById('current-best-nectar');
const iterationCountEl = document.getElementById('iteration-count');
const activityLog = document.getElementById('activity-log');
const storageProgress = document.getElementById('storage-progress');
const resetBtn = document.getElementById('reset-btn');

// Simulation State
let width, height;
let hive = { x: 0, y: 0, radius: 30, storage: 0 };
let flowers = [];
let bees = [];
let bestFlower = null;
let iterations = 0;
let searchCount = 0; // Tracks total algorithmic search attempts
let isRunning = true;
let speedMult = 1; // Lowered from 2

// ABC Parameters
let numBees = 100;
let limit = 30; // Depletion limit

const ROLE_SCOUT = 0;
const ROLE_EMPLOYED = 1;
const ROLE_ONLOOKER = 2;

const STATE_SEARCHING = 0;
const STATE_FLYING_TO_FLOWER = 1;
const STATE_GATHERING = 2;
const STATE_FLYING_TO_HIVE = 3;
const STATE_DANCING = 4;
const STATE_WATCHING = 5;

class Flower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.initialNectar = Math.floor(Math.random() * 50) + 50; // 50-100
        this.nectar = this.initialNectar;
        this.radius = 15;
        this.depletionCount = 0; // How many times bees visited
        this.id = Math.random().toString(36).substr(2, 9);
    }

    draw(ctx) {
        if (flowerImg.complete) {
            ctx.drawImage(flowerImg, this.x - this.radius * 1.5, this.y - this.radius * 1.5, this.radius * 3, this.radius * 3);
        }

        // Nectar indicator
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(this.x - 12, this.y + 10, 24, 14);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(this.nectar), this.x, this.y + 20);
    }
}

class Bee {
    constructor() {
        this.x = hive.x;
        this.y = hive.y;
        this.role = ROLE_SCOUT;
        this.state = STATE_SEARCHING;
        this.targetX = hive.x;
        this.targetY = hive.y;
        this.flower = null;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.speed = 1 + Math.random() * 1; // Lowered from 2 + 1.5
        this.nectarLoad = 0;
        this.danceTimer = 0;
        this.danceAngle = 0;
        this.isOwner = false; // Tracks if this bee is the original scout who found the flower
        this.baseRole = ROLE_SCOUT; // Default, overridden in init
    }

    update() {
        switch (this.state) {
            case STATE_SEARCHING:
                // Random wander
                this.x += this.vx * this.speed * speedMult;
                this.y += this.vy * this.speed * speedMult;
                
                // Change direction occasionally or if hitting bounds
                if (Math.random() < 0.05 || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                    const angle = Math.random() * Math.PI * 2;
                    this.vx = Math.cos(angle);
                    this.vy = Math.sin(angle);
                    
                    // keep inside
                    this.x = Math.max(0, Math.min(width, this.x));
                    this.y = Math.max(0, Math.min(height, this.y));
                }

                // Check for flowers
                for (let f of flowers) {
                    const dist = Math.hypot(this.x - f.x, this.y - f.y);
                    if (dist < f.radius * 3) {
                        this.flower = f;
                        this.state = STATE_FLYING_TO_FLOWER;
                        this.role = ROLE_EMPLOYED;
                        this.isOwner = true; // This bee found it, so it owns the dancing rights
                        break;
                    }
                }
                break;

            case STATE_FLYING_TO_FLOWER:
                if (!this.flower || !flowers.includes(this.flower)) {
                    this.role = this.baseRole;
                    this.state = this.role === ROLE_SCOUT ? STATE_SEARCHING : STATE_WATCHING;
                    this.isOwner = false;
                    break;
                }
                const dx1 = this.flower.x - this.x;
                const dy1 = this.flower.y - this.y;
                const dist1 = Math.hypot(dx1, dy1);
                
                if (dist1 < 5) {
                    this.state = STATE_GATHERING;
                } else {
                    this.x += (dx1 / dist1) * this.speed * speedMult;
                    this.y += (dy1 / dist1) * this.speed * speedMult;
                }
                break;

            case STATE_GATHERING:
                if (!this.flower || !flowers.includes(this.flower)) {
                    this.role = this.baseRole;
                    this.state = this.role === ROLE_SCOUT ? STATE_SEARCHING : STATE_WATCHING;
                    this.isOwner = false;
                    break;
                }

                // Neighborhood Search (Exploitation) Math
                // V_ij = X_ij + phi * (X_ij - X_kj)
                if (flowers.length > 1 && Math.random() < 0.05 * speedMult) {
                    let k;
                    do { k = Math.floor(Math.random() * flowers.length); } while (flowers[k] === this.flower);
                    let neighbor = flowers[k];
                    let phiX = (Math.random() - 0.5) * 0.2; // Small shift
                    let phiY = (Math.random() - 0.5) * 0.2;
                    
                    let newX = this.flower.x + phiX * (this.flower.x - neighbor.x);
                    let newY = this.flower.y + phiY * (this.flower.y - neighbor.y);
                    
                    // Keep in bounds
                    this.flower.x = Math.max(30, Math.min(width - 30, newX));
                    this.flower.y = Math.max(30, Math.min(height - 30, newY));

                    // ALGORITHMIC TRACKING: Count this as a search attempt
                    incrementSearch();
                }

                this.nectarLoad += 0.2 * speedMult;
                if (this.nectarLoad >= 1 || this.flower.nectar <= 0) {
                    this.nectarLoad = 1; // Limit to exactly 1
                    this.flower.nectar = Math.max(0, this.flower.nectar - 1);
                    this.flower.depletionCount++;
                    
                    if (this.flower.depletionCount >= limit || this.flower.nectar <= 0) {
                        // Abandon flower
                        flowers = flowers.filter(f => f !== this.flower);
                        logActivity(`Flower depleted. Bees becoming scouts.`);
                    }
                    
                    this.state = STATE_FLYING_TO_HIVE;
                }
                break;

            case STATE_FLYING_TO_HIVE:
                const dx2 = hive.x - this.x;
                const dy2 = hive.y - this.y;
                const dist2 = Math.hypot(dx2, dy2);
                
                if (dist2 < hive.radius) {
                    hive.storage += this.nectarLoad;
                    this.nectarLoad = 0;
                    
                    if (this.flower && flowers.includes(this.flower)) {
                        if (this.isOwner) {
                            this.state = STATE_DANCING;
                            // Dance duration proportional to nectar quality (max 180 frames for visibility)
                            this.danceTimer = Math.min(180, (this.flower.nectar / 100) * 180); 
                        } else {
                            // Recruited onlookers drop off nectar and go back to watching
                            this.role = ROLE_ONLOOKER;
                            this.state = STATE_WATCHING;
                            this.flower = null;
                        }
                    } else {
                        this.role = this.baseRole;
                        this.state = this.role === ROLE_SCOUT ? STATE_SEARCHING : STATE_WATCHING;
                        this.isOwner = false;
                    }
                } else {
                    this.x += (dx2 / dist2) * this.speed * speedMult;
                    this.y += (dy2 / dist2) * this.speed * speedMult;
                }
                break;

            case STATE_DANCING:
                // Wiggle dance: Figure eight (increased amplitude for visibility)
                this.danceTimer -= 1 * speedMult;
                this.danceAngle += 0.3 * speedMult;
                
                this.x = hive.x + Math.sin(this.danceAngle) * 30;
                this.y = hive.y + Math.sin(this.danceAngle * 2) * 20;

                if (this.danceTimer <= 0) {
                    this.state = STATE_FLYING_TO_FLOWER; // Go back
                }
                break;

            case STATE_WATCHING:
                // Onlookers wait at hive
                this.x = hive.x + (Math.random() - 0.5) * hive.radius;
                this.y = hive.y + (Math.random() - 0.5) * hive.radius;
                
                // Probability to pick a flower based on dancers
                const dancingBees = bees.filter(b => b.state === STATE_DANCING);
                if (dancingBees.length > 0 && Math.random() < 0.2 * speedMult) {
                    // Roulette wheel selection using squared nectar for aggressive prioritization
                    let totalFitness = dancingBees.reduce((sum, b) => sum + (b.flower ? Math.pow(b.flower.nectar, 2) : 0), 0);
                    let rand = Math.random() * totalFitness;
                    for (let b of dancingBees) {
                        if (!b.flower) continue;
                        let fitness = Math.pow(b.flower.nectar, 2);
                        rand -= fitness;
                        if (rand <= 0) {
                            this.flower = b.flower;
                            this.role = ROLE_EMPLOYED;
                            this.state = STATE_FLYING_TO_FLOWER;
                            this.isOwner = false; // Recruited bee is not the owner

                            // ALGORITHMIC TRACKING: Count this as an onlooker recruitment/search
                            incrementSearch();
                            break;
                        }
                    }
                }
                break;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let angle = 0;
        if (this.state === STATE_DANCING) {
            // Rapid wiggling angle while dancing
            angle = Math.sin(this.danceAngle * 5) * 0.5;
        } else if (this.state === STATE_FLYING_TO_FLOWER || this.state === STATE_FLYING_TO_HIVE) {
            let tx = this.state === STATE_FLYING_TO_FLOWER ? (this.flower ? this.flower.x : this.x) : hive.x;
            let ty = this.state === STATE_FLYING_TO_FLOWER ? (this.flower ? this.flower.y : this.y) : hive.y;
            angle = Math.atan2(ty - this.y, tx - this.x);
        } else {
            angle = Math.atan2(this.vy, this.vx);
        }
        // Rotate so bee image points towards movement (assuming image points UP)
        ctx.rotate(angle + Math.PI / 2);

        // Draw role-based highlight/glow
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        if (this.role === ROLE_SCOUT) {
            ctx.fillStyle = 'rgba(244, 63, 94, 0.4)'; // Magenta
            ctx.shadowColor = '#f43f5e';
        } else if (this.role === ROLE_EMPLOYED) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.4)'; // Gold/Orange
            ctx.shadowColor = '#f59e0b';
        } else { // ROLE_ONLOOKER
            ctx.fillStyle = 'rgba(14, 165, 233, 0.4)'; // Cyan/Blue
            ctx.shadowColor = '#0ea5e9';
        }
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow blur for other drawings

        if (beeImg.complete) {
            ctx.drawImage(beeImg, -10, -10, 20, 20);
        }

        ctx.restore();
        
        // Dance trail and text
        if (this.state === STATE_DANCING) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI*2);
            ctx.stroke();

            // Add floating "DANCING" text
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('DANCING', this.x - 20, this.y - 25);
        }
    }
}

function init() {
    const wrapper = document.querySelector('.canvas-wrapper');
    width = wrapper.clientWidth;
    height = wrapper.clientHeight;
    canvas.width = width;
    canvas.height = height;

    hive.x = width / 2;
    hive.y = height / 2;
    hive.storage = 0;

    flowers = [];
    bees = [];
    
    // Half scouts, half onlookers
    for (let i = 0; i < numBees; i++) {
        let b = new Bee();
        if (i < numBees / 2) {
            b.role = ROLE_SCOUT;
            b.state = STATE_SEARCHING;
            b.baseRole = ROLE_SCOUT;
        } else {
            b.role = ROLE_ONLOOKER;
            b.state = STATE_WATCHING;
            b.baseRole = ROLE_ONLOOKER;
        }
        bees.push(b);
    }
    
    iterations = 0;
    searchCount = 0;
    activityLog.innerHTML = 'Simulation initialized.';
}

function incrementSearch() {
    searchCount++;
    if (searchCount >= numBees) {
        iterations++;
        searchCount = 0;
        iterationCountEl.textContent = iterations;
    }
}

function logActivity(msg) {
    const el = document.createElement('div');
    el.className = 'log-entry';
    el.textContent = `[Iter ${iterations}] ${msg}`;
    activityLog.prepend(el);
    if (activityLog.children.length > 20) {
        activityLog.removeChild(activityLog.lastChild);
    }
}

function loop() {
    if (!isRunning) return;

    // Background
    if (gardenImg.complete) {
        ctx.drawImage(gardenImg, 0, 0, width, height);
    } else {
        ctx.clearRect(0, 0, width, height);
    }

    // Draw Hive
    if (hiveImg.complete) {
        ctx.drawImage(hiveImg, hive.x - hive.radius * 2, hive.y - hive.radius * 2, hive.radius * 4, hive.radius * 4);
    } else {
        ctx.fillStyle = '#b45309'; // Dark amber
        ctx.beginPath();
        ctx.arc(hive.x, hive.y, hive.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Flowers
    for (let f of flowers) {
        f.draw(ctx);
    }

    // Update and Draw Bees
    for (let b of bees) {
        b.update();
        b.draw(ctx);
    }

    // Update UI
    iterationCountEl.textContent = iterations;
    
    let best = 0;
    for (let f of flowers) {
        if (f.nectar > best) best = f.nectar;
    }
    currentBestNectar.textContent = best > 0 ? best.toFixed(0) : '--';
    
    storageProgress.style.width = Math.min(100, (hive.storage / 1000) * 100) + '%';

    requestAnimationFrame(loop);
}

// Event Listeners
window.addEventListener('resize', () => {
    const wrapper = document.querySelector('.canvas-wrapper');
    width = wrapper.clientWidth;
    height = wrapper.clientHeight;
    canvas.width = width;
    canvas.height = height;
    hive.x = width / 2;
    hive.y = height / 2;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    flowers.push(new Flower(x, y));
    logActivity(`Planted flower at (${Math.round(x)}, ${Math.round(y)}).`);
});

beeCountSlider.addEventListener('input', (e) => {
    numBees = parseInt(e.target.value);
    beeCountValue.textContent = numBees;
    
    // Adjust population
    while (bees.length < numBees) {
        let b = new Bee();
        b.baseRole = Math.random() < 0.5 ? ROLE_SCOUT : ROLE_ONLOOKER;
        b.role = b.baseRole;
        b.state = b.role === ROLE_SCOUT ? STATE_SEARCHING : STATE_WATCHING;
        bees.push(b);
    }
    while (bees.length > numBees) {
        bees.pop();
    }
});

limitSlider.addEventListener('input', (e) => {
    limit = parseInt(e.target.value);
    limitValue.textContent = limit;
});

speedSlider.addEventListener('input', (e) => {
    speedMult = parseFloat(e.target.value);
    speedValue.textContent = speedMult + 'x';
});

resetBtn.addEventListener('click', () => {
    init();
});

// Start
init();
loop();
