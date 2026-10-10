/* ==========================================================================
 * ALL-IN KINGDOM  ·  deck.js
 * Modelo de cartas, palos, rangos y baraja. Espacio de nombres global AK.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  /* Palos. El color real (oro/plata) se resuelve en la capa visual,
   * pero dejamos una pista semántica aqui: "red" => dorado, "black" => plateado. */
  const SUITS = {
    hearts:   { key: "hearts",   symbol: "\u2665", color: "gold",   name: "Corazones" },
    diamonds: { key: "diamonds", symbol: "\u2666", color: "gold",   name: "Diamantes" },
    clubs:    { key: "clubs",    symbol: "\u2663", color: "silver", name: "Treboles" },
    spades:   { key: "spades",   symbol: "\u2660", color: "silver", name: "Picas" }
  };

  const SUIT_KEYS = Object.keys(SUITS);

  /* Rango -> valor numerico. El As vale 14 (y 1 para la escalera A-2-3-4-5). */
  const RANKS = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
  };

  const RANK_KEYS = Object.keys(RANKS);

  let _uid = 0;

  /**
   * Crea una carta.
   * @param {string} rank clave del rango ("A", "K", "10"...)
   * @param {string} suit clave del palo ("hearts"...)
   */
  function makeCard(rank, suit) {
    return {
      id: ++_uid,
      rank: rank,
      suit: suit,
      value: RANKS[rank],
      get symbol() { return SUITS[this.suit].symbol; },
      get color() { return SUITS[this.suit].color; }
    };
  }

  /**
   * Baraja: mazo completo de 52 cartas.
   */
  function Deck() {
    this.cards = [];
    this.build();
  }

  Deck.prototype.build = function () {
    this.cards = [];
    for (const s of SUIT_KEYS) {
      for (const r of RANK_KEYS) {
        this.cards.push(makeCard(r, s));
      }
    }
  };

  /** Mezcla Fisher-Yates. */
  Deck.prototype.shuffle = function () {
    const a = this.cards;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return this;
  };

  /** Roba una carta del tope. */
  Deck.prototype.draw = function () {
    if (this.cards.length === 0) this.build();
    return this.cards.pop();
  };

  /** Roba n cartas. */
  Deck.prototype.drawMany = function (n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(this.draw());
    return out;
  };

  /* Utilidades de nombre legible ------------------------------------------ */
  const RANK_NAMES = {
    "2": "Dos", "3": "Tres", "4": "Cuatro", "5": "Cinco", "6": "Seis",
    "7": "Siete", "8": "Ocho", "9": "Nueve", "10": "Diez", "J": "Jota",
    "Q": "Reina", "K": "Rey", "A": "As"
  };

  function cardName(card) {
    return RANK_NAMES[card.rank] + " de " + SUITS[card.suit].name;
  }

  AK.SUITS = SUITS;
  AK.SUIT_KEYS = SUIT_KEYS;
  AK.RANKS = RANKS;
  AK.RANK_KEYS = RANK_KEYS;
  AK.RANK_NAMES = RANK_NAMES;
  AK.makeCard = makeCard;
  AK.Deck = Deck;
  AK.cardName = cardName;
})(window);
