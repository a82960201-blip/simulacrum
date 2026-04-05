// game.js — Player controller, game loop, joysticks, orientation lock

const Game = (() => {
  const MOVE_SPEED    = 0.055;
  const ROT_SPEED     = 0.002;
  const PLAYER_RADIUS = 0.25;

  const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const RENDER_SCALE = isMobile ? 0.45 : 0.75;

  let player = { x: 0, y: 0, angle: 0 };
  let keys = {};
  let mouseDX = 0;
  let running = false;
  let lastZone = null;
  let hintShown = false;
  let messageTimeout = null;
  let vhsInterval = null;
  let lastRenderTime = 0;
  let firstMove = true;

  // Joystick state
  const joy = {
    left:  { active:false, id:-1, baseX:0, baseY:0, dx:0, dy:0 },
    right: { active:false, id:-1, baseX:0, baseY:0, dx:0, dy:0 },
  };
  const JOY_RADIUS = 42;

  const activeSprites = [...SPRITES.map(s => ({ ...s }))];

  // ── DOM refs ──────────────────────────────────────────────────
  const titleScreen   = document.getElementById('title-screen');
  const gameScreen    = document.getElementById('game-screen');
  const canvas        = document.getElementById('gameCanvas');
  const startBtn      = document.getElementById('start-btn');
  const restartBtn    = document.getElementById('restart-btn');
  const zoneLabel     = document.getElementById('zone-label');
  const msgBox        = document.getElementById('message-box');
  const msgText       = document.getElementById('message-text');
  const hintPanel     = document.getElementById('hint-panel');
  const hintContent   = document.getElementById('hint-content');
  const escapeScreen  = document.getElementById('escape-screen');
  const compass       = document.getElementById('compass');
  const timestamp     = document.getElementById('vhs-timestamp');
  const knobLeft      = document.getElementById('knob-left');
  const knobRight     = document.getElementById('knob-right');
  const joyLeftEl     = document.getElementById('joystick-left');
  const joyRightEl    = document.getElementById('joystick-right');
  const rotatePrompt  = document.getElementById('rotate-prompt');

  // ── Orientation lock / rotate prompt ─────────────────────────
  function lockLandscape() {
    if (!isMobile) return;
    // Try Screen Orientation API (modern)
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
    // Try legacy webkit
    if (screen.lockOrientation) screen.lockOrientation('landscape');
    if (screen.mozLockOrientation) screen.mozLockOrientation('landscape');
  }

  function checkOrientation() {
    if (!isMobile) return;
    const isPortrait = window.innerHeight > window.innerWidth;
    if (rotatePrompt) rotatePrompt.classList.toggle('hidden', !isPortrait);
    if (gameScreen && !gameScreen.classList.contains('hidden')) {
      canvas.style.display = isPortrait ? 'none' : 'block';
    }
  }

  window.addEventListener('resize', checkOrientation);
  window.addEventListener('orientationchange', checkOrientation);

  if (isMobile) {
    joyLeftEl.style.display  = 'flex';
    joyRightEl.style.display = 'flex';
  }

  // ── Start ─────────────────────────────────────────────────────
  startBtn.addEventListener('click', () => {
    lockLandscape();
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    AudioEngine.init();
    initGame();
    checkOrientation();
    if (!isMobile) canvas.requestPointerLock();
  });

  restartBtn.addEventListener('click', () => {
    escapeScreen.classList.add('hidden');
    initGame();
    if (!isMobile) canvas.requestPointerLock();
  });

  canvas.addEventListener('click', () => {
    if (running && !isMobile) canvas.requestPointerLock();
  });

  function initGame() {
    player = { ...PLAYER_START };
    keys = {};
    mouseDX = 0;
    hintShown = false;
    lastZone = null;
    running = true;
    firstMove = true;

    hintPanel.classList.add('hidden');
    escapeScreen.classList.add('hidden');
    msgBox.classList.add('hidden');

    Renderer.init(canvas, RENDER_SCALE);
    startVHSClock();
    lastRenderTime = performance.now();
    requestAnimationFrame(loop);
  }

  // ── Keyboard ──────────────────────────────────────────────────
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup',   e => { keys[e.code] = false; });

  // ── Mouse ─────────────────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement === canvas) mouseDX += e.movementX;
  });

  // ── Touch joysticks ───────────────────────────────────────────
  function getBaseCenter(side) {
    const el = side === 'left' ? joyLeftEl : joyRightEl;
    const rect = el.querySelector('.joystick-base').getBoundingClientRect();
    return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  }

  function onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const side = touch.clientX < window.innerWidth/2 ? 'left' : 'right';
      const j = joy[side];
      if (!j.active) {
        j.active = true; j.id = touch.identifier;
        const c = getBaseCenter(side);
        j.baseX = c.x; j.baseY = c.y;
        j.dx = 0; j.dy = 0;
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      for (const side of ['left','right']) {
        const j = joy[side];
        if (!j.active || j.id !== touch.identifier) continue;
        const rawDX = touch.clientX - j.baseX;
        const rawDY = touch.clientY - j.baseY;
        const dist  = Math.sqrt(rawDX*rawDX + rawDY*rawDY);
        const clamp = Math.min(dist, JOY_RADIUS);
        const angle = Math.atan2(rawDY, rawDX);
        j.dx = Math.cos(angle) * clamp / JOY_RADIUS;
        j.dy = Math.sin(angle) * clamp / JOY_RADIUS;
        const knob = side==='left' ? knobLeft : knobRight;
        knob.style.transform = `translate(calc(-50% + ${Math.cos(angle)*clamp}px), calc(-50% + ${Math.sin(angle)*clamp}px))`;
      }
    }
  }

  function resetJoy(side) {
    joy[side].active=false; joy[side].id=-1; joy[side].dx=0; joy[side].dy=0;
    const k = side==='left' ? knobLeft : knobRight;
    k.style.transform = 'translate(-50%,-50%)';
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches)
      for (const side of ['left','right'])
        if (joy[side].active && joy[side].id===touch.identifier) resetJoy(side);
  }

  gameScreen.addEventListener('touchstart',  onTouchStart,  { passive:false });
  gameScreen.addEventListener('touchmove',   onTouchMove,   { passive:false });
  gameScreen.addEventListener('touchend',    onTouchEnd,    { passive:false });
  gameScreen.addEventListener('touchcancel', () => { resetJoy('left'); resetJoy('right'); }, { passive:false });

  // ── Game loop ─────────────────────────────────────────────────
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastRenderTime) / 16.67, 3);
    lastRenderTime = ts;
    update(dt);
    Renderer.render(player, activeSprites);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Rotation
    player.angle += mouseDX * ROT_SPEED;
    mouseDX = 0;
    if (keys['ArrowLeft']  || keys['KeyQ']) player.angle -= ROT_SPEED*10*dt;
    if (keys['ArrowRight'] || keys['KeyE']) player.angle += ROT_SPEED*10*dt;
    if (joy.right.active) player.angle += joy.right.dx * ROT_SPEED * 14 * dt;

    // Movement
    let mx = 0, my = 0;
    const spd = MOVE_SPEED * dt;
    if (keys['KeyW']||keys['ArrowUp'])   { mx+=Math.cos(player.angle)*spd; my+=Math.sin(player.angle)*spd; }
    if (keys['KeyS']||keys['ArrowDown']) { mx-=Math.cos(player.angle)*spd; my-=Math.sin(player.angle)*spd; }
    if (keys['KeyA']) { mx+=Math.cos(player.angle-Math.PI/2)*spd; my+=Math.sin(player.angle-Math.PI/2)*spd; }
    if (keys['KeyD']) { mx+=Math.cos(player.angle+Math.PI/2)*spd; my+=Math.sin(player.angle+Math.PI/2)*spd; }
    if (joy.left.active) {
      const fwd=-joy.left.dy, str=joy.left.dx;
      mx += (Math.cos(player.angle)*fwd + Math.cos(player.angle+Math.PI/2)*str)*spd*1.5;
      my += (Math.sin(player.angle)*fwd + Math.sin(player.angle+Math.PI/2)*str)*spd*1.5;
    }

    const nx = player.x+mx, ny = player.y+my;
    if (canMove(nx, player.y)) player.x = nx;
    if (canMove(player.x, ny)) player.y = ny;

    checkExit();
    checkEntityProximity();
    updateZone();
    updateCompass();

    if (firstMove && (mx!==0||my!==0)) {
      firstMove = false;
      setTimeout(() => showMessage('you clipped out of bounds. find the exit.', 5000), 800);
    }
  }

  function canMove(x, y) {
    const r = PLAYER_RADIUS;
    for (const [cx,cy] of [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]]) {
      const tx=Math.floor(cx), ty=Math.floor(cy);
      if (tx<0||tx>=MAP_SIZE||ty<0||ty>=MAP_SIZE) return false;
      if (worldMap[ty][tx]===CELL.WALL) return false;
    }
    return true;
  }

  function checkExit() {
    const tx=Math.floor(player.x), ty=Math.floor(player.y);
    for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
      const mx=tx+dx, my=ty+dy;
      if (mx<0||mx>=MAP_SIZE||my<0||my>=MAP_SIZE) continue;
      if (worldMap[my][mx]===CELL.EXIT) {
        const d=Math.sqrt((player.x-(mx+0.5))**2+(player.y-(my+0.5))**2);
        if (d<1.2) { triggerEscape(); return; }
      }
    }
  }

  function checkEntityProximity() {
    if (hintShown) return;
    for (const s of activeSprites) {
      if (s.type!=='entity') continue;
      const d=Math.sqrt((player.x-s.x)**2+(player.y-s.y)**2);
      if (d<4.5) {
        const a2e=Math.atan2(s.y-player.y,s.x-player.x);
        if (Math.abs(normalizeAngle(a2e-player.angle))<Math.PI/2.5) {
          showEntityHint(s.hint); hintShown=true;
        }
      }
    }
  }

  function normalizeAngle(a) {
    while(a>Math.PI)  a-=2*Math.PI;
    while(a<-Math.PI) a+=2*Math.PI;
    return a;
  }

  function updateZone() {
    const zone = getZone(Math.floor(player.x), Math.floor(player.y));
    if (zone!==lastZone) {
      lastZone=zone;
      showZoneLabel(getZoneName(zone));
      AudioEngine.setVolume(zone===ZONE.VOID?0.5:zone===ZONE.DREAM||zone===ZONE.POOL?1.2:1.0);
    }
  }

  function updateCompass() {
    const dirs=['N','NE','E','SE','S','SW','W','NW'];
    const idx=Math.round(((player.angle%(2*Math.PI)+2*Math.PI)%(2*Math.PI))/(Math.PI/4));
    compass.textContent=dirs[idx%8];
  }

  let zoneLabelTO=null;
  function showZoneLabel(name) {
    zoneLabel.textContent=name; zoneLabel.style.opacity='1';
    if (zoneLabelTO) clearTimeout(zoneLabelTO);
    zoneLabelTO=setTimeout(()=>{ zoneLabel.style.opacity='0'; },3200);
  }

  function showMessage(text, dur=4000) {
    if (messageTimeout) clearTimeout(messageTimeout);
    msgText.textContent=text; msgBox.classList.remove('hidden');
    messageTimeout=setTimeout(()=>msgBox.classList.add('hidden'),dur);
  }

  function showEntityHint(hint) {
    hintContent.textContent=''; hintPanel.classList.remove('hidden');
    let i=0;
    const t=setInterval(()=>{ hintContent.textContent+=hint[i++]; if(i>=hint.length) clearInterval(t); },40);
    showMessage('— something watches from the dark —',3000);
  }

  function startVHSClock() {
    if (vhsInterval) clearInterval(vhsInterval);
    let h=3,m=17,s=42;
    vhsInterval=setInterval(()=>{
      if(++s>=60){s=0;if(++m>=60){m=0;if(++h>=24)h=0;}}
      const p=n=>String(n).padStart(2,'0');
      timestamp.textContent=`REC ● 1995/08/14   ${p(h)}:${p(m)}:${p(s)}`;
    },1000);
  }

  function triggerEscape() {
    running=false; AudioEngine.fadeOut(); document.exitPointerLock();
    if(vhsInterval) clearInterval(vhsInterval);
    resetJoy('left'); resetJoy('right');
    setTimeout(()=>escapeScreen.classList.remove('hidden'),500);
  }

  // Run orientation check on load
  setTimeout(checkOrientation, 100);

  return {};
})();
