// ============================================================
//  AUDIO.JS — Upbeat procedural sound effects via Web Audio
// ============================================================

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume if suspended (autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Unlock on first interaction
  document.addEventListener('touchstart', () => getCtx(), { once: true });
  document.addEventListener('mousedown',  () => getCtx(), { once: true });
  document.addEventListener('keydown',    () => getCtx(), { once: true });

  // ── Utility: play a tone burst ──
  function tone(freq, type, gainVal, duration, attack, decay, detune = 0) {
    try {
      const ac = getCtx();
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      gain.gain.setValueAtTime(0, ac.currentTime);
      gain.gain.linearRampToValueAtTime(gainVal, ac.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration + 0.05);
    } catch(e) {}
  }

  function sweep(freqStart, freqEnd, type, gainVal, duration) {
    try {
      const ac = getCtx();
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration);
      gain.gain.setValueAtTime(gainVal, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration + 0.05);
    } catch(e) {}
  }

  function noise(gainVal, duration, filterFreq = 800) {
    try {
      const ac = getCtx();
      const buf = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src    = ac.createBufferSource();
      const filter = ac.createBiquadFilter();
      const gain   = ac.createGain();
      src.buffer = buf;
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      gain.gain.setValueAtTime(gainVal, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      src.connect(filter); filter.connect(gain); gain.connect(ac.destination);
      src.start();
    } catch(e) {}
  }

  // ── Sound definitions ──

  function jump() {
    // Bright upward chirp
    sweep(260, 520, 'square', 0.18, 0.12);
    sweep(320, 640, 'sine',   0.10, 0.10);
  }

  function doubleJump() {
    // Two-tone sparkle
    sweep(400, 800, 'square', 0.16, 0.10);
    setTimeout(() => sweep(500, 1000, 'sine', 0.12, 0.09), 50);
    setTimeout(() => tone(1200, 'sine', 0.06, 0.12, 0.01, 0.12), 100);
  }

  function land(intensity) {
    const vel = Math.min(intensity, 20);
    const freq = 80 + vel * 4;
    noise(0.12 + vel * 0.006, 0.12, freq * 2);
    sweep(freq * 2, freq * 0.5, 'sine', 0.14, 0.10);
  }

  function spring() {
    // Bouncy boing — fast sweep up with wobble
    sweep(180, 900, 'sine', 0.22, 0.18);
    setTimeout(() => sweep(900, 1200, 'sine', 0.12, 0.10), 100);
    setTimeout(() => sweep(1200, 800, 'sine', 0.06, 0.12), 180);
  }

  function dash() {
    // Whoosh + crackle
    sweep(600, 1400, 'sawtooth', 0.12, 0.08);
    noise(0.08, 0.08, 2000);
    setTimeout(() => sweep(1400, 200, 'square', 0.08, 0.12), 60);
  }

  function stomp() {
    // Satisfying squish pop
    sweep(300, 80, 'square', 0.20, 0.10);
    noise(0.10, 0.10, 400);
    setTimeout(() => tone(600, 'sine', 0.10, 0.08, 0.005, 0.08), 40);
  }

  function powerup() {
    // Ascending arpeggio — upbeat and celebratory
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((f, i) => {
      setTimeout(() => {
        tone(f, 'square', 0.14, 0.14, 0.005, 0.14);
        tone(f * 1.5, 'sine', 0.06, 0.10, 0.005, 0.10);
      }, i * 55);
    });
  }

  function colorChange() {
    // Shimmering cascade — magical
    const freqs = [880, 1100, 1320, 1760, 2200];
    freqs.forEach((f, i) => {
      setTimeout(() => {
        tone(f, 'sine', 0.10, 0.20, 0.01, 0.20, (Math.random() - 0.5) * 15);
        tone(f * 0.5, 'triangle', 0.06, 0.18, 0.01, 0.18);
      }, i * 40);
    });
    setTimeout(() => sweep(400, 1600, 'sine', 0.08, 0.25), 50);
  }

  function death() {
    // Descending wah — comical deflation
    sweep(440, 80, 'sawtooth', 0.18, 0.40);
    setTimeout(() => sweep(220, 55, 'square', 0.12, 0.35), 100);
    noise(0.06, 0.25, 200);
  }

  return { jump, doubleJump, land, spring, dash, stomp, powerup, colorChange, death };
})();
