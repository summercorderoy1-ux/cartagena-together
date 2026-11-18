// The two maps: Cartagena (mainland) and Islas del Rosario.
window.CG = window.CG || {};
(function (CG) {
  const TL = CG.TILE, T = CG.T;

  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function makeMap(name, w, h, seed) {
    const m = {
      name, w, h, t: new Uint8Array(w * h), v: new Uint8Array(w * h), c: new Array(w * h).fill(''),
      shells: [], memories: [], npcs: [], landmarks: [], spawn: { x: 0, y: 0, dir: 'up' }, R: rng(seed),
    };
    m.in = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    m.get = (x, y) => (m.in(x, y) ? m.t[y * w + x] : TL.WATER);
    m.set = (x, y, t, v, c) => {
      if (!m.in(x, y)) return;
      const i = y * w + x; m.t[i] = t; m.v[i] = v == null ? (m.R() * 4) | 0 : v; if (c != null) m.c[i] = c;
    };
    m.fill = (x0, y0, x1, y1, t, v, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m.set(x, y, t, v, c); };
    return m;
  }

  // A colonial house: terracotta roof rows, then one facade row facing the street.
  function house(m, x0, y0, x1, y1, opts = {}) {
    const color = opts.color || CG.HOUSE_COLORS[(m.R() * CG.HOUSE_COLORS.length) | 0];
    const terrace = m.R() < 0.2;
    for (let y = y0; y < y1; y++) for (let x = x0; x <= x1; x++) m.set(x, y, TL.ROOF, terrace ? 3 : (m.R() * 3) | 0, opts.roof || '');
    for (let x = x0; x <= x1; x++) {
      let v = (m.R() * 4) | 0;
      if (opts.murals && m.R() < 0.35) v = 4 + ((m.R() * 2) | 0);
      m.set(x, y1, TL.FACADE, v, color);
    }
  }
  function tower(m, x0, y0, x1, y1) { // Bocagrande high-rise
    for (let y = y0; y <= y1 - 2; y++) for (let x = x0; x <= x1; x++) m.set(x, y, TL.HROOF);
    for (let y = y1 - 1; y <= y1; y++) for (let x = x0; x <= x1; x++) m.set(x, y, TL.HFACADE);
  }
  function scatter(m, x0, y0, x1, y1, base, type, chance, avoid) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (m.get(x, y) !== base || m.R() > chance) continue;
      if (avoid && avoid(x, y)) continue;
      // keep space around so paths never get blocked
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (CG.isSolid(m.get(x + dx, y + dy)) || m.get(x + dx, y + dy) === TL.ROAD) { if (dx || dy) { ok = false; break; } }
      if (ok) m.set(x, y, type);
    }
  }
  const near = (list, r) => (x, y) => list.some(p => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r);

  // ---------------- Cartagena ----------------
  function buildCartagena() {
    const m = makeMap('cartagena', 100, 70, 2024);
    m.title = 'Cartagena de Indias';
    m.fill(0, 0, 99, 69, TL.WATER);
    m.fill(18, 4, 99, 5, TL.SHALLOW); m.fill(18, 4, 19, 69, TL.SHALLOW);
    m.fill(20, 6, 99, 53, TL.GRASS); m.fill(20, 54, 40, 69, TL.GRASS);
    m.fill(20, 6, 99, 7, TL.SAND); m.fill(20, 6, 25, 69, TL.SAND);
    m.fill(41, 54, 99, 54, TL.SHALLOW); m.fill(41, 54, 41, 69, TL.SHALLOW);
    m.fill(38, 55, 40, 69, TL.SAND); m.fill(42, 52, 99, 53, TL.SAND);

    // --- Walled city ---
    m.fill(28, 8, 60, 9, TL.WALL); m.fill(28, 37, 60, 38, TL.WALL);
    m.fill(28, 8, 29, 38, TL.WALL); m.fill(59, 8, 60, 38, TL.WALL);
    m.fill(30, 10, 58, 36, TL.ROAD);
    // Café del Mar bastion (walk on the wall at sunset)
    m.fill(24, 23, 29, 28, TL.WALL); m.fill(25, 24, 29, 27, TL.WALLTOP, 0);
    m.fill(25, 24, 25, 27, TL.WALLTOP, 1);
    // Gates
    m.fill(28, 15, 29, 16, TL.GATE);
    m.fill(59, 30, 60, 31, TL.GATE);
    m.fill(43, 37, 45, 38, TL.GATE);
    m.fill(41, 37, 42, 38, TL.TOWER, 1); m.fill(46, 37, 47, 38, TL.TOWER, 1);
    m.landmarks.push({ kind: 'clock', x: 41 * T, y: 39 * T, rects: [[0, -44, 112, 44], [36, -114, 40, 74]] });

    // Band 1
    house(m, 31, 10, 34, 12); house(m, 36, 10, 38, 12); house(m, 40, 10, 45, 12);
    for (let y = 10; y <= 11; y++) for (let x = 47; x <= 57; x++) m.set(x, y, TL.ROOF, (m.R() * 3) | 0);
    m.fill(47, 12, 57, 12, TL.BOVEDA);
    // Band 2 + Cathedral
    house(m, 31, 14, 34, 17); house(m, 36, 14, 38, 17);
    for (let y = 14; y <= 16; y++) for (let x = 40; x <= 47; x++) m.set(x, y, TL.ROOF, 0, 'grey');
    m.fill(40, 17, 47, 17, TL.CATHEDRAL, 0); m.fill(43, 17, 44, 17, TL.CATHEDRAL, 1);
    m.landmarks.push({ kind: 'cathedral', x: 45 * T - 3, y: 17 * T, rects: [[0, -72, 22, 72]] });
    house(m, 49, 14, 52, 17); house(m, 54, 14, 57, 17);
    // Band 3 + Plaza de Bolívar
    house(m, 31, 19, 34, 21); house(m, 31, 23, 34, 25); house(m, 36, 19, 38, 21); house(m, 36, 23, 38, 25);
    m.fill(40, 19, 47, 25, TL.PLAZA);
    m.fill(43, 22, 44, 22, TL.FOUNTAIN);
    [[40, 19], [47, 19], [40, 25], [47, 25], [41, 22]].forEach(([x, y]) => m.set(x, y, TL.TREE, 1));
    house(m, 49, 19, 52, 21); house(m, 49, 23, 52, 25); house(m, 54, 19, 57, 21); house(m, 54, 23, 57, 25);
    // Band 4
    house(m, 31, 27, 34, 30); house(m, 36, 27, 38, 30); house(m, 40, 27, 46, 30); house(m, 49, 27, 52, 30); house(m, 54, 27, 57, 30);
    // Band 5 + Plaza de los Coches
    house(m, 31, 32, 34, 35); house(m, 36, 32, 39, 35); house(m, 49, 32, 52, 35); house(m, 54, 32, 57, 35);
    m.fill(41, 32, 47, 35, TL.PLAZA);

    // --- Outside the walls ---
    m.fill(43, 39, 45, 51, TL.ROAD);
    m.fill(26, 49, 45, 50, TL.ROAD);
    m.fill(45, 45, 61, 46, TL.ROAD);
    m.fill(46, 49, 53, 51, TL.ROAD);

    // Getsemaní
    m.fill(61, 22, 82, 48, TL.ROAD);
    const gs = { murals: true };
    house(m, 63, 23, 67, 26, gs); house(m, 69, 23, 73, 26, gs); house(m, 75, 23, 80, 26, gs);
    house(m, 63, 28, 67, 32, gs); house(m, 69, 28, 73, 32, gs); house(m, 75, 28, 80, 32, gs);
    for (let x = 61; x <= 82; x++) for (let y = 33; y <= 34; y++) m.set(x, y, TL.UMBRELLA, (x * 3 + y) % 7);
    house(m, 63, 35, 67, 38, gs); house(m, 69, 35, 73, 38, gs); house(m, 75, 35, 80, 38, gs);
    m.fill(69, 40, 74, 44, TL.PLAZA); m.set(69, 40, TL.TREE, 0); m.set(74, 40, TL.TREE, 1); m.set(69, 44, TL.TREE, 1); m.set(74, 44, TL.TREE, 0);
    house(m, 63, 40, 67, 44, gs); house(m, 76, 40, 80, 44, gs);

    // Castillo San Felipe de Barajas
    m.fill(84, 24, 97, 46, TL.CASTLE);
    m.fill(90, 40, 90, 46, TL.CPATH); m.fill(86, 40, 90, 40, TL.CPATH); m.fill(86, 35, 86, 40, TL.CPATH);
    m.fill(86, 35, 93, 35, TL.CPATH); m.fill(93, 30, 93, 35, TL.CPATH); m.fill(87, 27, 95, 30, TL.CPATH);
    m.fill(83, 47, 92, 48, TL.ROAD);
    m.landmarks.push({ kind: 'flag', x: 94 * T, y: 27 * T + 4, rects: [[0, -30, 15, 30]] });

    // Neighbourhood north-east
    house(m, 65, 11, 69, 14); house(m, 72, 11, 76, 14); house(m, 79, 11, 83, 14); house(m, 86, 11, 90, 14);
    m.fill(62, 15, 95, 16, TL.ROAD); m.fill(62, 15, 62, 21, TL.ROAD);

    // Bocagrande
    m.fill(26, 51, 27, 69, TL.ROAD); m.fill(26, 58, 37, 59, TL.ROAD);
    tower(m, 28, 52, 31, 57); tower(m, 33, 52, 36, 57); tower(m, 28, 61, 31, 66); tower(m, 33, 61, 36, 66);

    // Dock + lancha
    m.fill(52, 52, 53, 60, TL.DOCK, 0);
    m.set(54, 59, TL.BOAT, 0); m.set(55, 59, TL.BOAT, 1);

    // Collectibles & people
    m.shells = [[21, 10], [23, 19], [21, 33], [22, 44], [21, 57], [24, 66], [60, 7]].map(([x, y], i) => ({ id: 'c' + i, x, y, kind: i }));
    m.memories = [
      { id: 'torre', x: 44, y: 41, title: 'Torre del Reloj', caption: 'Walking through the Clock Tower gate together' },
      { id: 'bolivar', x: 45, y: 23, title: 'Plaza de Bolívar', caption: 'Shade, a fountain, and the Cathedral bells' },
      { id: 'bovedas', x: 52, y: 13, title: 'Las Bóvedas', caption: 'Yellow arches and little treasures' },
      { id: 'cafedelmar', x: 27, y: 25, title: 'Sunset on the Wall', caption: 'Watching the Caribbean sunset from Café del Mar' },
      { id: 'umbrellas', x: 72, y: 33, title: 'Umbrella Street', caption: 'Under a rainbow of umbrellas in Getsemaní' },
      { id: 'castillo', x: 89, y: 28, title: 'Castillo San Felipe', caption: 'On top of the castle, the whole city below us' },
      { id: 'palenquera', npc: 'palenquera', title: 'La Palenquera', caption: 'Fresh mango and a big smile' },
      { id: 'bocagrande', x: 22, y: 62, title: 'Bocagrande Beach', caption: 'Toes in the sand, city behind us' },
    ];
    m.npcs = [
      { id: 'palenquera', name: 'Palenquera', x: 41, y: 33, look: 'palenquera', lines: ['¡Hola, mis amores! Fruta fresca: mango, piña, sandía!', 'Ay, qué pareja tan bonita... Come here, let’s take a photo together!'], memory: 'palenquera' },
      { id: 'boatman', name: 'Lanchero', x: 51, y: 52, look: 'boatman', lines: ['¿Vamos a las Islas del Rosario? My lancha is ready.'], action: 'toIsland' },
      { id: 'vendor', name: 'Doña Carmen', x: 71, y: 42, look: 'vendor', lines: ['Welcome to Getsemaní! Walk under the umbrellas — they bring good luck to couples.', 'At night this plaza fills with music and dancing.'] },
      { id: 'tourist', name: 'Traveller', x: 41, y: 24, look: 'tourist', wander: 2, lines: ['The Cathedral bells ring every hour.', 'Have you seen the sunset from the wall? Go to the bastion by the sea, on the west side.'] },
      { id: 'beach', name: 'Marisol', x: 23, y: 48, look: 'beach', lines: ['Seashells wash up all along this coast.', 'But the prettiest ones are on the islands. Ask the boatman by the dock!'] },
      { id: 'guard', name: 'Castle Guide', x: 88, y: 48, look: 'guard', lines: ['Castillo San Felipe! Follow the path up — the view from the top is worth it.', 'Pirates tried to take this castle for years. None of them made it!'] },
      { id: 'musician', name: 'Don Rafa', x: 46, y: 20, look: 'musician', lines: ['♪ ¡Ay, qué rico! I play champeta and cumbia all day long.', '¿Bailamos? Come on, you two — dance together!'], action: 'dance' },
      { id: 'cook', name: 'Doña Rosa', x: 65, y: 27, look: 'cook', lines: ['¡Arepa de huevo, recién hecha! Crispy outside, egg inside.', 'One for each of you, mis amores!'], action: 'treat', treat: 'an arepa de huevo' },
      { id: 'coconut', name: 'Yoli', x: 23, y: 59, look: 'coconut', lines: ['¡Coco frío, coco frío! Fresh coconut water to cool you down.'], action: 'treat', treat: 'a cold coconut' },
      { id: 'lifeguard', name: 'Andrés the lifeguard', x: 22, y: 53, look: 'lifeguard', lines: ['The water is warm today — go for a swim! Just walk into the sea.', 'Want to paddle? Stand next to a kayak at the water’s edge and press your action key.', 'Press it again next to the sand to climb out.'] },
      { id: 'driver', name: 'Don Lucho', x: 48, y: 45, look: 'driver', lines: ['¡Buenas! A horse carriage ride around Cartagena? Where to, mis amores?'], action: 'carriage' },
      { id: 'horse', name: 'Canela', x: 50, y: 45, look: 'horse', lines: ['Neigh! 🐴', 'Canela nuzzles your hand. She likes you!'] },
      { id: 'fisher', name: 'Don Efraín', x: 52, y: 57, look: 'fisher', lines: ['Shh... the fish are biting today.', 'Here, take my rod and give it a try!'], action: 'fish' },
      { id: 'painter', name: 'Valentina', x: 80, y: 34, look: 'painter', lines: ['I paint the umbrellas and the walls of Getsemaní.', 'You two look like a painting already. ¡Qué lindos!'] },
      { id: 'kid', name: 'Juanito', x: 36, y: 44, look: 'kid', wander: 3, lines: ['¡Gooool! Do you like fútbol?', 'One day I’ll play for the Colombia team. ¡Vamos!'] },
      { id: 'luz', name: 'Señora Luz', x: 33, y: 13, look: 'luz', wander: 3, lines: ['These balconies are hundreds of years old, mijos.', 'The pink flowers are bougainvillea — the whole city blooms with them.'] },
      { id: 'pedro', name: 'Pedro', x: 68, y: 39, look: 'pedro', wander: 4, lines: ['Getsemaní used to be the neighbourhood of artisans.', 'Have you tried Doña Rosa’s arepas? She’s just up the street!'] },
    ];
    m.kayaks = [{ x: 19, y: 58, color: '#e8433a' }, { x: 19, y: 61, color: '#ffd23f' }, { x: 19, y: 29, color: '#2e7dd6' }, { x: 19, y: 32, color: '#5fbf3f' }];
    [[23, 55, 0], [21, 64, 1], [23, 67, 0], [21, 41, 1], [22, 13, 0]].forEach(([x, y, v]) => m.set(x, y, TL.TOWEL, v));
    m.spawn = { x: 44, y: 43, dir: 'up' };

    // Trees, flowers, palms
    const keep = near(m.shells.concat(m.memories.filter(q => q.x != null), m.npcs, [m.spawn]), 1);
    scatter(m, 30, 39, 60, 48, TL.GRASS, TL.TREE, 0.12, keep);
    scatter(m, 30, 39, 60, 48, TL.GRASS, TL.FLOWERS, 0.18, keep);
    scatter(m, 62, 6, 99, 22, TL.GRASS, TL.TREE, 0.1, keep);
    scatter(m, 46, 47, 99, 51, TL.GRASS, TL.TREE, 0.12, keep);
    scatter(m, 20, 6, 99, 53, TL.GRASS, TL.FLOWERS, 0.05, keep);
    for (let y = 9; y < 69; y += 4) if (m.get(25, y) === TL.SAND && !keep(25, y)) m.set(25, y, TL.PALM);
    for (let x = 30; x < 99; x += 6) if (m.get(x, 7) === TL.SAND && !keep(x, 7)) m.set(x, 7, TL.PALM);
    for (let y = 56; y < 69; y += 3) if (!keep(39, y)) m.set(39, y, TL.PALM);
    return m;
  }

  // ---------------- Islas del Rosario ----------------
  function buildIsland() {
    const m = makeMap('island', 60, 44, 77);
    m.title = 'Islas del Rosario';
    m.fill(0, 0, 59, 43, TL.WATER);
    const cx = 30, cy = 25;
    for (let y = 0; y < 44; y++) for (let x = 0; x < 60; x++) {
      const e = (r1, r2) => ((x - cx) ** 2) / (r1 * r1) + ((y - cy) ** 2) / (r2 * r2);
      if (e(20, 14) <= 1) m.set(x, y, m.R() < 0.06 ? TL.CORAL : TL.SHALLOW);
      if (e(17, 11) <= 1) m.set(x, y, TL.SAND);
      if (e(8, 4) <= 1) m.set(x, y, TL.GRASS);
    }
    // sandbar to the east
    for (let x = 46; x <= 55; x++) for (let y = 23; y <= 29; y++) if (m.get(x, y) === TL.WATER) m.set(x, y, m.R() < 0.08 ? TL.CORAL : TL.SHALLOW);
    m.fill(47, 25, 53, 27, TL.SAND);
    // dock & boat
    m.fill(29, 6, 30, 15, TL.DOCK, 0);
    m.set(31, 7, TL.BOAT, 0); m.set(32, 7, TL.BOAT, 1);
    // hut & hammock
    m.fill(36, 22, 39, 24, TL.HUT, 0); m.set(37, 24, TL.HUT, 1);
    m.set(21, 27, TL.PALM); m.set(22, 27, TL.HAMMOCK); m.set(23, 27, TL.HAMMOCK); m.set(24, 27, TL.PALM);

    m.shells = [[16, 24], [19, 18], [25, 34], [36, 35], [44, 30], [45, 19], [38, 15], [50, 26]].map(([x, y], i) => ({ id: 'i' + i, x, y, kind: i + 1 }));
    m.memories = [
      { id: 'hammock', x: 22, y: 29, title: 'The Hammock', caption: 'Swinging between two palm trees' },
      { id: 'sandbar', x: 52, y: 26, title: 'Crystal Water', caption: 'The clearest turquoise water in the Caribbean' },
    ];
    m.npcs = [
      { id: 'boatman2', name: 'Lanchero', x: 28, y: 15, look: 'boatman', lines: ['¿Listos para volver a la ciudad? Ready to go back?'], action: 'toCity' },
      { id: 'islander', name: 'Isleña', x: 35, y: 26, look: 'islander', lines: ['¡Bienvenidos a las islas! Walk out to the sandbar on the east side — the water is like glass.', 'Try my coco loco: coconut, pineapple and a little love.'], action: 'treat', treat: 'a coco loco' },
      { id: 'snorkel', name: 'Mateo', x: 16, y: 29, look: 'snorkel', wander: 2, lines: ['I saw a sea turtle by the south reef!', 'Swim out or take a kayak and say hola — she’s very friendly.'] },
      { id: 'turtle', name: 'Tortuga', x: 40, y: 36, look: 'turtle', swim: true, wander: 4, lines: ['The sea turtle blinks at you slowly... 🐢', 'She swims a happy little circle around you. ¡Qué belleza!'] },
    ];
    m.kayaks = [{ x: 12, y: 24, color: '#ff9a2e' }, { x: 12, y: 27, color: '#b48ce0' }];
    [[19, 22, 1], [41, 31, 0]].forEach(([x, y, v]) => m.set(x, y, TL.TOWEL, v));
    m.spawn = { x: 29, y: 16, dir: 'down' };
    const keep = near(m.shells.concat(m.memories, m.npcs, [m.spawn], [{ x: 29, y: 15 }, { x: 30, y: 15 }]), 1);
    scatter(m, 0, 0, 59, 43, TL.SAND, TL.PALM, 0.07, (x, y) => keep(x, y) || (x >= 27 && x <= 32 && y <= 18) || (x >= 20 && x <= 25 && y >= 26 && y <= 30));
    scatter(m, 0, 0, 59, 43, TL.GRASS, TL.FLOWERS, 0.3, keep);
    return m;
  }

  // Breadth-first search: every shell, memory and person must be reachable.
  CG.checkReachable = function (m) {
    const seen = new Uint8Array(m.w * m.h), q = [[m.spawn.x, m.spawn.y]];
    seen[m.spawn.y * m.w + m.spawn.x] = 1;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!m.in(nx, ny) || seen[ny * m.w + nx] || CG.isSolid(m.get(nx, ny))) continue;
        seen[ny * m.w + nx] = 1; q.push([nx, ny]);
      }
    }
    const bad = [];
    const adjOk = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.in(x + dx, y + dy) && seen[(y + dy) * m.w + x + dx]);
    m.shells.forEach(s => { if (!seen[s.y * m.w + s.x]) bad.push('shell ' + s.id); });
    m.memories.forEach(s => { if (s.x != null && !seen[s.y * m.w + s.x]) bad.push('memory ' + s.id); });
    m.npcs.forEach(s => { if (!adjOk(s.x, s.y)) bad.push('npc ' + s.id); });
    return bad;
  };

  CG.buildWorld = function () { return { cartagena: buildCartagena(), island: buildIsland() }; };
})(window.CG);
