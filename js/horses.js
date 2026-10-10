/* ==========================================================================
 * ALL-IN KINGDOM  ·  horses.js
 * Hipodromo: cuotas, simulacion de carrera paso a paso y pagos.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  const HORSE_NAMES = [
    "Rayo Veloz", "Trueno", "Pegaso", "Relámpago", "Tornado", "Vendaval",
    "Cometa", "Sombra", "Fuego", "Mistico", "Chispita", "Ciclón",
    "tifón", "Duque", "Tormenta", "Alazán", "Corsé", "Aurora",
    "Baronesa", "Huracán", "Coyote", "Estrella", "Zafiro", "Libertad"
  ];
  const HORSE_COLORS = ["#e0568b", "#4ea1e0", "#7cab56", "#f5c542", "#b06fce", "#e76f51", "#2f9d7a", "#d98a2c"];

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function pick(arr, n) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = copy[i]; copy[i] = copy[j]; copy[j] = t; }
    return copy.slice(0, n);
  }

  /**
   * @param {object} opts { numHorses, wantPlacePayout }
   */
  function HorseRace(opts) {
    opts = opts || {};
    this.track = 1000;
    this.numHorses = opts.numHorses || 6;
    this.finished = false;
    this.order = [];
    this.tickCount = 0;
    this._build();
  }

  HorseRace.prototype._build = function () {
    const names = pick(HORSE_NAMES, this.numHorses);
    const colors = pick(HORSE_COLORS, this.numHorses);
    const raw = [];
    let sum = 0;
    for (let i = 0; i < this.numHorses; i++) {
      /* Potencia con tendencia ligera hacia un favorito aleatorio */
      const p = 0.55 + Math.random() * 1.1;
      raw.push(p); sum += p;
    }
    this.horses = raw.map(function (p, i) {
      const prob = p / sum;
      const odds = Math.max(1.2, Math.min(30, Math.round((0.85 / prob) * 10) / 10));
      return {
        index: i,
        name: names[i],
        color: colors[i],
        power: p,
        prob: prob,
        odds: odds,
        progress: 0,
        finished: false,
        place: 0
      };
    });
  };

  HorseRace.prototype.step = function () {
    if (this.finished) return this.result();
    this.tickCount++;
    const self = this;
    this.horses.forEach(function (h) {
      if (h.finished) return;
      /* Avance proporcional a la potencia + azar; produce remontadas */
      const inc = h.power * rnd(24, 40);
      h.progress += inc;
      if (h.progress >= self.track) {
        h.progress = self.track;
        h.finished = true;
        h.place = self.order.length + 1;
        self.order.push(h);
      }
    });
    /* Seguro: si nadie ha terminado tras muchisimos ticks, forzamos final */
    if (this.tickCount > 90 && this.order.length === 0) {
      const lead = this.horses.slice().sort(function (a, b) { return b.progress - a.progress; });
      lead.forEach(function (h) { if (!h.finished) { h.finished = true; h.place = self.order.length + 1; self.order.push(h); } });
    }
    if (this.order.length >= this.numHorses) this.finished = true;
    return this.result();
  };

  HorseRace.prototype.result = function () {
    return { finished: this.finished, order: this.order.slice(), leader: this.horses.slice().sort(function (a, b) { return b.progress - a.progress; })[0] };
  };

  /** Fraccion de recorrido 0..1 por caballo (para pintar carriles). */
  HorseRace.prototype.progress = function () {
    const self = this;
    return this.horses.map(function (h) { return h.progress / self.track; });
  };

  /**
   * Pago de una apuesta.
   * @param {number} bet
   * @param {object} horse
   * @param {"win"|"place"} kind
   */
  HorseRace.payout = function (bet, horse, kind) {
    if (!horse) return 0;
    if (kind === "win") return horse.place === 1 ? Math.round(bet * horse.odds) : 0;
    if (kind === "place") return horse.place <= 3 ? Math.round(bet * (1 + (horse.odds - 1) / 4)) : 0;
    return 0;
  };

  AK.HorseRace = HorseRace;
  AK.HORSE_NAMES = HORSE_NAMES;
})(window);
