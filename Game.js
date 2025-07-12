const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');

let score = 0;
let gameTime = 0;

// Player (Byte)
const player = {
    x: 50,
    y: canvas.height - 50,
    width: 40,
    height: 40,
    speed: 5,
    dy: 0,
    gravity: 0.5,
    jumpPower: -12,
    grounded: false,
    deepSearch: false,
    thinkMode: false,
    thinkModeTimer: 0,
    thinkModeDuration: 120, // 2 seconds at 60 FPS
};

// Game objects
let bones = [];
let hiddenBones = [];
let asteroids = [];
let robots = [];
const platforms = [
    { x: 0, y: canvas.height - 20, width: 200, height: 20 },
    { x: 300, y: canvas.height - 100, width: 200, height: 20 },
    { x: 600, y: canvas.height - 200, width: 200, height: 20 },
];

// Controls
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Spawn game objects
function spawnBone() {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    bones.push({
        x: platform.x + Math.random() * (platform.width - 20),
        y: platform.y - 20,
        width: 20,
        height: 20,
        hidden: Math.random() < 0.3 // 30% chance to be hidden
    });
}

function spawnAsteroid() {
    asteroids.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - 100),
        width: 30,
        height: 30,
        speed: 3 + Math.random() * 2
    });
}

function spawnRobot() {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    robots.push({
        x: platform.x + platform.width - 40,
        y: platform.y - 40,
        width: 40,
        height: 40,
        speed: -2
    });
}

// Collision detection
function collides(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Game loop
function update() {
    gameTime++;
    
    // Player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    if (keys['Space'] && player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
    }
    if (keys['d'] && !player.deepSearch) {
        player.deepSearch = true;
        hiddenBones = bones.filter(b => b.hidden);
        bones = bones.filter(b => !b.hidden);
    } else if (!keys['d']) {
        player.deepSearch = false;
        bones = bones.concat(hiddenBones);
        hiddenBones = [];
    }
    if (keys['t'] && !player.thinkMode) {
        player.thinkMode = true;
        player.thinkModeTimer = player.thinkModeDuration;
    }
    
    // Apply gravity
    player.dy += player.gravity;
    player.y += player.dy;
    
    // Keep player in bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.dy = 0;
        player.grounded = true;
    }
    
    // Platform collisions
    player.grounded = false;
    for (let platform of platforms) {
        if (collides(player, platform) && player.dy > 0 && player.y + player.height - player.dy <= platform.y) {
            player.y = platform.y - player.height;
            player.dy = 0;
            player.grounded = true;
        }
    }
    
    // Update think mode
    if (player.thinkMode) {
        player.thinkModeTimer--;
        if (player.thinkModeTimer <= 0) player.thinkMode = false;
    }
    
    // Update asteroids
    asteroids = asteroids.filter(a => a.x > -a.width);
    for (let asteroid of asteroids) {
        asteroid.x -= asteroid.speed * (player.thinkMode ? 0.5 : 1);
        if (collides(player, asteroid)) {
            score = 0;
            player.x = 50;
            player.y = canvas.height - 50;
            player.dy = 0;
            asteroids = [];
            robots = [];
            bones = [];
            messageDisplay.textContent = 'Game Over! Press any key to restart.';
        }
    }
    
    // Update robots
    for (let robot of robots) {
        robot.x += robot.speed * (player.thinkMode ? 0.5 : 1);
        const platform = platforms.find(p => robot.y + robot.height === p.y);
        if (platform && (robot.x < platform.x || robot.x + robot.width > platform.x + platform.width)) {
            robot.speed = -robot.speed;
        }
        if (collides(player, robot)) {
            score = 0;
            player.x = 50;
            player.y = canvas.height - 50;
            player.dy = 0;
            asteroids = [];
            robots = [];
            bones = [];
            messageDisplay.textContent = 'Game Over! Press any key to restart.';
        }
    }
    
    // Collect bones
    bones = bones.filter(b => {
        if (collides(player, b) && (!b.hidden || player.deepSearch)) {
            score++;
            return false;
        }
        return true;
    });
    
    // Spawn objects
    if (gameTime % 60 === 0) spawnBone();
    if (gameTime % 120 === 0) spawnAsteroid();
    if (gameTime % 180 === 0) spawnRobot();
    
    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    ctx.fillStyle = '#4b0082';
    for (let platform of platforms) {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }
    
    // Draw player
    ctx.fillStyle = player.thinkMode ? '#00ffcc' : '#00ccff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw bones
    for (let bone of bones) {
        ctx.fillStyle = bone.hidden && !player.deepSearch ? 'rgba(255, 255, 255, 0.2)' : '#ffd700';
        ctx.fillRect(bone.x, bone.y, bone.width, bone.height);
    }
    
    // Draw asteroids
    ctx.fillStyle = '#808080';
    for (let asteroid of asteroids) {
        ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    }
    
    // Draw robots
    ctx.fillStyle = '#ff4500';
    for (let robot of robots) {
        ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
    }
    
    // Update UI
    scoreDisplay.textContent = `Data Bones: ${score}`;
    
    requestAnimationFrame(update);
}

// Start game
spawnBone();
spawnAsteroid();
spawnRobot();
update();
