// world.js — 128×128 map, all zones connected, pool + office rooms

const ZONE = {
  BACKROOMS: 'backrooms',
  OFFICE:    'office',
  POOL:      'pool',
  DREAM:     'dream',
  TADC:      'tadc',
  VOID:      'void',
};

const CELL = {
  EMPTY: 0,
  WALL:  1,
  EXIT:  2,
};

const MAP_SIZE = 128;

function buildMap() {
  const M = [];
  for (let y = 0; y < MAP_SIZE; y++) M[y] = new Array(MAP_SIZE).fill(CELL.WALL);

  // ── helpers ──────────────────────────────────────────────────
  function carve(x, y) {
    if (x > 0 && x < MAP_SIZE-1 && y > 0 && y < MAP_SIZE-1) M[y][x] = CELL.EMPTY;
  }
  function rect(x1, y1, x2, y2) {
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++) carve(x, y);
  }
  function hwall(x1, x2, y, skip = []) {
    for (let x = x1; x <= x2; x++)
      if (!skip.includes(x)) M[y][x] = CELL.WALL;
  }
  function vwall(x, y1, y2, skip = []) {
    for (let y = y1; y <= y2; y++)
      if (!skip.includes(y)) M[y][x] = CELL.WALL;
  }
  function gap(x, y, w = 2, h = 2) {
    for (let dy = 0; dy < h; dy++)
      for (let dx = 0; dx < w; dx++)
        carve(x + dx, y + dy);
  }

  // ═══════════════════════════════════════════════════════════════
  // ZONE LAYOUT (128×128)
  //
  //   x:  0──55   56──127
  //   y:
  //   0──55   BACKROOMS  |  VOID
  //   56──127  OFFICE     |  DREAM
  //                       |  POOL (sub-zone of dream, x:80-127 y:70-127)
  //                       |  TADC (sub-zone of dream, x:80-127 y:56-70)
  // ═══════════════════════════════════════════════════════════════

  // ── BACKROOMS (x:1–54, y:1–54) ──────────────────────────────
  // Classic yellow maze — large, labyrinthine, lots of samey corridors
  rect(1, 1, 54, 54);

  // Layer 1 — long horizontal dividers with gaps
  const bHwalls = [7, 14, 21, 28, 35, 42, 49];
  bHwalls.forEach(wy => {
    hwall(1, 54, wy, [4,5, 11,12, 18,19, 25,26, 33,34, 40,41, 48,49]);
  });

  // Layer 2 — vertical dividers
  const bVwalls = [9, 18, 27, 36, 45];
  bVwalls.forEach(wx => {
    vwall(wx, 1, 54, [4,5, 11,12, 19,20, 27,28, 35,36, 43,44, 50,51]);
  });

  // Extra backrooms rooms — small offices within the maze
  // Room A
  rect(2, 2, 7, 6);   hwall(2,7,6); vwall(7,2,6); M[4][7]=CELL.EMPTY;
  // Room B
  rect(11,2,16,6);    hwall(11,16,6); vwall(16,2,6); M[4][11]=CELL.EMPTY;
  // Room C — big open section
  rect(20,15,34,25);
  hwall(20,34,15); hwall(20,34,25);
  vwall(20,15,25); vwall(34,15,25);
  gap(27,15,2,2); gap(27,25,2,2); gap(20,20,2,2); gap(34,20,2,2);

  // ── VOID CORRIDORS (x:57–126, y:1–54) ───────────────────────
  // Fixed: multiple WIDE corridors criss-crossing — always navigable
  rect(57, 1, 126, 54);

  // Horizontal bands every 8 rows — leave wide gaps (4 tiles)
  for (let wy = 9; wy <= 45; wy += 9) {
    hwall(57, 126, wy, [60,61,62,63, 68,69,70,71, 76,77,78,79, 84,85,86,87, 92,93,94,95, 100,101,102,103, 110,111,112,113, 120,121,122,123]);
  }
  // Vertical bands every 8 cols — leave wide gaps
  for (let vx = 65; vx <= 118; vx += 9) {
    vwall(vx, 1, 54, [4,5,6,7, 13,14,15,16, 22,23,24,25, 31,32,33,34, 40,41,42,43, 49,50,51,52]);
  }

  // Some void chambers — small dark rooms to discover
  rect(59,2,63,7);   // NW void room
  rect(118,2,125,7); // NE void room
  rect(59,47,66,53); // SW void room
  rect(118,47,125,53); // SE void room
  rect(88,22,100,32); // Central void chamber

  // ── OFFICE BACKROOMS (x:1–54, y:57–126) ─────────────────────
  // Grid-like corridors, cubicle rows, 1995 desktops
  rect(1, 57, 54, 126);

  // Main corridors — wide east-west halls
  for (let gy = 63; gy <= 120; gy += 7) {
    hwall(1, 54, gy, [4,5,6, 11,12,13, 18,19,20, 25,26,27, 32,33,34, 39,40,41, 46,47,48]);
  }
  // North-south corridors
  for (let gx = 8; gx <= 48; gx += 8) {
    vwall(gx, 57, 126, [60,61, 67,68, 74,75, 81,82, 88,89, 95,96, 102,103, 109,110, 116,117, 123,124]);
  }

  // Office rooms — enclosed cubicle clusters
  // Cluster A
  rect(2,58,6,62);   M[60][6]=CELL.EMPTY;
  rect(2,65,6,69);   M[67][6]=CELL.EMPTY;
  rect(2,72,6,76);   M[74][6]=CELL.EMPTY;
  // Cluster B
  rect(10,58,16,62); M[60][16]=CELL.EMPTY;
  rect(10,65,16,69); M[67][16]=CELL.EMPTY;
  // Big open office floor
  rect(18,80,54,100);
  hwall(18,54,80); hwall(18,54,100);
  vwall(18,80,100); vwall(54,80,100);
  // Internal cubicle dividers
  for (let cx = 22; cx <= 50; cx += 4) vwall(cx, 81, 99, [85,86,92,93]);
  for (let cy = 84; cy <= 96; cy += 4) hwall(19, 53, cy, [22,23,26,27,30,31,34,35,38,39,42,43,46,47]);
  // Entrance to big office
  gap(18,89,2,4); gap(35,80,2,2); gap(35,100,2,2);

  // Server room
  rect(2,105,12,115);
  hwall(2,12,105); hwall(2,12,115); vwall(2,105,115); vwall(12,105,115);
  gap(7,105,2,2);
  for (let sx = 3; sx <= 11; sx += 2) vwall(sx, 106, 114, [109,110]);

  // ── DREAM ZONE (x:57–126, y:57–126) — pastel open halls ─────
  rect(57, 57, 126, 126);

  // Dreamcore: pillared halls — open spaces with regular columns
  for (let px = 60; px <= 124; px += 5)
    for (let py = 60; py <= 124; py += 5)
      M[py][px] = CELL.WALL;

  // Clear pillar-free areas for special rooms
  rect(57,57,80,70);   // clear NW dream entrance
  rect(100,57,126,70); // clear NE (TADC area)
  rect(57,100,80,126); // clear SW dream (pool approach)
  rect(100,100,126,126); // clear SE (pool room)

  // ── POOL ROOM (x:88–126, y:90–126) ──────────────────────────
  // Abandoned school swimming pool
  rect(88, 90, 126, 126);
  // Outer walls of pool room
  hwall(88,126,90); hwall(88,126,126);
  vwall(88,90,126); vwall(126,90,126);
  // Pool entrances
  gap(97,90,4,2); gap(115,90,4,2); gap(88,108,2,4);

  // The pool basin — sunken area represented by wall ring
  hwall(92,122,94); hwall(92,122,120);
  vwall(92,94,120); vwall(122,94,120);
  // Pool gaps — walkway around it
  gap(96,94,4,2); gap(110,94,4,2);
  gap(96,120,4,2); gap(110,120,4,2);
  gap(92,98,2,4); gap(92,108,2,4); gap(92,115,2,4);
  gap(122,98,2,4); gap(122,108,2,4); gap(122,115,2,4);
  // Pool interior (walkable — the water is dry)
  rect(93,95,121,119);
  // Pool drain / centre feature
  M[107][107] = CELL.WALL; M[107][108] = CELL.WALL;
  M[108][107] = CELL.WALL; M[108][108] = CELL.WALL;
  // Bleacher rows (walls with gaps)
  hwall(93,103,97,[95,96,99,100]); hwall(93,103,99,[95,96,99,100]);
  hwall(93,103,112,[95,96,99,100]); hwall(93,103,114,[95,96,99,100]);

  // Changing room corridor
  rect(88,90,91,104);

  // ── TADC POCKET (x:100–126, y:57–88) ────────────────────────
  // Inside dream — glitch circus area
  rect(100,57,126,88);
  hwall(100,126,57); hwall(100,126,88); vwall(100,57,88); vwall(126,57,88);
  gap(110,57,4,2); gap(100,72,2,4); gap(120,57,4,2);
  // Internal circus ring walls
  for (let t = 0; t < 16; t++) {
    const a = (t / 16) * Math.PI * 2;
    const cx = Math.round(113 + Math.cos(a) * 9);
    const cy = Math.round(72  + Math.sin(a) * 8);
    if (cx > 101 && cx < 125 && cy > 58 && cy < 87) M[cy][cx] = CELL.WALL;
  }

  // ── ZONE CONNECTORS ──────────────────────────────────────────

  // BACKROOMS → VOID (east wall, x=55-56, multiple y)
  for (const cy of [10,20,30,40,50]) {
    gap(54,cy,4,3);
  }

  // BACKROOMS → OFFICE (south wall, y=55-56, multiple x)
  for (const cx of [10,20,30,40,50]) {
    gap(cx,54,3,4);
  }

  // VOID → DREAM (south wall y=55-56)
  for (const cx of [62,72,82,92,102,112,122]) {
    gap(cx,54,3,4);
  }

  // OFFICE → DREAM (east wall x=55-56)
  for (const cy of [62,72,82,92,102,112,122]) {
    gap(54,cy,4,3);
  }

  // DREAM → POOL (pool entrance gaps already punched above)

  // DREAM → TADC (TADC entrance gaps already punched above)

  // ── OUTER BORDER ─────────────────────────────────────────────
  for (let i = 0; i < MAP_SIZE; i++) {
    M[0][i] = CELL.WALL; M[MAP_SIZE-1][i] = CELL.WALL;
    M[i][0] = CELL.WALL; M[i][MAP_SIZE-1] = CELL.WALL;
  }

  // ── ZONE BORDER WALLS (sealed) ────────────────────────────────
  vwall(55, 1, 54);  vwall(56, 1, 54);   // backrooms/void border
  hwall(1, 54, 55);  hwall(1, 54, 56);   // backrooms/office border
  hwall(57,126, 55); hwall(57,126, 56);  // void/dream border
  vwall(55,57,126);  vwall(56,57,126);   // office/dream border

  // Re-punch all connectors after sealing
  for (const cy of [10,20,30,40,50]) { gap(53,cy,4,3); }
  for (const cx of [10,20,30,40,50]) { gap(cx,53,3,4); }
  for (const cx of [62,72,82,92,102,112,122]) { gap(cx,53,3,4); }
  for (const cy of [62,72,82,92,102,112,122]) { gap(53,cy,4,3); }

  // ── EXIT ─────────────────────────────────────────────────────
  // Bottom of the pool room — south wall
  rect(110,122,116,125);
  M[124][113] = CELL.EXIT;

  return M;
}

const worldMap = buildMap();

// ── Zone classification ────────────────────────────────────────
function getZone(tx, ty) {
  // Sub-zones first (more specific)
  if (tx >= 88 && tx <= 127 && ty >= 90 && ty <= 127) return ZONE.POOL;
  if (tx >= 100 && tx <= 127 && ty >= 57 && ty <= 88)  return ZONE.TADC;
  if (tx >= 57 && ty >= 57)  return ZONE.DREAM;
  if (tx >= 57 && ty <  57)  return ZONE.VOID;
  if (tx <  57 && ty >= 57)  return ZONE.OFFICE;
  return ZONE.BACKROOMS;
}

function getZoneTextures(zone) {
  switch (zone) {
    case ZONE.BACKROOMS: return { wall:'backroomsWall', floor:'backroomsFloor', ceiling:'backroomsCeiling', fogColor:[200,185,100], fogDist:13 };
    case ZONE.OFFICE:    return { wall:'officeWall',    floor:'officeFloor',    ceiling:'officeCeiling',    fogColor:[140,150,135], fogDist:14 };
    case ZONE.POOL:      return { wall:'poolWall',      floor:'poolFloor',      ceiling:'poolCeiling',      fogColor:[80,120,130],  fogDist:18 };
    case ZONE.DREAM:     return { wall:'dreamWall',     floor:'dreamFloor',     ceiling:'dreamCeiling',     fogColor:[230,190,220], fogDist:18 };
    case ZONE.TADC:      return { wall:'tadcWall',      floor:'tadcFloor',      ceiling:'tadcCeiling',      fogColor:[60,20,50],    fogDist:9  };
    case ZONE.VOID:
    default:             return { wall:'voidWall',      floor:'voidFloor',      ceiling:'voidCeiling',      fogColor:[8,12,18],     fogDist:8  };
  }
}

function getZoneName(zone) {
  switch (zone) {
    case ZONE.BACKROOMS: return 'LEVEL 0 — THE LOBBY';
    case ZONE.VOID:      return 'THE VOID BETWEEN';
    case ZONE.OFFICE:    return 'LEVEL 1 — HABITABLE ZONE';
    case ZONE.POOL:      return 'THE ABANDONED POOL';
    case ZONE.DREAM:     return 'THE DREAM CORRIDOR';
    case ZONE.TADC:      return 'THE DIGITAL CIRCUS';
    default:             return '';
  }
}

// ── Sprites ────────────────────────────────────────────────────
const SPRITES = [
  // Entity — lurking in the void
  {
    x: 85.5, y: 28.5,
    texture: 'entity', type: 'entity',
    hint: "keep going south-east. where the tiles turn wet and the lights go blue. the exit breathes at the bottom of the pool."
  },
  // 1995 desktop computers in the office
  { x: 3.5,  y: 60.5, texture: 'desktop', type: 'prop' },
  { x: 3.5,  y: 67.5, texture: 'desktop', type: 'prop' },
  { x: 3.5,  y: 74.5, texture: 'desktop', type: 'prop' },
  { x: 13.5, y: 60.5, texture: 'desktop', type: 'prop' },
  { x: 13.5, y: 67.5, texture: 'desktop', type: 'prop' },
  { x: 22.5, y: 85.5, texture: 'desktop', type: 'prop' },
  { x: 26.5, y: 85.5, texture: 'desktop', type: 'prop' },
  { x: 30.5, y: 85.5, texture: 'desktop', type: 'prop' },
  { x: 34.5, y: 85.5, texture: 'desktop', type: 'prop' },
  { x: 38.5, y: 85.5, texture: 'desktop', type: 'prop' },
  { x: 42.5, y: 85.5, texture: 'desktop', type: 'prop' },
  { x: 22.5, y: 95.5, texture: 'desktop', type: 'prop' },
  { x: 26.5, y: 95.5, texture: 'desktop', type: 'prop' },
  { x: 30.5, y: 95.5, texture: 'desktop', type: 'prop' },
  { x: 34.5, y: 95.5, texture: 'desktop', type: 'prop' },
  // Pool — lane dividers (visual markers)
  { x: 97.5, y: 107.5, texture: 'poolLane', type: 'prop' },
  { x: 103.5, y: 107.5, texture: 'poolLane', type: 'prop' },
  { x: 109.5, y: 107.5, texture: 'poolLane', type: 'prop' },
  { x: 115.5, y: 107.5, texture: 'poolLane', type: 'prop' },
];

const PLAYER_START = { x: 2.5, y: 2.5, angle: 0.3 };
