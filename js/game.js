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
    bj: { bankroll: 0, bet: 0, settled: false, dealerRevealed: false, buyIn: 0, minBet: 0, maxBet: 0 },
    horses: { bankroll: 0, bet: 0, kind: "win", selected: 0, race: null, timer: 0, running: false, buyIn: 0, minBet: 0, maxBet: 0, numHorses: 6 },
    roulette: null, slots: null, baccarat: null, dice: null
  };
  global.AllInApp = App;

  const MUTE_KEY = "allin_kingdom_muted";
  const MUSIC_KEY = "allin_kingdom_music";

  function wireSound() {
    const btn = $("sound-toggle");
    const mbtn = $("music-toggle");
    const saved = (function () { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { return false; } })();
    const savedMusic = (function () { try { return localStorage.getItem(MUSIC_KEY); } catch (e) { return null; } })();
    if (AK.Sound) {
      AK.Sound.setMuted(saved);
      AK.Sound.setMusicMuted(savedMusic === "0");
    }
    function paint() {
      if (!btn || !AK.Sound) return;
      btn.textContent = AK.Sound.isMuted() ? "\uD83D\uDD07" : "\uD83D\uDD0A";
      btn.classList.toggle("muted", AK.Sound.isMuted());
    }
    function paintMusic() {
      if (!mbtn || !AK.Sound) return;
      mbtn.textContent = AK.Sound.isMusicMuted() ? "\uD83D\uDD07" : "\uD83C\uDFB5";
      mbtn.classList.toggle("muted", AK.Sound.isMusicMuted());
    }
    if (btn) btn.addEventListener("click", function () {
      if (!AK.Sound) return;
      const m = AK.Sound.toggle();
      try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
      paint();
    });
    if (mbtn) mbtn.addEventListener("click", function () {
      if (!AK.Sound) return;
      AK.Sound.setMusicMuted(!AK.Sound.isMusicMuted());
      if (!AK.Sound.isMusicMuted()) AK.Sound.startMusic();
      try { localStorage.setItem(MUSIC_KEY, AK.Sound.isMusicMuted() ? "0" : "1"); } catch (e) {}
      paintMusic();
    });
    paint(); paintMusic();

    /* La musica solo puede sonar tras una interaccion del usuario. */
    function kickMusic() {
      if (AK.Sound && !AK.Sound.isMusicMuted()) AK.Sound.startMusic();
    }
    window.addEventListener("pointerdown", kickMusic, { once: true });
    window.addEventListener("keydown", kickMusic, { once: true });
  }

  /* ------------------------------------------------------------------ *
   *  NAVEGACION                                                        *
   * ------------------------------------------------------------------ */
  function showScreen(id) {
    Array.prototype.forEach.call(document.querySelectorAll(".screen"), function (s) {
      s.classList.toggle("active", s.id === id);
    });
    if (id === "screen-table") scheduleFit();
    if (id === "screen-city") investTick();
  }

  /* ------------------------------------------------------------------ *
   *  AJUSTE AUTOMATICO DE LA MESA                                       *
   *  Escala el contenido de la mesa para que las cartas quepan siempre  *
   *  en pantalla, sin tener que reducir el zoom del navegador.          *
   * ------------------------------------------------------------------ */
  let fitRaf = null;
  function fitFelt() {
    const felt = $("felt"); if (!felt) return;
    const inner = felt.querySelector(".felt-inner"); if (!inner) return;
    inner.style.transform = "scale(1)";
    const cw = inner.clientWidth, ch = inner.clientHeight;
    const sw = inner.scrollWidth, sh = inner.scrollHeight;
    if (!cw || !ch || !sw || !sh) return;
    const s = Math.min(1, cw / sw, ch / sh);
    if (s < 0.999) inner.style.transform = "scale(" + s.toFixed(4) + ")";
  }
  function scheduleFit() {
    if (fitRaf) {
      if (window.cancelAnimationFrame) cancelAnimationFrame(fitRaf); else clearTimeout(fitRaf);
    }
    if (window.requestAnimationFrame) fitRaf = requestAnimationFrame(fitFelt);
    else fitRaf = setTimeout(fitFelt, 16);
  }
  function initFeltFit() {
    const felt = $("felt"); if (!felt) return;
    if (window.MutationObserver) {
      new MutationObserver(scheduleFit).observe(felt, { childList: true, subtree: true });
    }
    if (window.ResizeObserver) new ResizeObserver(scheduleFit).observe(felt);
    window.addEventListener("resize", scheduleFit);
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
    wireMini();
    initFeltFit();
    startInvestLoop();

    /* Sonido en cualquier boton + desbloqueo de audio */
    document.addEventListener("click", function (e) {
      if (AK.Sound) { AK.Sound.unlock(); if (e.target && e.target.closest && e.target.closest("button")) AK.Sound.play("click"); }
    }, true);

    const saved = AK.loadGame();
    if (saved) {
      App.state = saved;
      if (!App.state.investments) App.state.investments = {};
      const earned = investTick();
      renderCityMap();
      showScreen("screen-city");
      if (earned > 0) UI.toast("Tus negocios ganaron " + UI.formatGold(earned) + " 🪙 mientras estabas fuera.", "gold", 3600);
    }
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
    $("btn-invest").addEventListener("click", openInvest);
    $("btn-invest-back").addEventListener("click", function () { renderCityMap(); showScreen("screen-city"); });
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

      const skyEl = card.querySelector(".city-sky");
      const art = AK.CityArt && AK.CityArt.uri(city.id);
      if (art && skyEl) {
        skyEl.style.backgroundImage = "url('" + art + "')";
        skyEl.style.backgroundSize = "cover";
        skyEl.style.backgroundPosition = "center";
        skyEl.style.opacity = unlocked ? "1" : ".7";
      }

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
   *  NEGOCIOS / INVERSIONES (ingresos pasivos)                          *
   * ------------------------------------------------------------------ */
  function refreshGold() {
    const s = App.state; if (!s) return;
    const txt = UI.formatGold(s.gold);
    ["hud-gold", "casino-gold", "hud-gold-table", "mini-gold", "hud-hp-gold", "invest-gold"].forEach(function (id) {
      const el = $(id); if (el) el.textContent = txt;
    });
  }

  /** Suma el oro generado por los negocios desde la ultima vez. */
  function investTick() {
    const s = App.state;
    if (!s || !s.investments) return 0;
    const now = Date.now();
    let earned = 0;
    Object.keys(s.investments).forEach(function (cid) {
      const cfg = AK.INVESTMENTS && AK.INVESTMENTS[cid];
      const it = s.investments[cid];
      if (!cfg || !it) return;
      if (!it.last) { it.last = now; return; }
      const elapsed = now - it.last;
      const gain = Math.floor(elapsed / 60000 * cfg.perMin);
      if (gain > 0) {
        earned += gain;
        it.last += Math.round(gain / cfg.perMin * 60000);
      }
    });
    if (earned > 0) {
      s.gold += earned;
      AK.saveGame(s);
      refreshGold();
      const inv = $("invest-list");
      if (inv && $("screen-invest").classList.contains("active")) renderInvest();
    }
    return earned;
  }

  function startInvestLoop() {
    window.setInterval(function () { investTick(); }, 5000);
  }

  function renderInvest() {
    const s = App.state;
    if (!s) return;
    if (!s.investments) s.investments = {};
    const list = $("invest-list");
    UI.clear(list);

    AK.CITIES.forEach(function (city) {
      const cfg = AK.INVESTMENTS && AK.INVESTMENTS[city.id];
      if (!cfg) return;
      const owned = !!s.investments[city.id];
      const unlocked = AK.isCityUnlocked(s, city);

      const card = document.createElement("div");
      card.className = "invest-card" + (owned ? " owned" : "") + (unlocked ? "" : " locked");

      const head = '<div class="invest-head"><span class="invest-flag">' + city.flag + "</span>" +
        '<span><span class="invest-name">' + cfg.name + "</span><br>" +
        '<span class="invest-city">' + city.name + "</span></span></div>";

      if (owned) {
        card.innerHTML = head +
          '<div class="invest-row"><span>Renta</span><b>+' + UI.formatGold(cfg.perMin) + " 🪙 / min</b></div>" +
          '<div class="invest-owned">✅ Activo · generando oro sin parar</div>';
      } else if (!unlocked) {
        card.innerHTML = head +
          '<div class="invest-row"><span>Renta</span><b>+' + UI.formatGold(cfg.perMin) + " 🪙 / min</b></div>" +
          '<div class="invest-note">🔒 Se desbloquea al viajar a ' + city.name + " (" + UI.formatGold(city.unlockGold) + " 🪙).</div>";
      } else {
        card.innerHTML = head +
          '<div class="invest-row"><span>Coste</span><b>' + UI.formatGold(cfg.cost) + " 🪙</b></div>" +
          '<div class="invest-row"><span>Renta</span><b>+' + UI.formatGold(cfg.perMin) + " 🪙 / min</b></div>";
        const btn = makeBtn("Comprar negocio", s.gold >= cfg.cost ? "gold" : "ghost", function () {
          buyInvestment(city.id);
        });
        btn.disabled = s.gold < cfg.cost;
        btn.classList.add("small");
        card.appendChild(btn);
      }
      list.appendChild(card);
    });

    const help = $("invest-help");
    if (help) {
      const broke = s.gold < 100;
      help.innerHTML =
        "<p>Los negocios producen oro cada minuto, incluso con el juego cerrado. " +
        "Vuelve más tarde y lo recibirás acumulado.</p>" +
        (broke
          ? '<button id="btn-loan" class="btn danger small">💰 Pedir préstamo urgente (+500 🪙, deuda +550)</button>'
          : (s.loans > 0 ? "<p>Deuda pendiente: <b>" + UI.formatGold(s.loans) + " 🪙</b></p>" : ""));
      const loan = $("btn-loan");
      if (loan) loan.addEventListener("click", takeLoan);
    }
    refreshGold();
  }

  function buyInvestment(cityId) {
    const s = App.state;
    const cfg = AK.INVESTMENTS[cityId];
    if (!cfg || !s) return;
    if (s.investments[cityId]) { UI.toast("Ya tienes ese negocio.", "info"); return; }
    if (s.gold < cfg.cost) { UI.toast("No te llega el oro.", "error"); return; }
    s.gold -= cfg.cost;
    s.investments[cityId] = { last: Date.now() };
    AK.saveGame(s);
    refreshGold();
    if (AK.Sound) AK.Sound.play("cash");
    UI.toast("Negocio comprado: " + cfg.name + " (+" + UI.formatGold(cfg.perMin) + " 🪙/min)", "gold", 3000);
    renderInvest();
  }

  function takeLoan() {
    const s = App.state; if (!s) return;
    s.gold += 500;
    s.loans = (s.loans || 0) + 550;
    AK.saveGame(s);
    if (AK.Sound) AK.Sound.play("cash");
    UI.toast("Préstamo recibido: +500 🪙. Deuda: " + UI.formatGold(s.loans) + " 🪙", "warn", 3200);
    renderInvest();
  }

  function openInvest() {
    investTick();
    renderInvest();
    showScreen("screen-invest");
  }

  /* ------------------------------------------------------------------ *
   *  CASINO (seleccion de mesa)                                        *
   * ------------------------------------------------------------------ */
  function renderCasino(city) {
    App.city = city;
    $("casino-city").textContent = city.flag + " " + city.name;
    $("casino-gold").textContent = UI.formatGold(App.state.gold);
    const bg = $("casino-bg");
    const bgArt = AK.CityArt && AK.CityArt.uri(city.id);
    if (bgArt) {
      bg.style.backgroundColor = city.sky[2];
      bg.style.backgroundImage = "linear-gradient(180deg, rgba(8,9,11,.35), rgba(8,9,11,.9)), url('" + bgArt + "')";
      bg.style.backgroundSize = "cover";
      bg.style.backgroundPosition = "center";
    } else {
      bg.style.background = "linear-gradient(180deg," + city.sky[0] + "," + city.sky[1] + " 45%," + city.sky[2] + ")";
    }

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
        const bet = "<span>\uD83D\uDCB0 Apuesta " + UI.formatGold(t.minBet) + "–" + UI.formatGold(t.maxBet) + "</span>";
        const GAME_ICON = {
          poker: "\u2660\u2665", blackjack: "\uD83C\uDCCF", horses: "\uD83D\uDC0E",
          roulette: "\uD83C\uDFAF", slots: "\uD83C\uDFB0", baccarat: "\uD83C\uDCB1", dice: "\uD83C\uDFB2"
        };
        let icon = GAME_ICON[t.game] || "\uD83C\uDFB0";
        let stats;
        if (isPoker) {
          stats = "<span>\uD83D\uDC65 " + t.seats + " jugadores</span><span>\uD83D\uDD3A Ciegas " + UI.formatGold(t.smallBlind) + "/" + UI.formatGold(t.bigBlind) + "</span>";
        } else if (isHp) {
          stats = "<span>\uD83C\uDFC1 " + (t.numHorses || 6) + " caballos</span>" + bet;
        } else {
          stats = bet;
        }
        card.innerHTML =
          '<div class="table-icon">' + icon + "</div>" +
          '<div class="table-name">' + t.name + "</div>" +
          '<div class="table-desc">' + t.desc + "</div>" +
          '<div class="table-stats">' +
            stats +
            "<span>\uD83C\uDF9F Entrada " + UI.formatGold(t.buyIn) + " \uD83E\uDE99</span>" +
          "</div>" +
          '<div class="table-cta">' + (affordable ? (isPoker ? "Sentarse \u2192" : "Jugar \u2192") : "\uD83D\uDD14 Falta oro") + "</div>";
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

    const inner = document.createElement("div");
    inner.className = "felt-inner";

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

    inner.appendChild(oppRow);
    inner.appendChild(center);
    inner.appendChild(youRow);
    felt.appendChild(inner);

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

    scheduleFit();
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
    else startMini(t);
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
    App.bj = { bankroll: t.buyIn, bet: Math.min(t.minBet * 2, t.buyIn), settled: false, dealerRevealed: false, buyIn: t.buyIn, minBet: t.minBet, maxBet: t.maxBet, insuranceBet: 0 };
    App.engine = new AK.BlackjackTable({ numDecks: 6, dealerStand17: true, humanName: App.state.name });

    const specs = [
      playerSeatSpec(App.bj.bankroll),
      { name: "Croupier", title: "La Casa", face: DEALER_FACE, color: "#c0c0c0", skin: DEALER_FACE.skin, isHuman: false, stack: 0 }
    ];
    $("hud-level").textContent = t.name + " · " + App.city.name;
    applyTableTheme(App.city.theme);
    buildFelt(specs);
    App.seats[0].cardsEl.classList.add("bj-hands");
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
    App.bj.settled = false;
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
    if (!App.engine.hands || !App.engine.hands.length) return;
    const parts = App.engine.hands.map(function (h, i) {
      const v = AK.handValue(h.cards);
      return (App.engine.hands.length > 1 ? "M" + (i + 1) + " " : "Mano ") + v.total + (h.bust ? " \u2717" : "");
    });
    showAction(0, parts.join("   "));
    const dv = App.engine.dealerValue();
    showAction(1, "Dealer: " + (App.bj.dealerRevealed ? dv.total : "?"));
  }

  function clearBjCards() {
    UI.clear(App.seats[0].cardsEl); UI.clear(App.seats[1].cardsEl);
    UI.clear($("board-cards"));
  }

  function dealBlackjack() {
    if (App.bj.bet < App.bj.minBet || App.bj.bet > App.bj.bankroll) { UI.toast("Apuesta no válida.", "error"); return; }
    App.bj.bankroll -= App.bj.bet;
    App.bj.settled = false; App.bj.dealerRevealed = false; App.bj.insuranceBet = 0;
    clearBjCards();
    const res = App.engine.newRound(App.bj.bet);
    setStack(0, App.bj.bankroll);
    $("pot-label").textContent = "Apuesta " + UI.formatGold(App.bj.bet);
    renderBjDealer();
    renderBjPlayer();
    if (AK.Sound) AK.Sound.play("deal");
    paintBjValues();
    if (res.type === "result") {
      App.bj.pending = res;
      revealDealer();
      UI.sleep(900).then(function () { settleBj(res); });
    } else {
      renderBjPlay();
    }
  }

  /* Croupier: primera carta visible, segunda oculta hasta revelar. */
  function renderBjDealer() {
    const box = App.seats[1].cardsEl; UI.clear(box);
    App.engine.dealerHand.forEach(function (c, i) {
      UI.dealCard(box, c, { down: i !== 0 && !App.bj.dealerRevealed });
    });
  }
  function syncBjDealer() {
    const box = App.seats[1].cardsEl;
    const have = box.querySelectorAll(".card").length;
    for (let i = have; i < App.engine.dealerHand.length; i++) UI.dealCard(box, App.engine.dealerHand[i], { down: false });
  }

  function renderBjPlayer() {
    const box = App.seats[0].cardsEl; UI.clear(box);
    App.engine.hands.forEach(function (h, hi) {
      const row = document.createElement("div");
      row.className = "bj-hand-row" + (App.engine.state === "player" && hi === App.engine.activeHand ? " active" : "");
      if (h.surrendered) row.classList.add("surrendered");
      h.cards.forEach(function (c) { UI.dealCard(row, c, { down: false }); });
      const tag = document.createElement("span");
      tag.className = "bj-hand-tag";
      const v = AK.handValue(h.cards);
      tag.textContent = (App.engine.hands.length > 1 ? "M" + (hi + 1) + " · " : "") + v.total +
        (h.doubled ? " x2" : "") + (h.bust ? " \u2717" : "") + (h.surrendered ? " rendido" : "");
      row.appendChild(tag);
      box.appendChild(row);
    });
  }

  function renderBjPlay() {
    const box = $("controls"); UI.clear(box); box.className = "controls";

    if (App.engine.insuranceOffered && !App.bj.insuranceBet) {
      const irow = document.createElement("div"); irow.className = "btn-row";
      const base = App.engine.baseBet || App.bj.bet;
      irow.appendChild(makeBtn("\uD83D\uDEE1 Aceptar seguro (" + UI.formatGold(Math.floor(base / 2)) + ")", "gold", bjInsurance));
      irow.appendChild(makeBtn("Sin seguro", "ghost", bjNoInsurance));
      box.appendChild(irow);
    }

    const row = document.createElement("div");
    row.className = "btn-row";
    const h = App.engine.hands[App.engine.activeHand];
    row.appendChild(makeBtn("Pedir", "primary", bjHit));
    row.appendChild(makeBtn("Plantarse", "gold", bjStand));
    if (h && App.engine.canDouble() && App.bj.bankroll >= h.bet) row.appendChild(makeBtn("Doblar", "danger", bjDouble));
    if (h && App.engine.canSplit() && App.bj.bankroll >= h.bet) row.appendChild(makeBtn("Dividir", "gold", bjSplit));
    if (App.engine.canSurrender()) row.appendChild(makeBtn("Rendirse", "ghost", bjSurrender));
    row.appendChild(makeBtn("\uD83C\uDCCF Guía", "ghost", UI.openBlackjackGuide));
    box.appendChild(row);
  }

  function afterBjAction(res) {
    if (res && res.type === "invalid") { UI.toast("Acción no válida.", "error"); renderBjPlay(); return; }
    setStack(0, App.bj.bankroll);
    renderBjPlayer();
    syncBjDealer();
    if (AK.Sound && res && (res.type === "hit" || res.type === "split")) AK.Sound.play("deal");
    paintBjValues();
    if (res && res.type === "result") {
      App.bj.pending = res;
      revealDealer();
      paintBjValues();
      UI.sleep(900).then(function () { settleBj(res); });
    } else {
      if (App.engine.insuranceOffered && !App.bj.insuranceBet) {
        /* ya se muestra el prompt de seguro en renderBjPlay */
      }
      renderBjPlay();
    }
  }

  function bjHit() { if (App.engine.state !== "player") return; afterBjAction(App.engine.hit()); }
  function bjStand() { if (App.engine.state !== "player") return; afterBjAction(App.engine.stand()); }
  function bjDouble() {
    const h = App.engine.hands[App.engine.activeHand];
    if (!h || !App.engine.canDouble() || App.bj.bankroll < h.bet) { UI.toast("No puedes doblar.", "error"); return; }
    App.bj.bankroll -= h.bet;
    if (AK.Sound) AK.Sound.play("chip");
    afterBjAction(App.engine.double());
  }
  function bjSplit() {
    const h = App.engine.hands[App.engine.activeHand];
    if (!h || !App.engine.canSplit() || App.bj.bankroll < h.bet) { UI.toast("No puedes dividir.", "error"); return; }
    App.bj.bankroll -= h.bet;
    if (AK.Sound) AK.Sound.play("chip");
    afterBjAction(App.engine.split());
  }
  function bjSurrender() { if (!App.engine.canSurrender()) return; afterBjAction(App.engine.surrender()); }
  function bjInsurance() {
    const amt = App.engine.takeInsurance();
    App.bj.bankroll -= amt; App.bj.insuranceBet = amt;
    setStack(0, App.bj.bankroll);
    if (AK.Sound) AK.Sound.play("chip");
    renderBjPlay();
  }
  function bjNoInsurance() { App.engine.declineInsurance(); renderBjPlay(); }

  function revealDealer() {
    UI.revealAll(App.seats[1].cardsEl);
    App.bj.dealerRevealed = true;
    C.react(App.seats[1].charEl, "think", 800);
    paintBjValues();
  }

  function settleBj(res) {
    if (App.bj.settled) return;
    App.bj.settled = true;
    App.bj.bankroll += res.payout;
    setStack(0, App.bj.bankroll);
    $("pot-label").textContent = "Banca " + UI.formatGold(App.bj.bankroll);

    const outcomes = (res.results || []).map(function (r) { return r.outcome; });
    const anyWin = outcomes.indexOf("win") >= 0;
    const anyBJ = outcomes.indexOf("blackjack") >= 0;
    const anyPush = outcomes.indexOf("push") >= 0;
    const anySur = outcomes.indexOf("surrender") >= 0;
    const allLose = outcomes.length > 0 && outcomes.every(function (o) { return o === "lose" || o === "surrender"; });

    let type = "info", msg;
    if (anyBJ) { type = "win"; msg = "¡BLACKJACK! 3:2 · +" + UI.formatGold(res.payout); }
    else if (anyWin) { type = "win"; msg = "¡Ganas la mano! +" + UI.formatGold(res.payout); }
    else if (allLose) { type = "lose"; msg = anySur ? "Te rindes; recuperas la mitad." : "Pierdes la mano."; }
    else { msg = anyPush ? "Empate. Recuperas tu apuesta." : "Mano terminada."; }
    if (res.insuranceWon) msg += " · Seguro pagado \u2714";

    UI.toast(msg, type, 2600);
    if (AK.Sound) {
      if (anyBJ) AK.Sound.play("bigwin");
      else if (anyWin) AK.Sound.play("win");
      else if (allLose) AK.Sound.play("lose");
      else AK.Sound.play("check");
    }
    if (anyWin || anyBJ) {
      UI.burstFromEl(App.seats[0].el, 26);
      C.react(App.seats[0].charEl, "win", 1400);
      C.react(App.seats[1].charEl, "lose", 1200);
    } else if (allLose) {
      C.react(App.seats[0].charEl, "lose", 1200);
      C.react(App.seats[1].charEl, "win", 1200);
    }

    window.setTimeout(function () {
      if (App.bj.bankroll < App.bj.minBet) { finishBlackjack(false); return; }
      clearBjCards();
      showAction(0, ""); showAction(1, "");
      App.bj.bet = Math.min(App.bj.maxBet, Math.min(App.bj.bankroll, App.bj.minBet * 2));
      renderBjBet();
    }, 1600);
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
   *  MINIJUEGOS (ruleta, tragaperras, baccarat, dados)                 *
   * ------------------------------------------------------------------ */
  function miniState() { return App.roulette || App.slots || App.baccarat || App.dice; }

  function updateMiniGold() {
    const m = miniState();
    const el = $("mini-gold");
    if (el) el.textContent = UI.formatGold(m ? m.bankroll : App.state.gold);
  }

  function wireMini() {
    const back = $("btn-mini-back");
    if (back) back.addEventListener("click", cashOutMini);
    const guide = $("btn-mini-guide");
    if (guide) guide.addEventListener("click", showMiniGuide);
  }

  function startMini(t) {
    App.tableDef = t;
    App.mode = t.game; App.leaving = false;
    $("mini-title").textContent = t.name + " · " + App.city.name;
    const base = { bankroll: t.buyIn, buyIn: t.buyIn, minBet: t.minBet, maxBet: t.maxBet, busy: false };
    if (t.game === "roulette") App.roulette = Object.assign({}, base, { bets: [], wheel: new AK.RouletteWheel(), history: [], angle: 0, spinning: false });
    else if (t.game === "slots") App.slots = Object.assign({}, base, { bet: Math.min(t.minBet * 5, t.buyIn), machine: new AK.SlotMachine(), spinning: false });
    else if (t.game === "baccarat") App.baccarat = Object.assign({}, base, { bet: Math.min(t.minBet * 2, t.buyIn), pick: "player", table: new AK.BaccaratTable({ numDecks: 6 }), busy: false });
    else if (t.game === "dice") App.dice = Object.assign({}, base, { bets: [], history: [], rolling: false });
    showScreen("screen-mini");
    updateMiniGold();
    if (t.game === "roulette") { renderRoulette(); }
    else if (t.game === "slots") { renderSlots(); }
    else if (t.game === "baccarat") { renderBaccarat(); }
    else if (t.game === "dice") { renderDice(); }
    UI.toast(t.name + " · Banca de " + UI.formatGold(t.buyIn), "info", 2800);
  }

  function cashOutMini() {
    if (!App.city || !App.tableDef) { backToCasino(); return; }
    const m = miniState();
    if (!m) { backToCasino(); return; }
    if (m.spinning || m.rolling || m.busy) { UI.toast("Espera a que termine la ronda.", "warn"); return; }
    const t = App.tableDef;
    const bankroll = m.bankroll;
    App.state.gold += bankroll;
    const profit = bankroll - t.buyIn;
    let bonus = 0;
    if (profit > 0) { App.state.tablesWon++; bonus = Math.round(profit * 0.2); App.state.gold += bonus; }
    AK.saveGame(App.state);
    App.mode = null;
    App.roulette = App.slots = App.baccarat = App.dice = null;
    if (profit > 0) UI.burstFromCenter(34);
    UI.modal({
      title: profit > 0 ? "\uD83C\uDFC6 Buen beneficio en " + t.name : "Cobras y te retiras",
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

  function showMiniGuide() {
    const RULES = {
      roulette: "<h3>Ruleta europea</h3><p>37 números (un solo cero). Haz una o varias apuestas y gira.</p><ul><li>Pleno (número exacto): 35:1</li><li>Rojo/Negro, Par/Impar, 1-18/19-36: 1:1</li><li>Docena o Columna: 2:1</li></ul><p>El cero (0) gana solo en la apuesta de pleno.</p>",
      slots: "<h3>Tragaperras</h3><p>Alinea tres símbolos iguales en el centro. Cuanto más raro el símbolo, más paga.</p><ul><li>🍒 Cereza x4 · 🍋 Limón x6 · 🍉 Sandía x10</li><li>🔔 Campana x20 · ⭐ Estrella x40</li><li>💎 Diamante x80 · 7️⃣ Siete x200</li></ul><p>Dos cerezas devuelven la apuesta.</p>",
      baccarat: "<h3>Baccarat (Punto y Banca)</h3><p>Se reparten dos cartas a Punto y a Banca. Gana quien más se acerque a 9 (sin pasarse). Los dieces y figuras valen 0; el As vale 1.</p><ul><li>Apuesta a Punto: 1:1</li><li>Apuesta a Banca: 0.95:1</li><li>Empate: 8:1 (y devuelve Punto/Banca)</li></ul>",
      dice: "<h3>Dados (Sic Bo)</h3><p>Se lanzan 3 dados. Apuesta a múltiples resultados.</p><ul><li>Pequeño (4-10) / Grande (11-17): 1:1</li><li>Par/Impar: 1:1 (el triple no cuenta)</li><li>Triple exacto: 30:1</li><li>Total exacto: hasta 60:1</li><li>Número suelto: paga según cuántas veces salga</li></ul>"
    };
    UI.modal({ title: "Reglas", html: '<div class="guide">' + (RULES[App.mode] || "") + "</div>", actions: [{ label: "Entendido", type: "primary" }] });
  }

  /* ------------------------------- RULETA ------------------------------- */
  function rouletteWheelSVG() {
    const order = AK.roulette.WHEEL;
    const step = 360 / order.length, cx = 150, cy = 150, R = 150;
    let paths = "";
    order.forEach(function (n, i) {
      const a0 = (i * step - 90) * Math.PI / 180, a1 = ((i + 1) * step - 90) * Math.PI / 180;
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      const col = n === 0 ? "#0a7a3d" : (AK.roulette.isRed(n) ? "#c62828" : "#141414");
      paths += '<path d="M' + cx + ',' + cy + ' L' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' A' + R + ',' + R + ' 0 0 1 ' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' Z" fill="' + col + '" stroke="rgba(0,0,0,.4)"/>';
      const am = ((i + 0.5) * step - 90) * Math.PI / 180;
      const tx = cx + (R - 17) * Math.cos(am), ty = cy + (R - 17) * Math.sin(am);
      paths += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" fill="#fff" font-size="10" font-weight="700" font-family="Arial" text-anchor="middle" dominant-baseline="middle" transform="rotate(' + ((i + 0.5) * step).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ')">' + n + '</text>';
    });
    return '<svg viewBox="0 0 300 300" class="rl-wheel" xmlns="http://www.w3.org/2000/svg">' +
      '<g class="rl-rotor">' + paths + '</g>' +
      '<circle cx="150" cy="150" r="150" fill="none" stroke="#c9a227" stroke-width="9"/>' +
      '<circle cx="150" cy="150" r="118" fill="none" stroke="rgba(255,255,255,.14)"/>' +
      '<polygon points="150,2 141,30 159,30" fill="#f5c542" stroke="#7a5a00"/>' +
      '<circle cx="150" cy="150" r="28" fill="#141414" stroke="#c9a227" stroke-width="3"/>' +
      '<text x="150" y="155" fill="#f5c542" font-size="16" font-weight="800" text-anchor="middle" font-family="Arial">AK</text>' +
      '</svg>';
  }

  function renderRoulette() {
    const m = App.roulette;
    $("mini-body").innerHTML =
      '<div class="mini-stage rl-stage">' +
        '<div class="rl-side left">' +
          '<div class="mini-panel-title">Historial</div>' +
          '<div id="rl-hist" class="rl-hist"></div>' +
        '</div>' +
        '<div class="rl-wrap"><div class="rl-rotor-wrap">' + rouletteWheelSVG() + '</div>' +
          '<div class="rl-result" id="rl-result">—</div>' +
          '<div class="rl-result-sub" id="rl-result-sub"></div>' +
        '</div>' +
        '<div class="rl-side right">' +
          '<div class="mini-panel-title">Apuestas</div>' +
          '<div id="rl-bets" class="mini-betlist"></div>' +
        '</div>' +
      '</div>';
    if (m.angle) { const r = $("mini-body").querySelector(".rl-rotor"); if (r) { r.style.transition = "none"; r.style.transform = "rotate(" + m.angle + "deg)"; } }
    renderRouletteBets();
    renderRouletteHist();
    renderRouletteControls();
    const res = $("rl-result"); if (m.wheel.last != null) { res.textContent = m.wheel.last; res.className = "rl-result " + colorClass(m.wheel.last); }
  }

  function colorClass(n) { return n === 0 ? "green" : (AK.roulette.isRed(n) ? "red" : "black"); }

  function renderRouletteBets() {
    const m = App.roulette;
    const box = $("rl-bets"); if (!box) return;
    UI.clear(box);
    if (!m.bets.length) { box.innerHTML = '<div class="mini-empty">Sin apuestas todavía</div>'; return; }
    m.bets.forEach(function (b, i) {
      const row = document.createElement("div");
      row.className = "mini-bet";
      row.innerHTML = '<span>' + AK.roulette.label(b) + '</span><b>' + UI.formatGold(b.amount) + ' 🪙</b>';
      const x = makeBtn("✕", "ghost small", function () { m.bets.splice(i, 1); renderRouletteBets(); });
      row.appendChild(x);
      box.appendChild(row);
    });
    const tot = m.bets.reduce(function (s, b) { return s + b.amount; }, 0);
    const t = document.createElement("div"); t.className = "mini-bet-total";
    t.innerHTML = "Total apostado: <b>" + UI.formatGold(tot) + " 🪙</b>";
    box.appendChild(t);
  }

  function renderRouletteHist() {
    const box = $("rl-hist"); if (!box) return;
    UI.clear(box);
    if (!App.roulette.history.length) { box.innerHTML = '<div class="mini-empty">—</div>'; return; }
    App.roulette.history.forEach(function (n) {
      const c = document.createElement("span");
      c.className = "rl-hist-chip " + colorClass(n);
      c.textContent = n;
      box.appendChild(c);
    });
  }

  function renderRouletteControls() {
    const m = App.roulette;
    const box = $("mini-controls"); if (!box) return;
    UI.clear(box); box.className = "mini-controls";
    if (m.spinning) return;

    const cfg = document.createElement("div"); cfg.className = "mini-cfg";
    const typeSel = document.createElement("select"); typeSel.className = "mini-select";
    [["straight", "Pleno (número)"], ["red", "Rojo"], ["black", "Negro"], ["even", "Par"], ["odd", "Impar"], ["low", "1-18"], ["high", "19-36"], ["dozen", "Docena"], ["column", "Columna"]]
      .forEach(function (o) { const op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; typeSel.appendChild(op); });
    const valIn = document.createElement("input"); valIn.type = "number"; valIn.className = "mini-num";
    valIn.min = "0"; valIn.max = "36"; valIn.value = "0"; valIn.title = "Número (0-36) / docena (1-3) / columna (1-3)";
    const amtIn = document.createElement("input"); amtIn.type = "number"; amtIn.className = "mini-num";
    amtIn.min = String(m.minBet); amtIn.max = String(m.maxBet); amtIn.step = String(m.minBet); amtIn.value = String(m.minBet); amtIn.title = "Importe";
    cfg.appendChild(labelWrap("Apuesta", typeSel));
    cfg.appendChild(labelWrap("Valor", valIn));
    cfg.appendChild(labelWrap("Importe", amtIn));
    box.appendChild(cfg);

    const maxIn = document.createElement("input"); maxIn.type = "range";
    maxIn.className = "raise-range"; maxIn.min = String(m.minBet); maxIn.max = String(m.maxBet); maxIn.step = String(m.minBet); maxIn.value = String(m.minBet);
    maxIn.addEventListener("input", function () { amtIn.value = maxIn.value; });
    amtIn.addEventListener("input", function () { maxIn.value = amtIn.value; });
    box.appendChild(maxIn);

    const row = document.createElement("div"); row.className = "btn-row";
    row.appendChild(makeBtn("+ Añadir apuesta", "gold", function () {
      const type = typeSel.value;
      let value = Number(valIn.value);
      if ((type === "dozen" || type === "column") && (value < 1 || value > 3)) { UI.toast("Elige docena/columna 1, 2 o 3.", "error"); return; }
      if (type === "straight" && (value < 0 || value > 36)) { UI.toast("El número debe ser 0-36.", "error"); return; }
      const amount = Math.max(m.minBet, Math.min(m.maxBet, Math.floor(Number(amtIn.value) || m.minBet)));
      const tot = m.bets.reduce(function (s, b) { return s + b.amount; }, 0) + amount;
      if (tot > m.bankroll) { UI.toast("No te llega el oro.", "error"); return; }
      m.bets.push({ type: type, value: (type === "straight" || type === "dozen" || type === "column") ? value : null, amount: amount });
      if (AK.Sound) AK.Sound.play("chip");
      renderRouletteBets();
    }));
    row.appendChild(makeBtn("🗑 Limpiar", "ghost", function () { m.bets = []; renderRouletteBets(); }));
    row.appendChild(makeBtn("🎯 Girar", "primary", spinRoulette));
    row.appendChild(makeBtn("💰 Cobrar y salir", "ghost", cashOutMini));
    box.appendChild(row);
  }

  function labelWrap(text, el) {
    const w = document.createElement("label"); w.className = "mini-field";
    const s = document.createElement("span"); s.textContent = text;
    w.appendChild(s); w.appendChild(el);
    return w;
  }

  function spinRoulette() {
    const m = App.roulette;
    if (!m || m.spinning) return;
    if (!m.bets.length) { UI.toast("Añade al menos una apuesta.", "warn"); return; }
    const staked = m.bets.reduce(function (s, b) { return s + b.amount; }, 0);
    if (staked > m.bankroll) { UI.toast("No te llega el oro.", "error"); return; }
    m.bankroll -= staked; m.spinning = true;
    const n = m.wheel.spin();
    const idx = m.wheel.indexOf(n);
    const step = 360 / m.wheel.order.length;
    const desired = -(idx + 0.5) * step;
    const cur = m.angle || 0;
    const delta = ((desired - cur) % 360 + 360) % 360;
    m.angle = cur + 360 * 6 + delta;
    const rotor = $("mini-body").querySelector(".rl-rotor");
    if (rotor) { rotor.style.transition = "transform 3.4s cubic-bezier(.16,.64,.24,1)"; rotor.style.transform = "rotate(" + m.angle + "deg)"; }
    updateMiniGold();
    renderRouletteControls();
    if (AK.Sound) AK.Sound.play("chip");
    UI.sleep(3500).then(function () { settleRoulette(n); });
  }

  function settleRoulette(n) {
    const m = App.roulette;
    const res = AK.roulette.resolveBets(m.bets, n);
    m.bankroll += res.total; m.spinning = false;
    m.history.unshift(n); if (m.history.length > 12) m.history.pop();
    const el = $("rl-result"); if (el) { el.textContent = n; el.className = "rl-result " + colorClass(n); }
    const sub = $("rl-result-sub");
    if (sub) sub.textContent = n === 0 ? "CERO · verde" : (AK.roulette.isRed(n) ? "ROJO" : "NEGRO");
    const net = res.total - res.staked;
    UI.toast(net > 0 ? ("¡Ganas " + UI.formatGold(net) + "! Sale el " + n) : (net === 0 ? "Apuesta devuelta. Sale el " + n : "Sale el " + n + ". Pierdes " + UI.formatGold(res.staked) + "."),
      net > 0 ? "win" : (net === 0 ? "info" : "lose"), 3000);
    if (AK.Sound) AK.Sound.play(net > 0 ? "win" : (net < 0 ? "lose" : "check"));
    if (net > 0) UI.burstFromCenter(24);
    m.bets = [];
    updateMiniGold(); renderRouletteBets(); renderRouletteHist();
    if (m.bankroll < m.minBet) { UI.sleep(1400).then(cashOutMini); return; }
    renderRouletteControls();
  }

  /* ---------------------------- TRAGAPERRAS ---------------------------- */
  function renderSlots() {
    $("mini-body").innerHTML =
      '<div class="mini-stage sl-stage">' +
        '<div class="sl-machine">' +
          '<div class="sl-reels">' +
            '<div class="sl-reel" id="sl-r0">🍒</div><div class="sl-reel" id="sl-r1">🍋</div><div class="sl-reel" id="sl-r2">⭐</div>' +
          '</div>' +
          '<div class="sl-msg" id="sl-msg">¡Tira de la palanca!</div>' +
        '</div>' +
        '<div class="sl-paytable"><div class="mini-panel-title">Premios (× apuesta)</div>' +
          AK.SLOT_SYMBOLS.slice().reverse().map(function (s) { return '<div class="sl-pay"><span>' + s.glyph + ' ' + s.glyph + ' ' + s.glyph + '</span><b>×' + s.mult + '</b></div>'; }).join("") +
          '<div class="sl-pay"><span>🍒 🍒 ·</span><b>×1</b></div>' +
        '</div>' +
      '</div>';
    renderSlotsControls();
  }

  function renderSlotsControls() {
    const m = App.slots;
    const box = $("mini-controls"); if (!box) return;
    UI.clear(box); box.className = "mini-controls";
    if (m.spinning) return;

    const chips = document.createElement("div"); chips.className = "chip-row";
    [1, 2, 5, 10, 25].forEach(function (mult) {
      const v = m.minBet * mult;
      if (v > m.bankroll) return;
      chips.appendChild(makeBtn(UI.formatGold(v), "chip", function () {
        m.bet = Math.min(m.maxBet, Math.min(m.bankroll, v));
        range.value = m.bet; label.textContent = UI.formatGold(m.bet);
      }));
    });
    box.appendChild(chips);

    const wrap = document.createElement("div"); wrap.className = "raise-control";
    const range = document.createElement("input"); range.type = "range";
    range.min = m.minBet; range.max = Math.max(m.minBet, Math.min(m.maxBet, m.bankroll)); range.step = m.minBet;
    range.value = Math.min(m.bet, range.max);
    const label = document.createElement("span"); label.className = "raise-value"; label.textContent = UI.formatGold(range.value);
    m.bet = Number(range.value);
    range.addEventListener("input", function () { m.bet = Number(range.value); label.textContent = UI.formatGold(range.value); });
    wrap.appendChild(range); wrap.appendChild(label);
    box.appendChild(wrap);

    const row = document.createElement("div"); row.className = "btn-row";
    row.appendChild(makeBtn("🎰 Tirar", "primary", spinSlots));
    row.appendChild(makeBtn("💰 Cobrar y salir", "ghost", cashOutMini));
    row.appendChild(makeBtn("❓ Reglas", "ghost", showMiniGuide));
    box.appendChild(row);
  }

  function spinSlots() {
    const m = App.slots;
    if (!m || m.spinning) return;
    if (m.bet < m.minBet || m.bet > m.bankroll) { UI.toast("Apuesta no válida.", "error"); return; }
    m.bankroll -= m.bet; m.spinning = true;
    updateMiniGold(); renderSlotsControls();
    const res = m.machine.spin(m.bet);
    const els = [$("sl-r0"), $("sl-r1"), $("sl-r2")];
    const glyphs = AK.SLOT_SYMBOLS.map(function (s) { return s.glyph; });
    if (AK.Sound) AK.Sound.play("chip");
    const iv = window.setInterval(function () {
      els.forEach(function (e, i) { e.classList.add("spin"); e.textContent = glyphs[Math.floor(Math.random() * glyphs.length)]; });
    }, 70);
    UI.sleep(1400).then(function () {
      window.clearInterval(iv);
      els.forEach(function (e, i) { e.classList.remove("spin"); e.textContent = res.reels[i].glyph; });
      settleSlots(res);
    });
  }

  function settleSlots(res) {
    const m = App.slots;
    m.spinning = false; m.bankroll += res.payout;
    const net = res.payout - m.bet;
    const msg = $("sl-msg");
    if (res.multiplier > 1) { msg.textContent = "¡TRÍO! ×" + res.multiplier + " · +" + UI.formatGold(res.payout); msg.className = "sl-msg win"; }
    else if (res.payout > 0) { msg.textContent = "Dos cerezas · recuperas " + UI.formatGold(res.payout); msg.className = "sl-msg"; }
    else { msg.textContent = "Sin premio"; msg.className = "sl-msg lose"; }
    UI.toast(net > 0 ? ("¡Ganas " + UI.formatGold(net) + "!") : (net === 0 ? "Recuperas la apuesta." : "Pierdes " + UI.formatGold(m.bet) + "."), net > 0 ? "win" : (net === 0 ? "info" : "lose"), 2400);
    if (AK.Sound) AK.Sound.play(net > 0 ? "win" : (net < 0 ? "lose" : "check"));
    if (net > 0) UI.burstFromCenter(20);
    updateMiniGold(); renderSlotsControls();
    if (m.bankroll < m.minBet) { UI.sleep(1400).then(cashOutMini); }
  }

  /* ------------------------------ BACCARAT ----------------------------- */
  function renderBaccarat() {
    const m = App.baccarat;
    $("mini-body").innerHTML =
      '<div class="mini-stage bac-stage">' +
        '<div class="bac-table">' +
          '<div class="bac-hand"><div class="mini-panel-title"><span class="bac-side player">PUNTO</span> <b id="bac-pt">0</b></div><div class="hand bac-cards" id="bac-pcards"></div></div>' +
          '<div class="bac-hand"><div class="mini-panel-title"><span class="bac-side banker">BANCA</span> <b id="bac-bt">0</b></div><div class="hand bac-cards" id="bac-bcards"></div></div>' +
        '</div>' +
        '<div class="bac-msg" id="bac-msg">Elige Punto, Banca o Empate y reparte.</div>' +
      '</div>';
    renderBaccaratControls();
  }

  function renderBaccaratControls() {
    const m = App.baccarat;
    const box = $("mini-controls"); if (!box) return;
    UI.clear(box); box.className = "mini-controls";
    if (m.busy) return;

    const picks = document.createElement("div"); picks.className = "btn-row";
    [["player", "🟦 Punto"], ["banker", "🟥 Banca"], ["tie", "🟩 Empate"]].forEach(function (p) {
      const b = makeBtn(p[1], m.pick === p[0] ? "gold" : "ghost", function () { m.pick = p[0]; renderBaccaratControls(); });
      picks.appendChild(b);
    });
    box.appendChild(picks);

    const wrap = document.createElement("div"); wrap.className = "raise-control";
    const range = document.createElement("input"); range.type = "range";
    range.min = m.minBet; range.max = Math.max(m.minBet, Math.min(m.maxBet, m.bankroll)); range.step = m.minBet;
    range.value = Math.min(m.bet, range.max);
    const label = document.createElement("span"); label.className = "raise-value"; label.textContent = UI.formatGold(range.value);
    m.bet = Number(range.value);
    range.addEventListener("input", function () { m.bet = Number(range.value); label.textContent = UI.formatGold(range.value); });
    wrap.appendChild(range); wrap.appendChild(label);
    box.appendChild(wrap);

    const row = document.createElement("div"); row.className = "btn-row";
    row.appendChild(makeBtn("🃏 Repartir", "primary", dealBaccarat));
    row.appendChild(makeBtn("💰 Cobrar y salir", "ghost", cashOutMini));
    row.appendChild(makeBtn("❓ Reglas", "ghost", showMiniGuide));
    box.appendChild(row);
  }

  function dealBaccarat() {
    const m = App.baccarat;
    if (!m || m.busy) return;
    if (m.bet < m.minBet || m.bet > m.bankroll) { UI.toast("Apuesta no válida.", "error"); return; }
    m.bankroll -= m.bet; m.busy = true;
    updateMiniGold(); renderBaccaratControls();
    const h = m.table.deal();
    const pc = $("bac-pcards"), bc = $("bac-bcards");
    UI.clear(pc); UI.clear(bc);
    const seq = [[pc, h.player[0]], [bc, h.banker[0]], [pc, h.player[1]], [bc, h.banker[1]]];
    if (h.player[2]) seq.push([pc, h.player[2]]);
    if (h.banker[2]) seq.push([bc, h.banker[2]]);
    seq.forEach(function (s, i) {
      UI.sleep(250 * (i + 1)).then(function () { UI.dealCard(s[0], s[1], { down: false }); if (AK.Sound) AK.Sound.play("deal"); });
    });
    UI.sleep(250 * (seq.length + 1)).then(function () { settleBaccarat(h); });
  }

  function settleBaccarat(h) {
    const m = App.baccarat;
    $("bac-pt").textContent = h.playerTotal;
    $("bac-bt").textContent = h.bankerTotal;
    const payout = m.table.payout(m.pick, m.bet, h.winner);
    m.bankroll += payout; m.busy = false;
    const net = payout - m.bet;
    const wname = h.winner === "player" ? "Punto" : (h.winner === "banker" ? "Banca" : "Empate");
    let txt = "Gana " + wname + " — Punto " + h.playerTotal + " · Banca " + h.bankerTotal + ".";
    const msg = $("bac-msg");
    if (h.winner === "tie") { msg.textContent = txt + (m.pick === "tie" ? " ¡Pagado 8:1!" : " Apuesta devuelta."); msg.className = "bac-msg win"; }
    else if (m.pick === h.winner) { msg.textContent = txt + " ¡Acertaste!"; msg.className = "bac-msg win"; }
    else { msg.textContent = txt + " No acertaste."; msg.className = "bac-msg lose"; }
    UI.toast(net > 0 ? ("¡Ganas " + UI.formatGold(net) + "!") : (net === 0 ? "Recuperas la apuesta." : "Pierdes " + UI.formatGold(m.bet) + "."), net > 0 ? "win" : (net === 0 ? "info" : "lose"), 2600);
    if (AK.Sound) AK.Sound.play(net > 0 ? "win" : (net < 0 ? "lose" : "check"));
    if (net > 0) UI.burstFromCenter(22);
    updateMiniGold(); renderBaccaratControls();
    if (m.bankroll < m.minBet) { UI.sleep(1400).then(cashOutMini); }
  }

  /* -------------------------------- DADOS ------------------------------ */
  function renderDice() {
    $("mini-body").innerHTML =
      '<div class="mini-stage dice-stage">' +
        '<div class="dice-arena">' +
          '<div class="dice-row"><div class="die" id="die0">🎲</div><div class="die" id="die1">🎲</div><div class="die" id="die2">🎲</div></div>' +
          '<div class="dice-msg" id="dice-msg">Apuesta y lanza los dados.</div>' +
        '</div>' +
        '<div class="dice-side rl-side right"><div class="mini-panel-title">Apuestas</div><div id="dice-bets" class="mini-betlist"></div></div>' +
      '</div>';
    renderDiceBets();
    renderDiceControls();
  }

  function renderDiceBets() {
    const m = App.dice;
    const box = $("dice-bets"); if (!box) return;
    UI.clear(box);
    if (!m.bets.length) { box.innerHTML = '<div class="mini-empty">Sin apuestas todavía</div>'; return; }
    m.bets.forEach(function (b, i) {
      const row = document.createElement("div"); row.className = "mini-bet";
      row.innerHTML = '<span>' + AK.dice.label(b) + '</span><b>' + UI.formatGold(b.amount) + ' 🪙</b>';
      row.appendChild(makeBtn("✕", "ghost small", function () { m.bets.splice(i, 1); renderDiceBets(); }));
      box.appendChild(row);
    });
    const tot = m.bets.reduce(function (s, b) { return s + b.amount; }, 0);
    const t = document.createElement("div"); t.className = "mini-bet-total";
    t.innerHTML = "Total apostado: <b>" + UI.formatGold(tot) + " 🪙</b>";
    box.appendChild(t);
  }

  function renderDiceControls() {
    const m = App.dice;
    const box = $("mini-controls"); if (!box) return;
    UI.clear(box); box.className = "mini-controls";
    if (m.rolling) return;

    const cfg = document.createElement("div"); cfg.className = "mini-cfg";
    const typeSel = document.createElement("select"); typeSel.className = "mini-select";
    [["small", "Pequeño (4-10)"], ["big", "Grande (11-17)"], ["odd", "Impar"], ["even", "Par"], ["triple", "Triple"], ["total", "Total exacto"], ["single", "Número suelto"]]
      .forEach(function (o) { const op = document.createElement("option"); op.value = o[0]; op.textContent = o[1]; typeSel.appendChild(op); });
    const valIn = document.createElement("input"); valIn.type = "number"; valIn.className = "mini-num"; valIn.min = "1"; valIn.max = "18"; valIn.value = "1"; valIn.title = "Total (4-17) o número (1-6)";
    const amtIn = document.createElement("input"); amtIn.type = "number"; amtIn.className = "mini-num"; amtIn.min = String(m.minBet); amtIn.max = String(m.maxBet); amtIn.step = String(m.minBet); amtIn.value = String(m.minBet);
    cfg.appendChild(labelWrap("Apuesta", typeSel));
    cfg.appendChild(labelWrap("Valor", valIn));
    cfg.appendChild(labelWrap("Importe", amtIn));
    box.appendChild(cfg);

    const row = document.createElement("div"); row.className = "btn-row";
    row.appendChild(makeBtn("+ Añadir apuesta", "gold", function () {
      const type = typeSel.value;
      const value = Number(valIn.value);
      if (type === "total" && (value < 4 || value > 17)) { UI.toast("El total debe ser 4-17.", "error"); return; }
      if (type === "single" && (value < 1 || value > 6)) { UI.toast("El número debe ser 1-6.", "error"); return; }
      const amount = Math.max(m.minBet, Math.min(m.maxBet, Math.floor(Number(amtIn.value) || m.minBet)));
      const tot = m.bets.reduce(function (s, b) { return s + b.amount; }, 0) + amount;
      if (tot > m.bankroll) { UI.toast("No te llega el oro.", "error"); return; }
      m.bets.push({ type: type, value: (type === "total" || type === "single") ? value : null, amount: amount });
      if (AK.Sound) AK.Sound.play("chip");
      renderDiceBets();
    }));
    row.appendChild(makeBtn("🗑 Limpiar", "ghost", function () { m.bets = []; renderDiceBets(); }));
    row.appendChild(makeBtn("🎲 Tirar", "primary", rollDice));
    row.appendChild(makeBtn("💰 Cobrar y salir", "ghost", cashOutMini));
    box.appendChild(row);
  }

  function rollDice() {
    const m = App.dice;
    if (!m || m.rolling) return;
    if (!m.bets.length) { UI.toast("Añade al menos una apuesta.", "warn"); return; }
    const staked = m.bets.reduce(function (s, b) { return s + b.amount; }, 0);
    if (staked > m.bankroll) { UI.toast("No te llega el oro.", "error"); return; }
    m.bankroll -= staked; m.rolling = true;
    updateMiniGold(); renderDiceControls();
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const els = [$("die0"), $("die1"), $("die2")];
    els.forEach(function (e) { e.classList.add("rolling"); });
    if (AK.Sound) AK.Sound.play("chip");
    const iv = window.setInterval(function () {
      els.forEach(function (e) { e.textContent = faces[Math.floor(Math.random() * 6)]; });
    }, 80);
    UI.sleep(1200).then(function () {
      window.clearInterval(iv);
      const d = AK.dice.roll();
      els.forEach(function (e, i) { e.classList.remove("rolling"); e.textContent = faces[d[i] - 1]; });
      settleDice(d, staked);
    });
  }

  function settleDice(d, staked) {
    const m = App.dice;
    const res = AK.dice.resolveBets(m.bets, d);
    m.bankroll += res.total; m.rolling = false;
    const total = d[0] + d[1] + d[2];
    const net = res.total - staked;
    const msg = $("dice-msg");
    msg.textContent = "Dados " + d.join(" + ") + " = " + total + (AK.dice.isTriple(d) ? " (¡TRIPLE!)" : "");
    msg.className = "dice-msg " + (net > 0 ? "win" : (net < 0 ? "lose" : ""));
    UI.toast(net > 0 ? ("¡Ganas " + UI.formatGold(net) + "!") : (net === 0 ? "Recuperas la apuesta." : "Pierdes " + UI.formatGold(staked) + "."), net > 0 ? "win" : (net === 0 ? "info" : "lose"), 2600);
    if (AK.Sound) AK.Sound.play(net > 0 ? "win" : (net < 0 ? "lose" : "check"));
    if (net > 0) UI.burstFromCenter(22);
    m.bets = [];
    updateMiniGold(); renderDiceBets();
    if (m.bankroll < m.minBet) { UI.sleep(1400).then(cashOutMini); return; }
    renderDiceControls();
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
