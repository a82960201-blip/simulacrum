// audio.js — Five zones. Five sounds. All wrong.

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let zoneGain = null;
  let started = false;
  let currentZone = null;
  let zoneNodes = {};

  // Pentatonic — dreamlike, never resolves
  const PENTATONIC = [261.63,293.66,329.63,392.0,440.0,523.25,587.33,659.26];
  // Tritone intervals for the circus — the devil's interval
  const CIRCUS_SCALE = [261.63,277.18,369.99,415.30,554.37,622.25];

  function init() {
    if (started) return;
    ctx = new (window.AudioContext||window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);

    zoneGain = ctx.createGain();
    zoneGain.gain.setValueAtTime(1.0, ctx.currentTime);
    zoneGain.connect(masterGain);

    started = true;

    // Universal layers
    startGlobalDrone();
    startGlobalGlitch();
    // Zone layers start silent, activated by setZone
    buildZoneLayers();
  }

  // ── GLOBAL DRONE — heard everywhere ────────────────────────
  // The world hums because it has to. Because it can't stop.
  function startGlobalDrone() {
    [55, 82.41, 110, 164.81].forEach((freq, i) => {
      const osc   = ctx.createOscillator();
      const gain  = ctx.createGain();
      const filt  = ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Slow wobble
      osc.frequency.setTargetAtTime(freq*1.003, ctx.currentTime+4, 6);
      osc.frequency.setTargetAtTime(freq*0.998, ctx.currentTime+12, 6);
      filt.type='lowpass';
      filt.frequency.setValueAtTime(280+i*60, ctx.currentTime);
      gain.gain.setValueAtTime(0.055-i*0.012, ctx.currentTime);
      osc.connect(filt); filt.connect(gain); gain.connect(masterGain);
      osc.start();
    });
  }

  // ── GLOBAL GLITCH — VHS artifacts ──────────────────────────
  function startGlobalGlitch() {
    function makeGlitch() {
      const len = ctx.sampleRate * 0.06;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*0.25;

      const src  = ctx.createBufferSource();
      src.buffer = buf;
      const filt = ctx.createBiquadFilter();
      filt.type='bandpass';
      filt.frequency.setValueAtTime(600+Math.random()*3000, ctx.currentTime);
      filt.Q.setValueAtTime(10, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      src.connect(filt); filt.connect(gain); gain.connect(masterGain);
      src.start();

      setTimeout(makeGlitch, 10000+Math.random()*25000);
    }
    setTimeout(makeGlitch, 5000);
  }

  // ── ZONE LAYERS ─────────────────────────────────────────────
  function buildZoneLayers() {
    // Each zone's ambient layer starts silent.
    // We cross-fade between them as player moves.
    startBackroomsLayer();
    startSchoolLayer();
    startPoolLayer();
    startDreamLayer();
    startCircusLayer();
  }

  // BACKROOMS — fluorescent hum + distant footsteps
  function startBackroomsLayer() {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.connect(zoneGain);
    zoneNodes.backrooms = g;

    // Mains hum — 60Hz harmonic series
    [60,120,180,240].forEach((freq,i)=>{
      const osc=ctx.createOscillator();
      const og=ctx.createGain();
      osc.type='sawtooth';
      osc.frequency.setValueAtTime(freq,ctx.currentTime);
      og.gain.setValueAtTime(0.012/(i+1),ctx.currentTime);
      const filt=ctx.createBiquadFilter();
      filt.type='lowpass'; filt.frequency.setValueAtTime(400,ctx.currentTime);
      osc.connect(filt); filt.connect(og); og.connect(g);
      osc.start();
    });

    // Distant dripping
    function drip() {
      const osc=ctx.createOscillator();
      const og=ctx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(800+Math.random()*400,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200,ctx.currentTime+0.15);
      og.gain.setValueAtTime(0,ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.06,ctx.currentTime+0.01);
      og.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2);
      const rev=createReverb(4);
      osc.connect(og); og.connect(rev); rev.connect(g);
      osc.start(); osc.stop(ctx.currentTime+0.25);
      setTimeout(drip, 3000+Math.random()*8000);
    }
    setTimeout(drip, 2000);
  }

  // SCHOOL — silence so total it has texture
  // Distant bell. Wind through a cracked window. Nothing.
  function startSchoolLayer() {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.connect(zoneGain);
    zoneNodes.school = g;

    // Music box — sparse, slightly off-tune
    const rev = createReverb(6);
    rev.connect(g);
    const melody = [0,4,2,7,4,2,0,4,7,4,0,2];
    let ni = 0;
    function note() {
      const freq = PENTATONIC[melody[ni%melody.length]%PENTATONIC.length];
      ni++;
      const osc=ctx.createOscillator();
      const og=ctx.createGain();
      osc.type='triangle';
      osc.frequency.setValueAtTime(freq,ctx.currentTime);
      osc.detune.setValueAtTime((Math.random()-0.5)*15,ctx.currentTime); // ever so slightly wrong
      og.gain.setValueAtTime(0,ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.1,ctx.currentTime+0.015);
      og.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.8);
      osc.connect(og); og.connect(rev);
      osc.start(); osc.stop(ctx.currentTime+0.85);
      setTimeout(note, 800+Math.random()*2200);
    }
    setTimeout(note, 1500);

    // Distant school bell — every 40-80 seconds
    function bell() {
      const osc=ctx.createOscillator();
      const og=ctx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(880,ctx.currentTime);
      og.gain.setValueAtTime(0,ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.12,ctx.currentTime+0.02);
      og.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+3.0);
      const rev2=createReverb(5);
      osc.connect(og); og.connect(rev2); rev2.connect(g);
      osc.start(); osc.stop(ctx.currentTime+3.2);
      setTimeout(bell, 40000+Math.random()*40000);
    }
    setTimeout(bell, 8000);
  }

  // POOL — deep resonant echo. Water displacement. Distant splash.
  function startPoolLayer() {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.connect(zoneGain);
    zoneNodes.pool = g;

    // Low resonant hum — the water's frequency
    const osc=ctx.createOscillator();
    const og=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(40,ctx.currentTime);
    og.gain.setValueAtTime(0.08,ctx.currentTime);
    const filt=ctx.createBiquadFilter();
    filt.type='lowpass'; filt.frequency.setValueAtTime(200,ctx.currentTime);
    osc.connect(filt); filt.connect(og); og.connect(g);
    osc.start();

    // Distant splash
    function splash() {
      const len=ctx.sampleRate*0.4;
      const buf=ctx.createBuffer(1,len,ctx.sampleRate);
      const data=buf.getChannelData(0);
      for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/len,1.5)*0.5;
      const src=ctx.createBufferSource();
      src.buffer=buf;
      const filt2=ctx.createBiquadFilter();
      filt2.type='lowpass'; filt2.frequency.setValueAtTime(1200,ctx.currentTime);
      const sg=ctx.createGain();
      sg.gain.setValueAtTime(0.15,ctx.currentTime);
      const rev=createReverb(5);
      src.connect(filt2); filt2.connect(sg); sg.connect(rev); rev.connect(g);
      src.start();
      setTimeout(splash, 8000+Math.random()*20000);
    }
    setTimeout(splash, 4000);
  }

  // DREAM — music box. Slow. The notes don't quite fit the scale.
  // Childhood. A television in another room. VHS rewinding.
  function startDreamLayer() {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.connect(zoneGain);
    zoneNodes.dream = g;

    const rev = createReverb(8);
    rev.connect(g);

    // High chimes — merry-go-round slowing down
    function chime() {
      const freqs=[1046.5,1174.66,1318.5,1567.98,2093.0];
      const freq=freqs[Math.floor(Math.random()*freqs.length)];
      const osc=ctx.createOscillator();
      const og=ctx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(freq,ctx.currentTime);
      osc.detune.setValueAtTime((Math.random()-0.5)*30,ctx.currentTime); // out of tune
      og.gain.setValueAtTime(0,ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.05,ctx.currentTime+0.01);
      og.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+3.5);
      osc.connect(og); og.connect(rev);
      osc.start(); osc.stop(ctx.currentTime+3.6);
      setTimeout(chime, 1500+Math.random()*5000);
    }
    setTimeout(chime, 1000);

    // Television static in the distance
    function tvStatic() {
      const len=ctx.sampleRate*0.1;
      const buf=ctx.createBuffer(1,len,ctx.sampleRate);
      const data=buf.getChannelData(0);
      for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*0.2;
      const src=ctx.createBufferSource();
      src.buffer=buf;
      const filt=ctx.createBiquadFilter();
      filt.type='bandpass'; filt.frequency.setValueAtTime(3000,ctx.currentTime);
      filt.Q.setValueAtTime(0.5,ctx.currentTime);
      const sg=ctx.createGain();
      sg.gain.setValueAtTime(0.04,ctx.currentTime);
      src.connect(filt); filt.connect(sg); sg.connect(g);
      src.start();
      setTimeout(tvStatic, 15000+Math.random()*30000);
    }
    setTimeout(tvStatic, 8000);
  }

  // CIRCUS — the devil's interval. Calliope pipe organ, broken.
  // The music keeps starting but never reaches the chorus.
  function startCircusLayer() {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.connect(zoneGain);
    zoneNodes.circus = g;

    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for(let i=0;i<256;i++) curve[i]=Math.tanh((i-128)/30); // overdrive
    dist.curve=curve;
    dist.connect(g);

    // Broken calliope — tritones
    const melody=[0,4,1,5,2,3,0,4,5,1,3,2,0];
    let ni=0;
    function pipe() {
      const freq=CIRCUS_SCALE[melody[ni%melody.length]%CIRCUS_SCALE.length];
      ni++;
      const osc=ctx.createOscillator();
      const og=ctx.createGain();
      osc.type='square';
      osc.frequency.setValueAtTime(freq,ctx.currentTime);
      // Random detune — the organ is decaying
      osc.detune.setValueAtTime((Math.random()-0.5)*80,ctx.currentTime);
      og.gain.setValueAtTime(0,ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.08,ctx.currentTime+0.04);
      og.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+1.2);
      const filt=ctx.createBiquadFilter();
      filt.type='bandpass'; filt.frequency.setValueAtTime(800+Math.random()*400,ctx.currentTime);
      filt.Q.setValueAtTime(2,ctx.currentTime);
      osc.connect(filt); filt.connect(og); og.connect(dist);
      osc.start(); osc.stop(ctx.currentTime+1.3);
      // Sometimes it glitches and fires twice
      if(Math.random()>0.7) {
        setTimeout(()=>{ const osc2=ctx.createOscillator(); const og2=ctx.createGain();
          osc2.type='square'; osc2.frequency.setValueAtTime(freq*1.5,ctx.currentTime);
          og2.gain.setValueAtTime(0.04,ctx.currentTime); og2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);
          osc2.connect(og2); og2.connect(dist); osc2.start(); osc2.stop(ctx.currentTime+0.35);
        }, 80);
      }
      setTimeout(pipe, 600+Math.random()*1000);
    }
    setTimeout(pipe, 500);
  }

  // ── ZONE TRANSITIONS ────────────────────────────────────────
  const ZONE_NODE_MAP = {
    'backrooms': 'backrooms',
    'school':    'school',
    'pool':      'pool',
    'dream':     'dream',
    'circus':    'circus',
  };

  function setZone(zone) {
    if (!started || zone === currentZone) return;
    currentZone = zone;

    const targetKey = ZONE_NODE_MAP[zone] || null;
    const now = ctx.currentTime;

    Object.entries(zoneNodes).forEach(([key, gainNode]) => {
      const target = key===targetKey ? 1.0 : 0.0;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(target, now+2.5);
    });
  }

  function createReverb(duration) {
    const conv=ctx.createConvolver();
    const len=ctx.sampleRate*duration;
    const buf=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let ch=0;ch<2;ch++){
      const data=buf.getChannelData(ch);
      for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);
    }
    conv.buffer=buf;
    return conv;
  }

  function fadeOut() {
    if (!masterGain) return;
    masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime+2.5);
  }

  function setVolume(v) {
    if (!masterGain) return;
    masterGain.gain.setValueAtTime(v*0.18, ctx.currentTime);
  }

  return { init, fadeOut, setVolume, setZone };
})();
