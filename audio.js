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

  // ══════════════════════════════════════════════════════════
  //  MUSIC — Chiptune-style procedural BGM
  //  Classic platformer feel: bouncy bass + lead melody + hats
  // ══════════════════════════════════════════════════════════

  const MUSIC = (() => {
    let playing  = false;
    let stopFlag = false;
    let masterGain = null;

    // Note frequencies (Hz) — two octaves of chromatic scale helpers
    const NOTE = {
      C3:130.8, D3:146.8, E3:164.8, F3:174.6, G3:196.0, A3:220.0, B3:246.9,
      C4:261.6, D4:293.7, E4:329.6, F4:349.2, G4:392.0, A4:440.0, B4:493.9,
      C5:523.3, D5:587.3, E5:659.3, F5:698.5, G5:784.0, A5:880.0, B5:987.8,
    };

    // Melody in C major — classic upbeat platformer riff (16 steps, 8th notes)
    const MELODY = [
      NOTE.E5, NOTE.E5, NOTE.G5, NOTE.E5,  NOTE.C5, NOTE.D5, NOTE.E5, null,
      NOTE.G5, NOTE.G5, NOTE.A5, NOTE.G5,  NOTE.E5, NOTE.D5, NOTE.C5, NOTE.E5,
    ];
    // Bass line — root / fifth pattern
    const BASS = [
      NOTE.C3, null, NOTE.G3, null,  NOTE.A3, null, NOTE.E3, null,
      NOTE.F3, null, NOTE.C3, null,  NOTE.G3, null, NOTE.G3, null,
    ];

    function playNote(freq, type, gainNode, startT, dur, vol = 0.18) {
      try {
        const ac  = getCtx();
        const osc = ac.createOscillator();
        const g   = ac.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, startT);
        g.gain.linearRampToValueAtTime(vol, startT + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, startT + dur * 0.85);
        osc.connect(g);
        g.connect(gainNode);
        osc.start(startT);
        osc.stop(startT + dur);
      } catch(e) {}
    }

    function playHat(gainNode, startT, vol = 0.06) {
      try {
        const ac   = getCtx();
        const buf  = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.04), ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const src    = ac.createBufferSource();
        const filter = ac.createBiquadFilter();
        const g      = ac.createGain();
        src.buffer = buf;
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        g.gain.setValueAtTime(vol, startT);
        g.gain.exponentialRampToValueAtTime(0.001, startT + 0.04);
        src.connect(filter); filter.connect(g); g.connect(gainNode);
        src.start(startT);
      } catch(e) {}
    }

    // Schedule one full 16-step loop, returns duration of loop in seconds
    function scheduleLoop(startT) {
      const ac      = getCtx();
      const stepDur = 0.135;   // length of one 8th note (~111 BPM)
      const loopDur = stepDur * 16;

      // Ensure master gain node exists and is connected
      if (!masterGain) {
        masterGain = ac.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(ac.destination);
      }

      for (let i = 0; i < 16; i++) {
        const t = startT + i * stepDur;

        // Melody — square wave lead
        if (MELODY[i]) playNote(MELODY[i], 'square', masterGain, t, stepDur * 0.7, 0.14);

        // Bass — triangle for warmth
        if (BASS[i])   playNote(BASS[i],   'triangle', masterGain, t, stepDur * 1.1, 0.20);

        // Hi-hat on every step, accent on beats 1 & 3 of each bar
        const hatVol = (i % 4 === 0) ? 0.09 : 0.04;
        playHat(masterGain, t, hatVol);

        // Kick-like thump on beat 1 of each bar (steps 0, 8)
        if (i % 8 === 0) {
          try {
            const ac2 = getCtx();
            const osc = ac2.createOscillator();
            const g   = ac2.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
            g.gain.setValueAtTime(0.28, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            osc.connect(g); g.connect(masterGain);
            osc.start(t); osc.stop(t + 0.2);
          } catch(e) {}
        }
      }
      return loopDur;
    }

    function loopScheduler(nextStart) {
      if (stopFlag) { playing = false; return; }
      const ac = getCtx();
      // Schedule 2 loops ahead to avoid gaps
      const loopDur  = scheduleLoop(nextStart);
      const scheduleAhead = nextStart - ac.currentTime;
      // Re-schedule just before the next loop begins
      const delay = Math.max(0, (scheduleAhead + loopDur - 0.3)) * 1000;
      setTimeout(() => loopScheduler(nextStart + loopDur), delay);
    }

    function start() {
      if (playing) return;
      playing  = true;
      stopFlag = false;
      const ac = getCtx();
      loopScheduler(ac.currentTime + 0.1);
    }

    function stop() {
      stopFlag = true;
      if (masterGain) {
        try {
          masterGain.gain.setTargetAtTime(0, getCtx().currentTime, 0.3);
        } catch(e) {}
        setTimeout(() => { masterGain = null; }, 600);
      }
    }

    function setVolume(v) {
      if (masterGain) masterGain.gain.setTargetAtTime(v, getCtx().currentTime, 0.1);
    }

    return { start, stop, setVolume };
  })();

  return { jump, doubleJump, land, spring, dash, stomp, powerup, colorChange, death, music: MUSIC };
