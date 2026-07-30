/* =========================================================
   1. LIVE POINTS SYSTEM
   ========================================================= */
let activeUserPoints = 0;
const livePointsDisplay = document.getElementById('livePointsDisplay');
setInterval(() => {
    activeUserPoints += 50;
    if (livePointsDisplay) livePointsDisplay.innerHTML = `🪙 Your Points: ${activeUserPoints}`;
}, 3600000);

/* =========================================================
   2. REAL-TIME SEARCH FILTER
   ========================================================= */
const gameSearchBar = document.getElementById('gameSearchBar');
const totalGameCards = document.querySelectorAll('.game-item-card');

if (gameSearchBar) {
    gameSearchBar.addEventListener('input', (event) => {
        const inputQuery = event.target.value.toLowerCase().trim();
        totalGameCards.forEach(cardItem => {
            const searchTag = (cardItem.getAttribute('data-gametitle') || '').toLowerCase();
            const titleText = (cardItem.querySelector('.head-title')?.textContent || '').toLowerCase();
            const matches = searchTag.includes(inputQuery) || titleText.includes(inputQuery);
            cardItem.style.display = matches ? 'flex' : 'none';
        });
    });
}

/* =========================================================
   3. GLOBAL INPUT STATE (keyboard + on-screen touch buttons
      share the same state so every game only needs to read
      Keys.ArrowLeft / Keys.ArrowRight / Keys.ArrowUp /
      Keys.ArrowDown / Keys[' '] each frame)
   ========================================================= */
const Keys = {};

window.addEventListener('keydown', (e) => {
    Keys[e.key] = true;
    if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
});
window.addEventListener('keyup', (e) => {
    Keys[e.key] = false;
});

document.querySelectorAll('.touch-btn').forEach(btn => {
    const key = btn.getAttribute('data-key');
    const setKey = (v) => (e) => { e.preventDefault(); Keys[key] = v; };
    btn.addEventListener('pointerdown', setKey(true));
    btn.addEventListener('pointerup', setKey(false));
    btn.addEventListener('pointerleave', setKey(false));
    btn.addEventListener('pointercancel', setKey(false));
});

/* =========================================================
   4. OVERLAY MANAGEMENT (fully local, no external redirects)
   ========================================================= */
const globalGameScreenOverlay = document.getElementById('globalGameScreenOverlay');
const gameStage = document.getElementById('gameStage');
const masterExitBtn = document.getElementById('masterExitBtn');
const activeGameTitle = document.getElementById('activeGameTitle');

let activeGameHandle = null;

function buildCanvas() {
    const canvas = document.createElement('canvas');
    const w = Math.min(window.innerWidth - 20, 860);
    const h = Math.min(window.innerHeight - 160, 480);
    canvas.width = w;
    canvas.height = h;
    gameStage.innerHTML = '';
    gameStage.appendChild(canvas);
    return canvas;
}

function openGame(key, title) {
    for (const k in Keys) Keys[k] = false;
    const canvas = buildCanvas();
    activeGameTitle.textContent = title;
    globalGameScreenOverlay.style.display = 'flex';
    const factory = GAMES[key];
    if (factory) {
        activeGameHandle = factory(canvas);
        activeGameHandle.start();
    }
}

function closeGame() {
    if (activeGameHandle && activeGameHandle.stop) activeGameHandle.stop();
    activeGameHandle = null;
    globalGameScreenOverlay.style.display = 'none';
    gameStage.innerHTML = '';
    for (const k in Keys) Keys[k] = false;
}

document.querySelectorAll('.action-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-game');
        const title = btn.closest('.game-item-card').querySelector('.head-title').textContent;
        openGame(key, title);
    });
});

if (masterExitBtn) {
    masterExitBtn.addEventListener('click', closeGame);
}

/* =========================================================
   5. THE GAMES
   Every game below is original code — plain shapes drawn on
   a <canvas>, no copyrighted assets, no iframes, no external
   sites. Each factory(canvas) returns {start, stop}.
   ========================================================= */
const GAMES = {};

/* ---- shared helpers ---- */
function drawCenteredText(ctx, text, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.font = `${size}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}

/* ---------------------------------------------------------
   GAME 1: RUNNER DASH — 3-lane endless runner
   --------------------------------------------------------- */
GAMES.runner = function (canvas) {
    const ctx = canvas.getContext('2d');
    let raf = null;
    let running = true;
    let over = false;
    let score = 0;
    let speed = 4;
    const laneCount = 3;
    const laneW = canvas.width / laneCount;
    let playerLane = 1;
    let jumping = false, jumpT = 0;
    let obstacles = [];
    let spawnTimer = 0;

    function reset() {
        score = 0; speed = 4; playerLane = 1; jumping = false; jumpT = 0;
        obstacles = []; spawnTimer = 0; over = false;
    }
    reset();

    function laneX(l) { return l * laneW + laneW / 2; }

    function update() {
        if (over) {
            if (Keys['r'] || Keys['R']) { reset(); }
            return;
        }
        if ((Keys.ArrowLeft) && playerLane > 0) { playerLane--; Keys.ArrowLeft = false; }
        if ((Keys.ArrowRight) && playerLane < laneCount - 1) { playerLane++; Keys.ArrowRight = false; }
        if ((Keys[' '] || Keys.ArrowUp) && !jumping) { jumping = true; jumpT = 0; }

        if (jumping) {
            jumpT += 0.08;
            if (jumpT >= 1) { jumping = false; jumpT = 0; }
        }

        spawnTimer -= 1;
        if (spawnTimer <= 0) {
            spawnTimer = Math.max(28 - speed, 14);
            obstacles.push({ lane: Math.floor(Math.random() * laneCount), y: -40 });
        }

        obstacles.forEach(o => (o.y += speed));
        obstacles = obstacles.filter(o => o.y < canvas.height + 40);

        const playerY = canvas.height - 90;
        obstacles.forEach(o => {
            if (o.lane === playerLane && Math.abs(o.y - playerY) < 30 && !jumping) {
                over = true;
            }
        });

        score += 1;
        speed = 4 + score / 500;
    }

    function draw() {
        ctx.fillStyle = '#e9f0fb';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 1; i < laneCount; i++) {
            ctx.strokeStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(i * laneW, 0);
            ctx.lineTo(i * laneW, canvas.height);
            ctx.stroke();
        }
        obstacles.forEach(o => {
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(laneX(o.lane) - 24, o.y - 18, 48, 36);
        });
        const playerY = canvas.height - 90 - (jumping ? Math.sin(jumpT * Math.PI) * 60 : 0);
        ctx.fillStyle = '#051937';
        ctx.beginPath();
        ctx.arc(laneX(playerLane), playerY, 22, 0, Math.PI * 2);
        ctx.fill();

        drawCenteredText(ctx, `Score: ${Math.floor(score / 5)}`, canvas.width / 2, 30, 22, '#051937');
        if (over) {
            drawCenteredText(ctx, 'GAME OVER', canvas.width / 2, canvas.height / 2 - 20, 34, '#ff3333');
            drawCenteredText(ctx, 'Press R to restart', canvas.width / 2, canvas.height / 2 + 20, 18, '#051937');
        } else {
            drawCenteredText(ctx, '← → move · Space/↑ jump', canvas.width / 2, canvas.height - 16, 14, '#666');
        }
    }

    function loop() {
        if (!running) return;
        update();
        draw();
        raf = requestAnimationFrame(loop);
    }

    return {
        start() { running = true; loop(); },
        stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    };
};

/* ---------------------------------------------------------
   GAME 2: TRAP JUMPER — side-scrolling spike platformer
   --------------------------------------------------------- */
GAMES.trap = function (canvas) {
    const ctx = canvas.getContext('2d');
    let raf = null, running = true, over = false;
    let groundY, vy, playerY, onGround, score, speed, spikes, spawnTimer;

    function reset() {
        groundY = canvas.height - 60;
        vy = 0; playerY = groundY; onGround = true;
        score = 0; speed = 5; spikes = []; spawnTimer = 0; over = false;
    }
    reset();

    function update() {
        if (over) { if (Keys['r'] || Keys['R']) reset(); return; }
        if ((Keys[' '] || Keys.ArrowUp) && onGround) { vy = -11; onGround = false; }
        vy += 0.55;
        playerY += vy;
        if (playerY >= groundY) { playerY = groundY; vy = 0; onGround = true; }

        spawnTimer -= 1;
        if (spawnTimer <= 0) {
            spawnTimer = Math.max(60 - speed * 3, 30);
            spikes.push({ x: canvas.width + 20 });
        }
        spikes.forEach(s => (s.x -= speed));
        spikes = spikes.filter(s => s.x > -30);

        const playerX = 90;
        spikes.forEach(s => {
            if (Math.abs(s.x - playerX) < 26 && playerY > groundY - 20) over = true;
        });

        score += 1;
        speed = 5 + score / 400;
    }

    function draw() {
        ctx.fillStyle = '#fff7e6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#d8c8a0';
        ctx.fillRect(0, groundY + 20, canvas.width, canvas.height - groundY - 20);

        spikes.forEach(s => {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.moveTo(s.x - 18, groundY + 20);
            ctx.lineTo(s.x, groundY - 20);
            ctx.lineTo(s.x + 18, groundY + 20);
            ctx.closePath();
            ctx.fill();
        });

        ctx.fillStyle = '#051937';
        ctx.fillRect(90 - 16, playerY - 18, 32, 36);

        drawCenteredText(ctx, `Score: ${Math.floor(score / 5)}`, canvas.width / 2, 30, 22, '#051937');
        if (over) {
            drawCenteredText(ctx, 'GAME OVER', canvas.width / 2, canvas.height / 2 - 20, 34, '#ff3333');
            drawCenteredText(ctx, 'Press R to restart', canvas.width / 2, canvas.height / 2 + 20, 18, '#051937');
        } else {
            drawCenteredText(ctx, 'Space/↑ to jump', canvas.width / 2, canvas.height - 16, 14, '#666');
        }
    }

    function loop() {
        if (!running) return;
        update(); draw();
        raf = requestAnimationFrame(loop);
    }

    return {
        start() { running = true; loop(); },
        stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    };
};

/* ---------------------------------------------------------
   GAME 3: KART ARENA — top-down dodge & collect
   --------------------------------------------------------- */
GAMES.kart = function (canvas) {
    const ctx = canvas.getContext('2d');
    let raf = null, running = true, over = false;
    let px, py, rocks, coins, score, lives, spawnTimer;

    function reset() {
        px = canvas.width / 2; py = canvas.height / 2;
        rocks = []; coins = []; score = 0; lives = 3; spawnTimer = 0; over = false;
    }
    reset();

    function update() {
        if (over) { if (Keys['r'] || Keys['R']) reset(); return; }
        const spd = 4.2;
        if (Keys.ArrowLeft) px -= spd;
        if (Keys.ArrowRight) px += spd;
        if (Keys.ArrowUp) py -= spd;
        if (Keys.ArrowDown) py += spd;
        px = Math.max(20, Math.min(canvas.width - 20, px));
        py = Math.max(20, Math.min(canvas.height - 20, py));

        spawnTimer -= 1;
        if (spawnTimer <= 0) {
            spawnTimer = 25;
            const edge = Math.floor(Math.random() * 4);
            const pos = edge < 2
                ? { x: edge === 0 ? -20 : canvas.width + 20, y: Math.random() * canvas.height }
                : { x: Math.random() * canvas.width, y: edge === 2 ? -20 : canvas.height + 20 };
            if (Math.random() < 0.65) rocks.push({ ...pos, vx: (px - pos.x) / 90, vy: (py - pos.y) / 90 });
            else coins.push({ x: Math.random() * (canvas.width - 40) + 20, y: Math.random() * (canvas.height - 40) + 20 });
        }

        rocks.forEach(r => { r.x += r.vx; r.y += r.vy; });
        rocks = rocks.filter(r => r.x > -60 && r.x < canvas.width + 60 && r.y > -60 && r.y < canvas.height + 60);

        rocks.forEach(r => {
            if (Math.hypot(r.x - px, r.y - py) < 26) {
                r.hit = true; lives -= 1;
                if (lives <= 0) over = true;
            }
        });
        rocks = rocks.filter(r => !r.hit);

        coins.forEach(c => {
            if (Math.hypot(c.x - px, c.y - py) < 24) { c.grabbed = true; score += 10; }
        });
        coins = coins.filter(c => !c.grabbed);
    }

    function draw() {
        ctx.fillStyle = '#eafbea';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        coins.forEach(c => {
            ctx.fillStyle = '#ffd600';
            ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.fill();
        });
        rocks.forEach(r => {
            ctx.fillStyle = '#7a5230';
            ctx.beginPath(); ctx.arc(r.x, r.y, 16, 0, Math.PI * 2); ctx.fill();
        });

        ctx.fillStyle = '#051937';
        ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();

        drawCenteredText(ctx, `Score: ${score}   ❤️ x${Math.max(lives, 0)}`, canvas.width / 2, 30, 20, '#051937');
        if (over) {
            drawCenteredText(ctx, 'GAME OVER', canvas.width / 2, canvas.height / 2 - 20, 34, '#ff3333');
            drawCenteredText(ctx, 'Press R to restart', canvas.width / 2, canvas.height / 2 + 20, 18, '#051937');
        } else {
            drawCenteredText(ctx, 'Arrow keys to drive · dodge rocks, grab coins', canvas.width / 2, canvas.height - 16, 14, '#666');
        }
    }

    function loop() {
        if (!running) return;
        update(); draw();
        raf = requestAnimationFrame(loop);
    }

    return {
        start() { running = true; loop(); },
        stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    };
};

/* ---------------------------------------------------------
   GAME 4: HILL DRIVER — bumpy terrain balance game
   --------------------------------------------------------- */
GAMES.drive = function (canvas) {
    const ctx = canvas.getContext('2d');
    let raf = null, running = true, over = false;
    let dist, speed, carAngle, carY, terrainSeed, score;

    function terrainHeight(x) {
        return canvas.height - 140
            + Math.sin((x + terrainSeed) * 0.01) * 40
            + Math.sin((x + terrainSeed) * 0.035) * 18;
    }

    function reset() {
        dist = 0; speed = 3.2; carAngle = 0; carY = 0; terrainSeed = 0; over = false; score = 0;
    }
    reset();

    function update() {
        if (over) { if (Keys['r'] || Keys['R']) reset(); return; }
        if (Keys.ArrowUp) speed = Math.min(speed + 0.15, 9);
        else speed = Math.max(speed - 0.08, 2);
        if (Keys.ArrowDown) speed = Math.max(speed - 0.25, 1);

        dist += speed;
        terrainSeed += speed;

        const carX = 150;
        const hHere = terrainHeight(carX);
        const hAhead = terrainHeight(carX + 20);
        const slope = hAhead - hHere;
        const targetAngle = Math.atan2(slope, 20);
        carAngle += (targetAngle - carAngle) * 0.15;

        if (Math.abs(carAngle) > 1.1 && speed > 5) over = true;

        score = Math.floor(dist / 8);
    }

    function draw() {
        ctx.fillStyle = '#dff3ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#8fbf6a';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 8) {
            ctx.lineTo(x, terrainHeight(x));
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fill();

        const carX = 150;
        const carBaseY = terrainHeight(carX);
        ctx.save();
        ctx.translate(carX, carBaseY - 14);
        ctx.rotate(carAngle);
        ctx.fillStyle = '#051937';
        ctx.fillRect(-24, -12, 48, 20);
        ctx.beginPath(); ctx.arc(-16, 8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(16, 8, 8, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        drawCenteredText(ctx, `Distance: ${score}m`, canvas.width / 2, 30, 20, '#051937');
        if (over) {
            drawCenteredText(ctx, 'YOU FLIPPED!', canvas.width / 2, canvas.height / 2 - 20, 34, '#ff3333');
            drawCenteredText(ctx, 'Press R to restart', canvas.width / 2, canvas.height / 2 + 20, 18, '#051937');
        } else {
            drawCenteredText(ctx, '↑ speed up · ↓ brake — ease off on steep hills', canvas.width / 2, canvas.height - 16, 14, '#555');
        }
    }

    function loop() {
        if (!running) return;
        update(); draw();
        raf = requestAnimationFrame(loop);
    }

    return {
        start() { running = true; loop(); },
        stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    };
};

/* ---------------------------------------------------------
   GAME 5: SWING HOOK — pendulum rope-swing game
   --------------------------------------------------------- */
GAMES.hook = function (canvas) {
    const ctx = canvas.getContext('2d');
    let raf = null, running = true, over = false;
    let px, py, vx, vy, attached, anchor, angle, angVel, ropeLen, camX, anchors, score;

    function genAnchors(fromX) {
        for (let x = fromX; x < fromX + 2000; x += 180 + Math.random() * 80) {
            anchors.push({ x, y: 60 + Math.random() * 60 });
        }
    }

    function reset() {
        px = 120; py = 140; vx = 3; vy = 0; attached = false;
        angle = 0; angVel = 0; ropeLen = 0; camX = 0; score = 0; over = false;
        anchors = [{ x: 60, y: 80 }];
        genAnchors(300);
    }
    reset();

    const gravity = 0.5;

    function update() {
        if (over) { if (Keys['r'] || Keys['R']) reset(); return; }

        if (anchors.length && anchors[anchors.length - 1].x < camX + canvas.width + 400) {
            genAnchors(anchors[anchors.length - 1].x + 180);
        }

        const wantHook = Keys[' '] || Keys.ArrowUp;

        if (!attached) {
            if (wantHook) {
                let best = null, bestD = 220;
                anchors.forEach(a => {
                    const d = Math.hypot(a.x - px, a.y - py);
                    if (d < bestD && a.x > px - 30) { best = a; bestD = d; }
                });
                if (best) {
                    attached = true;
                    anchor = best;
                    ropeLen = Math.hypot(px - anchor.x, py - anchor.y);
                    angle = Math.atan2(px - anchor.x, py - anchor.y);
                    const tangX = Math.cos(angle), tangY = -Math.sin(angle);
                    angVel = (vx * tangX + vy * tangY) / ropeLen;
                }
            }
            if (!attached) {
                vy += gravity;
                px += vx; py += vy;
            }
        }

        if (attached) {
            if (!wantHook) {
                const tangX = Math.cos(angle), tangY = -Math.sin(angle);
                vx = angVel * ropeLen * tangX;
                vy = angVel * ropeLen * tangY;
                attached = false;
            } else {
                const angAcc = -(gravity / ropeLen) * Math.sin(angle);
                angVel += angAcc;
                angle += angVel;
                px = anchor.x + ropeLen * Math.sin(angle);
                py = anchor.y + ropeLen * Math.cos(angle);
            }
        }

        camX = px - 150;
        score = Math.floor(px / 10);

        if (py > canvas.height + 40) over = true;
    }

    function draw() {
        ctx.fillStyle = '#eaf4ff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        anchors.forEach(a => {
            const sx = a.x - camX;
            if (sx < -30 || sx > canvas.width + 30) return;
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(sx - 5, 0, 10, a.y);
            ctx.beginPath(); ctx.arc(sx, a.y, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#475569'; ctx.fill();
        });

        if (attached && (Keys[' '] || Keys.ArrowUp)) {
            ctx.strokeStyle = '#051937';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(anchor.x - camX, anchor.y);
            ctx.lineTo(px - camX, py);
            ctx.stroke();
        }

        ctx.fillStyle = '#ff6b00';
        ctx.beginPath(); ctx.arc(px - camX, py, 16, 0, Math.PI * 2); ctx.fill();

        drawCenteredText(ctx, `Distance: ${score}m`, canvas.width / 2, 30, 20, '#051937');
        if (over) {
            drawCenteredText(ctx, 'YOU FELL!', canvas.width / 2, canvas.height / 2 - 20, 34, '#ff3333');
            drawCenteredText(ctx, 'Press R to restart', canvas.width / 2, canvas.height / 2 + 20, 18, '#051937');
        } else {
            drawCenteredText(ctx, 'Hold Space/↑ near an anchor to swing, release to fly', canvas.width / 2, canvas.height - 16, 14, '#555');
        }
    }

    function loop() {
        if (!running) return;
        update(); draw();
        raf = requestAnimationFrame(loop);
    }

    return {
        start() { running = true; loop(); },
        stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    };
};

/* ---------------------------------------------------------
   GAME 6: TEMPLE DASH 2 — runner variant: jump AND duck
   --------------------------------------------------------- */
GAMES.temple = function (canvas) {
    const ctx = canvas.getContext('2d');
    let raf = null, running = true, over = false;
    let score, speed, jumping, jumpT, ducking, obstacles, spawnTimer;

    function reset() {
        score = 0; speed = 5; jumping = false; jumpT = 0; ducking = false;
        obstacles = []; spawnTimer = 0; over = false;
    }
    reset();

    const groundY = () => canvas.height - 90;

    function update() {
        if (over) { if (Keys['r'] || Keys['R']) reset(); return; }
        if ((Keys[' '] || Keys.ArrowUp) && !jumping && !ducking) { jumping = true; jumpT = 0; }
        ducking = !!Keys.ArrowDown && !jumping;

        if (jumping) {
            jumpT += 0.07;
            if (jumpT >= 1) { jumping = false; jumpT = 0; }
        }

        spawnTimer -= 1;
        if (spawnTimer <= 0) {
            spawnTimer = Math.max(50 - speed * 2, 26);
            obstacles.push({ x: canvas.width + 30, type: Math.random() < 0.5 ? 'low' : 'high' });
        }
        obstacles.forEach(o => (o.x -= speed));
        obstacles = obstacles.filter(o => o.x > -40);

        const playerX = 100;
        obstacles.forEach(o => {
            if (Math.abs(o.x - playerX) < 26) {
                if (o.type === 'low' && !jumping) over = true;
                if (o.type === 'high' && !ducking) over = true;
            }
        });

        score += 1;
        speed = 5 + score / 450;
    }

    function draw() {
        ctx.fillStyle = '#efe3cf';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#c9b48a';
        ctx.fillRect(0, groundY() + 20, canvas.width, canvas.height - groundY() - 20);

        obstacles.forEach(o => {
            if (o.type === 'low') {
                ctx.fillStyle = '#8a6d3b';
                ctx.fillRect(o.x - 16, groundY() - 10, 32, 30);
            } else {
                ctx.fillStyle = '#8a6d3b';
                ctx.fillRect(o.x - 22, groundY() - 70, 44, 34);
            }
        });

        const playerX = 100;
        const baseY = groundY() - (jumping ? Math.sin(jumpT * Math.PI) * 60 : 0);
        const h = ducking ? 20 : 40;
        ctx.fillStyle = '#051937';
        ctx.fillRect(playerX - 16, baseY - h, 32, h);

        drawCenteredText(ctx, `Score: ${Math.floor(score / 5)}`, canvas.width / 2, 30, 22, '#051937');
        if (over) {
            drawCenteredText(ctx, 'GAME OVER', canvas.width / 2, canvas.height / 2 - 20, 34, '#ff3333');
            drawCenteredText(ctx, 'Press R to restart', canvas.width / 2, canvas.height / 2 + 20, 18, '#051937');
        } else {
            drawCenteredText(ctx, 'Space/↑ jump low obstacles · ↓ duck under high ones', canvas.width / 2, canvas.height - 16, 14, '#666');
        }
    }

    function loop() {
        if (!running) return;
        update(); draw();
        raf = requestAnimationFrame(loop);
    }

    return {
        start() { running = true; loop(); },
        stop() { running = false; if (raf) cancelAnimationFrame(raf); }
    };
};
