// Little cumbia-style loop and sound effects, made with Web Audio (no files).
window.CG = window.CG || {};
(function (CG) {
  let ac = null, master = null, musicGain = null, timer = null, step = 0, nextTime = 0;
  const A = CG.audio = { musicOn: true };

  function ensure() {
    if (ac) return true;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
      return true;
    } catch (e) { return false; }
  }
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);

  function tone(note, t, dur, type, vol, dest) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = hz(note);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
  }
  let noiseBuf = null;
  function shaker(t, vol) {
    if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 6000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    s.connect(f); f.connect(g); g.connect(musicGain); s.start(t); s.stop(t + 0.1);
  }

  // 2-bar progression in C major: C - G - Am - F, 8 steps per bar.
  const CHORDS = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]];
  const MELODY = [72, -1, 76, 74, 72, -1, 69, -1, 71, -1, 74, 72, 71, -1, 67, -1, 69, -1, 72, 71, 69, -1, 76, -1, 77, 76, 74, -1, 72, -1, 69, -1];
  const STEP = 0.15;

  function schedule() {
    while (nextTime < ac.currentTime + 0.3) {
      const s = step % 32, chord = CHORDS[Math.floor(s / 8)], t = nextTime;
      if (s % 8 === 0 || s % 8 === 3 || s % 8 === 6) tone(chord[0] - 12, t, 0.3, 'triangle', 0.5, musicGain);
      if (s % 4 === 2) chord.forEach(n => tone(n + 12, t, 0.12, 'square', 0.04, musicGain));
      shaker(t, s % 2 ? 0.08 : 0.16);
      const m = MELODY[s]; if (m > 0) tone(m, t, 0.25, 'triangle', 0.18, musicGain);
      step++; nextTime += STEP;
    }
  }

  A.start = function () {
    if (!ensure()) return;
    if (ac.state === 'suspended') ac.resume();
    if (A.musicOn && !timer) { nextTime = ac.currentTime + 0.05; timer = setInterval(schedule, 80); }
  };
  A.toggleMusic = function () {
    A.musicOn = !A.musicOn;
    if (!A.musicOn && timer) { clearInterval(timer); timer = null; }
    else if (A.musicOn) A.start();
    return A.musicOn;
  };
  A.sfx = function (kind) {
    if (!ensure()) return;
    const t = ac.currentTime;
    if (kind === 'shell') { tone(84, t, 0.12, 'triangle', 0.25); tone(88, t + 0.07, 0.12, 'triangle', 0.25); tone(91, t + 0.14, 0.2, 'triangle', 0.25); }
    else if (kind === 'photo') { shaker(t, 0.6); tone(96, t, 0.05, 'square', 0.1); tone(76, t + 0.15, 0.3, 'triangle', 0.2); tone(81, t + 0.25, 0.4, 'triangle', 0.2); }
    else if (kind === 'talk') tone(79 + ((Math.random() * 5) | 0), t, 0.04, 'square', 0.05);
    else if (kind === 'horn') { tone(50, t, 0.8, 'sawtooth', 0.12); tone(57, t, 0.8, 'sawtooth', 0.08); }
    else if (kind === 'swap') { tone(76, t, 0.08, 'triangle', 0.15); tone(72, t + 0.06, 0.1, 'triangle', 0.15); }
    else if (kind === 'yum') { tone(76, t, 0.1, 'triangle', 0.2); tone(83, t + 0.09, 0.18, 'triangle', 0.2); }
    else if (kind === 'splash') { shaker(t, 0.5); shaker(t + 0.05, 0.3); tone(45, t, 0.15, 'sine', 0.2); }
    else if (kind === 'kayak') { tone(67, t, 0.08, 'triangle', 0.15); tone(74, t + 0.07, 0.12, 'triangle', 0.15); }
    else if (kind === 'hug') { tone(79, t, 0.15, 'sine', 0.2); tone(84, t + 0.12, 0.3, 'sine', 0.2); }
    else if (kind === 'dance') { [72, 76, 79, 84, 79, 76, 72, 79].forEach((n, i) => tone(n, t + i * 0.12, 0.12, 'square', 0.06)); }
    else if (kind === 'catch') { [84, 88, 91, 96].forEach((n, i) => tone(n, t + i * 0.07, 0.12, 'triangle', 0.2)); }
    else if (kind === 'neigh') { const o = ac.createOscillator(), gg = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.linearRampToValueAtTime(500, t + 0.5); gg.gain.setValueAtTime(0.06, t); gg.gain.exponentialRampToValueAtTime(0.001, t + 0.55); o.connect(gg); gg.connect(master); o.start(t); o.stop(t + 0.6); }
    else if (kind === 'firework') { shaker(t, 0.5); tone(60 + ((Math.random() * 24) | 0), t, 0.3, 'triangle', 0.08); }
  };
})(window.CG);
