// ============================================================
//  WORLD.JS — Infinite procedural world generator
// ============================================================

const WORLD = (() => {
  const VOID_FLOOR  = 1500;
  const WORLD_LEFT  = 0;
  const WORLD_TOP   = -2000; // Raised for chaos
  const CHUNK_W     = 1600;

  const MIN_X_GAP        = 100;   // Increased to reduce platform clumping
  const MAX_X_GAP        = 200;   // Increased for better spacing
  const MIN_Y_SEP        = 10;
  const MAX_Y_SEP        = 120;
  const BRIDGE_GAP_LIMIT = 250;   // Only insert a bridge if gap is large enough (no overlaps)
  const BRIDGE_WIDTH     = 160;

  let platforms   = [];
  let springs     = [];
  let orbs        = [];
  let bgFragments = [];
  let generatedUpTo    = 0;
  let chunkIndex       = 0;
  let lastPlatRightEdge = 1000;

  // Track map altitude for chaos
  let targetAltitude = 500;

  function makeFragment(x, y) {
    return { x, y, w: Math.random()*80+8, h: Math.random()*3+1, alpha: Math.random()*0.10+0.02 };
  }
  for (let i = 0; i < 60; i++) {
    bgFragments.push(makeFragment(Math.random()*4000, Math.random()*2200-600));
  }

  function rnd(min, max) { return min + Math.random()*(max-min); }

  function makePlat(x, y, w) {
    return {
      x, y, w,
      h: 22,
      angle: 0,
      rise: 0,
      spawnSlug: false,
      _slugSpawned: false,
    };
  }

  function generateChunk(startX, ci) {
    const newPlats   = [];
    const newSprings = [];
    const newOrbs    = [];

    // CHAOS: 40% chance to jump to a completely new altitude
    if (Math.random() < 0.4) {
        targetAltitude = rnd(200, 700);   // Clamped to sane range, avoids extreme negative Y
    }

    let x = lastPlatRightEdge + rnd(MIN_X_GAP, MAX_X_GAP);
    let y = targetAltitude + Math.sin(ci * 0.8) * 100;
    const numPlats = 5 + Math.floor(Math.random() * 5);

    for (let i = 0; i < numPlats; i++) {
      const wRoll = Math.random();
      let w;
      if (wRoll < 0.10)      w = rnd(500, 750);
      else if (wRoll < 0.30) w = rnd(160, 240);
      else                    w = rnd(280, 460);

      // Vertical shift
      let sign = Math.random() < 0.5 ? -1 : 1;
      const dy = sign * rnd(MIN_Y_SEP, MAX_Y_SEP);
      y = Math.max(-200, Math.min(1000, y + dy)); // Clamp to avoid unreachable platforms

      const plat = makePlat(x, y, w);
      newPlats.push(plat);
      lastPlatRightEdge = x + w;

      if (newPlats.length > 1) {
        const prev = newPlats[newPlats.length - 2];
        const rise = prev.y - y;
        if (rise > 100 || Math.random() < 0.15) {
          const sx = prev.x + prev.w * rnd(0.40, 0.80);
          newSprings.push({ x: sx, y: prev.y });
        }
      }

      if (w > 200 && Math.random() < 0.40) plat.spawnSlug = true;

      if (Math.random() < 0.08) {
        const isMulti  = Math.random() < 0.08;
        const themeIdx = Math.floor(Math.random() * 10);
        newOrbs.push({
          x: x + w * rnd(0.2, 0.8), y: y - rnd(70, 120),
          r: 16, themeIdx, isMulti,
          collected: false, pulse: Math.random() * Math.PI * 2,
        });
      }

      if (Math.random() < 0.12) {
        newOrbs.push({
          x: x + w * rnd(0.15, 0.85), y: y - rnd(60, 100),
          r: 16, powerUp: Math.random() < 0.5 ? 'dash' : 'doublejump',
          collected: false, pulse: Math.random() * Math.PI * 2,
        });
      }
      x += w + rnd(MIN_X_GAP, MAX_X_GAP);
    }

    // FIXED: Bridge logic – only insert if gap is wide enough to avoid overlap
    for (let i = newPlats.length - 1; i > 0; i--) {
      const a = newPlats[i - 1];
      const b = newPlats[i];
      const gapBetween = b.x - (a.x + a.w);
      if (gapBetween > BRIDGE_GAP_LIMIT) {
        const bx = a.x + a.w + (gapBetween - BRIDGE_WIDTH) / 2;
        const by = (a.y + b.y) / 2;
        newPlats.splice(i, 0, makePlat(bx, by, BRIDGE_WIDTH));
      }
    }

    return { newPlats, newSprings, newOrbs };
  }

  function ensureGenerated(upToX) {
    while (generatedUpTo < upToX + CHUNK_W * 5) {
      const { newPlats, newSprings, newOrbs } = generateChunk(generatedUpTo, chunkIndex++);
      platforms.push(...newPlats);
      springs.push(...newSprings);
      orbs.push(...newOrbs);
      generatedUpTo += CHUNK_W;
    }
  }

  function cull(playerX) {
    const cullX = playerX - 3000;
    for (let i = platforms.length-1; i>=0; i--) {
      if (platforms[i].x + platforms[i].w < cullX) platforms.splice(i,1);
    }
    for (let i = springs.length-1; i>=0; i--) {
      if (springs[i].x < cullX) springs.splice(i,1);
    }
    for (let i = orbs.length-1; i>=0; i--) {
      if (orbs[i].x < cullX) orbs.splice(i,1);
    }
  }

  function resetWorld() {
    platforms.length   = 0;
    springs.length     = 0;
    orbs.length        = 0;
    bgFragments.length = 0;
    generatedUpTo      = 0;
    chunkIndex         = 0;
    lastPlatRightEdge  = 1000;
    for (let i = 0; i < 60; i++) {
      bgFragments.push(makeFragment(Math.random()*4000, Math.random()*2200-600));
    }
    platforms.push(makePlat(0, 520, 1500)); 
    ensureGenerated(0);
  }

  resetWorld();

  return {
    platforms, springs, orbs, bgFragments,
    WORLD_LEFT, WORLD_TOP, VOID_FLOOR, CHUNK_W,
    ensureGenerated, cull, 
    updateSafePos: (x, y) => {}, // Disabled as requested
    getSafePos: () => ({ x: 500, y: 460 }), // Always respawn at start
    resetWorld,
    get WORLD_RIGHT() { return generatedUpTo + CHUNK_W; },
  };
})();