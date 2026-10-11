/* ==========================================================================
 * ALL-IN KINGDOM  ·  roulette.js
 * Motor de Ruleta europea (un solo cero, 37 numeros) con apuestas multiples:
 * pleno, color (rojo/negro), par/impar, mitades, docenas y columnas.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  /* Orden real de la ruleta europea (sentido horario) */
  const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
    10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

  const RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

  function isRed(n) { return RED.indexOf(n) >= 0; }
  function colorOf(n) { return n === 0 ? "green" : (isRed(n) ? "red" : "black"); }

  /* Pago total devuelto (incluye la apuesta). pleno 35:1 => x36 */
  const PAYOUT = {
    straight: 36, red: 2, black: 2, even: 2, odd: 2, low: 2, high: 2,
    dozen: 3, column: 3
  };

  const BET_LABELS = {
    straight: function (v) { return "Pleno al " + v; },
    red: function () { return "Rojo"; },
    black: function () { return "Negro"; },
    even: function () { return "Par"; },
    odd: function () { return "Impar"; },
    low: function () { return "1-18"; },
    high: function () { return "19-36"; },
    dozen: function (v) { return v + "ª docena"; },
    column: function (v) { return "Columna " + v; }
  };

  function betWins(bet, n) {
    switch (bet.type) {
      case "straight": return n === Number(bet.value);
      case "red": return isRed(n);
      case "black": return n !== 0 && !isRed(n);
      case "even": return n !== 0 && n % 2 === 0;
      case "odd": return n % 2 === 1;
      case "low": return n >= 1 && n <= 18;
      case "high": return n >= 19 && n <= 36;
      case "dozen": return n >= 1 && Math.ceil(n / 12) === Number(bet.value);
      case "column": return n >= 1 && ((n - 1) % 3) + 1 === Number(bet.value);
      default: return false;
    }
  }

  /**
   * Resuelve un conjunto de apuestas contra el numero ganador.
   * @returns {object} { total, staked, net, winners:[], details:[] }
   */
  function resolveBets(bets, n) {
    let total = 0, staked = 0;
    const details = bets.map(function (b) {
      const amt = Math.max(0, Math.floor(b.amount || 0));
      staked += amt;
      const won = betWins(b, n);
      const payout = won ? amt * (PAYOUT[b.type] || 0) : 0;
      total += payout;
      return { bet: b, won: won, payout: payout, label: label(b) };
    });
    return { total: total, staked: staked, net: total - staked, details: details, winners: details.filter(function (d) { return d.won; }) };
  }

  function label(b) {
    const fn = BET_LABELS[b.type];
    return fn ? fn(b.value) : b.type;
  }

  function RouletteWheel() {
    this.order = WHEEL.slice();
    this.last = null;
    this.history = [];
  }

  RouletteWheel.prototype.spin = function () {
    const idx = Math.floor(Math.random() * this.order.length);
    this.last = this.order[idx];
    this.history.unshift(this.last);
    if (this.history.length > 12) this.history.pop();
    return this.last;
  };

  /** Indice del numero en la rueda (para animar el giro). */
  RouletteWheel.prototype.indexOf = function (n) { return this.order.indexOf(n); };

  /* ================================================================== *
   *  APUESTAS DE CET (2 y 4 numeros) sobre la rueda.                    *
   * ================================================================== */
  const NEIGHBORS = (function () {
    const map = {};
    for (let i = 0; i < WHEEL.length; i++) {
      const left = WHEEL[(i - 1 + WHEEL.length) % WHEEL.length];
      const right = WHEEL[(i + 1) % WHEEL.length];
      const left2 = WHEEL[(i - 2 + WHEEL.length) % WHEEL.length];
      const right2 = WHEEL[(i + 2) % WHEEL.length];
      map[WHEEL[i]] = { left: left, right: right, pair: [WHEEL[i], left], quartet: [WHEEL[i], left, right, left2, right2] };
    }
    return map;
  })();

  AK.RouletteWheel = RouletteWheel;
  AK.roulette = {
    WHEEL: WHEEL, RED: RED, PAYOUT: PAYOUT, NEIGHBORS: NEIGHBORS,
    isRed: isRed, colorOf: colorOf, betWins: betWins, resolveBets: resolveBets, label: label
  };
})(window);
