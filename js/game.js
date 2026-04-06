// game.js — Main game loop with monster, objectives, landmarks

const Game = (() => {
  const MOVE_SPEED = 0.055;
  const ROT_SPEED = 0.002;
  const PLAYER_RADIUS = 0.25;
  
  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const RENDER_SCALE = isMobile ? 0.45 : 0.75;
  
  let player = { x: 5.5, y: 15.5, angle: 0 };
  let keys = {};
  let mouseDX = 0;
  let running = false;
  let lastZone = null;
  let lastRenderTime = 0;
  let deathScreen = false;
  let messageTimeout = null;
  let lastLandmarkNotify = 0;
  
  // Joystick state
  const joy = { left: { active: false, dx: 0, dy: 0 }, right: { active: false, dx: 0, dy: 0 } };
  const JOY_RADIUS = 38;
  
  // DOM refs
  const titleScreen = document.getElementById('title-screen');
  const gameScreen = document.getElementById('game-screen');
  const canvas = document.getElementById('gameCanvas');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const respawnBtn = document.getElementById('respawn-btn');
  const deathScreenEl = document.getElementById('death-screen');
  const escapeScreen = document.getElementById('escape-screen');
  const zoneLabel = document.getElementById('zone-label');
  const msgBox = document.getElementById('message-box');
  const msgText = document.getElementById('message-text');
  const hintPanel = document.getElementById('hint-panel');
  const hintContent = document.getElementById('hint-content');
  const proximityWarning = document.getElementById('proximity-warning');
  const objList = document.getElementById('obj-list');
  const compass = document.getElementById('compass');
  const timestamp = document.getElementById('vhs-timestamp');
  
  // Expose showMessage globally
  window.showMessage = function(text, duration = 3000) {
    if (messageTimeout) clearTimeout(messageTimeout);
    msgText.textContent = text;
    msgBox.classList.remove('hidden');
    messageTimeout = setTimeout(() => msgBox.classList.add('hidden'), duration);
  };
  
  // Update objectives UI
  function updateObjectivesUI() {
    if (!objList) return;
    const fragments = Objectives.getFragments();
    const collected = Objectives.getTotalCollected();
    const total = Objectives.getTotalCount();
    
    objList.innerHTML = `<div style="font-size:11px; margin-bottom:6px;">${collected}/${total}</div>`;
    for (let f of fragments.slice(0, 5)) { // show first 5 for space
      const completedClass = f.collected ? 'completed' : '';
      objList.innerHTML += `<div class="obj-item ${completedClass}">
        <span class="obj-marker">${f.collected ? '✓' : '○'}</span>
        <span>${f.name}</span>
      </div>`;
    }
    if (total > 5) {
      objList.innerHTML += `<div style="font-size:10px; opacity:0.5;">+${total-5} more</div>`;
    }
  }
  
  // Check landmark proximity (prevent getting lost)
  function checkLandmarkProximity() {
    const now = Date.now();
    if (now - lastLandmarkNotify < 8000) return;
    
    const landmark = Objectives.getNearbyLandmark(player.x, player.y, lastZone);
    if (landmark) {
      lastLandmarkNotify = now;
      showMessage(`📍 NEAR: ${landmark.name} — ${landmark.description}`, 3500);
    }
  }
  
  // Entity hint display
  let hintTimeout = null;
  function showEntityHint(hint) {
    hintContent.textContent = '';
    hintPanel.classList.remove('hidden');
    let i = 0;
    const typer = setInterval(() => {
      hintContent.textContent += hint[i++];
      if (i >= hint.length) clearInterval(typer);
    }, 38);
    if (hintTimeout) clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => hintPanel.classList.add('hidden'), 8000);
  }
  
  // Death
  function killPlayer() {
    if (!running) return;
    running = false;
    deathScreen = true;
    AudioEngine.fadeOut();
    deathScreenEl.classList.remove('hidden');
    if (vhsInterval) clearInterval(vhsInterval);
  }
  
  function respawn() {
    deathScreenEl.classList.add('hidden');
    initGame();
  }
  
  // Escape
  function triggerEscape() {
    running = false;
    AudioEngine.fadeOut();
    escapeScreen.classList.remove('hidden');
    if (vhsInterval) clearInterval(vhsInterval);
  }
  
  // VHS clock
  let vhsInterval = null;
  function startVHSClock() {
    if (vhsInterval) clearInterval(vhsInterval);
    let h = 3, m = 17, s = 42;
    vhsInterval = setInterval(() => {
      if (++s >= 60) { s = 0; if (++m >= 60) { m = 0; if (++h >= 24) h = 0; } }
      const pad = n => String(n).padStart(2, '0');
      timestamp.textContent = `REC ● 1995/08/14   ${pad(h)}:${pad(m)}:${pad(s)}`;
    }, 1000);
  }
  
  // Zone label
  let zoneLabelTimeout = null;
  function showZoneLabel(name) {
    if (!name) return;
    zoneLabel.textContent = name;
    zoneLabel.style.opacity = '1';
    if (zoneLabelTimeout) clearTimeout(zoneLabelTimeout);
    zoneLabelTimeout = setTimeout(() => zoneLabel.style.opacity = '0', 3500);
  }
  
  // Movement collision
  function canMove(x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || tx >= MAP_SIZE || ty < 0 || ty >= MAP_SIZE) return false;
    if (worldMap[ty][tx] === CELL.WALL) return false;
    return true;
  }
  
  // Update zone and audio
  function updateZone() {
    const zone = getZone(Math.floor(player.x), Math.floor(player.y));
    if (zone !== lastZone) {
      lastZone = zone;
      showZoneLabel(getZoneName(zone));
      AudioEngine.setZone(zone);
      document.body.className = '';
      document.body.classList.add(`zone-${zone}`);
    }
  }
  
  // Compass
  function updateCompass() {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const idx = Math.round(((player.angle % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI) / (Math.PI/4));
    compass.textContent = dirs[idx % 8];
  }
  
  // Check exit
  function checkExit() {
    const tx = Math.floor(player.x), ty = Math.floor(player.y);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const mx = tx + dx, my = ty + dy;
        if (mx < 0 || mx >= MAP_SIZE || my < 0 || my >= MAP_SIZE) continue;
        if (worldMap[my][mx] === CELL.EXIT && Objectives.isComplete()) {
          const dist = Math.sqrt((player.x - (mx+0.5))**2 + (player.y - (my+0.5))**2);
          if (dist < 1.5) { triggerEscape(); return true; }
        }
      }
    }
    return false;
  }
  
  // Check entity (black figure) proximity
  function checkEntityProximity() {
    for (let sprite of activeSprites) {
      if (sprite.type !== 'entity') continue;
      if (hintShown[sprite.hint]) continue;
      const dist = Math.sqrt((player.x - sprite.x)**2 + (player.y - sprite.y)**2);
      if (dist < 4.5) {
        const angleToEntity = Math.atan2(sprite.y - player.y, sprite.x - player.x);
        const diff = Math.abs(((angleToEntity - player.angle + Math.PI*2) % (Math.PI*2)) - Math.PI);
        if (diff < Math.PI/2.2) {
          showEntityHint(sprite.hint);
          hintShown[sprite.hint] = true;
        }
      }
    }
  }
  
  let hintShown = {};
  const activeSprites = [...SPRITES.map(s => ({...s}))];
  
  // Main update loop
  function update(dt) {
    if (!running) return;
    
    // Rotation
    player.angle += mouseDX * ROT_SPEED;
    mouseDX = 0;
    if (keys['ArrowLeft'] || keys['KeyQ']) player.angle -= ROT_SPEED * 10 * dt;
    if (keys['ArrowRight'] || keys['KeyE']) player.angle += ROT_SPEED * 10 * dt;
    if (joy.right.active) player.angle += joy.right.dx * ROT_SPEED * 14 * dt;
    
    // Movement
    let moveX = 0, moveY = 0;
    const spd = MOVE_SPEED * dt;
    if (keys['KeyW'] || keys['ArrowUp']) { moveX += Math.cos(player.angle) * spd; moveY += Math.sin(player.angle) * spd; }
    if (keys['KeyS'] || keys['ArrowDown']) { moveX -= Math.cos(player.angle) * spd; moveY -= Math.sin(player.angle) * spd; }
    if (keys['KeyA']) { moveX += Math.cos(player.angle - Math.PI/2) * spd; moveY += Math.sin(player.angle - Math.PI/2) * spd; }
    if (keys['KeyD']) { moveX += Math.cos(player.angle + Math.PI/2) * spd; moveY += Math.sin(player.angle + Math.PI/2) * spd; }
    
    if (joy.left.active) {
      const fwd = -joy.left.dy, strafe = joy.left.dx;
      moveX += (Math.cos(player.angle) * fwd + Math.cos(player.angle + Math.PI/2) * strafe) * spd * 1.5;
      moveY += (Math.sin(player.angle) * fwd + Math.sin(player.angle + Math.PI/2) * strafe) * spd * 1.5;
    }
    
    const nx = player.x + moveX, ny = player.y + moveY;
    if (canMove(nx, player.y)) player.x = nx;
    if (canMove(player.x, ny)) player.y = ny;
    
    // Update zone and audio
    updateZone();
    updateCompass();
    
    // Check collectibles
    Objectives.checkCollect(player.x, player.y, lastZone);
    updateObjectivesUI();
    
    // Check landmarks (prevents getting lost)
    checkLandmarkProximity();
    
    // Update monster
    const dead = Monster.update(player.x, player.y, lastZone);
    if (dead) killPlayer();
    
    // Proximity warning (heartbeat effect)
    const proximity = Monster.getProximity();
    if (proximity > 0.15 && lastZone === 'backrooms') {
      proximityWarning.classList.remove('hidden');
      const intensity = Math.min(1, proximity * 1.5);
      proximityWarning.style.animation = `heartbeat ${0.3 / intensity}s infinite`;
    } else {
      proximityWarning.classList.add('hidden');
    }
    
    // Check exit (only if all fragments collected)
    checkExit();
    checkEntityProximity();
  }
  
  // Game loop
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastRenderTime) / 16.67, 3);
    lastRenderTime = ts;
    update(dt);
    
    // Get monster position for minimap
    const monsterPos = Monster.getPosition();
    Renderer.render(player, activeSprites, Monster.getProximity(), lastZone);
    Minimap.render(player.x, player.y, player.angle, lastZone, monsterPos, Monster.getProximity(), Objectives.getFragments());
    
    requestAnimationFrame(loop);
  }
  
  // Initialize game
  function initGame() {
    player = { x: 5.5, y: 15.5, angle: 0 };
    keys = {};
    mouseDX = 0;
    running = true;
    deathScreen = false;
    hintShown = {};
    lastZone = null;
    lastLandmarkNotify = 0;
    
    Objectives.reset();
    Monster.reset(12, 12);
    updateObjectivesUI();
    
    hintPanel.classList.add('hidden');
    escapeScreen.classList.add('hidden');
    deathScreenEl.classList.add('hidden');
    msgBox.classList.add('hidden');
    proximityWarning.classList.add('hidden');
    
    Renderer.init(canvas, RENDER_SCALE);
    Minimap.init();
    startVHSClock();
    AudioEngine.init();
    AudioEngine.setZone('backrooms');
    
    lastRenderTime = performance.now();
    requestAnimationFrame(loop);
    
    // Welcome message
    setTimeout(() => {
      showMessage('✦ COLLECT ALL 9 MEMORY FRAGMENTS ✦\nThe monster is here. It can smell you.', 5000);
    }, 1000);
  }
  
  // Event listeners
  startBtn.addEventListener('click', () => {
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initGame();
    if (!isMobile) canvas.requestPointerLock();
  });
  
  restartBtn.addEventListener('click', () => {
    escapeScreen.classList.add('hidden');
    initGame();
    if (!isMobile) canvas.requestPointerLock();
  });
  
  respawnBtn.addEventListener('click', () => {
    deathScreenEl.classList.add('hidden');
    initGame();
    if (!isMobile) canvas.requestPointerLock();
  });
  
  canvas.addEventListener('click', () => {
    if (running && !isMobile) canvas.requestPointerLock();
  });
  
  // Keyboard
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  
  // Mouse look
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) mouseDX += e.movementX;
  });
  
  // Touch joysticks
  function getBaseCenter(side) {
    const el = document.getElementById(`joystick-${side}`);
    const base = el.querySelector('.joystick-base');
    const rect = base.getBoundingClientRect();
    return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  }
  
  function onTouchStart(e) {
    e.preventDefault();
    for (let touch of e.changedTouches) {
      const side = touch.clientX < window.innerWidth/2 ? 'left' : 'right';
      const j = joy[side];
      if (!j.active) {
        j.active = true;
        const center = getBaseCenter(side);
        j.baseX = center.x;
        j.baseY = center.y;
        j.dx = 0;
        j.dy = 0;
      }
    }
  }
  
  function onTouchMove(e) {
    e.preventDefault();
    for (let touch of e.changedTouches) {
      for (let side of ['left', 'right']) {
        const j = joy[side];
        if (!j.active) continue;
        const rdx = touch.clientX - j.baseX;
        const rdy = touch.clientY - j.baseY;
        const dist = Math.min(Math.hypot(rdx, rdy), JOY_RADIUS);
        const angle = Math.atan2(rdy, rdx);
        j.dx = Math.cos(angle) * dist / JOY_RADIUS;
        j.dy = Math.sin(angle) * dist / JOY_RADIUS;
        const knob = document.getElementById(`knob-${side}`);
        knob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`;
      }
    }
  }
  
  function onTouchEnd(e) {
    e.preventDefault();
    for (let side of ['left', 'right']) {
      if (joy[side].active) {
        joy[side].active = false;
        joy[side].dx = 0;
        joy[side].dy = 0;
        const knob = document.getElementById(`knob-${side}`);
        knob.style.transform = 'translate(-50%, -50%)';
      }
    }
  }
  
  gameScreen.addEventListener('touchstart', onTouchStart, { passive: false });
  gameScreen.addEventListener('touchmove', onTouchMove, { passive: false });
  gameScreen.addEventListener('touchend', onTouchEnd);
  gameScreen.addEventListener('touchcancel', onTouchEnd);
  
  return {};
})();