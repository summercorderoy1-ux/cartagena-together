// Cartagena Together — two-player game loop, input, story and UI.
// Monty: WASD + E.  Summer: Arrow keys + Enter.
(function (CG) {
  const T = CG.T, TL = CG.TILE, W = 320, H = 180;
  const $ = id => document.getElementById(id);
  const stage = $('stage'), cv = $('game'), g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  // ---------- World & sprites ----------
  const MAPS = CG.buildWorld();
  const ALL_SHELLS = MAPS.cartagena.shells.concat(MAPS.island.shells);
  const ALL_MEM = MAPS.cartagena.memories.concat(MAPS.island.memories);
  const SHEETS = [CG.makeCharacter('him', CG.PALETTES.him), CG.makeCharacter('her', CG.PALETTES.her)];
  const P = (base, o) => Object.assign({}, CG.PALETTES[base], o);
  const NPC_SHEETS = {
    palenquera: CG.makePalenquera(),
    boatman: CG.makeCharacter('him', P('him', { H: '#2b1a12', h: '#1a1010', S: '#a86b45', s: '#8a5434', T: '#2e7dd6', t: '#22609f', B: '#e8e0d0' })),
    vendor: CG.makeCharacter('her', P('her', { H: '#3b2516', h: '#24160c', S: '#c98b5e', s: '#a86f48', T: '#5fbf3f', t: '#3f9a2f', B: '#5fbf3f' })),
    tourist: CG.makeCharacter('him', P('him', { H: '#d14b2f', h: '#a8361f', T: '#ff9a2e', t: '#d97a1a', B: '#3d7bb0' })),
    beach: CG.makeCharacter('her', P('her', { H: '#1a1010', h: '#000000', S: '#8a5a3c', s: '#6e452c', T: '#ffd23f', t: '#e0b020', B: '#ffd23f' })),
    guard: CG.makeCharacter('him', P('him', { H: '#1a1010', h: '#000000', S: '#c98b5e', s: '#a86f48', T: '#5a6b3f', t: '#46552f', B: '#3a3a3a' })),
    islander: CG.makeCharacter('her', P('her', { H: '#1a1010', h: '#000000', S: '#7a4a2c', s: '#5e3820', T: '#43c9d6', t: '#2aa3b0', B: '#43c9d6' })),
    musician: CG.makeCharacter('him', P('him', { H: '#1a1010', h: '#000000', S: '#8a5a3c', s: '#6e452c', T: '#ffffff', t: '#dddddd', B: '#222222' })),
    cook: CG.makeCharacter('her', P('her', { H: '#1a1010', h: '#000000', S: '#a86b45', s: '#8a5434', T: '#ffffff', t: '#e0e0e0', B: '#ffffff' })),
    coconut: CG.makeCharacter('her', P('her', { H: '#2b1a12', h: '#1a1010', S: '#7a4a2c', s: '#5e3820', T: '#ff6fa8', t: '#e0508a', B: '#ff6fa8' })),
    lifeguard: CG.makeCharacter('him', P('him', { H: '#2b1a12', h: '#1a1010', S: '#c98b5e', s: '#a86f48', T: '#e8433a', t: '#c02f28', B: '#ffd23f' })),
    driver: CG.makeCharacter('him', P('him', { H: '#777777', h: '#555555', S: '#c98b5e', s: '#a86f48', T: '#f2efe6', t: '#cfcabd', B: '#3a3a3a' })),
    fisher: CG.makeCharacter('him', P('him', { H: '#999999', h: '#777777', S: '#a86b45', s: '#8a5434', T: '#4fb3d9', t: '#2e8fb8', B: '#c2a878' })),
    painter: CG.makeCharacter('her', P('her', { H: '#b5452f', h: '#8a3222', T: '#b48ce0', t: '#8f6ac0', B: '#b48ce0' })),
    kid: CG.makeCharacter('him', P('him', { H: '#1a1010', h: '#000000', S: '#8a5a3c', s: '#6e452c', T: '#ffd23f', t: '#e0b020', B: '#2e7dd6' })),
    luz: CG.makeCharacter('her', P('her', { H: '#e6e6e6', h: '#bbbbbb', S: '#c98b5e', s: '#a86f48', T: '#4fb3d9', t: '#2e8fb8', B: '#4fb3d9' })),
    pedro: CG.makeCharacter('him', P('him', { H: '#2b1a12', h: '#1a1010', S: '#a86b45', s: '#8a5434', T: '#7bc67e', t: '#5aa85e', B: '#c2a878' })),
    snorkel: CG.makeCharacter('him', P('him', { H: '#1a1010', h: '#000000', S: '#7a4a2c', s: '#5e3820', T: '#ff9a2e', t: '#d97a1a', B: '#2e7dd6' })),
    horse: CG.makeAnimal('horse'),
    turtle: CG.makeAnimal('turtle'),
  };
  for (const m of Object.values(MAPS)) {
    for (const n of m.npcs) Object.assign(n, { isNpc: true, px: n.x * T + 8, py: n.y * T + 14, dir: 'down', anim: 0, moving: false, wait: 1 + Math.random() * 2, tgt: null });
    for (const k of m.kayaks || []) Object.assign(k, { px: k.x * T + 8, py: k.y * T + 12, dir: 'right', rider: null });
  }

  // ---------- Save data ----------
  const SAVE_KEY = 'cartagena-together-v1';
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const fresh = names => ({ names: names || ['Monty', 'Summer'], shells: {}, memories: {}, photos: {}, map: 'cartagena', pos: null, ended: false, follow: isTouch });
  let S = fresh();
  function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.names ? s : null; } catch (e) { return null; } }
  function save() {
    S.pos = party.map(c => ({ x: c.x, y: c.y, dir: c.dir }));
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked or full: keep playing */ }
  }

  // ---------- The two players ----------
  const mkChar = i => ({ i, isParty: true, x: 0, y: 0, dir: 'down', anim: 0, moving: false, mode: 'walk', idle: 0, trail: [], kayak: null, bob: 0 });
  const party = [mkChar(0), mkChar(1)];
  let map = MAPS.cartagena;
  const other = c => party[1 - c.i];
  const nm = c => S.names[c.i];
  const MAX_DX = 276, MAX_DY = 140; // keep both players on the same screen

  const WATERY = new Set([TL.WATER, TL.SHALLOW, TL.CORAL]);
  const tileAt = (px, py) => map.get(Math.floor(px / T), Math.floor(py / T));
  const inBounds = (px, py) => px >= 0 && py >= 0 && px < map.w * T && py < map.h * T;
  function solidFor(c, px, py) {
    if (!inBounds(px, py)) return true;
    const t = tileAt(px, py);
    if (c.mode === 'kayak' || c.swim) return !WATERY.has(t);
    if (c.isNpc) return t === TL.WATER || CG.isSolid(t);
    return t !== TL.WATER && CG.isSolid(t);
  }
  function blocked(c, x, y) {
    const x0 = x - 5, x1 = x + 4, y0 = y - 5, y1 = y - 1;
    if (solidFor(c, x0, y0) || solidFor(c, x1, y0) || solidFor(c, x0, y1) || solidFor(c, x1, y1)) return true;
    const hit = e => e !== c && Math.abs(e.px - x) < 10 && y > e.py - 6 && y < e.py + 5;
    if (map.npcs.some(hit)) return true;
    if (c.isNpc && party.some(p => Math.abs(p.x - x) < 12 && Math.abs(p.y - y) < 8)) return true;
    return false;
  }
  function terrain(c) {
    if (c.mode === 'kayak') return 'kayak';
    const t = tileAt(c.x, c.y - 2);
    return t === TL.WATER ? 'swim' : WATERY.has(t) ? 'wade' : 'walk';
  }
  const SPEED = { walk: 1.3, wade: 1.0, swim: 0.8, kayak: 1.9 };

  function placeBoth(mapName, px, py, dir) {
    for (const c of party) if (c.kayak) { c.kayak.rider = null; c.kayak = null; }
    map = MAPS[mapName]; S.map = mapName;
    const a = party[0], b = party[1];
    a.x = px; a.y = py; a.dir = b.dir = dir; a.mode = b.mode = 'walk';
    let placed = false;
    const spots = [[16, 0], [-16, 0], [0, 16], [0, -16], [16, 16], [-16, 16]];
    for (const dry of [true, false]) {
      for (const [ox, oy] of spots) {
        const x = px + ox, y = py + oy;
        if (!blocked(b, x, y) && (!dry || !WATERY.has(tileAt(x, y - 2)))) { b.x = x; b.y = y; placed = true; break; }
      }
      if (placed) break;
    }
    if (!placed) { b.x = px; b.y = py; }
    for (const c of party) { c.trail = []; c.mode = terrain(c); c.moving = false; c.bob = 0; }
    updateHUD();
  }
  const tileToPx = (tx, ty) => [tx * T + 8, ty * T + 14];

  // ---------- Input ----------
  const keys = {};
  const MOVE = [
    { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
  ];
  const DIRCODE = {}; MOVE.forEach((m, i) => Object.entries(m).forEach(([d, code]) => (DIRCODE[code] = { p: i, d })));
  const ACTCODE = { KeyE: 0, Space: 0, Enter: 1, NumpadEnter: 1, ShiftRight: 1, Slash: 1 };
  const MENU = { KeyP: 'album', KeyM: 'map', KeyN: 'music', KeyF: 'follow', Escape: 'esc' };
  const touchIn = { up: false, down: false, left: false, right: false };
  const actions = [];
  addEventListener('keydown', e => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') { if (e.code === 'Enter') $('btn-start').click(); return; }
    if (DIRCODE[e.code]) { keys[e.code] = true; if (!e.repeat) actions.push({ a: 'dir', ...DIRCODE[e.code] }); e.preventDefault(); }
    else if (e.code in ACTCODE) { if (!e.repeat) actions.push({ a: 'act', p: ACTCODE[e.code] }); e.preventDefault(); }
    else if (MENU[e.code]) { if (!e.repeat) actions.push({ a: MENU[e.code] }); e.preventDefault(); }
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  function dirOf(i) {
    const m = MOVE[i];
    let dx = (keys[m.right] ? 1 : 0) - (keys[m.left] ? 1 : 0), dy = (keys[m.down] ? 1 : 0) - (keys[m.up] ? 1 : 0);
    if (i === 0) { dx += (touchIn.right ? 1 : 0) - (touchIn.left ? 1 : 0); dy += (touchIn.down ? 1 : 0) - (touchIn.up ? 1 : 0); }
    return [Math.max(-1, Math.min(1, dx)), Math.max(-1, Math.min(1, dy))];
  }
  if (isTouch) {
    $('touch').classList.remove('hidden');
    document.querySelectorAll('#touch button').forEach(b => {
      const k = b.dataset.k;
      const on = e => {
        e.preventDefault(); CG.audio.start();
        if (k in touchIn) { touchIn[k] = true; actions.push({ a: 'dir', p: 0, d: k }); }
        else if (k === 'act') actions.push({ a: 'act', p: 0 });
        else if (k === 'act2') actions.push({ a: 'act', p: 1 });
      };
      const off = e => { e.preventDefault(); if (k in touchIn) touchIn[k] = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
  }

  // ---------- Modes ----------
  let mode = 'title', time = 0;
  const particles = [];
  let dlg = null, photo = null, travel = null, ev = null, endingDelay = -1, sunset = 0, saveTimer = 0, toastTimer = 0;

  // ---------- UI helpers ----------
  function toast(html, secs = 2.6) { const t = $('toast'); t.innerHTML = html; t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; toastTimer = secs; }
  function fadeBlink() { const f = $('fade'); f.style.opacity = 1; setTimeout(() => (f.style.opacity = 0), 380); }
  const countShells = () => ALL_SHELLS.filter(s => S.shells[s.id]).length;
  const countMem = () => ALL_MEM.filter(m => S.memories[m.id]).length;
  const mid = () => ({ x: (party[0].x + party[1].x) / 2, y: (party[0].y + party[1].y) / 2 });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const npcPt = n => ({ x: n.px, y: n.py });
  const bothNear = (pt, r) => party.every(c => dist(c, pt) < r);
  function hearts(x, y, n) { for (let i = 0; i < n; i++) particles.push({ x: x + (Math.random() * 20 - 10), y: y - 20, vx: Math.random() * 0.6 - 0.3, vy: -0.4 - Math.random() * 0.4, life: 1.5, kind: 'heart' }); }
  function areaName() {
    if (S.map === 'island') return 'Islas del Rosario';
    const p = mid(), tx = p.x / T, ty = p.y / T;
    if (tx < 18) return 'Mar Caribe';
    if (tx >= 24 && tx < 61 && ty >= 8 && ty < 39) return 'Ciudad Amurallada';
    if (tx >= 61 && tx < 83 && ty >= 22 && ty < 49) return 'Getsemaní';
    if (tx >= 83 && ty >= 23 && ty < 50) return 'Castillo San Felipe';
    if (tx < 41 && ty >= 51) return 'Bocagrande';
    if (ty >= 54) return 'La Bahía';
    if (ty >= 49 && tx >= 46) return 'El Muelle';
    if (tx < 27) return 'La Playa';
    return 'Cartagena';
  }
  let lastArea = '';
  function updateHUD() {
    const a = areaName();
    if (a !== lastArea) { $('hud-place').textContent = a; lastArea = a; }
    $('hud-shells').textContent = countShells() + '/' + ALL_SHELLS.length;
    $('hud-mem').textContent = countMem() + '/' + ALL_MEM.length;
    $('hud-leader').textContent = isTouch
      ? `${S.names[0]}: pad + A · ${S.names[1]}: B`
      : `${S.names[0]}: WASD + E · ${S.names[1]}: arrows + Enter`;
    $('btn-music').textContent = CG.audio.musicOn ? '♪ On' : '♪ Off';
    $('btn-follow').textContent = S.follow ? 'Follow: On' : 'Follow: Off';
  }

  // ---------- Dialog ----------
  function openDialog(name, lines, opts = {}) {
    dlg = Object.assign({ name, lines, i: 0, chars: 0, sel: 0 }, opts);
    mode = 'dialog'; updatePrompt();
    $('dialog').classList.remove('hidden'); $('dialog-name').textContent = name; $('dialog-choices').innerHTML = ''; renderDialog();
  }
  function renderDialog() {
    const line = dlg.lines[dlg.i], done = dlg.chars >= line.length;
    $('dialog-text').textContent = line.slice(0, Math.floor(dlg.chars));
    const last = dlg.i === dlg.lines.length - 1, ch = $('dialog-choices');
    if (done && last && dlg.choices) {
      if (!ch.childElementCount) dlg.choices.forEach((c, k) => {
        const b = document.createElement('button'); b.textContent = c;
        b.addEventListener('click', e => { e.stopPropagation(); dlg.sel = k; confirmChoice(); });
        ch.appendChild(b);
      });
      [...ch.children].forEach((b, k) => b.classList.toggle('sel', k === dlg.sel));
      $('dialog-next').classList.add('hidden');
    } else { ch.innerHTML = ''; $('dialog-next').classList.toggle('hidden', !done); }
  }
  function advanceDialog() {
    const line = dlg.lines[dlg.i];
    if (dlg.chars < line.length) { dlg.chars = line.length; renderDialog(); return; }
    if (dlg.i < dlg.lines.length - 1) { dlg.i++; dlg.chars = 0; renderDialog(); return; }
    if (dlg.choices) { confirmChoice(); return; }
    const d = dlg; closeDialog(); if (d.onDone) d.onDone();
  }
  function confirmChoice() { const d = dlg; closeDialog(); if (d.onChoice) d.onChoice(d.sel); }
  function closeDialog() { $('dialog').classList.add('hidden'); $('dialog-choices').innerHTML = ''; dlg = null; mode = 'play'; }
  $('dialog').addEventListener('click', () => { if (mode === 'dialog') advanceDialog(); });

  const WAIT_LINE = c => `Where’s ${nm(other(c))}? Come back together, mis amores!`;
  function talkTo(n, c) {
    let lines = n.lines.slice();
    const opts = {}, together = bothNear(npcPt(n), 64);
    if (n.look === 'horse') CG.audio.sfx('neigh');
    if (n.memory) {
      if (S.memories[n.memory]) lines = ['¡Qué bonito verlos otra vez! Enjoy Cartagena, mis amores.'];
      else if (!together) lines.push(WAIT_LINE(c));
      else { const m = ALL_MEM.find(q => q.id === n.memory); opts.onDone = () => takePhoto(m, npcPt(n)); }
    }
    if (n.action === 'toIsland' || n.action === 'toCity' || n.action === 'carriage' || n.action === 'dance') {
      if (!together) lines.push(n.action === 'dance' ? `A dance needs two! Bring ${nm(other(c))} over here.` : `I’ll wait until both of you are here, ¡tranquilos!`);
      else if (n.action === 'toIsland') { opts.choices = ['Yes, let’s sail!', 'Not yet']; opts.onChoice = k => { if (k === 0) startTravel('island'); }; }
      else if (n.action === 'toCity') { opts.choices = ['Back to the city', 'Stay a bit longer']; opts.onChoice = k => { if (k === 0) startTravel('cartagena'); }; }
      else if (n.action === 'dance') { opts.choices = ['Dance together!', 'Maybe later']; opts.onChoice = k => { if (k === 0) startDance(n); }; }
      else if (n.action === 'carriage') {
        const dest = [['Plaza de Bolívar', 44, 24], ['Castillo San Felipe', 86, 48], ['Bocagrande', 27, 60]];
        opts.choices = dest.map(d => d[0]).concat(['No thanks']);
        opts.onChoice = k => { if (k < dest.length) carriageRide(dest[k]); };
      }
    }
    if (n.action === 'treat') opts.onDone = () => treat(n, c);
    if (n.action === 'fish') opts.onDone = () => startFish(c);
    openDialog(n.name || 'Local', lines, opts);
  }

  // ---------- Activities ----------
  function treat(n, c) {
    const o = other(c), together = dist(c, o) < 64;
    CG.audio.sfx('yum');
    hearts(c.x, c.y, 3); if (together) hearts(o.x, o.y, 3);
    toast(together ? `😋 ${S.names[0]} & ${S.names[1]} share ${n.treat}` : `😋 ${nm(c)} enjoys ${n.treat}`, 2.6);
  }
  function startDance(n) {
    ev = { kind: 'dance', t: 0, n }; mode = 'event';
    CG.audio.sfx('dance');
  }
  function startFish(c) {
    ev = { kind: 'fish', t: 0, c }; mode = 'event';
    c.dir = 'down';
  }
  const CATCHES = ['a red snapper (pargo rojo) 🐟', 'a tiny crab 🦀', 'a shiny piece of sea glass ✨', 'a mojarra 🐠', 'an old flip-flop 🩴', 'a little octopus 🐙'];
  function carriageRide(d) {
    fadeBlink(); CG.audio.sfx('neigh');
    placeBoth('cartagena', ...tileToPx(d[1], d[2]), 'down');
    toast(`🐴 Clip-clop… you arrive at ${d[0]}`, 2.6);
    save();
  }
  function hug(c) {
    const o = other(c);
    const lines = [
      `${nm(c)} hugs ${nm(o)} 💛`, `${nm(c)} gives ${nm(o)} a kiss on the cheek 😘`, `${S.names[0]} & ${S.names[1]} hold hands 🤝`,
      `${nm(c)} tells ${nm(o)}: “Te quiero” 💕`, `${nm(c)} spins ${nm(o)} around 💃`,
    ];
    hearts((c.x + o.x) / 2, Math.min(c.y, o.y), 6);
    c.dir = o.x > c.x ? 'right' : 'left'; o.dir = c.x > o.x ? 'right' : 'left';
    CG.audio.sfx('hug'); toast(lines[(Math.random() * lines.length) | 0], 2.2);
  }
  function updateEvent(dt) {
    ev.t += dt;
    if (ev.kind === 'dance') {
      const dirs = ['down', 'right', 'up', 'left'];
      party.forEach((c, k) => { c.dir = dirs[(Math.floor(ev.t * 6) + k * 2) % 4]; c.bob = Math.abs(Math.sin(ev.t * 9 + k)) * 3; });
      if (Math.floor(ev.t * 5) !== Math.floor((ev.t - dt) * 5)) {
        const c = party[(Math.random() * 2) | 0];
        particles.push({ x: c.x + (Math.random() * 16 - 8), y: c.y - 22, vx: Math.random() * 0.4 - 0.2, vy: -0.5, life: 1.2, kind: Math.random() < 0.5 ? 'note' : 'heart' });
      }
      if (Math.floor(ev.t / 1.0) !== Math.floor((ev.t - dt) / 1.0)) CG.audio.sfx('dance');
      if (ev.t > 3.6) { party.forEach(c => { c.bob = 0; c.dir = 'down'; }); ev = null; mode = 'play'; toast(`💃🕺 ${S.names[0]} & ${S.names[1]} danced champeta with Don Rafa!`, 3); }
    } else if (ev.kind === 'fish') {
      const c = ev.c;
      if (ev.t > 0.4 && !ev.bite) { ev.bite = true; }
      if (ev.t > 1.9 && !ev.done) {
        ev.done = true; CG.audio.sfx('catch');
        particles.push({ x: c.x, y: c.y - 24, vx: 0, vy: -0.3, life: 0.8, kind: 'bang' });
        toast(`🎣 ${nm(c)} caught ${CATCHES[(Math.random() * CATCHES.length) | 0]}!`, 2.6);
      }
      if (ev.t > 2.4) { ev = null; mode = 'play'; }
    }
  }

  // ---------- Kayaks ----------
  function landSpot(c) {
    const fwd = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[c.dir];
    const dirs = [fwd, [0, 1], [0, -1], [1, 0], [-1, 0]];
    const walker = { mode: 'walk', isParty: true };
    for (const [dx, dy] of dirs) for (const r of [14, 18, 22]) {
      const x = c.x + dx * r, y = c.y + dy * r;
      if (inBounds(x, y) && !WATERY.has(tileAt(x, y - 2)) && !blocked(walker, x, y)) return { x, y };
    }
    return null;
  }
  function boardKayak(c, k) {
    c.mode = 'kayak'; c.kayak = k; k.rider = c; c.x = k.px; c.y = k.py; c.trail = [];
    CG.audio.sfx('kayak'); toast(`🛶 ${nm(c)} hops into a kayak!`, 1.8);
  }
  function leaveKayak(c, spot) {
    const k = c.kayak; k.px = c.x; k.py = c.y; k.dir = c.dir; k.rider = null;
    c.kayak = null; c.mode = 'walk'; c.x = spot.x; c.y = spot.y; c.mode = terrain(c); c.trail = [];
    CG.audio.sfx('splash');
  }

  // ---------- Interaction ----------
  function findInteract(c) {
    // People first (the horse is bigger, so a slightly larger reach), then photo spots and kayaks.
    let best = null, bd = 24;
    for (const n of map.npcs) {
      const d = dist(c, npcPt(n)), reach = n.look === 'horse' ? 30 : 26;
      if (d < reach && (!best || d < bd)) { bd = d; best = { type: 'npc', n }; }
    }
    if (c.mode === 'kayak') {
      if (best) return best;
      const spot = landSpot(c);
      return spot ? { type: 'unkayak', spot } : null;
    }
    for (const m of map.memories) {
      if (m.x == null || S.memories[m.id]) continue;
      const d = dist(c, { x: m.x * T + 8, y: m.y * T + 12 });
      if (d < 20 && d < bd) { bd = d; best = { type: 'mem', m }; }
    }
    for (const k of map.kayaks || []) {
      if (k.rider) continue;
      const d = dist(c, { x: k.px, y: k.py });
      if (d < 20 && d < bd) { bd = d; best = { type: 'kayak', k }; }
    }
    if (!best && dist(c, other(c)) < 22 && other(c).mode !== 'kayak') best = { type: 'hug' };
    return best;
  }
  function doInteract(c) {
    const it = findInteract(c);
    if (!it) return;
    if (it.type === 'npc') talkTo(it.n, c);
    else if (it.type === 'mem') {
      const pt = { x: it.m.x * T + 8, y: it.m.y * T + 12 };
      if (bothNear(pt, 44)) takePhoto(it.m, pt);
      else toast(`📷 ${nm(other(c))} needs to come to the ♥ spot too!`, 2.4);
    } else if (it.type === 'kayak') boardKayak(c, it.k);
    else if (it.type === 'unkayak') leaveKayak(c, it.spot);
    else if (it.type === 'hug') hug(c);
  }
  let lastPrompt = '';
  function updatePrompt() {
    let html = '';
    if (mode === 'play') {
      const keysTxt = isTouch ? ['A', 'B'] : ['E', 'Enter'];
      const parts = party.map(c => {
        const it = findInteract(c);
        if (!it) return '';
        const label = it.type === 'npc' ? `Talk to ${it.n.name}` : it.type === 'mem' ? `Photo together · ${it.m.title}`
          : it.type === 'kayak' ? 'Get in the kayak' : it.type === 'unkayak' ? 'Climb out' : `Hug ${nm(other(c))}`;
        return `<b>${keysTxt[c.i]}</b> ${nm(c)}: ${label}`;
      }).filter(Boolean);
      html = parts.join('<br>');
    }
    if (html !== lastPrompt) { lastPrompt = html; $('prompt').innerHTML = html; $('prompt').classList.toggle('hidden', !html); }
  }

  // ---------- Photos ----------
  function takePhoto(m, pt) {
    const [a, b] = party;
    for (const c of party) if (c.kayak) leaveKayak(c, landSpot(c) || { x: c.x, y: c.y });
    a.x = pt.x - 8; a.y = pt.y + 2; b.x = pt.x + 8; b.y = pt.y + 2;
    if (blocked(a, a.x, a.y) || blocked(b, b.x, b.y)) { a.x = pt.x - 8; b.x = pt.x + 8; a.y = b.y = pt.y + 14; }
    if (blocked(a, a.x, a.y) || blocked(b, b.x, b.y)) { a.x = pt.x; a.y = pt.y + 2; b.x = pt.x + 14; b.y = pt.y + 2; }
    for (const c of party) { c.dir = 'down'; c.moving = false; c.mode = terrain(c); }
    photo = { m, t: 0, shot: false, hearts: false };
    mode = 'photo'; updatePrompt();
  }
  function updatePhoto(dt) {
    photo.t += dt;
    const [a, b] = party;
    if (photo.t > 0.3 && !photo.hearts) { photo.hearts = true; hearts((a.x + b.x) / 2, Math.min(a.y, b.y), 10); }
    if (photo.t > 0.9 && !photo.shot) {
      photo.shot = true;
      render();
      try {
        const c = CG.mk(192, 108), x = c.getContext('2d');
        const cw = 176, ch = 99;
        const sx = Math.max(0, Math.min(W - cw, Math.round((a.x + b.x) / 2 - cam.x - cw / 2)));
        const sy = Math.max(0, Math.min(H - ch, Math.round((a.y + b.y) / 2 - 14 - cam.y - ch / 2)));
        x.imageSmoothingEnabled = false; x.drawImage(cv, sx, sy, cw, ch, 0, 0, 192, 108);
        S.photos[photo.m.id] = c.toDataURL('image/jpeg', 0.85);
      } catch (e) { /* snapshot failed; memory still counts */ }
      S.memories[photo.m.id] = true;
      const f = $('flash'); f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; f.style.transition = ''; f.style.opacity = 0;
      CG.audio.sfx('photo');
      toast(`📷 Memory saved<br><small>${photo.m.title} — ${photo.m.caption}</small>`, 3.2);
      save(); updateHUD();
    }
    if (photo.t > 2.0) { photo = null; mode = 'play'; for (const c of party) c.trail = []; checkComplete(); }
  }
  function checkComplete() {
    if (!S.ended && countShells() === ALL_SHELLS.length && countMem() === ALL_MEM.length) endingDelay = 1.8;
  }

  // ---------- Boat trip ----------
  function startTravel(to) {
    travel = { to, t: 0 }; mode = 'travel'; updatePrompt(); fadeBlink(); CG.audio.sfx('horn');
    $('hud').classList.add('hidden');
    toast(to === 'island' ? '⛵ Sailing to Islas del Rosario…' : '⛵ Sailing back to Cartagena…', 3);
  }
  function updateTravel(dt) {
    travel.t += dt;
    if (travel.t > 3.4) {
      const to = travel.to; travel = null; fadeBlink();
      if (to === 'island') { const s = MAPS.island.spawn; placeBoth('island', ...tileToPx(s.x, s.y), s.dir); }
      else placeBoth('cartagena', ...tileToPx(50, 51), 'left');
      mode = 'play'; $('hud').classList.remove('hidden'); save();
      toast(to === 'island' ? '🏝️ Islas del Rosario' : '🏰 Cartagena de Indias', 2.4);
    }
  }

  // ---------- Overlays ----------
  function openAlbum(from) {
    const grid = $('album-grid'); grid.innerHTML = '';
    ALL_MEM.forEach((m, i) => {
      const d = document.createElement('div'), got = S.memories[m.id];
      d.className = 'polaroid' + (got ? '' : ' locked'); d.style.setProperty('--r', ((i * 37) % 7 - 3) + 'deg');
      d.innerHTML = (got && S.photos[m.id] ? `<img alt="${m.title}" src="${S.photos[m.id]}">` : `<div class="empty">${got ? '♥' : '?'}</div>`)
        + `<b>${m.title}</b><small>${got ? m.caption : 'Not visited yet'}</small>`;
      grid.appendChild(d);
    });
    $('album-sub').textContent = `${S.names[0]} & ${S.names[1]} · ${countMem()}/${ALL_MEM.length} memories · 🐚 ${countShells()}/${ALL_SHELLS.length} seashells`;
    $('album').classList.remove('hidden'); $('album').dataset.from = from; mode = 'album'; updatePrompt();
  }
  function closeAlbum() {
    $('album').classList.add('hidden');
    mode = $('album').dataset.from === 'ending' ? 'ending' : 'play';
    if (mode === 'ending') $('ending').classList.remove('hidden');
  }
  const MAPCOL = {
    [TL.WATER]: '#2a8fd6', [TL.SHALLOW]: '#43c9d6', [TL.CORAL]: '#43c9d6', [TL.SAND]: '#f2dca0', [TL.PALM]: '#7fbf5a', [TL.HAMMOCK]: '#e8433a',
    [TL.GRASS]: '#6fbf4f', [TL.TREE]: '#3f9a3a', [TL.FLOWERS]: '#7fc95a', [TL.ROAD]: '#cdb79b', [TL.GATE]: '#3a2e26', [TL.UMBRELLA]: '#ff6fa8',
    [TL.PLAZA]: '#ece0c8', [TL.WALL]: '#8f7a58', [TL.WALLTOP]: '#d6c399', [TL.ROOF]: '#c8553d', [TL.CASTLE]: '#7f735f', [TL.CPATH]: '#eadfc4',
    [TL.HROOF]: '#d5dae0', [TL.HFACADE]: '#9fc6e6', [TL.TOWER]: '#f1d48a', [TL.BOVEDA]: '#f2c94c', [TL.CATHEDRAL]: '#eadcc0', [TL.FOUNTAIN]: '#4fb3d9',
    [TL.HUT]: '#c9a35b', [TL.DOCK]: '#a0703f', [TL.BOAT]: '#ffffff', [TL.TOWEL]: '#ff6fa8',
  };
  function openMap() {
    const s = S.map === 'island' ? 6 : 4, c = $('mapcanvas'), x = c.getContext('2d');
    c.width = map.w * s; c.height = map.h * s;
    for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
      const i = ty * map.w + tx, t = map.t[i];
      x.fillStyle = t === TL.FACADE ? (map.c[i] || '#f2c94c') : (MAPCOL[t] || '#888'); x.fillRect(tx * s, ty * s, s, s);
    }
    const dot = (px, py, col, r) => { x.fillStyle = '#2b2230'; x.beginPath(); x.arc(px / T * s, py / T * s, r + 1.5, 0, 7); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(px / T * s, py / T * s, r, 0, 7); x.fill(); };
    map.shells.forEach(q => { if (!S.shells[q.id]) dot(q.x * T + 8, q.y * T + 8, '#ffffff', s * 0.55); });
    (map.kayaks || []).forEach(k => { if (!k.rider) dot(k.px, k.py, k.color, s * 0.6); });
    map.memories.forEach(q => {
      if (S.memories[q.id]) return;
      const n = q.npc ? map.npcs.find(k => k.id === q.npc) : null;
      const px = n ? n.px : q.x * T + 8, py = n ? n.py - 6 : q.y * T + 8;
      x.font = `bold ${s * 4}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 3; x.strokeStyle = '#2b2230'; x.strokeText('♥', px / T * s, py / T * s); x.fillStyle = '#ff4f7b'; x.fillText('♥', px / T * s, py / T * s);
    });
    map.npcs.filter(n => n.action === 'toIsland' || n.action === 'toCity').forEach(n => dot(n.px, n.py - 6, '#4fb3d9', s * 0.9));
    dot(party[0].x, party[0].y - 6, '#ffd23f', s * 1.1); dot(party[1].x, party[1].y - 6, '#ff7a6b', s * 1.1);
    if (S.map === 'cartagena') {
      x.font = `bold ${s * 3}px sans-serif`; x.textAlign = 'center'; x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,.65)'; x.fillStyle = '#fff';
      [['Old City', 44, 6.2], ['Getsemaní', 72, 20.5], ['Castillo', 90, 22.5], ['Bocagrande', 31, 50.8], ['Dock → Islands', 60, 57], ['Caribbean Sea', 9, 35]].forEach(([t, a, b]) => { x.strokeText(t, a * s, b * s); x.fillText(t, a * s, b * s); });
    }
    $('map-title').textContent = map.title;
    $('map-you').textContent = S.names[0]; $('map-her').textContent = S.names[1];
    $('mapview').classList.remove('hidden'); mode = 'map'; updatePrompt();
  }
  function closeMap() { $('mapview').classList.add('hidden'); mode = 'play'; }

  function startEnding() {
    S.ended = true; save(); mode = 'ending'; updatePrompt();
    $('hud').classList.add('hidden');
    $('ending-title').textContent = `${S.names[0]} ♥ ${S.names[1]}`;
    $('ending-sub').innerHTML = `You explored all of Cartagena together — every seashell, every memory.<br>¡Gracias por el viaje, mis amores!`;
    $('ending').classList.remove('hidden');
  }

  // ---------- Movement ----------
  function move(c, dx, dy, speedMul = 1) {
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const sp = SPEED[c.mode] * speedMul, o = other(c), ox = c.x, oy = c.y;
    const zoneOk = (x, y) => (Math.abs(x - o.x) <= MAX_DX || Math.abs(x - o.x) < Math.abs(c.x - o.x)) && (Math.abs(y - o.y) <= MAX_DY || Math.abs(y - o.y) < Math.abs(c.y - o.y));
    if (dx) { const nx = c.x + dx * sp; if (!blocked(c, nx, c.y) && zoneOk(nx, c.y)) c.x = nx; else if (!dy && zoneOk(nx, c.y)) slide(c, 'y', dx * sp); }
    if (dy) { const ny = c.y + dy * sp; if (!blocked(c, c.x, ny) && zoneOk(c.x, ny)) c.y = ny; else if (!dx && zoneOk(c.x, ny)) slide(c, 'x', dy * sp); }
    c.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const moved = c.x !== ox || c.y !== oy;
    if (moved) {
      c.anim++; c.trail.push({ x: c.x, y: c.y }); if (c.trail.length > 300) c.trail.shift();
      if (c.mode !== 'kayak') { const before = c.mode; c.mode = terrain(c); if (c.mode === 'swim' && before !== 'swim') CG.audio.sfx('splash'); }
      else { c.kayak.px = c.x; c.kayak.py = c.y; c.kayak.dir = c.dir; }
    }
    c.moving = moved;
    return moved;
  }
  // Slide around corners so doorways and gates are easy to walk through.
  function slide(c, axis, amount) {
    for (let off = 1; off <= 7; off++) for (const s of [1, -1]) {
      const o = off * s;
      const ok = axis === 'y' ? !blocked(c, c.x + amount, c.y + o) && !blocked(c, c.x, c.y + Math.sign(o)) : !blocked(c, c.x + o, c.y + amount) && !blocked(c, c.x + Math.sign(o), c.y);
      if (ok) { if (axis === 'y') c.y += Math.sign(o) * 0.9; else c.x += Math.sign(o) * 0.9; return; }
    }
  }
  // Idle partner walks along the other's footsteps (only when "Follow" is on).
  function follow(c) {
    const o = other(c);
    if (c.mode === 'kayak' || dist(c, o) < 30 || !o.trail.length) { c.moving = false; return; }
    const tr = o.trail;
    let best = 0, bd = Infinity;
    for (let i = 0; i < tr.length; i++) { const d = Math.abs(tr[i].x - c.x) + Math.abs(tr[i].y - c.y); if (d < bd) { bd = d; best = i; } }
    const tgt = bd > 40 ? o : tr[Math.min(tr.length - 1, best + 4)];
    const dx = tgt.x - c.x, dy = tgt.y - c.y, d = Math.hypot(dx, dy);
    if (d < 0.5) { c.moving = false; return; }
    move(c, Math.abs(dx) > 0.4 ? Math.sign(dx) : 0, Math.abs(dy) > 0.4 ? Math.sign(dy) : 0, 1.05);
  }

  function updateNPCs(dt) {
    for (const n of map.npcs) {
      if (!n.wander) continue;
      const nearParty = party.some(p => dist(p, npcPt(n)) < 36);
      if (nearParty) { n.moving = false; n.wait = Math.max(n.wait, 0.6); continue; }
      if (n.wait > 0) { n.wait -= dt; n.moving = false; continue; }
      if (!n.tgt) {
        for (let k = 0; k < 8 && !n.tgt; k++) {
          const tx = n.x + Math.round((Math.random() * 2 - 1) * n.wander), ty = n.y + Math.round((Math.random() * 2 - 1) * n.wander);
          if (!blocked(n, tx * T + 8, ty * T + 14)) n.tgt = { x: tx * T + 8, y: ty * T + 14 };
        }
        if (!n.tgt) { n.wait = 1; continue; }
      }
      const dx = n.tgt.x - n.px, dy = n.tgt.y - n.py, d = Math.hypot(dx, dy);
      if (d < 1) { n.tgt = null; n.wait = 1.5 + Math.random() * 3; n.moving = false; continue; }
      const sp = n.swim ? 0.35 : 0.45, mx = dx / d * sp, my = dy / d * sp;
      let moved = false;
      if (Math.abs(mx) > 0.01 && !blocked(n, n.px + mx, n.py)) { n.px += mx; moved = true; }
      if (Math.abs(my) > 0.01 && !blocked(n, n.px, n.py + my)) { n.py += my; moved = true; }
      if (!moved) { n.tgt = null; n.wait = 1; }
      n.moving = moved; n.anim++;
      n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
  }

  // ---------- Update ----------
  function update(dt) {
    time += dt;
    if (toastTimer > 0 && (toastTimer -= dt) <= 0) $('toast').classList.add('hidden');
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= dt;
      if (p.kind === 'spark') p.vy += 0.03;
      if (p.life <= 0) particles.splice(i, 1);
    }

    const acts = actions.splice(0);
    for (const a of acts) {
      if (a.a === 'music') { CG.audio.toggleMusic(); updateHUD(); continue; }
      if (a.a === 'follow') { S.follow = !S.follow; updateHUD(); toast(S.follow ? '👣 Partner follows when idle' : '🎮 Both players move freely', 1.8); continue; }
      if (mode === 'play') {
        if (a.a === 'album') openAlbum('play');
        else if (a.a === 'map') openMap();
        else if (a.a === 'act') doInteract(party[a.p]);
      } else if (mode === 'dialog') {
        if (a.a === 'act') advanceDialog();
        else if (dlg && dlg.choices && a.a === 'dir') { const step = a.d === 'up' || a.d === 'left' ? -1 : 1; dlg.sel = (dlg.sel + step + dlg.choices.length) % dlg.choices.length; renderDialog(); }
        else if (a.a === 'esc' && dlg && dlg.choices) { dlg.sel = dlg.choices.length - 1; confirmChoice(); }
      } else if (mode === 'album') { if (a.a === 'esc' || a.a === 'album' || a.a === 'act') closeAlbum(); }
      else if (mode === 'map') { if (a.a === 'esc' || a.a === 'map' || a.a === 'act') closeMap(); }
    }

    if (mode === 'dialog' && dlg) {
      const line = dlg.lines[dlg.i];
      if (dlg.chars < line.length) { const before = Math.floor(dlg.chars); dlg.chars = Math.min(line.length, dlg.chars + 1.4); if (Math.floor(dlg.chars) !== before && before % 3 === 0) CG.audio.sfx('talk'); renderDialog(); }
    }
    if (mode === 'photo') updatePhoto(dt);
    if (mode === 'travel') updateTravel(dt);
    if (mode === 'event') updateEvent(dt);
    if (mode === 'ending') updateFireworks(dt);
    if (mode !== 'play') return;

    // both players
    for (const c of party) {
      const [dx, dy] = dirOf(c.i);
      if (dx || dy) { c.idle = 0; move(c, dx, dy); }
      else { c.idle += dt; c.moving = false; if (S.follow && c.idle > 0.6) follow(c); }
    }
    updateNPCs(dt);

    // seashells (either player can pick them up)
    for (const s of map.shells) {
      if (S.shells[s.id]) continue;
      const sx = s.x * T + 8, sy = s.y * T + 12;
      const c = party.find(p => Math.abs(p.x - sx) < 11 && Math.abs(p.y - sy) < 11);
      if (c) {
        S.shells[s.id] = true; CG.audio.sfx('shell');
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; particles.push({ x: sx, y: sy - 6, vx: Math.cos(a) * 1.1, vy: Math.sin(a) * 1.1 - 0.5, life: 0.7, kind: 'spark', col: '#fff3b0' }); }
        toast(`🐚 ${nm(c)} found a seashell! <small>(${countShells()}/${ALL_SHELLS.length})</small>`, 1.8);
        save(); updateHUD(); checkComplete();
      }
    }

    if (endingDelay > 0 && (endingDelay -= dt) <= 0) { endingDelay = -1; startEnding(); return; }
    updatePrompt();
    if ((saveTimer += dt) > 4) { saveTimer = 0; save(); }
    updateHUD();
    const onBastion = c => S.map === 'cartagena' && c.x / T >= 24 && c.x / T < 30 && c.y / T >= 23 && c.y / T < 29;
    sunset += ((party.some(onBastion) ? 1 : 0) - sunset) * 0.04;
  }

  let fwTimer = 0;
  function updateFireworks(dt) {
    if ((fwTimer -= dt) > 0) return;
    fwTimer = 0.35 + Math.random() * 0.4;
    const cx = cam.x + 30 + Math.random() * (W - 60), cy = cam.y + 20 + Math.random() * 60;
    const col = ['#ff4f7b', '#ffd23f', '#4fb3d9', '#7bc67e', '#ff9a2e', '#ffffff', '#b48ce0'][(Math.random() * 7) | 0];
    for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, sp = 0.8 + Math.random() * 0.8; particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1 + Math.random() * 0.5, kind: 'spark', col }); }
    CG.audio.sfx('firework');
  }

  // ---------- Render ----------
  const cam = { x: 0, y: 0 };
  const ANIM = new Set([TL.WATER, TL.SHALLOW, TL.CORAL, TL.DOCK, TL.BOAT, TL.FOUNTAIN]);
  function drawChar(sheet, c, idle) {
    const fr = c.moving ? [1, 0, 2, 0][Math.floor(c.anim / 7) % 4] : (idle ? Math.floor(time * 1.5) % 2 : 0);
    const spr = sheet[c.dir][fr], w = spr.width, h = spr.height;
    const sx = Math.round(c.x - cam.x), sy = Math.round(c.y - cam.y), ox = sx - (w >> 1), oy = sy - h + 1;
    const m = c.mode || 'walk';
    const ripple = (y, wide) => { g.fillStyle = 'rgba(255,255,255,0.75)'; const s = Math.floor(time * 3) % 2; g.fillRect(sx - wide - s, y, 4, 1); g.fillRect(sx + wide - 3 + s, y, 4, 1); g.fillRect(sx - 4, y + 1, 8, 1); };
    if (m === 'kayak') {
      CG.drawKayak(g, sx, sy, c.kayak.color, c.dir, time);
      const b = Math.round(Math.sin(time * 3) * 0.6);
      const vert = c.dir === 'up' || c.dir === 'down';
      g.drawImage(spr, 0, 0, w, 12, ox, oy + b + (vert ? 4 : 0), w, 12);
      if (c.moving) { const p = Math.floor(c.anim / 8) % 2; g.fillStyle = '#8a5a2b'; g.fillRect(sx - 9, sy - 8 + b + (p ? 1 : -1), 18, 1); g.fillStyle = '#ffd23f'; g.fillRect(sx - 11, sy - 9 + b + (p ? 2 : -2), 3, 3); g.fillRect(sx + 8, sy - 9 + b + (p ? -2 : 2), 3, 3); }
      return;
    }
    if (m === 'swim') {
      const b = Math.round(Math.sin(time * 4 + c.x * 0.1));
      g.drawImage(spr, 0, 0, w, 10, ox, sy - 12 + b, w, 10);
      ripple(sy - 3 + b, 9); return;
    }
    if (m === 'wade') { g.drawImage(spr, 0, 0, w, h - 4, ox, oy + 4 - 4, w, h - 4); ripple(sy - 4, 8); return; }
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(sx - 5, sy - 1, 10, 2); g.fillRect(sx - 4, sy - 2, 8, 4);
    g.drawImage(spr, ox, oy - Math.round(c.bob || 0));
  }
  function render() {
    if (mode === 'travel') { renderTravel(); return; }
    const p = mid();
    cam.x = Math.round(Math.max(0, Math.min(map.w * T - W, p.x - W / 2)));
    cam.y = Math.round(Math.max(0, Math.min(map.h * T - H, p.y - 8 - H / 2)));
    const wf = Math.floor(time * 2) % 4, pf = Math.floor(time * 1.2) % 2;
    const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T), x1 = Math.ceil((cam.x + W) / T), y1 = Math.ceil((cam.y + H) / T);
    const list = [];
    for (let ty = y0; ty <= y1 + 2; ty++) for (let tx = x0 - 1; tx <= x1 + 1; tx++) {
      const t = map.get(tx, ty), i = ty * map.w + tx, inside = map.in(tx, ty);
      if (ty <= y1 && tx >= x0 && tx <= x1) g.drawImage(CG.tileCanvas(t, inside ? map.v[i] : 0, inside ? map.c[i] : '', ANIM.has(t) ? wf : 0), tx * T - cam.x, ty * T - cam.y);
      if (t === TL.TREE || t === TL.PALM) list.push({ y: ty * T + 15, f: () => CG.drawCanopy(g, t, tx * T - cam.x, ty * T - cam.y, pf, map.v[i]) });
    }
    const frame4 = Math.floor(time * 4);
    for (const s of map.shells) if (!S.shells[s.id]) list.push({ y: s.y * T + 12, f: () => CG.drawShell(g, s.x * T - cam.x, s.y * T - cam.y, frame4, s.kind) });
    for (const m of map.memories) if (m.x != null && !S.memories[m.id]) list.push({ y: m.y * T + 10, f: () => CG.drawMemory(g, m.x * T - cam.x, m.y * T - cam.y - 6, frame4) });
    for (const k of map.kayaks || []) if (!k.rider) list.push({ y: k.py, f: () => CG.drawKayak(g, Math.round(k.px - cam.x), Math.round(k.py - cam.y), k.color, k.dir, time) });
    for (const n of map.npcs) {
      const e = { x: n.px, y: n.py, dir: n.dir, moving: n.moving, anim: n.anim, mode: n.swim ? 'swimNpc' : 'walk' };
      if (!n.moving) {
        let near = null, nd = 48;
        for (const c of party) { const d = dist(c, e); if (d < nd) { nd = d; near = c; } }
        if (near) { const ddx = near.x - e.x, ddy = near.y - e.y; e.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up'); if (n.look === 'horse' || n.look === 'turtle') e.dir = ddx > 0 ? 'right' : 'left'; }
      }
      const memDone = n.memory && S.memories[n.memory];
      list.push({ y: e.y, f: () => {
        if (n.swim) { const spr = NPC_SHEETS[n.look][e.dir][Math.floor(time * 2) % 2]; g.drawImage(spr, Math.round(e.x - cam.x - spr.width / 2), Math.round(e.y - cam.y - spr.height + 2)); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(Math.round(e.x - cam.x - 8), Math.round(e.y - cam.y), 16, 1); }
        else drawChar(NPC_SHEETS[n.look], e, n.look === 'palenquera' || n.look === 'horse');
        if (n.memory && !memDone) CG.drawMemory(g, e.x - cam.x - 8, e.y - cam.y - 40, frame4);
        if (n.look === 'fisher') { g.fillStyle = '#6b4a2f'; const fx = e.x - cam.x + 6, fy = e.y - cam.y - 12; for (let i = 0; i < 10; i++) g.fillRect(Math.round(fx + i), Math.round(fy - i * 0.6), 1, 1); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(Math.round(fx + 10), Math.round(fy - 6), 1, 14); }
      } });
    }
    party.forEach(c => list.push({ y: c.y + c.i * 0.1, f: () => {
      drawChar(SHEETS[c.i], c);
      if (mode === 'event' && ev && ev.kind === 'fish' && ev.c === c) { g.fillStyle = '#6b4a2f'; for (let i = 0; i < 12; i++) g.fillRect(Math.round(c.x - cam.x + 4 + i * 0.4), Math.round(c.y - cam.y - 10 + i), 1, 1); }
    } }));
    for (const lm of map.landmarks) {
      const sortY = lm.kind === 'cathedral' ? lm.y + T : lm.y;
      const behind = party.some(p => p.y < sortY && lm.rects.some(([rx, ry, rw, rh]) =>
        p.x + 6 > lm.x + rx && p.x - 6 < lm.x + rx + rw && p.y > lm.y + ry && p.y - 17 < lm.y + ry + rh));
      list.push({ y: sortY, f: () => {
        g.globalAlpha = behind ? 0.45 : 1;
        if (lm.kind === 'clock') CG.drawClockTower(g, lm.x - cam.x, lm.y - cam.y);
        else if (lm.kind === 'cathedral') CG.drawCathedralTower(g, lm.x - cam.x, lm.y - cam.y);
        else if (lm.kind === 'flag') CG.drawFlag(g, lm.x - cam.x, lm.y - cam.y, pf);
        g.globalAlpha = 1;
      } });
    }
    list.sort((a, b) => a.y - b.y).forEach(d => d.f());
    drawNameTags();
    drawParticles();
    if (sunset > 0.01) {
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, `rgba(255,95,90,${0.5 * sunset})`); gr.addColorStop(0.6, `rgba(255,150,80,${0.35 * sunset})`); gr.addColorStop(1, `rgba(255,200,90,${0.25 * sunset})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    if (mode === 'ending') { g.fillStyle = 'rgba(20,20,60,0.35)'; g.fillRect(0, 0, W, H); drawParticles(true); }
  }
  // Small coloured marker over each player so you know who is who.
  function drawNameTags() {
    if (mode !== 'play') return;
    party.forEach(c => {
      const sx = Math.round(c.x - cam.x), top = Math.round(c.y - cam.y) - (c.mode === 'swim' ? 17 : 23) - Math.round(c.bob || 0);
      g.fillStyle = c.i === 0 ? '#ffd23f' : '#ff7a6b';
      g.fillRect(sx - 2, top, 5, 2); g.fillRect(sx - 1, top + 2, 3, 1); g.fillRect(sx, top + 3, 1, 1);
    });
  }
  function drawParticles(onlySparks) {
    for (const p of particles) {
      if (onlySparks && p.kind !== 'spark') continue;
      if (!onlySparks && mode === 'ending' && p.kind === 'spark') continue;
      const x = Math.round(p.x - cam.x), y = Math.round(p.y - cam.y);
      g.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
      if (p.kind === 'heart') { g.fillStyle = '#ff4f7b'; g.fillRect(x - 2, y, 2, 2); g.fillRect(x + 1, y, 2, 2); g.fillRect(x - 3, y + 1, 7, 2); g.fillRect(x - 2, y + 3, 5, 1); g.fillRect(x - 1, y + 4, 3, 1); }
      else if (p.kind === 'note') { g.fillStyle = '#2b2230'; g.fillRect(x + 2, y, 1, 5); g.fillRect(x, y + 4, 3, 2); g.fillRect(x + 2, y, 3, 1); }
      else if (p.kind === 'bang') { g.fillStyle = '#ffd23f'; g.fillRect(x - 1, y, 3, 6); g.fillRect(x - 1, y + 8, 3, 2); }
      else { g.fillStyle = p.col || '#fff'; const s = mode === 'ending' ? 3 : 2; g.fillRect(x, y, s, s); }
    }
    g.globalAlpha = 1;
  }
  function renderTravel() {
    const t = travel.t, toIsland = travel.to === 'island';
    const sky = g.createLinearGradient(0, 0, 0, 90); sky.addColorStop(0, '#7fd0ff'); sky.addColorStop(1, '#d9f4ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, 90);
    g.fillStyle = '#ffffff'; [[40, 20], [150, 35], [250, 15]].forEach(([x, y]) => { const cx = (x - t * 6 + W) % (W + 40) - 20; g.fillRect(cx, y, 30, 6); g.fillRect(cx + 6, y - 4, 16, 4); });
    g.fillStyle = '#3f9a3a';
    if (toIsland) { const ix = W - 50 + (3.4 - t) * 20; g.fillRect(ix, 80, 90, 10); g.fillRect(ix + 20, 74, 30, 6); }
    else { const ix = W - 70 + (3.4 - t) * 20; g.fillStyle = '#d6c399'; g.fillRect(ix, 70, 100, 20); g.fillStyle = '#f1d48a'; g.fillRect(ix + 30, 52, 14, 18); g.fillStyle = '#c8553d'; g.fillRect(ix + 32, 46, 10, 6); }
    g.fillStyle = '#2a8fd6'; g.fillRect(0, 90, W, 90);
    g.fillStyle = '#5fb4ec';
    for (let r = 0; r < 6; r++) for (let k = 0; k < 8; k++) g.fillRect(((k * 53 + r * 31 - t * (30 + r * 10)) % (W + 20) + W + 20) % (W + 20) - 10, 96 + r * 14, 10, 1);
    const bx = -60 + (t / 3.4) * (W + 120), by = 112 + Math.sin(t * 7) * 2;
    g.fillStyle = '#ffffff'; g.fillRect(bx, by, 56, 12); g.fillRect(bx + 56, by + 3, 8, 6);
    g.fillStyle = '#2e7dd6'; g.fillRect(bx, by + 9, 56, 3);
    g.fillStyle = '#e8433a'; g.fillRect(bx + 6, by - 18, 34, 3);
    g.fillStyle = '#555'; g.fillRect(bx + 8, by - 15, 1, 15); g.fillRect(bx + 37, by - 15, 1, 15);
    g.drawImage(SHEETS[0].right[0], bx + 14, by - 16); g.drawImage(SHEETS[1].right[0], bx + 24, by - 16);
    g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) g.fillRect(bx - 6 - i * 8 - (time * 40 % 8), by + 10 + (i % 2), 5, 1);
  }

  // ---------- Layout ----------
  function fit() {
    const w = Math.min(innerWidth, innerHeight * 16 / 9), h = w * 9 / 16;
    stage.style.width = w + 'px'; stage.style.height = h + 'px';
    stage.style.setProperty('--u', (w / 320) + 'px');
  }
  addEventListener('resize', fit); fit();

  // ---------- Title screen ----------
  function drawPreview(id, sheet) { const c = $(id), x = c.getContext('2d'); x.clearRect(0, 0, 14, 18); x.drawImage(sheet.down[0], 0, 0); }
  drawPreview('prev-him', SHEETS[0]); drawPreview('prev-her', SHEETS[1]);
  if (isTouch) { $('ctl-him').textContent = 'Pad + A'; $('ctl-her').textContent = 'B button · follows you'; }
  const saved = load();
  if (saved) {
    $('btn-continue').classList.remove('hidden');
    $('btn-continue').textContent = `Continue (${saved.names[0]} & ${saved.names[1]})`;
    $('name-him').value = saved.names[0]; $('name-her').value = saved.names[1];
  }
  function begin(state) {
    S = state;
    const m = MAPS[S.map] || MAPS.cartagena;
    placeBoth(m.name, ...tileToPx(m.spawn.x, m.spawn.y), m.spawn.dir);
    if (S.pos && S.pos.length === 2) {
      S.pos.forEach((p, k) => { const c = party[k]; if (!blocked(c, p.x, p.y)) { c.x = p.x; c.y = p.y; c.dir = p.dir || 'down'; } });
    } else if (S.x != null && S.y != null) placeBoth(m.name, S.x, S.y, S.dir || 'up');
    for (const c of party) c.mode = terrain(c);
    if (S.follow == null) S.follow = isTouch;
    $('title').classList.add('hidden'); $('hud').classList.remove('hidden');
    mode = 'play'; CG.audio.start(); fadeBlink(); updateHUD(); save();
    toast(`¡Bienvenidos a Cartagena, ${S.names[0]} & ${S.names[1]}!<br><small>Find the ♥ photo spots and the seashells, and meet the locals</small>`, 4);
  }
  const cleanName = (v, d) => (v || '').trim().slice(0, 12) || d;
  $('btn-start').addEventListener('click', () => {
    if (saved && !confirm('Start a new trip? Your saved progress will be replaced.')) return;
    begin(fresh([cleanName($('name-him').value, 'Monty'), cleanName($('name-her').value, 'Summer')]));
  });
  $('btn-continue').addEventListener('click', () => {
    saved.names = [cleanName($('name-him').value, saved.names[0]), cleanName($('name-her').value, saved.names[1])];
    begin(Object.assign(fresh(), saved));
  });
  $('btn-album').addEventListener('click', () => { if (mode === 'play') openAlbum('play'); });
  $('btn-map').addEventListener('click', () => { if (mode === 'play') openMap(); });
  $('btn-music').addEventListener('click', () => { CG.audio.toggleMusic(); updateHUD(); });
  $('btn-follow').addEventListener('click', () => actions.push({ a: 'follow' }));
  $('btn-album-close').addEventListener('click', closeAlbum);
  $('btn-map-close').addEventListener('click', closeMap);
  $('btn-end-album').addEventListener('click', () => { $('ending').classList.add('hidden'); openAlbum('ending'); });
  $('btn-end-play').addEventListener('click', () => { $('ending').classList.add('hidden'); $('hud').classList.remove('hidden'); mode = 'play'; });

  // ---------- Main loop ----------
  let last = performance.now(), acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    let n = 0;
    while (acc >= STEP && n < 6) { update(STEP); acc -= STEP; n++; }
    if (mode !== 'title') render(); else renderTitleBg();
    requestAnimationFrame(frame);
  }
  function renderTitleBg() {
    time += 1 / 60; map = MAPS.cartagena;
    party[0].x = 44 * T + Math.sin(time / 6) * 200; party[0].y = 30 * T; party[1].x = party[0].x + 16; party[1].y = party[0].y;
    render();
  }
  requestAnimationFrame(frame);

  // Debug hooks for automated play-testing.
  CG.debug = {
    get mode() { return mode; }, get state() { return S; }, get map() { return map; }, party, MAPS, keys,
    teleport(tx, ty, mapName) { placeBoth(mapName || S.map, ...tileToPx(tx, ty), 'down'); },
    setPos(i, px, py) { party[i].x = px; party[i].y = py; party[i].mode = terrain(party[i]); },
    act(p = 0) { actions.push({ a: 'act', p }); }, dir(p, d) { actions.push({ a: 'dir', p, d }); },
    interact: i => findInteract(party[i]),
    reach: () => ({ cartagena: CG.checkReachable(MAPS.cartagena), island: CG.checkReachable(MAPS.island) }),
  };
})(window.CG);
