// textures.js — Five aesthetics. Each one wrong in its own way.

const TextureLib = (() => {
  const SIZE = 64;

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    return c;
  }

  // Deterministic noise — no randomness on init so textures are stable
  function noise(x, y, seed = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453;
    return n - Math.floor(n);
  }
  function fbm(x, y, seed, oct=3) {
    let v=0, a=0.5;
    for(let i=0;i<oct;i++){ v+=noise(x*(1<<i),y*(1<<i),seed+i*37)*a; a*=0.5; }
    return v;
  }

  // ═══════════════════════════════════════════════════════════
  // BACKROOMS — sickly yellow wallpaper / fluorescent ceiling
  // Carpet that shouldn't be damp but is.
  // ═══════════════════════════════════════════════════════════

  function makeBackroomsWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/8, y/8, 1);
        // Wallpaper diamond pattern
        const wx = (x % 16) / 16;
        const wy = (y % 20) / 20;
        const pattern = Math.sin(wx * Math.PI * 2) * Math.sin(wy * Math.PI) * 0.06;
        const stripe = Math.floor(y / 24) % 2;
        const base = 0.6 + n * 0.12 + pattern + (stripe * 0.04);
        // Yellowing at edges, moisture stains
        const stain = fbm(x/4, y/4, 7) > 0.72 ? 0.88 : 1.0;
        const r = Math.min(255, Math.floor(base * stain * 220));
        const g = Math.min(255, Math.floor(base * stain * 195));
        const b = Math.min(255, Math.floor(base * stain * 80));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeBackroomsFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/6, y/6, 5);
        // Damp carpet tiles
        const tX = Math.floor(x/8)%2, tY = Math.floor(y/8)%2;
        const tile = (tX+tY)%2;
        const moisture = fbm(x/3, y/3, 9) * 0.2;
        const base = tile ? 0.38-moisture*0.5 : 0.32-moisture*0.4;
        const r = Math.floor((base + n*0.05) * 175);
        const g = Math.floor((base*0.85 + n*0.04) * 155);
        const b = Math.floor((base*0.35 + n*0.03) * 70);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeBackroomsCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 7);
        // Suspended ceiling tiles — 16x16 grid with fluorescent strips
        const gx = x%16===0 || y%16===0;
        const light = (x>4 && x<12 && y%16>4 && y%16<12);
        const stain = fbm(x/5,y/5,11)>0.78;
        let r,g,b;
        if(light) { r=250; g=248; b=225; }
        else if(gx){ r=140; g=138; b=125; }
        else if(stain){ r=Math.floor((0.6+n*0.05)*200); g=Math.floor((0.58+n*0.04)*195); b=Math.floor((0.5+n*0.04)*165); }
        else { const base=0.82+n*0.04; r=Math.floor(base*225); g=Math.floor(base*222); b=Math.floor(base*205); }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // SCHOOL — liminal hallway. Summer. The clocks stopped at 3pm.
  // Institutional green wainscoting. Linoleum that was shiny once.
  // ═══════════════════════════════════════════════════════════

  function makeSchoolWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/10, y/10, 13);
        const upper = y < SIZE*0.55;
        const divider = y >= SIZE*0.52 && y <= SIZE*0.58;
        let r,g,b;
        if(divider) {
          r=120; g=115; b=90;
        } else if(upper) {
          // Cream plaster — old, not dirty, just tired
          const base = 0.84+n*0.07;
          r=Math.floor(base*222); g=Math.floor(base*215); b=Math.floor(base*195);
        } else {
          // Green wainscoting — that specific institutional green
          const base = 0.42+n*0.06;
          r=Math.floor(base*120); g=Math.floor(base*158); b=Math.floor(base*115);
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeSchoolFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/8, y/8, 15);
        // Speckled linoleum — beige/brown/grey specks
        const tX=Math.floor(x/16), tY=Math.floor(y/16);
        const checker = (tX+tY)%2;
        const grout = x%16<1 || y%16<1;
        const speckle = noise(x*3,y*3,17)>0.75 ? -0.08 : 0;
        const wear = fbm(x/5,y/5,19)*0.15;
        const base = grout ? 0.28 : (checker?0.58:0.50)+n*0.05+speckle-wear;
        r=Math.floor(base*180); g=Math.floor(base*172); b=Math.floor(base*155);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeSchoolCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 20);
        // Drop ceiling tile — white squares, thin metal strips
        const gx = x%16===0||y%16===0;
        const inner_light = x>3&&x<13&&y%16>3&&y%16<13;
        let r,g,b;
        if(gx){ r=160;g=158;b=150; }
        else if(inner_light){ const base=0.88+n*0.03; r=Math.floor(base*230);g=Math.floor(base*228);b=Math.floor(base*218); }
        else { const base=0.80+n*0.05; r=Math.floor(base*218);g=Math.floor(base*215);b=Math.floor(base*205); }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // POOL — the poolrooms. The water is the wrong color of still.
  // Natatorium tiles. Humid. Echo of splashing that isn't there.
  // ═══════════════════════════════════════════════════════════

  function makePoolWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/8,y/8,22);
        const tX=Math.floor(x/8), tY=Math.floor(y/8);
        const grout = x%8===0||y%8===0;
        const moisture = fbm(x/4,(y+tY*2)/4,25)*0.25;
        // Tiles shift from white at top to aqua-green at bottom
        const depthFade = y/SIZE;
        let r,g,b;
        if(grout) {
          r=Math.floor((0.5-moisture*0.3)*160);
          g=Math.floor((0.55-moisture*0.2)*175);
          b=Math.floor((0.55-moisture*0.1)*175);
        } else {
          const base=0.78+n*0.07-moisture;
          r=Math.floor(base*(1-depthFade*0.4)*215);
          g=Math.floor(base*(1+depthFade*0.1)*230);
          b=Math.floor(base*(1+depthFade*0.3)*240);
        }
        ctx.fillStyle=`rgb(${Math.max(0,r)},${Math.max(0,g)},${Math.max(0,b)})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  function makePoolFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/6,y/6,27);
        // Wet pool tile — blue-green with water shimmer
        const grout = x%8<1||y%8<1;
        const shimmer = (Math.sin(x*0.9)*Math.cos(y*0.7))*0.07;
        const base = grout ? 0.3 : 0.52+n*0.12+shimmer;
        r=Math.floor(base*90);
        g=Math.floor(base*175);
        b=Math.floor(base*195);
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  function makePoolCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/10,y/10,29);
        // High arched ceiling — steel beams, condensation stains
        const beam = x%32<3||y%28<3;
        const rust = beam && fbm(x/3,y/3,31)>0.6;
        const condensation = fbm(x/6,y/6,33)>0.80;
        let r,g,b;
        if(rust){ r=150;g=90;b=70; }
        else if(beam){ r=140;g=145;b=148; }
        else if(condensation){ r=170;g=195;b=200; }
        else{ const base=0.75+n*0.08; r=Math.floor(base*200);g=Math.floor(base*215);b=Math.floor(base*220); }
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // DREAM — dreamcore 1995. Pastel. Soft. The mall at 4am.
  // VHS noise over everything. Wrong colors in the right places.
  // The smell of carpet cleaner and childhood.
  // ═══════════════════════════════════════════════════════════

  function makeDreamWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/12,y/12,35);
        const n2 = fbm(x/5,y/5,37);
        // Pastel gradient — the mall's marble veneer
        // Pink-lilac at top bleeding to cream below
        const depthT = y/SIZE;
        const wave = Math.sin(x*0.4+y*0.2)*0.04;
        const base = 0.68+n*0.1+wave;
        // Marble vein
        const vein = Math.abs(Math.sin((x+y)*0.15+n2*3))<0.04;
        let r,g,b;
        if(vein){ r=210;g=195;b=215; }
        else {
          r=Math.floor(base*(235-depthT*20));
          g=Math.floor(base*(215-depthT*15));
          b=Math.floor(base*(230-depthT*10));
        }
        ctx.fillStyle=`rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  function makeDreamFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/8,y/8,39);
        // Pink/cream marble floor tile with reflection shimmer
        const tX=Math.floor(x/16),tY=Math.floor(y/16);
        const checker=(tX+tY)%2;
        const grout=x%16<1||y%16<1;
        const shine=fbm(x/3,y/3,41)*0.12;
        const grime=fbm(x/6,y/6,43)*0.1;
        let r,g,b;
        if(grout){ r=180;g=165;b=175; }
        else {
          const base=(checker?0.82:0.70)+n*0.06+shine-grime;
          r=Math.floor(base*245);
          g=Math.floor(base*225);
          b=Math.floor(base*235);
        }
        ctx.fillStyle=`rgb(${Math.min(255,r)},${Math.min(255,g)},${Math.min(255,b)})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  function makeDreamCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/10,y/10,45);
        const grid=x%16===0||y%16===0;
        // Dropped ceiling in pastel lilac — those strange 90s mall ceilings
        const skylight=(x>6&&x<10&&y>6&&y<10)||(x>22&&x<26&&y>22&&y<26);
        let r,g,b;
        if(skylight){ r=255;g=248;b=255; }
        else if(grid){ r=185;g=175;b=195; }
        else{ const base=0.82+n*0.05; r=Math.floor(base*235);g=Math.floor(base*220);b=Math.floor(base*240); }
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // CIRCUS — The Amazing Digital Circus.
  // Bright striped canvas. Corrupted. The colors are too much.
  // Glitch artifacts at the seams. Caine is watching.
  // ═══════════════════════════════════════════════════════════

  function makeCircusWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x,y,47);
        // Diagonal circus stripes — red/white/yellow/purple cycling
        const stripe = Math.floor((x+y)/8) % 4;
        const corruptSeed = noise(x*0.5,y*0.5,49);
        const corrupt = corruptSeed > 0.90; // glitch scanline
        let r,g,b;
        if(corrupt){ r=255;g=Math.floor(n*80);b=Math.floor(n*80); }
        else switch(stripe){
          case 0: r=Math.floor((0.75+n*0.1)*220);g=Math.floor((0.25+n*0.08)*90); b=Math.floor((0.2+n*0.05)*75);  break; // red
          case 1: r=Math.floor((0.90+n*0.06)*240);g=Math.floor((0.88+n*0.06)*235);b=Math.floor((0.82+n*0.05)*225); break; // white
          case 2: r=Math.floor((0.88+n*0.07)*238);g=Math.floor((0.72+n*0.08)*195);b=Math.floor((0.15+n*0.05)*60);  break; // yellow
          case 3: r=Math.floor((0.40+n*0.08)*140);g=Math.floor((0.20+n*0.06)*80); b=Math.floor((0.55+n*0.10)*180); break; // purple
        }
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  function makeCircusFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x,y,51);
        // Dark sawdust floor with glitch pixels
        const corrupt = noise(x*1.5,y*1.5,53)>0.92;
        const checker=(Math.floor(x/8)+Math.floor(y/8))%2;
        let r,g,b;
        if(corrupt){ r=255;g=0;b=Math.floor(n*200); }
        else{
          const base=checker?0.18:0.12;
          r=Math.floor((base+n*0.06)*90);
          g=Math.floor((base*0.6+n*0.04)*55);
          b=Math.floor((base+n*0.08)*110);
        }
        ctx.fillStyle=`rgb(${r},${g},${b})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  function makeCircusCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x,y,55);
        // Inside of big top — radial stripes converging at center
        const cx=SIZE/2, cy=SIZE/2;
        const angle=Math.atan2(y-cy,x-cx);
        const stripe=Math.floor((angle/(Math.PI*2)+1)*8)%2;
        const dist=Math.sqrt((x-cx)**2+(y-cy)**2)/SIZE;
        const corrupt=noise(x*0.8,y*0.8,57)>0.88;
        let r,g,b;
        if(corrupt){ r=200;g=50;b=255; }
        else if(stripe){
          r=Math.floor((0.85+n*0.08-dist*0.3)*230);
          g=Math.floor((0.72+n*0.06-dist*0.3)*195);
          b=Math.floor((0.18+n*0.05)*65);
        } else {
          r=Math.floor((0.72+n*0.08-dist*0.3)*200);
          g=Math.floor((0.15+n*0.05)*55);
          b=Math.floor((0.15+n*0.04)*50);
        }
        ctx.fillStyle=`rgb(${Math.max(0,Math.min(255,r))},${Math.max(0,Math.min(255,g))},${Math.max(0,Math.min(255,b))})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // VOID — the space between. Pure dark.
  // ═══════════════════════════════════════════════════════════

  function makeVoidWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = fbm(x/4,y/4,59);
        ctx.fillStyle=`rgb(${Math.floor(n*30)},${Math.floor(n*40)},${Math.floor(n*55)})`;
        ctx.fillRect(x,y,1,1);
      }
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // DOOR — institutional painted door. Opens into wrong rooms.
  // ═══════════════════════════════════════════════════════════

  function makeDoor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle='#c8c4b0'; ctx.fillRect(0,0,SIZE,SIZE);
    // frame
    ctx.fillStyle='#88836e'; ctx.fillRect(0,0,4,SIZE); ctx.fillRect(SIZE-4,0,4,SIZE);
    ctx.fillStyle='#88836e'; ctx.fillRect(0,0,SIZE,3);
    // upper panel
    ctx.fillStyle='#b8b49e'; ctx.fillRect(6,5,SIZE-12,(SIZE/2)-8);
    // lower panel
    ctx.fillStyle='#b8b49e'; ctx.fillRect(6,SIZE/2+2,SIZE-12,(SIZE/2)-10);
    // handle
    ctx.fillStyle='#8a7440';
    ctx.beginPath(); ctx.arc(SIZE-10,SIZE/2,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#6a5830';
    ctx.fillRect(SIZE-10,SIZE/2-8,2,16);
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // EXIT DOOR — glowing teal. The only honest thing here.
  // ═══════════════════════════════════════════════════════════

  function makeExitDoor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle='#040d0d'; ctx.fillRect(0,0,SIZE,SIZE);
    ctx.fillStyle='#0d2e2e'; ctx.fillRect(3,3,SIZE-6,SIZE-6);
    ctx.fillStyle='#7acec8';
    ctx.fillRect(3,3,SIZE-6,2); ctx.fillRect(3,SIZE-5,SIZE-6,2);
    ctx.fillRect(3,3,2,SIZE-6); ctx.fillRect(SIZE-5,3,2,SIZE-6);
    ctx.fillStyle='rgba(122,206,200,0.9)';
    ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText('EXIT',SIZE/2,SIZE/2+4);
    for(let i=0;i<6;i++){
      ctx.beginPath(); ctx.arc(8+i*9,SIZE-14,2,0,Math.PI*2);
      ctx.fillStyle=i%2===0?'#7acec8':'#c8b96e'; ctx.fill();
    }
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // PLACEHOLDER — magenta wireframe cube. YOU will replace this.
  // ═══════════════════════════════════════════════════════════

  function makePlaceholder() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle='#0a0015'; ctx.fillRect(0,0,SIZE,SIZE);
    ctx.strokeStyle='#ff00ff'; ctx.lineWidth=2;
    ctx.strokeRect(2,2,SIZE-4,SIZE-4);
    ctx.beginPath();
    ctx.moveTo(2,2); ctx.lineTo(SIZE-2,SIZE-2);
    ctx.moveTo(SIZE-2,2); ctx.lineTo(2,SIZE-2);
    ctx.stroke();
    ctx.fillStyle='#ff00ff';
    ctx.beginPath(); ctx.arc(SIZE/2,SIZE/2,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffff00'; ctx.font='bold 7px monospace'; ctx.textAlign='center';
    ctx.fillText('ASSET',SIZE/2,SIZE/2+20);
    return c;
  }

  // ═══════════════════════════════════════════════════════════
  // ENTITY — the black figure. Always been there.
  // ═══════════════════════════════════════════════════════════

  function makeEntity() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.clearRect(0,0,SIZE,SIZE);
    ctx.fillStyle='#050508';
    ctx.beginPath(); ctx.ellipse(SIZE/2,10,8,9,0,0,Math.PI*2); ctx.fill();
    ctx.fillRect(SIZE/2-7,18,14,24);
    ctx.fillRect(SIZE/2-16,20,9,3); ctx.fillRect(SIZE/2+7,20,9,3);
    ctx.fillRect(SIZE/2-7,42,5,14); ctx.fillRect(SIZE/2+2,42,5,14);
    return c;
  }

  return {
    backroomsWall:    makeBackroomsWall(),
    backroomsFloor:   makeBackroomsFloor(),
    backroomsCeiling: makeBackroomsCeiling(),
    schoolWall:       makeSchoolWall(),
    schoolFloor:      makeSchoolFloor(),
    schoolCeiling:    makeSchoolCeiling(),
    poolWall:         makePoolWall(),
    poolFloor:        makePoolFloor(),
    poolCeiling:      makePoolCeiling(),
    dreamWall:        makeDreamWall(),
    dreamFloor:       makeDreamFloor(),
    dreamCeiling:     makeDreamCeiling(),
    circusWall:       makeCircusWall(),
    circusFloor:      makeCircusFloor(),
    circusCeiling:    makeCircusCeiling(),
    voidWall:         makeVoidWall(),
    voidFloor:        makeVoidWall(),
    door:             makeDoor(),
    exitDoor:         makeExitDoor(),
    placeholder:      makePlaceholder(),
    entity:           makeEntity(),
  };
})();
