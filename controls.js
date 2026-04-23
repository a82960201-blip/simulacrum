// ============================================================
//  CONTROLS.JS — Keyboard + mobile touch input
//  Exposes: left, right, jump, dash  (consumed each frame by Player)
// ============================================================

class Controls {
  constructor() {
    // ── State flags ──
    this.left  = false;
    this.right = false;
    this.jump  = false;
    this.dash  = false;

    // Raw held-down key state (separate from per-frame flags)
    this._keys = {};

    // ── Keyboard ──
    window.addEventListener('keydown', e => {
      if (this._keys[e.code]) return;   // already held
      this._keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jump = true;
        e.preventDefault();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' ||
          e.code === 'KeyX'      || e.code === 'KeyZ') {
        this.dash = true;
      }
    });

    window.addEventListener('keyup', e => {
      this._keys[e.code] = false;
    });

    // ── Mobile joystick (left/right movement) ──
    const joystickZone = document.getElementById('leftJoystick');
    const knob         = document.getElementById('leftKnob');

    this._joystickActive = false;
    this._joystickId     = null;
    this._joystickStartX = 0;
    this._joystickX      = 0;   // current offset

    const DEAD_ZONE = 12;       // px before registering movement

    if (joystickZone) {
      joystickZone.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this._joystickActive = true;
        this._joystickId     = touch.identifier;
        this._joystickStartX = touch.clientX;
        this._joystickX      = 0;
      }, { passive: false });

      joystickZone.addEventListener('touchmove', e => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
          if (touch.identifier !== this._joystickId) continue;
          this._joystickX = touch.clientX - this._joystickStartX;
          // Visual knob feedback — clamp to 36px radius
          const clamp = Math.max(-36, Math.min(36, this._joystickX));
          if (knob) knob.style.transform = `translateX(${clamp}px)`;
        }
      }, { passive: false });

      const endJoystick = e => {
        for (const touch of e.changedTouches) {
          if (touch.identifier !== this._joystickId) continue;
          this._joystickActive = false;
          this._joystickX      = 0;
          if (knob) knob.style.transform = 'translateX(0px)';
        }
      };
      joystickZone.addEventListener('touchend',    endJoystick, { passive: false });
      joystickZone.addEventListener('touchcancel', endJoystick, { passive: false });
    }

    // ── Mobile jump button ──
    const jumpBtn = document.getElementById('jumpBtn');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        this.jump = true;
      }, { passive: false });
    }

    // ── Mobile dash button ──
    const dashBtn = document.getElementById('dashBtn');
    if (dashBtn) {
      dashBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        this.dash = true;
      }, { passive: false });
    }
  }

  // Called once per frame by game.js before passing input to Player
  update() {
    // Keyboard held-state → directional flags (refreshed every frame)
    const kLeft  = this._keys['ArrowLeft']  || this._keys['KeyA'];
    const kRight = this._keys['ArrowRight'] || this._keys['KeyD'];

    // Joystick directional flags
    const jLeft  = this._joystickActive && this._joystickX < -12;
    const jRight = this._joystickActive && this._joystickX >  12;

    this.left  = !!(kLeft  || jLeft);
    this.right = !!(kRight || jRight);

    // jump / dash are SET by event listeners and CONSUMED by Player.update()
    // (player sets them back to false after reading — no reset needed here)
  }
}
