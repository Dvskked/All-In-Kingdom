/* ==========================================================================
 * ALL-IN KINGDOM  ·  sound.js
 * Sonidos sintetizados con Web Audio API (sin ficheros externos).
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  let ctx = null;
  let master = null;
  let muted = false;
  let unlocked = false;

  function ensure() {
    if (!ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    return ctx;
  }

  function unlock() {
    const c = ensure();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    if (!unlocked) {
      unlocked = true;
      /* Un chasquido silencioso para desbloquear el audio en móviles */
      try {
        const o = c.createOscillator(); const g = c.createGain();
        g.gain.value = 0.0001; o.connect(g); g.connect(master);
        o.start(); o.stop(c.currentTime + 0.02);
      } catch (e) {}
    }
  }

  function tone(freq, dur, type, vol, delay) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + (delay || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.03);
    return o;
  }

  /* Ruido (fichas, cartas, palmas) */
  function noise(dur, vol, filter) {
    const c = ensure(); if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain(); g.gain.value = vol || 0.2;
    const f = c.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = filter || 2600; f.Q.value = 0.8;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  const SOUNDS = {
    click: function () { tone(520, 0.05, "square", 0.12); },
    hover: function () { tone(700, 0.03, "sine", 0.05); },
    deal: function () { noise(0.09, 0.16, 3200); tone(260, 0.05, "triangle", 0.06); },
    flip: function () { noise(0.06, 0.12, 4200); },
    chip: function () {
      noise(0.05, 0.12, 2400);
      tone(880, 0.05, "triangle", 0.08, 0.02);
    },
    chipStack: function () {
      noise(0.05, 0.1, 2200);
      tone(760, 0.05, "triangle", 0.07, 0.03);
      tone(1040, 0.05, "triangle", 0.06, 0.07);
    },
    cash: function () { tone(1200, 0.07, "triangle", 0.14); tone(1600, 0.09, "triangle", 0.12, 0.07); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.16, "triangle", 0.16, i * 0.09); }); },
    bigwin: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.2, "triangle", 0.18, i * 0.08); }); noise(0.3, 0.06, 5000); },
    lose: function () { [392, 330, 262].forEach(function (f, i) { tone(f, 0.22, "sawtooth", 0.1, i * 0.12); }); },
    allin: function () { const o = tone(200, 0.5, "sawtooth", 0.16); if (o) o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.5); },
    fold: function () { noise(0.14, 0.12, 1400); },
    check: function () { tone(440, 0.06, "sine", 0.1); },
    bust: function () { tone(180, 0.3, "sawtooth", 0.14); tone(120, 0.3, "sawtooth", 0.14, 0.1); },
    horse: function () { tone(300, 0.12, "sine", 0.12); tone(420, 0.12, "sine", 0.12, 0.1); },
    gallop: function () { for (let i = 0; i < 3; i++) noise(0.05, 0.1, 900 + i * 120); },
    bell: function () { tone(1568, 0.25, "sine", 0.16); tone(2093, 0.3, "sine", 0.1, 0.02); },
    raceWin: function () { [523, 659, 784, 1046, 1318, 1568].forEach(function (f, i) { tone(f, 0.16, "square", 0.12, i * 0.07); }); }
  };

  /* Sonidos pre-sintetizados para no encadenar tonos erroneamente */
  const AK_Sound = {
    play: function (name) {
      if (muted) return;
      unlock();
      const fn = SOUNDS[name];
      if (fn) { try { fn(); } catch (e) {} }
    },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },
    toggle: function () { muted = !muted; if (!muted) unlock(); return muted; },
    unlock: unlock
  };

  AK.Sound = AK_Sound;
})(window);
