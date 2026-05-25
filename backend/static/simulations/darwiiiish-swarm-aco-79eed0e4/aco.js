const canvas = document.getElementById('aco-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const assets = {};
let width, height;
let cols, rows;
let grid; // Cave layout: 0 is wall, 1 is tunnel passage
let pheromones; // Pheromone map float grid

// Simulation configuration parameters
let speed = 2.0;
let antCount = 150;
let evaporationRate = 0.001;
let alphaParam = 1.0;
let betaParam = 2.0;
let qParam = 1.0;
let numIterations = 20;

const cell_size = 4;
const moveSpeed = 0.4;
const turnSpeed = 0.09;
const sensingDistance = 20.0;
const sensingAngle = Math.PI / 4;
const pheromoneStrength = 50.0;

let homePos = { x: 0, y: 0 };
let foodSources = [];
let ants = [];
let tspResults = { best_path: [], best_dist: 0, logs: [] };

// Mouse drag state
let interaction = { active: false, idx: -1 };

// Cache rendering of static cave maze
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d');

// Image preloader
const load = (name, src) => new Promise(res => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        assets[name] = img;
        res();
    };
});

// Helper for UI binding
const bind = (id, evt, fn) => document.getElementById(id).addEventListener(evt, fn);

// Double-check if coordinate hits a wall
function isWall(x, y) {
    const c = Math.floor(x / cell_size);
    const r = Math.floor(y / cell_size);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return true;
    return grid[r * cols + c] === 0;
}

// Clear a circular area in the cave grid
function clearCircle(cx, cy, r) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((col - cx) ** 2 + (row - cy) ** 2 < r ** 2) {
                grid[row * cols + col] = 1;
            }
        }
    }
}

// Pre-render the maze on offscreen canvas
function renderMazeToOffscreen() {
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    offscreenCtx.fillStyle = '#0f0b08'; // Wall color
    offscreenCtx.fillRect(0, 0, width, height);

    offscreenCtx.fillStyle = '#211812'; // Passage color
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r * cols + c] === 1) {
                offscreenCtx.fillRect(c * cell_size, r * cell_size, cell_size, cell_size);
            }
        }
    }
}

// Analytical Ant Colony Optimization Solver for Traveling Salesperson Problem
function solveTSP() {
    if (!homePos || !foodSources) return;
    const points = [homePos, ...foodSources];
    const n = points.length;

    if (n <= 1) {
        tspResults = { best_path: [], best_dist: 0, logs: [] };
        updateTSPUI();
        return;
    }

    if (n === 2) {
        const d = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        tspResults = {
            best_path: [0, 1],
            best_dist: d * 2,
            logs: [{ iter: 1, dist: Number((d * 2).toFixed(2)) }]
        };
        updateTSPUI();
        return;
    }

    // Distance Matrix
    const dm = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            dm[i][j] = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        }
    }

    // Heuristic Matrix: eta = 1 / d
    const eta = Array.from({ length: n }, () => new Float64Array(n));
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            eta[i][j] = i === j ? 0 : 1.0 / dm[i][j];
        }
    }

    // Pheromone levels on connections
    const tau = Array.from({ length: n }, () => new Float64Array(n).fill(0.1));
    let bestPath = null;
    let bestDist = Infinity;
    const logs = [];

    const Q = qParam * 1000;
    const numAnts = 40;

    for (let iter = 0; iter < numIterations; iter++) {
        const allPaths = [];
        const allDistances = [];

        for (let antIdx = 0; antIdx < numAnts; antIdx++) {
            let currentCity = Math.floor(Math.random() * n);
            const path = [currentCity];
            const visited = new Set([currentCity]);

            while (path.length < n) {
                const probs = new Float64Array(n);
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    if (!visited.has(j)) {
                        probs[j] = Math.pow(tau[currentCity][j], alphaParam) * Math.pow(eta[currentCity][j], betaParam);
                        sum += probs[j];
                    }
                }

                let nextCity = -1;
                if (sum === 0) {
                    const unvisited = [];
                    for (let j = 0; j < n; j++) {
                        if (!visited.has(j)) unvisited.push(j);
                    }
                    nextCity = unvisited[Math.floor(Math.random() * unvisited.length)];
                } else {
                    const r = Math.random() * sum;
                    let accum = 0;
                    for (let j = 0; j < n; j++) {
                        if (!visited.has(j)) {
                            accum += probs[j];
                            if (accum >= r) {
                                nextCity = j;
                                break;
                            }
                        }
                    }
                    if (nextCity === -1) {
                        for (let j = 0; j < n; j++) {
                            if (!visited.has(j)) { nextCity = j; break; }
                        }
                    }
                }

                path.push(nextCity);
                visited.add(nextCity);
                currentCity = nextCity;
            }

            let dist = 0;
            for (let i = 0; i < n; i++) {
                dist += dm[path[i]][path[(i + 1) % n]];
            }

            allPaths.push(path);
            allDistances.push(dist);

            if (dist < bestDist) {
                bestDist = dist;
                bestPath = path;
            }
        }

        logs.push({ iter: iter + 1, dist: Number(bestDist.toFixed(2)) });

        // Evaporate connection pheromones
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                tau[i][j] *= (1.0 - evaporationRate);
            }
        }

        // Deposit new connection pheromones
        for (let antIdx = 0; antIdx < numAnts; antIdx++) {
            const path = allPaths[antIdx];
            const dist = allDistances[antIdx];
            if (dist === 0) continue;
            const deposit = Q / dist;
            for (let i = 0; i < n; i++) {
                const u = path[i];
                const v = path[(i + 1) % n];
                tau[u][v] += deposit;
                tau[v][u] += deposit;
            }
        }
    }

    tspResults = {
        best_path: bestPath,
        best_dist: bestDist,
        logs: logs
    };

    updateTSPUI();
}

function updateTSPUI() {
    if (!tspResults || !tspResults.best_path) return;
    document.getElementById('current-best-dist').textContent = tspResults.best_dist.toFixed(2);
    const logPanel = document.getElementById('iter-log');
    const pathText = tspResults.best_path.map(idx => idx === 0 ? 'Nest' : `Sugar ${idx}`).join(' → ');
    logPanel.innerHTML = `<div><strong>Current Best Path:</strong><br>${pathText} → Nest</div>` +
        tspResults.logs.map(l => `<div>Iteration ${l.iter}: ${l.dist}</div>`).reverse().join('');
}

// Ant Class
class Ant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.hasFood = false;
    }

    update() {
        if (this.hasFood) {
            // Move back to Nest
            const targetAngle = Math.atan2(homePos.y - this.y, homePos.x - this.x);
            const diff = ((targetAngle - this.angle + Math.PI) % (Math.PI * 2) - Math.PI);
            this.angle += diff * 0.1;
        } else {
            // Seek Pheromones
            this.sense();
        }

        // Add exploration jitter/noise
        this.angle += (Math.random() - 0.5) * 0.15;

        const dist = moveSpeed * speed;
        const nx = this.x + Math.cos(this.angle) * dist;
        const ny = this.y + Math.sin(this.angle) * dist;

        if (isWall(nx, ny)) {
            // Bounce off caves wall
            this.angle += Math.PI + (Math.random() - 0.5);
        } else {
            this.x = nx;
            this.y = ny;

            // Stay within boundaries
            if (this.x < 0 || this.x > width) this.angle = Math.PI - this.angle;
            if (this.y < 0 || this.y > height) this.angle = -this.angle;
        }

        // Check food collections
        if (!this.hasFood) {
            for (let f of foodSources) {
                if (Math.hypot(this.x - f.x, this.y - f.y) < 15) {
                    this.hasFood = true;
                    this.angle += Math.PI;
                    break;
                }
            }
        } else {
            // Check Nest return
            if (Math.hypot(this.x - homePos.x, this.y - homePos.y) < 25) {
                this.hasFood = false;
                this.angle += Math.PI;
            }
        }

        // Deposit pheromones while returning home
        if (this.hasFood) {
            const px = Math.floor(this.x / cell_size);
            const py = Math.floor(this.y / cell_size);
            if (px >= 0 && px < cols && py >= 0 && py < rows) {
                pheromones[py * cols + px] = Math.min(pheromones[py * cols + px] + pheromoneStrength * 0.1, 255.0);
            }
        }
    }

    sense() {
        const d = sensingDistance;
        const a = sensingAngle;

        const vals = [
            this.getPheromoneVal(0),        // Straight
            this.getPheromoneVal(-a),       // Left
            this.getPheromoneVal(a)         // Right
        ];

        if (vals[1] > vals[0] || vals[2] > vals[0]) {
            this.angle += vals[2] > vals[1] ? turnSpeed : -turnSpeed;
        }
    }

    getPheromoneVal(offset) {
        const ang = this.angle + offset;
        const sx = Math.floor((this.x + Math.cos(ang) * sensingDistance) / cell_size);
        const sy = Math.floor((this.y + Math.sin(ang) * sensingDistance) / cell_size);
        if (sx >= 0 && sx < cols && sy >= 0 && sy < rows) {
            return pheromones[sy * cols + sx];
        }
        return 0;
    }
}

// Populate / adjust ant counts
function updateAntPopulation(count) {
    if (count < ants.length) {
        ants = ants.slice(0, count);
    } else {
        const diff = count - ants.length;
        for (let i = 0; i < diff; i++) {
            ants.push(new Ant(homePos.x, homePos.y));
        }
    }
}

// Generate organic cave grid using 5 steps of cellular automata
function initMaze() {
    grid = new Uint8Array(rows * cols);
    for (let i = 0; i < grid.length; i++) {
        grid[i] = Math.random() > 0.45 ? 1 : 0;
    }

    // 5 Cellular Automata steps
    for (let step = 0; step < 5; step++) {
        const nextGrid = new Uint8Array(rows * cols);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                    nextGrid[r * cols + c] = 0; // Solid borders
                    continue;
                }
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        count += grid[(r + dr) * cols + (c + dc)];
                    }
                }
                if (count > 4) {
                    nextGrid[r * cols + c] = 1;
                } else if (count < 3) {
                    nextGrid[r * cols + c] = 0;
                } else {
                    nextGrid[r * cols + c] = grid[r * cols + c];
                }
            }
        }
        grid = nextGrid;
    }

    // Clear Nest center area
    clearCircle(Math.floor(cols / 2), Math.floor(rows / 2), 8);
}

// Initialize layout, dimensions, components, and start solvers
const init = () => {
    const wrapper = canvas.parentElement;
    width = wrapper.clientWidth;
    height = wrapper.clientHeight;
    canvas.width = width;
    canvas.height = height;

    homePos = { x: width / 2, y: height / 2 };
    cols = Math.ceil(width / cell_size);
    rows = Math.ceil(height / cell_size);

    initMaze();

    // Spawn 2 initial food sources on walkable ground
    foodSources = [];
    let attempts = 0;
    while (foodSources.length < 2 && attempts < 1000) {
        const rx = Math.random() * (width - 100) + 50;
        const ry = Math.random() * (height - 100) + 50;
        if (!isWall(rx, ry)) {
            foodSources.push({ x: rx, y: ry });
            clearCircle(Math.floor(rx / cell_size), Math.floor(ry / cell_size), 4);
        }
        attempts++;
    }

    pheromones = new Float32Array(rows * cols);
    ants = [];
    updateAntPopulation(antCount);

    renderMazeToOffscreen();
    solveTSP();

    // Fade loading spinner
    document.getElementById('loading-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('loading-overlay').style.display = 'none';
    }, 500);
};

// UI sync helper
const sync = (id, valId, setter) => {
    bind(id, 'input', e => {
        document.getElementById(valId).textContent = e.target.value + (id === 'speed-slider' ? 'x' : '');
        setter(parseFloat(e.target.value));
    });
};

sync('speed-slider', 'speed-value', val => speed = val);
sync('ant-count', 'ant-count-value', val => {
    antCount = parseInt(val);
    updateAntPopulation(antCount);
});
sync('evaporation-rate', 'evaporation-value', val => {
    evaporationRate = val;
    solveTSP();
});
sync('alpha-slider', 'alpha-value', val => {
    alphaParam = val;
    solveTSP();
});
sync('beta-slider', 'beta-value', val => {
    betaParam = val;
    solveTSP();
});
sync('q-slider', 'q-value', val => {
    qParam = val;
    solveTSP();
});
sync('iter-slider', 'iter-value', val => {
    numIterations = parseInt(val);
    solveTSP();
});

bind('reset-btn', 'click', init);

bind('add-food-btn', 'click', () => {
    if (foodSources.length >= 5) return;
    let attempts = 0;
    while (attempts < 100) {
        const rx = Math.random() * (width - 100) + 50;
        const ry = Math.random() * (height - 100) + 50;
        if (!isWall(rx, ry)) {
            foodSources.push({ x: rx, y: ry });
            clearCircle(Math.floor(rx / cell_size), Math.floor(ry / cell_size), 4);
            renderMazeToOffscreen();
            solveTSP();
            break;
        }
        attempts++;
    }
});

bind('remove-food-btn', 'click', () => {
    if (foodSources.length > 0) {
        foodSources.pop();
        solveTSP();
    }
});

// Dragging Food Sources
canvas.onmousedown = e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    interaction.idx = foodSources.findIndex(f => Math.hypot(f.x - x, f.y - y) < 30);
    interaction.active = interaction.idx !== -1;
};

window.onmousemove = e => {
    if (interaction.active) {
        const rect = canvas.getBoundingClientRect();
        const nx = e.clientX - rect.left;
        const ny = e.clientY - rect.top;

        // Keep food source inside screen bounds
        if (nx >= 20 && nx <= width - 20 && ny >= 20 && ny <= height - 20) {
            foodSources[interaction.idx].x = nx;
            foodSources[interaction.idx].y = ny;
            // Clear path around new food position
            clearCircle(Math.floor(nx / cell_size), Math.floor(ny / cell_size), 4);
            renderMazeToOffscreen();
            solveTSP();
        }
    }
};

window.onmouseup = () => {
    interaction.active = false;
};

// Handle window resizing
window.onresize = () => {
    const wrapper = canvas.parentElement;
    width = wrapper.clientWidth;
    height = wrapper.clientHeight;
    canvas.width = width;
    canvas.height = height;

    homePos = { x: width / 2, y: height / 2 };
    cols = Math.ceil(width / cell_size);
    rows = Math.ceil(height / cell_size);

    initMaze();

    // Re-verify food positions are inside new size
    foodSources.forEach(f => {
        f.x = Math.max(50, Math.min(width - 50, f.x));
        f.y = Math.max(50, Math.min(height - 50, f.y));
        clearCircle(Math.floor(f.x / cell_size), Math.floor(f.y / cell_size), 4);
    });

    pheromones = new Float32Array(rows * cols);
    renderMazeToOffscreen();
    solveTSP();
};

const drawPath = (path, food, home) => {
    if (!path || path.length < 2) return;
    const points = [home, ...food];
    ctx.beginPath();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    for (let i = 0; i < path.length; i++) {
        const c1 = points[path[i]];
        const c2 = points[path[(i + 1) % path.length]];
        if (i === 0) ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
};

// Continuous Animation Loop
const loop = () => {
    // 1. Evaporate pheromones
    for (let i = 0; i < pheromones.length; i++) {
        pheromones[i] *= (1.0 - evaporationRate);
        if (pheromones[i] < 0.01) pheromones[i] = 0;
    }

    // 2. Physical Ant Updates
    ants.forEach(a => a.update());

    // 3. Clear & Render cave
    ctx.drawImage(offscreenCanvas, 0, 0);

    // 4. Render Pheromones overlay (composite screen)
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < pheromones.length; i++) {
        const v = pheromones[i];
        if (v > 0.5) {
            ctx.fillStyle = `rgba(163, 230, 53, ${v / 255.0})`;
            const c = i % cols;
            const r = Math.floor(i / cols);
            ctx.fillRect(c * cell_size, r * cell_size, cell_size, cell_size);
        }
    }
    ctx.globalCompositeOperation = 'source-over';

    // 5. Draw TSP dashed gold tour path
    if (tspResults && tspResults.best_path) {
        drawPath(tspResults.best_path, foodSources, homePos);
    }

    // 6. Draw Nest
    if (assets.home) {
        ctx.drawImage(assets.home, homePos.x - 32, homePos.y - 32, 64, 64);
        ctx.font = 'bold 16px Lexend';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('NEST', homePos.x, homePos.y - 35);
        ctx.fillText('NEST', homePos.x, homePos.y - 35);
    }

    // 7. Draw Food Sources
    if (assets.food) {
        foodSources.forEach((f, i) => {
            ctx.drawImage(assets.food, f.x - 15, f.y - 15, 30, 30);
            ctx.font = 'bold 16px Lexend';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(i + 1, f.x, f.y - 20);
            ctx.fillText(i + 1, f.x, f.y - 20);
        });
    }

    // 8. Draw physical Ants
    if (assets.ant) {
        ants.forEach(a => {
            ctx.save();
            ctx.translate(a.x, a.y);
            ctx.rotate(a.angle);
            ctx.drawImage(assets.ant, -6, -6, 12, 12);
            if (a.hasFood) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(4, -1, 3, 3); // White sugar particle in mouth
            }
            ctx.restore();
        });
    }

    // 9. Update Pheromones Progress Bar
    const totalPhero = pheromones.reduce((sum, val) => sum + val, 0);
    document.getElementById('pheromone-progress').style.width = `${Math.min(totalPhero / 1000, 100)}%`;

    requestAnimationFrame(loop);
};

// Preload Assets and start
Promise.all([
    load('ant', 'assets/Ant.png'),
    load('home', 'assets/Ant_home.png'),
    load('food', 'assets/Food_source.png')
]).then(() => {
    init();
    loop();
});
