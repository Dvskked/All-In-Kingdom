/* ==========================================================================
 * ALL-IN KINGDOM  ·  slots.js
 * Tragaperras de 3 rodillos con tirada ponderada y premios por trio.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  /* Peso = probabilidad relativa. mult = pago total (x) por trio. */
  const SYMBOLS = [
    { key: "cherry", glyph: "\uD83C\uDF52", weight: 30, mult: 4,  name: "Cereza" },
    { key: "lemon",  glyph: "\uD83C\uDF4B", weight: 24, mult: 6,  name: "Limón" },
    { key: "melon",  glyph: "\uD83C\uDF49", weight: 18, mult: 10, name: "Sandía" },
    { key: "bell",   glyph: "\uD83D\uDD14", weight: 13, mult: 20, name: "Campana" },
    { key: "star",   glyph: "\u2B50",       weight: 8,  mult: 40, name: "Estrella" },
    { key: "diamond",glyph: "\uD83D\uDC8E", weight: 4,  mult: 80, name: "Diamante" },
    { key: "seven",  glyph: "7\uFE0F\u20E3", weight: 1, mult: 200, name: "Siete" }
  ];

  const TOTAL_WEIGHT = SYMBOLS.reduce(function (s, x) { return s + x.weight; }, 0);

  function pick() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (let i = 0; i < SYMBOLS.length; i++) {
      r -= SYMBOLS[i].weight;
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[0];
  }

  function SlotMachine() {
    this.symbols = SYMBOLS;
    this.spins = 0;
  }

  /**
   * Gira los rodillos con la apuesta dada.
   * @returns {object} { reels:[symbol], multiplier, payout, win }
   */
  SlotMachine.prototype.spin = function (bet) {
    this.spins++;
    const reels = [pick(), pick(), pick()];
    let multiplier = 0;
    if (reels[0].key === reels[1].key && reels[1].key === reels[2].key) {
      multiplier = reels[0].mult;
    } else {
      /* Premio menor: dos cerezas */
      const cherries = reels.filter(function (s) { return s.key === "cherry"; }).length;
      if (cherries === 2) multiplier = 1;
    }
    const payout = Math.floor((bet || 0) * multiplier);
    return { reels: reels, multiplier: multiplier, payout: payout, win: multiplier > 1, bet: bet || 0 };
  };

  AK.SlotMachine = SlotMachine;
  AK.SLOT_SYMBOLS = SYMBOLS;
})(window);
