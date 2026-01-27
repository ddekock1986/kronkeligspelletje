// Vuurwerk animatie
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');
let fireworks = [];
let particles = [];
let animationRunning = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // zwaartekracht
        this.alpha -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

class Firework {
    constructor(x, targetY) {
        this.x = x;
        this.y = canvas.height;
        this.targetY = targetY;
        this.vy = -12 - Math.random() * 4;
        this.color = `hsl(${Math.random() * 360}, 100%, 60%)`;
        this.exploded = false;
    }

    update() {
        this.y += this.vy;
        this.vy += 0.2;

        if (this.vy >= 0 || this.y <= this.targetY) {
            this.explode();
        }
    }

    explode() {
        this.exploded = true;
        const particleCount = 50 + Math.random() * 30;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function animate() {
    if (!animationRunning) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update en teken vuurpijlen
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        if (!fireworks[i].exploded) {
            fireworks[i].draw();
        } else {
            fireworks.splice(i, 1);
        }
    }

    // Update en teken particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha > 0) {
            particles[i].draw();
        } else {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}

function launchFirework() {
    const x = Math.random() * canvas.width;
    const targetY = Math.random() * (canvas.height * 0.4) + canvas.height * 0.1;
    fireworks.push(new Firework(x, targetY));
}

function startFireworks() {
    animationRunning = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Start animatie loop
    animate();

    // Lanceer meerdere vuurpijlen
    for (let i = 0; i < 5; i++) {
        setTimeout(() => launchFirework(), i * 200);
    }

    // Blijf vuurpijlen lanceren
    const launchInterval = setInterval(() => {
        if (!animationRunning) {
            clearInterval(launchInterval);
            return;
        }
        launchFirework();
    }, 400);

    // Stop na 5 seconden
    setTimeout(() => {
        animationRunning = false;
        clearInterval(launchInterval);
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            fireworks = [];
            particles = [];
        }, 2000);
    }, 5000);
}
