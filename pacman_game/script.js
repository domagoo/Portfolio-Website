/* pacman_game/script.js
*/

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

const canvas = document.getElementById("game");
const ctx = canvas?.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const statusEl = document.getElementById("status");

const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnReset = document.getElementById("btnReset");

if (!canvas || !ctx) console.error("Canvas not found (id='game').");

/* ======== GRID / SCALE ======== */
const TILE = 20;
const COLS = 28;
const ROWS = 28; // ✅ square board so it scales bigger on wide screens

const BASE_W = COLS * TILE; // 560
const BASE_H = ROWS * TILE; // 560

let RENDER = { scale: 1, ox: 0, oy: 0 };

/* ======== CORE ======== */
const DIRS = {
  NONE: { x: 0, y: 0 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 }
};

const state = {
  running: false,
  paused: false,
  score: 0,
  lives: 3,
  level: 1,
  pelletsLeft: 0,
  powerTimer: 0,
  levelClearing: false // ✅ prevents level jumping
};

const pacman = {
  x: 14 * TILE + TILE / 2,
  y: (ROWS - 4) * TILE + TILE / 2, // ✅ spawn near bottom
  dir: DIRS.LEFT,
  nextDir: DIRS.LEFT,
  speed: 2.0,
  mouth: 0
};

const ghosts = [
  { name: "blinky", color: "#ff4b6a", x: 13 * TILE + 10, y: 13 * TILE + 10, dir: DIRS.LEFT, speed: 1.7 },
  { name: "pinky",  color: "#ff7bd5", x: 14 * TILE + 10, y: 13 * TILE + 10, dir: DIRS.RIGHT, speed: 1.6 },
  { name: "inky",   color: "#42d9ff", x: 13 * TILE + 10, y: 14 * TILE + 10, dir: DIRS.UP, speed: 1.55 },
  { name: "clyde",  color: "#ffb44a", x: 14 * TILE + 10, y: 14 * TILE + 10, dir: DIRS.DOWN, speed: 1.5 }
];

function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function syncHUD() {
  if (scoreEl) scoreEl.textContent = String(state.score);
  if (livesEl) livesEl.textContent = String(state.lives);
  if (levelEl) levelEl.textContent = String(state.level);
}

function isWall(tx, ty) {
  if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return true;
  return map[ty][tx] === 1;
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function drawRoundedRect(x, y, w, h, r) {
  const rr = clamp(r, 0, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function resetPositions() {
  pacman.x = 14 * TILE + TILE / 2;
  pacman.y = (ROWS - 4) * TILE + TILE / 2;
  pacman.dir = DIRS.LEFT;
  pacman.nextDir = DIRS.LEFT;

  ghosts[0].x = 13 * TILE + 10; ghosts[0].y = 13 * TILE + 10; ghosts[0].dir = DIRS.LEFT;
  ghosts[1].x = 14 * TILE + 10; ghosts[1].y = 13 * TILE + 10; ghosts[1].dir = DIRS.RIGHT;
  ghosts[2].x = 13 * TILE + 10; ghosts[2].y = 14 * TILE + 10; ghosts[2].dir = DIRS.UP;
  ghosts[3].x = 14 * TILE + 10; ghosts[3].y = 14 * TILE + 10; ghosts[3].dir = DIRS.DOWN;

  state.powerTimer = 0;
}

/* ======== MAP (no impossible dots) ======== */
/* 0 empty, 1 wall, 2 pellet, 3 power pellet */
function buildMap() {
  const m = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const border = r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1;
      if (border) return 1;

      // corridors/walls pattern (tuned for square board)
      if (r % 4 === 0 && c > 2 && c < COLS - 3) return 1;
      if (c % 6 === 0 && r > 2 && r < ROWS - 3) return 1;

      return 2;
    })
  );

  // ghost box (center-ish)
  const gbTop = Math.floor(ROWS / 2) - 3;   // 11
  const gbBot = Math.floor(ROWS / 2) + 2;   // 16
  for (let r = gbTop; r <= gbBot; r++) {
    for (let c = 10; c <= 17; c++) m[r][c] = 0;
  }
  // doorway
  m[gbTop][13] = 0;
  m[gbTop][14] = 0;

  // ensure a main vertical corridor
  for (let r = 1; r < ROWS - 1; r++) m[r][Math.floor(COLS / 2)] = 0;

  // power pellets
  m[2][2] = 3;
  m[2][COLS - 3] = 3;
  m[ROWS - 3][2] = 3;
  m[ROWS - 3][COLS - 3] = 3;

  // open spawn lane
  const spawnRow = ROWS - 4;
  for (let c = 10; c <= 17; c++) m[spawnRow][c] = 0;

  // sprinkle pellets into empty corridors
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (m[r][c] === 0) {
        // keep ghost box empty
        if (r >= gbTop && r <= gbBot && c >= 10 && c <= 17) continue;
        if (Math.random() < 0.65) m[r][c] = 2;
      }
    }
  }

  // guarantee pellets on spawn row
  for (let c = 1; c < COLS - 1; c++) if (m[spawnRow][c] === 0) m[spawnRow][c] = 2;

  // ✅ remove unreachable pellets so there are NO impossible dots
  return removeUnreachablePellets(m, 14, spawnRow);
}

function removeUnreachablePellets(m, startX, startY) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const q = [{ x: startX, y: startY }];
  visited[startY][startX] = true;

  const dirs = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT];

  while (q.length) {
    const cur = q.shift();
    for (const d of dirs) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (visited[ny][nx]) continue;
      if (m[ny][nx] === 1) continue; // wall
      visited[ny][nx] = true;
      q.push({ x: nx, y: ny });
    }
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!visited[y][x] && (m[y][x] === 2 || m[y][x] === 3)) {
        m[y][x] = 0; // remove pellets you can’t ever reach
      }
    }
  }
  return m;
}

let map = buildMap();

function countPellets() {
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) if (map[r][c] === 2 || map[r][c] === 3) n++;
  }
  return n;
}

/* ======== MOVEMENT ======== */
function tryTurn(entity, desiredDir) {
  const tx = Math.floor(entity.x / TILE);
  const ty = Math.floor(entity.y / TILE);
  const cx = tx * TILE + TILE / 2;
  const cy = ty * TILE + TILE / 2;

  if (Math.abs(entity.x - cx) > 2 || Math.abs(entity.y - cy) > 2) return false;

  const nx = tx + desiredDir.x;
  const ny = ty + desiredDir.y;

  if (!isWall(nx, ny)) {
    entity.x = cx;
    entity.y = cy;
    entity.dir = desiredDir;
    return true;
  }
  return false;
}

function moveEntity(entity, speed) {
  const nextX = entity.x + entity.dir.x * speed;
  const nextY = entity.y + entity.dir.y * speed;

  const ntx = Math.floor(nextX / TILE);
  const nty = Math.floor(nextY / TILE);

  if (!isWall(ntx, nty)) {
    entity.x = nextX;
    entity.y = nextY;
    return true;
  }

  const tx = Math.floor(entity.x / TILE);
  const ty = Math.floor(entity.y / TILE);
  entity.x = tx * TILE + TILE / 2;
  entity.y = ty * TILE + TILE / 2;
  return false;
}

function applyPlayerDirection() {
  if (pacman.nextDir !== pacman.dir) tryTurn(pacman, pacman.nextDir);

  // If blocked ahead, try turning again (prevents “stuck” feeling)
  const tx = Math.floor(pacman.x / TILE);
  const ty = Math.floor(pacman.y / TILE);
  if (isWall(tx + pacman.dir.x, ty + pacman.dir.y)) {
    tryTurn(pacman, pacman.nextDir);
  }
}

function chooseGhostDir(g) {
  const tx = Math.floor(g.x / TILE);
  const ty = Math.floor(g.y / TILE);

  const cx = tx * TILE + TILE / 2;
  const cy = ty * TILE + TILE / 2;
  if (Math.abs(g.x - cx) > 2 || Math.abs(g.y - cy) > 2) return;

  const options = [DIRS.UP, DIRS.DOWN, DIRS.LEFT, DIRS.RIGHT].filter((d) => {
    const rev = d.x === -g.dir.x && d.y === -g.dir.y;
    const nx = tx + d.x;
    const ny = ty + d.y;
    if (isWall(nx, ny)) return false;
    if (rev) return false;
    return true;
  });

  if (options.length === 0) {
    const rev = { x: -g.dir.x, y: -g.dir.y };
    if (!isWall(tx + rev.x, ty + rev.y)) g.dir = rev;
    return;
  }

  const flee = state.powerTimer > 0;
  let best = options[0];
  let bestScore = -Infinity;

  for (const d of options) {
    const nx = (tx + d.x) * TILE + TILE / 2;
    const ny = (ty + d.y) * TILE + TILE / 2;
    const dist = Math.hypot(pacman.x - nx, pacman.y - ny);
    const score = flee ? dist : -dist;
    const jitter = (Math.random() - 0.5) * 8;
    const total = score + jitter;
    if (total > bestScore) {
      bestScore = total;
      best = d;
    }
  }
  g.dir = best;
}

function eatAtPacman() {
  const tx = Math.floor(pacman.x / TILE);
  const ty = Math.floor(pacman.y / TILE);
  const cell = map[ty]?.[tx];

  if (cell === 2) {
    map[ty][tx] = 0;
    state.score += 10;
    state.pelletsLeft--;
  } else if (cell === 3) {
    map[ty][tx] = 0;
    state.score += 50;
    state.pelletsLeft--;
    state.powerTimer = 60 * 8;
    setStatus("Power mode! Chase ghosts.");
  }

  // ✅ FIX: only clear level ONCE
  if (state.pelletsLeft <= 0 && !state.levelClearing) {
    state.levelClearing = true;

    state.level += 1;
    syncHUD();
    setStatus("Level cleared! Loading next…");

    // freeze during transition (prevents extra hits)
    state.paused = true;

    setTimeout(() => {
      map = buildMap();
      state.pelletsLeft = countPellets();
      state.powerTimer = 0;
      resetPositions();
      syncHUD();
      setStatus("Go!");

      state.paused = false;
      state.levelClearing = false;
    }, 650);
  }
}

function checkCollisions() {
  for (const g of ghosts) {
    const d = Math.hypot(pacman.x - g.x, pacman.y - g.y);
    if (d < 14) {
      if (state.powerTimer > 0) {
        state.score += 200;
        g.x = 14 * TILE + 10;
        g.y = 13 * TILE + 10;
        g.dir = DIRS.LEFT;
        setStatus("Ghost eaten! +200");
      } else {
        state.lives -= 1;
        syncHUD();

        if (state.lives <= 0) {
          state.running = false;
          setStatus("Game Over. Press Start.");
        } else {
          setStatus("Ouch! Life lost.");
          resetPositions();
        }
      }
      break;
    }
  }
}

/* ======== DRAW (scaled + centered board) ======== */
function begin() {
  ctx.save();
  ctx.translate(RENDER.ox, RENDER.oy);
  ctx.scale(RENDER.scale, RENDER.scale);
}
function end() {
  ctx.restore();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas._cssW || canvas.width, canvas._cssH || canvas.height);

  begin();

  // subtle grid
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if ((r + c) % 2 === 0) continue;
      ctx.fillStyle = "rgba(255,255,255,0.01)";
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  ctx.restore();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = map[r][c];

      if (cell === 1) {
        ctx.save();
        ctx.fillStyle = "rgba(120,155,255,0.10)";
        ctx.strokeStyle = "rgba(120,155,255,0.25)";
        ctx.lineWidth = 1;
        drawRoundedRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (cell === 2) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.60)";
        ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (cell === 3) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(160,110,255,0.85)";
        ctx.arc(c * TILE + TILE / 2, r * TILE + TILE / 2, 5.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  end();
}

function drawPacman() {
  begin();

  const t = (pacman.mouth % 20) / 20;
  const mouthOpen = 0.25 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.35;

  let angle = 0;
  if (pacman.dir === DIRS.RIGHT) angle = 0;
  if (pacman.dir === DIRS.LEFT) angle = Math.PI;
  if (pacman.dir === DIRS.UP) angle = -Math.PI / 2;
  if (pacman.dir === DIRS.DOWN) angle = Math.PI / 2;

  ctx.save();
  ctx.translate(pacman.x, pacman.y);
  ctx.fillStyle = "rgba(255,220,90,0.95)";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 10, angle + mouthOpen, angle + Math.PI * 2 - mouthOpen);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  end();
}

function drawGhost(g) {
  begin();

  const frightened = state.powerTimer > 0;
  ctx.save();
  ctx.translate(g.x, g.y);

  const base = frightened ? "rgba(120,155,255,0.95)" : g.color;

  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(0, -2, 10, Math.PI, 0);
  ctx.lineTo(10, 10);
  ctx.lineTo(6, 7);
  ctx.lineTo(2, 10);
  ctx.lineTo(-2, 7);
  ctx.lineTo(-6, 10);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(-4, -2, 2.6, 0, Math.PI * 2);
  ctx.arc(4, -2, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(10,10,20,0.85)";
  ctx.beginPath();
  ctx.arc(-4, -2, 1.2, 0, Math.PI * 2);
  ctx.arc(4, -2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  end();
}

/* ======== LOOP ======== */
function loop() {
  drawMap();
  ghosts.forEach(drawGhost);
  drawPacman();

  if (state.running && !state.paused) {
    if (state.powerTimer > 0) state.powerTimer--;

    applyPlayerDirection();
    moveEntity(pacman, pacman.speed);
    pacman.mouth++;

    eatAtPacman();

    for (const g of ghosts) {
      chooseGhostDir(g);
      moveEntity(g, g.speed);
    }

    checkCollisions();
    syncHUD();
  }

  requestAnimationFrame(loop);
}

/* ======== RESIZE ======== */
function resizeCanvasToStage() {
  const stage = canvas?.parentElement;
  if (!stage) return;

  const rect = stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas._cssW = rect.width;
  canvas._cssH = rect.height;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);

  // draw in CSS pixels
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // fit board
  const scale = Math.min(rect.width / BASE_W, rect.height / BASE_H);
  const ox = (rect.width - BASE_W * scale) / 2;
  const oy = (rect.height - BASE_H * scale) / 2;

  RENDER = { scale, ox, oy };
}

window.addEventListener("resize", resizeCanvasToStage);

/* ======== INPUT ======== */
function isGameKey(key) {
  const k = key.toLowerCase();
  return (
    k === "arrowleft" || k === "arrowright" || k === "arrowup" || k === "arrowdown" ||
    k === "a" || k === "d" || k === "w" || k === "s" ||
    k === "p" || k === " " || k === "enter"
  );
}

function focusGame() {
  try { canvas.focus({ preventScroll: true }); }
  catch { canvas.focus(); }
}

function setNextDirFromKey(key) {
  const k = key.toLowerCase();
  if (k === "arrowleft" || k === "a") pacman.nextDir = DIRS.LEFT;
  if (k === "arrowright" || k === "d") pacman.nextDir = DIRS.RIGHT;
  if (k === "arrowup" || k === "w") pacman.nextDir = DIRS.UP;
  if (k === "arrowdown" || k === "s") pacman.nextDir = DIRS.DOWN;
}

function startGame() {
  if (!state.running) {
    state.running = true;
    state.paused = false;
    setStatus("Go!");
    focusGame();
  }
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  setStatus(state.paused ? "Paused." : "Go!");
}

function resetGame(full = true) {
  if (full) {
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    map = buildMap();
    state.pelletsLeft = countPellets();
  }
  state.running = false;
  state.paused = false;
  state.powerTimer = 0;
  state.levelClearing = false; // ✅ reset lock
  resetPositions();
  syncHUD();
  setStatus("Ready. Click Start.");
}

document.addEventListener("pointerdown", focusGame, { passive: true });

document.addEventListener("keydown", (e) => {
  if (!isGameKey(e.key)) return;

  e.preventDefault();
  e.stopPropagation();

  const k = e.key.toLowerCase();

  if (!state.running && (k.startsWith("arrow") || ["w","a","s","d","enter"," "].includes(k))) {
    startGame();
  }

  if (k === "p") return togglePause();
  setNextDirFromKey(e.key);
}, { capture: true, passive: false });

btnStart?.addEventListener("click", startGame);
btnPause?.addEventListener("click", togglePause);
btnReset?.addEventListener("click", () => resetGame(true));

/* ======== INIT ======== */
function init() {
  state.pelletsLeft = countPellets();
  resizeCanvasToStage();
  resetGame(true);
  requestAnimationFrame(loop);
}

init();
