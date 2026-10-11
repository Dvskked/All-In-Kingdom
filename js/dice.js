/* ==========================================================================
 * ALL-IN KINGDOM  ·  dice.js
 * Motor de Sic Bo (dados): grande/pequeño, par/impar, total exacto,
 * numero suelto y triple. Tres dados de 6 caras.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  /* Pago total (x) por total exacto (incluye apuesta) */
  const TOTAL_PAYOUT = { 4: 61, 17: 61, 5: 31, 16: 31, 6: 18, 15: 18, 7: 13, 14: 13, 8: 9, 13: 9, 9: 7, 12: 7, 10: 7, 11: 7 };

  function isTriple(d) { return d[0] === d[1] && d[1] === d[2]; }

  function betWins(bet, dice) {
    const total = dice[0] + dice[1] + dice[2];
    const triple = isTriple(dice);
    switch (bet.type) {
      case "small": return total >= 4 && total <= 10 && !triple;
      case "big": return total >= 11 && total <= 17 && !triple;
      case "odd": return total % 2 === 1 && !triple;
      case "even": return total % 2 === 0 && !triple;
      case "triple": return triple;
      case "total": return total === Number(bet.value);
      case "single": return dice.indexOf(Number(bet.value)) >= 0;
      default: return false;
    }
  }

  function payoutFor(bet, dice) {
    const v = Number(bet.value);
    switch (bet.type) {
      case "single": {
        const count = dice.filter(function (x) { return x === v; }).length;
        return count ? (1 + count) : 0;
      }
      case "total": return TOTAL_PAYOUT[v] || 0;
      case "triple": return 31;
      default: return 2; /* 1:1 */
    }
  }

  function resolveBets(bets, dice) {
    let total = 0, staked = 0;
    const details = bets.map(function (b) {
      const amt = Math.max(0, Math.floor(b.amount || 0));
      staked += amt;
      const won = betWins(b, dice);
      const payout = won ? amt * payoutFor(b, dice) : 0;
      total += payout;
      return { bet: b, won: won, payout: payout, label: label(b) };
    });
    return { total: total, staked: staked, net: total - staked, details: details, total_: dice[0] + dice[1] + dice[2] };
  }

  const LABELS = {
    small: function () { return "Pequeño (4-10)"; },
    big: function () { return "Grande (11-17)"; },
    odd: function () { return "Impar"; },
    even: function () { return "Par"; },
    triple: function () { return "Triple"; },
    total: function (v) { return "Total " + v; },
    single: function (v) { return "Número " + v; }
  };
  function label(b) { const f = LABELS[b.type]; return f ? f(b.value) : b.type; }

  function roll() {
    return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
  }

  AK.dice = { roll: roll, betWins: betWins, resolveBets: resolveBets, isTriple: isTriple, label: label, TOTAL_PAYOUT: TOTAL_PAYOUT };
})(window);
