/* ==========================================================================
 * ALL-IN KINGDOM  ·  blackjack.js
 * Motor de Blackjack (21): Hit, Stand, Double Down y logica del croupier.
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
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }
    if (aces === 0) soft = false;
    return { total: total, soft: soft, isBlackjack: hand.length === 2 && total === 21 };
  }

  /**
   * @param {object} opts { numDecks, dealerStand17, humanName }
   */
  function BlackjackTable(opts) {
    opts = opts || {};
    this.numDecks = opts.numDecks || 6;
    this.dealerStand17 = opts.dealerStand17 !== false;
    this.humanName = opts.humanName || "Tu";
    this.shoe = [];
    this._shuffle(0);
    this.state = "idle"; /* idle | player | dealer | done */
    this.bet = 0;
  }

  BlackjackTable.prototype._shuffle = function (penetrationKeep) {
    let cards = [];
    for (let d = 0; d < this.numDecks; d++) {
      const deck = new AK.Deck();
      cards = cards.concat(deck.cards);
    }
    /* Fisher-Yates */
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = cards[i]; cards[i] = cards[j]; cards[j] = t;
    }
    this.shoe = cards;
  };

  BlackjackTable.prototype._draw = function () {
    /* Rebaraja cuando quedan menos de ~25% de cartas */
    if (this.shoe.length < this.numDecks * 52 * 0.25) this._shuffle();
    return this.shoe.pop();
  };

  /** Inicia una ronda con la apuesta indicada. */
  BlackjackTable.prototype.newRound = function (bet) {
    this.bet = bet;
    this.playerHand = [this._draw(), this._draw()];
    this.dealerHand = [this._draw(), this._draw()];
    this.doubled = false;
    this.result = null;
    this.state = "player";

    const pv = handValue(this.playerHand);
    if (pv.isBlackjack) {
      /* Blackjack natural del jugador: el croupier revela y se resuelve. */
      return this._dealerPlay(true);
    }
    const dv = handValue(this.dealerHand);
    if (dv.isBlackjack) {
      return this._dealerPlay(false);
    }
    return { type: "deal", state: this.state };
  };

  BlackjackTable.prototype.playerValue = function () { return handValue(this.playerHand); };
  BlackjackTable.prototype.dealerValue = function () { return handValue(this.dealerHand); };

  BlackjackTable.prototype.hit = function () {
    if (this.state !== "player") return { type: "invalid" };
    this.playerHand.push(this._draw());
    const v = handValue(this.playerHand);
    if (v.total > 21) {
      this.state = "done";
      return this._settle("bust");
    }
    if (v.total === 21) {
      return this.stand();
    }
    return { type: "hit", state: this.state, value: v };
  };

  BlackjackTable.prototype.canDouble = function () {
    return this.state === "player" && this.playerHand.length === 2;
  };

  BlackjackTable.prototype.double = function () {
    if (!this.canDouble()) return { type: "invalid" };
    this.doubled = true;
    this.bet *= 2;
    this.playerHand.push(this._draw());
    const v = handValue(this.playerHand);
    if (v.total > 21) {
      this.state = "done";
      return this._settle("bust");
    }
    return this._dealerPlay(false);
  };

  BlackjackTable.prototype.stand = function () {
    if (this.state !== "player") return { type: "invalid" };
    return this._dealerPlay(false);
  };

  BlackjackTable.prototype._dealerPlay = function (playerNatural) {
    this.state = "dealer";
    if (!playerNatural) {
      while (true) {
        const v = handValue(this.dealerHand);
        if (v.total < 17) { this.dealerHand.push(this._draw()); continue; }
        if (v.total === 17 && v.soft && !this.dealerStand17) { this.dealerHand.push(this._draw()); continue; }
        break;
      }
    }
    this.state = "done";
    return this._settle("normal", playerNatural);
  };

  BlackjackTable.prototype._settle = function (reason, playerNatural) {
    const pv = handValue(this.playerHand);
    const dv = handValue(this.dealerHand);
    let outcome;    /* "win" | "lose" | "push" | "blackjack" */
    let payout = 0;

    if (reason === "bust") {
      outcome = "lose"; payout = 0;
    } else if (playerNatural) {
      if (dv.isBlackjack) { outcome = "push"; payout = this.bet; }
      else { outcome = "blackjack"; payout = Math.floor(this.bet * 2.5); }
    } else if (dv.isBlackjack) {
      outcome = "lose"; payout = 0;
    } else if (dv.total > 21) {
      outcome = "win"; payout = this.bet * 2;
    } else if (pv.total > dv.total) {
      outcome = "win"; payout = this.bet * 2;
    } else if (pv.total < dv.total) {
      outcome = "lose"; payout = 0;
    } else {
      outcome = "push"; payout = this.bet;
    }

    this.result = {
      type: "result",
      outcome: outcome,
      payout: payout,
      bet: this.bet,
      player: pv,
      dealer: dv,
      playerHand: this.playerHand.slice(),
      dealerHand: this.dealerHand.slice()
    };
    return this.result;
  };

  AK.handValue = handValue;
  AK.BlackjackTable = BlackjackTable;
})(window);
