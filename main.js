/* ==========================================================
   GAMINGPLUS+  —  main.js
   ========================================================== */

(function () {
  "use strict";

  /* -------------------- POINTS SYSTEM -------------------- */
  const POINTS_KEY = "gamingplus_points";
  let totalPoints = parseInt(localStorage.getItem(POINTS_KEY) || "0", 10) || 0;
  const pointsDisplay = document.getElementById("livePointsDisplay");

  function renderPoints() {
    pointsDisplay.textContent = "🪙 Your Points: " + totalPoints;
  }
  function addPoints(n) {
    totalPoints += n;
    localStorage.setItem(POINTS_KEY, String(totalPoints));
    renderPoints();
  }
  renderPoints();

  /* ---- Auto reward: +50 points for every 1 hour of active time ---- */
  const HOUR_MS = 60 * 60 * 1000;
  const REWARD_PER_HOUR = 50;
  const ACTIVE_KEY = "gamingplus_active_ms";
  let activeMs = parseInt(localStorage.getItem(ACTIVE_KEY) || "0", 10) || 0;

  setInterval(function () {
    if (document.hidden) return;
    activeMs += 1000;
    if (activeMs >= HOUR_MS) {
      activeMs -= HOUR_MS;
      addPoints(REWARD_PER_HOUR);
    }
    localStorage.setItem(ACTIVE_KEY, String(activeMs));
  }, 1000);

  /* -------------------- SEARCH -------------------- */
  const searchBar = document.getElementById("gameSearchBar");
  const cards = Array.prototype.slice.call(
    document.querySelectorAll(".game-item-card")
  );
  const noResults = document.getElementById("noResultsMsg");

  function runSearch() {
    const q = searchBar.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach(function (card) {
      const hay =
        (card.getAttribute("data-gametitle") || "") +
        " " +
        card.textContent.toLowerCase();
      const match = q === "" || hay.indexOf(q) !== -1;
      card.style.display = match ? "" : "none";
      if (match) visible++;
    });
    noResults.hidden = visible !== 0;
  }
  searchBar.addEventListener("input", runSearch);

  /* -------------------- OVERLAY & INPUT -------------------- */
  const overlay = document.getElementById("globalGameScreenOverlay");
  const stage = document.getElementById("gameStage");
  const titleEl = document.getElementById("activeGameTitle");
  const scoreEl = document.getElementById("activeGameScore");
  const exitBtn = document.getElementById("masterExitBtn");
  const touchWrap = document.getElementById("touchControls");

  const keys = Object.create(null);
  let activeGame = null;
  let rafId = null;
  let lastTime = 0;
  let runScore = 0;
  let gameEnded = false;

  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function setScore(v) {
    runScore = v;
    scoreEl.textContent = "Score: " + Math.floor(runScore);
  }

  /* ---- keyboard ---- */
  window.addEventListener("keydown", function (e) {
    if (!overlay.classList.contains("is-open")) return;
    const k = e.key === " " ? " " : e.key;
    if (
      k === " " ||
      k === "ArrowUp" ||
      k === "ArrowDown" ||
      k === "ArrowLeft" ||
      k === "ArrowRight"
    ) {
      e.preventDefault();
    }
    if (!keys[k]) {
      keys[k] = true;
      if (activeGame && activeGame.press) activeGame.press(k);
    }
  });
  window.addEventListener("keyup", function (e) {
    const k = e.key === " " ? " " : e.key;
    keys[k] = false;
  });

  /* ---- touch buttons ---- */
  touchWrap.querySelectorAll(".touch-btn").forEach(function (btn) {
    const k = btn.getAttribute("data-key");
    const down = function (ev) {
      ev.preventDefault();
      if (!keys[k]) {
        keys[k] = true;
        if (activeGame && activeGame.press) activeGame.press(k);
      }
    };
    const up = function (ev) {
      ev.preventDefault();
      keys[k] = false;
    };
    btn.addEventListener("touchstart", down, { passive: false });
    btn.addEventListener("touchend", up, { passive: false });
    btn.addEventListener("mousedown", down);
    btn.addEventListener("mouseup", up);
    btn.addEventListener("mouseleave", up);
  });

  /* -------------------- MESSAGE OVERLAY (start / game over) ---- */
  let msgEl = null;
  function showMessage(title, text, btnLabel, onClick) {
    hideMessage();
    msgEl = document.createElement("div");
    msgEl.className = "game-msg-overlay";
    const h = document.createElement("h2");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = text;
    const b = document.createElement("button");
    b.textContent = btnLabel;
    b.addEventListener("click", function () {
      hideMessage();
      onClick();
    });
    msgEl.appendChild(h);
    msgEl.appendChild(p);
    msgEl.appendChild(b);
    stageInner.appendChild(msgEl);
  }
  function hideMessage() {
    if (msgEl && msgEl.parentNode) msgEl.parentNode.removeChild(msgEl);
    msgEl = null;
  }

  /* -------------------- CANVAS SETUP -------------------- */
  let canvas = null;
  let ctx = null;
  let stageInner = null;

  function makeCanvas(w, h) {
    stage.innerHTML = "";
    stageInner = document.createElement("div");
    stageInner.className = "stage-inner";
    canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    ctx = canvas.getContext("2d");
    stageInner.appendChild(canvas);
    stage.appendChild(stageInner);
  }

  /* -------------------- GAME LOOP -------------------- */
  function loop(t) {
    if (!activeGame) return;
    const dt = Math.min((t - lastTime) / 1000, 0.05);
    lastTime = t;
    if (!gameEnded) {
      activeGame.update(dt);
    }
    activeGame.draw(ctx);
    rafId = requestAnimationFrame(loop);
  }

  function endRun(reason) {
    if (gameEnded) return;
    gameEnded = true;
    const earned = Math.floor(runScore);
    if (earned > 0) addPoints(earned);
    showMessage(
      "Game Over",
      reason + " You earned " + earned + " points!",
      "▶ Play Again",
      function () {
        startActive();
      }
    );
  }

  let startActive = function () {};

  /* -------------------- LAUNCH A GAME -------------------- */
  function launchCanvasGame(gameId, title) {
    const factory = GAMES[gameId];
    if (!factory) return;
    titleEl.textContent = title;
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    if (isTouch) touchWrap.classList.add("show");

    const game = factory({
      makeCanvas: makeCanvas,
      getCtx: function () {
        return ctx;
      },
      keys: keys,
      setScore: setScore,
      endRun: endRun,
    });

    startActive = function () {
      gameEnded = false;
      setScore(0);
      game.reset();
      hideMessage();
    };

    activeGame = game;
    game.build();
    setScore(0);
    gameEnded = true;
    showMessage(title, game.help || "Ready?", "▶ Start", function () {
      startActive();
    });

    game.reset();
    lastTime = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function launchIframe(src, title) {
    titleEl.textContent = title;
    scoreEl.textContent = "";
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
    touchWrap.classList.remove("show");
    stage.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.allow = "autoplay; fullscreen; gamepad";
    iframe.allowFullscreen = true;
    stage.appendChild(iframe);
    activeGame = null;
  }

  function closeGame() {
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    touchWrap.classList.remove("show");
    cancelAnimationFrame(rafId);
    rafId = null;
    activeGame = null;
    hideMessage();
    stage.innerHTML = "";
    for (const k in keys) keys[k] = false;
  }
  exitBtn.addEventListener("click", closeGame);

  /* -------------------- WIRE UP PLAY BUTTONS -------------------- */
  document.querySelectorAll(".action-play-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const card = btn.closest(".game-item-card");
      const title = card
        ? card.querySelector(".head-title").textContent
        : "Game";
      const embed = btn.getAttribute("data-embedsrc");
      const gameId = btn.getAttribute("data-game");
      if (embed && embed.indexOf("GAME_ID_HERE") === -1) {
        launchIframe(embed, title);
      } else if (gameId) {
        launchCanvasGame(gameId, title);
      } else {
        alert("Ye game abhi set nahi hua hai.");
      }
    });
  });

  /* ==========================================================
     GAMES — each factory returns { build, reset, update, draw, press, help }
     ========================================================== */
  const GAMES = {};

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  /* ---------- 1. RUNNER DASH (Subway Surfers card) ---------- */
  GAMES.runner = function (api) {
    const W = 400, H = 640;
    const laneX 
