// ============================================================
//  EFFECTS.JS — Particles, orbs, wind lines
// ============================================================

class ParticleSystem {
  constructor() { this.particles = []; }

  splat(x, y, intensity) {
    const count = Math.floor(intensity * 8) + 4;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI + Math.PI;
      const speed = Math.random() * intensity * 0.6 + 1;
      this.particles.push({ x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        life: 1, decay: 0.04 + Math.random() * 0.04,
        r: Math.random() * 4 + 1, type: 'splat' });
    }
  }

  springBurst(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI/2 + (Math.random() - 0.5) * 1.4;
      const speed = Math.random() * 6 + 3;
      this.particles.push({ x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.025 + Math.random() * 0.03,
        r: Math.random() * 5 + 2, type: 'spring' });
    }
  }

  orbCollect(x, y, r, g, b) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({ x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.018 + Math.random() * 0.025,
        r: Math.random() * 6 + 2, type: 'orb',
        cr: r, cg: g, cb: b });
    }
  }

  dashTrail(x, y, r, g, b) {
    this.particles.push({ x, y,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      life: 0.8, decay: 0.08,
      r: Math.random() * 8 + 4, type: 'orb',
      cr: r, cg: g, cb: b });
  }

  addMote(worldW, worldTop, worldH) {
    if (this.particles.filter(p => p.type === 'mote').length > 60) return;
    this.particles.push({ x: Math.random() * worldW, y: worldTop + Math.random() * worldH,
      vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.4 - 0.1,
      life: 1, decay: 0.002 + Math.random() * 0.002,
      r: Math.random() * 2 + 0.5, type: 'mote' });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.type === 'splat' || p.type === 'spring' || p.type === 'orb') p.vy += 0.15;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx, cam) {
    const c = Theme.get();
    for (const p of this.particles) {
      const sx = p.x - cam.x, sy = p.y - cam.y;
      const alpha = p.life;
      if (p.type === 'splat') {
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha * 0.7})`;
        ctx.shadowColor = c.glow; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(sx, sy, p.r, 0, Math.PI*2); ctx.fill();
      } else if (p.type === 'spring') {
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${alpha * 0.9})`;
        ctx.lineWidth = 1.5; ctx.shadowColor = c.glow; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + p.vx*4, sy + p.vy*4); ctx.stroke();
      } else if (p.type === 'orb') {
        const pr = p.cr !== undefined ? p.cr : c.r;
        const pg = p.cg !== undefined ? p.cg : c.g;
        const pb = p.cb !== undefined ? p.cb : c.b;
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha * 0.85})`;
        ctx.shadowColor = `rgb(${pr},${pg},${pb})`; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(sx, sy, p.r, 0, Math.PI*2); ctx.fill();
      } else if (p.type === 'mote') {
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha * 0.3})`;
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(sx, sy, p.r, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.shadowBlur = 0;
  }
}

// ── Orb renderer ──
function drawOrbs(ctx, cam, orbs) {
  const frame = performance.now() / 1000;
  for (const orb of orbs) {
    if (orb.collected) continue;
    const sx = orb.x - cam.x, sy = orb.y - cam.y;
    if (sx < -60 || sx > ctx.canvas.width + 60) continue;
    if (sy < -60 || sy > ctx.canvas.height + 60) continue;

    orb.pulse += 0.05;
    const pulse = Math.sin(orb.pulse) * 3;

    let r, g, b;
    if (orb.powerUp) {
      // Dash = cyan, DoubleJump = yellow
      if (orb.powerUp === 'dash')        { r=0; g=220; b=255; }
      else                                { r=255; g=240; b=0; }
    } else if (orb.isMulti) {
      const hue = (frame * 80 + orb.x * 0.1) % 360;
      [r, g, b] = hslToRgb(hue / 360, 1, 0.55);
    } else {
      const p = NEON_PALETTES[orb.themeIdx];
      r = p.r; g = p.g; b = p.b;
    }

    const col = `rgb(${r},${g},${b})`;

    // Outer glow
    const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, orb.r + pulse + 10);
    grd.addColorStop(0,   `rgba(${r},${g},${b},0.9)`);
    grd.addColorStop(0.5, `rgba(${r},${g},${b},0.35)`);
    grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(sx, sy, orb.r + pulse + 10, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.fillStyle   = col;
    ctx.beginPath();
    ctx.arc(sx, sy, orb.r + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Icon for powerups
    if (orb.powerUp) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.font = `bold ${Math.round(orb.r)}px Courier New`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(orb.powerUp === 'dash' ? '»' : '×2', sx, sy + 1);
      ctx.restore();
    }
  }
}

// ── Wind lines ──
class WindLines {
  constructor() { this.lines = []; }

  update(player) {
    const speed = Math.abs(player.vy) + Math.abs(player.vx) * player.momentum;
    if (speed < 5) {
      for (const l of this.lines) l.life -= 0.08;
      this.lines = this.lines.filter(l => l.life > 0);
      return;
    }
    const count = Math.floor(speed / 4);
    for (let i = 0; i < count; i++) {
      const ox = (Math.random() - 0.5) * 80;
      const oy = (Math.random() - 0.5) * 60;
      this.lines.push({
        x: player.x + player.baseW/2 + ox,
        y: player.y + player.baseH/2 + oy,
        vx: -player.vx * 0.5, vy: -player.vy * 0.5,
        len: 14 + Math.random() * 20,
        life: 0.7 + Math.random() * 0.3,
      });
    }
    if (this.lines.length > 90) this.lines.splice(0, this.lines.length - 90);
    for (const l of this.lines) { l.x += l.vx; l.y += l.vy; l.life -= 0.06; }
    this.lines = this.lines.filter(l => l.life > 0);
  }

  draw(ctx, cam) {
    const c = Theme.get();
    ctx.save(); ctx.lineCap = 'round';
    for (const l of this.lines) {
      const sx = l.x - cam.x, sy = l.y - cam.y;
      ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${l.life * 0.5})`;
      ctx.lineWidth = 1; ctx.shadowColor = c.glow; ctx.shadowBlur = 4;
      ctx.beginPath();
      const nx = Math.cos(Math.atan2(l.vy, l.vx));
      const ny = Math.sin(Math.atan2(l.vy, l.vx));
      ctx.moveTo(sx, sy); ctx.lineTo(sx + nx * l.len, sy + ny * l.len);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; ctx.restore();
  }
}

function hslToRgb(h, s, l) {
  const q = l < 0.5 ? l*(1+s) : l+s-l*s;
  const p = 2*l - q;
  return [hue2rgb(p,q,h+1/3), hue2rgb(p,q,h), hue2rgb(p,q,h-1/3)].map(v => Math.round(v*255));
}
function hue2rgb(p,q,t) {
  if (t<0) t+=1; if (t>1) t-=1;
  if (t<1/6) return p+(q-p)*6*t;
  if (t<1/2) return q;
  if (t<2/3) return p+(q-p)*(2/3-t)*6;
  return p;
}
