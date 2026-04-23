// ============================================================
//  SLUGS.JS — Slug tiers: Small (×1), Big (×2), Giant (×4)
//  Stomp = reduce HP by 1 per bounce; 0 HP = dead
// ============================================================

let slugKillCount = 0;

class Slug {
  // tier: 'small' | 'big' | 'giant'
  constructor(x, y, rangeLeft, rangeRight, tier) {
    this.tier = tier || 'small';

    // Size & stats by tier
    if (this.tier === 'giant') {
      this.w = 68; this.h = 48;
      this.hp = 4;
      this.baseSpeed = 0.5;
      this.eyeR = 7;
      this.scoreLabel = '×4';
    } else if (this.tier === 'big') {
      this.w = 44; this.h = 30;
      this.hp = 2;
      this.baseSpeed = 0.85;
      this.eyeR = 5;
      this.scoreLabel = '×2';
    } else {
      this.w = 26; this.h = 18;
      this.hp = 1;
      this.baseSpeed = 1.0 + Math.random() * 0.5;
      this.eyeR = 3;
      this.scoreLabel = null;
    }

    this.x = x; this.y = y;
    this.rangeLeft = rangeLeft; this.rangeRight = rangeRight;
    this.vx = this.baseSpeed;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.wobble  = Math.random() * Math.PI * 2;
    this.wobbleS = 0.05 + Math.random() * 0.04;
    this.scaleX  = 1; this.scaleY = 1;
    this.blinkTimer = Math.random() * 200;
    this.isBlinking = false;
    this.blinkFrame = 0;
    this.antennaWobble = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.deathVy = -8;
    this.deathVx = 0;

    // Flash on hit
    this.hitFlash = 0;
  }

  update() {
    if (this.dead) {
      this.deadTimer++;
      this.y += this.deathVy;
      this.x += this.deathVx;
      this.deathVy += 0.55;
      this.scaleX = Math.max(0.01, this.scaleX - 0.04);
      this.scaleY = Math.max(0.01, this.scaleY - 0.04);
      return;
    }

    if (this.hitFlash > 0) this.hitFlash--;

    this.wobble += this.wobbleS;
    this.antennaWobble += 0.10;
    this.x += this.vx * this.dir;

    if (this.x < this.rangeLeft)  { this.dir = 1;  this.x = this.rangeLeft; }
    if (this.x + this.w > this.rangeRight) { this.dir = -1; this.x = this.rangeRight - this.w; }

    const wave = Math.sin(this.wobble * 3);
    this.scaleX = 1 + wave * 0.07;
    this.scaleY = 1 - wave * 0.05;

    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer > 150 + Math.random()*100) {
      this.isBlinking = true; this.blinkFrame = 0; this.blinkTimer = 0;
    }
    if (this.isBlinking) {
      this.blinkFrame++;
      if (this.blinkFrame > 7) this.isBlinking = false;
    }
  }

  // Returns true if stomped (player should bounce)
  checkPlayerStomp(player) {
    if (this.dead || player.dead) return false;
    const pw = player.baseW, ph = player.baseH;
    const overlapX = player.x + pw > this.x + 4 && player.x < this.x + this.w - 4;
    // Foot must be above the bottom of the slug and within a generous stomp window above the slug top
    const foot = player.y + ph;
    const stompWindow = 24; // how far above slug top counts as a stomp
    const overlapY = foot > this.y - stompWindow && foot < this.y + this.h * 0.6;
    const falling  = player.vy > 0;
    if (overlapX && overlapY && falling) {
      this.hp--;
      this.hitFlash = 10;
      if (this.hp <= 0) {
        this.dead = true;
        this.deadTimer = 0;
        this.deathVy = -7 - Math.random() * 3;
        this.deathVx = (Math.random() - 0.5) * 5;
        slugKillCount++;
      }
      // Bounce player up (higher for tougher slugs)
      const bounceStr = this.tier === 'giant' ? 0.85 : this.tier === 'big' ? 0.75 : 0.70;
      player.vy = player.jumpForce * bounceStr;
      player.onGround = false;
      return true;
    }
    return false;
  }

  draw(ctx, cam) {
    if (this.deadTimer > 45) return;
    const c = Theme.get();
    const sx = this.x - cam.x, sy = this.y - cam.y;
    const cx = sx + this.w/2, cy = sy + this.h/2;

    ctx.save();
    ctx.globalAlpha = this.dead ? Math.max(0, 1 - this.deadTimer/45) : 1;
    ctx.translate(cx, cy);
    ctx.scale(this.dir * this.scaleX, this.scaleY * (this.dead ? (1 - this.deadTimer/45) : 1));
    ctx.translate(-this.w/2, -this.h/2);

    // Hit flash: briefly brighter
    const flashBoost = this.hitFlash > 0 ? 0.6 : 0;
    const grad = ctx.createRadialGradient(this.w/2, this.h/2, 2, this.w/2, this.h/2, this.w/2);
    grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},${0.28 + flashBoost})`);
    grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},${0.06 + flashBoost * 0.3})`);
    ctx.fillStyle = grad;
    this._blob(ctx); ctx.fill();

    ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : c.primary;
    ctx.lineWidth = this.tier === 'giant' ? 2.8 : this.tier === 'big' ? 2.2 : 1.8;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur  = this.tier === 'giant' ? 20 : this.tier === 'big' ? 14 : 10;
    this._blob(ctx); ctx.stroke();
    ctx.shadowBlur = 0;

    // Antennae
    const antCount = this.tier === 'giant' ? 3 : 2;
    ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.7)`;
    ctx.lineWidth = this.tier === 'small' ? 1.2 : 1.8;
    const antSpread = this.tier === 'giant' ? 10 : this.tier === 'big' ? 7 : 5;
    for (let i = 0; i < antCount; i++) {
      const ox = (i - (antCount-1)/2) * antSpread;
      const bx = this.w/2 + ox;
      const sway = Math.sin(this.antennaWobble + i * 1.2) * (this.tier === 'giant' ? 5 : 3);
      const antH = this.tier === 'giant' ? 16 : this.tier === 'big' ? 12 : 9;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.quadraticCurveTo(bx+sway, -antH*0.5, bx+sway*1.5, -antH);
      ctx.stroke();
      ctx.fillStyle = c.primary; ctx.shadowColor = c.glow; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bx+sway*1.5, -antH, this.tier === 'giant' ? 4 : this.tier === 'big' ? 3 : 2.5, 0, Math.PI*2);
      ctx.fill(); ctx.shadowBlur = 0;
    }

    // Eye
    const eyeX = this.w*0.72, eyeY = this.h*0.38;
    const blinkS = this.isBlinking ? 0.1 : 1;
    ctx.fillStyle = c.primary; ctx.shadowColor = c.glow; ctx.shadowBlur = 8;
    ctx.save();
    ctx.translate(eyeX, eyeY); ctx.scale(1, blinkS);
    ctx.beginPath(); ctx.arc(0, 0, this.eyeR, 0, Math.PI*2); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;

    // Mouth
    ctx.strokeStyle = c.primary; ctx.lineWidth = this.tier === 'small' ? 1.2 : 1.8;
    ctx.beginPath();
    ctx.arc(eyeX-1, eyeY+this.eyeR+3, this.eyeR*1.2, 0.2, Math.PI-0.2);
    ctx.stroke();

    // HP pips for big/giant
    if (this.tier !== 'small' && !this.dead) {
      const maxHp = this.tier === 'giant' ? 4 : 2;
      const pipR = 3.5;
      const pipSpacing = 9;
      const totalW = (maxHp - 1) * pipSpacing;
      for (let i = 0; i < maxHp; i++) {
        const px = this.w/2 - totalW/2 + i * pipSpacing;
        const py = -14;
        const filled = i < this.hp;
        ctx.fillStyle = filled ? c.primary : `rgba(${c.r},${c.g},${c.b},0.2)`;
        ctx.shadowColor = c.glow; ctx.shadowBlur = filled ? 8 : 0;
        ctx.beginPath(); ctx.arc(px, py, pipR, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Score label
      ctx.fillStyle = c.primary; ctx.shadowColor = c.glow; ctx.shadowBlur = 10;
      ctx.font = `bold ${this.tier === 'giant' ? 13 : 10}px Courier New`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.scoreLabel, this.w/2, this.h/2);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  _blob(ctx) {
    const w = this.w, h = this.h;
    ctx.beginPath();
    ctx.moveTo(0, h*0.6);
    ctx.quadraticCurveTo(0, 0, w*0.3, 0);
    ctx.quadraticCurveTo(w*0.5, -h*0.15, w*0.7, 0);
    ctx.quadraticCurveTo(w, 0, w, h*0.5);
    ctx.quadraticCurveTo(w, h, w*0.5, h);
    ctx.quadraticCurveTo(0, h, 0, h*0.6);
    ctx.closePath();
  }
}

// ── Slug pool ──
const slugPool = [];

function spawnSlugsFromPlatforms(platforms) {
  for (const p of platforms) {
    if (!p.spawnSlug || p._slugSpawned) continue;
    p._slugSpawned = true;
    const margin = 40;
    const range  = p.w - margin * 2;
    if (range < 40) continue;

    // Determine slug y: center of platform top surface at platform center X
    const t = 0.5; // center
    const surfY = p.y + t * p.rise;

    // Tier roll
    const roll = Math.random();
    let tier;
    if (roll < 0.12)       tier = 'giant';
    else if (roll < 0.38)  tier = 'big';
    else                   tier = 'small';

    const slug = new Slug(
      p.x + margin + Math.random() * Math.max(0, range),
      surfY - (tier === 'giant' ? 48 : tier === 'big' ? 30 : 18),
      p.x + margin,
      p.x + p.w - margin,
      tier
    );
    slugPool.push(slug);
  }
}
