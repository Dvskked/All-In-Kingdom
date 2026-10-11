/* ==========================================================================
 * ALL-IN KINGDOM  ·  blackjack.js
 * Motor de Blackjack (21): Pedir, Plantarse, Doblar, DIVIDIR (split),
 * SEGURO (insurance) y RENDIRSE (surrender) + logica del croupier.
 * Soporta varias manos tras dividir (hasta 4).
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  function handValue(hand) {
    let total = 0;
    let aces = 0;
    hand.forEach(function (c) {
      if (c.rank === "A") { total += 11; aces += 1; }
      else if (["J", "Q", "K", "10"].indexOf(c.rank) >= 0) total += 10;
      else total += c.value;
    });
    let soft = aces > 0;
    while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
    if (aces === 0) soft = false;
    return { total: total, soft: soft, isBlackjack: hand.length === 2 && total === 21 };
  }

  function tenValue(c) { return ["10", "J", "Q", "K"].indexOf(c.rank) >= 0; }
  function sameRankForSplit(a, b) {
    if (a.rank === b.rank) return true;
    return tenValue(a) && tenValue(b); /* 10-J, Q-K, etc. tambien se pueden dividir */
  }

  function BlackjackTable(opts) {
    opts = opts || {};
    this.numDecks = opts.numDecks || 6;
    this.dealerStand17 = opts.dealerStand17 !== false;
    this.humanName = opts.humanName || "Tu";
    this.shoe = [];
    this._shuffle();
    this.state = "idle"; /* idle | player | dealer | done */
    this.bet = 0;
    this.hands = [];
    this.activeHand = 0;
    this.dealerHand = [];
    this.insuranceBet = 0;
    this.insuranceOffered = false;
    this.results = [];
    this.result = null;
  }

  BlackjackTable.prototype._shuffle = function () {
    let cards = [];
    for (let d = 0; d < this.numDecks; d++) cards = cards.concat(new AK.Deck().cards);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = cards[i]; cards[i] = cards[j]; cards[j] = t;
    }
    this.shoe = cards;
  };

  BlackjackTable.prototype._draw = function () {
    if (this.shoe.length < this.numDecks * 52 * 0.25) this._shuffle();
    return this.shoe.pop();
  };

  BlackjackTable.prototype.newRound = function (bet) {
    this.baseBet = bet;
    this.bet = bet;
    this.hands = [{ cards: [this._draw(), this._draw()], bet: bet, done: false, doubled: false, surrendered: false, split: false, bust: false, result: null }];
    this.activeHand = 0;
    this.dealerHand = [this._draw(), this._draw()];
    this.insuranceBet = 0;
    this.insuranceOffered = false;
    this.dealerHasNatural = false;
    this.results = [];
    this.result = null;
    this.state = "player";

    const pv = handValue(this.hands[0].cards);
    if (pv.isBlackjack) { this.state = "dealer"; return this._dealerPlay(true); }
    const dv = handValue(this.dealerHand);
    /* El seguro se ofrece cuando la carta visible del croupier es un As. */
    if (this.dealerHand[0].rank === "A") this.insuranceOffered = true;
    if (dv.isBlackjack) {
      /* Si no hay seguro que decidir, el blackjack del croupier cierra la mano. */
      if (!this.insuranceOffered) { this.state = "dealer"; return this._dealerPlay(false); }
      this.dealerHasNatural = true;
    }
    return { type: "deal", state: "player", insuranceOffered: this.insuranceOffered };
  };

  BlackjackTable.prototype._hand = function () { return this.hands[this.activeHand]; };
  BlackjackTable.prototype.playerValue = function () { return handValue(this._hand().cards); };
  BlackjackTable.prototype.dealerValue = function () { return handValue(this.dealerHand); };

  BlackjackTable.prototype.hit = function () {
    if (this.state !== "player") return { type: "invalid" };
    this.insuranceOffered = false;
    const h = this._hand();
    h.cards.push(this._draw());
    const v = handValue(h.cards);
    if (v.total > 21) { h.bust = true; h.done = true; return this._advance(); }
    if (v.total === 21) { h.done = true; return this._advance(); }
    return { type: "hit", state: "player", value: v, activeHand: this.activeHand };
  };

  BlackjackTable.prototype.canDouble = function () {
    if (this.state !== "player") return false;
    const h = this._hand();
    return h.cards.length === 2 && !h.doubled;
  };

  BlackjackTable.prototype.canSplit = function () {
    if (this.state !== "player") return false;
    const h = this._hand();
    if (h.cards.length !== 2 || this.hands.length >= 4) return false;
    return sameRankForSplit(h.cards[0], h.cards[1]);
  };

  BlackjackTable.prototype.canSurrender = function () {
    if (this.state !== "player") return false;
    const h = this._hand();
    return h.cards.length === 2 && !h.split && this.hands.length === 1;
  };

  BlackjackTable.prototype.double = function () {
    if (!this.canDouble()) return { type: "invalid" };
    this.insuranceOffered = false;
    const h = this._hand();
    h.doubled = true; h.bet *= 2;
    h.cards.push(this._draw());
    const v = handValue(h.cards);
    if (v.total > 21) h.bust = true;
    h.done = true;
    return this._advance();
  };

  BlackjackTable.prototype.split = function () {
    if (!this.canSplit()) return { type: "invalid" };
    this.insuranceOffered = false;
    const h = this._hand();
    const moved = h.cards.pop();
    const isAces = h.cards[0].rank === "A";
    const nh = { cards: [moved, this._draw()], bet: h.bet, done: false, doubled: false, surrendered: false, split: true, bust: false, result: null };
    h.cards.push(this._draw());
    h.split = true;
    this.hands.splice(this.activeHand + 1, 0, nh);
    if (isAces) { h.done = true; nh.done = true; return this._advance(); }
    if (handValue(h.cards).total === 21) h.done = true;
    return this._advance();
  };

  BlackjackTable.prototype.surrender = function () {
    if (!this.canSurrender()) return { type: "invalid" };
    this.insuranceOffered = false;
    const h = this._hand();
    h.surrendered = true; h.done = true;
    return this._advance();
  };

  BlackjackTable.prototype.takeInsurance = function (amount) {
    const cap = Math.floor((this.baseBet || this.bet) / 2);
    this.insuranceBet = Math.max(0, Math.min(amount || cap, cap));
    this.insuranceOffered = false;
    return this.insuranceBet;
  };

  BlackjackTable.prototype.declineInsurance = function () { this.insuranceOffered = false; };

  BlackjackTable.prototype.stand = function () {
    if (this.state !== "player") return { type: "invalid" };
    this.insuranceOffered = false;
    this._hand().done = true;
    return this._advance();
  };

  /* Avanza a la siguiente mano o pasa al croupier. */
  BlackjackTable.prototype._advance = function () {
    while (this.activeHand < this.hands.length && this.hands[this.activeHand].done) this.activeHand++;
    if (this.activeHand >= this.hands.length) {
      this.state = "dealer";
      return this._dealerPlay(false);
    }
    const h = this._hand();
    /* Mano recien dividida por Ases: recibe una carta y se planta. */
    if (h.cards.length < 2) {
      h.cards.push(this._draw());
      const v = handValue(h.cards);
      if (v.total > 21) h.bust = true;
      h.done = true;
      return this._advance();
    }
    return { type: "progress", state: "player", activeHand: this.activeHand };
  };

  BlackjackTable.prototype._dealerPlay = function (playerNatural) {
    this.state = "dealer";
    const live = this.hands.some(function (h) { return !h.bust && !h.surrendered; });
    if (!playerNatural && !this.dealerHasNatural && live) {
      while (true) {
        const v = handValue(this.dealerHand);
        if (v.total < 17) { this.dealerHand.push(this._draw()); continue; }
        if (v.total === 17 && v.soft && !this.dealerStand17) { this.dealerHand.push(this._draw()); continue; }
        break;
      }
    }
    this.state = "done";
    return this._settle();
  };

  BlackjackTable.prototype._settle = function () {
    const dv = handValue(this.dealerHand);
    let totalPayout = 0;
    this.results = this.hands.map(function (h) {
      const pv = handValue(h.cards);
      let outcome, payout;
      if (h.surrendered) { outcome = "surrender"; payout = Math.floor(h.bet / 2); }
      else if (pv.total > 21) { outcome = "lose"; payout = 0; }
      else {
        const natural = !h.split && h.cards.length === 2 && pv.total === 21;
        if (natural && dv.isBlackjack) { outcome = "push"; payout = h.bet; }
        else if (natural) { outcome = "blackjack"; payout = Math.floor(h.bet * 2.5); }
        else if (dv.isBlackjack) { outcome = "lose"; payout = 0; }
        else if (dv.total > 21) { outcome = "win"; payout = h.bet * 2; }
        else if (pv.total > dv.total) { outcome = "win"; payout = h.bet * 2; }
        else if (pv.total < dv.total) { outcome = "lose"; payout = 0; }
        else { outcome = "push"; payout = h.bet; }
      }
      totalPayout += payout;
      h.result = { outcome: outcome, payout: payout, value: pv };
      return { outcome: outcome, payout: payout, bet: h.bet, cards: h.cards.slice(), value: pv };
    });

    /* Seguro: si el croupier hace blackjack paga 2:1 (devuelve x3) */
    if (this.insuranceBet > 0 && dv.isBlackjack) totalPayout += this.insuranceBet * 3;

    const pv0 = handValue(this.hands[0].cards);
    this.result = {
      type: "result",
      outcome: this.hands.length === 1 ? this.results[0].outcome : "multi",
      payout: totalPayout,
      bet: this.baseBet || this.bet,
      player: pv0,
      dealer: dv,
      playerHand: this.hands[0].cards.slice(),
      dealerHand: this.dealerHand.slice(),
      results: this.results,
      insuranceWon: this.insuranceBet > 0 && dv.isBlackjack
    };
    return this.result;
  };

  AK.handValue = handValue;
  AK.BlackjackTable = BlackjackTable;
})(window);
