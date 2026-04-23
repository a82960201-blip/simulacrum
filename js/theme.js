// ============================================================
//  THEME.JS — Global neon color theme system
// ============================================================

const NEON_PALETTES = [
  { name: 'Matrix',   r: 0,   g: 255, b: 65  },
  { name: 'Shock',    r: 0,   g: 207, b: 255 },
  { name: 'Crimson',  r: 255, g: 45,  b: 85  },
  { name: 'Solar',    r: 255, g: 221, b: 0   },
  { name: 'Blaze',    r: 255, g: 119, b: 0   },
  { name: 'Violet',   r: 204, g: 68,  b: 255 },
  { name: 'Rose',     r: 255, g: 68,  b: 170 },
  { name: 'Aqua',     r: 0,   g: 255, b: 204 },
  { name: 'Lemon',    r: 170, g: 255, b: 0   },
  { name: 'Plasma',   r: 255, g: 0,   b: 255 },
];

const Theme = (() => {
  let currentIdx = 0;
  let multicolor = false;
  let multiHue   = 0;

  let fromR = 0, fromG = 255, fromB = 65;
  let toR   = 0, toG   = 255, toB   = 65;
  let transT = 1;

  function get() {
    let r, g, b;
    if (multicolor) {
      [r, g, b] = hslToRgb(multiHue / 360, 1, 0.55);
    } else if (transT < 1) {
      r = Math.round(fromR + (toR - fromR) * transT);
      g = Math.round(fromG + (toG - fromG) * transT);
      b = Math.round(fromB + (toB - fromB) * transT);
    } else {
      const p = NEON_PALETTES[currentIdx];
      r = p.r; g = p.g; b = p.b;
    }
    const hex = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    return { r, g, b, primary: hex, glow: hex };
  }

  function switchTo(idx, isMulti) {
    const cur = get();
    fromR = cur.r; fromG = cur.g; fromB = cur.b;
    transT = 0;
    if (isMulti) {
      multicolor = true;
      toR = 255; toG = 0; toB = 255;
    } else {
      multicolor = false;
      currentIdx = idx;
      const p = NEON_PALETTES[idx];
      toR = p.r; toG = p.g; toB = p.b;
    }
  }

  function update() {
    if (multicolor) multiHue = (multiHue + 1.4) % 360;
    if (transT < 1) transT = Math.min(1, transT + 0.035);
  }

  function rgba(alpha) {
    const c = get();
    return `rgba(${c.r},${c.g},${c.b},${alpha})`;
  }

  function hslToRgb(h, s, l) {
    const q = l < 0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l - q;
    return [hue2rgb(p,q,h+1/3), hue2rgb(p,q,h), hue2rgb(p,q,h-1/3)].map(v => Math.round(v*255));
  }
  function hue2rgb(p,q,t) {
    if (t<0) t+=1; if (t>1) t-=1;
    if (t<1/6) return p+(q-p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  }

  return { get, update, switchTo, rgba };
})();
