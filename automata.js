const canvas = document.getElementById('automata-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let cellSize = 8; // Slightly larger cells (was 5)
let cols, rows;
let grid;
let colorGrid;
let animationId;

// Configuration
// Palette: Cyan, Soft Purple, Deep Blue, White
const PALETTE = ['#b0e3ec', '#cba6f7', '#89b4fa', '#ffffff'];
const LIVE_CHANCE = 0.05; // Rarer initialization (was 0.15)

function getRandomColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    cols = Math.ceil(width / cellSize);
    rows = Math.ceil(height / cellSize);

    initGrid();
}

function initGrid() {
    grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
    colorGrid = new Array(cols).fill(null).map(() => new Array(rows).fill(null));

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (Math.random() < LIVE_CHANCE) {
                grid[i][j] = 1;
                colorGrid[i][j] = getRandomColor();
            } else {
                grid[i][j] = 0;
                colorGrid[i][j] = null;
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] === 1) {
                ctx.fillStyle = colorGrid[i][j];
                ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
}

function update() {
    let nextGrid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
    let nextColorGrid = new Array(cols).fill(null).map(() => new Array(rows).fill(null));

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let state = grid[i][j];
            let neighbors = countNeighbors(grid, i, j);

            if (state === 0 && neighbors === 3) {
                nextGrid[i][j] = 1;
                nextColorGrid[i][j] = getRandomColor(); // New life gets random color
            } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
                nextGrid[i][j] = 0;
            } else {
                nextGrid[i][j] = state;
                if (state === 1) {
                    nextColorGrid[i][j] = colorGrid[i][j]; // Survive
                }
            }
        }
    }

    grid = nextGrid;
    colorGrid = nextColorGrid;
}

function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let col = (x + i + cols) % cols;
            let row = (y + j + rows) % rows;
            sum += grid[col][row];
        }
    }
    sum -= grid[x][y];
    return sum;
}

let lastTime = 0;
const fps = 8; // Slower FPS for "floating" feel
const interval = 1000 / fps;

function animate(currentTime) {
    animationId = requestAnimationFrame(animate);

    const deltaTime = currentTime - lastTime;

    if (deltaTime > interval) {
        lastTime = currentTime - (deltaTime % interval);

        update();
        draw();
    }
}

window.addEventListener('resize', () => {
    resizeCanvas();
});

// Start
resizeCanvas();
animate(0);
