// world.js — Multi-room world: each room is a maze with its own color.
// Doors connect rooms. You walk through — no teleport.
// Cube placeholders mark asset positions. Replace with real models later.

// ─────────────────────────────────────────────────────────────
// ZONE / CELL CONSTANTS
// ─────────────────────────────────────────────────────────────

const ZONE = {
  HALLWAY:    'hallway',
  CLASSROOM:  'classroom',
  POOL:       'pool',
  MALL:       'mall',
  HOSPITAL:   'hospital',
  VOID:       'void',
};

const CELL = {
  EMPTY:  0,
  WALL:   1,
  DOOR:   2,   // walkthrough door
  EXIT:   3,   // final exit
};

// ─────────────────────────────────────────────────────────────
// MAP  (80 × 80 tiles)
// ─────────────────────────────────────────────────────────────

const MAP_SIZE = 80;

const RAW = [];
for (let y = 0; y < MAP_SIZE; y++) {
  RAW[y] = new Array(MAP_SIZE).fill(1);
}

function carve(x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      RAW[y][x] = 0;
}
function door(x, y) { RAW[y][x] = 2; }
function exit_(x, y) { RAW[y][x] = 3; }

// ── SCHOOL HALLWAY (rows 2–6, cols 2–27) ──────────────────
carve(2, 2, 27, 6);
carve(4, 1, 6, 1);
carve(10, 1, 12, 1);
carve(20, 1, 22, 1);
RAW[4][8]  = 1; RAW[4][9]  = 1;
RAW[4][16] = 1; RAW[4][17] = 1;

// ── CLASSROOM A (rows 9–22, cols 2–13) ───────────────────
carve(2, 9, 13, 22);
carve(4, 8, 10, 8);

// ── CLASSROOM B (rows 9–22, cols 15–27) ──────────────────
carve(15, 9, 27, 22);
carve(14, 14, 14, 16);

// Doors: hallway → classrooms
door(7, 7); door(7, 8);
door(20, 7); door(20, 8);
door(14, 15); // between A and B

// ── POOL (rows 2–26, cols 30–51) ─────────────────────────
carve(30, 2, 51, 26);
carve(52, 2, 54, 8);

// Doors: hallway → pool, pool → mall
door(28, 4); door(29, 4);
door(40, 27); door(41, 27);

// ── ABANDONED MALL (rows 28–52, cols 2–51) ───────────────
carve(2, 28, 51, 52);
// Storefront dividers (row of stubs with gaps for entry)
for (let x = 4; x <= 46; x += 4) {
  RAW[31][x] = 1; RAW[31][x+1] = 1; RAW[31][x+2] = 1;
}
for (let x = 4; x <= 48; x += 6) {
  RAW[40][x] = 1; RAW[40][x+1] = 1; RAW[40][x+2] = 1; RAW[40][x+3] = 1;
}
// Fountain plaza square
RAW[36][24]=1; RAW[36][25]=1; RAW[36][26]=1;
RAW[37][24]=1;                RAW[37][26]=1;
RAW[38][24]=1; RAW[38][25]=1; RAW[38][26]=1;

// Doors: school area → mall, mall → hospital
door(7, 27); door(7, 28);
door(52, 40); door(52, 41);

// ── ABANDONED HOSPITAL (rows 2–76, cols 54–77) ───────────
carve(54, 2, 77, 5);         // entrance corridor
carve(54, 2, 56, 50);        // west spine
carve(75, 2, 77, 50);        // east spine
carve(57, 2, 66, 10);        // ward 1
carve(57, 12, 66, 20);       // ward 2
carve(57, 22, 66, 30);       // ward 3
carve(57, 32, 66, 40);       // ward 4
carve(57, 42, 66, 50);       // ward 5 / morgue
carve(68, 2, 74, 10);        // ward 6
carve(68, 12, 74, 20);       // ward 7 (surgery)
carve(68, 22, 74, 30);       // ward 8
carve(68, 32, 74, 40);       // ward 9
carve(68, 42, 74, 50);       // ward 10
carve(54, 25, 77, 27);       // cross corridor
carve(54, 10, 77, 11);
carve(54, 38, 77, 39);
carve(54, 52, 77, 76);       // deep south
carve(57, 52, 70, 60);
carve(57, 62, 70, 76);       // operating room
carve(72, 52, 74, 76);

// Hospital internal doors
door(56, 6);  door(56, 7);
door(67, 6);  door(67, 7);
door(56, 16); door(56, 17);
door(67, 16); door(67, 17);
door(56, 26); door(56, 27);
door(67, 26); door(67, 27);
door(56, 36); door(56, 37);
door(67, 36); door(67, 37);
door(56, 46); door(56, 47);
door(67, 46); door(67, 47);
door(60, 51); door(61, 51);

// EXIT — deep in the operating room
exit_(63, 75);

// ─────────────────────────────────────────────────────────────
const worldMap = RAW;

// ─────────────────────────────────────────────────────────────
// ZONE MAPPING
// ─────────────────────────────────────────────────────────────

function getZone(tx, ty) {
  if (tx >= 54 && tx <= 77) return ZONE.HOSPITAL;
  if (tx >= 30 && tx <= 53 && ty >= 1 && ty <= 27) return ZONE.POOL;
  if (tx >= 2 && tx <= 53 && ty >= 27 && ty <= 53) return ZONE.MALL;
  if (tx >= 2 && tx <= 13 && ty >= 8 && ty <= 23)  return ZONE.CLASSROOM;
  if (tx >= 14 && tx <= 28 && ty >= 8 && ty <= 23) return ZONE.CLASSROOM;
  if (tx >= 1 && tx <= 28 && ty >= 1 && ty <= 8)   return ZONE.HALLWAY;
  return ZONE.VOID;
}

function getZoneTextures(zone) {
  switch (zone) {
    case ZONE.HALLWAY:
      return { wall: TextureLib.hallwayWall, floor: TextureLib.hallwayFloor, ceiling: TextureLib.hallwayCeiling, fogColor: [180,175,155], fogDist: 14 };
    case ZONE.CLASSROOM:
      return { wall: TextureLib.classroomWall, floor: TextureLib.classroomFloor, ceiling: TextureLib.classroomCeiling, fogColor: [200,195,175], fogDist: 12 };
    case ZONE.POOL:
      return { wall: TextureLib.poolWall, floor: TextureLib.poolFloor, ceiling: TextureLib.poolCeiling, fogColor: [80,140,160], fogDist: 18 };
    case ZONE.MALL:
      return { wall: TextureLib.mallWall, floor: TextureLib.mallFloor, ceiling: TextureLib.mallCeiling, fogColor: [60,55,50], fogDist: 16 };
    case ZONE.HOSPITAL:
      return { wall: TextureLib.hospitalWall, floor: TextureLib.hospitalFloor, ceiling: TextureLib.hospitalCeiling, fogColor: [140,155,140], fogDist: 10 };
    default:
      return { wall: TextureLib.voidWall, floor: TextureLib.voidFloor, ceiling: TextureLib.voidWall, fogColor: [10,15,20], fogDist: 6 };
  }
}

function getZoneName(zone) {
  switch (zone) {
    case ZONE.HALLWAY:   return 'HALLWAY — EAST WING';
    case ZONE.CLASSROOM: return 'CLASSROOM — EMPTY';
    case ZONE.POOL:      return 'NATATORIUM';
    case ZONE.MALL:      return 'RIVERSIDE MALL — CLOSED';
    case ZONE.HOSPITAL:  return 'ST. ELARA GENERAL — ABANDONED';
    default:             return '';
  }
}

// ─────────────────────────────────────────────────────────────
// SPRITES — placeholder cubes + entity
// ─────────────────────────────────────────────────────────────

const SPRITES = [
  // HALLWAY
  { x:4.5,  y:1.5,  texture:'placeholder', label:'lockers_01',        type:'placeholder' },
  { x:10.5, y:1.5,  texture:'placeholder', label:'lockers_02',        type:'placeholder' },
  { x:20.5, y:1.5,  texture:'placeholder', label:'lockers_03',        type:'placeholder' },
  { x:14.5, y:4.5,  texture:'placeholder', label:'bulletin_board',    type:'placeholder' },
  { x:24.5, y:2.5,  texture:'placeholder', label:'fire_extinguisher', type:'placeholder' },
  { x:6.5,  y:5.5,  texture:'placeholder', label:'trash_can',         type:'placeholder' },

  // CLASSROOM A
  { x:4.5,  y:11.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:4.5,  y:13.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:7.5,  y:11.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:7.5,  y:13.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:10.5, y:11.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:10.5, y:13.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:4.5,  y:16.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:4.5,  y:18.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:7.5,  y:16.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:7.5,  y:18.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:10.5, y:16.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:10.5, y:18.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:7.0,  y:9.5,  texture:'placeholder', label:'blackboard',    type:'placeholder' },
  { x:11.5, y:10.5, texture:'placeholder', label:'teacher_desk',  type:'placeholder' },

  // CLASSROOM B
  { x:17.5, y:11.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:17.5, y:13.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:20.5, y:11.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:20.5, y:13.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:23.5, y:11.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:23.5, y:13.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:17.5, y:16.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:17.5, y:18.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:20.5, y:16.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:20.5, y:18.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:23.5, y:16.5, texture:'placeholder', label:'desk_student',  type:'placeholder' },
  { x:23.5, y:18.0, texture:'placeholder', label:'chair_student', type:'placeholder' },
  { x:20.5, y:9.5,  texture:'placeholder', label:'blackboard',    type:'placeholder' },
  { x:26.0, y:10.5, texture:'placeholder', label:'teacher_desk',  type:'placeholder' },

  // POOL
  { x:40.5, y:14.0, texture:'placeholder', label:'pool_water',      type:'placeholder' },
  { x:35.5, y:8.0,  texture:'placeholder', label:'pool_ladder',     type:'placeholder' },
  { x:46.5, y:8.0,  texture:'placeholder', label:'pool_ladder',     type:'placeholder' },
  { x:38.0, y:14.0, texture:'placeholder', label:'lane_divider',    type:'placeholder' },
  { x:41.0, y:14.0, texture:'placeholder', label:'lane_divider',    type:'placeholder' },
  { x:44.0, y:14.0, texture:'placeholder', label:'lane_divider',    type:'placeholder' },
  { x:47.5, y:22.0, texture:'placeholder', label:'diving_board',    type:'placeholder' },
  { x:32.5, y:20.5, texture:'placeholder', label:'bench_pool',      type:'placeholder' },
  { x:50.5, y:4.5,  texture:'placeholder', label:'changing_curtain',type:'placeholder' },

  // MALL
  { x:37.0, y:36.5, texture:'placeholder', label:'fountain_dry',    type:'placeholder' },
  { x:10.0, y:35.5, texture:'placeholder', label:'escalator_static',type:'placeholder' },
  { x:5.5,  y:30.5, texture:'placeholder', label:'store_sign_01',   type:'placeholder' },
  { x:15.5, y:30.5, texture:'placeholder', label:'store_sign_02',   type:'placeholder' },
  { x:25.5, y:30.5, texture:'placeholder', label:'store_sign_01',   type:'placeholder' },
  { x:35.5, y:30.5, texture:'placeholder', label:'store_sign_02',   type:'placeholder' },
  { x:45.5, y:30.5, texture:'placeholder', label:'store_sign_01',   type:'placeholder' },
  { x:22.5, y:44.5, texture:'placeholder', label:'bench_mall',      type:'placeholder' },
  { x:30.5, y:44.5, texture:'placeholder', label:'bench_mall',      type:'placeholder' },
  { x:18.0, y:48.5, texture:'placeholder', label:'mannequin',       type:'placeholder' },
  { x:40.5, y:48.5, texture:'placeholder', label:'mannequin',       type:'placeholder' },
  { x:8.0,  y:42.5, texture:'placeholder', label:'shopping_cart',   type:'placeholder' },
  { x:48.0, y:35.5, texture:'placeholder', label:'trash_overturned',type:'placeholder' },

  // HOSPITAL
  { x:60.5, y:4.5,  texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:63.5, y:4.5,  texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:61.5, y:7.5,  texture:'placeholder', label:'iv_stand',        type:'placeholder' },
  { x:60.5, y:14.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:63.5, y:14.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:58.5, y:17.5, texture:'placeholder', label:'wheelchair',      type:'placeholder' },
  { x:60.5, y:24.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:63.5, y:24.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:65.0, y:27.5, texture:'placeholder', label:'file_cabinet',    type:'placeholder' },
  { x:60.5, y:34.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:64.0, y:36.5, texture:'placeholder', label:'stretcher',       type:'placeholder' },
  { x:58.5, y:33.5, texture:'placeholder', label:'biohazard_bin',   type:'placeholder' },
  { x:60.5, y:44.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:63.5, y:44.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:60.5, y:48.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:70.5, y:5.5,  texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:71.5, y:15.5, texture:'placeholder', label:'surgery_lamp',    type:'placeholder' },
  { x:69.5, y:14.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:70.5, y:25.5, texture:'placeholder', label:'hospital_curtain',type:'placeholder' },
  { x:70.5, y:35.5, texture:'placeholder', label:'iv_stand',        type:'placeholder' },
  { x:70.5, y:45.5, texture:'placeholder', label:'biohazard_bin',   type:'placeholder' },
  { x:55.5, y:20.5, texture:'placeholder', label:'stretcher',       type:'placeholder' },
  { x:55.5, y:33.5, texture:'placeholder', label:'wheelchair',      type:'placeholder' },
  { x:62.5, y:55.5, texture:'placeholder', label:'surgery_lamp',    type:'placeholder' },
  { x:60.5, y:58.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:64.5, y:58.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:62.5, y:68.5, texture:'placeholder', label:'hospital_bed',    type:'placeholder' },
  { x:59.5, y:70.5, texture:'placeholder', label:'file_cabinet',    type:'placeholder' },

  // ENTITY — lurks in hospital ward 4
  {
    x: 61.5, y: 37.5,
    texture: 'entity',
    type: 'entity',
    hint: "the door at the bottom breathes. south. always south. the operating room remembers what it cut out of you.",
  },
];

const PLAYER_START = { x: 3.5, y: 4.0, angle: 0 };
