/* ==========================================================================
 * ALL-IN KINGDOM  ·  poker.js
 * Evaluador de manos + motor Texas Hold'em MULTIJUGADOR (2-8) con side pots.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  /* ================================================================== *
   *  EVALUADOR DE MANOS                                                *
   * ================================================================== */
  const CATEGORY = {
    8: "Escalera de Color", 7: "Póquer", 6: "Full House", 5: "Color",
    4: "Escalera", 3: "Trío", 2: "Doble Pareja", 1: "Pareja", 0: "Carta Alta"
  };

  function evaluate5(cards) {
    const values = cards.map(function (c) { return c.value; }).sort(function (a, b) { return b - a; });
    const suits = cards.map(function (c) { return c.suit; });
    const isFlush = suits.every(function (s) { return s === suits[0]; });
    const counts = {};
    values.forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    const unique = Array.from(new Set(values));

    let isStraight = false, straightHigh = 0;
    if (unique.length === 5) {
      if (unique[0] - unique[4] === 4) { isStraight = true; straightHigh = unique[0]; }
      else if (unique[0] === 14 && unique[1] === 5) { isStraight = true; straightHigh = 5; }
    }
    const ordered = unique.slice().sort(function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return b - a;
    });

    let category, ranks;
    if (isStraight && isFlush) { category = 8; ranks = [straightHigh]; }
    else if (counts[ordered[0]] === 4) { category = 7; ranks = ordered; }
    else if (counts[ordered[0]] === 3 && counts[ordered[1]] === 2) { category = 6; ranks = ordered; }
    else if (isFlush) { category = 5; ranks = values; }
    else if (isStraight) { category = 4; ranks = [straightHigh]; }
    else if (counts[ordered[0]] === 3) { category = 3; ranks = ordered; }
    else if (counts[ordered[0]] === 2 && counts[ordered[1]] === 2) { category = 2; ranks = ordered; }
    else if (counts[ordered[0]] === 2) { category = 1; ranks = ordered; }
    else { category = 0; ranks = values; }

    return { category: category, ranks: ranks, name: CATEGORY[category], cards: cards.slice() };
  }

  function scoreOf(hand) {
    let s = hand.category;
    for (let i = 0; i < hand.ranks.length; i++) s = s * 15 + hand.ranks[i];
    for (let i = hand.ranks.length; i < 5; i++) s = s * 15;
    return s;
  }

  function combinations(arr, k) {
    const out = [];
    (function rec(start, combo) {
      if (combo.length === k) { out.push(combo.slice()); return; }
      for (let i = start; i < arr.length; i++) { combo.push(arr[i]); rec(i + 1, combo); combo.pop(); }
    })(0, []);
    return out;
  }

  function bestHand(cards) {
    if (cards.length < 5) throw new Error("Se necesitan al menos 5 cartas");
    let best = null, bestScore = -1;
    const combos = combinations(cards, 5);
    for (let i = 0; i < combos.length; i++) {
      const h = evaluate5(combos[i]);
      const sc = scoreOf(h);
      if (sc > bestScore) { bestScore = sc; best = h; }
    }
    best.score = bestScore;
    return best;
  }

  /* ================================================================== *
   *  MOTOR TEXAS HOLD'EM MULTIJUGADOR                                  *
   * ================================================================== */

  /**
   * @param {object} opts {
   *   players:[{name, stack, isHuman, profile, quips, charId}],
   *   smallBlind, bigBlind
   * }
   */
  function PokerTable(opts) {
    opts = opts || {};
    this.smallBlind = opts.smallBlind || 10;
    this.bigBlind = opts.bigBlind || 20;

    this.players = (opts.players || []).map(function (spec, i) {
      return {
        seat: i,
        name: spec.name || ("Bot " + i),
        stack: spec.stack || 0,
        isHuman: !!spec.isHuman,
        profile: spec.profile || "medio",
        quips: spec.quips || null,
        charId: spec.charId || null,
        face: spec.face || "\uD83D\uDE42",
        color: spec.color || "#8d99a4",
        skin: spec.skin || "#e7b98c",
        hole: [], betThisRound: 0, committed: 0,
        folded: false, allIn: false, hasActed: false, revealed: false,
        lastAction: ""
      };
    });

    this.button = -1;
    this.handNumber = 0;
    this.pot = 0;
    this.phase = "idle";
    this.community = [];
    this.deck = new AK.Deck().shuffle();
  }

  PokerTable.prototype._log = function (msg) { this.log.push(msg); return msg; };

  PokerTable.prototype.chipsInPlay = function () {
    return this.players.reduce(function (s, p) { return s + p.stack; }, 0) + this.pot;
  };

  /* Jugadores con fichas (pueden recibir cartas) */
  PokerTable.prototype.playersWithChips = function () {
    return this.players.filter(function (p) { return p.stack > 0; });
  };

  PokerTable.prototype._nextWithChips = function (from) {
    const n = this.players.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + k + n) % n;
      if (this.players[i].stack > 0) return i;
    }
    return -1;
  };

  PokerTable.prototype.currentPlayer = function () {
    return this.players[this.toAct] || null;
  };

  /** Inicia una mano nueva. Devuelve false si no se puede. */
  PokerTable.prototype.newHand = function () {
    const seated = this.playersWithChips();
    if (seated.length < 2) return false;

    this.deck = new AK.Deck().shuffle();
    this.community = [];
    this.pot = 0;
    this.phase = "preflop";
    this.lastRaiseSize = this.bigBlind;
    this.handNumber++;

    this.players.forEach(function (p) {
      /* los que no tienen fichas no reciben cartas */
      p.hole = p.stack > 0 ? [this.deck.draw(), this.deck.draw()] : [];
      p.betThisRound = 0;
      p.committed = 0;
      p.folded = p.stack <= 0;
      p.allIn = false;
      p.hasActed = false;
      p.revealed = false;
      p.lastAction = "";
    }, this);

    /* Avanza el boton entre los que tienen fichas */
    this.button = this._nextWithChips(this.button);

    const n = this.players.length;
    let sbSeat, bbSeat, firstToAct;
    if (seated.length === 2) {
      sbSeat = this.button;
      bbSeat = this._nextWithChips(this.button);
      firstToAct = this.button; /* heads-up: el boton/SB actua primero */
    } else {
      sbSeat = this._nextWithChips(this.button);
      bbSeat = this._nextWithChips(sbSeat);
      firstToAct = this._nextWithChips(bbSeat);
    }
    this.sbSeat = sbSeat;
    this.bbSeat = bbSeat;

    this._postBlind(sbSeat, this.smallBlind);
    this._postBlind(bbSeat, this.bigBlind);

    this.currentBet = this.bigBlind;
    this.toAct = firstToAct;
    this.log = [];
    this._log("Mano #" + this.handNumber + " · ciegas " + this.smallBlind + "/" + this.bigBlind);
    return true;
  };

  PokerTable.prototype._postBlind = function (seat, amount) {
    const p = this.players[seat];
    if (!p) return;
    const pay = Math.min(amount, p.stack);
    p.stack -= pay;
    p.betThisRound += pay;
    p.committed += pay;
    this.pot += pay;
    if (p.stack === 0) p.allIn = true;
  };

  /** Acciones legales del jugador en turno. */
  PokerTable.prototype.availableActions = function () {
    const p = this.currentPlayer();
    if (!p || p.folded || p.allIn) return [];
    const toCall = this.currentBet - p.betThisRound;
    const actions = [];
    if (toCall <= 0) actions.push({ type: "check" });
    else actions.push({ type: "call", amount: Math.min(toCall, p.stack) });

    const someoneCanRespond = this.players.some(function (q) {
      return q !== p && !q.folded && !q.allIn && q.stack > 0;
    });
    if (p.stack > toCall && someoneCanRespond) {
      const minRaiseTo = this.currentBet + this.lastRaiseSize;
      actions.push({
        type: "raise",
        min: Math.min(minRaiseTo, p.betThisRound + p.stack),
        max: p.betThisRound + p.stack
      });
    }
    actions.push({ type: "allin", amount: p.stack });
    actions.push({ type: "fold" });
    return actions;
  };

  PokerTable.prototype.act = function (type, amount) {
    const p = this.currentPlayer();
    if (!p || p.folded || p.allIn) return null;

    if (type === "fold") {
      p.folded = true; p.hasActed = true; p.lastAction = "fold";
      this._log(p.name + " se retira.");
    } else if (type === "check") {
      p.hasActed = true; p.lastAction = "check";
      this._log(p.name + " pasa.");
    } else if (type === "call") {
      const toCall = Math.min(this.currentBet - p.betThisRound, p.stack);
      this._commit(p, toCall);
      p.hasActed = true; p.lastAction = "call";
      this._log(p.name + " iguala " + toCall + ".");
    } else if (type === "raise" || type === "allin") {
      let target = type === "allin" ? p.betThisRound + p.stack : amount;
      const prevBet = this.currentBet;
      const add = Math.min(target - p.betThisRound, p.stack);
      this._commit(p, add);
      const newBet = p.betThisRound;
      if (newBet > prevBet) {
        this.lastRaiseSize = newBet - prevBet;
        this.currentBet = newBet;
        const cur = p;
        this.players.forEach(function (q) {
          if (q !== cur && !q.folded && !q.allIn && q.stack > 0) q.hasActed = false;
        });
        p.lastAction = type === "allin" ? "allin" : "raise";
        this._log(p.name + (type === "allin" ? " va ALL-IN a " : " sube a ") + newBet + ".");
      } else {
        p.lastAction = "call";
        this._log(p.name + " iguala " + newBet + ".");
      }
      p.hasActed = true;
    }

    if (p.stack === 0) p.allIn = true;
    return this._afterAction();
  };

  PokerTable.prototype._commit = function (p, amount) {
    amount = Math.max(0, Math.min(amount, p.stack));
    p.stack -= amount;
    p.betThisRound += amount;
    p.committed += amount;
    this.pot += amount;
    if (p.stack === 0) p.allIn = true;
  };

  PokerTable.prototype._afterAction = function () {
    const active = this.players.filter(function (p) { return !p.folded; });
    if (active.length === 1) return this._awardFoldWin(active[0]);

    const next = this._findNextToAct();
    if (next === -1) return this._nextPhase();
    this.toAct = next;
    return { type: "turn", player: this.players[next] };
  };

  PokerTable.prototype._findNextToAct = function () {
    const n = this.players.length;
    for (let k = 1; k <= n; k++) {
      const i = (this.toAct + k) % n;
      const p = this.players[i];
      if (p.folded || p.allIn || p.stack <= 0) continue;
      if (!p.hasActed || p.betThisRound < this.currentBet) return i;
    }
    return -1;
  };

  PokerTable.prototype._nextPhase = function () {
    this.players.forEach(function (p) { p.betThisRound = 0; p.hasActed = false; });
    this.currentBet = 0;
    this.lastRaiseSize = this.bigBlind;

    const order = ["preflop", "flop", "turn", "river", "showdown"];
    const idx = order.indexOf(this.phase);
    this.phase = order[idx + 1];

    if (this.phase === "flop") {
      this.community.push(this.deck.draw(), this.deck.draw(), this.deck.draw());
      this._log("Flop.");
    } else if (this.phase === "turn") {
      this.community.push(this.deck.draw());
      this._log("Turn.");
    } else if (this.phase === "river") {
      this.community.push(this.deck.draw());
      this._log("River.");
    } else if (this.phase === "showdown") {
      return this._showdown();
    }

    /* Si ya no puede apostar mas de uno, se reparte todo y se va a showdown */
    const canAct = this.players.filter(function (p) { return !p.folded && !p.allIn && p.stack > 0; });
    const active = this.players.filter(function (p) { return !p.folded; });
    if (canAct.length <= 1 && active.length >= 2) {
      return this._runOut();
    }

    /* Postflop: primero actua el siguiente al boton que pueda actuar */
    const first = this._findNextToActFrom(this.button);
    if (first === -1) return this._runOut();
    this.toAct = first;
    return { type: "phase", phase: this.phase };
  };

  PokerTable.prototype._findNextToActFrom = function (from) {
    const n = this.players.length;
    for (let k = 1; k <= n; k++) {
      const i = (from + k) % n;
      const p = this.players[i];
      if (p.folded || p.allIn || p.stack <= 0) continue;
      return i;
    }
    return -1;
  };

  PokerTable.prototype._runOut = function () {
    while (this.community.length < 5) this.community.push(this.deck.draw());
    this.phase = "showdown";
    this._log("Se reparten las cartas restantes.");
    return this._showdown();
  };

  /* Construye los botes (principal + laterales) segun aportes. */
  PokerTable.prototype._buildPots = function () {
    const players = this.players;
    const levels = Array.from(new Set(players.map(function (p) { return p.committed; })
      .filter(function (a) { return a > 0; }))).sort(function (a, b) { return a - b; });
    const pots = [];
    let prev = 0;
    for (const lvl of levels) {
      const layer = lvl - prev;
      const contributors = players.filter(function (p) { return p.committed >= lvl; });
      const amount = layer * contributors.length;
      const eligible = contributors.filter(function (p) { return !p.folded; });
      if (amount > 0 && eligible.length > 0) pots.push({ amount: amount, eligible: eligible });
      prev = lvl;
    }
    return pots;
  };

  PokerTable.prototype._showdown = function () {
    this.players.forEach(function (p) { if (!p.folded) p.revealed = true; });

    const handsBySeat = {};
    this.players.forEach(function (p) {
      if (!p.folded && p.hole.length === 2) handsBySeat[p.seat] = AK.bestHand(p.hole.concat(this.community));
    }, this);

    const pots = this._buildPots();
    const winnings = {};
    let totalPot = 0;
    const potResults = [];

    pots.forEach(function (pot) {
      totalPot += pot.amount;
      let best = -1, contenders = [];
      pot.eligible.forEach(function (p) {
        const h = handsBySeat[p.seat];
        if (!h) return;
        if (h.score > best) { best = h.score; contenders = [p]; }
        else if (h.score === best) contenders.push(p);
      });
      const share = Math.floor(pot.amount / contenders.length);
      let rem = pot.amount - share * contenders.length;
      contenders.forEach(function (p) {
        const amt = share + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
        p.stack += amt;
        winnings[p.seat] = (winnings[p.seat] || 0) + amt;
      });
      potResults.push({ amount: pot.amount, winners: contenders.map(function (p) { return p.seat; }) });
    });

    this.pot = 0;

    /* Mano ganadora global y mensaje */
    let bestSeat = -1, bestScore = -1;
    Object.keys(winnings).forEach(function (seat) {
      const h = handsBySeat[seat];
      if (h && h.score > bestScore) { bestScore = h.score; bestSeat = Number(seat); }
    });

    return {
      type: "showdown",
      handsBySeat: handsBySeat,
      winnings: winnings,
      pots: potResults,
      totalPot: totalPot,
      players: this.players,
      bestSeat: bestSeat
    };
  };

  /** Salta automaticamente a los jugadores que no pueden actuar. */
  PokerTable.prototype.advanceIfNeeded = function () {
    const p = this.currentPlayer();
    if (p && !p.folded && !p.allIn && p.stack > 0) return null;
    const next = this._findNextToAct();
    if (next === -1) return this._afterAction();
    this.toAct = next;
    return { type: "turn", player: this.players[next] };
  };

  PokerTable.prototype._awardFoldWin = function (winner) {
    const amount = this.players.reduce(function (s, p) { return s + p.committed; }, 0);
    winner.stack += amount;
    this.pot = 0;
    this._log(winner.name + " gana el bote (" + amount + ") por retirada.");
    return { type: "foldwin", winner: winner, seat: winner.seat, pot: amount };
  };

  /* Exportar */
  AK.CATEGORY = CATEGORY;
  AK.evaluate5 = evaluate5;
  AK.bestHand = bestHand;
  AK.scoreOf = scoreOf;
  AK.PokerTable = PokerTable;
})(window);
