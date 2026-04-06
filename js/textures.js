// textures.js — All textures drawn procedurally on offscreen canvases
// New zones: hallway, classroom, pool, mall, hospital
// + placeholder cube texture for asset slots

const TextureLib = (() => {
  const SIZE = 64;

  function makeCanvas() {
    const c = document.createElement('canvas');
    c.width = SIZE; c.height = SIZE;
    return c;
  }

  function noise(x, y, seed = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.3) * 43758.5453;
    return n - Math.floor(n);
  }

  // ── SCHOOL HALLWAY ─────────────────────────────────────────
  // Pale institutional green / cream walls, linoleum floor
  function makeHallwayWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 2);
        const stripe = y < SIZE * 0.55; // upper: cream, lower: green wainscoting
        const base = stripe ? 0.82 + n * 0.06 : 0.38 + n * 0.05;
        const r = stripe ? Math.floor(base * 218) : Math.floor(base * 140);
        const g = stripe ? Math.floor(base * 210) : Math.floor(base * 175);
        const b = stripe ? Math.floor(base * 185) : Math.floor(base * 140);
        // horizontal dividing stripe
        const divider = (y >= SIZE * 0.53 && y <= SIZE * 0.57);
        ctx.fillStyle = divider ? '#8a7a60' : `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeHallwayFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 4);
        // speckled linoleum
        const tileX = Math.floor(x / 16); const tileY = Math.floor(y / 16);
        const checker = (tileX + tileY) % 2;
        const grout = x % 16 < 1 || y % 16 < 1;
        const base = grout ? 0.3 : (checker ? 0.55 : 0.48) + n * 0.06;
        const r = Math.floor(base * 175);
        const g = Math.floor(base * 168);
        const b = Math.floor(base * 150);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeHallwayCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 6);
        const grid = x % 16 === 0 || y % 16 === 0;
        const base = grid ? 0.55 : 0.78 + n * 0.05;
        const r = Math.floor(base * 220);
        const g = Math.floor(base * 218);
        const b = Math.floor(base * 205);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ── CLASSROOM ──────────────────────────────────────────────
  // Worn plaster walls, scuffed vinyl floor
  function makeClassroomWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 8);
        const n2 = noise(x * 0.3, y * 0.3, 9);
        const plaster = 0.75 + n * 0.08 + n2 * 0.04;
        const scuff = noise(x * 2, y * 2, 10) > 0.88 ? 0.85 : 1.0;
        const r = Math.floor(plaster * scuff * 210);
        const g = Math.floor(plaster * scuff * 200);
        const b = Math.floor(plaster * scuff * 185);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeClassroomFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 12);
        const tileX = Math.floor(x / 16); const tileY = Math.floor(y / 16);
        const checker = (tileX + tileY) % 2;
        const grout = x % 16 < 1 || y % 16 < 1;
        const wear = noise(x * 0.8, y * 0.8, 13) * 0.12;
        const base = grout ? 0.28 : (checker ? 0.6 : 0.5) + n * 0.05 - wear;
        const r = Math.floor(base * 185);
        const g = Math.floor(base * 170);
        const b = Math.floor(base * 145);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeClassroomCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 14);
        const grid = x % 16 === 0 || y % 16 === 0;
        const stain = noise(x * 0.4, y * 0.4, 15) > 0.82;
        const base = grid ? 0.5 : stain ? 0.6 : 0.8 + n * 0.04;
        const r = Math.floor(base * (stain ? 200 : 215));
        const g = Math.floor(base * (stain ? 190 : 210));
        const b = Math.floor(base * (stain ? 170 : 195));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ── POOL ───────────────────────────────────────────────────
  // Tiled walls, wet concrete, aquamarine haze
  function makePoolWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 16);
        const tileX = Math.floor(x / 8); const tileY = Math.floor(y / 8);
        const grout = x % 8 === 0 || y % 8 === 0;
        const moisture = noise(x * 0.5, y * 0.2, 17) * 0.15;
        const base = grout ? 0.4 : 0.72 + n * 0.08 - moisture;
        const r = Math.floor(base * (grout ? 140 : 210));
        const g = Math.floor(base * (grout ? 160 : 230));
        const b = Math.floor(base * (grout ? 165 : 235));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makePoolFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 18);
        const ripple = (Math.sin(x * 0.8) * Math.cos(y * 0.6)) * 0.06;
        const grout = x % 8 < 1 || y % 8 < 1;
        const base = grout ? 0.3 : 0.55 + n * 0.1 + ripple;
        const r = Math.floor(base * 120);
        const g = Math.floor(base * 180);
        const b = Math.floor(base * 195);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makePoolCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 20);
        // steel beam structure
        const beam = (x % 32 < 3 || y % 32 < 3);
        const rust = noise(x * 0.6, y * 0.6, 21) > 0.80 && beam;
        const base = beam ? 0.35 : 0.65 + n * 0.05;
        const r = Math.floor(base * (rust ? 180 : 190));
        const g = Math.floor(base * (rust ? 120 : 200));
        const b = Math.floor(base * (rust ? 100 : 210));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ── ABANDONED MALL ─────────────────────────────────────────
  // Dark marbled tile, faded signage colors
  function makeMallWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 22);
        const n2 = noise(x * 0.2, y * 0.2, 23);
        const vein = n2 > 0.72 && n2 < 0.75;
        const base = vein ? 0.25 : 0.4 + n * 0.08;
        const fade = noise(x * 1.5, y * 1.5, 24) > 0.9 ? 0.75 : 1.0;
        const r = Math.floor(base * fade * 155);
        const g = Math.floor(base * fade * 145);
        const b = Math.floor(base * fade * 130);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeMallFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 26);
        const tileX = Math.floor(x / 16); const tileY = Math.floor(y / 16);
        const checker = (tileX + tileY) % 2;
        const grout = x % 16 < 1 || y % 16 < 1;
        const grime = noise(x * 0.4, y * 0.4, 27) * 0.18;
        const base = grout ? 0.2 : (checker ? 0.48 : 0.38) + n * 0.06 - grime;
        const r = Math.floor(base * 160);
        const g = Math.floor(base * 150);
        const b = Math.floor(base * 135);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeMallCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 28);
        const grid = x % 16 === 0 || y % 16 === 0;
        const crack = noise(x * 1.8, y * 0.6, 29) > 0.88;
        const base = grid ? 0.3 : crack ? 0.25 : 0.45 + n * 0.06;
        const r = Math.floor(base * 130);
        const g = Math.floor(base * 125);
        const b = Math.floor(base * 115);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ── ABANDONED HOSPITAL ─────────────────────────────────────
  // Off-white clinical walls, cracked linoleum
  function makeHospitalWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 30);
        const stain = noise(x * 0.3, y * 0.5, 31) > 0.85;
        const vert = x % 32 < 1;
        const base = vert ? 0.4 : stain ? 0.58 : 0.8 + n * 0.06;
        const yellowish = stain ? 1.0 : 0.0;
        const r = Math.floor((base + yellowish * 0.05) * 200);
        const g = Math.floor((base + yellowish * 0.03) * 198);
        const b = Math.floor(base * 185);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeHospitalFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 32);
        const tileX = Math.floor(x / 12); const tileY = Math.floor(y / 12);
        const checker = (tileX + tileY) % 2;
        const grout = x % 12 < 1 || y % 12 < 1;
        const crack = noise(x * 2, y * 0.8, 33) > 0.92;
        const blood = noise(x * 0.5, y * 0.5, 34) > 0.95;
        let r, g, b;
        if (blood) { r = 80; g = 30; b = 30; }
        else if (crack) { r = 100; g = 98; b = 90; }
        else if (grout) { r = 90; g = 90; b = 85; }
        else {
          const base = (checker ? 0.72 : 0.62) + n * 0.04;
          r = Math.floor(base * 195); g = Math.floor(base * 192); b = Math.floor(base * 180);
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeHospitalCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 36);
        const grid = x % 16 === 0 || y % 16 === 0;
        const water = noise(x * 0.3, y * 0.3, 37) > 0.82;
        const base = grid ? 0.4 : water ? 0.55 : 0.75 + n * 0.05;
        const r = Math.floor(base * (water ? 175 : 200));
        const g = Math.floor(base * (water ? 168 : 198));
        const b = Math.floor(base * (water ? 150 : 185));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ── VOID ───────────────────────────────────────────────────
  function makeVoidWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x * 0.5, y * 0.5, 40);
        const n2 = noise(x * 2, y * 2, 42);
        const base = 0.04 + n * 0.08 + n2 * 0.02;
        ctx.fillStyle = `rgb(${Math.floor(base*35)},${Math.floor(base*50)},${Math.floor(base*65)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // ── DOOR TEXTURE ───────────────────────────────────────────
  function makeExitDoor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = '#0a1a1a';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#1a4040';
    ctx.fillRect(4, 4, SIZE-8, SIZE-8);
    ctx.fillStyle = '#7acec8';
    ctx.fillRect(4, 4, SIZE-8, 2);
    ctx.fillRect(4, SIZE-6, SIZE-8, 2);
    ctx.fillRect(4, 4, 2, SIZE-8);
    ctx.fillRect(SIZE-6, 4, 2, SIZE-8);
    ctx.fillStyle = 'rgba(122,206,200,0.9)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', SIZE/2, SIZE/2+4);
    return c;
  }

  // ── DOOR (walkthrough) ─────────────────────────────────────
  // Painted institutional door — slightly different per zone
  function makeDoor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    // Door body — cream
    ctx.fillStyle = '#d4cfc0';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Door frame
    ctx.fillStyle = '#9a9080';
    ctx.fillRect(0, 0, 3, SIZE);
    ctx.fillRect(SIZE-3, 0, 3, SIZE);
    ctx.fillRect(0, 0, SIZE, 3);
    // Door panel inset top
    ctx.fillStyle = '#bfbaa8';
    ctx.fillRect(6, 6, SIZE-12, (SIZE/2)-8);
    // Door panel inset bottom
    ctx.fillRect(6, SIZE/2+2, SIZE-12, (SIZE/2)-10);
    // Handle
    ctx.fillStyle = '#8a7840';
    ctx.beginPath();
    ctx.arc(SIZE-12, SIZE/2, 3, 0, Math.PI*2);
    ctx.fill();
    return c;
  }

  // ── PLACEHOLDER CUBE ───────────────────────────────────────
  // A bright magenta/yellow labelled cube so you can see it clearly.
  // Replace this sprite with your real asset texture when ready.
  function makePlaceholder() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    // Wireframe-ish cube face
    ctx.fillStyle = '#1a0030';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Bright border
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, SIZE-4, SIZE-4);
    // Cross diagonals
    ctx.beginPath();
    ctx.moveTo(2, 2); ctx.lineTo(SIZE-2, SIZE-2);
    ctx.moveTo(SIZE-2, 2); ctx.lineTo(2, SIZE-2);
    ctx.stroke();
    // Center dot
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, 4, 0, Math.PI*2);
    ctx.fill();
    // Label "ASSET"
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ASSET', SIZE/2, SIZE/2+18);
    return c;
  }

  // ── ENTITY ─────────────────────────────────────────────────
  function makeEntity() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#050508';
    ctx.beginPath();
    ctx.ellipse(SIZE/2, 10, 8, 9, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillRect(SIZE/2-7, 18, 14, 24);
    ctx.fillRect(SIZE/2-16, 20, 9, 3);
    ctx.fillRect(SIZE/2+7, 20, 9, 3);
    ctx.fillRect(SIZE/2-7, 42, 5, 14);
    ctx.fillRect(SIZE/2+2, 42, 5, 14);
    return c;
  }

  return {
    hallwayWall:      makeHallwayWall(),
    hallwayFloor:     makeHallwayFloor(),
    hallwayCeiling:   makeHallwayCeiling(),
    classroomWall:    makeClassroomWall(),
    classroomFloor:   makeClassroomFloor(),
    classroomCeiling: makeClassroomCeiling(),
    poolWall:         makePoolWall(),
    poolFloor:        makePoolFloor(),
    poolCeiling:      makePoolCeiling(),
    mallWall:         makeMallWall(),
    mallFloor:        makeMallFloor(),
    mallCeiling:      makeMallCeiling(),
    hospitalWall:     makeHospitalWall(),
    hospitalFloor:    makeHospitalFloor(),
    hospitalCeiling:  makeHospitalCeiling(),
    voidWall:         makeVoidWall(),
    voidFloor:        makeVoidWall(),
    exitDoor:         makeExitDoor(),
    door:             makeDoor(),
    placeholder:      makePlaceholder(),
    entity:           makeEntity(),
  };
})();
