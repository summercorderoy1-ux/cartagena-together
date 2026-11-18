// Pixel art drawn in code: characters, NPCs, tiles and tall decorations.
window.CG = window.CG || {};
(function (CG) {
  const T = 16;
  CG.T = T;

  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  CG.mk = mk;

  // ---------- Characters ----------
  // Letters map to palette keys; '.' is transparent. Each frame is 12x16.
  const BODY = {
    him: {
      down: [
        '....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HhSSSShH..', '..hSSSSSSh..',
        '...SESSES...', '...SSSSSS...', '....SSSS....', '..TTTTTTTT..', '.STTTTTTTTS.',
        '.STTTTTTTTS.', '..TTTTTTTT..', '..BBBBBBBB..'],
      up: [
        '....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HHHHHHHH..', '..hHHHHHHh..',
        '...hHHHHh...', '...SSSSSS...', '....SSSS....', '..TTTTTTTT..', '.STtTTTTtTS.',
        '.STTTTTTTTS.', '..TTTTTTTT..', '..BBBBBBBB..'],
      side: [
        '....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HHHHSSSh..', '..HHHSSSES..',
        '..HhSSSSSS..', '...hSSSSs...', '....SSSS....', '...TTTTTT...', '...TTTTST...',
        '...TTTTST...', '...TTTTTT...', '...BBBBBB...'],
      legs: 'pants',
    },
    her: {
      down: [
        '....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HhSSSShH..', '.HhSSSSSShH.',
        '.HHSESSESHH.', '.HHSSSSSSHH.', '.HH.SSSS.HH.', '.HHTTTTTTHH.', '.STTTTTTTTS.',
        '.S.TTTTTT.S.', '..TTTTTTTT..', '..TTTTTTTT..', '...TTTTTT...'],
      up: [
        '....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HHHHHHHH..', '.HHHHHHHHHH.',
        '.HHHHHHHHHH.', '.HHHHHHHHHH.', '.HhHHHHHHhH.', '.ShHHHHHHhS.', '.STTTTTTTTS.',
        '.S.TTTTTT.S.', '..TTTTTTTT..', '..TTTTTTTT..', '...TTTTTT...'],
      side: [
        '....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HHHHSSSh..', '.HHHHSSSES..',
        '.HHHhSSSSS..', '.HHHhSSSs...', '.HHH.SSSS...', '.HHTTTTTT...', '..HTTTTST...',
        '...TTTTST...', '...TTTTTTT..', '..TTTTTTTT..', '...TTTTTT...'],
      legs: 'dress',
    },
  };
  const LEGS = {
    pants: {
      front: [
        ['..BBB..BBB..', '..SS....SS..', '..FF....FF..'],
        ['..BBB..BBB..', '..SS....FF..', '..FF........'],
        ['..BBB..BBB..', '..FF....SS..', '........FF..']],
      side: [
        ['....BBBB....', '....SSSS....', '...FFFFF....'],
        ['...BB..BB...', '...SS...SS..', '..FF.....FF.'],
        ['....BBBB....', '....SS.S....', '...FFFFF....']],
    },
    dress: {
      front: [
        ['...SS..SS...', '...FF..FF...'],
        ['...SS..FF...', '...FF.......'],
        ['...FF..SS...', '.......FF...']],
      side: [
        ['....SSS.....', '...FFFF.....'],
        ['...S...S....', '..FF...FF...'],
        ['....SSS.....', '...FFFF.....']],
    },
  };

  const PALETTES = {
    him: { H: '#c49a4c', h: '#977233', S: '#fadcc6', s: '#e9bfa3', E: '#2b2230', T: '#f4f1e8', t: '#cfcabd', B: '#b59a6a', F: '#6b4a2f' },
    her: { H: '#f8e394', h: '#dcbc62', S: '#f7d6c0', s: '#e0b199', E: '#2b2230', T: '#ff7a6b', t: '#e05a4f', B: '#ff7a6b', F: '#c98b6b' },
  };
  CG.PALETTES = PALETTES;

  function paint(rows, pal, flip) {
    const w = rows[0].length, h = rows.length;
    const c = mk(w + 2, h + 2), x = c.getContext('2d');
    for (let r = 0; r < h; r++) {
      for (let i = 0; i < w; i++) {
        const ch = rows[r][flip ? w - 1 - i : i];
        if (ch && ch !== '.' && pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(i + 1, r + 1, 1, 1); }
      }
    }
    // soft dark outline for readability
    const img = x.getImageData(0, 0, c.width, c.height), d = img.data, out = new Uint8ClampedArray(d);
    for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) {
      const k = (y * c.width + i) * 4;
      if (d[k + 3]) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const xx = i + dx, yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < c.width && yy < c.height && d[(yy * c.width + xx) * 4 + 3];
      });
      if (n) { out[k] = 42; out[k + 1] = 31; out[k + 2] = 46; out[k + 3] = 200; }
    }
    x.putImageData(new ImageData(out, c.width, c.height), 0, 0);
    return c;
  }

  // Returns {down:[3], up:[3], right:[3], left:[3]} canvases (14x18).
  CG.makeCharacter = function (kind, pal) {
    const b = BODY[kind], L = LEGS[b.legs], sheet = {};
    sheet.down = L.front.map(l => paint(b.down.concat(l), pal, false));
    sheet.up = L.front.map(l => paint(b.up.concat(l), pal, false));
    sheet.right = L.side.map(l => paint(b.side.concat(l), pal, false));
    sheet.left = L.side.map(l => paint(b.side.concat(l), pal, true));
    return sheet;
  };

  const PALENQUERA = [
    '..rYyGrOr...', '...WWWWWW...', '....DDDD....', '...DSSSSD...', '...SESSES...',
    '...SSSSSS...', '....SSSS....', '..YYYYYYYY..', '.SYYYYYYYYS.', '.SRRRRRRRRS.',
    '..RRRRRRRR..', '.BBBBBBBBBB.', '.YYYYYYYYYY.', 'RRRRRRRRRRRR', '...SS..SS...', '...FF..FF...'];
  CG.makePalenquera = function () {
    const pal = { r: '#e8433a', Y: '#ffd23f', y: '#ffe680', G: '#5fbf3f', O: '#ff9a2e', W: '#8a5a2b', D: '#2b1a12',
      S: '#7a4a2c', E: '#1a1010', R: '#e8433a', B: '#2e7dd6', F: '#3b2516' };
    const a = paint(PALENQUERA, pal), b = paint(['............'].concat(PALENQUERA.slice(0, 15)), pal);
    return { down: [a, b, a], up: [a, b, a], left: [a, b, a], right: [a, b, a] };
  };

  // Animals: drawn facing right, mirrored for left.
  const ANIMALS = {
    horse: {
      rows: [
        '..........hh....', '.........hHHh...', '.........HHEH...', '..........HHHHs.', '.hhhhhhhhhHH....',
        'hHHHHHHHHHHH....', 'hHHHHHHHHHH.....', '.HHHHHHHHHH.....', '.HH.HH..HH.HH...', '.HH.HH..HH.HH...',
        '.FF.FF..FF.FF...'],
      pal: { H: '#a8682f', h: '#5a3418', E: '#1a1010', F: '#2b1a12', s: '#e8c39a' },
    },
    turtle: {
      rows: [
        '....GGGG....', '..GgGGgGG...', '.GGGgGGGGgSS', '.GgGGGgGGSES', '.GGGGGGgG.SS', '..GgGGGG....', '.S..SS..S...'],
      pal: { G: '#3f8a5a', g: '#2a6a42', S: '#9cc98a', E: '#1a1010' },
    },
  };
  CG.makeAnimal = function (kind) {
    const a = ANIMALS[kind];
    const r = paint(a.rows, a.pal, false), l = paint(a.rows, a.pal, true);
    const bob = ['.'.repeat(a.rows[0].length)].concat(a.rows.slice(0, -1));
    const r2 = paint(bob, a.pal, false), l2 = paint(bob, a.pal, true);
    return { right: [r, r2, r], left: [l, l2, l], down: [r, r2, r], up: [l, l2, l] };
  };

  // Kayak; (sx, sy) is the paddler's feet point.
  CG.drawKayak = function (g, sx, sy, color, dir, t) {
    const b = Math.round(Math.sin(t * 3) * 0.6);
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(sx + x), Math.round(sy + y + b), w, h); };
    if (dir === 'left' || dir === 'right') {
      px(-13, 0, 26, 1, 'rgba(255,255,255,0.55)');
      px(-9, -6, 18, 5, color); px(-11, -5, 2, 3, color); px(9, -5, 2, 3, color);
      px(-9, -2, 18, 1, 'rgba(0,0,0,0.25)'); px(-3, -5, 6, 3, '#2b2230');
    } else {
      px(-6, 11, 12, 1, 'rgba(255,255,255,0.55)');
      px(-5, -12, 10, 20, color); px(-4, -14, 8, 2, color); px(-3, -16, 6, 2, color); px(-4, 8, 8, 2, color); px(-3, 10, 6, 1, color);
      px(3, -12, 2, 20, 'rgba(0,0,0,0.2)'); px(-3, -6, 6, 6, '#2b2230');
    }
  };

  // ---------- Tiles ----------
  const TILE = CG.TILE = {
    WATER: 0, SHALLOW: 1, SAND: 2, GRASS: 3, ROAD: 4, PLAZA: 5, WALL: 6, WALLTOP: 7, ROOF: 8, FACADE: 9,
    TREE: 10, PALM: 11, DOCK: 12, CASTLE: 13, CPATH: 14, HROOF: 15, HFACADE: 16, TOWER: 17, GATE: 18,
    FLOWERS: 19, UMBRELLA: 20, BOVEDA: 21, CATHEDRAL: 22, FOUNTAIN: 23, HUT: 24, HAMMOCK: 25, BOAT: 26, CORAL: 27, TOWEL: 28,
  };
  const SOLID = new Set([TILE.WATER, TILE.WALL, TILE.ROOF, TILE.FACADE, TILE.TREE, TILE.PALM, TILE.CASTLE,
    TILE.HROOF, TILE.HFACADE, TILE.TOWER, TILE.BOVEDA, TILE.CATHEDRAL, TILE.FOUNTAIN, TILE.HUT, TILE.HAMMOCK, TILE.BOAT]);
  CG.isSolid = t => SOLID.has(t);

  CG.HOUSE_COLORS = ['#f2c94c', '#4fb3d9', '#f28c8c', '#f2994a', '#7bc67e', '#b48ce0', '#f6e7c1', '#e85d5d'];

  function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  const cache = new Map();
  CG.tileCanvas = function (type, v, color, frame) {
    const key = type + '|' + v + '|' + color + '|' + frame;
    let c = cache.get(key);
    if (!c) { c = mk(T, T); drawTile(c.getContext('2d'), type, v, color, frame); cache.set(key, c); }
    return c;
  };

  function drawTile(g, type, v, color, frame) {
    const R = rng(type * 977 + v * 131 + frame * 7 + 3);
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const speckle = (n, col) => { for (let i = 0; i < n; i++) px((R() * 16) | 0, (R() * 16) | 0, 1, 1, col); };
    const water = () => {
      px(0, 0, 16, 16, '#2a8fd6');
      for (let i = 0; i < 3; i++) { const y = ((i * 5 + v * 3 + frame * 2) % 16), x = ((i * 7 + v * 5) % 12); px(x, y, 4, 1, '#5fb4ec'); }
    };
    const shallow = () => {
      px(0, 0, 16, 16, '#43c9d6');
      for (let i = 0; i < 3; i++) { const y = ((i * 6 + v * 2 + frame * 3) % 16), x = ((i * 5 + v * 3 + frame) % 13); px(x, y, 3, 1, '#9cf0ee'); }
    };
    const sand = () => { px(0, 0, 16, 16, '#f2dca0'); speckle(7, '#e3c784'); speckle(2, '#fff3cc'); };
    const grass = () => { px(0, 0, 16, 16, '#6fbf4f'); for (let i = 0; i < 5; i++) { const x = (R() * 14) | 0, y = (R() * 14) | 0; px(x, y, 1, 2, '#58a63c'); px(x + 1, y + 1, 1, 1, '#58a63c'); } };
    const road = () => {
      px(0, 0, 16, 16, '#cdb79b');
      for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 2; x < 16; x += 5) { px(x, y, 4, 3, '#d9c5aa'); px(x, y + 3, 4, 1, '#ae977a'); }
    };
    const plaza = () => { px(0, 0, 16, 16, '#ece0c8'); px(0, 0, 16, 1, '#d8c9ab'); px(0, 0, 1, 16, '#d8c9ab'); px(8, 0, 1, 16, '#e0d2b6'); px(0, 8, 16, 1, '#e0d2b6'); };

    switch (type) {
      case TILE.WATER: water(); break;
      case TILE.SHALLOW: shallow(); break;
      case TILE.CORAL: shallow(); px(3 + v, 4, 3, 2, '#ff7f8a'); px(4 + v, 3, 1, 1, '#ff7f8a'); px(9, 10 - v, 3, 2, '#ffb04a'); px(10, 9 - v, 1, 1, '#ffb04a'); break;
      case TILE.SAND: case TILE.PALM: case TILE.HAMMOCK: sand();
        if (type === TILE.HAMMOCK) {
          px(1, 2, 2, 12, '#8a5a2b'); px(13, 2, 2, 12, '#8a5a2b');
          for (let x = 3; x < 13; x++) { const y = 6 + Math.round(Math.sin((x - 3) / 10 * Math.PI) * 3); px(x, y, 1, 3, ['#e8433a', '#ffd23f', '#2e7dd6'][x % 3]); }
        }
        break;
      case TILE.TOWEL: {
        sand();
        const a = v % 2 ? '#2e7dd6' : '#ff6fa8', b = v % 2 ? '#ffd23f' : '#e8433a';
        for (let i = 0; i < 9; i++) px(2, 5 + i, 9, 1, i % 2 ? '#ffffff' : a);
        px(12, 3, 1, 12, '#777777'); px(8, 1, 8, 2, b); px(9, 0, 6, 1, b); px(8, 3, 8, 1, '#00000022');
        break;
      }
      case TILE.GRASS: case TILE.TREE: grass(); break;
      case TILE.FLOWERS: grass(); for (let i = 0; i < 6; i++) { const x = 1 + ((R() * 13) | 0), y = 1 + ((R() * 13) | 0); px(x, y, 2, 2, ['#ff6fa8', '#ffd23f', '#ffffff', '#ff8a3d'][i % 4]); px(x, y + 2, 1, 1, '#3f8a2f'); } break;
      case TILE.ROAD: road(); break;
      case TILE.PLAZA: plaza(); break;
      case TILE.FOUNTAIN: plaza(); px(1, 2, 14, 12, '#bfae90'); px(2, 3, 12, 10, '#4fb3d9'); px(7, 4, 2, 8, '#d9cdb3'); px(6, 5 + frame % 2, 4, 1, '#bdeaff'); break;
      case TILE.GATE: road(); px(0, 0, 16, 4, '#3a2e26'); px(0, 4, 16, 1, '#6b5a48'); break;
      case TILE.UMBRELLA: {
        road();
        const cols = ['#e8433a', '#ffd23f', '#2e7dd6', '#5fbf3f', '#ff6fa8', '#ff9a2e', '#b48ce0'];
        for (let i = 0; i < 2; i++) {
          const c = cols[(v * 3 + i * 2) % cols.length], cx = 4 + i * 8, cy = 4 + ((v + i) % 2) * 6;
          px(cx - 3, cy, 7, 2, c); px(cx - 2, cy - 1, 5, 1, c); px(cx - 3, cy + 2, 1, 1, '#00000033'); px(cx, cy + 2, 1, 2, '#555');
        }
        break;
      }
      case TILE.WALL:
        px(0, 0, 16, 16, '#b9a27c');
        for (let y = 0; y < 16; y += 5) for (let x = (y / 5) % 2 ? -4 : 0; x < 16; x += 8) { px(x, y, 7, 4, '#c8b28b'); px(x, y + 4, 8, 1, '#8f7a58'); px(x + 7, y, 1, 4, '#8f7a58'); }
        speckle(4, '#a08a64');
        break;
      case TILE.WALLTOP: px(0, 0, 16, 16, '#d6c399'); px(0, 0, 16, 2, '#b9a27c'); speckle(6, '#c5af85'); if (v === 1) { px(0, 0, 16, 3, '#a8916b'); for (let x = 1; x < 16; x += 4) px(x, 0, 2, 2, '#8f7a58'); } break;
      case TILE.ROOF:
        if (color === 'grey') { px(0, 0, 16, 16, '#a9a49b'); for (let y = 2; y < 16; y += 4) px(0, y, 16, 1, '#8d887f'); break; }
        if (v === 3) { px(0, 0, 16, 16, '#efe7da'); px(0, 0, 16, 1, '#d6ccbb'); px(3, 4, 4, 4, '#5fbf3f'); px(4, 5, 2, 2, '#ff6fa8'); break; }
        px(0, 0, 16, 16, '#c8553d');
        for (let y = 1; y < 16; y += 3) { px(0, y, 16, 1, '#a8432f'); for (let x = (y % 2) * 2; x < 16; x += 4) px(x, y - 1, 1, 1, '#de6e52'); }
        break;
      case TILE.FACADE: {
        const wall = color || '#f2c94c';
        px(0, 0, 16, 16, wall); px(0, 0, 16, 3, '#a8432f'); px(0, 3, 16, 1, '#00000030'); px(0, 15, 16, 1, '#00000040');
        if (v >= 4) { // mural
          const cols = ['#e8433a', '#2e7dd6', '#ffd23f', '#5fbf3f', '#ff6fa8', '#222'];
          for (let i = 0; i < 6; i++) px(1 + ((R() * 12) | 0), 4 + ((R() * 9) | 0), 2 + ((R() * 4) | 0), 2 + ((R() * 3) | 0), cols[i]);
          px(6, 6, 4, 4, '#f6d2b8'); px(7, 7, 1, 1, '#222'); px(9, 7, 1, 1, '#222');
        } else if (v === 0) { px(5, 6, 6, 9, '#6b3f22'); px(6, 5, 4, 1, '#6b3f22'); px(8, 6, 1, 9, '#55301a'); px(9, 10, 1, 1, '#ffd23f'); }
        else if (v === 1 || v === 3) {
          px(4, 5, 8, 6, '#3b5f7a'); px(5, 6, 6, 4, '#7fa9c4');
          px(2, 10, 12, 1, '#6b3f22'); for (let x = 2; x < 14; x += 2) px(x, 11, 1, 3, '#6b3f22'); px(2, 13, 12, 1, '#6b3f22');
          if (v === 3 || ((R() * 2) | 0)) { for (let i = 0; i < 9; i++) px(1 + ((R() * 13) | 0), 4 + ((R() * 6) | 0), 2, 2, i % 3 ? '#e84c9a' : '#3f8a2f'); }
        } else { px(4, 5, 8, 8, '#2e5f8a'); px(4, 5, 4, 8, '#3d7bb0'); px(8, 5, 1, 8, '#22476a'); }
        break;
      }
      case TILE.BOVEDA:
        px(0, 0, 16, 16, '#f2c94c'); px(0, 0, 16, 3, '#a8432f'); px(3, 6, 10, 10, '#d9a73a'); px(4, 7, 8, 9, '#2e7dd6'); px(5, 5, 6, 2, '#d9a73a'); px(7, 8, 1, 8, '#22476a');
        break;
      case TILE.CATHEDRAL:
        px(0, 0, 16, 16, '#eadcc0'); px(0, 0, 16, 2, '#c9b996');
        if (v === 1) { px(4, 5, 8, 11, '#5a3a22'); px(5, 4, 6, 1, '#5a3a22'); px(6, 3, 4, 1, '#5a3a22'); px(8, 5, 1, 11, '#3f2716'); }
        else { px(6, 4, 4, 7, '#9fb7c9'); px(7, 3, 2, 1, '#9fb7c9'); px(2, 13, 12, 1, '#c9b996'); }
        break;
      case TILE.TOWER:
        px(0, 0, 16, 16, '#f1d48a'); px(0, 0, 16, 2, '#d9b862'); px(0, 14, 16, 2, '#c9a24e');
        if (v === 1) { px(1, 3, 2, 10, '#e2c070'); px(13, 3, 2, 10, '#e2c070'); }
        break;
      case TILE.CASTLE:
        px(0, 0, 16, 16, '#8c7d64');
        for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -3 : 0; x < 16; x += 6) { px(x, y, 5, 3, '#a19174'); px(x, y + 3, 6, 1, '#6b604d'); }
        if (v === 0) { px(2, 9, 4, 2, '#6f9a4a'); px(3, 8, 2, 1, '#6f9a4a'); }
        if (v === 2) { px(10, 3, 3, 2, '#6f9a4a'); }
        break;
      case TILE.CPATH:
        px(0, 0, 16, 16, '#eadfc4');
        for (let y = 3; y < 16; y += 5) px(1, y, 14, 1, '#d1c3a2');
        px(0, 0, 2, 16, '#5e5444'); px(14, 0, 2, 16, '#5e5444'); px(0, 0, 16, 1, '#f6eedb');
        break;
      case TILE.HROOF: px(0, 0, 16, 16, '#d5dae0'); px(0, 0, 16, 1, '#b8bfc7'); if (v % 2) { px(4, 4, 5, 4, '#9aa3ad'); px(5, 5, 3, 1, '#c7ced6'); } break;
      case TILE.HFACADE:
        px(0, 0, 16, 16, '#eef2f5');
        for (let y = 1; y < 16; y += 5) for (let x = 1; x < 16; x += 5) px(x, y, 4, 4, (x + y + v) % 3 ? '#7fb3d9' : '#a8d4f0');
        break;
      case TILE.DOCK: water(); px(0, 0, 16, 16, '#a0703f'); for (let y = 0; y < 16; y += 4) px(0, y + 3, 16, 1, '#7a5228'); px(1, 0, 1, 16, '#7a5228'); px(14, 0, 1, 16, '#7a5228'); break;
      case TILE.BOAT:
        water();
        if (v === 0) { px(4, 5, 12, 8, '#ffffff'); px(2, 7, 2, 4, '#ffffff'); px(4, 11, 12, 2, '#2e7dd6'); px(6, 6, 10, 3, '#e8433a'); }
        else { px(0, 5, 10, 8, '#ffffff'); px(10, 7, 3, 4, '#ffffff'); px(0, 11, 10, 2, '#2e7dd6'); px(0, 6, 7, 3, '#e8433a'); px(3, 3, 1, 3, '#555'); }
        break;
      case TILE.HUT:
        px(0, 0, 16, 16, '#c9a35b');
        for (let y = 1; y < 16; y += 3) px(0, y, 16, 1, '#a9853f');
        if (v === 1) { px(5, 8, 6, 8, '#6b4a2f'); }
        break;
      default: px(0, 0, 16, 16, '#f0f');
    }
  }

  // Tall things drawn above the tile layer, sorted with characters by y.
  CG.drawCanopy = function (g, type, sx, sy, frame, v) {
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(sx + x, sy + y, w, h); };
    if (type === TILE.TREE) {
      px(6, 6, 4, 10, '#7a4f2a');
      px(-1, -10, 18, 14, '#3f9a3a'); px(1, -13, 14, 3, '#3f9a3a'); px(1, 4, 14, 2, '#3f9a3a');
      px(2, -11, 6, 4, '#5bbd4c'); px(10, -6, 4, 3, '#5bbd4c');
      if (v % 2) { px(3, -4, 2, 2, '#ff6fa8'); px(11, -9, 2, 2, '#ff6fa8'); px(7, 0, 2, 2, '#ff6fa8'); }
    } else if (type === TILE.PALM) {
      const sway = (frame % 2) ? 1 : 0;
      for (let i = 0; i < 18; i++) px(7 + Math.round(Math.sin(i / 6) * 2), 14 - i, 3, 1, i % 3 ? '#9a6b3a' : '#7a4f2a');
      const top = -6, cx = 8 + sway;
      const leaf = (dx, dy, len) => { for (let i = 0; i < len; i++) px(cx + Math.round(dx * i), top + Math.round(dy * i + i * i * 0.06), 3, 2, i < 2 ? '#2f8a3a' : '#43b04a'); };
      leaf(1, -0.3, 8); leaf(-1, -0.3, 8); leaf(0.7, 0.4, 7); leaf(-0.7, 0.4, 7); leaf(0.2, -0.8, 5);
      px(cx - 1, top + 1, 2, 2, '#6b4a2f'); px(cx + 1, top + 2, 2, 2, '#6b4a2f');
    }
  };

  // Landmarks drawn as tall sprites.
  CG.drawClockTower = function (g, sx, sy) {
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(sx + x, sy + y, w, h); };
    // base covers 7 tiles wide; arch opening in middle 3 tiles
    px(0, -40, 112, 40, '#f1d48a'); px(0, -40, 112, 3, '#d9b862');
    px(32, -24, 48, 24, '#3a2e26'); px(36, -28, 40, 4, '#3a2e26'); px(40, -31, 32, 3, '#3a2e26');
    px(36, -78, 40, 40, '#f1d48a'); px(36, -78, 40, 3, '#d9b862');
    px(46, -70, 20, 20, '#ffffff'); px(47, -71, 18, 1, '#ffffff'); px(47, -50, 18, 1, '#ffffff');
    px(55, -66, 2, 7, '#222'); px(56, -60, 6, 2, '#222');
    px(40, -96, 32, 18, '#e8c86e'); px(44, -92, 6, 10, '#3a2e26'); px(62, -92, 6, 10, '#3a2e26');
    px(48, -108, 16, 12, '#c8553d'); px(54, -114, 4, 6, '#c8553d');
    for (let x = 0; x < 112; x += 8) px(x, -44, 5, 4, '#f1d48a');
  };
  CG.drawCathedralTower = function (g, sx, sy) {
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(sx + x, sy + y, w, h); };
    px(0, -44, 22, 44, '#eadcc0'); px(0, -44, 22, 3, '#c9b996'); px(7, -36, 8, 10, '#5a3a22');
    px(3, -60, 16, 16, '#f2994a'); px(6, -66, 10, 6, '#f2994a'); px(10, -72, 2, 6, '#555'); px(8, -70, 6, 2, '#555');
  };
  CG.drawFlag = function (g, sx, sy, frame) {
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(sx + x, sy + y, w, h); };
    px(0, -30, 2, 30, '#555');
    const w = frame % 2 ? 13 : 12;
    px(2, -30, w, 4, '#ffd23f'); px(2, -26, w, 2, '#2e7dd6'); px(2, -24, w, 2, '#e8433a');
  };

  // Collectible icons.
  CG.drawShell = function (g, sx, sy, frame, kind) {
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(sx + x, sy + y, w, h); };
    const bob = frame % 2;
    px(3, 13, 10, 2, '#00000022');
    const c = ['#ffb8c6', '#ffe0b0', '#f7f0ff', '#ffd1a1'][kind % 4], d = ['#e8879b', '#e0b070', '#c9b8e8', '#e0a060'][kind % 4];
    px(4, 6 - bob, 8, 6, c); px(5, 5 - bob, 6, 1, c); px(7, 4 - bob, 2, 1, c); px(6, 12 - bob, 4, 1, d);
    px(5, 7 - bob, 1, 4, d); px(7, 6 - bob, 1, 5, d); px(9, 6 - bob, 1, 5, d); px(11, 7 - bob, 1, 3, d);
    if (frame % 4 === 0) px(10, 4 - bob, 1, 1, '#fff');
  };
  CG.drawMemory = function (g, sx, sy, frame) {
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(sx + x, sy + y, w, h); };
    const bob = [0, -1, -2, -1][frame % 4];
    g.globalAlpha = 0.35; px(1, 12, 14, 3, '#ffffff'); g.globalAlpha = 1;
    // heart
    px(3, 1 + bob, 4, 3, '#ff4f7b'); px(9, 1 + bob, 4, 3, '#ff4f7b'); px(2, 2 + bob, 12, 3, '#ff4f7b');
    px(3, 5 + bob, 10, 2, '#ff4f7b'); px(5, 7 + bob, 6, 2, '#ff4f7b'); px(7, 9 + bob, 2, 1, '#ff4f7b'); px(4, 2 + bob, 2, 1, '#ffc2d1');
    // camera
    px(5, 3 + bob, 6, 4, '#2b2230'); px(7, 4 + bob, 2, 2, '#9fd8ff');
  };
})(window.CG);
