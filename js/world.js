// world.js — SIMULACRUM: The world eats itself.
// Five zones bleed into each other. You walk through — no teleport.
// Each room is a different kind of wrong.

const ZONE = {
  BACKROOMS:  'backrooms',   // sickly yellow, hum, wet carpet
  SCHOOL:     'school',      // liminal hallway + classrooms — summer, empty
  POOL:       'pool',        // poolrooms — the deep still water
  DREAM:      'dream',       // dreamcore 1995 — pastel, soft, suffocating
  CIRCUS:     'circus',      // digital circus — bright, broken, wrong
  VOID:       'void',        // between things
};

const CELL = {
  EMPTY: 0,
  WALL:  1,
  DOOR:  2,   // walkthrough — renders as door, passable
  EXIT:  3,   // the way out (if there is one)
};

// ─────────────────────────────────────────────────────────────
// MAP — 96 × 96 tiles
// Rooms bleed into each other the way dreams do.
// ─────────────────────────────────────────────────────────────

const MAP_SIZE = 96;

const RAW = [];
for (let y = 0; y < MAP_SIZE; y++) RAW[y] = new Array(MAP_SIZE).fill(1);

function carve(x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      RAW[y][x] = 0;
}
function door(x, y) { RAW[y][x] = 2; }
function exit_(x, y) { RAW[y][x] = 3; }

// ═══════════════════════════════════════════════════════
// ZONE 1 — THE BACKROOMS (top-left, cols 1–34, rows 1–34)
// Infinite office corridors. Fluorescent hum.
// Rooms that shouldn't connect but do.
// ═══════════════════════════════════════════════════════

// Main corridor grid — the backrooms are always corridors
carve(1,1, 33,3);       // north spine
carve(1,8, 33,10);      // second corridor
carve(1,15,33,17);      // third corridor
carve(1,22,33,24);      // fourth corridor
carve(1,29,33,31);      // fifth corridor
// Vertical connectors
carve(1,1,  3, 33);
carve(10,1, 12,33);
carve(20,1, 22,33);
carve(31,1, 33,33);
// Office room alcoves — the ones with no reason to exist
carve(4,4,  9,7);   // room A
carve(13,4, 19,7);  // room B
carve(23,4, 30,7);  // room C
carve(4,11, 9,14);  // room D
carve(13,11,19,14); // room E
carve(23,11,30,14); // room F
carve(4,18, 9,21);  // room G
carve(13,18,19,21); // room H
carve(23,18,30,21); // room I
carve(4,25, 9,28);  // room J
carve(13,25,19,28); // room K
carve(23,25,30,28); // room L
// Column pillars for depth
RAW[5][6]=1; RAW[6][6]=1;
RAW[5][16]=1; RAW[6][16]=1;
RAW[5][8]=1;
RAW[12][5]=1; RAW[12][6]=1;
RAW[22][12]=1; RAW[22][13]=1;
// Doors within backrooms (most are open, some feel wrong)
door(9,5); door(9,12); door(9,19); door(9,26);
door(20,5); door(20,12); door(20,19); door(20,26);

// ── BACKROOMS → SCHOOL (door at east wall of backrooms, row 15-16) ──
carve(33,15,35,16);
door(34,15); door(34,16);

// ── BACKROOMS → POOL (door at south wall, col 16-17, row 33) ──
carve(16,33,17,35);
door(16,34); door(17,34);

// ═══════════════════════════════════════════════════════
// ZONE 2 — THE SCHOOL (top-right, cols 36–70, rows 1–34)
// Summer. Empty. The lockers still have names on them.
// ═══════════════════════════════════════════════════════

// Main hallway — long east-west spine
carve(36,1, 69,5);
// Alcove rows (locker bays on north wall)
carve(38,0,40,0);
carve(44,0,46,0);
carve(50,0,52,0);
carve(56,0,58,0);
carve(63,0,65,0);
// Half-wall dividers in hallway (lockers blocking line of sight)
RAW[3][42]=1; RAW[3][43]=1;
RAW[3][49]=1; RAW[3][50]=1;
RAW[3][58]=1; RAW[3][59]=1;
RAW[3][66]=1; RAW[3][67]=1;

// Classroom A (south of hallway, left)
carve(36,7, 50,20);
// Classroom B (south, middle)
carve(52,7, 63,20);
// Classroom C — the one with the door that leads somewhere wrong
carve(36,22,50,32);
// Art room (east end)
carve(65,7, 69,32);
// Stairwell (connects nowhere now)
carve(64,1, 69,6);

// Internal classroom structure (desk rows = wall stubs)
for(let x=38;x<=48;x+=4){ RAW[10][x]=1; RAW[10][x+1]=1; }
for(let x=38;x<=48;x+=4){ RAW[14][x]=1; RAW[14][x+1]=1; }
for(let x=38;x<=48;x+=4){ RAW[18][x]=1; RAW[18][x+1]=1; }
for(let x=54;x<=62;x+=4){ RAW[10][x]=1; RAW[10][x+1]=1; }
for(let x=54;x<=62;x+=4){ RAW[14][x]=1; RAW[14][x+1]=1; }
for(let x=54;x<=62;x+=4){ RAW[18][x]=1; RAW[18][x+1]=1; }

// Doors: hallway → classrooms
door(42,6); door(43,6);   // → classroom A
door(56,6); door(57,6);   // → classroom B
door(42,21); door(43,21); // → classroom C
door(65,6);               // → art room

// Classroom C has a wrong door — it opens into the Dream zone
carve(36,32,37,36);
door(36,33); door(36,34);

// ── SCHOOL → POOL (east hallway door) ──
carve(69,2, 72,3);
door(70,2); door(70,3);

// ── SCHOOL → BACKROOMS already defined above ──

// ═══════════════════════════════════════════════════════
// ZONE 3 — THE POOL (middle band, cols 1–70, rows 36–62)
// The water is too still. You can't see the bottom.
// Pool rooms. Changing rooms. The smell of chlorine that left years ago.
// ═══════════════════════════════════════════════════════

// Main pool hall — huge
carve(1,36, 70,62);
// Pool basin surround (inner structure)
// Pool itself (cols 10–60, rows 40–58) — just floor, marked by sprites
// Walkway border
carve(3,38, 67,60);
// Lane divider pillars (visual structure)
for(let x=15;x<=55;x+=10){ RAW[42][x]=1; RAW[48][x]=1; RAW[54][x]=1; }
// Changing room block (east end)
carve(58,36,70,40);  // changing room A
carve(58,42,70,46);  // changing room B  
carve(58,48,70,52);  // changing room C
// Showers (west end)
carve(1,36,6,42);
carve(1,44,6,50);
// Viewing gallery north (rows 36-37, full width)
carve(5,36,60,37); // already carved in main hall
// Internal wall between pool and changing rooms
RAW[36][57]=1; RAW[37][57]=1; RAW[38][57]=1;
RAW[39][57]=1; RAW[41][57]=1;
RAW[43][57]=1; RAW[44][57]=1; RAW[45][57]=1;
RAW[47][57]=1; RAW[49][57]=1; RAW[50][57]=1;
RAW[51][57]=1;

door(57,39); // → changing A
door(57,44); // → changing B
door(57,49); // → changing C

// ── POOL → MALL (south wall of pool, col 30–32, row 62) ──
carve(30,62,32,64);
door(30,63); door(31,63);

// ── POOL → DREAM (west wall — the door that shouldn't open) ──
// already connected via backrooms south → pool north

// ═══════════════════════════════════════════════════════
// ZONE 4 — THE DREAM / MALL hybrid
// (bottom-left, cols 1–50, rows 65–94)
// Abandoned mall bleeding into dreamcore.
// The stores are still lit. The escalators stopped mid-step.
// ═══════════════════════════════════════════════════════

// Mall main floor — huge open atrium
carve(1,65, 70,94);
// Upper mall (second floor illusion — a balcony strip)
carve(1,65, 70,68);   // main concourse
// Store fronts along walls (stubs with openings)
for(let x=3;x<=50;x+=10){
  RAW[70][x]=1; RAW[70][x+1]=1; RAW[70][x+2]=1; RAW[70][x+3]=1;
}
for(let x=3;x<=50;x+=10){
  RAW[80][x]=1; RAW[80][x+1]=1; RAW[80][x+2]=1; RAW[80][x+3]=1;
}
for(let x=3;x<=50;x+=10){
  RAW[89][x]=1; RAW[89][x+1]=1; RAW[89][x+2]=1; RAW[89][x+3]=1;
}
// Fountain / atrium center pillar
RAW[77][30]=1; RAW[77][31]=1; RAW[77][32]=1;
RAW[78][30]=1;                RAW[78][32]=1;
RAW[79][30]=1; RAW[79][31]=1; RAW[79][32]=1;

// Dream bleed-through rooms (south section of mall turns pastel wrong)
// These rooms feel like the mall but the colors are off
carve(52,65, 70,80); // dream wing A
carve(52,82, 70,94); // dream wing B
// Weird geometry
RAW[72][55]=1; RAW[72][56]=1;
RAW[72][60]=1; RAW[72][61]=1;
RAW[78][55]=1;
RAW[85][58]=1; RAW[85][59]=1; RAW[85][60]=1;

door(51,72); // mall → dream wing A
door(51,88); // mall → dream wing B

// ── DREAM → CIRCUS (far east of dream wing B) ──
carve(70,88,73,92);
door(71,89); door(71,90);

// ═══════════════════════════════════════════════════════
// ZONE 5 — THE DIGITAL CIRCUS (far east, cols 72–94, rows 36–94)
// Bright and broken. Circus colors rotting.
// The geometry doesn't add up. It never did.
// ═══════════════════════════════════════════════════════

// Main tent — large irregular space
carve(72,36, 94,94);
// Circus ring walls (inner circular-ish structure built from stubs)
RAW[52][80]=1; RAW[52][81]=1; RAW[52][82]=1;
RAW[52][86]=1; RAW[52][87]=1; RAW[52][88]=1;
RAW[52][83]=1;
RAW[56][79]=1; RAW[57][79]=1;
RAW[56][89]=1; RAW[57][89]=1;
RAW[64][79]=1; RAW[64][89]=1;
RAW[68][80]=1; RAW[68][81]=1; RAW[68][82]=1;
RAW[68][86]=1; RAW[68][87]=1; RAW[68][88]=1;
// Side corridors
carve(72,36, 80,50);  // entrance corridor
carve(82,36, 94,50);  // backstage
carve(72,52, 94,65);  // performance floor
carve(72,67, 94,80);  // audience bleachers area
carve(72,82, 94,94);  // the place behind the tent
// Passage stubs
RAW[51][76]=1; RAW[51][77]=1;
RAW[51][90]=1; RAW[51][91]=1;
RAW[66][76]=1; RAW[66][77]=1;
// Wrong door within circus (goes back to backrooms — the loop)
carve(72,42,73,46);
door(73,43); door(73,44);  // circus → backrooms (loop)
carve(1,42,4,46);  // matching opening in backrooms west wall
door(2,43); door(2,44);

// EXIT — the deepest part of the circus. Behind the tent.
// Or maybe it's just another backroom.
exit_(88, 93);

// ─────────────────────────────────────────────────────────────
const worldMap = RAW;

// ─────────────────────────────────────────────────────────────
// ZONE MAPPING — which aesthetic rules each tile
// ─────────────────────────────────────────────────────────────

function getZone(tx, ty) {
  // Circus (far east)
  if (tx >= 72 && ty >= 36) return ZONE.CIRCUS;
  // Dream / Mall (bottom-left)
  if (ty >= 65) return ZONE.DREAM;
  // Pool (middle band)
  if (ty >= 36 && ty <= 64) return ZONE.POOL;
  // School (top-right)
  if (tx >= 36 && ty <= 35) return ZONE.SCHOOL;
  // Backrooms (top-left)
  if (tx <= 35 && ty <= 35) return ZONE.BACKROOMS;
  return ZONE.VOID;
}

function getZoneTextures(zone) {
  switch (zone) {
    case ZONE.BACKROOMS:
      return {
        wall:     TextureLib.backroomsWall,
        floor:    TextureLib.backroomsFloor,
        ceiling:  TextureLib.backroomsCeiling,
        fogColor: [200, 185, 100],
        fogDist:  10,
      };
    case ZONE.SCHOOL:
      return {
        wall:     TextureLib.schoolWall,
        floor:    TextureLib.schoolFloor,
        ceiling:  TextureLib.schoolCeiling,
        fogColor: [185, 180, 160],
        fogDist:  14,
      };
    case ZONE.POOL:
      return {
        wall:     TextureLib.poolWall,
        floor:    TextureLib.poolFloor,
        ceiling:  TextureLib.poolCeiling,
        fogColor: [70, 130, 155],
        fogDist:  20,
      };
    case ZONE.DREAM:
      return {
        wall:     TextureLib.dreamWall,
        floor:    TextureLib.dreamFloor,
        ceiling:  TextureLib.dreamCeiling,
        fogColor: [230, 190, 220],
        fogDist:  16,
      };
    case ZONE.CIRCUS:
      return {
        wall:     TextureLib.circusWall,
        floor:    TextureLib.circusFloor,
        ceiling:  TextureLib.circusCeiling,
        fogColor: [80, 30, 60],
        fogDist:  8,
      };
    default:
      return {
        wall:     TextureLib.voidWall,
        floor:    TextureLib.voidFloor,
        ceiling:  TextureLib.voidWall,
        fogColor: [10, 15, 20],
        fogDist:  5,
      };
  }
}

function getZoneName(zone) {
  switch (zone) {
    case ZONE.BACKROOMS: return 'LEVEL 0';
    case ZONE.SCHOOL:    return 'EAST WING — SUMMER TERM';
    case ZONE.POOL:      return 'NATATORIUM — DO NOT SWIM ALONE';
    case ZONE.DREAM:     return 'RIVERSIDE MALL — EST. 1994';
    case ZONE.CIRCUS:    return 'THE AMAZING DIGITAL CIRCUS';
    default:             return '';
  }
}

// ─────────────────────────────────────────────────────────────
// SPRITES — placeholders + entities
// ─────────────────────────────────────────────────────────────

const SPRITES = [

  // ── BACKROOMS ──────────────────────────────────────────────
  // Office detritus. The kind of stuff that accumulates when no one leaves.
  { x:5.5,  y:5.5,  texture:'placeholder', label:'office_chair',      type:'placeholder' },
  { x:15.5, y:5.5,  texture:'placeholder', label:'filing_cabinet',    type:'placeholder' },
  { x:25.5, y:5.5,  texture:'placeholder', label:'water_cooler',      type:'placeholder' },
  { x:5.5,  y:12.5, texture:'placeholder', label:'office_desk',       type:'placeholder' },
  { x:15.5, y:12.5, texture:'placeholder', label:'crt_monitor',       type:'placeholder' },
  { x:25.5, y:12.5, texture:'placeholder', label:'office_chair',      type:'placeholder' },
  { x:5.5,  y:19.5, texture:'placeholder', label:'filing_cabinet',    type:'placeholder' },
  { x:15.5, y:19.5, texture:'placeholder', label:'office_desk',       type:'placeholder' },
  { x:25.5, y:19.5, texture:'placeholder', label:'crt_monitor',       type:'placeholder' },
  { x:5.5,  y:26.5, texture:'placeholder', label:'water_cooler',      type:'placeholder' },
  { x:15.5, y:26.5, texture:'placeholder', label:'office_chair',      type:'placeholder' },
  { x:25.5, y:26.5, texture:'placeholder', label:'filing_cabinet',    type:'placeholder' },

  // ── SCHOOL HALLWAY ─────────────────────────────────────────
  { x:39.5, y:0.5,  texture:'placeholder', label:'lockers',           type:'placeholder' },
  { x:45.5, y:0.5,  texture:'placeholder', label:'lockers',           type:'placeholder' },
  { x:51.5, y:0.5,  texture:'placeholder', label:'lockers',           type:'placeholder' },
  { x:57.5, y:0.5,  texture:'placeholder', label:'lockers',           type:'placeholder' },
  { x:64.5, y:0.5,  texture:'placeholder', label:'lockers',           type:'placeholder' },
  { x:48.5, y:3.0,  texture:'placeholder', label:'bulletin_board',    type:'placeholder' },
  { x:60.5, y:3.0,  texture:'placeholder', label:'fire_extinguisher', type:'placeholder' },

  // ── CLASSROOM A ────────────────────────────────────────────
  { x:39.5, y:9.5,  texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:39.5, y:11.5, texture:'placeholder', label:'chair_student',     type:'placeholder' },
  { x:43.5, y:9.5,  texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:43.5, y:11.5, texture:'placeholder', label:'chair_student',     type:'placeholder' },
  { x:47.5, y:9.5,  texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:47.5, y:11.5, texture:'placeholder', label:'chair_student',     type:'placeholder' },
  { x:39.5, y:14.5, texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:43.5, y:14.5, texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:47.5, y:14.5, texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:37.5, y:8.5,  texture:'placeholder', label:'blackboard',        type:'placeholder' },
  { x:49.5, y:8.0,  texture:'placeholder', label:'teacher_desk',      type:'placeholder' },

  // ── CLASSROOM B ────────────────────────────────────────────
  { x:54.5, y:9.5,  texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:54.5, y:11.5, texture:'placeholder', label:'chair_student',     type:'placeholder' },
  { x:58.5, y:9.5,  texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:58.5, y:11.5, texture:'placeholder', label:'chair_student',     type:'placeholder' },
  { x:53.5, y:8.5,  texture:'placeholder', label:'blackboard',        type:'placeholder' },
  { x:62.5, y:8.0,  texture:'placeholder', label:'teacher_desk',      type:'placeholder' },

  // ── CLASSROOM C (wrong room) ────────────────────────────────
  { x:42.5, y:25.5, texture:'placeholder', label:'desk_student',      type:'placeholder' },
  { x:42.5, y:27.5, texture:'placeholder', label:'chair_student',     type:'placeholder' },
  { x:46.5, y:25.5, texture:'placeholder', label:'desk_student',      type:'placeholder' },
  // This one faces the wall
  { x:37.5, y:28.0, texture:'placeholder', label:'teacher_desk',      type:'placeholder' },
  { x:44.0, y:23.5, texture:'placeholder', label:'blackboard',        type:'placeholder' },

  // ── POOL ───────────────────────────────────────────────────
  // The pool basin itself — flat and still
  { x:35.0, y:49.0, texture:'placeholder', label:'pool_water_surface', type:'placeholder' },
  { x:12.5, y:40.5, texture:'placeholder', label:'pool_ladder',        type:'placeholder' },
  { x:12.5, y:57.5, texture:'placeholder', label:'pool_ladder',        type:'placeholder' },
  { x:55.5, y:40.5, texture:'placeholder', label:'pool_ladder',        type:'placeholder' },
  { x:55.5, y:57.5, texture:'placeholder', label:'pool_ladder',        type:'placeholder' },
  { x:20.0, y:49.0, texture:'placeholder', label:'lane_divider',       type:'placeholder' },
  { x:30.0, y:49.0, texture:'placeholder', label:'lane_divider',       type:'placeholder' },
  { x:40.0, y:49.0, texture:'placeholder', label:'lane_divider',       type:'placeholder' },
  { x:50.0, y:49.0, texture:'placeholder', label:'lane_divider',       type:'placeholder' },
  { x:8.5,  y:57.0, texture:'placeholder', label:'diving_board',       type:'placeholder' },
  { x:3.5,  y:38.5, texture:'placeholder', label:'bench_pool',         type:'placeholder' },
  { x:3.5,  y:44.5, texture:'placeholder', label:'bench_pool',         type:'placeholder' },
  { x:60.5, y:38.0, texture:'placeholder', label:'changing_curtain',   type:'placeholder' },
  { x:60.5, y:43.5, texture:'placeholder', label:'changing_curtain',   type:'placeholder' },
  { x:60.5, y:49.5, texture:'placeholder', label:'changing_curtain',   type:'placeholder' },

  // ── DREAM / MALL ───────────────────────────────────────────
  // The mall remembers what it was.
  { x:31.5, y:77.5, texture:'placeholder', label:'fountain_dry',       type:'placeholder' },
  { x:15.5, y:67.0, texture:'placeholder', label:'escalator_static',   type:'placeholder' },
  { x:5.5,  y:72.5, texture:'placeholder', label:'store_sign',         type:'placeholder' },
  { x:16.5, y:72.5, texture:'placeholder', label:'store_sign',         type:'placeholder' },
  { x:27.5, y:72.5, texture:'placeholder', label:'store_sign',         type:'placeholder' },
  { x:38.5, y:72.5, texture:'placeholder', label:'store_sign',         type:'placeholder' },
  { x:48.5, y:72.5, texture:'placeholder', label:'store_sign',         type:'placeholder' },
  { x:20.5, y:84.5, texture:'placeholder', label:'bench_mall',         type:'placeholder' },
  { x:35.5, y:84.5, texture:'placeholder', label:'bench_mall',         type:'placeholder' },
  { x:10.5, y:90.5, texture:'placeholder', label:'mannequin',          type:'placeholder' },
  { x:25.5, y:90.5, texture:'placeholder', label:'mannequin',          type:'placeholder' },
  { x:42.5, y:90.5, texture:'placeholder', label:'mannequin',          type:'placeholder' },
  { x:7.5,  y:80.5, texture:'placeholder', label:'shopping_cart',      type:'placeholder' },
  { x:45.5, y:77.5, texture:'placeholder', label:'trash_overturned',   type:'placeholder' },
  // Dream wing — the wrong rooms
  { x:55.5, y:68.5, texture:'placeholder', label:'toy_rocking_horse',  type:'placeholder' },
  { x:62.5, y:68.5, texture:'placeholder', label:'old_television',     type:'placeholder' },
  { x:55.5, y:75.5, texture:'placeholder', label:'child_chair',        type:'placeholder' },
  { x:63.5, y:75.5, texture:'placeholder', label:'rotary_phone',       type:'placeholder' },
  { x:58.5, y:85.5, texture:'placeholder', label:'old_television',     type:'placeholder' },
  { x:65.5, y:88.5, texture:'placeholder', label:'toy_rocking_horse',  type:'placeholder' },

  // ── CIRCUS ─────────────────────────────────────────────────
  { x:78.5, y:40.5, texture:'placeholder', label:'circus_tent_pole',   type:'placeholder' },
  { x:88.5, y:40.5, texture:'placeholder', label:'circus_tent_pole',   type:'placeholder' },
  { x:78.5, y:60.5, texture:'placeholder', label:'circus_tent_pole',   type:'placeholder' },
  { x:88.5, y:60.5, texture:'placeholder', label:'circus_tent_pole',   type:'placeholder' },
  { x:83.5, y:56.5, texture:'placeholder', label:'circus_ring_barrier',type:'placeholder' },
  { x:75.5, y:56.5, texture:'placeholder', label:'circus_ring_barrier',type:'placeholder' },
  { x:83.5, y:70.5, texture:'placeholder', label:'clown_car',          type:'placeholder' },
  { x:76.5, y:75.5, texture:'placeholder', label:'jack_in_box',        type:'placeholder' },
  { x:88.5, y:75.5, texture:'placeholder', label:'funhouse_mirror',    type:'placeholder' },
  { x:80.5, y:86.5, texture:'placeholder', label:'carousel_horse',     type:'placeholder' },
  { x:88.5, y:86.5, texture:'placeholder', label:'carousel_horse',     type:'placeholder' },

  // ── ENTITIES ───────────────────────────────────────────────
  // The black figure. It appears in different zones.
  // It's not chasing you. It's just always been there.
  {
    x: 16.5, y: 16.5,
    texture: 'entity',
    type: 'entity',
    hint: "you've been here before. the yellow doesn't end. it just changes what it pretends to be.",
  },
  {
    x: 48.5, y: 18.5,
    texture: 'entity',
    type: 'entity',
    hint: "the classroom is empty because school ended. you don't remember when you stopped going.",
  },
  {
    x: 35.0, y: 53.0,
    texture: 'entity',
    type: 'entity',
    hint: "don't look at the water. the water has been looking at you since you got here.",
  },
  {
    x: 58.5, y: 72.5,
    texture: 'entity',
    type: 'entity',
    hint: "you know this mall. you used to come here. something stayed behind when everyone left.",
  },
  {
    x: 83.5, y: 88.5,
    texture: 'entity',
    type: 'entity',
    hint: "the exit is real. probably. caine built this place and then forgot what exits were for.",
  },
];

const PLAYER_START = { x: 5.5, y: 15.5, angle: 0 };
