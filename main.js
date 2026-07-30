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

function openEmbed(src, title) {
    for (const k in Keys) Keys[k] = false;
    activeGameTitle.textContent = title;
    gameStage.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    gameStage.appendChild(iframe);
    globalGameScreenOverlay.style.display = 'flex';
    activeGameHandle = { stop() { iframe.src = ''; } };
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
        const gameKey = btn.getAttribute('data-game');
        const embedSrc = btn.getAttribute('data-embedsrc');
        const title = btn.closest('.game-item-card').querySelector('.head-title').textContent;
        if (gameKey) openGame(gameKey, title);
        else if (embedSrc) openEmbed(embedSrc, title);
    });
});

if (masterExitBtn) {
    masterExitBtn.addEventListener('click', closeGame);
}
