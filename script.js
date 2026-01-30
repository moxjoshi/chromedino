const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameSpeed = 5;
let score = 0;
let highScore = 0;
let frame = 0;
let isGameOver = false;
let obstacles = [];
let clouds = [];
let gameRunning = false;
let backgroundX = 0;
let scoreTimer = 0;

let keys = {};

document.addEventListener('keydown', function (evt) {
    keys[evt.code] = true;
    if (!gameRunning && !isGameOver && (evt.code === 'Space' || evt.code === 'ArrowUp')) {
        gameRunning = true;
        animate();
    }
});

document.addEventListener('keyup', function (evt) {
    keys[evt.code] = false;
});

document.addEventListener('touchstart', function (evt) {
    evt.preventDefault();
    keys['Space'] = true;
    if (!gameRunning && !isGameOver) {
        gameRunning = true;
        animate();
    }
}, { passive: false });

document.addEventListener('touchend', function (evt) {
    evt.preventDefault();
    keys['Space'] = false;
    if (isGameOver) resetGame();
});

document.addEventListener('keydown', function (evt) {
    if (isGameOver && evt.code === 'Space') {
        resetGame();
    }
});

function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth, 800);
    canvas.height = Math.min(window.innerHeight, 400);

}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const assets = {
    dinoStart: new Image(),
    dinoRun1: new Image(),
    dinoRun2: new Image(),
    dinoJump: new Image(),
    dinoDuck1: new Image(),
    dinoDuck2: new Image(),
    dinoDead: new Image(),
    smallCactus1: new Image(),
    smallCactus2: new Image(),
    smallCactus3: new Image(),
    largeCactus1: new Image(),
    largeCactus2: new Image(),
    largeCactus3: new Image(),
    bird1: new Image(),
    bird2: new Image(),
    track: new Image(),
    cloud: new Image(),
    gameOver: new Image(),
    reset: new Image()
};

assets.dinoStart.src = 'Assets/DinoStart.png';
assets.dinoRun1.src = 'Assets/DinoRun1.png';
assets.dinoRun2.src = 'Assets/DinoRun2.png';
assets.dinoJump.src = 'Assets/DinoJump.png';
assets.dinoDuck1.src = 'Assets/DinoDuck1.png';
assets.dinoDuck2.src = 'Assets/DinoDuck2.png';
assets.dinoDead.src = 'Assets/DinoDead.png';
assets.smallCactus1.src = 'Assets/SmallCactus1.png';
assets.smallCactus2.src = 'Assets/SmallCactus2.png';
assets.smallCactus3.src = 'Assets/SmallCactus3.png';
assets.largeCactus1.src = 'Assets/LargeCactus1.png';
assets.largeCactus2.src = 'Assets/LargeCactus2.png';
assets.largeCactus3.src = 'Assets/LargeCactus3.png';
assets.bird1.src = 'Assets/Bird1.png';
assets.bird2.src = 'Assets/Bird2.png';
assets.track.src = 'Assets/Track.png';
assets.cloud.src = 'Assets/Cloud.png';
assets.gameOver.src = 'Assets/GameOver.png';
assets.reset.src = 'Assets/Reset.png';

class Dino {
    constructor() {
        this.x = 50;
        this.originalHeight = 94 / 2;
        this.originalWidth = 88 / 2;
        this.width = this.originalWidth;
        this.height = this.originalHeight;
        this.y = canvas.height - this.height - 20;
        this.vy = 0;
        this.jumpPower = 12;
        this.gravity = 0.6;
        this.groundY = canvas.height - 20;
        this.isJumping = false;
        this.isDucking = false;
        this.runTimer = 0;
        this.state = 'running';
    }

    draw() {
        let sprite;

        if (isGameOver) {
            sprite = assets.dinoDead;
        } else if (this.state === 'jumping') {
            sprite = assets.dinoJump;
        } else if (this.state === 'ducking') {
            if (this.runTimer > 10) {
                sprite = assets.dinoDuck2;
                this.runTimer = 0;
            } else {
                sprite = assets.dinoDuck1;
            }
        } else {
            if (this.runTimer > 10) {
                sprite = assets.dinoRun2;
                this.runTimer = 0;
            } else {
                sprite = assets.dinoRun1;
            }
        }

        let drawY = this.y;
        ctx.drawImage(sprite, this.x, drawY, this.width, this.height);
    }

    update() {
        if ((keys['Space'] || keys['ArrowUp']) && !this.isJumping && !this.isDucking) {
            this.vy = -this.jumpPower;
            this.isJumping = true;
            this.state = 'jumping';
        }

        this.y += this.vy;

        if (this.y + this.height < this.groundY) {
            this.vy += this.gravity;
            this.isJumping = true;
        } else {
            this.vy = 0;
            this.isJumping = false;
            if (this.state !== 'ducking') {
                this.y = this.groundY - this.height;
            }
            this.state = 'running';
        }

        if (keys['ArrowDown'] && !this.isJumping) {
            this.isDucking = true;
            this.state = 'ducking';
            this.width = 118 / 2;
            this.height = this.originalHeight * 0.6;
            this.y = this.groundY - this.height;
        } else if (this.isDucking && !keys['ArrowDown']) {
            this.isDucking = false;
            this.width = this.originalWidth;
            this.height = this.originalHeight;
            this.y = this.groundY - this.height;
        }

        if (this.isJumping) {
            this.state = 'jumping';
            this.width = this.originalWidth;
            this.height = this.originalHeight;
        }

        this.runTimer++;
    }
}

class Obstacle {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.markedForDeletion = false;

        let typeSeed = Math.random();

        if (score > 500 && typeSeed > 0.8) {
            this.type = 'bird';
            this.width = 92 / 2;
            this.height = 80 / 2;
            let heightChoice = Math.random();
            if (heightChoice < 0.33) this.y = canvas.height - 50;
            else if (heightChoice < 0.66) this.y = canvas.height - 80;
            else this.y = canvas.height - 110;

            this.image = assets.bird1;
            this.frame = 0;
        } else if (typeSeed > 0.4) {
            let cactusType = Math.floor(Math.random() * 3);
            if (cactusType === 0) { this.image = assets.largeCactus1; this.width = 50 / 2; }
            else if (cactusType === 1) { this.image = assets.largeCactus2; this.width = 100 / 2; }
            else { this.image = assets.largeCactus3; this.width = 150 / 2; }
            this.height = 100 / 2;
            this.y = canvas.height - this.height - 20;
            this.type = 'cactus';
        } else {
            let cactusType = Math.floor(Math.random() * 3);
            if (cactusType === 0) { this.image = assets.smallCactus1; this.width = 34 / 2; }
            else if (cactusType === 1) { this.image = assets.smallCactus2; this.width = 68 / 2; }
            else { this.image = assets.smallCactus3; this.width = 102 / 2; }
            this.height = 70 / 2;
            this.y = canvas.height - this.height - 20;
            this.type = 'cactus';
        }
    }

    update() {
        this.x -= gameSpeed;
        if (this.x + this.width < 0) this.markedForDeletion = true;

        if (this.type === 'bird') {
            this.frame++;
        }
    }

    draw() {
        if (this.type === 'bird') {
            if (this.frame % 20 < 10) ctx.drawImage(assets.bird1, this.x, this.y, this.width, this.height);
            else ctx.drawImage(assets.bird2, this.x, this.y, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }
}

class Cloud {
    constructor() {
        this.x = canvas.width + Math.random() * 200;
        this.y = Math.random() * 100 + 50;
        this.width = 92 / 2;
        this.height = 27 / 2;
        this.speed = gameSpeed * 0.5;
        this.markedForDeletion = false;
    }
    update() {
        this.x -= this.speed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }
    draw() {
        ctx.drawImage(assets.cloud, this.x, this.y, this.width, this.height);
    }
}

let dino = new Dino();

function handleObstacles() {
    if (frame % 100 === 0) {
        if (Math.random() > 0.3) {
            obstacles.push(new Obstacle());
        }
    }

    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].update();
        obstacles[i].draw();

        if (
            dino.x < obstacles[i].x + obstacles[i].width &&
            dino.x + dino.width > obstacles[i].x &&
            dino.y < obstacles[i].y + obstacles[i].height &&
            dino.y + dino.height > obstacles[i].y
        ) {
            let padding = 10;
            if (
                dino.x + padding < obstacles[i].x + obstacles[i].width - padding &&
                dino.x + dino.width - padding > obstacles[i].x + padding &&
                dino.y + padding < obstacles[i].y + obstacles[i].height - padding &&
                dino.y + dino.height - padding > obstacles[i].y + padding
            ) {
                gameOver();
            }
        }
    }
    obstacles = obstacles.filter(o => !o.markedForDeletion);
}

function handleScore() {
    scoreTimer++;
    if (scoreTimer % 5 === 0) {
        score++;
    }

    if (score % 200 === 0 && score > 0 && scoreTimer % 5 === 0 && gameSpeed < 20) {
        gameSpeed += 0.5;
    }

    ctx.fillStyle = '#535353';
    ctx.font = '20px Consolas';
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${Math.floor(highScore).toString().padStart(5, '0')}  ${Math.floor(score).toString().padStart(5, '0')}`, canvas.width - 20, 30);
}

function handleBackground() {
    let trackWidth = 2400;
    let trackHeight = 28 / 2;

    backgroundX -= gameSpeed;
    if (backgroundX <= -trackWidth) backgroundX = 0;

    ctx.drawImage(assets.track, backgroundX, canvas.height - 40, trackWidth, trackHeight);
    ctx.drawImage(assets.track, backgroundX + trackWidth, canvas.height - 40, trackWidth, trackHeight);

    if (frame % 200 === 0 && Math.random() < 0.8) {
        clouds.push(new Cloud());
    }

    for (let i = 0; i < clouds.length; i++) {
        clouds[i].update();
        clouds[i].draw();
    }
    clouds = clouds.filter(c => !c.markedForDeletion);
}

function gameOver() {
    isGameOver = true;
    gameRunning = false;
    gameSpeed = 0;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
    }

    ctx.drawImage(assets.gameOver, canvas.width / 2 - 191 / 2, canvas.height / 2 - 50, 381 / 2, 21 / 2);
    ctx.drawImage(assets.reset, canvas.width / 2 - 72 / 2, canvas.height / 2, 72 / 2, 64 / 2);
}

function resetGame() {
    isGameOver = false;
    gameRunning = true;
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    clouds = [];
    frame = 0;
    dino = new Dino();
    animate();
}

if (localStorage.getItem('dinoHighScore')) {
    highScore = localStorage.getItem('dinoHighScore');
}

function animate() {
    if (isGameOver) {
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    handleBackground();
    handleObstacles();

    dino.update();
    dino.draw();

    handleScore();

    frame++;
    requestAnimationFrame(animate);
}

window.onload = function () {
    resizeCanvas();
    dino = new Dino();
    // Draw initial static state
    ctx.drawImage(assets.track, 0, canvas.height - 40, 2400, 28 / 2);
    dino.draw();
}
