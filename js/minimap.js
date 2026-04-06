// Minimap.js — Shows player position, landmarks, and monster

const Minimap = (() => {
  let canvas, ctx;
  let size = 160;
  let visible = true;
  
  function init() {
    canvas = document.getElementById('minimap-canvas');
    if (canvas) {
      ctx = canvas.getContext('2d');
      size = canvas.width;
    }
  }
  
  function render(playerX, playerY, playerAngle, currentZone, monsterPos, monsterProximity, fragments) {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, size, size);
    
    // Background (dark)
    ctx.fillStyle = 'rgba(10, 10, 8, 0.85)';
    ctx.fillRect(0, 0, size, size);
    
    // Grid lines (10-unit grid)
    ctx.strokeStyle = 'rgba(200, 185, 110, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 100; i += 10) {
      const sx = (i / 100) * size;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, sx);
      ctx.lineTo(size, sx);
      ctx.stroke();
    }
    
    // Convert world to minimap coordinates (world 0-100 maps to 0-size)
    function toScreen(x, y) {
      return { x: (x / 100) * size, y: (y / 100) * size };
    }
    
    // Draw landmarks (from Objectives)
    if (Objectives.landmarks) {
      for (let lm of Objectives.landmarks) {
        if (lm.zone === currentZone) {
          const pos = toScreen(lm.x, lm.y);
          ctx.fillStyle = 'rgba(122, 206, 200, 0.7)';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(122, 206, 200, 0.9)';
          ctx.font = 'bold 7px monospace';
          ctx.fillText(lm.name.charAt(0), pos.x - 2, pos.y + 2);
        }
      }
    }
    
    // Draw uncollected fragments
    for (let f of fragments) {
      if (!f.collected && f.zone === currentZone) {
        const pos = toScreen(f.x, f.y);
        ctx.fillStyle = 'rgba(200, 185, 110, 0.6)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(200, 185, 110, 0.8)';
        ctx.font = 'bold 6px monospace';
        ctx.fillText('●', pos.x - 2, pos.y + 2);
      }
    }
    
    // Draw monster (if active and in same zone)
    if (monsterPos && currentZone === 'backrooms') {
      const pos = toScreen(monsterPos.x, monsterPos.y);
      const pulse = 3 + Math.sin(Date.now() * 0.01) * 1;
      ctx.fillStyle = `rgba(255, 51, 102, ${0.6 + monsterProximity * 0.4})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff3366';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('⚠', pos.x - 3, pos.y + 3);
    }
    
    // Draw player (center of minimap, but we show relative)
    // Actually, player is always centered, so we draw at center
    const center = size / 2;
    
    // Draw view direction cone
    ctx.fillStyle = 'rgba(200, 185, 110, 0.15)';
    ctx.beginPath();
    ctx.moveTo(center, center);
    const angle1 = playerAngle - Math.PI / 4;
    const angle2 = playerAngle + Math.PI / 4;
    const coneLen = 25;
    ctx.lineTo(center + Math.cos(angle1) * coneLen, center + Math.sin(angle1) * coneLen);
    ctx.lineTo(center + Math.cos(angle2) * coneLen, center + Math.sin(angle2) * coneLen);
    ctx.fill();
    
    // Draw player
    ctx.fillStyle = '#c8b96e';
    ctx.beginPath();
    ctx.arc(center, center, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('▲', center - 3, center + 3);
    
    // Border
    ctx.strokeStyle = 'rgba(200, 185, 110, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, size, size);
  }
  
  return { init, render };
})();