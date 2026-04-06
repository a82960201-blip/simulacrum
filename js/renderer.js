// renderer.js — DDA Raycaster with textures, sprites, fog, VHS effects

const Renderer = (() => {
  const TEX_SIZE = 64;
  const FOV = Math.PI / 3; // 60 degrees

  let canvas, ctx, W, H;
  let zBuffer = [];

  // Pre-extracted pixel data from all textures
  const texData = {};

  function extractPixels(name, texCanvas) {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE; c.height = TEX_SIZE;
    const tc = c.getContext('2d');
    tc.drawImage(texCanvas, 0, 0);
    texData[name] = tc.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data;
  }

  let renderScale = 0.75;

  function init(canvasEl, scale) {
    canvas = canvasEl;
    renderScale = scale || 0.75;
    ctx = canvas.getContext('2d');
    // Disable smoothing so upscaled low-res looks pixelated (VHS feel)
    ctx.imageSmoothingEnabled = false;

    function resize() {
      // Internal resolution — scaled down for perf
      W = Math.floor(window.innerWidth  * renderScale);
      H = Math.floor(window.innerHeight * renderScale);
      // CSS size stays full screen
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      canvas.width  = W;
      canvas.height = H;
      zBuffer = new Float32Array(W);
    }
    resize();
    window.addEventListener('resize', resize);

    // Extract all texture pixels
    extractPixels('hallwayWall',      TextureLib.hallwayWall);
    extractPixels('hallwayFloor',     TextureLib.hallwayFloor);
    extractPixels('hallwayCeiling',   TextureLib.hallwayCeiling);
    extractPixels('classroomWall',    TextureLib.classroomWall);
    extractPixels('classroomFloor',   TextureLib.classroomFloor);
    extractPixels('classroomCeiling', TextureLib.classroomCeiling);
    extractPixels('poolWall',         TextureLib.poolWall);
    extractPixels('poolFloor',        TextureLib.poolFloor);
    extractPixels('poolCeiling',      TextureLib.poolCeiling);
    extractPixels('mallWall',         TextureLib.mallWall);
    extractPixels('mallFloor',        TextureLib.mallFloor);
    extractPixels('mallCeiling',      TextureLib.mallCeiling);
    extractPixels('hospitalWall',     TextureLib.hospitalWall);
    extractPixels('hospitalFloor',    TextureLib.hospitalFloor);
    extractPixels('hospitalCeiling',  TextureLib.hospitalCeiling);
    extractPixels('voidWall',         TextureLib.voidWall);
    extractPixels('voidFloor',        TextureLib.voidFloor);
    extractPixels('exitDoor',         TextureLib.exitDoor);
    extractPixels('door',             TextureLib.door);
    extractPixels('placeholder',      TextureLib.placeholder);
    extractPixels('entity',           TextureLib.entity);
  }

  function getTexPixel(name, tx, ty) {
    const data = texData[name];
    if (!data) return [128, 128, 128];
    const idx = (ty * TEX_SIZE + tx) * 4;
    return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
  }

  function render(player, sprites) {
    if (!W || !H) return;

    const imageData = ctx.createImageData(W, H);
    const pixels = imageData.data;

    const pZone = getZone(Math.floor(player.x), Math.floor(player.y));
    const pTexSet = getZoneTextures(pZone);

    // Global time for animations
    const t = performance.now() / 1000;

    // ── Floor & Ceiling casting ────────────────────────────────
    const halfH = H >> 1;
    const posZ = halfH;

    for (let y = 0; y < H; y++) {
      const isFloor = y > halfH;
      const rowDist = posZ / (y - halfH + (isFloor ? 0 : H - y - halfH) * -1 + 0.0001);

      if (y === halfH) continue;

      const realRowDist = Math.abs(posZ / (y - halfH + 0.001));

      const floorStepX = realRowDist * (Math.cos(player.angle + FOV / 2) - Math.cos(player.angle - FOV / 2)) / W;
      const floorStepY = realRowDist * (Math.sin(player.angle + FOV / 2) - Math.sin(player.angle - FOV / 2)) / W;

      let floorX = player.x + realRowDist * Math.cos(player.angle - FOV / 2);
      let floorY = player.y + realRowDist * Math.sin(player.angle - FOV / 2);

      for (let x = 0; x < W; x++) {
        const cellX = Math.floor(floorX);
        const cellY = Math.floor(floorY);

        const tx = Math.floor((floorX - cellX) * TEX_SIZE) & (TEX_SIZE - 1);
        const ty = Math.floor((floorY - cellY) * TEX_SIZE) & (TEX_SIZE - 1);

        floorX += floorStepX;
        floorY += floorStepY;

        const zone = getZone(cellX, cellY);
        const texSet = getZoneTextures(zone);

        const fogT = Math.min(realRowDist / texSet.fogDist, 1);

        let r, g, b;

        if (isFloor) {
          const texName = getTexName(zone, 'floor');
          const [pr, pg, pb] = getTexPixel(texName, tx, ty);
          r = lerp(pr, texSet.fogColor[0], fogT * 0.85);
          g = lerp(pg, texSet.fogColor[1], fogT * 0.85);
          b = lerp(pb, texSet.fogColor[2], fogT * 0.85);
          // Darken floor
          r *= 0.65; g *= 0.65; b *= 0.65;
        } else {
          const texName = getTexName(zone, 'ceiling');
          const [pr, pg, pb] = getTexPixel(texName, tx, ty);
          r = lerp(pr, texSet.fogColor[0], fogT * 0.9);
          g = lerp(pg, texSet.fogColor[1], fogT * 0.9);
          b = lerp(pb, texSet.fogColor[2], fogT * 0.9);
          // Darken ceiling
          r *= 0.55; g *= 0.55; b *= 0.55;
        }

        const idx = (y * W + x) * 4;
        pixels[idx]   = clamp(r);
        pixels[idx+1] = clamp(g);
        pixels[idx+2] = clamp(b);
        pixels[idx+3] = 255;
      }
    }

    // ── Wall casting (DDA) ──────────────────────────────────────
    for (let col = 0; col < W; col++) {
      const rayAngle = player.angle - FOV / 2 + (col / W) * FOV;
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const deltaDistX = Math.abs(1 / (rayDirX || 0.00001));
      const deltaDistY = Math.abs(1 / (rayDirY || 0.00001));

      let stepX, stepY, sideDistX, sideDistY;

      if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; }
      else             { stepX =  1; sideDistX = (mapX + 1 - player.x) * deltaDistX; }
      if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; }
      else             { stepY =  1; sideDistY = (mapY + 1 - player.y) * deltaDistY; }

      let hit = false, side = 0, hitCell = CELL.WALL;
      const MAX_DIST = 32;
      let dist = 0;

      while (!hit && dist < MAX_DIST) {
        if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
        else                        { sideDistY += deltaDistY; mapY += stepY; side = 1; }

        if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) { hit = true; break; }
        if (worldMap[mapY][mapX] !== CELL.EMPTY) {
          hitCell = worldMap[mapY][mapX];
          hit = true;
        }
        dist++;
      }

      const perpWallDist = side === 0
        ? (mapX - player.x + (1 - stepX) / 2) / (rayDirX || 0.00001)
        : (mapY - player.y + (1 - stepY) / 2) / (rayDirY || 0.00001);

      const absPerp = Math.abs(perpWallDist);
      zBuffer[col] = absPerp;

      const wallH = Math.min(H, Math.floor(H / absPerp));
      const wallTop = Math.max(0, Math.floor((H - wallH) / 2));
      const wallBot = Math.min(H - 1, wallTop + wallH);

      // Texture
      let wallX;
      if (side === 0) wallX = player.y + absPerp * rayDirY;
      else            wallX = player.x + absPerp * rayDirX;
      wallX -= Math.floor(wallX);

      const hitZone = getZone(mapX, mapY);
      const hitTexSet = getZoneTextures(hitZone);
      let wallTexName;
      if (hitCell === CELL.EXIT) {
        wallTexName = 'exitDoor';
      } else if (hitCell === CELL.DOOR) {
        wallTexName = 'door';
      } else {
        wallTexName = getTexName(hitZone, 'wall');
      }

      const texX = Math.floor(wallX * TEX_SIZE);
      const fogT = Math.min(absPerp / hitTexSet.fogDist, 1);
      const shade = side === 1 ? 0.7 : 1.0;

      for (let y = wallTop; y <= wallBot; y++) {
        const texY = Math.floor(((y - wallTop) / wallH) * TEX_SIZE) & (TEX_SIZE - 1);
        const [pr, pg, pb] = getTexPixel(wallTexName, texX, texY);

        let r = lerp(pr * shade, hitTexSet.fogColor[0], fogT * 0.8);
        let g = lerp(pg * shade, hitTexSet.fogColor[1], fogT * 0.8);
        let b = lerp(pb * shade, hitTexSet.fogColor[2], fogT * 0.8);

        // Fluorescent flicker effect (backrooms + office)
        if (hitZone === ZONE.BACKROOMS || hitZone === ZONE.OFFICE) {
          const flicker = 0.92 + Math.sin(t * 17 + col * 0.1) * 0.04 + Math.random() * 0.02;
          r *= flicker; g *= flicker; b *= flicker;
        }

        // EXIT door: glow teal
        if (hitCell === CELL.EXIT) {
          r = lerp(r, 122, 0.4 + Math.sin(t * 3) * 0.1);
          g = lerp(g, 200, 0.4 + Math.sin(t * 3) * 0.1);
          b = lerp(b, 200, 0.4 + Math.sin(t * 3) * 0.1);
        }
        // Walkthrough DOOR: subtle warm pulse to signal passability
        if (hitCell === CELL.DOOR) {
          const pulse = 0.05 + Math.sin(t * 1.8) * 0.03;
          r = lerp(r, 220, pulse);
          g = lerp(g, 200, pulse);
          b = lerp(b, 160, pulse);
        }

        const idx = (y * W + col) * 4;
        pixels[idx]   = clamp(r);
        pixels[idx+1] = clamp(g);
        pixels[idx+2] = clamp(b);
        pixels[idx+3] = 255;
      }
    }

    // ── Sprite casting ──────────────────────────────────────────
    sprites.sort((a, b) => {
      const da = (a.x - player.x) ** 2 + (a.y - player.y) ** 2;
      const db = (b.x - player.x) ** 2 + (b.y - player.y) ** 2;
      return db - da;
    });

    for (const sprite of sprites) {
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;

      // Transform to camera space
      const invDet = 1.0 / (Math.cos(player.angle) * Math.sin(player.angle + Math.PI / 2) - Math.sin(player.angle) * Math.cos(player.angle + Math.PI / 2));
      const transformX = invDet * (Math.sin(player.angle + Math.PI / 2) * dx - Math.cos(player.angle + Math.PI / 2) * dy);
      const transformY = invDet * (-Math.sin(player.angle) * dx + Math.cos(player.angle) * dy);

      if (transformY <= 0) continue;

      const spriteScreenX = Math.floor((W / 2) * (1 + transformX / transformY));
      const spriteH = Math.min(H, Math.abs(Math.floor(H / transformY)));
      const spriteW = spriteH;

      const drawStartY = Math.max(0, Math.floor((H - spriteH) / 2));
      const drawEndY   = Math.min(H - 1, Math.floor((H + spriteH) / 2));
      const drawStartX = Math.max(0, spriteScreenX - spriteW / 2);
      const drawEndX   = Math.min(W - 1, spriteScreenX + spriteW / 2);

      const dist2 = Math.sqrt(dx * dx + dy * dy);
      const zone = getZone(Math.floor(sprite.x), Math.floor(sprite.y));
      const texSet = getZoneTextures(zone);
      const fogT = Math.min(dist2 / texSet.fogDist, 1);

      // Entity pulse effect
      const pulse = sprite.type === 'entity' ? (0.85 + Math.sin(t * 1.5) * 0.15) : 1;

      for (let col = drawStartX; col < drawEndX; col++) {
        if (zBuffer[col] < transformY) continue;
        const texX = Math.floor((col - (spriteScreenX - spriteW / 2)) / spriteW * TEX_SIZE);

        for (let row = drawStartY; row < drawEndY; row++) {
          const texY = Math.floor((row - (H - spriteH) / 2) / spriteH * TEX_SIZE);
          const [pr, pg, pb, pa] = getTexPixel(sprite.texture, texX, texY);

          if (pa < 20) continue;

          let r, g, b;
          if (sprite.type === 'entity') {
            // Entity: very dark with subtle teal rim
            const rim = Math.max(0, 1 - (Math.abs(texX - TEX_SIZE / 2) / (TEX_SIZE / 2))) * 0.3;
            r = lerp(pr * pulse, 122 * rim, rim);
            g = lerp(pg * pulse, 206 * rim, rim);
            b = lerp(pb * pulse, 200 * rim, rim);
          } else {
            r = pr; g = pg; b = pb;
          }

          r = lerp(r, texSet.fogColor[0], fogT * 0.6);
          g = lerp(g, texSet.fogColor[1], fogT * 0.6);
          b = lerp(b, texSet.fogColor[2], fogT * 0.6);

          const idx = (row * W + col) * 4;
          pixels[idx]   = clamp(r);
          pixels[idx+1] = clamp(g);
          pixels[idx+2] = clamp(b);
          pixels[idx+3] = 255;
        }
      }
    }

    // ── Post-processing: VHS grain + chromatic aberration ──────
    applyVHSGrain(pixels, W, H, t);

    ctx.putImageData(imageData, 0, 0);

    // Vignette overlay (drawn on top)
    const vignette = ctx.createRadialGradient(W/2, H/2, H*0.2, W/2, H/2, H*0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // Zone fog/tint overlay
    applyZoneTint(ctx, pZone, W, H, t);
  }

  function applyVHSGrain(pixels, W, H, t) {
    const grainAmt = 12;
    const aberration = Math.floor(1 + Math.sin(t * 0.3) * 1.5);

    // Chromatic aberration on left/right edges
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < Math.min(aberration * 3, W); x++) {
        const srcIdx = (y * W + Math.min(x + aberration, W - 1)) * 4;
        const dstIdx = (y * W + x) * 4;
        pixels[dstIdx] = pixels[srcIdx]; // shift red channel left
      }
      for (let x = W - 1; x > W - 1 - aberration * 3; x--) {
        const srcIdx = (y * W + Math.max(x - aberration, 0)) * 4;
        const dstIdx = (y * W + x) * 4;
        pixels[dstIdx + 2] = pixels[srcIdx + 2]; // shift blue channel right
      }
    }

    // Film grain
    for (let i = 0; i < pixels.length; i += 4) {
      const g = (Math.random() - 0.5) * grainAmt;
      pixels[i]   = clamp(pixels[i]   + g);
      pixels[i+1] = clamp(pixels[i+1] + g);
      pixels[i+2] = clamp(pixels[i+2] + g);
    }
  }

  function applyZoneTint(ctx, zone, W, H, t) {
    ctx.save();
    switch (zone) {
      case ZONE.BACKROOMS:
        ctx.fillStyle = `rgba(200,185,80,${0.04 + Math.sin(t * 0.7) * 0.01})`;
        break;
      case ZONE.DREAM:
        ctx.fillStyle = `rgba(230,160,200,${0.06 + Math.sin(t * 0.5) * 0.02})`;
        break;
      case ZONE.TADC:
        ctx.fillStyle = `rgba(80,20,50,${0.08 + Math.sin(t * 2) * 0.02})`;
        break;
      case ZONE.VOID:
        ctx.fillStyle = `rgba(0,10,20,0.12)`;
        break;
      default:
        ctx.restore(); return;
    }
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function getTexName(zone, type) {
    switch (zone) {
      case ZONE.HALLWAY:   return `hallway${cap(type)}`;
      case ZONE.CLASSROOM: return `classroom${cap(type)}`;
      case ZONE.POOL:      return `pool${cap(type)}`;
      case ZONE.MALL:      return `mall${cap(type)}`;
      case ZONE.HOSPITAL:  return `hospital${cap(type)}`;
      default:             return `void${cap(type)}`;
    }
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
  function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

  return { init, render };
})();
