// ============================================================
//  HOMESCREEN.JS — Animated intro screen
//  Blob blinks every 2s, changes expression every 5s,
//  hops every 5s, play button cycles color every 5s
// ============================================================

(function () {
  const hs        = document.getElementById('homeScreen');
  const hsCanvas  = document.getElementById('homeCanvas');
  const hCtx      = hsCanvas.getContext('2d');
  const playBtn   = document.getElementById('playBtn');

  // ── Resize home canvas ──
  function resizeHome() {
    hsCanvas.width  = window.innerWidth;
    hsCanvas.height = window.innerHeight;
  }
  resizeHome();
  window.addEventListener('resize', resizeHome);

  // ── Neon palette (matches theme.js) ──
  const PALETTES = [
    { r:0,   g:255, b:65,  name:'Matrix'  },
    { r:0,   g:207, b:255, name:'Shock'   },
    { r:255, g:45,  b:85,  name:'Crimson' },
    { r:255, g:221, b:0,   name:'Solar'   },
    { r:255, g:119, b:0,   name:'Blaze'   },
    { r:204, g:68,  b:255, name:'Violet'  },
    { r:255, g:68,  b:170, name:'Rose'    },
    { r:0,   g:255, b:204, name:'Aqua'    },
    { r:170, g:255, b:0,   name:'Lemon'   },
    { r:255, g:0,   b:255, name:'Plasma'  },
  ];

  let palIdx    = 0;
  let palFrom   = { ...PALETTES[0] };
  let palTo     = { ...PALETTES[0] };
  let palT      = 1;

  function currentColor() {
    if (palT >= 1) return palTo;
    return {
      r: Math.round(palFrom.r + (palTo.r - palFrom.r) * palT),
      g: Math.round(palFrom.g + (palTo.g - palFrom.g) * palT),
      b: Math.round(palFrom.b + (palTo.b - palFrom.b) * palT),
    };
  }

  function cycleColor() {
    palFrom = currentColor();
    palIdx  = (palIdx + 1) % PALETTES.length;
    palTo   = { ...PALETTES[palIdx] };
    palT    = 0;
  }

  // ── Blob state ──
  const blob = {
    x: 0, y: 0,       // set each frame to canvas center
    w: 80, h: 100,
    scaleX: 1, scaleY: 1,
    squishTimer: 0,
    wobble: 0,

    // Blink
    blinkTimer:    0,
    blinkInterval: 120,  // ~2s at 60fps
    isBlinking:    false,
    blinkFrame:    0,
    blinkDuration: 8,

    // Expression
    mouthShape:   'smile',
    expressions:  ['smile', 'grin', 'smirk', 'wow', 'sad'],
    exprIdx:      0,
    exprTimer:    0,
    exprInterval: 300,  // ~5s at 60fps

    // Hop
    hopTimer:     0,
    hopInterval:  300,  // ~5s at 60fps
    hopVy:        0,
    hopY:         0,    // offset from base Y
    hopping:      false,
  };

  // ── Timers ──
  const colorTimer = setInterval(cycleColor, 5000);

  // ── Draw blob body ──
  function pathBody(ctx, ox, oy, w, h) {
    const r = 12;
    ctx.beginPath();
    ctx.moveTo(ox + r, oy);
    ctx.lineTo(ox + w - r, oy);
    ctx.quadraticCurveTo(ox + w, oy,     ox + w, oy + r);
    ctx.lineTo(ox + w, oy + h - r);
    ctx.quadraticCurveTo(ox + w, oy + h, ox + w - r, oy + h);
    ctx.lineTo(ox + r, oy + h);
    ctx.quadraticCurveTo(ox, oy + h, ox, oy + h - r);
    ctx.lineTo(ox, oy + r);
    ctx.quadraticCurveTo(ox, oy, ox + r, oy);
    ctx.closePath();
  }

  function drawMouth(ctx, cx, my, shape, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    switch (shape) {
      case 'smile':
        ctx.arc(cx, my - 3, 10, 0.2, Math.PI - 0.2); ctx.stroke(); break;
      case 'grin':
        ctx.arc(cx, my - 2, 12, 0.1, Math.PI - 0.1); ctx.stroke();
        ctx.fillStyle = col.replace(')', ',0.4)').replace('rgb', 'rgba');
        ctx.beginPath(); ctx.arc(cx, my - 2, 10, 0.1, Math.PI - 0.1); ctx.fill(); break;
      case 'sad':
        ctx.arc(cx, my + 8, 10, Math.PI + 0.2, -0.2); ctx.stroke(); break;
      case 'smirk':
        ctx.moveTo(cx - 8, my + 1);
        ctx.quadraticCurveTo(cx, my - 2, cx + 9, my - 5);
        ctx.stroke(); break;
      case 'wow':
        ctx.ellipse(cx, my, 6, 9, 0, 0, Math.PI * 2); ctx.stroke(); break;
      default:
        ctx.moveTo(cx - 9, my); ctx.lineTo(cx + 9, my); ctx.stroke();
    }
  }

  function drawBlob(ctx, bx, by, col) {
    const hex = '#' + [col.r, col.g, col.b].map(v => v.toString(16).padStart(2, '0')).join('');
    const w = blob.w, h = blob.h;
    const ox = -w / 2, oy = -h / 2;

    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(blob.scaleX, blob.scaleY);

    // Glow aura
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.9);
    aura.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},0.18)`);
    aura.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.ellipse(0, h * 0.05, w * 0.9, h * 0.7, 0, 0, Math.PI * 2); ctx.fill();

    // Body fill
    const grad = ctx.createLinearGradient(ox, oy, ox + w, oy + h);
    grad.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},0.28)`);
    grad.addColorStop(0.5, `rgba(${col.r},${col.g},${col.b},0.14)`);
    grad.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0.06)`);
    ctx.fillStyle = grad;
    pathBody(ctx, ox, oy, w, h); ctx.fill();

    // Body stroke
    ctx.strokeStyle = hex;
    ctx.lineWidth   = 3;
    ctx.shadowColor = hex;
    ctx.shadowBlur  = 22;
    pathBody(ctx, ox, oy, w, h); ctx.stroke();
    ctx.shadowBlur  = 0;

    // Inner rim
    ctx.strokeStyle = `rgba(${col.r},${col.g},${col.b},0.25)`;
    ctx.lineWidth   = 1;
    pathBody(ctx, ox + 4, oy + 4, w - 8, h - 8); ctx.stroke();

    // Eyes
    const eyeY   = oy + h * 0.32;
    const eyeSep = w * 0.22;
    const eyeR   = 5;
    const blinkS = blob.isBlinking
      ? Math.max(0.05, 1 - Math.sin((blob.blinkFrame / blob.blinkDuration) * Math.PI) * 0.95)
      : 1;
    ctx.fillStyle   = hex;
    ctx.shadowColor = hex;
    ctx.shadowBlur  = 10;
    [-eyeSep, eyeSep].forEach(dx => {
      ctx.save();
      ctx.translate(dx, eyeY);
      ctx.scale(1, blinkS);
      ctx.beginPath(); ctx.arc(0, 0, eyeR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    // Mouth
    const mouthY = oy + h * 0.66;
    ctx.shadowColor = hex; ctx.shadowBlur = 8;
    drawMouth(ctx, 0, mouthY, blob.mouthShape, hex);
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // ── Home screen render loop ──
  let hsRaf;
  let frame = 0;

  function hsLoop() {
    if (!hs || hs.style.display === 'none') return;
    hsRaf = requestAnimationFrame(hsLoop);
    frame++;

    // Advance color transition
    if (palT < 1) palT = Math.min(1, palT + 0.025);
    const col = currentColor();
    const hex = '#' + [col.r, col.g, col.b].map(v => v.toString(16).padStart(2, '0')).join('');

    // Update play button color
    playBtn.style.borderColor  = `rgba(${col.r},${col.g},${col.b},0.85)`;
    playBtn.style.color        = hex;
    playBtn.style.boxShadow    = `0 0 28px rgba(${col.r},${col.g},${col.b},0.45), inset 0 0 16px rgba(${col.r},${col.g},${col.b},0.10)`;
    playBtn.style.textShadow   = `0 0 16px ${hex}`;
    document.documentElement.style.setProperty('--neon', hex);
    document.documentElement.style.setProperty('--neon-glow', hex);

    // Blob wobble
    blob.wobble += 0.06;
    blob.scaleX = 1 + Math.sin(blob.wobble * 2.1) * 0.018;
    blob.scaleY = 1 + Math.cos(blob.wobble * 1.8) * 0.018;

    // Squish recovery
    if (blob.squishTimer > 0) {
      blob.squishTimer--;
      blob.scaleX = 1 + (blob.scaleX - 1) * 0.7;
      blob.scaleY = 1 + (blob.scaleY - 1) * 0.7;
    }

    // Blink (~every 2s)
    blob.blinkTimer++;
    if (!blob.isBlinking && blob.blinkTimer >= blob.blinkInterval) {
      blob.isBlinking    = true;
      blob.blinkFrame    = 0;
      blob.blinkTimer    = 0;
      blob.blinkInterval = 110 + Math.random() * 30;
    }
    if (blob.isBlinking) {
      blob.blinkFrame++;
      if (blob.blinkFrame >= blob.blinkDuration) blob.isBlinking = false;
    }

    // Expression change (~every 5s)
    blob.exprTimer++;
    if (blob.exprTimer >= blob.exprInterval) {
      blob.exprTimer = 0;
      blob.exprIdx   = (blob.exprIdx + 1) % blob.expressions.length;
      blob.mouthShape = blob.expressions[blob.exprIdx];
    }

    // Hop (~every 5s)
    blob.hopTimer++;
    if (!blob.hopping && blob.hopTimer >= blob.hopInterval) {
      blob.hopTimer  = 0;
      blob.hopInterval = 280 + Math.random() * 80;
      blob.hopping   = true;
      blob.hopVy     = -14;
      blob.scaleX    = 0.72;
      blob.scaleY    = 1.5;
      blob.squishTimer = 10;
    }
    if (blob.hopping) {
      blob.hopVy  += 0.9;
      blob.hopY   += blob.hopVy;
      if (blob.hopY >= 0) {
        blob.hopY   = 0;
        blob.hopVy  = 0;
        blob.hopping = false;
        blob.scaleX  = 1.35;
        blob.scaleY  = 0.72;
        blob.squishTimer = 12;
      }
    }

    // ── Draw ──
    const W = hsCanvas.width, H = hsCanvas.height;
    hCtx.clearRect(0, 0, W, H);

    // Dark bg
    hCtx.fillStyle = '#000';
    hCtx.fillRect(0, 0, W, H);

    // Subtle grid
    hCtx.strokeStyle = `rgba(${col.r},${col.g},${col.b},0.03)`;
    hCtx.lineWidth   = 0.5;
    const gs = 80;
    for (let x = 0; x < W + gs; x += gs) {
      hCtx.beginPath(); hCtx.moveTo(x, 0); hCtx.lineTo(x, H); hCtx.stroke();
    }
    for (let y = 0; y < H + gs; y += gs) {
      hCtx.beginPath(); hCtx.moveTo(0, y); hCtx.lineTo(W, y); hCtx.stroke();
    }

    // Radial bg glow behind blob
    const bx = W / 2, by = H * 0.42 + blob.hopY;
    const bgGlow = hCtx.createRadialGradient(bx, by, 0, bx, by, 200);
    bgGlow.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},0.10)`);
    bgGlow.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);
    hCtx.fillStyle = bgGlow;
    hCtx.fillRect(0, 0, W, H);

    // Title — JELLO
    hCtx.save();
    hCtx.textAlign   = 'center';
    hCtx.font        = 'bold 72px "Courier New", monospace';
    hCtx.fillStyle   = hex;
    hCtx.shadowColor = hex;
    hCtx.shadowBlur  = 30;
    hCtx.fillText('JELLO', W / 2, H * 0.18);
    hCtx.shadowBlur  = 0;
    // subtitle
    hCtx.font        = '13px "Courier New", monospace';
    hCtx.fillStyle   = `rgba(${col.r},${col.g},${col.b},0.55)`;
    hCtx.letterSpacing = '4px';
    hCtx.fillText('A  P L A T F O R M E R', W / 2, H * 0.18 + 36);
    hCtx.restore();

    // Blob
    drawBlob(hCtx, bx, by, col);

    // Shadow under blob
    hCtx.save();
    hCtx.globalAlpha = blob.hopping ? 0.15 : 0.28;
    const shadowScale = blob.hopping ? Math.max(0.4, 1 - Math.abs(blob.hopY) / 120) : 1;
    hCtx.scale(1, 1);
    const shGrad = hCtx.createRadialGradient(bx, H * 0.42 + 60, 0, bx, H * 0.42 + 60, 50 * shadowScale);
    shGrad.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},0.35)`);
    shGrad.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);
    hCtx.fillStyle = shGrad;
    hCtx.beginPath();
    hCtx.ellipse(bx, H * 0.42 + 62, 44 * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
    hCtx.fill();
    hCtx.restore();
  }

  requestAnimationFrame(hsLoop);

  // ── Play button click ──
  playBtn.addEventListener('click', function () {
    clearInterval(colorTimer);
    cancelAnimationFrame(hsRaf);
    startGame();
  });

  // Also allow any key / tap on canvas to start
  document.addEventListener('keydown', function onKey(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
      document.removeEventListener('keydown', onKey);
      clearInterval(colorTimer);
      cancelAnimationFrame(hsRaf);
      startGame();
    }
  });

})();
