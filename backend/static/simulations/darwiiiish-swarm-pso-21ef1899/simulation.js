/**
 * Bird Swarm Optimization (PSO) Simulation
 * Clean Code Implementation
 */

// --- Constants & Config ---
const CONFIG = {
    BIRD_SIZE: 6,
    MAX_VELOCITY: 4,
    MIN_VELOCITY: 0.5,
    SUCCESS_THRESHOLD: 5, // Pixels distance to consider food "eaten"
    START_COLOR: '#2b3327',
    FOOD_COLOR: '#d99132',
    GRASS_COLOR_1: '#82a873',
    GRASS_COLOR_2: '#7ba06d'
};

// --- DOM Elements ---
const DOM = {
    canvas: document.getElementById('grasslandCanvas'),
    overlay: document.getElementById('instructionOverlay'),
    
    // Controls
    numParticles: document.getElementById('numParticles'),
    numParticlesVal: document.getElementById('numParticlesValue'),
    inertia: document.getElementById('inertia'),
    inertiaVal: document.getElementById('inertiaValue'),
    cognitive: document.getElementById('cognitive'),
    cognitiveVal: document.getElementById('cognitiveValue'),
    social: document.getElementById('social'),
    socialVal: document.getElementById('socialValue'),
    neighborhood: document.getElementById('neighborhood'),
    neighborhoodVal: document.getElementById('neighborhoodValue'),
    separation: document.getElementById('separation'),
    separationVal: document.getElementById('separationValue'),
    
    // Stats
    status: document.getElementById('simStatus'),
    iterations: document.getElementById('iterationCount'),
    bestDist: document.getElementById('bestDistance')
};

// --- Vector Utility ---
class Vector2D {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
    }

    sub(v) {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    mult(n) {
        return new Vector2D(this.x * n, this.y * n);
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const m = this.mag();
        if (m !== 0) {
            this.x /= m;
            this.y /= m;
        }
    }

    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.x *= max;
            this.y *= max;
        }
    }
    
    distance(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    copy() {
        return new Vector2D(this.x, this.y);
    }
}

// --- Entity: Bird (Particle) ---
class Bird {
    constructor(x, y) {
        this.position = new Vector2D(x, y);
        this.velocity = new Vector2D(Math.random() * 4 - 2, Math.random() * 4 - 2);
        
        this.personalBestPosition = this.position.copy();
        this.personalBestFitness = Infinity;
        
        this.history = [];
        this.hasBitten = false;
    }

    update(localBestPosition, params, target, separationForce = new Vector2D(0, 0)) {
        if (!target) {
            // Wander mode: pseudo-random walk to naturally scatter the birds
            this.velocity.x += (Math.random() - 0.5) * 1.5;
            this.velocity.y += (Math.random() - 0.5) * 1.5;
            this.velocity.add(separationForce);
            this.velocity.limit(CONFIG.MAX_VELOCITY * 0.7);
            this.position.add(this.velocity);
            return;
        }

        // PSO Velocity Update - randomize per dimension for natural 'wobble' swarm effect
        const rx1 = Math.random();
        const ry1 = Math.random();
        const rx2 = Math.random();
        const ry2 = Math.random();

        const cognitiveX = (this.personalBestPosition.x - this.position.x) * params.c1 * rx1;
        const cognitiveY = (this.personalBestPosition.y - this.position.y) * params.c1 * ry1;
        
        const socialX = (localBestPosition.x - this.position.x) * params.c2 * rx2;
        const socialY = (localBestPosition.y - this.position.y) * params.c2 * ry2;

        this.velocity.x = params.w * this.velocity.x + cognitiveX + socialX + separationForce.x;
        this.velocity.y = params.w * this.velocity.y + cognitiveY + socialY + separationForce.y;

        // Add a small random wobble to prevent perfect single-file lines (trains)
        this.velocity.x += (Math.random() - 0.5) * 1.0;
        this.velocity.y += (Math.random() - 0.5) * 1.0;

        // Limit velocity for natural movement
        this.velocity.limit(CONFIG.MAX_VELOCITY);

        // Update Position
        this.position.add(this.velocity);
    }

    evaluate(target) {
        if (!target) return Infinity;
        
        const currentFitness = this.position.distance(target);
        
        if (currentFitness < this.personalBestFitness) {
            this.personalBestFitness = currentFitness;
            this.personalBestPosition = this.position.copy();
        }
        
        return currentFitness;
    }

    recordHistory() {
        if (this.history.length > 0) {
            const last = this.history[this.history.length - 1];
            if (this.position.distance(last) > 100) {
                // If jumped across the screen due to wrap-around, clear history
                this.history = [];
            }
        }
        this.history.push(this.position.copy());
        if (this.history.length > 8) {
            this.history.shift();
        }
    }

    draw(ctx, birdImage) {
        // Draw trail
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            ctx.strokeStyle = 'rgba(43, 51, 39, 0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);
        
        // If an image asset is loaded, draw it
        if (birdImage && birdImage.complete && birdImage.naturalWidth > 0) {
            // Adjust size to fit bounding box, shift left/up by half width/height to center it at 0,0
            const size = 30; // 30px width
            ctx.drawImage(birdImage, -size / 2, -size / 2, size, size);
        } else {
            // Fallback: Draw simple bird (triangle shape)
            ctx.beginPath();
            ctx.moveTo(CONFIG.BIRD_SIZE, 0); // Nose
            ctx.lineTo(-CONFIG.BIRD_SIZE, -CONFIG.BIRD_SIZE * 0.7); // Left wing
            ctx.lineTo(-CONFIG.BIRD_SIZE * 0.5, 0); // Tail indent
            ctx.lineTo(-CONFIG.BIRD_SIZE, CONFIG.BIRD_SIZE * 0.7); // Right wing
            ctx.closePath();
            
            ctx.fillStyle = CONFIG.START_COLOR;
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// --- Domain logic: PSO Engine ---
class PSOEngine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        this.particles = [];
        this.globalBestPosition = new Vector2D(width / 2, height / 2);
        this.globalBestFitness = Infinity;
        
        this.target = null; // The food
        this.iterations = 0;
        
        this.params = {
            w: parseFloat(DOM.inertia.value),
            c1: parseFloat(DOM.cognitive.value),
            c2: parseFloat(DOM.social.value),
            num: parseInt(DOM.numParticles.value),
            neighborhood: parseInt(DOM.neighborhood.value),
            separation: parseFloat(DOM.separation.value)
        };
        
        this.initParticles();
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.params.num; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.particles.push(new Bird(x, y));
        }
    }

    updateParams() {
        // Read from UI
        this.params.w = parseFloat(DOM.inertia.value);
        this.params.c1 = parseFloat(DOM.cognitive.value);
        this.params.c2 = parseFloat(DOM.social.value);
        this.params.neighborhood = parseInt(DOM.neighborhood.value);
        this.params.separation = parseFloat(DOM.separation.value);
        
        const newNum = parseInt(DOM.numParticles.value);
        if (newNum !== this.params.num) {
            this.params.num = newNum;
            // Add or remove particles to match new amount, keeping existing ones' states
            while (this.particles.length < this.params.num) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                this.particles.push(new Bird(x, y));
            }
            while (this.particles.length > this.params.num) {
                this.particles.pop();
            }
        }
        
        // Update DOM labels
        DOM.inertiaVal.innerText = this.params.w.toFixed(2);
        DOM.cognitiveVal.innerText = this.params.c1.toFixed(1);
        DOM.socialVal.innerText = this.params.c2.toFixed(1);
        DOM.numParticlesVal.innerText = this.params.num;
        DOM.neighborhoodVal.innerText = this.params.neighborhood;
        DOM.separationVal.innerText = this.params.separation.toFixed(1);
    }

    setTarget(x, y) {
        this.target = new Vector2D(x, y);
        this.targetBites = Math.min(45, this.params.num); // 45 bites max, or pop size
        this.globalBestFitness = Infinity; // Reset pathfinding
        this.iterations = 0;
        
        // Reset personal bests so they adapt to new target
        this.particles.forEach(p => {
             p.personalBestFitness = Infinity;
             p.hasBitten = false;
             // slight random velocity kick to prevent clustering
             p.velocity.add(new Vector2D(Math.random() * 2 - 1, Math.random() * 2 - 1));
        });
    }

    step() {
        if (!this.target) return { found: false };

        this.iterations++;
        
        // Evaluate all
        for (const bird of this.particles) {
            const fitness = bird.evaluate(this.target);
            if (fitness < this.globalBestFitness) {
                this.globalBestFitness = fitness;
                this.globalBestPosition = bird.personalBestPosition.copy();
            }
        }

        // Update positions based on evaluations
        for (const bird of this.particles) {
            let localBestFitness = bird.personalBestFitness;
            let localBestPos = bird.personalBestPosition.copy();
            
            let separationForce = new Vector2D(0, 0);
            let separationCount = 0;

            for (const other of this.particles) {
                if (bird === other) continue;
                
                const d = bird.position.distance(other.position);
                
                // Neighborhood influence (Local PSO)
                if (d < this.params.neighborhood) {
                    if (other.personalBestFitness < localBestFitness) {
                        localBestFitness = other.personalBestFitness;
                        localBestPos = other.personalBestPosition.copy();
                    }
                }

                // Separation rule
                const desiredSeparation = CONFIG.BIRD_SIZE * 3;
                if (d < desiredSeparation) {
                    let diff = bird.position.sub(other.position);
                    diff.normalize();
                    diff.x /= d; // Weight by distance
                    diff.y /= d;
                    separationForce.add(diff);
                    separationCount++;
                }
            }

            if (separationCount > 0) {
                separationForce.x /= separationCount;
                separationForce.y /= separationCount;
                if (separationForce.mag() > 0) {
                    separationForce.normalize();
                    separationForce.x *= this.params.separation;
                    separationForce.y *= this.params.separation;
                }
            }

            // If a bird has bitten the target, it should wander away instead of freezing
            bird.update(localBestPos, this.params, bird.hasBitten ? null : this.target, separationForce);
            
            // Screen boundaries
            if (bird.position.x < 0) bird.position.x = this.width;
            if (bird.position.x > this.width) bird.position.x = 0;
            if (bird.position.y < 0) bird.position.y = this.height;
            if (bird.position.y > this.height) bird.position.y = 0;
        }
        
        // Process biting
        if (this.target && this.targetBites > 0) {
            for (const bird of this.particles) {
                if (!bird.hasBitten && bird.position.distance(this.target) < CONFIG.SUCCESS_THRESHOLD * 1.5) {
                    bird.hasBitten = true;
                    this.targetBites--;
                    // Fly off in a random direction after biting
                    bird.velocity = new Vector2D(Math.random() * 4 - 2, Math.random() * 4 - 2);
                    bird.velocity.normalize();
                    bird.velocity.x *= CONFIG.MAX_VELOCITY;
                    bird.velocity.y *= CONFIG.MAX_VELOCITY;
                    if (this.targetBites <= 0) break;
                }
            }
        }
        
        // Check finding condition
        const isFound = this.targetBites !== undefined && this.targetBites <= 0;
        
        if (isFound) {
            this.target = null; // Clear target to trigger wander mode
        }

        return {
            found: isFound,
            bestDist: this.globalBestFitness,
            iter: this.iterations
        };
    }
}

// --- Application Core: Simulation Manager ---
class Simulation {
    constructor() {
        this.ctx = DOM.canvas.getContext('2d');
        this.engine = null;
        this.state = 'idle'; // idle | searching | found

        // Preload real bird image wrapper
        this.birdImage = new Image();
        this.birdImage.src = 'assets/bird.png';

        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        DOM.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Bind inputs
        [DOM.numParticles, DOM.inertia, DOM.cognitive, DOM.social, DOM.neighborhood, DOM.separation].forEach(input => {
            input.addEventListener('input', () => {
                if (this.engine) this.engine.updateParams();
            });
        });

        this.initEngine();
        this.loop();
    }

    resize() {
        DOM.canvas.width = DOM.canvas.clientWidth;
        DOM.canvas.height = DOM.canvas.clientHeight;
        if (this.engine) {
            this.engine.width = DOM.canvas.width;
            this.engine.height = DOM.canvas.height;
        }
    }

    initEngine() {
        this.engine = new PSOEngine(DOM.canvas.width, DOM.canvas.height);
        this.updateUI();
    }

    handleCanvasClick(e) {
        this.state = 'searching';
        DOM.overlay.classList.add('hidden');

        
        const rect = DOM.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.engine.setTarget(x, y);
        
        const terminal = document.getElementById('terminalOutput');
        if (terminal) {
             terminal.innerHTML = `<div class="log-pos">> Target set at [${x.toFixed(1)}, ${y.toFixed(1)}]. Optimizing...</div>`;
        }
        
        this.updateUI();
    }

    updateUI() {
        if (this.state === 'idle') {
            DOM.status.innerText = "Waiting for Food";
            DOM.status.className = "stat-value status-idle";
        } else if (this.state === 'searching') {
            if (this.engine && this.engine.targetBites !== undefined) {
                 DOM.status.innerText = `Eating (${this.engine.targetBites} left)...`;
            } else {
                 DOM.status.innerText = "Searching...";
            }
            DOM.status.className = "stat-value status-searching";
        } else if (this.state === 'found') {
            DOM.status.innerText = "Found & Eaten!";
            DOM.status.className = "stat-value status-found";
        }

        DOM.iterations.innerText = this.engine.iterations;
        
        if (this.engine.globalBestFitness !== Infinity) {
            DOM.bestDist.innerText = this.engine.globalBestFitness.toFixed(1) + " px";
        } else {
            DOM.bestDist.innerText = "-";
        }
    }

    drawBackground() {
        // Clear canvas to let CSS grass background show through
        this.ctx.clearRect(0, 0, DOM.canvas.width, DOM.canvas.height);
        
        // Draw the food target if exists and not eaten
        if (this.engine.target && this.state !== 'found' && this.engine.targetBites > 0) {
            const initialBites = Math.min(45, this.engine.params.num);
            const biteRatio = this.engine.targetBites / initialBites;
            const radius = 3 + (8 * biteRatio); // Scales from 11 down to 3
            
            this.ctx.beginPath();
            this.ctx.arc(this.engine.target.x, this.engine.target.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = CONFIG.FOOD_COLOR;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Label
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.engine.targetBites, this.engine.target.x, this.engine.target.y - radius - 6);
        }
    }

    loop() {
        this.drawBackground();
        
        if (this.state === 'searching') {
            const result = this.engine.step();
            if (this.engine.iterations % 5 === 0) { // Update UI periodically
                 this.updateUI();
            }
            
            // Console output akin to Python
            if (this.engine.iterations % 2 === 0) {
                const terminal = document.getElementById('terminalOutput');
                if (terminal && this.engine.globalBestFitness !== Infinity) {
                    const scoreStr = this.engine.globalBestFitness.toFixed(4);
                    const posX = this.engine.globalBestPosition.x.toFixed(2).padStart(6, ' ');
                    const posY = this.engine.globalBestPosition.y.toFixed(2).padStart(6, ' ');
                    
                    const line = document.createElement('div');
                    line.innerHTML = `<span class="log-iter">Iter ${this.engine.iterations.toString().padStart(3, '0')}</span> | Score: <span class="log-score">${scoreStr.padStart(8, ' ')}</span> | Pos: <span class="log-pos">[${posX}, ${posY}]</span>`;
                    
                    terminal.appendChild(line);
                    terminal.scrollTop = terminal.scrollHeight;
                    
                    if (terminal.childNodes.length > 50) {
                        terminal.removeChild(terminal.firstChild);
                    }
                }
            }
            
            if (result.found) {
                this.state = 'found';
                this.updateUI();
                DOM.overlay.innerText = "Food eaten! Simulation paused. Watch them scatter, then click to place more food.";
                DOM.overlay.classList.remove('hidden');
                
                // Explode them slightly to kick off scattering
                for (const bird of this.engine.particles) {
                    bird.velocity.x = (Math.random() - 0.5) * CONFIG.MAX_VELOCITY * 2;
                    bird.velocity.y = (Math.random() - 0.5) * CONFIG.MAX_VELOCITY * 2;
                }
            }
        } else if (this.state === 'found' || this.state === 'idle') {
            // Found or Idle state: particles wander to scatter out
            for (const bird of this.engine.particles) {
                let separationForce = new Vector2D(0, 0);
                let separationCount = 0;
                for (const other of this.engine.particles) {
                    if (bird === other) continue;
                    const d = bird.position.distance(other.position);
                    const desiredSeparation = CONFIG.BIRD_SIZE * 3;
                    if (d < desiredSeparation) {
                        let diff = bird.position.sub(other.position);
                        diff.normalize();
                        diff.x /= d;
                        diff.y /= d;
                        separationForce.add(diff);
                        separationCount++;
                    }
                }
                if (separationCount > 0) {
                    separationForce.x /= separationCount;
                    separationForce.y /= separationCount;
                    if (separationForce.mag() > 0) {
                        separationForce.normalize();
                        // slightly stronger separation in idle mode to look natural
                        separationForce.x *= (this.engine.params ? this.engine.params.separation * 1.5 : 1.5);
                        separationForce.y *= (this.engine.params ? this.engine.params.separation * 1.5 : 1.5);
                    }
                }
                
                bird.update(null, null, null, separationForce);
                
                // Screen boundaries wrap around
                 if (bird.position.x < 0) bird.position.x = this.engine.width;
                 if (bird.position.x > this.engine.width) bird.position.x = 0;
                 if (bird.position.y < 0) bird.position.y = this.engine.height;
                 if (bird.position.y > this.engine.height) bird.position.y = 0;
            }
        }

        // Apply boundary wrapping for searching state too, and draw
        for (const bird of this.engine.particles) {
             if (bird.position.x < 0) bird.position.x = this.engine.width;
             if (bird.position.x > this.engine.width) bird.position.x = 0;
             if (bird.position.y < 0) bird.position.y = this.engine.height;
             if (bird.position.y > this.engine.height) bird.position.y = 0;
             
             bird.recordHistory();
             bird.draw(this.ctx, this.birdImage);
        }

        requestAnimationFrame(() => this.loop());
    }
}

// Boot up
window.onload = () => {
    new Simulation();
};
