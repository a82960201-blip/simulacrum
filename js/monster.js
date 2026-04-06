// Monster.js — The thing in the Backrooms with you

const Monster = (() => {
  let position = { x: 12, y: 12 };
  let active = true;
  let lastSeenTime = 0;
  let proximityLevel = 0; // 0-1 for heartbeat effect
  
  function update(playerX, playerY, currentZone) {
    if (!active) return false;
    
    // Monster only active in Backrooms and Circus (it follows between zones)
    if (currentZone !== 'backrooms' && currentZone !== 'circus') {
      // It's still out there, waiting...
      proximityLevel = Math.max(0, proximityLevel - 0.02);
      return false;
    }
    
    // Calculate distance to player
    const dx = position.x - playerX;
    const dy = position.y - playerY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    // Proximity effect (0-1, closer = higher)
    proximityLevel = Math.min(1, Math.max(0, 1 - (dist / 15)));
    
    // Monster movement - faster when closer, with glitchy pathfinding
    let speed = 0.045;
    if (dist < 5) speed = 0.09;
    if (dist < 3) speed = 0.15;
    
    // Direction to player
    const angle = Math.atan2(playerY - position.y, playerX - position.x);
    
    // Add glitchy randomness (it doesn't move perfectly)
    const glitchX = (Math.random() - 0.5) * 0.03;
    const glitchY = (Math.random() - 0.5) * 0.03;
    
    position.x += Math.cos(angle) * speed + glitchX;
    position.y += Math.sin(angle) * speed + glitchY;
    
    // Keep monster within Backrooms bounds (roughly)
    position.x = Math.max(1, Math.min(34, position.x));
    position.y = Math.max(1, Math.min(34, position.y));
    
    // Check for kill
    if (dist < 0.8) {
      return true; // DEATH
    }
    
    // Occasionally teleport for jumpscare effect (rare)
    if (dist > 8 && Math.random() < 0.002 && currentZone === 'backrooms') {
      // Teleport closer but not on top of player
      const newAngle = Math.random() * Math.PI * 2;
      const newDist = 4 + Math.random() * 3;
      position.x = playerX + Math.cos(newAngle) * newDist;
      position.y = playerY + Math.sin(newAngle) * newDist;
      lastSeenTime = Date.now();
    }
    
    return false; // not dead
  }
  
  function getPosition() { return position; }
  function getProximity() { return proximityLevel; }
  function reset(startX, startY) {
    position = { x: startX || 12, y: startY || 12 };
    active = true;
    proximityLevel = 0;
  }
  function setActive(a) { active = a; }
  
  return { update, getPosition, getProximity, reset, setActive };
})();