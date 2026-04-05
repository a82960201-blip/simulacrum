// textures.js — All textures drawn procedurally on offscreen canvases

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

  // Backrooms classic — sickly yellow carpet / wallpaper
  function makeBackroomsWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 1);
        const stripe = Math.floor((y / SIZE) * 4);
        const stripeNoise = noise(x, stripe, 3) * 0.15;
        const base = 0.55 + n * 0.12 + stripeNoise;
        // wallpaper pattern
        const wx = (x % 16) / 16;
        const wy = (y % 24) / 24;
        const pattern = (Math.sin(wx * Math.PI) * Math.sin(wy * Math.PI)) * 0.08;
        const r = Math.floor((0.78 + base * 0.1 + pattern) * 210);
        const g = Math.floor((0.68 + base * 0.1 + pattern) * 190);
        const b = Math.floor((0.25 + base * 0.05) * 100);
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
        const n = noise(x, y, 5);
        // carpet tiles pattern
        const tileX = Math.floor(x / 8) % 2;
        const tileY = Math.floor(y / 8) % 2;
        const tile = (tileX + tileY) % 2;
        const base = tile ? 0.45 : 0.38;
        const r = Math.floor((base + n * 0.08) * 200);
        const g = Math.floor((base * 0.88 + n * 0.06) * 180);
        const b = Math.floor((base * 0.32 + n * 0.04) * 80);
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
        // ceiling tile grid
        const gx = x % 16 === 0 || y % 16 === 0;
        const base = gx ? 0.55 : 0.75 + n * 0.05;
        const r = Math.floor(base * 220);
        const g = Math.floor(base * 218);
        const b = Math.floor(base * 200);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // Office backrooms — grey concrete / carpet
  function makeOfficeWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 9);
        const vert = x % 16 === 0;
        const horiz = y % 16 === 0;
        const base = (vert || horiz) ? 0.35 : 0.52 + n * 0.08;
        const tint = noise(x / 8, y / 8, 11) * 0.05;
        const r = Math.floor((base + tint) * 160);
        const g = Math.floor((base + tint * 0.5) * 165);
        const b = Math.floor((base + tint * 0.2) * 155);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeOfficeFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 13);
        const tileX = Math.floor(x / 16);
        const tileY = Math.floor(y / 16);
        const checker = (tileX + tileY) % 2;
        const grout = (x % 16 < 1 || y % 16 < 1);
        const base = grout ? 0.3 : (checker ? 0.72 : 0.62) + n * 0.04;
        const r = Math.floor(base * 190);
        const g = Math.floor(base * 185);
        const b = Math.floor(base * 175);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // Dreamcore surreal — pastel pink haze walls
  function makeDreamWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x * 0.3, y * 0.3, 17);
        const n2 = noise(x * 0.7, y * 0.7, 19);
        const wave = Math.sin((x + y) * 0.4) * 0.05;
        const base = 0.65 + n * 0.15 + wave;
        const r = Math.floor((base + n2 * 0.1) * 230);
        const g = Math.floor((base * 0.75 + n * 0.08) * 195);
        const b = Math.floor((base * 0.8 + n2 * 0.05) * 210);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeDreamFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x * 0.5, y * 0.5, 21);
        const checkerSize = 8;
        const checker = (Math.floor(x / checkerSize) + Math.floor(y / checkerSize)) % 2;
        const base = checker ? 0.85 + n * 0.05 : 0.7 + n * 0.05;
        const r = Math.floor(base * 240);
        const g = Math.floor((base * 0.85 + n * 0.05) * 215);
        const b = Math.floor((base * 0.9 + n * 0.03) * 230);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeDreamCeiling() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x * 0.2, y * 0.2, 23);
        // cloud-like soft ceiling
        const blob = (Math.sin(x * 0.3) + Math.cos(y * 0.3)) * 0.1;
        const base = 0.8 + n * 0.1 + blob;
        const r = Math.floor(Math.min(base * 245, 255));
        const g = Math.floor(Math.min((base * 0.88) * 230, 255));
        const b = Math.floor(Math.min(base * 250, 255));
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // TADC-inspired — glitchy circus colors, geometric
  function makeTADCWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 29);
        const stripe = Math.floor(y / 8) % 3;
        let r, g, b;
        if (stripe === 0) {
          r = Math.floor((0.55 + n * 0.1) * 200); g = Math.floor((0.35 + n * 0.08) * 130); b = Math.floor((0.25 + n * 0.06) * 100);
        } else if (stripe === 1) {
          r = Math.floor((0.7 + n * 0.1) * 240); g = Math.floor((0.62 + n * 0.08) * 210); b = Math.floor((0.3 + n * 0.05) * 110);
        } else {
          r = Math.floor((0.4 + n * 0.08) * 140); g = Math.floor((0.25 + n * 0.06) * 100); b = Math.floor((0.5 + n * 0.1) * 180);
        }
        // glitch scanline every so often
        if (y % 19 < 1 && n > 0.7) { r = 255; g = 80; b = 80; }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function makeTADCFloor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x, y, 31);
        const stripe = (Math.floor(x / 4) + Math.floor(y / 4)) % 2;
        const base = stripe ? 0.15 : 0.08;
        const r = Math.floor((base + n * 0.05) * 80);
        const g = Math.floor((base * 0.5 + n * 0.03) * 50);
        const b = Math.floor((base + n * 0.08) * 100);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // Void / corridor texture
  function makeVoidWall() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const n = noise(x * 0.5, y * 0.5, 33);
        const n2 = noise(x * 2, y * 2, 35);
        const base = 0.05 + n * 0.1 + n2 * 0.03;
        const r = Math.floor(base * 40);
        const g = Math.floor(base * 60);
        const b = Math.floor(base * 80);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // Exit door — glowing teal
  function makeExitDoor() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = '#0a1a1a';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // door frame
    ctx.fillStyle = '#1a4040';
    ctx.fillRect(4, 4, SIZE - 8, SIZE - 8);
    ctx.fillStyle = '#7acec8';
    ctx.fillRect(4, 4, SIZE - 8, 2);
    ctx.fillRect(4, SIZE - 6, SIZE - 8, 2);
    ctx.fillRect(4, 4, 2, SIZE - 8);
    ctx.fillRect(SIZE - 6, 4, 2, SIZE - 8);
    // EXIT text
    ctx.fillStyle = 'rgba(122,206,200,0.9)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', SIZE / 2, SIZE / 2 + 4);
    // glow dots
    for (let i = 0; i < 6; i++) {
      const bx = 8 + i * 8;
      const by = SIZE - 14;
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#7acec8' : '#c8b96e';
      ctx.fill();
    }
    return c;
  }

  // Entity texture — black figure silhouette
  function makeEntity() {
    const c = makeCanvas(), ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // body silhouette
    ctx.fillStyle = '#050508';
    // head
    ctx.beginPath();
    ctx.ellipse(SIZE / 2, 10, 8, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // body
    ctx.fillRect(SIZE / 2 - 7, 18, 14, 24);
    // arms
    ctx.fillRect(SIZE / 2 - 16, 20, 9, 3);
    ctx.fillRect(SIZE / 2 + 7, 20, 9, 3);
    // legs
    ctx.fillRect(SIZE / 2 - 7, 42, 5, 14);
    ctx.fillRect(SIZE / 2 + 2, 42, 5, 14);
    // subtle glow behind
    ctx.shadowColor = 'rgba(122,206,200,0.3)';
    ctx.shadowBlur = 10;
    return c;
  }

  return {
    backroomsWall: makeBackroomsWall(),
    backroomsFloor: makeBackroomsFloor(),
    backroomsCeiling: makeBackroomsCeiling(),
    officeWall: makeOfficeWall(),
    officeFloor: makeOfficeFloor(),
    officeCeiling: makeBackroomsCeiling(), // reuse
    dreamWall: makeDreamWall(),
    dreamFloor: makeDreamFloor(),
    dreamCeiling: makeDreamCeiling(),
    tadcWall: makeTADCWall(),
    tadcFloor: makeTADCFloor(),
    tadcCeiling: makeBackroomsCeiling(),
    voidWall: makeVoidWall(),
    voidFloor: makeVoidWall(),
    voidCeiling: makeVoidWall(),
    exitDoor: makeExitDoor(),
    entity: makeEntity(),
  };
})();
