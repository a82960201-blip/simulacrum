// ============================================================
//  GAME.JS — Main loop, camera, world render, orb collection
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── Zoom ──
// Mobile gets a wider view (less zoom-in); desktop stays 1:1
function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}
let ZOOM = 1;
function updateZoom() {
  ZOOM = isMobile() ? 0.60 : 1.0;
}
updateZoom();

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  updateZoom();
}
resize();
window.addEventListener('resize', resize);

// Helpers: logical (game) dimensions after zoom
function logicalW() { return canvas.width  / ZOOM; }
function logicalH() { return canvas.height / ZOOM; }

// ── Camera ──
const cam = {
  x: 0, y: 0,
  snapTo(p) {
    const W = logicalW(), H = logicalH();
    this.x = p.x + p.baseW/2 - W/2;
    this.y = p.y + p.baseH/2 - H/2.4;
  },
  update(p) {
    const W = logicalW(), H = logicalH();
    const tx = p.x + p.baseW/2 - W/2;
    const ty = p.y + p.baseH/2 - H/2.4;
    this.x += (tx - this.x) * 0.10;
    this.y += (ty - this.y) * 0.10;
  }
};

// ── Singletons ──
const player   = new Player(150, 460);
const fx       = new ParticleSystem();
const wind     = new WindLines();
const controls = new Controls();

let prevVy    = 0;
let wasGround = false;

// ── Persistent lifetime stats — NEVER reset on death ──────
const STATS = {
  totalMomentum: 0,       // continuous ever-increasing counter
  peakMomentum:  0,       // highest single momentum value reached
  highestJump:   0,       // highest apex reached (px above takeoff)
  slugsKilled:   0,       // lifetime stomp count (mirrors slugKillCount)
  _jumpOriginY:  null,    // internal: Y when jump was initiated
};

const springCooldowns = new Map();
function getSpringCd(s) {
  if (!springCooldowns.has(s)) springCooldowns.set(s, 0);
  return springCooldowns.get(s);
}

// Called by Player.respawn() after a full world reset
function onWorldReset() {
  springCooldowns.clear();
  slugPool.length = 0;

  // FIX: Reset player to starting position
  player.x = 150;
  player.y = 460;
  player.vx = 0;
  player.vy = 0;
  // (Other player state like dead, momentum, etc. should be handled in Player.respawn)

  cam.snapTo(player);
}

// ── Orb collection ──
function checkOrbs() {
  const pw = player.baseW, ph = player.baseH;
  for (const orb of WORLD.orbs) {
    if (orb.collected) continue;
    const dx = (player.x + pw/2) - orb.x;
    const dy = (player.y + ph/2) - orb.y;
    if (Math.sqrt(dx*dx + dy*dy) < orb.r + pw/2 - 4) {
      orb.collected = true;
      const c = Theme.get();
      if (orb.powerUp === 'dash') {
        player.dashCharges++;
        showPickupMsg('DASH x' + player.dashCharges);
        SFX.powerup();
      } else if (orb.powerUp === 'doublejump') {
        player.doubleJumpCharges++;
        player.usedDoubleJump = false;
        showPickupMsg('x2 JUMP x' + player.doubleJumpCharges);
        SFX.powerup();
      } else {
        Theme.switchTo(orb.themeIdx, orb.isMulti);
        showPickupMsg(orb.isMulti ? '* MULTICOLOR *' : NEON_PALETTES[orb.themeIdx].name.toUpperCase());
        const p = orb.isMulti ? {r:255,g:0,b:255} : NEON_PALETTES[orb.themeIdx];
        fx.orbCollect(orb.x, orb.y, p.r, p.g, p.b);
        triggerFlash();
        SFX.colorChange();
      }
      fx.orbCollect(orb.x, orb.y, c.r, c.g, c.b);
      triggerShake(5);
    }
  }
}

// ── Flash / Shake / Pickup msg ──
let flashAlpha = 0;
function triggerFlash() { flashAlpha = 0.5; }

let pickupMsg = '', pickupTimer = 0;
function showPickupMsg(msg) { pickupMsg = msg; pickupTimer = 90; }

let shakeTimer = 0, shakeAmt = 0;
function triggerShake(amt) { shakeTimer = 10; shakeAmt = amt; }

let bestX = 0;

// ── Background ──
function drawBackground() {
  const c = Theme.get();
  const W = logicalW(), H = logicalH();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  for (const f of WORLD.bgFragments) {
    const sx = f.x - cam.x, sy = f.y - cam.y;
    if (sx < -200 || sx > W+200 || sy < -100 || sy > H+100) continue;
    ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + f.alpha + ')';
    ctx.fillRect(sx, sy, f.w, f.h);
  }

  ctx.strokeStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.035)';
  ctx.lineWidth = 0.5;
  const gs = 80;
  const offX = ((cam.x % gs) + gs) % gs;
  const offY = ((cam.y % gs) + gs) % gs;
  for (let x = -offX; x < W + gs; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = -offY; y < H + gs; y += gs) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

// ── Platforms (always flat — rise=0) ──
function drawPlatforms() {
  const c = Theme.get();
  const W = logicalW(), H = logicalH();
  for (const p of WORLD.platforms) {
    const sx = p.x - cam.x;
    const sy = p.y - cam.y;
    if (sx > W + 120 || sx + p.w < -120) continue;
    if (sy > H + 100 || sy + p.h < -100) continue;

    ctx.save();
    ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.055)';
    ctx.fillRect(sx, sy, p.w, p.h);

    ctx.strokeStyle = c.primary;
    ctx.lineWidth   = 2.2;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur  = 10;
    ctx.strokeRect(sx + 1, sy + 1, p.w - 2, p.h - 2);
    ctx.shadowBlur  = 0;

    // top surface highlight
    ctx.strokeStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.55)';
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = c.glow; ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + 1);
    ctx.lineTo(sx + p.w - 4, sy + 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ── Springs ──
function drawSprings() {
  const c = Theme.get();
  for (const s of WORLD.springs) {
    const sx = s.x - cam.x, sy = s.y - cam.y;
    if (sx < -100 || sx > canvas.width + 100) continue;
    const cd = getSpringCd(s);
    const scaleY = cd > 0 ? 0.5 + (cd / 40) * 0.5 : 1;
    const padH = 18;
    ctx.save();
    ctx.translate(sx, sy - padH * scaleY);
    ctx.scale(1, scaleY);
    ctx.fillStyle   = cd > 0
      ? 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.55)'
      : 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.30)';
    ctx.strokeStyle = c.primary;
    ctx.lineWidth   = 2;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur  = cd > 0 ? 24 : 14;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',0.18)';
    ctx.beginPath(); ctx.ellipse(-4, -3, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ── HUD ──
function updateHUD() {
  const c = Theme.get();
  document.documentElement.style.setProperty('--neon', c.primary);
  document.documentElement.style.setProperty('--neon-glow', c.primary);

  const dashBtn = document.getElementById('dashBtn');
  if (dashBtn) {
    dashBtn.style.display = player.dashCharges > 0 ? 'flex' : 'none';
    const badge = document.getElementById('dashCount');
    if (badge) badge.textContent = player.dashCharges > 1 ? 'x' + player.dashCharges : '';
  }
  const jumpBtn = document.getElementById('jumpBtn');
  if (jumpBtn) {
    const inAir = !player.onGround;
    const hasDJ = player.doubleJumpCharges > 0 && !player.usedDoubleJump;
    const icon  = document.getElementById('jumpIcon');
    const lbl   = document.getElementById('jumpLabel');
    if (icon) icon.textContent = (inAir && hasDJ) ? 'x2' : 'UP';
    if (lbl)  lbl.textContent  = (inAir && hasDJ) ? 'D-JUMP' : 'JUMP';
    jumpBtn.classList.toggle('doubleJump', inAir && hasDJ);
  }
}

function drawOverlays() {
  const c = Theme.get();
  const W = logicalW(), H = logicalH();

  // Overlays are drawn after the main ctx.restore(), so we re-apply zoom here
  ctx.save();
  ctx.scale(ZOOM, ZOOM);

  if (flashAlpha > 0) {
    ctx.save(); ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = c.primary;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    flashAlpha -= 0.04;
  }

  if (pickupTimer > 0) {
    pickupTimer--;
    const alpha = pickupTimer > 20 ? 1 : pickupTimer / 20;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = '900 14px "Courier New",monospace';
    ctx.fillStyle = c.primary; ctx.shadowColor = c.glow; ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillText(pickupMsg, W/2, H/2 - 60);
    ctx.restore();
  }

  if (player.dead) {
    const t = player.deadTimer / 80;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(t * 2, 0.75) + ')';
    ctx.fillRect(0, 0, W, H);
    if (t > 0.3) {
      ctx.globalAlpha = Math.min((t - 0.3) * 3, 1);
      ctx.font = 'bold 16px "Courier New"';
      ctx.fillStyle = c.primary; ctx.shadowColor = c.glow; ctx.shadowBlur = 20;
      ctx.textAlign = 'center';
      ctx.fillText('REFORMING...', W/2, H/2);
    }
    ctx.restore();
  }

  const dist = Math.max(0, Math.floor(player.x / 100));
  if (dist > bestX) bestX = dist;

  ctx.save();
  ctx.font = '700 10px "Courier New"';
  ctx.fillStyle = c.primary; ctx.shadowColor = c.glow; ctx.shadowBlur = 8;
  ctx.textAlign = 'right';

  ctx.globalAlpha = 0.75;
  ctx.fillText(dist + 'm  BEST: ' + bestX + 'm', W - 14, 24);

  const mBar = (player.momentum - 1) / 1.5;
  if (mBar > 0.05) {
    ctx.globalAlpha = 0.5 + mBar * 0.4;
    ctx.fillText('MOMENTUM ' + '|'.repeat(Math.round(mBar * 8)), W - 14, 40);
  }

  ctx.globalAlpha = 0.60;
  ctx.fillText('PEAK M   ' + STATS.peakMomentum.toFixed(2), W - 14, 58);
  ctx.fillText('TOP JUMP ' + STATS.highestJump + 'px', W - 14, 74);
  ctx.fillText('MOMENTUM ' + Math.floor(STATS.totalMomentum), W - 14, 90);
  if (STATS.slugsKilled > 0) {
    ctx.fillText('* SLUGS  ' + STATS.slugsKilled, W - 14, 106);
  }
  ctx.restore();

  ctx.restore(); // end zoom scale
}

// ── Game start — called by homescreen.js ──
let gameStarted = false;
let lastTime = 0;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  const home = document.getElementById('homeScreen');
  if (home) {
    home.style.transition = 'opacity 0.55s ease';
    home.style.opacity    = '0';
    setTimeout(function() { home.style.display = 'none'; }, 560);
  }
  document.getElementById('hud').style.display = 'flex';
  cam.snapTo(player);
  SFX.music.start();
  requestAnimationFrame(loop);
}

// ── Main loop ──
function loop(time) {
  requestAnimationFrame(loop);
  const dt = Math.min(time - lastTime, 50);
  lastTime = time;

  Theme.update();
  controls.update();

  prevVy = player.vy;

  // ── Persistent stat tracking ──────────────────────────────
  // Jump origin for highest-jump measurement
  if (player.vy < -2 && STATS._jumpOriginY === null && !player.onGround) {
    STATS._jumpOriginY = player.y;
  }
  if (player.onGround) {
    STATS._jumpOriginY = null;
  }
  if (STATS._jumpOriginY !== null && !player.onGround) {
    const apex = STATS._jumpOriginY - player.y;
    if (apex > STATS.highestJump) STATS.highestJump = Math.floor(apex);
  }
  // Continuous momentum accumulator
  if (!player.dead) {
    const gain = (player.momentum - 1.0) * 0.15;
    if (gain > 0) STATS.totalMomentum += gain;
    if (player.momentum > STATS.peakMomentum) STATS.peakMomentum = player.momentum;
  }
  STATS.slugsKilled = slugKillCount;

  player.update(controls, WORLD.platforms, WORLD.springs);

  // Dash trail particles — fired every other frame during a dash
  if (player.isDashing && (Math.floor(lastTime / 16) % 2 === 0)) {
    const c = Theme.get();
    fx.dashTrail(
      player.x + player.baseW / 2 - player.dashDir * 10,
      player.y + player.baseH / 2,
      c.r, c.g, c.b
    );
  }

  if (player.onGround && !wasGround && Math.abs(prevVy) > 4) {
    fx.splat(player.x + player.baseW/2, player.y + player.baseH, Math.abs(prevVy));
    if (Math.abs(prevVy) > 10) triggerShake(Math.min(Math.abs(prevVy) - 10, 8));
    SFX.land(Math.abs(prevVy));
  }
  wasGround = player.onGround;

  for (const s of WORLD.springs) {
    let cd = getSpringCd(s);
    const sw = 36, sh = 28;
    if (
      cd === 0 &&
      player.x + player.baseW > s.x - sw/2 &&
      player.x                < s.x + sw/2 &&
      player.y + player.baseH >= s.y - sh  &&
      player.y + player.baseH <= s.y + 6   &&
      player.vy < -5
    ) {
      fx.springBurst(s.x, s.y);
      triggerShake(6);
      springCooldowns.set(s, 40);
    } else if (cd > 0) {
      springCooldowns.set(s, cd - 1);
    }
  }

  spawnSlugsFromPlatforms(WORLD.platforms);
  for (let i = slugPool.length - 1; i >= 0; i--) {
    const slug = slugPool[i];
    slug.update();
    if (slug.checkPlayerStomp(player)) {
      fx.splat(slug.x + slug.w/2, slug.y, 8);
      triggerShake(slug.tier === 'giant' ? 5 : 3);
      SFX.stomp();
    }
    if (slug.dead && slug.deadTimer > 50) slugPool.splice(i, 1);
  }

  checkOrbs();
  fx.update();
  wind.update(player);

  WORLD.ensureGenerated(player.x);
  WORLD.cull(player.x);

  cam.update(player);
  updateHUD();

  ctx.save();
  // Apply zoom — scales the entire world render around top-left origin
  ctx.scale(ZOOM, ZOOM);
  if (shakeTimer > 0) {
    shakeTimer--;
    const s = shakeAmt * (shakeTimer / 10);
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  drawBackground();
  fx.draw(ctx, cam);
  wind.draw(ctx, cam);
  drawPlatforms();
  drawSprings();
  drawOrbs(ctx, cam, WORLD.orbs);
  for (const slug of slugPool) slug.draw(ctx, cam);
  player.draw(ctx, cam);

  ctx.restore();
  drawOverlays();
}