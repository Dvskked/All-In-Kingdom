/* ==========================================================================
 * ALL-IN KINGDOM  ·  game.js
 * Controlador: perfil, mapa de ciudades, casinos, mesas de Póker y Blackjack.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = global.AK;
  const UI = AK.UI;
  const C = AK.Characters;

  const $ = function (id) { return document.getElementById(id); };

  const App = {
    state: null,
    city: null, casino: null, tableDef: null,
    mode: null, engine: null, botProfiles: [],
    seats: [],                 /* asientos visuales */
    humanResolve: null, leaving: false,
    painted: { holes: false, community: 0 },
    bj: { bankroll: 0, bet: 0, settled: false, dealerRevealed: false, buyIn: 0 },
    horses: { bankroll: 0, bet: 0, kind: "win", selected: 0, race: null, timer: 0, running: false, buyIn: 0, minBet: 0, maxBet: 0, numHorses: 6 }
  };
  global.AllInApp = App;

  const MUTE_KEY = "allin_kingdom_muted";

  function wireSound() {
    const btn = $("sound-toggle");
    const saved = (function () { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { return false; } })();
    if (AK.Sound) AK.Sound.setMuted(saved);
    function paint() {
      if (!btn || !AK.Sound) return;
      btn.textContent = AK.Sound.isMuted() ? "\uD83D\uDD07" : "\uD83D\uDD0A";
      btn.classList.toggle("muted", AK.Sound.isMuted());
    }
    if (btn) btn.addEventListener("click", function () {
      if (!AK.Sound) return;
      const m = AK.Sound.toggle();
      try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
      paint();
    });
    paint();
  }

  /* ------------------------------------------------------------------ *
   *  NAVEGACION                                                        *
   * ------------------------------------------------------------------ */
  function showScreen(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("active", s.id === id);
    });
  }

  /* ------------------------------------------------------------------ *
   *  INICIALIZACION                                                    *
   * ------------------------------------------------------------------ */
  function init() {
    if (AK.Guard) AK.Guard.install();
    wireSound();
    wireProfile();
    wireMap();
    wireTableHud();
    wireHorses();

    /* Sonido en cualquier boton + desbloqueo de audio */
    document.addEventListener("click", function (e) {
      if (AK.Sound) { AK.Sound.unlock(); if (e.target && e.target.closest && e.target.closest("button")) AK.Sound.play("click"); }
    }, true);

    const saved = AK.loadGame();
    if (saved) { App.state = saved; renderCityMap(); showScreen("screen-city"); }
    else showScreen("screen-profile");
  }

  /* ------------------------------------------------------------------ *
   *  PERFIL                                                            *
   * ------------------------------------------------------------------ */
  let profileSelection = { photo: "", face: null, color: "#f5c542" };

  function portraitHTML(s) {
    if (s && s.photo) return '<img class="hud-face" src="' + s.photo + '" alt="Tu foto"/>';
    const face = (s && s.face) || C.randomFace();
    return '<span class="hud-face svg">' + C.headHTML(face) + "</span>";
  }

  function renderCharPreview() {
    const box = $("char-preview");
    if (!box) return;
    box.innerHTML = C.headHTML(profileSelection.face);
    box.style.setProperty("--accent", profileSelection.color);
  }

  function handlePhotoFile(file) {
    if (!file || file.type.indexOf("image/") !== 0) { UI.toast("Elige una imagen (JPG/PNG).", "error"); return; }
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        const size = 160;
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        profileSelection.photo = canvas.toDataURL("image/jpeg", 0.85);
        $("photo-preview").innerHTML = '<img src="' + profileSelection.photo + '" alt="Tu foto"/>' +
          '<button type="button" class="photo-x" title="Quitar foto">✕</button>';
        $("photo-preview").classList.remove("hidden");
        $("photo-preview").querySelector(".photo-x").addEventListener("click", clearPhoto);
        UI.toast("Foto de perfil lista.", "info");
      };
      img.onerror = function () { UI.toast("No se pudo leer la imagen.", "error"); };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    profileSelection.photo = "";
    $("photo-preview").classList.add("hidden");
    $("photo-preview").innerHTML = "";
    $("input-photo").value = "";
  }

  function wireProfile() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-gold]"), function (btn) {
      btn.addEventListener("click", function () {
        $("gold-input").value = btn.dataset.gold;
        Array.prototype.forEach.call(document.querySelectorAll("[data-gold]"), function (x) { x.classList.toggle("selected", x === btn); });
      });
    });
    $("input-photo").addEventListener("change", function () { handlePhotoFile(this.files && this.files[0]); });
    $("btn-char-reroll").addEventListener("click", function () {
      profileSelection.face = C.randomFace();
      profileSelection.color = pickAccent();
      renderCharPreview();
      UI.toast("¡Nuevo personaje generado!", "info");
    });
    $("btn-start").addEventListener("click", createPlayer);
    renderCharPreview();
  }

  function pickAccent() {
    const list = C.FACE_PALETTES.accents;
    return list[Math.floor(Math.random() * list.length)];
  }

  function createPlayer() {
    const name = ($("input-name").value || "").trim();
    const age = parseInt($("input-age").value, 10);
    let gold = parseInt($("gold-input").value, 10);
    if (name.length < 2) { UI.toast("Escribe un nombre de al menos 2 letras.", "error"); return; }
    if (!age || age < 18) { UI.toast("Debes ser mayor de 18 años para jugar.", "error"); return; }
    if (!gold || gold < 100) gold = 100;
    if (gold > 100000) gold = 100000;

    const s = AK.defaultPlayer();
    s.name = name; s.age = age;
    s.photo = profileSelection.photo;
    s.face = profileSelection.face;
    s.color = profileSelection.color;
    s.gold = gold;
    App.state = s; AK.saveGame(s);
    renderCityMap(); showScreen("screen-city");
    UI.toast("¡Bienvenido a All-In Kingdom, " + name + "!", "gold", 3200);
  }

  /* ------------------------------------------------------------------ *
   *  MAPA DE CIUDADES                                                  *
   * ------------------------------------------------------------------ */
  function wireMap() {
    $("btn-reset").addEventListener("click", function () {
      UI.modal({
        title: "Reiniciar aventura",
        html: "<p>Se borrará todo tu progreso y oro. Esta acción no se puede deshacer.</p>",
        dismissible: true,
        actions: [
          { label: "Cancelar", type: "ghost" },
          { label: "Sí, reiniciar", type: "danger", onClick: function () { AK.clearSave(); App.state = null; showScreen("screen-profile"); } }
        ]
      });
    });
    $("btn-city-guide").addEventListener("click", UI.openGuide);
  }

  function renderCityMap() {
    const s = App.state;
    const hud = $("hud-avatar");
    hud.classList.toggle("has-photo", !!s.photo);
    hud.style.setProperty("--accent", s.color);
    hud.innerHTML = portraitHTML(s);
    $("hud-player-name").textContent = s.name;
    $("hud-gold").textContent = UI.formatGold(s.gold);
    $("hud-rep").textContent = s.tablesWon;

    const wrap = $("city-list");
    UI.clear(wrap);

    AK.CITIES.forEach(function (city) {
      const unlocked = AK.isCityUnlocked(s, city);
      const current = s.city === city.id;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "city-card" + (unlocked ? " unlocked" : " locked") + (current ? " current" : "");
      card.style.setProperty("--sky1", city.sky[0]);
      card.style.setProperty("--sky2", city.sky[1]);
      card.style.setProperty("--sky3", city.sky[2]);
      card.style.setProperty("--ground", city.ground);
      card.style.setProperty("--accent", city.accent);
      card.disabled = !unlocked;

      const need = city.unlockGold;
      card.innerHTML =
        '<div class="city-sky"></div>' +
        '<div class="city-silhouette"></div>' +
        '<div class="city-ground"></div>' +
        '<div class="city-content">' +
          '<div class="city-flag">' + city.flag + "</div>" +
          '<div class="city-name">' + city.name + "</div>" +
          '<div class="city-country">' + city.country + "</div>" +
          '<div class="city-tagline">' + city.tagline + "</div>" +
          '<div class="city-foot">' +
            (current ? '<span class="city-badge here">\uD83D\uDCCD Estás aquí</span>' : "") +
            (unlocked ? '<span class="city-go">' + (current ? "Ir al casino \u2192" : "Viajar aquí \u2192") + "</span>"
                      : '<span class="city-lock">\uD83D\uDD12 Necesitas ' + UI.formatGold(need) + " \uD83E\uDE99</span>") +
          "</div>" +
        "</div>";

      card.addEventListener("click", function () { enterCity(city.id); });
      wrap.appendChild(card);
    });
  }

  function enterCity(cityId) {
    const s = App.state;
    const city = AK.cityById(cityId);
    if (!AK.isCityUnlocked(s, city)) { UI.toast("Aún no puedes viajar aquí.", "error"); return; }
    s.city = city.id;
    if (s.visited.indexOf(city.id) < 0) s.visited.push(city.id);
    s.stats.bestCity = city.name;
    AK.saveGame(s);
    renderCasino(city);
    showScreen("screen-casino");
  }

  /* ------------------------------------------------------------------ *
   *  CASINO (seleccion de mesa)                                        *
   * ------------------------------------------------------------------ */
  function renderCasino(city) {
    App.city = city;
    $("casino-city").textContent = city.flag + " " + city.name;
    $("casino-gold").textContent = UI.formatGold(App.state.gold);
    $("casino-bg").style.background =
      "linear-gradient(180deg," + city.sky[0] + "," + city.sky[1] + " 45%," + city.sky[2] + ")";

    const wrap = $("casino-body");
    UI.clear(wrap);

    city.casinos.forEach(function (cas) {
      const sec = document.createElement("section");
      sec.className = "casino-sec";
      sec.innerHTML = '<h3 class="casino-name">\uD83C\uDFB0 ' + cas.name + '</h3><p class="casino-desc">' + cas.desc + "</p>";
      const grid = document.createElement("div");
      grid.className = "table-grid";

      cas.tables.forEach(function (t) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "table-card " + t.game;
        const isPoker = t.game === "poker";
        const isHp = t.game === "horses";
        const affordable = App.state.gold >= t.buyIn;
        let icon, stats;
        if (isPoker) {
          icon = "\u2660\u2665";
          stats = "<span>\uD83D\uDC65 " + t.seats + " jugadores</span><span>\uD83D\uDD3A Ciegas " + UI.formatGold(t.smallBlind) + "/" + UI.formatGold(t.bigBlind) + "</span>";
        } else if (isHp) {
          icon = "\uD83D\uDC0E";
          stats = "<span>\uD83C\uDFC1 " + (t.numHorses || 6) + " caballos</span><span>\uD83D\uDCB0 Apuesta " + UI.formatGold(t.minBet) + "–" + UI.formatGold(t.maxBet) + "</span>";
        } else {
          icon = "\uD83C\uDCCF";
          stats = "<span>\uD83D\uDCB0 Apuesta " + UI.formatGold(t.minBet) + "–" + UI.formatGold(t.maxBet) + "</span>";
        }
        card.innerHTML =
          '<div class="table-icon">' + icon + "</div>" +
          '<div class="table-name">' + t.name + "</div>" +
          '<div class="table-desc">' + t.desc + "</div>" +
          '<div class="table-stats">' +
            stats +
            "<span>\uD83C\uDF9F Entrada " + UI.formatGold(t.buyIn) + " \uD83E\uDE99</span>" +
          "</div>" +
          '<div class="table-cta">' + (affordable ? (isHp ? "Apostar \u2192" : "Sentarse \u2192") : "\uD83D\uDD12 Falta oro") + "</div>";
        if (!affordable) card.classList.add("locked");
        card.addEventListener("click", function () {
          if (App.state.gold < t.buyIn) {
            UI.toast("Necesitas al menos " + UI.formatGold(t.buyIn) + " de oro para entrar.", "error");
            return;
          }
          startTable(city, cas, t);
        });
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  function backToCasino() {
    if (App.city) { renderCasino(App.city); showScreen("screen-casino"); }
    else { renderCityMap(); showScreen("screen-city"); }
  }

  /* ------------------------------------------------------------------ *
   *  CONSTRUCCION DE LA MESA (asientos)                                *
   * ------------------------------------------------------------------ */
  function makeBtn(label, type, onClick) {
    const b = document.createElement("button");
    b.className = "btn " + (type || "primary");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  }

  /**
   * Construye la mesa. seatSpecs: [{name,title,face,color,skin,isHuman,stack,photo}]
   * Disposicion robusta de 3 filas: rivales arriba, centro (bote+board) en medio,
   * jugador humano abajo. Asi las cartas nunca tapan el centro ni se salen.
   */
  function buildFelt(seatSpecs) {
    const felt = $("felt");
    UI.clear(felt);
    App.seats = [];

    const oppRow = document.createElement("div");
    oppRow.className = "felt-opponents";
    const youRow = document.createElement("div");
    youRow.className = "felt-you";

    const center = document.createElement("div");
    center.className = "felt-center";
    center.innerHTML =
      '<div id="pot-label" class="pot-label"></div>' +
      '<div id="board-cards" class="hand board-hand"></div>' +
      '<div id="hand-name" class="hand-name"></div>' +
      '<div id="pot-chips" class="pot-chips"></div>';

    felt.appendChild(oppRow);
    felt.appendChild(center);
    felt.appendChild(youRow);

    seatSpecs.forEach(function (spec, i) {
      const el = document.createElement("div");
      el.className = "seat" + (spec.isHuman ? " seat-you" : " seat-opp");

      const charEl = C.create({ face: spec.face, color: spec.color, skin: spec.skin, size: spec.isHuman ? "big" : "" });
      const cardsEl = document.createElement("div");
      cardsEl.className = "hand seat-hand";
      const plate = document.createElement("div");
      plate.className = "seat-plate";
      plate.innerHTML =
        (spec.photo ? '<img class="seat-photo" src="' + spec.photo + '" alt="' + spec.name + '"/>' : "") +
        '<span class="seat-name">' + spec.name + "</span>" +
        (spec.title ? '<span class="seat-title">' + spec.title + "</span>" : "") +
        '<span class="seat-stack"></span>';
      const chipsEl = document.createElement("div");
      chipsEl.className = "seat-chips";
      const actionEl = document.createElement("div");
      actionEl.className = "seat-action";
      const betEl = document.createElement("div");
      betEl.className = "seat-bet";

      /* Orden normal: cara, placa, fichas, cartas, accion, apuesta.
         En .seat-you el CSS usa column-reverse: la cara queda abajo y las
         cartas por encima apuntando al centro. */
      el.appendChild(charEl);
      el.appendChild(plate);
      el.appendChild(chipsEl);
      el.appendChild(cardsEl);
      el.appendChild(actionEl);
      el.appendChild(betEl);

      App.seats[i] = {
        el: el, charEl: charEl, cardsEl: cardsEl, plate: plate, chipsEl: chipsEl,
        stackEl: plate.querySelector(".seat-stack"),
        actionEl: actionEl, betEl: betEl, dealt: false
      };

      if (spec.isHuman) youRow.appendChild(el);
      else oppRow.appendChild(el);
    });
  }

  function renderSeatChips(s, value) {
    if (typeof value !== "number" || value <= 0) { UI.clear(s.chipsEl); return; }
    const d = [1000, 500, 100, 25, 5, 1].find(function (x) { return value >= x; }) || 1;
    const count = Math.max(1, Math.min(12, Math.round(value / d)));
    UI.clear(s.chipsEl);
    for (let i = 0; i < count; i++) s.chipsEl.appendChild(UI.chipDisc(d));
  }

  function setStack(seatIdx, value, dim) {
    const s = App.seats[seatIdx]; if (!s) return;
    if (typeof value === "number") s.stackEl.textContent = UI.formatGold(value);
    else s.stackEl.textContent = value;
    s.el.classList.toggle("dead", !!dim);
    renderSeatChips(s, value);
  }

  function updateHudGold() {
    const g = $("hud-gold-table"); if (g) g.textContent = UI.formatGold(App.state.gold);
  }

  function seatActive(seatIdx, active) {
    App.seats.forEach(function (s, i) {
      if (!s) return;
      s.el.classList.toggle("is-turn", i === seatIdx && active);
      C.setActive(s.charEl, i === seatIdx && active);
    });
  }

  function showAction(seatIdx, text) {
    const s = App.seats[seatIdx]; if (!s) return;
    s.actionEl.textContent = text || "";
    s.actionEl.classList.toggle("show", !!text);
  }

  function showBet(seatIdx, amount) {
    const s = App.seats[seatIdx]; if (!s) return;
    UI.clear(s.betEl);
    if (amount > 0) s.betEl.appendChild(UI.chipPile(amount, { small: true, max: 6 }));
  }

  /* ------------------------------------------------------------------ *
   *  TEXAS HOLD'EM MULTIJUGADOR                                        *
   * ------------------------------------------------------------------ */
  function startTable(city, casino, t) {
    App.city = city; App.casino = casino; App.tableDef = t;
    App.state.gold -= t.buyIn;
    AK.saveGame(App.state);
    if (t.game === "poker") startPoker(t);
    else if (t.game === "blackjack") startBlackjack(t);
    else if (t.game === "horses") startHorses(t);
  }

  function applyTableTheme(theme) {
    const f = $("felt"); if (!f) return;
    theme = theme || {};
    f.style.setProperty("--felt", theme.felt || "#0e3d2f");
    f.style.setProperty("--felt-2", theme.felt2 || "#0a2c22");
    f.style.setProperty("--felt-edge", theme.edge || "#061a13");
    f.style.setProperty("--rail", theme.rail || "#4a2f16");
    f.style.setProperty("--mark", '"' + (theme.mark || "\u2660") + '"');
    f.style.setProperty("--mark-color", theme.markColor || "rgba(235,240,250,.05)");
  }

  function startPoker(t) {
    App.mode = "poker"; App.leaving = false;
    const botCount = t.seats - 1;
    const bots = AK.pickBots(App.city.tier, botCount);

    const specs = [playerSeatSpec(t.buyIn)]
      .concat(bots.map(function (b) { return { name: b.name, title: b.title, face: b.face, color: b.color, skin: b.skin, isHuman: false, stack: t.buyIn, profile: b.profile, quips: b.quips, charId: b.charId }; }));

    App.engine = new AK.PokerTable({
      players: specs.map(function (s) {
        return { name: s.name, stack: s.stack, isHuman: s.isHuman, profile: s.profile, quips: s.quips, charId: s.charId, face: s.face, color: s.color, skin: s.skin };
      }),
      smallBlind: t.smallBlind, bigBlind: t.bigBlind
    });

    $("hud-level").textContent = t.name + " · " + App.city.name;
    applyTableTheme(App.city.theme);
    buildFelt(specs);
    updateHudGold();
    (specs).forEach(function (s, i) { setStack(i, s.stack); });
    $("controls").className = "controls";
    showScreen("screen-table");
    if (AK.Sound) AK.Sound.play("chip");
    UI.toast("Te sientas con " + UI.formatGold(t.buyIn) + " · Ciegas " + t.smallBlind + "/" + t.bigBlind, "info", 3000);
    playNextHand();
  }

  function playerSeatSpec(stack) {
    const s = App.state;
    return { name: s.name, title: "Tú", face: s.face, color: s.color, skin: (s.face && s.face.skin) || "#e3b184", isHuman: true, stack: stack, photo: s.photo };
  }

  function clearBoardCards() {
    const b = $("board-cards"); if (b) UI.clear(b);
    App.seats.forEach(function (s) { if (s) { UI.clear(s.cardsEl); s.dealt = false; } });
    App.painted = { holes: false, community: 0 };
    $("pot-chips") && UI.clear($("pot-chips"));
  }

  async function playNextHand() {
    if (App.mode !== "poker" || App.leaving) return;

    /* Ciegas suben cada 8 manos */
    if (App.engine.handNumber > 0 && App.engine.handNumber % 8 === 0) {
      App.engine.smallBlind *= 2; App.engine.bigBlind *= 2;
      UI.toast("Las ciegas suben a " + App.engine.smallBlind + "/" + App.engine.bigBlind, "warn", 2400);
    }

    const ok = App.engine.newHand();
    if (!ok) { finishPokerTable(false); return; }

    clearBoardCards();
    $("hand-name").textContent = "";
    paintPoker();
    /* Reparte cartas con ritmo */
    await dealHoles();
    await UI.sleep(350);

    const ev = await playBettingRound();
    await afterHand(ev);
  }

  async function dealHoles() {
    const order = [];
    App.engine.players.forEach(function (p, i) { if (!p.folded && p.hole.length) order.push(i); });
    for (let round = 0; round < 2; round++) {
      for (let oi = 0; oi < order.length; oi++) {
        const i = order[oi];
        const p = App.engine.players[i];
        const down = !p.isHuman;
        UI.dealCard(App.seats[i].cardsEl, p.hole[round], { down: down });
        App.seats[i].dealt = true;
        if (AK.Sound) AK.Sound.play("deal");
      }
      await UI.sleep(130);
    }
  }

  function playBettingRound() {
    return new Promise(function (resolve) {
      let guard = 0;
      function step() {
        if (++guard > 200) { resolve({ type: "abort" }); return; }
        if (App.mode !== "poker" || App.leaving) { resolve({ type: "abort" }); return; }

        /* Salta jugadores que no pueden actuar */
        const ev0 = App.engine.advanceIfNeeded();
        if (ev0 && isHandEnd(ev0)) { paintPoker(); resolve(ev0); return; }
        if (ev0 && ev0.type === "phase") { paintPoker(); }

        const p = App.engine.currentPlayer();
        if (!p) { resolve({ type: "abort" }); return; }

        if (p.isHuman) {
          seatActive(p.seat, true);
          waitHuman().then(function (choice) {
            seatActive(-1, false);
            if (choice.type === "abort") { resolve({ type: "abort" }); return; }
            const ev = App.engine.act(choice.type, choice.amount);
            showAction(p.seat, actionLabel(choice.type));
            paintPoker();
            if (isHandEnd(ev)) resolve(ev); else step();
          });
        } else {
          seatActive(p.seat, true);
          C.react(App.seats[p.seat].charEl, "thinking", 1600);
          const delay = 750 + Math.random() * 900;
          window.setTimeout(function () {
            seatActive(-1, false);
            const choice = AK.decideAction(App.engine, AK.AI_PROFILES[p.profile] || AK.AI_PROFILES.medio);
            const ev = App.engine.act(choice.type, choice.amount);
            botReact(p, choice);
            showAction(p.seat, actionLabel(choice.type) + (choice.type === "raise" || choice.type === "allin" ? " " + UI.formatGold(choice.amount > 0 ? choice.amount : 0) : ""));
            paintPoker();
            if (isHandEnd(ev)) resolve(ev); else step();
          }, delay);
        }
      }
      step();
    });
  }

  function actionLabel(type) {
    return { fold: "Se retira", check: "Pasa", call: "Iguala", raise: "Sube a", allin: "¡ALL-IN!" }[type] || "";
  }

  function botReact(p, choice) {
    const charEl = App.seats[p.seat].charEl;
    if (choice.type === "raise") { C.react(charEl, "bet", 1200); if (AK.Sound) AK.Sound.play("chip"); }
    else if (choice.type === "allin") { C.react(charEl, "allin", 1600); if (AK.Sound) AK.Sound.play("allin"); if (Math.random() < 0.6) C.say(charEl, C.quip(p.quips, "allin")); }
    else if (choice.type === "call") C.react(charEl, "call", 900);
    else if (choice.type === "fold") { C.react(charEl, "fold", 1100); if (AK.Sound) AK.Sound.play("fold"); }
    else C.react(charEl, "call", 700);
    if ((choice.type === "raise" || choice.type === "call") && Math.random() < 0.16) C.say(charEl, C.quip(p.quips, "bet"));
  }

  function isHandEnd(ev) { return ev && (ev.type === "foldwin" || ev.type === "showdown"); }

  function waitHuman() {
    return new Promise(function (resolve) {
      App.humanResolve = function (choice) { App.humanResolve = null; resolve(choice); };
      renderActions();
    });
  }

  function clickAction(choice) {
    const r = App.humanResolve; App.humanResolve = null;
    if (AK.Sound) {
      if (choice.type === "allin") AK.Sound.play("allin");
      else if (choice.type === "raise" || choice.type === "call") AK.Sound.play("chip");
      else if (choice.type === "fold") AK.Sound.play("fold");
      else AK.Sound.play("check");
    }
    UI.clear($("controls"));
    if (r) r(choice);
  }

  function renderActions() {
    const box = $("controls");
    UI.clear(box);
    box.className = "controls";

    const acts = App.engine.availableActions();
    const map = {}; acts.forEach(function (a) { map[a.type] = a; });
    const p = App.engine.currentPlayer();
    const toCall = Math.max(0, App.engine.currentBet - p.betThisRound);

    if (map.check) box.appendChild(makeBtn("Pasar", "ghost", function () { clickAction({ type: "check" }); }));
    if (map.call) box.appendChild(makeBtn((toCall >= p.stack ? "Igualar todo " : "Igualar ") + UI.formatGold(map.call.amount), "primary", function () { clickAction({ type: "call" }); }));

    if (map.raise) {
      const wrap = document.createElement("div");
      wrap.className = "raise-control";
      const min = map.raise.min, max = map.raise.max;
      const range = document.createElement("input");
      range.type = "range"; range.min = min; range.max = max; range.step = App.engine.smallBlind;
      range.value = min;
      const label = document.createElement("span");
      label.className = "raise-value";
      label.textContent = UI.formatGold(min);
      range.addEventListener("input", function () { label.textContent = UI.formatGold(range.value); });
      wrap.appendChild(makeBtn("Subir", "gold", function () { clickAction({ type: "raise", amount: Number(range.value) }); }));
      wrap.appendChild(range); wrap.appendChild(label);
      box.appendChild(wrap);
    }
    if (map.allin) box.appendChild(makeBtn("ALL-IN", "danger", function () { clickAction({ type: "allin" }); }));
    if (map.fold) box.appendChild(makeBtn("Retirarse", "ghost", function () { clickAction({ type: "fold" }); }));

    box.appendChild(makeBtn("\uD83D\uDCD6 Guía", "ghost", UI.openGuide));
    box.appendChild(makeBtn("\uD83D\uDEAA Salir", "ghost", onLeaveClick));
  }

  function paintPoker() {
    const en = App.engine;

    /* Stacks y estado */
    en.players.forEach(function (p) {
      setStack(p.seat, p.stack, p.stack <= 0 || p.folded);
      if (p.stack <= 0) showAction(p.seat, "Eliminado");
      else if (p.folded) showAction(p.seat, "Se retira");
      showBet(p.seat, p.betThisRound);
    });

    $("pot-label").textContent = "Bote " + UI.formatGold(en.pot);
    const pc = $("pot-chips"); if (pc) { UI.clear(pc); if (en.pot > 0) pc.appendChild(UI.chipPile(en.pot, { max: 10 })); }

    /* Board */
    const board = $("board-cards");
    while (App.painted.community < en.community.length) {
      (function (c) {
        const el = UI.createCard(c, { down: true });
        el.classList.add("dealing"); board.appendChild(el);
        window.setTimeout(function () { el.classList.remove("dealing"); }, 520);
        window.setTimeout(function () { UI.flip(el, true); }, 260);
      })(en.community[App.painted.community]);
      App.painted.community++;
    }

    /* Nombre de la mano del jugador */
    const you = en.players[0];
    if (en.community.length >= 3 && you.hole.length === 2) {
      try { $("hand-name").textContent = "Tu mano: " + AK.bestHand(you.hole.concat(en.community)).name; }
      catch (e) {}
    }
  }

  async function afterHand(ev) {
    const en = App.engine;
    if (App.leaving || ev.type === "abort") { cashOutPoker("Te retiras de la mesa."); return; }

    if (ev.type === "showdown") {
      /* Revela todas las cartas vivas */
      en.players.forEach(function (p) {
        if (!p.folded && p.hole.length) {
          UI.revealAll(App.seats[p.seat].cardsEl);
          p.revealed = true;
        }
      });
      /* Etiquetas de mano */
      Object.keys(ev.handsBySeat).forEach(function (seat) {
        showAction(Number(seat), ev.handsBySeat[seat].name);
      });
      await UI.sleep(600);

      /* Ganadores */
      const winners = Object.keys(ev.winnings).map(Number);
      winners.forEach(function (seat) {
        App.seats[seat].el.classList.add("winner");
        UI.burstFromEl(App.seats[seat].el, 22);
        const p = en.players[seat];
        C.react(App.seats[seat].charEl, "win", 1500);
        if (!p.isHuman) C.say(App.seats[seat].charEl, C.quip(p.quips, "win"));
        const amt = ev.winnings[seat];
        UI.toast(p.name + " gana " + UI.formatGold(amt) + " con " + ev.handsBySeat[seat].name, p.isHuman ? "win" : "info", 2600);
        showAction(seat, "+" + UI.formatGold(amt));
      });
      const youWon = winners.indexOf(0) >= 0;
      if (youWon) { UI.burstFromCenter(30); App.state.stats.handsWon++; App.state.stats.biggestPot = Math.max(App.state.stats.biggestPot, ev.winnings[0]); if (AK.Sound) AK.Sound.play(ev.winnings[0] >= App.tableDef.bigBlind * 10 ? "bigwin" : "win"); }
      else {
        if (AK.Sound) AK.Sound.play("lose");
        /* Reacciones de pena en los perdedores */
        en.players.forEach(function (p) {
          if (!p.folded && winners.indexOf(p.seat) < 0) {
            C.react(App.seats[p.seat].charEl, "lose", 1400);
            if (!p.isHuman && Math.random() < 0.6) C.say(App.seats[p.seat].charEl, C.quip(p.quips, "lose"));
          }
        });
      }
      App.state.stats.handsPlayed++;
      AK.saveGame(App.state);
    } else if (ev.type === "foldwin") {
      const w = ev.winner;
      App.seats[w.seat].el.classList.add("winner");
      UI.burstFromEl(App.seats[w.seat].el, 16);
      C.react(App.seats[w.seat].charEl, "win", 1300);
      UI.toast(w.name + " gana " + UI.formatGold(ev.pot) + " (todos se retiraron).", w.isHuman ? "win" : "info", 2400);
      showAction(w.seat, "+" + UI.formatGold(ev.pot));
      if (w.isHuman) App.state.stats.handsWon++;
      App.state.stats.handsPlayed++;
      AK.saveGame(App.state);
    }

    await UI.sleep(700);
    App.seats.forEach(function (s) { s.el.classList.remove("winner"); });

    /* ¿Fin de mesa? */
    const you = en.players[0];
    const botsAlive = en.players.filter(function (p) { return !p.isHuman && p.stack > 0; }).length;
    if (you.stack <= 0) { finishPokerTable(false); return; }
    if (botsAlive === 0) { finishPokerTable(true); return; }

    paintPoker();
    await UI.sleep(1100);
    playNextHand();
  }

  function cashOutPoker(message) {
    const you = App.engine.players[0];
    App.state.gold += you.stack;
    const profit = you.stack - App.tableDef.buyIn;
    if (profit > 0) App.state.tablesWon++;
    AK.saveGame(App.state);
    App.mode = null;
    UI.toast(message + " Cobras " + UI.formatGold(you.stack) + " de oro.", "info", 2800);
    showTableResult(profit, you.stack, false);
  }

  function finishPokerTable(conquered) {
    const you = App.engine.players[0];
    const cash = you.stack;
    App.state.gold += cash;
    const profit = cash - App.tableDef.buyIn;
    let bonus = 0;
    if (conquered) {
      bonus = Math.round(App.tableDef.buyIn * 0.5);
      App.state.gold += bonus;
      App.state.tablesWon++;
    } else if (profit > 0) {
      App.state.tablesWon++;
    }
    AK.saveGame(App.state);
    App.mode = null;
    showTableResult(profit, cash, conquered, bonus);
  }

  function showTableResult(profit, cash, conquered, bonus) {
    const won = profit > 0 || conquered;
    if (won) UI.burstFromCenter(36);
    UI.modal({
      title: conquered ? "\uD83D\uDC51 ¡Mesa conquistada!" : (won ? "\uD83C\uDFC6 Buena partida" : "Te retiras"),
      html:
        (conquered ? '<p class="result-line">¡Has desplumado a todos los rivales de la mesa!</p>' : "") +
        '<div class="level-stakes">' +
          "<span>Traes: <b>" + UI.formatGold(cash) + " \uD83E\uDE99</b></span>" +
          "<span>Entrada: <b>" + UI.formatGold(App.tableDef.buyIn) + " \uD83E\uDE99</b></span>" +
          "<span>Balance: <b style='color:" + (profit >= 0 ? "#4ade80" : "#f87171") + "'>" + (profit >= 0 ? "+" : "") + UI.formatGold(profit) + " \uD83E\uDE99</b></span>" +
          (bonus ? "<span>Prima: <b>+" + UI.formatGold(bonus) + " \uD83E\uDE99</b></span>" : "") +
        "</div>" +
        '<p class="piggy">Oro total: <b>' + UI.formatGold(App.state.gold) + " \uD83E\uDE99</b> · Mesas ganadas: <b>" + App.state.tablesWon + "</b></p>",
      actions: [
        { label: "Otra mesa", type: "gold", onClick: backToCasino },
        { label: "Ir al mapa", type: "primary", onClick: function () { renderCityMap(); showScreen("screen-city"); } }
      ]
    });
  }

  /* ------------------------------------------------------------------ *
   *  BLACKJACK                                                         *
   * ------------------------------------------------------------------ */
  function startBlackjack(t) {
    App.mode = "blackjack"; App.leaving = false;
    App.bj = { bankroll: t.buyIn, bet: Math.min(t.minBet * 2, t.buyIn), settled: false, dealerRevealed: false, buyIn: t.buyIn, minBet: t.minBet, maxBet: t.maxBet };
    App.engine = new AK.BlackjackTable({ numDecks: 6, dealerStand17: true, humanName: App.state.name });

    const specs = [
      playerSeatSpec(App.bj.bankroll),
      { name: "Croupier", title: "La Casa", face: DEALER_FACE, color: "#c0c0c0", skin: DEALER_FACE.skin, isHuman: false, stack: 0 }
    ];
    $("hud-level").textContent = t.name + " · " + App.city.name;
    applyTableTheme(App.city.theme);
    buildFelt(specs);
    $("controls").className = "controls";
    showScreen("screen-table");
    updateHudGold();
    if (AK.Sound) AK.Sound.play("chip");
    setStack(0, App.bj.bankroll);
    setStack(1, 0);
    UI.toast("Banca de " + UI.formatGold(t.buyIn) + " · Apuesta " + UI.formatGold(t.minBet) + "–" + UI.formatGold(t.maxBet), "info", 3200);
    renderBjBet();
  }

  const DEALER_FACE = { skin: "#e6bb8b", hair: "bun", hairColor: "#d8d2c8", eyes: "#3a548a", mouth: "smirk", brow: "soft", facial: "none", acc: "earring" };

  function renderBjBet() {
    paintBjValues();
    $("pot-label").textContent = "Banca " + UI.formatGold(App.bj.bankroll);
    $("hand-name").textContent = "Apuesta mín " + UI.formatGold(App.bj.minBet);
    const box = $("controls"); UI.clear(box); box.className = "controls";

    const chips = document.createElement("div");
    chips.className = "chip-row";
    [1, 5, 25, 100, 500].forEach(function (mult) {
      const v = App.bj.minBet * mult;
      if (v > App.bj.bankroll) return;
      chips.appendChild(makeBtn("+" + UI.formatGold(v), "chip", function () {
        App.bj.bet = Math.min(App.bj.maxBet, Math.min(App.bj.bankroll, App.bj.bet + v));
        range.value = App.bj.bet; label.textContent = UI.formatGold(App.bj.bet);
      }));
    });
    box.appendChild(chips);

    const wrap = document.createElement("div");
    wrap.className = "raise-control";
    const range = document.createElement("input");
    range.type = "range";
    range.min = App.bj.minBet; range.max = Math.min(App.bj.maxBet, App.bj.bankroll);
    range.step = App.bj.minBet;
    range.value = Math.min(App.bj.bet, range.max);
    const label = document.createElement("span");
    label.className = "raise-value"; label.textContent = UI.formatGold(range.value);
    App.bj.bet = Number(range.value);
    range.addEventListener("input", function () { App.bj.bet = Number(range.value); label.textContent = UI.formatGold(range.value); });
    wrap.appendChild(range); wrap.appendChild(label);
    box.appendChild(wrap);

    const row = document.createElement("div");
    row.className = "btn-row";
    row.appendChild(makeBtn("Repartir", "primary", dealBlackjack));
    row.appendChild(makeBtn("Cobrar y salir", "ghost", function () { cashOutBlackjack(); }));
    row.appendChild(makeBtn("\uD83C\uDCCF Guía", "ghost", UI.openBlackjackGuide));
    box.appendChild(row);
  }

  function paintBjValues() {
    if (!App.engine.playerHand) return;
    const pv = App.engine.playerValue(), dv = App.engine.dealerValue();
    showAction(0, "Mano: " + pv.total);
    showAction(1, "Dealer: " + (App.bj.dealerRevealed ? dv.total : "?"));
  }

  function clearBjCards() {
    UI.clear(App.seats[0].cardsEl); UI.clear(App.seats[1].cardsEl);
    UI.clear($("board-cards"));
  }

  function dealBlackjack() {
    if (App.bj.bet < App.bj.minBet || App.bj.bet > App.bj.bankroll) { UI.toast("Apuesta no válida.", "error"); return; }
    App.bj.bankroll -= App.bj.bet;
    App.bj.settled = false; App.bj.dealerRevealed = false;
    clearBjCards();
    const res = App.engine.newRound(App.bj.bet);
    setStack(0, App.bj.bankroll);
    $("pot-label").textContent = "Apuesta " + UI.formatGold(App.bj.bet);
    dealBjCards();
    if (res.type === "result") resolveBj(res); else renderBjPlay();
  }

  function dealBjCards() {
    /* Croupier: primera visible, segunda oculta (indice 1) */
    App.engine.dealerHand.forEach(function (c, i) {
      UI.dealCard(App.seats[1].cardsEl, c, { down: i !== 0 });
    });
    App.engine.playerHand.forEach(function (c) {
      UI.dealCard(App.seats[0].cardsEl, c, { down: false });
    });
    if (AK.Sound) AK.Sound.play("deal");
    paintBjValues();
  }

  function renderBjPlay() {
    const box = $("controls"); UI.clear(box);
    const row = document.createElement("div");
    row.className = "btn-row";
    row.appendChild(makeBtn("Pedir", "primary", bjHit));
    row.appendChild(makeBtn("Plantarse", "gold", bjStand));
    if (App.engine.canDouble()) row.appendChild(makeBtn("Doblar", "danger", bjDouble));
    row.appendChild(makeBtn("\uD83C\uDCCF Guía", "ghost", UI.openBlackjackGuide));
    box.appendChild(row);
  }

  function bjHit() {
    if (App.engine.state !== "player") return;
    const res = App.engine.hit();
    syncBjCards();
    paintBjValues();
    if (res.type === "result") resolveBj(res); else renderBjPlay();
  }
  function bjStand() { resolveBj(App.engine.stand()); }
  function bjDouble() {
    if (!App.engine.canDouble() || App.bj.bet > App.bj.bankroll) { UI.toast("No puedes doblar.", "error"); return; }
    App.bj.bankroll -= App.bj.bet;
    const res = App.engine.double();
    syncBjCards();
    setStack(0, App.bj.bankroll);
    resolveBj(res);
  }

  function syncBjCards() {
    const pCards = App.seats[0].cardsEl.querySelectorAll(".card").length;
    for (let i = pCards; i < App.engine.playerHand.length; i++) UI.dealCard(App.seats[0].cardsEl, App.engine.playerHand[i], { down: false });
    const dCards = App.seats[1].cardsEl.querySelectorAll(".card").length;
    for (let i = dCards; i < App.engine.dealerHand.length; i++) UI.dealCard(App.seats[1].cardsEl, App.engine.dealerHand[i], { down: false });
  }

  function revealDealer() {
    UI.revealAll(App.seats[1].cardsEl);
    App.bj.dealerRevealed = true;
    C.react(App.seats[1].charEl, "think", 800);
    paintBjValues();
  }

  function resolveBj(res) {
    UI.clear($("controls"));
    revealDealer();
    UI.sleep(900).then(function () { settleBj(res); });
  }

  function settleBj(res) {
    if (App.bj.settled) return;
    App.bj.settled = true;
    App.bj.bankroll += res.payout;
    setStack(0, App.bj.bankroll);
    $("pot-label").textContent = "Banca " + UI.formatGold(App.bj.bankroll);

    const msgs = {
      blackjack: "¡BLACKJACK! Pagan 3:2 · +" + UI.formatGold(res.payout),
      win: "¡Ganas la mano! +" + UI.formatGold(res.payout),
      push: "Empate. Recuperas tu apuesta.",
      lose: "Pierdes la mano."
    };
    const type = res.outcome === "lose" ? "lose" : (res.outcome === "push" ? "info" : "win");
    UI.toast(msgs[res.outcome], type, 2600);
    if (AK.Sound) {
      if (res.outcome === "blackjack") AK.Sound.play("bigwin");
      else if (res.outcome === "win") AK.Sound.play("win");
      else if (res.outcome === "lose") AK.Sound.play("lose");
      else AK.Sound.play("check");
    }
    if (res.outcome === "win" || res.outcome === "blackjack") {
      UI.burstFromEl(App.seats[0].el, 26);
      C.react(App.seats[0].charEl, "win", 1400);
      C.react(App.seats[1].charEl, "lose", 1200);
    } else if (res.outcome === "lose") {
      C.react(App.seats[0].charEl, "lose", 1200);
      C.react(App.seats[1].charEl, "win", 1200);
    }

    window.setTimeout(function () {
      if (App.bj.bankroll < App.bj.minBet) { finishBlackjack(false); return; }
      clearBjCards();
      showAction(0, ""); showAction(1, "");
      App.bj.bet = Math.min(App.bj.maxBet, Math.min(App.bj.bankroll, App.bj.minBet * 2));
      renderBjBet();
    }, 1500);
  }

  function cashOutBlackjack() {
    if (App.mode !== "blackjack") return;
    if (App.engine.state === "player" || App.engine.state === "dealer") { UI.toast("Termina la mano para cobrar.", "warn"); return; }
    finishBlackjack(true, true);
  }

  function finishBlackjack(cashed, voluntary) {
    const t = App.tableDef;
    const bankroll = App.bj.bankroll;
    App.state.gold += bankroll;
    const profit = bankroll - t.buyIn;
    let bonus = 0;
    if (profit > 0) {
      App.state.tablesWon++;
      bonus = Math.round(profit * 0.2);
      App.state.gold += bonus;
    }
    AK.saveGame(App.state);
    App.mode = null;
    if (profit > 0) UI.burstFromCenter(34);

    UI.modal({
      title: profit > 0 ? "\uD83C\uDFC6 Buen beneficio en Blackjack" : "Cobras y te retiras",
      html:
        '<div class="level-stakes">' +
          "<span>Banca final: <b>" + UI.formatGold(bankroll) + " \uD83E\uDE99</b></span>" +
          "<span>Entrada: <b>" + UI.formatGold(t.buyIn) + " \uD83E\uDE99</b></span>" +
          "<span>Balance: <b style='color:" + (profit >= 0 ? "#4ade80" : "#f87171") + "'>" + (profit >= 0 ? "+" : "") + UI.formatGold(profit) + " \uD83E\uDE99</b></span>" +
          (bonus ? "<span>Prima: <b>+" + UI.formatGold(bonus) + " \uD83E\uDE99</b></span>" : "") +
        "</div>" +
        '<p class="piggy">Oro total: <b>' + UI.formatGold(App.state.gold) + " \uD83E\uDE99</b></p>",
      actions: [
        { label: "Otra mesa", type: "gold", onClick: backToCasino },
        { label: "Ir al mapa", type: "primary", onClick: function () { renderCityMap(); showScreen("screen-city"); } }
      ]
    });
  }

  /* ------------------------------------------------------------------ *
   *  HIPODROMO (apuestas de caballos)                                  *
   * ------------------------------------------------------------------ */
  function startHorses(t) {
    App.mode = "horses"; App.leaving = false;
    App.horses = {
      bankroll: t.buyIn, bet: Math.min(t.minBet * 2, t.buyIn), kind: "win", selected: 0,
      race: null, timer: 0, running: false,
      buyIn: t.buyIn, minBet: t.minBet, maxBet: t.maxBet, numHorses: t.numHorses || 6
    };
    $("hud-hp-level").textContent = t.name + " · " + App.city.name;
    $("hud-hp-gold").textContent = UI.formatGold(App.state.gold);
    $("hp-status").textContent = "Elige un caballo y apuesta.";
    showScreen("screen-horses");
    if (AK.Sound) AK.Sound.play("gallop");
    UI.toast("Hipódromo de " + App.city.name + " · Banca " + UI.formatGold(t.buyIn), "info", 3000);
    renderHorseBet();
  }

  function buildHorseTrack() {
    const h = App.horses;
    const track = $("hp-track"); UI.clear(track);
    h.markers = [];
    h.race.horses.forEach(function (hh, i) {
      const lane = document.createElement("button");
      lane.type = "button";
      lane.className = "hp-lane";
      lane.dataset.i = i;
      lane.innerHTML =
        '<span class="hp-num">' + (i + 1) + "</span>" +
        '<span class="hp-name">\uD83D\uDC0E ' + hh.name + "</span>" +
        '<span class="hp-odds">x' + hh.odds.toFixed(1) + "</span>" +
        '<span class="hp-runway"><span class="hp-runner">\uD83C\uDFC7</span></span>';
      lane.addEventListener("click", function () {
        if (h.running) return;
        h.selected = i;
        paintHorseSelection();
        if (AK.Sound) AK.Sound.play("hover");
      });
      h.markers.push(lane.querySelector(".hp-runner"));
      track.appendChild(lane);
    });
    paintHorseSelection();
  }

  function paintHorseSelection() {
    const h = App.horses; if (!h) return;
    const track = $("hp-track"); if (!track) return;
    Array.prototype.forEach.call(track.children, function (lane) {
      lane.classList.toggle("selected", Number(lane.dataset.i) === h.selected);
    });
  }

  function updateHorseMarkers() {
    const h = App.horses;
    const prog = h.race.progress();
    h.markers.forEach(function (m, i) {
      const v = Math.round(prog[i] * 88);
      m.style.left = v + "%";
    });
  }

  function renderHorseBet() {
    const h = App.horses;
    h.running = false;
    if (!h.race || h.race.finished) h.race = new AK.HorseRace({ numHorses: h.numHorses });
    $("hud-hp-gold").textContent = UI.formatGold(App.state.gold);
    $("hp-status").textContent = "Banca para apostar: " + UI.formatGold(h.bankroll) + " \uD83E\uDE99";
    buildHorseTrack();

    const box = $("hp-controls"); UI.clear(box);

    /* Tipo de apuesta */
    const kinds = document.createElement("div"); kinds.className = "hp-kinds";
    [["win", "Ganador"], ["place", "Colocado (top 3)"]].forEach(function (k) {
      const b = makeBtn(k[1], h.kind === k[0] ? "primary" : "ghost", function () { h.kind = k[0]; renderHorseBet(); });
      kinds.appendChild(b);
    });
    box.appendChild(kinds);

    /* Apuesta rapida */
    const chips = document.createElement("div"); chips.className = "chip-row";
    [1, 2, 5, 10, 25].forEach(function (mult) {
      const v = h.minBet * mult;
      if (v > h.bankroll) return;
      chips.appendChild(makeBtn("+" + UI.formatGold(v), "chip", function () {
        h.bet = Math.max(h.minBet, Math.min(h.maxBet, Math.min(h.bankroll, h.bet + v)));
        range.value = h.bet; label.textContent = UI.formatGold(h.bet);
        if (AK.Sound) AK.Sound.play("chip");
      }));
    });
    box.appendChild(chips);

    /* Slider */
    const wrap = document.createElement("div"); wrap.className = "raise-control";
    const range = document.createElement("input");
    range.type = "range"; range.min = h.minBet; range.max = Math.min(h.maxBet, Math.max(h.minBet, h.bankroll)); range.step = h.minBet;
    range.value = Math.min(h.bet, range.max);
    h.bet = Number(range.value);
    const label = document.createElement("span"); label.className = "raise-value"; label.textContent = UI.formatGold(range.value);
    range.addEventListener("input", function () { h.bet = Number(range.value); label.textContent = UI.formatGold(range.value); });
    wrap.appendChild(range); wrap.appendChild(label);
    box.appendChild(wrap);

    const row = document.createElement("div"); row.className = "btn-row";
    row.appendChild(makeBtn("\uD83C\uDFC1 ¡Correr!", "primary", runHorseRace));
    row.appendChild(makeBtn("\uD83D\uDCB0 Cobrar y salir", "ghost", function () { cashOutHorses(); }));
    row.appendChild(makeBtn("\u2753 Reglas", "ghost", showHorseGuide));
    box.appendChild(row);
  }

  function runHorseRace() {
    const h = App.horses;
    if (h.running) return;
    if (h.bet < h.minBet || h.bet > h.bankroll) { UI.toast("Apuesta no válida.", "error"); return; }
    h.bankroll -= h.bet;
    h.race = new AK.HorseRace({ numHorses: h.numHorses });
    h.selected = Math.min(h.selected, h.race.horses.length - 1);
    buildHorseTrack();
    h.running = true;
    UI.clear($("hp-controls"));
    $("hp-status").textContent = "¡Arrancan! Tu apuesta: " + UI.formatGold(h.bet) + " a " + h.race.horses[h.selected].name;
    if (AK.Sound) AK.Sound.play("bell");
    h.timer = window.setInterval(function () {
      const res = h.race.step();
      updateHorseMarkers();
      if (Math.random() < 0.35 && AK.Sound) AK.Sound.play("gallop");
      if (res.finished) {
        window.clearInterval(h.timer); h.timer = 0;
        window.setTimeout(finishHorseRace, 500);
      }
    }, 95);
  }

  function finishHorseRace() {
    const h = App.horses;
    h.running = false;
    const win = h.race.order[0];
    const mine = h.race.horses[h.selected];
    const payout = AK.HorseRace.payout(h.bet, mine, h.kind);
    h.bankroll += payout;

    /* Marca el ganador */
    if (h.markers && h.markers[win.index]) h.markers[win.index].classList.add("winner");

    let msg = "\uD83C\uDFC6 Ganó " + win.name + " (x" + win.odds.toFixed(1) + "). ";
    if (mine.place === 1) msg += "¡Tu caballo GANÓ! +" + UI.formatGold(payout);
    else if (mine.place <= 3) msg += "Tu caballo llegó " + mine.place + "º. +" + UI.formatGold(payout);
    else msg += "Tu caballo llegó " + mine.place + "º. No hay premio.";
    $("hp-status").textContent = msg;

    if (payout > 0) {
      if (AK.Sound) AK.Sound.play("raceWin");
      UI.toast(mine.place === 1 ? "\uD83D\uDC0E ¡Tu caballo gana! +" + UI.formatGold(payout) : "Colocado: +" + UI.formatGold(payout), "win", 2800);
      if (mine.place === 1) UI.burstFromCenter(30);
    } else {
      if (AK.Sound) AK.Sound.play("lose");
    }

    window.setTimeout(function () {
      if (h.bankroll < h.minBet) { finishHorses(false); return; }
      renderHorseBet();
    }, 2200);
  }

  function showHorseGuide() {
    UI.modal({
      title: "\uD83D\uDC0E Apuestas de caballos",
      html:
        '<div class="bj-guide">' +
          "<p class=\"bj-intro\">Elige un caballo y corre. Cada caballo tiene una <b>cuota</b> (xN) según su fuerza: pagos mayores = menos probable.</p>" +
          '<div class="bj-table">' +
            '<div class="bj-row"><span class="bj-hand">Ganador</span><span class="bj-act good">Cobras apuesta × cuota si tu caballo llega 1º.</span></div>' +
            '<div class="bj-row"><span class="bj-hand">Colocado</span><span class="bj-act mid">Cobras una cuota reducida si llega entre los 3 primeros.</span></div>' +
            '<div class="bj-row"><span class="bj-hand">Favoritos</span><span class="bj-act mid">Cuota baja = más probable, pero pagan menos.</span></div>' +
            '<div class="bj-row"><span class="bj-hand">Sorpresas</span><span class="bj-act good">Los que nadie espera pagan muchísimo si ganan.</span></div>' +
          "</div>" +
        "</div>",
      actions: [{ label: "Entendido", type: "primary" }],
      dismissible: true
    });
  }

  function cashOutHorses() {
    if (App.mode !== "horses") return;
    if (App.horses.running) { UI.toast("Espera a que termine la carrera.", "warn"); return; }
    finishHorses(true);
  }

  function finishHorses(cashed) {
    const t = App.tableDef;
    const bankroll = App.horses.bankroll;
    App.state.gold += bankroll;
    const profit = bankroll - t.buyIn;
    let bonus = 0;
    if (profit > 0) { App.state.tablesWon++; bonus = Math.round(profit * 0.2); App.state.gold += bonus; }
    AK.saveGame(App.state);
    App.mode = null;
    if (AK.Sound) AK.Sound.play("cash");
    if (profit > 0) UI.burstFromCenter(30);

    UI.modal({
      title: profit > 0 ? "\uD83C\uDFC6 Buena jornada en el hipódromo" : "Dejas el hipódromo",
      html:
        '<div class="level-stakes">' +
          "<span>Banca final: <b>" + UI.formatGold(bankroll) + " \uD83E\uDE99</b></span>" +
          "<span>Entrada: <b>" + UI.formatGold(t.buyIn) + " \uD83E\uDE99</b></span>" +
          "<span>Balance: <b style='color:" + (profit >= 0 ? "#4ade80" : "#f87171") + "'>" + (profit >= 0 ? "+" : "") + UI.formatGold(profit) + " \uD83E\uDE99</b></span>" +
          (bonus ? "<span>Prima: <b>+" + UI.formatGold(bonus) + " \uD83E\uDE99</b></span>" : "") +
        "</div>" +
        '<p class="piggy">Oro total: <b>' + UI.formatGold(App.state.gold) + " \uD83E\uDE99</b></p>",
      actions: [
        { label: "Otra mesa", type: "gold", onClick: backToCasino },
        { label: "Ir al mapa", type: "primary", onClick: function () { renderCityMap(); showScreen("screen-city"); } }
      ]
    });
  }

  function wireHorses() {
    const back = $("btn-hp-back"), guide = $("btn-hp-guide");
    if (back) back.addEventListener("click", cashOutHorses);
    if (guide) guide.addEventListener("click", showHorseGuide);
  }

  /* ------------------------------------------------------------------ *
   *  SALIR                                                             *
   * ------------------------------------------------------------------ */
  function wireTableHud() {
    $("btn-leave").addEventListener("click", onLeaveClick);
    $("btn-table-guide").addEventListener("click", function () {
      if (App.mode === "blackjack") UI.openBlackjackGuide();
      else if (App.mode === "horses") showHorseGuide();
      else UI.openGuide();
    });
  }

  function onLeaveClick() {
    if (App.mode === "poker") {
      App.leaving = true;
      if (App.humanResolve) clickAction({ type: "fold" });
      else UI.toast("Te retirarás al terminar esta mano.", "info");
    } else if (App.mode === "blackjack") {
      cashOutBlackjack();
    } else if (App.mode === "horses") {
      cashOutHorses();
    } else {
      backToCasino();
    }
  }

  /* Arranque */
  window.addEventListener("DOMContentLoaded", init);

  App.debug = {
    renderCityMap: renderCityMap, enterCity: enterCity, renderCasino: renderCasino,
    startTable: startTable, showScreen: showScreen, startHorses: startHorses, runHorseRace: runHorseRace
  };
})(window);
