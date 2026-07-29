let activeUserPoints = 0;
const livePointsDisplay = document.getElementById('livePointsDisplay');
setInterval(() => {
    activeUserPoints += 50;
    if(livePointsDisplay) livePointsDisplay.innerHTML = `🪙 Your Points: ${activeUserPoints}`;
}, 3600000);

const gameSearchBar = document.getElementById('gameSearchBar');
const totalGameCards = document.querySelectorAll('.game-item-card');
if(gameSearchBar) {
    gameSearchBar.addEventListener('input', (event) => {
        const inputQuery = event.target.value.toLowerCase().trim();
        totalGameCards.forEach(cardItem => {
            const searchTag = cardItem.getAttribute('data-gametitle');
            if (searchTag && searchTag.includes(inputQuery)) {
                cardItem.style.display = 'flex';
            } else {
                cardItem.style.display = 'none';
            }
        });
    });
}

const allPlayActionBtns = document.querySelectorAll('.action-play-btn');
const globalGameScreenOverlay = document.getElementById('globalGameScreenOverlay');
const embeddedGameIframe = document.getElementById('embeddedGameIframe');
const masterExitBtn = document.getElementById('masterExitBtn');

allPlayActionBtns.forEach(btnNode => {
    btnNode.addEventListener('click', () => {
        const targetGameSourceUrl = btnNode.getAttribute('data-embedsrc');
        if(globalGameScreenOverlay && embeddedGameIframe) {
            globalGameScreenOverlay.style.display = 'block';
            embeddedGameIframe.src = targetGameSourceUrl;
            if (globalGameScreenOverlay.requestFullscreen) {
                globalGameScreenOverlay.requestFullscreen();
            }
        }
    });
});

if(masterExitBtn) {
    masterExitBtn.addEventListener('click', () => {
        if(globalGameScreenOverlay && embeddedGameIframe) {
            globalGameScreenOverlay.style.display = 'none';
            embeddedGameIframe.src = "";
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    });
}
