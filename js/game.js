// game.js — Player controller, game loop, joysticks, interactions

const Game = (() => {
  const MOVE_SPEED    = 0.055;
  const ROT_SPEED     = 0.002;
  const PLAYER_RADIUS = 0.25;

  const isMobile = ('ontouchstart' in window)||(navigator.maxTouchPoints>0);
  const RENDER_SCALE = isMobile ? 0.45 : 0.75;

  let player = { x:0, y:0, angle:0 };
  let keys = {};
  let mouseDX = 0;
  let running = false;
  let lastZone = null;
  let hintShown = {};   // per-entity, keyed by hint text
  let messageTimeout = null;
  let vhsInterval = null;
  let lastRenderTime = 0;
  let firstMove = true;

  const joy = {
    left:  { active:false, id:-1, baseX:0, baseY:0, dx:0, dy:0 },
    right: { active:false, id:-1, baseX:0, baseY:0, dx:0, dy:0 },
  };
  const JOY_RADIUS = 38;

  const activeSprites = [...SPRITES.map(s=>({...s}))];

  // ── DOM refs ───────────────────────────────────────────────
  const titleScreen  = document.getElementById('title-screen');
  const gameScreen   = document.getElementById('game-screen');
  const canvas       = document.getElementById('gameCanvas');
  const startBtn     = document.getElementById('start-btn');
  const restartBtn   = document.getElementById('restart-btn');
  const zoneLabel    = document.getElementById('zone-label');
  const msgBox       = document.getElementById('message-box');
  const msgText      = document.getElementById('message-text');
  const hintPanel    = document.getElementById('hint-panel');
  const hintContent  = document.getElementById('hint-content');
  const escapeScreen = document.getElementById('escape-screen');
  const compass      = document.getElementById('compass');
  const timestamp    = document.getElementById('vhs-timestamp');
  const knobLeft     = document.getElementById('knob-left');
  const knobRight    = document.getElementById('knob-right');
  const joyLeftEl    = document.getElementById('joystick-left');
  const joyRightEl   = document.getElementById('joystick-right');

  if (isMobile) {
    joyLeftEl.style.display='flex';
    joyRightEl.style.display='flex';
  }

  const controlsHint = document.getElementById('controls-hint');
  if (controlsHint) {
    controlsHint.textContent = isMobile
      ? 'Left stick — Move  |  Right stick — Look'
      : 'WASD / Arrows — Move  |  Mouse — Look  |  Click to lock cursor';
  }

  // Android back button trap
  window.addEventListener('popstate', e=>{ e.preventDefault(); history.pushState(null,'',window.location.href); });
  history.pushState(null,'',window.location.href);

  // ── Start ──────────────────────────────────────────────────
  startBtn.addEventListener('click', ()=>{
    titleScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    AudioEngine.init();
    initGame();
    if (!isMobile) canvas.requestPointerLock();
  });

  restartBtn.addEventListener('click', ()=>{
    escapeScreen.classList.add('hidden');
    initGame();
    if (!isMobile) canvas.requestPointerLock();
  });

  canvas.addEventListener('click', ()=>{
    if (running && !isMobile) canvas.requestPointerLock();
  });

  function initGame() {
    player   = { ...PLAYER_START };
    keys     = {};
    mouseDX  = 0;
    hintShown = {};
    lastZone = null;
    running  = true;
    firstMove= true;

    hintPanel.classList.add('hidden');
    escapeScreen.classList.add('hidden');
    msgBox.classList.add('hidden');

    Renderer.init(canvas, RENDER_SCALE);
    startVHSClock();
    lastRenderTime = performance.now();
    requestAnimationFrame(loop);
  }

  // ── Keyboard ───────────────────────────────────────────────
  document.addEventListener('keydown', e=>{ keys[e.code]=true; });
  document.addEventListener('keyup',   e=>{ keys[e.code]=false; });

  // ── Mouse ──────────────────────────────────────────────────
  document.addEventListener('mousemove', e=>{
    if (document.pointerLockElement===canvas) mouseDX+=e.movementX;
  });

  // ── Touch / Joystick ──────────────────────────────────────
  function getBaseCenter(side) {
    const el = side==='left' ? joyLeftEl : joyRightEl;
    const base = el.querySelector('.joystick-base');
    const rect = base.getBoundingClientRect();
    return { x:rect.left+rect.width/2, y:rect.top+rect.height/2 };
  }

  function onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      const side = touch.clientX<window.innerWidth/2 ? 'left' : 'right';
      const j = joy[side];
      if (!j.active) {
        j.active=true; j.id=touch.identifier;
        const c=getBaseCenter(side);
        j.baseX=c.x; j.baseY=c.y; j.dx=0; j.dy=0;
      }
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      for (const side of ['left','right']) {
        const j=joy[side];
        if (!j.active||j.id!==touch.identifier) continue;
        const rdx=touch.clientX-j.baseX, rdy=touch.clientY-j.baseY;
        const dist=Math.sqrt(rdx*rdx+rdy*rdy);
        const clamped=Math.min(dist,JOY_RADIUS);
        const angle=Math.atan2(rdy,rdx);
        j.dx=Math.cos(angle)*clamped/JOY_RADIUS;
        j.dy=Math.sin(angle)*clamped/JOY_RADIUS;
        const knob=side==='left'?knobLeft:knobRight;
        knob.style.transform=`translate(calc(-50% + ${Math.cos(angle)*clamped}px),calc(-50% + ${Math.sin(angle)*clamped}px))`;
      }
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches)
      for (const side of ['left','right'])
        if (joy[side].active && joy[side].id===touch.identifier) resetJoy(side);
  }

  function resetJoy(side) {
    joy[side].active=false; joy[side].id=-1; joy[side].dx=0; joy[side].dy=0;
    const knob=side==='left'?knobLeft:knobRight;
    knob.style.transform='translate(-50%,-50%)';
  }

  gameScreen.addEventListener('touchstart',  onTouchStart,  {passive:false});
  gameScreen.addEventListener('touchmove',   onTouchMove,   {passive:false});
  gameScreen.addEventListener('touchend',    onTouchEnd,    {passive:false});
  gameScreen.addEventListener('touchcancel', ()=>{ resetJoy('left'); resetJoy('right'); }, {passive:false});

  // ── Game loop ──────────────────────────────────────────────
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts-lastRenderTime)/16.67, 3);
    lastRenderTime = ts;
    update(dt);
    Renderer.render(player, activeSprites);
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // Rotation
    player.angle += mouseDX * ROT_SPEED;
    mouseDX = 0;
    if (keys['ArrowLeft']||keys['KeyQ'])  player.angle -= ROT_SPEED*10*dt;
    if (keys['ArrowRight']||keys['KeyE']) player.angle += ROT_SPEED*10*dt;
    if (joy.right.active) player.angle += joy.right.dx*ROT_SPEED*14*dt;

    // Movement
    let moveX=0, moveY=0;
    const spd=MOVE_SPEED*dt;
    if (keys['KeyW']||keys['ArrowUp'])   { moveX+=Math.cos(player.angle)*spd; moveY+=Math.sin(player.angle)*spd; }
    if (keys['KeyS']||keys['ArrowDown']) { moveX-=Math.cos(player.angle)*spd; moveY-=Math.sin(player.angle)*spd; }
    if (keys['KeyA'])                     { moveX+=Math.cos(player.angle-Math.PI/2)*spd; moveY+=Math.sin(player.angle-Math.PI/2)*spd; }
    if (keys['KeyD'])                     { moveX+=Math.cos(player.angle+Math.PI/2)*spd; moveY+=Math.sin(player.angle+Math.PI/2)*spd; }

    if (joy.left.active) {
      const fwd=-joy.left.dy, strafe=joy.left.dx;
      moveX+=(Math.cos(player.angle)*fwd+Math.cos(player.angle+Math.PI/2)*strafe)*spd*1.5;
      moveY+=(Math.sin(player.angle)*fwd+Math.sin(player.angle+Math.PI/2)*strafe)*spd*1.5;
    }

    const nx=player.x+moveX, ny=player.y+moveY;
    if (canMove(nx,player.y)) player.x=nx;
    if (canMove(player.x,ny)) player.y=ny;

    checkExit();
    checkEntityProximity();
    updateZone();
    updateCompass();

    if (firstMove && (moveX!==0||moveY!==0)) {
      firstMove=false;
      setTimeout(()=>showMessage('you clipped out of something. find the exit.', 5000), 800);
    }
  }

  function canMove(x, y) {
    const r=PLAYER_RADIUS;
    for (const [cx,cy] of [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]]) {
      const tx=Math.floor(cx), ty=Math.floor(cy);
      if (tx<0||tx>=MAP_SIZE||ty<0||ty>=MAP_SIZE) return false;
      // WALL blocks. DOOR and EXIT are passable.
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
        const dist=Math.sqrt((player.x-(mx+0.5))**2+(player.y-(my+0.5))**2);
        if (dist<1.5) { triggerEscape(); return; }
      }
    }
  }

  function checkEntityProximity() {
    for (const sprite of activeSprites) {
      if (sprite.type!=='entity') continue;
      if (hintShown[sprite.hint]) continue;
      const dist=Math.sqrt((player.x-sprite.x)**2+(player.y-sprite.y)**2);
      if (dist<4.5) {
        const a2e=Math.atan2(sprite.y-player.y,sprite.x-player.x);
        const diff=Math.abs(normalizeAngle(a2e-player.angle));
        if (diff<Math.PI/2.2) {
          showEntityHint(sprite.hint);
          hintShown[sprite.hint]=true;
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
    const zone=getZone(Math.floor(player.x),Math.floor(player.y));
    if (zone!==lastZone) {
      lastZone=zone;
      showZoneLabel(getZoneName(zone));
      AudioEngine.setZone(zone);
    }
  }

  function updateCompass() {
    const dirs=['N','NE','E','SE','S','SW','W','NW'];
    const idx=Math.round(((player.angle%(2*Math.PI)+2*Math.PI)%(2*Math.PI))/(Math.PI/4));
    compass.textContent=dirs[idx%8];
  }

  let zoneLabelTimeout=null;
  function showZoneLabel(name) {
    if (!name) return;
    zoneLabel.textContent=name;
    zoneLabel.style.opacity='1';
    if (zoneLabelTimeout) clearTimeout(zoneLabelTimeout);
    zoneLabelTimeout=setTimeout(()=>{ zoneLabel.style.opacity='0'; },3500);
  }

  function showMessage(text, duration=4000) {
    if (messageTimeout) clearTimeout(messageTimeout);
    msgText.textContent=text;
    msgBox.classList.remove('hidden');
    messageTimeout=setTimeout(()=>msgBox.classList.add('hidden'),duration);
  }

  function showEntityHint(hint) {
    hintContent.textContent='';
    hintPanel.classList.remove('hidden');
    let i=0;
    const typer=setInterval(()=>{
      hintContent.textContent+=hint[i++];
      if (i>=hint.length) clearInterval(typer);
    },38);
    showMessage('— something watches —',3000);
  }

  function startVHSClock() {
    if (vhsInterval) clearInterval(vhsInterval);
    let h=3,m=17,s=42;
    vhsInterval=setInterval(()=>{
      if(++s>=60){s=0;if(++m>=60){m=0;if(++h>=24)h=0;}}
      const pad=n=>String(n).padStart(2,'0');
      timestamp.textContent=`REC ● 1995/08/14   ${pad(h)}:${pad(m)}:${pad(s)}`;
    },1000);
  }

  function triggerEscape() {
    running=false;
    AudioEngine.fadeOut();
    document.exitPointerLock();
    if (vhsInterval) clearInterval(vhsInterval);
    resetJoy('left'); resetJoy('right');
    setTimeout(()=>escapeScreen.classList.remove('hidden'),600);
  }

  return {};
})();
