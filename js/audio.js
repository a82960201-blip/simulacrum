// audio.js — Procedural ambient audio: soft music box + drone + playground

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let started = false;

  // Pentatonic scale in Hz — dream-like, child-like
  const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.26];
  const LOW_DRONE = [55, 82.41, 110];

  function init() {
    if (started) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);
    started = true;

    startDrone();
    startMusicBox();
    startPlayground();
    startGlitch();
  }

  // Deep drone — the backrooms hum
  function startDrone() {
    LOW_DRONE.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Slight detune wobble
      osc.frequency.setTargetAtTime(freq * 1.002, ctx.currentTime + 3, 4);
      osc.frequency.setTargetAtTime(freq * 0.999, ctx.currentTime + 8, 4);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300 + i * 80, ctx.currentTime);

      gain.gain.setValueAtTime(0.06 - i * 0.015, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start();
    });
  }

  // Music box melody — sparse, haunting
  function startMusicBox() {
    const delay = ctx.createDelay(1.0);
    delay.delayTime.setValueAtTime(0.3, ctx.currentTime);
    const delayGain = ctx.createGain();
    delayGain.gain.setValueAtTime(0.25, ctx.currentTime);
    const reverb = createReverb(3.5);

    delay.connect(delayGain);
    delayGain.connect(delay);
    delay.connect(reverb);
    reverb.connect(masterGain);

    let noteIndex = 0;
    const melody = [0, 2, 4, 7, 4, 2, 0, 4, 7, 5, 4, 2, 0, 2, 7, 4];

    function scheduleNote(time) {
      const freq = PENTATONIC[melody[noteIndex % melody.length]];
      noteIndex++;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

      osc.connect(gain);
      gain.connect(delay);

      osc.start(time);
      osc.stop(time + 0.65);

      // Random gaps — feels more dream-like
      const gap = 0.6 + Math.random() * 1.4;
      setTimeout(() => scheduleNote(ctx.currentTime), gap * 1000);
    }

    scheduleNote(ctx.currentTime + 1.5);
  }

  // Playground texture — distant merry-go-round-like high notes
  function startPlayground() {
    const reverb = createReverb(5);

    function playChime() {
      const freqs = [1046.5, 1318.5, 1567.98, 2093.0]; // high C E G C
      const freq = freqs[Math.floor(Math.random() * freqs.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Slightly detune — out-of-tune playground bell
      osc.detune.setValueAtTime((Math.random() - 0.5) * 25, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(reverb);
      reverb.connect(masterGain);

      osc.start();
      osc.stop(ctx.currentTime + 2.6);

      const nextIn = 2000 + Math.random() * 5000;
      setTimeout(playChime, nextIn);
    }

    setTimeout(playChime, 3000);
  }

  // Occasional glitch noise — VHS artifact sound
  function startGlitch() {
    function makeGlitch() {
      const bufLen = ctx.sampleRate * 0.08;
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const source = ctx.createBufferSource();
      source.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 2000, ctx.currentTime);
      filter.Q.setValueAtTime(8, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, ctx.currentTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      source.start();

      const nextIn = 8000 + Math.random() * 20000;
      setTimeout(makeGlitch, nextIn);
    }

    setTimeout(makeGlitch, 6000);
  }

  // Simple reverb using convolver + noise impulse
  function createReverb(duration) {
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * duration;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    conv.buffer = buf;
    return conv;
  }

  function fadeOut() {
    if (!masterGain) return;
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
  }

  function setVolume(v) {
    if (!masterGain) return;
    masterGain.gain.setValueAtTime(v * 0.18, ctx.currentTime);
  }

  return { init, fadeOut, setVolume };
})();
