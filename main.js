const games = [
  { id: 'subway-surfers', title: 'Subway Surfers', desc: 'Endless runner — dodge trains!', category: 'Action', poster: 'https://unsplash.com', src: 'https://poki.com' },
  { id: 'level-devil', title: 'Level Devil', desc: 'A popular platformer full of tricky traps.', category: 'Action', poster: 'https://unsplash.com', src: 'https://github.io' },
  { id: 'smash-karts', title: 'Smash Karts', desc: '3D multiplayer kart battle chaos.', category: 'Racing', poster: 'https://unsplash.com', src: 'https://smashkarts.io' },
  { id: 'drive-mad', title: 'Drive Mad', desc: 'Physics driving game.', category: 'Racing', poster: 'https://unsplash.com', src: 'https://github.io' },
  { id: 'stickman-hook', title: 'Stickman Hook', desc: 'Swing through levels.', category: 'Action', poster: 'https://unsplash.com', src: 'https://gamemonkey.org' },
  { id: '2048', title: '2048', desc: 'Slide tiles and double numbers.', category: 'Puzzle', poster: 'https://unsplash.com', src: 'https://play2048.co' }
]

const grid = document.getElementById('games-grid')
const noResults = document.getElementById('no-results')
const searchInput = document.getElementById('game-search')
const overlay = document.getElementById('game-overlay')
const gameFrame = document.getElementById('game-frame')
const closeBtn = document.getElementById('close-game')
const pointsValue = document.getElementById('points-value')
const categoryTabs = document.getElementById('category-tabs')

const categories = ['All', ...new Set(games.map((g) => g.category))]
let activeCategory = 'All'

categories.forEach((cat) => {
  const btn = document.createElement('button')
  btn.className = 'cat-tab' + (cat === 'All' ? ' active' : '')
  btn.textContent = cat
  btn.addEventListener('click', () => {
    activeCategory = cat
    document.querySelectorAll('.cat-tab').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    applyFilters()
  })
  categoryTabs.appendChild(btn)
})

function renderCards(list) {
  grid.innerHTML = ''
  list.forEach((g) => {
    const card = document.createElement('article')
    card.className = 'game-card'
    card.innerHTML = `
      <img class="game-poster" src="${g.poster}" alt="${g.title}" />
      <div class="game-body">
        <span class="game-cat">${g.category}</span>
        <h3 class="game-title">${g.title}</h3>
        <p class="game-desc">${g.desc}</p>
        <button class="play-btn" type="button">▶ Play Now</button>
      </div>
    `
    card.addEventListener('click', () => openGame(g.src))
    grid.appendChild(card)
  })
}

function applyFilters() {
  const q = searchInput.value.trim().toLowerCase()
  const filtered = games.filter((g) => {
    const matchCat = activeCategory === 'All' || g.category === activeCategory
    const matchSearch = g.title.toLowerCase().includes(q)
    return matchCat && matchSearch
  })
  if (filtered.length === 0) { grid.innerHTML = ''; noResults.hidden = false; }
  else { noResults.hidden = true; renderCards(filtered); }
}

renderCards(games)
searchInput.addEventListener('input', applyFilters)

function openGame(src) { gameFrame.src = src; overlay.hidden = false; document.body.style.overflow = 'hidden'; }
function closeGame() { gameFrame.src = ''; overlay.hidden = true; document.body.style.overflow = ''; }
closeBtn.addEventListener('click', closeGame)

let pts = parseInt(localStorage.getItem('gpp_pts') || '0', 10)
pointsValue.textContent = pts
setInterval(() => { pts += 50; pointsValue.textContent = pts; localStorage.setItem('gpp_pts', pts); }, 3600000)
document.getElementById('year').textContent = new Date().getFullYear()
