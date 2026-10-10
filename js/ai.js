/* ==========================================================================
 * ALL-IN KINGDOM  ·  ai.js
 * Equity por Monte Carlo contra N rivales + personalidades de bot.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  const AI_PROFILES = {
    facil:       { id: "facil",       label: "Novato",      aggression: 0.22, bluff: 0.02, callMargin: 1.50, raiseThresh: 0.74, variance: 0.16 },
    medio:       { id: "medio",       label: "Habitue",     aggression: 0.42, bluff: 0.08, callMargin: 1.18, raiseThresh: 0.64, variance: 0.11 },
    dificil:     { id: "dificil",     label: "Profesional", aggression: 0.60, bluff: 0.14, callMargin: 1.02, raiseThresh: 0.57, variance: 0.08 },
    agresivo:    { id: "agresivo",    label: "Temerario",   aggression: 0.88, bluff: 0.24, callMargin: 0.96, raiseThresh: 0.50, variance: 0.13 },
    conservador: { id: "conservador", label: "Cauto",       aggression: 0.15, bluff: 0.03, callMargin: 1.42, raiseThresh: 0.76, variance: 0.06 },
    farolero:    { id: "farolero",    label: "Farolero",    aggression: 0.70, bluff: 0.40, callMargin: 1.06, raiseThresh: 0.62, variance: 0.18 }
  };

  function unknownPool(known) {
    const seen = {};
    known.forEach(function (c) { seen[c.rank + c.suit] = true; });
    const pool = [];
    AK.SUIT_KEYS.forEach(function (s) {
      AK.RANK_KEYS.forEach(function (r) { if (!seen[r + s]) pool.push(AK.makeCard(r, s)); });
    });
    return pool;
  }

  /**
   * Equity del jugador contra `numOpponents` manos aleatorias.
   */
  function estimateEquity(hole, community, numOpponents, iterations) {
    numOpponents = Math.max(1, numOpponents || 1);
    iterations = iterations || 140;

    /* Board completo: evaluacion exacta por muestreo (evita explosion combinatoria). */
    const fullBoard = community.length === 5;
    const iters = fullBoard ? Math.min(600, iterations * 3) : iterations;

    const pool = unknownPool(hole.concat(community));
    const needBoard = 5 - community.length;

    let scoreSum = 0;
    for (let it = 0; it < iters; it++) {
      const need = needBoard + numOpponents * 2;
      /* Muestreo parcial Fisher-Yates */
      for (let n = 0; n < need; n++) {
        const k = n + Math.floor(Math.random() * (pool.length - n));
        const t = pool[n]; pool[n] = pool[k]; pool[k] = t;
      }
      const board = community.concat(pool.slice(0, needBoard));
      const my = AK.bestHand(hole.concat(board));
      let beaten = false, tied = false;
      for (let o = 0; o < numOpponents; o++) {
        const oppHole = [pool[needBoard + o * 2], pool[needBoard + o * 2 + 1]];
        const opp = AK.bestHand(oppHole.concat(board));
        if (opp.score > my.score) { beaten = true; break; }
        if (opp.score === my.score) tied = true;
      }
      if (!beaten) scoreSum += tied ? 0.5 : 1;
    }
    return scoreSum / iters;
  }

  /** Accion del bot en turno. */
  function decideAction(table, profile) {
    profile = profile || AI_PROFILES.medio;
    const p = table.currentPlayer();
    if (!p) return { type: "fold" };

    const actions = table.availableActions();
    const types = actions.map(function (a) { return a.type; });
    const callA = actions.find(function (a) { return a.type === "call"; });
    const raiseA = actions.find(function (a) { return a.type === "raise"; });
    const toCall = Math.max(0, table.currentBet - p.betThisRound);
    const pot = table.pot;
    const opponents = Math.max(1, table.players.filter(function (q) { return q !== p && !q.folded; }).length);

    const iters = Math.max(70, 180 - opponents * 14);
    const equity = estimateEquity(p.hole, table.community, opponents, iters);
    const eff = Math.max(0, Math.min(1, equity + (Math.random() - 0.5) * profile.variance * 2));

    const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
    const r = Math.random();
    const aggro = profile.aggression;

    /* Ajustes por numero de rivales y posicion */
    const multiPenalty = (opponents - 1) * 0.055;
    const raiseNeed = profile.raiseThresh + multiPenalty;
    const isLate = (p.seat === table.button || p.seat === ((table.button - 1 + table.players.length) % table.players.length));
    const posBonus = isLate ? 0.04 : 0;
    const bluffChance = profile.bluff / (1 + (opponents - 1) * 0.8);

    const wantRaise = eff + posBonus >= raiseNeed || r < bluffChance * (toCall > 0 ? 0.5 : 1);

    if (toCall === 0) {
      if (wantRaise && types.indexOf("raise") >= 0) {
        const frac = 0.45 + aggro * 0.6;
        let target = p.betThisRound + Math.max(table.bigBlind, Math.round(pot * frac));
        if (raiseA) target = Math.max(raiseA.min, Math.min(target, raiseA.max));
        return { type: "raise", amount: target, equity: equity };
      }
      return { type: "check", equity: equity };
    }

    const need = potOdds * profile.callMargin;
    const canRaise = types.indexOf("raise") >= 0 && p.stack > toCall;

    if (eff + posBonus >= raiseNeed + 0.08 && canRaise && r < aggro + 0.3) {
      const frac = 0.6 + aggro * 0.8;
      let target = p.betThisRound + Math.max(table.bigBlind, Math.round((pot + toCall) * frac));
      if (raiseA) target = Math.max(raiseA.min, Math.min(target, raiseA.max));
      return { type: "raise", amount: target, equity: equity };
    }

    if (eff >= need) return { type: "call", equity: equity };
    if (r < bluffChance && callA) return { type: "call", equity: equity };
    return { type: "fold", equity: equity };
  }

  AK.AI_PROFILES = AI_PROFILES;
  AK.estimateEquity = estimateEquity;
  AK.decideAction = decideAction;
})(window);
