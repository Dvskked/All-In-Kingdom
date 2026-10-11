/* ==========================================================================
 * ALL-IN KINGDOM  ·  ui.js
 * Cartas, fichas, animaciones, particulas, modales, toasts y guia de manos.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});
  const UI = (AK.UI = {});

  /* ================================================================== *
   *  CARTAS                                                            *
   * ================================================================== */
  UI.createCard = function (card, opts) {
    opts = opts || {};
    const el = document.createElement("div");
    el.className = "card" + (opts.down ? " is-down" : "");
    el.dataset.color = card.color;
    el.dataset.rank = card.rank;
    el.dataset.suit = card.suit;

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.innerHTML =
      '<div class="corner tl"><span class="rk">' + card.rank + '</span><span class="st">' + card.symbol + "</span></div>" +
      '<div class="pip">' + card.symbol + "</div>" +
      '<div class="corner br"><span class="rk">' + card.rank + '</span><span class="st">' + card.symbol + "</span></div>";
    if (["J", "Q", "K", "A"].indexOf(card.rank) >= 0) {
      front.classList.add("face-card");
      front.querySelector(".pip").classList.add("big");
    }

    const back = document.createElement("div");
    back.className = "card-face card-back";

    const inner = document.createElement("div");
    inner.className = "card-inner";
    inner.appendChild(front);
    inner.appendChild(back);
    el.appendChild(inner);

    if (opts.mini) el.classList.add("mini");
    return el;
  };

  UI.flip = function (cardEl, reveal) {
    if (reveal === undefined) reveal = cardEl.classList.contains("is-down");
    if (reveal) cardEl.classList.remove("is-down");
    else cardEl.classList.add("is-down");
  };

  UI.dealCard = function (container, card, opts) {
    opts = opts || {};
    const el = UI.createCard(card, { down: opts.down, mini: opts.mini });
    el.classList.add("dealing");
    container.appendChild(el);
    window.setTimeout(function () { el.classList.remove("dealing"); }, 520);
    return el;
  };

  UI.revealAll = function (container) {
    Array.prototype.forEach.call(container.querySelectorAll(".card.is-down"), function (c) { UI.flip(c, true); });
  };

  UI.clear = function (el) { while (el && el.firstChild) el.removeChild(el.firstChild); };

  /* ================================================================== *
   *  FICHAS                                                            *
   * ================================================================== */
  const CHIP_CLASS = function (d) {
    if (d >= 1000) return "chip-1000";
    if (d >= 500) return "chip-500";
    if (d >= 100) return "chip-100";
    if (d >= 25) return "chip-25";
    if (d >= 5) return "chip-5";
    return "chip-1";
  };

  UI.chipDisc = function (value) {
    const d = document.createElement("span");
    d.className = "chip-disc " + CHIP_CLASS(value);
    return d;
  };

  /** Pila visual de fichas + importe. */
  UI.chipPile = function (amount, opts) {
    opts = opts || {};
    const wrap = document.createElement("div");
    wrap.className = "chip-pile" + (opts.small ? " small" : "");
    const denoms = [1000, 500, 100, 25, 5, 1];
    let rem = amount, count = 0;
    const max = opts.max || 9;
    for (let i = 0; i < denoms.length && count < max; i++) {
      while (rem >= denoms[i] && count < max) {
        wrap.appendChild(UI.chipDisc(denoms[i]));
        rem -= denoms[i]; count++;
      }
    }
    if (count === 0) wrap.appendChild(UI.chipDisc(1));
    const label = document.createElement("span");
    label.className = "chip-amount";
    label.textContent = UI.formatGold(amount);
    wrap.appendChild(label);
    return wrap;
  };

  /* ================================================================== *
   *  PARTICULAS / TOASTS / MODAL                                       *
   * ================================================================== */
  UI.goldBurst = function (x, y, amount) {
    amount = amount || 18;
    const layer = document.getElementById("fx-layer");
    if (!layer) return;
    for (let i = 0; i < amount; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const size = 4 + Math.random() * 8;
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--dx", (Math.random() - 0.5) * 280 + "px");
      p.style.setProperty("--dy", -(60 + Math.random() * 240) + "px");
      p.style.animationDelay = (Math.random() * 0.15) + "s";
      layer.appendChild(p);
      window.setTimeout(function () { p.remove(); }, 1250);
    }
  };

  UI.burstFromCenter = function (amount) { UI.goldBurst(window.innerWidth / 2, window.innerHeight / 2, amount); };
  UI.burstFromEl = function (el, amount) {
    if (!el || typeof el.getBoundingClientRect !== "function") return UI.burstFromCenter(amount);
    const r = el.getBoundingClientRect();
    UI.goldBurst(r.left + r.width / 2, r.top + r.height / 2, amount);
  };

  UI.toast = function (message, type, ms) {
    const box = document.getElementById("toast-box");
    if (!box) return;
    const t = document.createElement("div");
    t.className = "toast" + (type ? " toast-" + type : "");
    t.textContent = message;
    box.appendChild(t);
    window.setTimeout(function () { t.classList.add("show"); }, 10);
    window.setTimeout(function () {
      t.classList.remove("show");
      window.setTimeout(function () { t.remove(); }, 400);
    }, ms || 2600);
  };

  UI.modal = function (cfg) {
    const overlay = document.getElementById("modal-overlay");
    const dialog = document.getElementById("modal-box");
    UI.clear(dialog);

    const title = document.createElement("h2");
    title.className = "modal-title";
    title.textContent = cfg.title || "";
    dialog.appendChild(title);

    if (cfg.html) {
      const body = document.createElement("div");
      body.className = "modal-body";
      body.innerHTML = cfg.html;
      dialog.appendChild(body);
    }

    const actions = document.createElement("div");
    actions.className = "modal-actions";
    (cfg.actions || [{ label: "Cerrar", type: "ghost" }]).forEach(function (a) {
      const b = document.createElement("button");
      b.className = "btn " + (a.type || "primary");
      b.textContent = a.label;
      b.addEventListener("click", function () { close(); if (a.onClick) a.onClick(); });
      actions.appendChild(b);
    });
    dialog.appendChild(actions);
    overlay.classList.add("open");

    function close() { overlay.classList.remove("open"); window.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape" && cfg.dismissible) close(); }
    if (cfg.dismissible) window.addEventListener("keydown", onKey);
    return { close: close };
  };

  UI.closeModal = function () {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.classList.remove("open");
  };

  /* ================================================================== *
   *  GUIA DE MANOS (ranking ilustrado)                                 *
   * ================================================================== */
  const HAND_GUIDE = [
    { es: "Escalera Real", name: "Escalera de Color", rank: 1, tag: "¡La mejor!",
      desc: "Cinco cartas consecutivas del mismo palo. Si empieza en el As, es una Escalera Real.",
      cards: [["A","spades"],["K","spades"],["Q","spades"],["J","spades"],["10","spades"]] },
    { es: "Póquer", name: "Póquer", rank: 2, tag: "Casi imbatible",
      desc: "Cuatro cartas del mismo número.",
      cards: [["9","hearts"],["9","diamonds"],["9","clubs"],["9","spades"],["K","hearts"]] },
    { es: "Full House", name: "Full House", rank: 3, tag: "Casa llena",
      desc: "Un trío más una pareja.",
      cards: [["K","hearts"],["K","clubs"],["K","diamonds"],["7","spades"],["7","hearts"]] },
    { es: "Color", name: "Color", rank: 4, tag: "Mismo palo",
      desc: "Cinco cartas del mismo palo (sin ser consecutivas).",
      cards: [["A","hearts"],["J","hearts"],["8","hearts"],["5","hearts"],["2","hearts"]] },
    { es: "Escalera", name: "Escalera", rank: 5, tag: "Consecutivas",
      desc: "Cinco cartas consecutivas de palos distintos.",
      cards: [["9","hearts"],["8","clubs"],["7","diamonds"],["6","spades"],["5","hearts"]] },
    { es: "Trío", name: "Trío", rank: 6, tag: "Tres iguales",
      desc: "Tres cartas del mismo número.",
      cards: [["Q","hearts"],["Q","clubs"],["Q","spades"],["4","hearts"],["2","clubs"]] },
    { es: "Doble Pareja", name: "Doble Pareja", rank: 7, tag: "Dos pares",
      desc: "Dos parejas de distinto número.",
      cards: [["A","hearts"],["A","spades"],["K","hearts"],["K","spades"],["3","clubs"]] },
    { es: "Pareja", name: "Pareja", rank: 8, tag: "Dos iguales",
      desc: "Dos cartas del mismo número.",
      cards: [["J","hearts"],["J","spades"],["A","clubs"],["8","diamonds"],["3","hearts"]] },
    { es: "Carta Alta", name: "Carta Alta", rank: 9, tag: "Sin combinación",
      desc: "Cuando no tienes ninguna de las anteriores, gana la carta más alta.",
      cards: [["A","spades"],["K","hearts"],["9","clubs"],["6","diamonds"],["3","spades"]] }
  ];

  UI.buildGuide = function (container) {
    UI.clear(container);
    const list = document.createElement("div");
    list.className = "guide-list";
    HAND_GUIDE.forEach(function (h) {
      const row = document.createElement("div");
      row.className = "guide-row";
      const pos = document.createElement("div");
      pos.className = "guide-pos";
      pos.textContent = "#" + h.rank;
      const cardsBox = document.createElement("div");
      cardsBox.className = "guide-cards";
      h.cards.forEach(function (rc) {
        cardsBox.appendChild(UI.createCard(AK.makeCard(rc[0], rc[1]), { mini: true }));
      });
      const info = document.createElement("div");
      info.className = "guide-info";
      info.innerHTML = '<div class="guide-name">' + h.name + ' <span class="guide-tag">' + h.tag + "</span></div>" +
        '<div class="guide-desc">' + h.desc + "</div>";
      row.appendChild(pos);
      row.appendChild(cardsBox);
      row.appendChild(info);
      list.appendChild(row);
    });
    container.appendChild(list);

    const bar = document.createElement("div");
    bar.className = "guide-bar";
    bar.innerHTML = "<span>Más fuerte \u2193</span><span class=\"guide-arrow\">\u2193</span><span>Más débil</span>";
    container.appendChild(bar);
  };

  UI.openGuide = function () {
    UI.modal({
      title: "\uD83D\uDCD6 Guía de manos (de mejor a peor)",
      html: '<div id="guide-mount" class="guide-mount"></div>',
      actions: [{ label: "Entendido", type: "primary" }],
      dismissible: true
    });
    UI.buildGuide(document.getElementById("guide-mount"));
  };

  /* ================================================================== *
   *  GUIA DE BLACKJACK (reglas + estrategia basica)                    *
   * ================================================================== */
  UI.openBlackjackGuide = function () {
    const rows = [
      ["8 o menos", "Pedir siempre", "good"],
      ["9", "Doblar contra 3-6, si no pedir", "mid"],
      ["10", "Doblar contra 2-9, si no pedir", "mid"],
      ["11", "Doblar siempre", "good"],
      ["12", "Pedir; plantarse si croupier tiene 4-6", "mid"],
      ["13-16", "Plantarse si croupier tiene 2-6, si no pedir", "mid"],
      ["17 o más", "Plantarse siempre", "good"],
      ["As + 2/3", "Doblar contra 5-6; si no pedir", "mid"],
      ["As + 4/5", "Doblar contra 4-6; si no pedir", "mid"],
      ["As + 6", "Doblar contra 3-6; si no pedir", "mid"],
      ["As + 7", "Plantarse contra 2/7/8; doblar contra 3-6", "mid"],
      ["As + 8/9", "Plantarse siempre", "good"],
      ["Pareja de Ases", "Dividir siempre (si se permite)", "good"],
      ["Pareja de 8", "Dividir siempre", "good"],
      ["Pareja de 10/As", "No dividir: ya es una gran mano", "good"],
      ["Pareja de 5", "Doblar como si fuera un 10", "mid"],
      ["Pareja de 9", "Dividir contra 2-6 y 8-9; si no plantarse", "mid"]
    ];
    const body = rows.map(function (r) {
      return '<div class="bj-row"><span class="bj-hand">' + r[0] + '</span>' +
        '<span class="bj-act ' + r[2] + '">' + r[1] + "</span></div>";
    }).join("");
    UI.modal({
      title: "\uD83C\uDCCF Guía de Blackjack (estrategia básica)",
      html:
        '<div class="bj-guide">' +
          '<p class="bj-intro">Objetivo: acercarte a <b>21</b> sin pasarte y superar al croupier. ' +
          'El croupier <b>se planta en 17</b>. Un <b>Blackjack natural paga 3:2</b>. Solo puedes <b>doblar con tus 2 primeras cartas</b>.</p>' +
          '<div class="bj-table">' + body + "</div>" +
          '<p class="bj-note">Consejo: si el croupier muestra una carta baja (2-6), no arriesgues; deja que se pase.</p>' +
        "</div>",
      actions: [{ label: "Entendido", type: "primary" }],
      dismissible: true
    });
  };

  /* ================================================================== *
   *  VARIOS                                                            *
   * ================================================================== */
  UI.formatGold = function (n) { return Number(n || 0).toLocaleString("es-ES"); };
  UI.avatarHTML = function (emoji, color) {
    return '<span class="avatar-glyph" style="--accent:' + (color || "#ffd700") + '">' + emoji + "</span>";
  };
  UI.sleep = function (ms) { return new Promise(function (res) { window.setTimeout(res, ms); }); };
})(window);
