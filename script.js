const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

// Game constants
const PLAYER_WIDTH = 30;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;
const INVADER_WIDTH = 30;
const INVADER_HEIGHT = 20;
const INVADER_SPEED = 1;
const INVADER_DROP = 20;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 10;
const BULLET_SPEED = 7;
const INVADER_BULLET_SPEED = 3;
const INVADER_SHOOT_CHANCE = 0.002; // per invader per frame
const ROWS = 5;
const COLS = 11;
const GAP_X = 10;
const GAP_Y = 10;
const OFFSET_TOP = 50;
const OFFSET_LEFT = 50;

// Game state
let player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: PLAYER_SPEED,
    dx: 0
};

let invaders = [];
let playerBullets = [];
let invaderBullets = [];
let score = 0;
let lives = 3;
let gameOver = false;
let victory = false;
let invaderDirection = 1; // 1 for right, -1 for left
let invaderMoveCounter = 0;
const invaderMoveFrequency = 30; // frames between invader moves

// Initialize invaders
function initInvaders() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            invaders.push({
                x: OFFSET_LEFT + col * (INVADER_WIDTH + GAP_X),
                y: OFFSET_TOP + row * (INVADER_HEIGHT + GAP_Y),
                width: INVADER_WIDTH,
                height: INVADER_HEIGHT,
                alive: true
            });
        }
    }
}

// Draw player
function drawPlayer() {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Draw invaders
function drawInvaders() {
    invaders.forEach(invader => {
        if (invader.alive) {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
        }
    });
}

// Draw bullets
function drawBullets() {
    ctx.fillStyle = '#ffff00';
    playerBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    ctx.fillStyle = '#ff00ff';
    invaderBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// Update player position
function updatePlayer() {
    player.x += player.dx;
    // Keep player within canvas
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;
}

// Update bullets
function updateBullets() {
    // Player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        bullet.y -= BULLET_SPEED;
        if (bullet.y < 0) {
            playerBullets.splice(i, 1);
        }
    }
    // Invader bullets
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        bullet.y += INVADER_BULLET_SPEED;
        if (bullet.y > canvas.height) {
            invaderBullets.splice(i, 1);
        }
    }
}

// Update invaders
function updateInvaders() {
    invaderMoveCounter++;
    if (invaderMoveCounter >= invaderMoveFrequency) {
        invaderMoveCounter = 0;
        let moveDown = false;
        // Check edges
        invaders.forEach(invader => {
            if (invader.alive) {
                if (invaderDirection === 1 && invader.x + invader.width > canvas.width - OFFSET_LEFT) {
                    moveDown = true;
                }
                if (invaderDirection === -1 && invader.x < OFFSET_LEFT) {
                    moveDown = true;
                }
            }
        });
        if (moveDown) {
            invaderDirection *= -1;
            invaders.forEach(invader => {
                if (invader.alive) {
                    invader.y += INVADER_DROP;
                }
            });
        } else {
            invaders.forEach(invader => {
                if (invader.alive) {
                    invader.x += invaderDirection * INVADER_SPEED;
                }
            });
        }
    }
    // Invader shooting
    invaders.forEach(invader => {
        if (invader.alive && Math.random() < INVADER_SHOOT_CHANCE) {
            invaderBullets.push({
                x: invader.x + invader.width / 2 - BULLET_WIDTH / 2,
                y: invader.y + invader.height,
                width: BULLET_WIDTH,
                height: BULLET_HEIGHT
            });
        }
    });
}

// Collision detection
function checkCollisions() {
    // Player bullets vs invaders
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        for (let j = invaders.length - 1; j >= 0; j--) {
            const invader = invaders[j];
            if (invader.alive &&
                bullet.x < invader.x + invader.width &&
                bullet.x + bullet.width > invader.x &&
                bullet.y < invader.y + invader.height &&
                bullet.y + bullet.height > invader.y) {
                invader.alive = false;
                playerBullets.splice(i, 1);
                score += 10;
                scoreEl.textContent = score;
                break;
            }
        }
    }
    // Invader bullets vs player
    for (let i = invaderBullets.length - 1; i >= 0; i--) {
        const bullet = invaderBullets[i];
        if (
            bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y
        ) {
            invaderBullets.splice(i, 1);
            lives--;
            livesEl.textContent = lives;
            if (lives <= 0) {
                gameOver = true;
            }
        }
    }
    // Invaders reaching bottom (player loses)
    invaders.forEach(invader => {
        if (invader.alive && invader.y + invader.height >= player.y) {
            gameOver = true;
        }
    });
    // Check for victory (all invaders dead)
    const allDead = invaders.every(invader => !invader.alive);
    if (allDead) {
        victory = true;
    }
}

// Game loop
function loop() {
    if (gameOver || victory) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px monospace';
        ctx.textAlign = 'center';
        if (gameOver) {
            ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        } else if (victory) {
            ctx.fillText('YOU WIN', canvas.width / 2, canvas.height / 2);
        }
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update game state
    updatePlayer();
    updateBullets();
    updateInvaders();
    checkCollisions();

    // Draw
    drawPlayer();
    drawInvaders();
    drawBullets();

    requestAnimationFrame(loop);
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
    }
    if (e.key === ' ' || e.key === 'Space') {
        // Shoot
        playerBullets.push({
            x: player.x + player.width / 2 - BULLET_WIDTH / 2,
            y: player.y,
            width: BULLET_WIDTH,
            height: BULLET_HEIGHT
        });
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = 0;
    }
});

// Start game
initInvaders();
loop();