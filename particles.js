const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1 + 0.5; // Smaller particles: 0.5-1.5px
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.life = 1.0;
        this.decay = 0.015;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw() {
        ctx.fillStyle = `rgba(0, 255, 255, ${this.life})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

let particles = [];
let mouseX = 0;
let mouseY = 0;

// Track mouse movement
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Create new particles
    for(let i = 0; i < 3; i++) {
        particles.push(new Particle(mouseX, mouseY));
    }
});

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    for(let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        
        // Remove dead particles
        if(particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animate);
}

animate();