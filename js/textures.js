// textures.js — All textures procedurally generated

const TextureLib = (() => {
  const SIZE = 64;

  function makeCanvas(w = SIZE, h = SIZE) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function noise(x, y, seed = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453;
    return n - Math.floor(n);
  }

  // ── BACKROOMS ────────────────────────────────────────────────
  function makeBackroomsWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 1);
      const stripe = Math.floor(y / 6) % 2;
      const wax = (x % 12) / 12; const way = (y % 18) / 18;
      const pat = Math.sin(wax * Math.PI) * Math.sin(way * Math.PI) * 0.07;
      const base = 0.58 + stripe * 0.06 + n * 0.1 + pat;
      ctx.fillStyle = `rgb(${Math.round(base*215)},${Math.round(base*190)},${Math.round(base*90)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeBackroomsFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 5);
      const t = (Math.floor(x/8)+Math.floor(y/8)) % 2;
      const base = (t ? 0.46 : 0.38) + n * 0.07;
      ctx.fillStyle = `rgb(${Math.round(base*200)},${Math.round(base*178)},${Math.round(base*78)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeBackroomsCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 7);
      const grid = (x % 16 < 1 || y % 16 < 1);
      const base = grid ? 0.52 : 0.76 + n * 0.04;
      ctx.fillStyle = `rgb(${Math.round(base*222)},${Math.round(base*220)},${Math.round(base*200)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  // ── OFFICE ───────────────────────────────────────────────────
  function makeOfficeWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 9);
      const panel = Math.floor(y / 20) % 2;
      const crack = (y % 20 === 0);
      const base = crack ? 0.3 : (panel ? 0.55 : 0.50) + n * 0.06;
      const tint = noise(x/4, y/4, 11) * 0.04;
      ctx.fillStyle = `rgb(${Math.round((base+tint)*158)},${Math.round((base+tint)*162)},${Math.round((base+tint*0.5)*150)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeOfficeFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 13);
      const grout = (x % 16 < 1 || y % 16 < 1);
      const checker = (Math.floor(x/16)+Math.floor(y/16)) % 2;
      const base = grout ? 0.28 : (checker ? 0.74 : 0.62) + n * 0.04;
      ctx.fillStyle = `rgb(${Math.round(base*188)},${Math.round(base*182)},${Math.round(base*170)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeOfficeCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 15);
      const grid = (x % 16 < 1 || y % 16 < 1);
      // fluorescent tube bands
      const tube = (x % 16 >= 4 && x % 16 <= 12 && y % 16 >= 6 && y % 16 <= 10);
      const base = grid ? 0.45 : tube ? 0.95 : 0.72 + n * 0.04;
      const g = tube ? Math.round(base*255) : Math.round(base*215);
      ctx.fillStyle = `rgb(${Math.round(base*210)},${g},${Math.round(base*195)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  // ── POOL ROOM ─────────────────────────────────────────────────
  function makePoolWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 17);
      const tile = (x % 8 < 1 || y % 8 < 1);
      const stain = noise(x/3, y/3, 19) > 0.75 ? 0.08 : 0;
      const base = tile ? 0.32 : 0.65 + n * 0.07 - stain;
      // Pool tiles — pale aqua/white
      const r = Math.round((base * 0.7 + 0.1) * 190);
      const g = Math.round((base * 0.85 + 0.05) * 210);
      const b = Math.round((base + 0.05) * 220);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makePoolFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 21);
      const n2 = noise(x*0.3, y*0.3, 23);
      const tile = (x % 10 < 1 || y % 10 < 1);
      const crack = noise(x*2, y*2, 25) > 0.92;
      const base = tile ? 0.25 : crack ? 0.20 : 0.55 + n * 0.1;
      // Dry pool floor — cracked pale blue
      const stain = n2 * 0.15;
      ctx.fillStyle = `rgb(${Math.round((base*0.6+stain)*140)},${Math.round((base*0.8+stain)*175)},${Math.round((base+stain)*185)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makePoolCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 27);
      // Exposed concrete with water stain patches
      const stain = noise(x/6, y/6, 29) > 0.6 ? 0.12 : 0;
      const beam = (x % 24 >= 10 && x % 24 <= 14);
      const base = beam ? 0.35 : 0.5 + n * 0.08 - stain;
      ctx.fillStyle = `rgb(${Math.round(base*160)},${Math.round(base*168)},${Math.round(base*165)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  // Pool lane divider sprite
  function makePoolLane() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Lane rope — alternating red/white circles
    for (let i = 0; i < 8; i++) {
      const yp = 8 + i * 7;
      const col = i % 2 === 0 ? '#cc3322' : '#ddd8c4';
      ctx.beginPath();
      ctx.arc(SIZE/2, yp, 5, 0, Math.PI*2);
      ctx.fillStyle = col;
      ctx.fill();
    }
    return c;
  }

  // ── DREAM ─────────────────────────────────────────────────────
  function makeDreamWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x*0.3, y*0.3, 31);
      const n2 = noise(x*0.7, y*0.7, 33);
      const wave = Math.sin((x+y)*0.4) * 0.05;
      const base = 0.65 + n*0.15 + wave;
      ctx.fillStyle = `rgb(${Math.round((base+n2*0.1)*230)},${Math.round((base*0.75+n*0.08)*195)},${Math.round((base*0.8+n2*0.05)*210)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeDreamFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x*0.5, y*0.5, 35);
      const ch = (Math.floor(x/8)+Math.floor(y/8)) % 2;
      const base = (ch ? 0.85 : 0.70) + n*0.05;
      ctx.fillStyle = `rgb(${Math.round(base*240)},${Math.round(base*0.85*215)},${Math.round(base*0.9*232)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeDreamCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x*0.2, y*0.2, 37);
      const blob = (Math.sin(x*0.3)+Math.cos(y*0.3))*0.1;
      const base = 0.82 + n*0.1 + blob;
      ctx.fillStyle = `rgb(${Math.min(255,Math.round(base*245))},${Math.min(255,Math.round(base*0.88*230))},${Math.min(255,Math.round(base*250))})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  // ── TADC ──────────────────────────────────────────────────────
  function makeTADCWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 39);
      const stripe = Math.floor(y/8) % 3;
      let r,g,b;
      if (stripe===0) { r=Math.round((0.55+n*0.1)*200); g=Math.round((0.35+n*0.08)*130); b=Math.round((0.25+n*0.06)*100); }
      else if(stripe===1){ r=Math.round((0.7+n*0.1)*240); g=Math.round((0.62+n*0.08)*210); b=Math.round((0.3+n*0.05)*110); }
      else { r=Math.round((0.4+n*0.08)*140); g=Math.round((0.25+n*0.06)*100); b=Math.round((0.5+n*0.1)*180); }
      if (y%19<1 && n>0.7) { r=255; g=80; b=80; }
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  function makeTADCFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x, y, 41);
      const stripe = (Math.floor(x/4)+Math.floor(y/4)) % 2;
      const base = stripe ? 0.15 : 0.08;
      ctx.fillStyle = `rgb(${Math.round((base+n*0.05)*80)},${Math.round((base*0.5+n*0.03)*50)},${Math.round((base+n*0.08)*100)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  // ── VOID ──────────────────────────────────────────────────────
  function makeVoidWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const n = noise(x*0.5, y*0.5, 43);
      const n2 = noise(x*2, y*2, 45);
      const base = 0.04 + n*0.08 + n2*0.02;
      ctx.fillStyle = `rgb(${Math.round(base*38)},${Math.round(base*55)},${Math.round(base*75)})`;
      ctx.fillRect(x, y, 1, 1);
    }
    return c;
  }

  // ── EXIT DOOR ─────────────────────────────────────────────────
  function makeExitDoor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = '#060e0e'; ctx.fillRect(0,0,SIZE,SIZE);
    ctx.fillStyle = '#0e2828'; ctx.fillRect(4,4,SIZE-8,SIZE-8);
    ctx.strokeStyle = '#7acec8'; ctx.lineWidth = 2;
    ctx.strokeRect(4,4,SIZE-8,SIZE-8);
    ctx.fillStyle = 'rgba(122,206,200,0.9)';
    ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EXIT', SIZE/2, SIZE/2+4);
    for (let i=0;i<6;i++) {
      ctx.beginPath(); ctx.arc(8+i*8, SIZE-14, 2, 0, Math.PI*2);
      ctx.fillStyle = i%2===0 ? '#7acec8' : '#c8b96e';
      ctx.fill();
    }
    return c;
  }

  // ── ENTITY ────────────────────────────────────────────────────
  function makeEntity() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.clearRect(0,0,SIZE,SIZE);
    ctx.fillStyle = '#030306';
    ctx.beginPath(); ctx.ellipse(SIZE/2,10,8,9,0,0,Math.PI*2); ctx.fill();
    ctx.fillRect(SIZE/2-7,18,14,24);
    ctx.fillRect(SIZE/2-16,20,9,3);
    ctx.fillRect(SIZE/2+7,20,9,3);
    ctx.fillRect(SIZE/2-7,42,5,14);
    ctx.fillRect(SIZE/2+2,42,5,14);
    return c;
  }

  // ── 1995 DESKTOP COMPUTER ─────────────────────────────────────
  function makeDesktop() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.clearRect(0,0,SIZE,SIZE);

    // Monitor body — beige box
    ctx.fillStyle = '#c8c0a0';
    ctx.fillRect(8, 10, 48, 36);
    // Monitor bevel
    ctx.fillStyle = '#b0a888';
    ctx.fillRect(8,10,48,2); ctx.fillRect(8,10,2,36);
    ctx.fillStyle = '#ddd8c0';
    ctx.fillRect(8,44,48,2); ctx.fillRect(54,10,2,36);
    // Screen
    ctx.fillStyle = '#0a1a08';
    ctx.fillRect(12, 14, 40, 28);
    // Screen glow — green CRT text
    ctx.fillStyle = '#22cc44';
    ctx.font = '4px monospace'; ctx.textAlign = 'left';
    ctx.fillText('C:\\>', 14, 22);
    ctx.fillText('SIMULACRUM.EXE', 14, 28);
    ctx.fillText('LOADING...', 14, 34);
    // CRT scanline overlay
    for (let sy = 14; sy < 42; sy += 2) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(12, sy, 40, 1);
    }
    // Monitor neck / stand
    ctx.fillStyle = '#b8b0a0';
    ctx.fillRect(26, 46, 12, 4);
    ctx.fillRect(20, 50, 24, 3);
    // Base
    ctx.fillStyle = '#a8a090';
    ctx.fillRect(18, 53, 28, 4);
    // Floppy drive slot
    ctx.fillStyle = '#888070';
    ctx.fillRect(12, 40, 20, 3);
    ctx.fillStyle = '#666058';
    ctx.fillRect(14, 41, 14, 1);
    // Power LED
    ctx.beginPath(); ctx.arc(50, 42, 2, 0, Math.PI*2);
    ctx.fillStyle = '#22cc44'; ctx.fill();

    return c;
  }

  // ── CHAIR ─────────────────────────────────────────────────────
  function makeChair() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    // Seat
    ctx.fillStyle = '#7a6a50';
    ctx.fillRect(16, 28, 32, 6);
    // Backrest
    ctx.fillStyle = '#6a5a42';
    ctx.fillRect(16, 12, 32, 16);
    ctx.fillRect(16, 12, 4, 16);
    ctx.fillRect(44, 12, 4, 16);
    // Legs
    ctx.fillStyle = '#5a4a34';
    ctx.fillRect(18, 34, 4, 18);
    ctx.fillRect(42, 34, 4, 18);
    ctx.fillRect(18, 34, 4, 18);
    ctx.fillRect(42, 34, 4, 18);
    // Seat cushion highlight
    ctx.fillStyle = '#8a7a60';
    ctx.fillRect(18, 28, 28, 3);
    return c;
  }

  // ── TRASHCAN ─────────────────────────────────────────────────
  function makeTrashcan() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    // Can body — tapered
    ctx.fillStyle = '#5a5a50';
    ctx.beginPath();
    ctx.moveTo(20, 48); ctx.lineTo(18, 18);
    ctx.lineTo(46, 18); ctx.lineTo(44, 48);
    ctx.closePath(); ctx.fill();
    // Lid
    ctx.fillStyle = '#6a6a5a';
    ctx.fillRect(16, 14, 32, 5);
    // Handle
    ctx.fillStyle = '#4a4a40';
    ctx.fillRect(28, 10, 8, 5);
    // Stripes / texture
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(22, 22, 2, 24);
    ctx.fillRect(28, 22, 2, 24);
    ctx.fillRect(34, 22, 2, 24);
    ctx.fillRect(40, 22, 2, 24);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(20, 18, 4, 26);
    return c;
  }
  return {
    chair:           makeChair(),
    trashcan:        makeTrashcan(),
    backroomsWall:   makeBackroomsWall(),
    backroomsFloor:  makeBackroomsFloor(),
    backroomsCeiling:makeBackroomsCeiling(),
    officeWall:      makeOfficeWall(),
    officeFloor:     makeOfficeFloor(),
    officeCeiling:   makeOfficeCeiling(),
    poolWall:        makePoolWall(),
    poolFloor:       makePoolFloor(),
    poolCeiling:     makePoolCeiling(),
    poolLane:        makePoolLane(),
    dreamWall:       makeDreamWall(),
    dreamFloor:      makeDreamFloor(),
    dreamCeiling:    makeDreamCeiling(),
    tadcWall:        makeTADCWall(),
    tadcFloor:       makeTADCFloor(),
    tadcCeiling:     makeBackroomsCeiling(),
    voidWall:        makeVoidWall(),
    voidFloor:       makeVoidWall(),
    voidCeiling:     makeVoidWall(),
    exitDoor:        makeExitDoor(),
    entity:          makeEntity(),
    desktop:         makeDesktop(),
  };
})();
