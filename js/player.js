// ============================================================
//  PLAYER.JS — Jello character: momentum, expressions, powerups
// ============================================================

class Player {
  constructor(x, y) {
    this.spawnX = x; this.spawnY = y;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.onGround = false;

    this.baseW = 38; this.baseH = 48;

    this.scaleX = 1; this.scaleY = 1;
    this.squishTimer = 0;

    this.speed      = 5.5;
    this.jumpForce  = -18;
    this.gravity    = 0.75;
    this.friction   = 0.80;
    this.airFric    = 0.90;

    this.momentum    = 1.0;
    this.momentumDir = 0;
    this.facing      = 1;

    this.blinkTimer    = 0;
    this.blinkInterval = 180;
    this.isBlinking    = false;
    this.blinkDuration = 8;
    this.blinkFrame    = 0;

    this.mouthShape   = 'smile';
    this._mouthTarget = 'smile';

    this.trail = [];
    this.trailMaxLen = 18;

    this.dead      = false;
    this.deadTimer = 0;
    this.wobble    = 0;

    this.dashCharges       = 0;
    this.doubleJumpCharges = 0;
    this.usedDoubleJump    = false;
    this.isDashing         = false;
    this.dashTimer         = 0;
    this.dashDuration      = 16;
    this.dashSpeed         = 26;
    this.dashDir           = 1;
    this.dashCooldown      = 0;
    this.afterimages       = [];

    // Jump buffering — so pressing just before landing still registers
    this._jumpBuffer  = 0;   // frames remaining in buffer
    this._coyoteTime  = 0;   // frames since left ground (coyote jump)
    this._prevJumpBtn = false;
  }

  respawn() {
    const safe = WORLD.getSafePos();

    // If the safe pos has been culled (too far behind current player position),
    // or there are no platforms near it, do a full world reset so the player
    // never falls into an empty void on repeat.
    const nearbyPlat = WORLD.platforms.find(p =>
      p.x <= safe.x && p.x + p.w >= safe.x - 50 &&
      Math.abs(p.y - safe.y) < 200
    );

    if (!nearbyPlat) {
      // Full reset — regenerate world from scratch, keep scores
      WORLD.resetWorld();
      this.x = 150;
      this.y = 460;
      // Notify game.js to clear stale spring cooldowns and slugs
      if (typeof onWorldReset === 'function') onWorldReset();
    } else {
      this.x = safe.x - this.baseW / 2;
      this.y = safe.y - this.baseH - 10;
    }

    this.vx = 0; this.vy = 0;
    this.dead = false; this.deadTimer = 0;
    this.trail = []; this.afterimages = [];
    this.scaleX = 1; this.scaleY = 1;
    this.momentum = 1.0;
    this.isDashing = false;
    this.onGround = false;
    this._jumpBuffer = 0;
    this._coyoteTime = 0;
  }

  update(input, platforms, springs) {
    if (this.dead) {
      this.deadTimer++;
      if (this.deadTimer > 80) this.respawn();
      return;
    }

    // ── Jump buffer: queue a jump for up to 8 frames ──
    const jumpBtnDown = input.jump;
    const jumpJustPressed = jumpBtnDown && !this._prevJumpBtn;
    if (jumpJustPressed) this._jumpBuffer = 8;
    else if (this._jumpBuffer > 0) this._jumpBuffer--;
    this._prevJumpBtn = jumpBtnDown;
    // consume jump flag so controls don't double-fire
    input.jump = false;

    // Coyote time: can still jump for 6 frames after walking off edge
    if (this.onGround) this._coyoteTime = 6;
    else if (this._coyoteTime > 0) this._coyoteTime--;

    // ── Dash ──
    if (this.dashCooldown > 0) this.dashCooldown--;

    if (input.dash && this.dashCharges > 0 && !this.isDashing && this.dashCooldown === 0) {
      this.isDashing   = true;
      this.dashTimer   = this.dashDuration;
      this.dashDir     = this.facing;
      this.dashCharges--;
      this.vy          = 0;
      input.dash       = false;
      // Dramatic launch squish
      this.scaleX = 1.7; this.scaleY = 0.5;
      this.squishTimer = 6;
      SFX.dash();
      // Screen punch — handled in game.js via global flags
      if (typeof triggerFlash === 'function') triggerFlash();
      if (typeof triggerShake === 'function') triggerShake(4);
    }

    if (this.isDashing) {
      this.dashTimer--;
      this.vx = this.dashDir * this.dashSpeed;
      this.vy = 0;
      // Three staggered afterimages per frame for a strong ghost-blur effect
      this.afterimages.push({ x: this.x,              y: this.y, alpha: 0.55 });
      this.afterimages.push({ x: this.x - this.dashDir * 12, y: this.y, alpha: 0.35 });
      this.afterimages.push({ x: this.x - this.dashDir * 24, y: this.y, alpha: 0.20 });
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.dashCooldown = 12;
        this.vx = this.dashDir * this.speed * 1.8;
        // Exit squish — stretched in movement direction
        this.scaleX = 1.5; this.scaleY = 0.65;
        this.squishTimer = 8;
      }
    } else {
      // ── Horizontal movement ──
      const accel = 1.2 * this.momentum;
      if (input.left) {
        this.vx -= accel; this.facing = -1;
        this.momentumDir === -1
          ? (this.momentum = Math.min(this.momentum + 0.008, 2.5))
          : (this.momentumDir = -1, this.momentum = Math.max(1.0, this.momentum - 0.4));
      } else if (input.right) {
        this.vx += accel; this.facing = 1;
        this.momentumDir === 1
          ? (this.momentum = Math.min(this.momentum + 0.008, 2.5))
          : (this.momentumDir = 1, this.momentum = Math.max(1.0, this.momentum - 0.4));
      } else {
        this.momentum = Math.max(1.0, this.momentum - 0.015);
      }
      const topSpeed = this.speed * this.momentum;
      this.vx = Math.max(-topSpeed, Math.min(topSpeed, this.vx));
      const fric = this.onGround ? this.friction : this.airFric;
      if (!input.left && !input.right) this.vx *= fric;
    }

    // ── Gravity ──
    if (!this.isDashing) {
      this.vy += this.gravity;
      if (this.vy > 26) this.vy = 26;
    }

    // ── Jump / Double jump ──
    if (this._jumpBuffer > 0) {
      if (this._coyoteTime > 0) {
        // Normal jump
        this.vy = this.jumpForce;
        this.onGround = false;
        this._coyoteTime = 0;
        this._jumpBuffer = 0;
        this.scaleX = 0.65; this.scaleY = 1.55;
        this.squishTimer = 10;
        this.usedDoubleJump = false;
        SFX.jump();
      } else if (this.doubleJumpCharges > 0 && !this.usedDoubleJump) {
        // Double jump — only on fresh press
        if (jumpJustPressed) {
          this.vy = this.jumpForce * 0.9;
          this.usedDoubleJump = true;
          this.doubleJumpCharges--;
          this._jumpBuffer = 0;
          this.scaleX = 0.7; this.scaleY = 1.4;
          this.squishTimer = 8;
          SFX.doubleJump();
        }
      }
    }

    // ── Wobble ──
    this.wobble += 0.18;

    // ── Move — split into sub-steps for accuracy ──
    const prevOnGround = this.onGround;
    this.onGround = false;

    // Horizontal
    this.x += this.vx;
    for (const p of platforms) this._resolveHorizontal(p);

    // Vertical
    this.y += this.vy;
    for (const p of platforms) this._resolveVertical(p);

    // Springs — s.y is the platform surface; spring pad extends 28px above it
    for (const s of springs) {
      const sw = 36, sh = 28;
      if (
        this.x + this.baseW > s.x - sw/2 &&
        this.x              < s.x + sw/2 &&
        this.y + this.baseH >= s.y - sh  &&
        this.y + this.baseH <= s.y + 6   &&
        this.vy >= 0
      ) {
        this.vy = -32;
        this.onGround = false;
        this.y = s.y - sh - this.baseH; // pop player above spring to avoid re-trigger
        this.scaleX = 0.55; this.scaleY = 1.75;
        this.squishTimer = 14;
        this.momentum = Math.min(this.momentum + 0.5, 2.5);
        SFX.spring();
      }
    }

    if (this.onGround) {
      this.usedDoubleJump = false;
      // Record safe position when firmly on ground
      WORLD.updateSafePos(
        this.x + this.baseW / 2,
        this.y + this.baseH
      );
      if (Math.abs(this.vy) > 3) {
        const impact = Math.min(Math.abs(this.vy) / 20, 0.5);
        this.scaleX = 1 + impact * 0.85;
        this.scaleY = 1 - impact * 0.55;
        this.squishTimer = 12;
      }
    }

    // Squish recovery
    if (this.squishTimer > 0) {
      this.squishTimer--;
      this.scaleX = 1 + (this.scaleX - 1) * 0.72;
      this.scaleY = 1 + (this.scaleY - 1) * 0.72;
    } else {
      const wobbleAmt = Math.abs(this.vx) > 0.5 ? 0.035 : 0.012;
      this.scaleX = 1 + Math.sin(this.wobble * 2.1) * wobbleAmt;
      this.scaleY = 1 + Math.cos(this.wobble * 1.8) * wobbleAmt;
    }

    // Afterimage fade
    for (let i = this.afterimages.length-1; i>=0; i--) {
      this.afterimages[i].alpha -= 0.07;
      if (this.afterimages[i].alpha <= 0) this.afterimages.splice(i,1);
    }

    // World bounds
    if (this.x < WORLD.WORLD_LEFT) { this.x = WORLD.WORLD_LEFT; this.vx = 0; }

    // Void death
    if (this.y > WORLD.VOID_FLOOR) {
      if (!this.dead) { this.dead = true; this.deadTimer = 0; SFX.death(); }
    }

    // Trail
    if (Math.abs(this.vx) > 1.5 || Math.abs(this.vy) > 3) {
      this.trail.unshift({ x: this.x+this.baseW/2, y: this.y+this.baseH/2, vx: this.vx, vy: this.vy });
      if (this.trail.length > this.trailMaxLen) this.trail.pop();
    } else {
      if (this.trail.length > 0) this.trail.pop();
    }

    this.updateFace();
  }

  // ── Collision: slope-aware surface detection ──
  // Platform top-surface is a LINE from (p.x, p.y) to (p.x+p.w, p.y+p.rise)
  // We compute the Y of the surface at the player's foot X position.

  _surfaceY(p, worldX) {
    // Clamp to platform X span
    if (worldX < p.x || worldX > p.x + p.w) return null;
    const t = (worldX - p.x) / p.w;
    return p.y + t * p.rise;
  }

  _resolveVertical(p) {
    const pw = this.baseW, ph = this.baseH;

    // Horizontal reject with small inset so edge-grazing is ignored
    if (this.x + pw - 6 < p.x || this.x + 6 > p.x + p.w) return;

    // All platforms flat now — rise always 0
    const platTop    = p.y;
    const platBottom = p.y + p.h;

    const foot     = this.y + ph;
    const prevFoot = foot - this.vy;
    const head     = this.y;
    const prevHead = head - this.vy;  // head position last frame (vy<0 means we moved up)

    // ── Land on top — falling downward ──
    if (this.vy >= 0 && prevFoot <= platTop + 1 && foot >= platTop - 1 && foot <= platBottom + 4) {
      this.y  = platTop - ph;
      this.vy = 0;
      this.onGround = true;
      return;
    }

    // ── Ceiling bump — moving upward ──
    // prevHead was AT OR BELOW underside last frame; head crossed INTO slab this frame.
    // We do NOT fire if the player is anywhere other than directly below the slab.
    if (this.vy < 0 && prevHead >= platBottom && head < platBottom && head >= platTop) {
      this.y  = platBottom;
      this.vy = 0;
    }
  }

  _resolveHorizontal(p) {
    const pw = this.baseW, ph = this.baseH;
    // Only block horizontal if platform is nearly flat (steep angles act as slopes only)
    if (Math.abs(p.angle) > 0.15) return;

    const platTop    = Math.min(p.y, p.y + p.rise);
    const platBottom = Math.max(p.y, p.y + p.rise) + p.h;

    if (this.y + ph <= platTop || this.y >= platBottom) return;
    if (this.x + pw <= p.x || this.x >= p.x + p.w) return;

    const overlapL = (this.x + pw) - p.x;
    const overlapR = (p.x + p.w) - this.x;
    if (overlapL < overlapR) {
      this.x = p.x - pw; this.vx = 0;
    } else {
      this.x = p.x + p.w; this.vx = 0;
    }
  }

  updateFace() {
    if (this.isDashing) this._mouthTarget = 'wow';
    else if (this.vy < -6 && !this.onGround) this._mouthTarget = Math.abs(this.vx)>3?'grin':'smile';
    else if (this.vy > 7) this._mouthTarget = 'scared';
    else if (this.vy > 2 && !this.onGround) this._mouthTarget = 'sad';
    else if (this.onGround && Math.abs(this.vx)>4) this._mouthTarget = this.momentum>1.8?'grin':'smirk';
    else if (this.onGround) this._mouthTarget = 'smile';
    this.mouthShape = this._mouthTarget;

    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer >= this.blinkInterval) {
      this.isBlinking = true; this.blinkFrame = 0; this.blinkTimer = 0;
      this.blinkInterval = 140 + Math.random()*120;
    }
    if (this.isBlinking) {
      this.blinkFrame++;
      if (this.blinkFrame >= this.blinkDuration) this.isBlinking = false;
    }
  }

  draw(ctx, cam) {
    if (this.dead) return;
    const c = Theme.get();

    for (const ai of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = ai.alpha;
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},0.3)`;
      ctx.strokeStyle = c.primary; ctx.lineWidth = 1.5;
      this._pathBody(ctx, ai.x-cam.x, ai.y-cam.y, this.baseW, this.baseH);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    const cx = this.x-cam.x, cy = this.y-cam.y;
    const w = this.baseW, h = this.baseH;

    ctx.save();
    this.drawTrail(ctx, cam);
    ctx.translate(cx+w/2, cy+h/2);
    ctx.scale(this.scaleX, this.scaleY);
    ctx.translate(-w/2, -h/2);

    const grad = ctx.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},0.22)`);
    grad.addColorStop(0.5, `rgba(${c.r},${c.g},${c.b},0.12)`);
    grad.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0.05)`);
    ctx.fillStyle = grad;
    this._pathBody(ctx,0,0,w,h); ctx.fill();

    ctx.strokeStyle=c.primary; ctx.lineWidth=2.5;
    ctx.shadowColor=c.glow; ctx.shadowBlur=16;
    this._pathBody(ctx,0,0,w,h); ctx.stroke();

    ctx.shadowBlur=0;
    ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},0.28)`; ctx.lineWidth=1;
    this._pathBody(ctx,3,3,w-6,h-6); ctx.stroke();

    if (this.momentum > 1.6) {
      const mo = (this.momentum-1.6)/0.9;
      ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},${mo*0.35})`;
      ctx.lineWidth=4+mo*6; ctx.shadowColor=c.glow; ctx.shadowBlur=20;
      this._pathBody(ctx,-4,-4,w+8,h+8); ctx.stroke(); ctx.shadowBlur=0;
    }
    this.drawFace(ctx,w,h,c);
    ctx.restore();
  }

  _pathBody(ctx, ox, oy, w, h) {
    const r = 8;
    ctx.beginPath();
    ctx.moveTo(ox+r,oy); ctx.lineTo(ox+w-r,oy);
    ctx.quadraticCurveTo(ox+w,oy,ox+w,oy+r);
    ctx.lineTo(ox+w,oy+h-r);
    ctx.quadraticCurveTo(ox+w,oy+h,ox+w-r,oy+h);
    ctx.lineTo(ox+r,oy+h);
    ctx.quadraticCurveTo(ox,oy+h,ox,oy+h-r);
    ctx.lineTo(ox,oy+r);
    ctx.quadraticCurveTo(ox,oy,ox+r,oy);
    ctx.closePath();
  }

  drawFace(ctx, w, h, c) {
    const eyeY=h*0.33, eyeR=3.5, eyeSep=w*0.22, midX=w/2;
    const scared = this.mouthShape==='scared';
    const blinkP = this.isBlinking ? Math.sin((this.blinkFrame/this.blinkDuration)*Math.PI) : 0;
    const eyeSY  = scared ? (1-blinkP*0.9)*0.6 : (1-blinkP*0.9);
    ctx.fillStyle=c.primary; ctx.shadowColor=c.glow; ctx.shadowBlur=8;
    const eyeYOff = scared ? -3 : 0;
    [-eyeSep,eyeSep].forEach(ox => {
      ctx.save(); ctx.translate(midX+ox,eyeY+eyeYOff);
      ctx.scale(scared?1.3:1, eyeSY*(scared?1.3:1));
      ctx.beginPath(); ctx.arc(0,0,eyeR,0,Math.PI*2); ctx.fill(); ctx.restore();
    });
    ctx.shadowBlur=0;
    if (scared) {
      ctx.strokeStyle=c.primary; ctx.lineWidth=2;
      [-eyeSep,eyeSep].forEach((ox,i)=>{
        ctx.beginPath();
        ctx.moveTo(midX+ox-5,eyeY-9); ctx.lineTo(midX+ox+5,eyeY-6+(i===0?3:-3));
        ctx.stroke();
      });
    }
    const mouthY=h*0.65;
    ctx.strokeStyle=c.primary; ctx.lineWidth=2;
    ctx.shadowColor=c.glow; ctx.shadowBlur=6;
    this.drawMouth(ctx,midX,mouthY);
    ctx.shadowBlur=0;
  }

  drawMouth(ctx, cx, my) {
    ctx.beginPath();
    switch(this.mouthShape) {
      case 'smile':  ctx.arc(cx,my-3,8,0.2,Math.PI-0.2); ctx.stroke(); break;
      case 'grin':
        ctx.arc(cx,my-2,10,0.1,Math.PI-0.1); ctx.stroke();
        ctx.fillStyle=Theme.rgba(0.5); ctx.beginPath();
        ctx.arc(cx,my-2,8,0.1,Math.PI-0.1); ctx.fill(); break;
      case 'scared':
        ctx.arc(cx,my+4,7,Math.PI,Math.PI*2); ctx.stroke();
        ctx.fillStyle=Theme.rgba(0.15); ctx.fill(); break;
      case 'sad':   ctx.arc(cx,my+6,8,Math.PI+0.2,-0.2); ctx.stroke(); break;
      case 'smirk':
        ctx.moveTo(cx-6,my+1); ctx.quadraticCurveTo(cx,my-2,cx+7,my-4);
        ctx.stroke(); break;
      case 'wow':   ctx.ellipse(cx,my,5,7,0,0,Math.PI*2); ctx.stroke(); break;
      default:
        ctx.moveTo(cx-7,my); ctx.lineTo(cx+7,my); ctx.stroke();
    }
  }

  drawTrail(ctx, cam) {
    if (this.trail.length < 2) return;
    const isFalling   = this.vy > 5;
    const isJumping   = this.vy < -5;
    const isSprinting = Math.abs(this.vx) > 3.5;
    const c = Theme.get();
    ctx.save(); ctx.lineCap='round';
    for (let i=0; i<this.trail.length; i++) {
      const t=this.trail[i];
      const alpha=(1-i/this.trail.length)*0.55;
      const tx=t.x-cam.x, ty=t.y-cam.y;
      if (isFalling||isJumping) {
        for (let k=0;k<3;k++) {
          const ox=(k-1)*10;
          const len=(isFalling?1:-1)*(12+(this.trail.length-i)*2.5);
          ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},${alpha*0.7})`;
          ctx.lineWidth=1.2;
          ctx.beginPath(); ctx.moveTo(tx+ox,ty); ctx.lineTo(tx+ox,ty-len); ctx.stroke();
        }
      }
      if (isSprinting) {
        const dir=-this.vx>0?1:-1;
        for (let k=0;k<4;k++) {
          const oy=(k-1.5)*8;
          const len=dir*(10+(this.trail.length-i)*3*this.momentum);
          ctx.strokeStyle=`rgba(${c.r},${c.g},${c.b},${alpha*0.65})`;
          ctx.lineWidth=1.1;
          ctx.beginPath(); ctx.moveTo(tx,ty+oy); ctx.lineTo(tx-len,ty+oy); ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
