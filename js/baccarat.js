/* ==========================================================================
 * ALL-IN KINGDOM  ·  baccarat.js
 * Motor de Baccarat (Punto Banco): Punto, Banca o Empate con reglas de
 * tercera carta. Zapato de 6 barajas.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  function cardValue(c) {
    if (c.rank === "A") return 1;
    if (["10", "J", "Q", "K"].indexOf(c.rank) >= 0) return 0;
    return c.value;
  }

  function handTotal(hand) {
    return hand.reduce(function (s, c) { return s + cardValue(c); }, 0) % 10;
  }

  function isNatural(hand) { return hand.length === 2 && (handTotal(hand) === 8 || handTotal(hand) === 9); }

  function BaccaratTable(opts) {
    opts = opts || {};
    this.numDecks = opts.numDecks || 6;
    this.shoe = [];
    this._shuffle();
    this.playerHand = [];
    this.bankerHand = [];
    this.playerTotal = 0;
    this.bankerTotal = 0;
    this.winner = null; /* "player" | "banker" | "tie" */
  }

  BaccaratTable.prototype._shuffle = function () {
    let cards = [];
    for (let d = 0; d < this.numDecks; d++) cards = cards.concat(new AK.Deck().cards);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = cards[i]; cards[i] = cards[j]; cards[j] = t;
    }
    this.shoe = cards;
  };

  BaccaratTable.prototype._draw = function () {
    if (this.shoe.length < this.numDecks * 52 * 0.2) this._shuffle();
    return this.shoe.pop();
  };

  BaccaratTable.prototype.deal = function () {
    this.playerHand = [this._draw(), this._draw()];
    this.bankerHand = [this._draw(), this._draw()];

    let p = handTotal(this.playerHand);
    let b = handTotal(this.bankerHand);

    if (!isNatural(this.playerHand) && !isNatural(this.bankerHand)) {
      let playerThird = null;
      if (p <= 5) { playerThird = this._draw(); this.playerHand.push(playerThird); p = handTotal(this.playerHand); }

      const ptv = playerThird ? cardValue(playerThird) : null;
      let bankerDraws;
      if (playerThird === null) {
        bankerDraws = b <= 5;
      } else if (b <= 2) bankerDraws = true;
      else if (b === 3) bankerDraws = ptv !== 8;
      else if (b === 4) bankerDraws = ptv >= 2 && ptv <= 7;
      else if (b === 5) bankerDraws = ptv >= 4 && ptv <= 7;
      else if (b === 6) bankerDraws = ptv === 6 || ptv === 7;
      else bankerDraws = false;

      if (bankerDraws) { this.bankerHand.push(this._draw()); b = handTotal(this.bankerHand); }
    }

    this.playerTotal = handTotal(this.playerHand);
    this.bankerTotal = handTotal(this.bankerHand);
    this.winner = this.playerTotal > this.bankerTotal ? "player"
      : (this.bankerTotal > this.playerTotal ? "banker" : "tie");

    return {
      player: this.playerHand.slice(), banker: this.bankerHand.slice(),
      playerTotal: this.playerTotal, bankerTotal: this.bankerTotal, winner: this.winner
    };
  };

  /**
   * Pago total devuelto (incluye apuesta) segun la apuesta elegida.
   * Apuesta de Banca paga 0,95:1 (comision de la casa).
   * @param {string} pick "player"|"banker"|"tie"
   */
  BaccaratTable.prototype.payout = function (pick, amount, winner) {
    const w = winner || this.winner;
    if (pick === w) {
      if (pick === "tie") return amount * 9;       /* 8:1 */
      if (pick === "banker") return Math.floor(amount * 1.95);
      return amount * 2;                            /* 1:1 */
    }
    /* Si el resultado es empate y apostaste a punto/banca, se devuelve la apuesta */
    if (w === "tie" && (pick === "player" || pick === "banker")) return amount;
    return 0;
  };

  AK.BaccaratTable = BaccaratTable;
  AK.baccaratHandTotal = handTotal;
})(window);
