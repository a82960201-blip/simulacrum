// renderer.js — DDA Raycaster with textures, sprites, fog, VHS effects

const Renderer = (() => {
  const TEX_SIZE = 64;
  const FOV = Math.PI / 3;

  let canvas, ctx, W, H;
  let zBuffer = [];
  const texData = {};
  let renderScale = 0.75;

  function extractPixels(name, texCanvas) {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE; c.height = TEX_SIZE;
    const tc = c.getContext('2d');
    tc.drawImage(texCanvas, 0, 0);
    texData[name] = tc.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data;
  }

  function init(canvasEl, scale) {
    canvas = canvasEl;
    renderScale = scale || 0.75;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    function resize() {
      W = Math.floor(window.innerWidth  * renderScale);
      H = Math.floor(window.innerHeight * renderScale);
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      canvas.width  = W;
      canvas.height = H;
      zBuffer = new Float32Array(W);
    }
    resize();
    window.addEventListener('resize', resize);

    // Extract all zone textures
    extractPixels('backroomsWall',    TextureLib.backroomsWall);
    extractPixels('backroomsFloor',   TextureLib.backroomsFloor);
    extractPixels('backroomsCeiling', TextureLib.backroomsCeiling);
    extractPixels('schoolWall',       TextureLib.schoolWall);
    extractPixels('schoolFloor',      TextureLib.schoolFloor);
    extractPixels('schoolCeiling',    TextureLib.schoolCeiling);
    extractPixels('poolWall',         TextureLib.poolWall);
    extractPixels('poolFloor',        TextureLib.poolFloor);
    extractPixels('poolCeiling',      TextureLib.poolCeiling);
    extractPixels('dreamWall',        TextureLib.dreamWall);
    extractPixels('dreamFloor',       TextureLib.dreamFloor);
    extractPixels('dreamCeiling',     TextureLib.dreamCeiling);
    extractPixels('circusWall',       TextureLib.circusWall);
    extractPixels('circusFloor',      TextureLib.circusFloor);
    extractPixels('circusCeiling',    TextureLib.circusCeiling);
    extractPixels('voidWall',         TextureLib.voidWall);
    extractPixels('voidFloor',        TextureLib.voidFloor);
    extractPixels('door',             TextureLib.door);
    extractPixels('exitDoor',         TextureLib.exitDoor);
    extractPixels('placeholder',      TextureLib.placeholder);
    extractPixels('entity',           TextureLib.entity);
  }

  function getTexPixel(name, tx, ty) {
    const data = texData[name];
    if (!data) return [128, 128, 128, 255];
    const idx = (ty * TEX_SIZE + tx) * 4;
    return [data[idx], data[idx+1], data[idx+2], data[idx+3]];
  }

  function render(player, sprites) {
    if (!W || !H) return;

    const imageData = ctx.createImageData(W, H);
    const pixels = imageData.data;

    const pZone = getZone(Math.floor(player.x), Math.floor(player.y));
    const pTexSet = getZoneTextures(pZone);
    const t = performance.now() / 1000;
    const halfH = H >> 1;

    // ── Floor & Ceiling ────────────────────────────────────
    for (let y = 0; y < H; y++) {
      if (y === halfH) continue;
      const isFloor = y > halfH;
      const realRowDist = Math.abs(halfH / (y - halfH + 0.001));

      const floorStepX = realRowDist * (Math.cos(player.angle + FOV/2) - Math.cos(player.angle - FOV/2)) / W;
      const floorStepY = realRowDist * (Math.sin(player.angle + FOV/2) - Math.sin(player.angle - FOV/2)) / W;

      let floorX = player.x + realRowDist * Math.cos(player.angle - FOV/2);
      let floorY = player.y + realRowDist * Math.sin(player.angle - FOV/2);

      for (let x = 0; x < W; x++) {
        const cellX = Math.floor(floorX), cellY = Math.floor(floorY);
        const tx = Math.floor((floorX - cellX) * TEX_SIZE) & (TEX_SIZE-1);
        const ty = Math.floor((floorY - cellY) * TEX_SIZE) & (TEX_SIZE-1);

        floorX += floorStepX; floorY += floorStepY;

        const zone = getZone(cellX, cellY);
        const texSet = getZoneTextures(zone);
        const fogT = Math.min(realRowDist / texSet.fogDist, 1);
        const fogMix = fogT * 0.88;

        let r, g, b;
        if (isFloor) {
          const [pr, pg, pb] = getTexPixel(getTexName(zone,'floor'), tx, ty);
          r = lerp(pr, texSet.fogColor[0], fogMix) * 0.62;
          g = lerp(pg, texSet.fogColor[1], fogMix) * 0.62;
          b = lerp(pb, texSet.fogColor[2], fogMix) * 0.62;
        } else {
          const [pr, pg, pb] = getTexPixel(getTexName(zone,'ceiling'), tx, ty);
          r = lerp(pr, texSet.fogColor[0], fogMix) * 0.52;
          g = lerp(pg, texSet.fogColor[1], fogMix) * 0.52;
          b = lerp(pb, texSet.fogColor[2], fogMix) * 0.52;
        }

        const idx = (y * W + x) * 4;
        pixels[idx]   = clamp(r);
        pixels[idx+1] = clamp(g);
        pixels[idx+2] = clamp(b);
        pixels[idx+3] = 255;
      }
    }

    // ── Wall casting (DDA) ──────────────────────────────────
    for (let col = 0; col < W; col++) {
      const rayAngle = player.angle - FOV/2 + (col/W) * FOV;
      const rayDirX  = Math.cos(rayAngle);
      const rayDirY  = Math.sin(rayAngle);

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const deltaDistX = Math.abs(1 / (rayDirX || 1e-10));
      const deltaDistY = Math.abs(1 / (rayDirY || 1e-10));

      let stepX, stepY, sideDistX, sideDistY;
      if (rayDirX < 0) { stepX=-1; sideDistX=(player.x-mapX)*deltaDistX; }
      else             { stepX= 1; sideDistX=(mapX+1-player.x)*deltaDistX; }
      if (rayDirY < 0) { stepY=-1; sideDistY=(player.y-mapY)*deltaDistY; }
      else             { stepY= 1; sideDistY=(mapY+1-player.y)*deltaDistY; }

      let hit=false, side=0, hitCell=CELL.WALL;
      const MAX_DIST = 40;
      let dist = 0;

      while (!hit && dist < MAX_DIST) {
        if (sideDistX < sideDistY) { sideDistX+=deltaDistX; mapX+=stepX; side=0; }
        else                        { sideDistY+=deltaDistY; mapY+=stepY; side=1; }
        if (mapX<0||mapX>=MAP_SIZE||mapY<0||mapY>=MAP_SIZE) { hit=true; break; }
        if (worldMap[mapY][mapX] !== CELL.EMPTY) {
          hitCell = worldMap[mapY][mapX]; hit = true;
        }
        dist++;
      }

      const perpWallDist = side===0
        ? (mapX - player.x + (1-stepX)/2) / (rayDirX||1e-10)
        : (mapY - player.y + (1-stepY)/2) / (rayDirY||1e-10);
      const absPerp = Math.abs(perpWallDist);
      zBuffer[col] = absPerp;

      const wallH = Math.min(H, Math.floor(H / absPerp));
      const wallTop = Math.max(0, Math.floor((H-wallH)/2));
      const wallBot = Math.min(H-1, wallTop+wallH);

      let wallX;
      if (side===0) wallX = player.y + absPerp * rayDirY;
      else          wallX = player.x + absPerp * rayDirX;
      wallX -= Math.floor(wallX);

      const hitZone   = getZone(mapX, mapY);
      const hitTexSet = getZoneTextures(hitZone);

      let wallTexName;
      if      (hitCell === CELL.EXIT) wallTexName = 'exitDoor';
      else if (hitCell === CELL.DOOR) wallTexName = 'door';
      else                            wallTexName = getTexName(hitZone, 'wall');

      const texX  = Math.floor(wallX * TEX_SIZE);
      const fogT  = Math.min(absPerp / hitTexSet.fogDist, 1);
      const shade = side===1 ? 0.68 : 1.0;

      for (let y = wallTop; y <= wallBot; y++) {
        const texY = Math.floor(((y-wallTop) / wallH) * TEX_SIZE) & (TEX_SIZE-1);
        const [pr, pg, pb] = getTexPixel(wallTexName, texX, texY);

        let r = lerp(pr*shade, hitTexSet.fogColor[0], fogT*0.8);
        let g = lerp(pg*shade, hitTexSet.fogColor[1], fogT*0.8);
        let b = lerp(pb*shade, hitTexSet.fogColor[2], fogT*0.8);

        // Zone-specific wall FX
        if (hitZone === ZONE.BACKROOMS || hitZone === ZONE.SCHOOL) {
          // Fluorescent flicker — the lights are failing
          const flicker = 0.90 + Math.sin(t*19+col*0.09)*0.05 + (Math.random()*0.03);
          r*=flicker; g*=flicker; b*=flicker;
        }
        if (hitZone === ZONE.DREAM) {
          // Soft pastel pulse — the mall breathes
          const pulse = 0.96 + Math.sin(t*0.4+col*0.005)*0.04;
          r=lerp(r,230,0.06)*pulse; g=lerp(g,200,0.04)*pulse; b=lerp(b,225,0.06)*pulse;
        }
        if (hitZone === ZONE.CIRCUS) {
          // Colour bleed + glitch flicker
          if (Math.random() > 0.995) { r=255; g=Math.random()*80; b=Math.random()*200; }
          const pulse = 0.88 + Math.sin(t*8+col*0.3)*0.08;
          r*=pulse; g*=pulse; b*=pulse;
        }
        if (hitZone === ZONE.POOL) {
          // Water light caustics ripple up walls
          const caustic = 0.94 + Math.sin(t*1.8+col*0.07)*0.04 + Math.cos(t*2.3+y*0.1)*0.03;
          r*=caustic; g*=caustic*1.05; b*=caustic*1.08;
        }

        if (hitCell === CELL.EXIT) {
          const glow = 0.4 + Math.sin(t*3)*0.12;
          r=lerp(r,122,glow); g=lerp(g,206,glow); b=lerp(b,200,glow);
        }
        if (hitCell === CELL.DOOR) {
          const pulse = 0.04 + Math.sin(t*1.4)*0.02;
          r=lerp(r,220,pulse); g=lerp(g,210,pulse); b=lerp(b,185,pulse);
        }

        const idx = (y*W+col)*4;
        pixels[idx]  =clamp(r); pixels[idx+1]=clamp(g);
        pixels[idx+2]=clamp(b); pixels[idx+3]=255;
      }
    }

    // ── Sprite casting ──────────────────────────────────────
    sprites.sort((a,b) => {
      const da=(a.x-player.x)**2+(a.y-player.y)**2;
      const db=(b.x-player.x)**2+(b.y-player.y)**2;
      return db-da;
    });

    for (const sprite of sprites) {
      const dx = sprite.x - player.x;
      const dy = sprite.y - player.y;

      const invDet = 1.0 / (Math.cos(player.angle)*Math.sin(player.angle+Math.PI/2) - Math.sin(player.angle)*Math.cos(player.angle+Math.PI/2));
      const transformX = invDet*(Math.sin(player.angle+Math.PI/2)*dx - Math.cos(player.angle+Math.PI/2)*dy);
      const transformY = invDet*(-Math.sin(player.angle)*dx + Math.cos(player.angle)*dy);

      if (transformY <= 0.05) continue;

      const spriteScreenX = Math.floor((W/2)*(1+transformX/transformY));
      const spriteH = Math.min(H, Math.abs(Math.floor(H/transformY)));
      const spriteW = spriteH;

      const drawStartY = Math.max(0, Math.floor((H-spriteH)/2));
      const drawEndY   = Math.min(H-1, Math.floor((H+spriteH)/2));
      const drawStartX = Math.max(0, spriteScreenX-spriteW/2);
      const drawEndX   = Math.min(W-1, spriteScreenX+spriteW/2);

      const dist2 = Math.sqrt(dx*dx+dy*dy);
      const zone  = getZone(Math.floor(sprite.x), Math.floor(sprite.y));
      const texSet = getZoneTextures(zone);
      const fogT  = Math.min(dist2/texSet.fogDist, 1);

      const isEntity = sprite.type==='entity';
      const pulse = isEntity ? (0.82+Math.sin(t*1.4)*0.18) : 1;

      for (let col=drawStartX; col<drawEndX; col++) {
        if (zBuffer[col] < transformY) continue;
        const texX = Math.floor((col-(spriteScreenX-spriteW/2))/spriteW*TEX_SIZE);
        for (let row=drawStartY; row<drawEndY; row++) {
          const texY = Math.floor((row-(H-spriteH)/2)/spriteH*TEX_SIZE);
          const [pr,pg,pb,pa] = getTexPixel(sprite.texture, texX, texY);
          if (pa<20) continue;

          let r,g,b;
          if (isEntity) {
            const rim = Math.max(0,1-(Math.abs(texX-TEX_SIZE/2)/(TEX_SIZE/2)))*0.35;
            r=lerp(pr*pulse,122*rim,rim);
            g=lerp(pg*pulse,206*rim,rim);
            b=lerp(pb*pulse,200*rim,rim);
          } else {
            r=pr; g=pg; b=pb;
          }
          r=lerp(r,texSet.fogColor[0],fogT*0.65);
          g=lerp(g,texSet.fogColor[1],fogT*0.65);
          b=lerp(b,texSet.fogColor[2],fogT*0.65);

          const idx=(row*W+col)*4;
          pixels[idx]=clamp(r); pixels[idx+1]=clamp(g);
          pixels[idx+2]=clamp(b); pixels[idx+3]=255;
        }
      }
    }

    // ── VHS post-processing ─────────────────────────────────
    applyVHS(pixels, W, H, t, pZone);

    ctx.putImageData(imageData, 0, 0);

    // Vignette
    const vignette = ctx.createRadialGradient(W/2,H/2,H*0.18,W/2,H/2,H*0.88);
    vignette.addColorStop(0,'rgba(0,0,0,0)');
    vignette.addColorStop(1,'rgba(0,0,0,0.70)');
    ctx.fillStyle=vignette; ctx.fillRect(0,0,W,H);

    // Zone colour tint
    applyZoneTint(ctx, pZone, W, H, t);
  }

  function applyVHS(pixels, W, H, t, zone) {
    // Grain strength varies by zone
    const grainAmt = zone===ZONE.CIRCUS ? 20 : zone===ZONE.DREAM ? 6 : 12;
    const aberration = Math.floor(1 + Math.sin(t*0.25)*1.5);

    // Chromatic aberration
    for (let y=0; y<H; y++) {
      for (let x=0; x<Math.min(aberration*4,W); x++) {
        const src=(y*W+Math.min(x+aberration,W-1))*4;
        const dst=(y*W+x)*4;
        pixels[dst]=pixels[src];
      }
      for (let x=W-1; x>W-1-aberration*4; x--) {
        const src=(y*W+Math.max(x-aberration,0))*4;
        const dst=(y*W+x)*4;
        pixels[dst+2]=pixels[src+2];
      }
    }

    // Circus gets extra corruption scanlines
    if (zone === ZONE.CIRCUS && Math.random() > 0.85) {
      const scanY = Math.floor(Math.random()*H);
      for (let x=0; x<W; x++) {
        const idx=(scanY*W+x)*4;
        pixels[idx]=255; pixels[idx+1]=Math.floor(Math.random()*80);
        pixels[idx+2]=Math.floor(Math.random()*255);
      }
    }

    // Pool gets vertical caustic shimmer
    if (zone === ZONE.POOL) {
      const shimX = Math.floor((Math.sin(t*2.1)+1)/2 * W);
      for (let y=0; y<H; y++) {
        const idx=(y*W+shimX)*4;
        pixels[idx]=Math.min(255,pixels[idx]+20);
        pixels[idx+1]=Math.min(255,pixels[idx+1]+30);
        pixels[idx+2]=Math.min(255,pixels[idx+2]+40);
      }
    }

    // Film grain
    for (let i=0; i<pixels.length; i+=4) {
      const g=(Math.random()-0.5)*grainAmt;
      pixels[i]=clamp(pixels[i]+g);
      pixels[i+1]=clamp(pixels[i+1]+g);
      pixels[i+2]=clamp(pixels[i+2]+g);
    }
  }

  function applyZoneTint(ctx, zone, W, H, t) {
    ctx.save();
    switch(zone) {
      case ZONE.BACKROOMS:
        // Sickly yellow fluorescent tint — flickers
        ctx.fillStyle=`rgba(200,185,80,${0.05+Math.sin(t*17)*0.015+Math.random()*0.01})`;
        break;
      case ZONE.SCHOOL:
        // Pale afternoon light — static
        ctx.fillStyle=`rgba(215,205,175,0.03)`;
        break;
      case ZONE.POOL:
        // Aquamarine shimmer
        ctx.fillStyle=`rgba(60,160,190,${0.04+Math.sin(t*0.8)*0.02})`;
        break;
      case ZONE.DREAM:
        // Soft pink-lilac haze
        ctx.fillStyle=`rgba(235,185,215,${0.06+Math.sin(t*0.35)*0.025})`;
        break;
      case ZONE.CIRCUS:
        // Red corruption — building
        const corruptAmt = 0.07+Math.sin(t*3.5)*0.04;
        ctx.fillStyle=`rgba(90,10,40,${corruptAmt})`;
        break;
      default:
        ctx.restore(); return;
    }
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  function getTexName(zone, type) {
    switch(zone) {
      case ZONE.BACKROOMS: return `backrooms${cap(type)}`;
      case ZONE.SCHOOL:    return `school${cap(type)}`;
      case ZONE.POOL:      return `pool${cap(type)}`;
      case ZONE.DREAM:     return `dream${cap(type)}`;
      case ZONE.CIRCUS:    return `circus${cap(type)}`;
      default:             return `void${cap(type)}`;
    }
  }

  function cap(s)    { return s.charAt(0).toUpperCase()+s.slice(1); }
  function lerp(a,b,t){ return a+(b-a)*Math.max(0,Math.min(1,t)); }
  function clamp(v)  { return Math.max(0,Math.min(255,Math.round(v))); }

  return { init, render };
})();
