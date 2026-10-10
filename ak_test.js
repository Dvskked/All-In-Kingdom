/* Prueba de humo de la logica de All-In Kingdom v2 en Node. */
global.window = global;
global.window.addEventListener = function () {};

const path = require("path");
const base = "F:/All-In Kingdom/js/";
["deck.js", "poker.js", "blackjack.js", "ai.js", "progression.js", "characters.js", "ui.js"].forEach(function (f) {
  require(path.join(base, f));
});

const AK = global.AK;
let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures++; console.log("FALLO: " + msg); }
  else console.log("ok  : " + msg);
}

/* ---- 1. Baraja ---- */
const d = new AK.Deck();
assert(d.cards.length === 52, "baraja de 52 cartas");
const drawn = d.drawMany(5);
assert(drawn.length === 5 && d.cards.length === 47, "robar cartas descuenta el mazo");
assert(AK.RANK_KEYS.length === 13 && AK.SUIT_KEYS.length === 4, "rangos y palos exportados (IA)" );

/* ---- 2. Evaluador de manos ---- */
function C(rank, suit) { return AK.makeCard(rank, suit); }

const royal = AK.bestHand([C("A","spades"),C("K","spades"),C("Q","spades"),C("J","spades"),C("10","spades")]);
assert(royal.name === "Escalera de Color", "royal flush detectada -> " + royal.name);

const full = AK.bestHand([C("K","hearts"),C("K","clubs"),C("K","diamonds"),C("7","spades"),C("7","hearts"),C("2","clubs"),C("3","diamonds")]);
assert(full.name === "Full House", "full house detectado -> " + full.name);

const flush = AK.bestHand([C("A","hearts"),C("J","hearts"),C("8","hearts"),C("5","hearts"),C("2","hearts"),C("K","clubs"),C("9","spades")]);
assert(flush.name === "Color", "color detectado -> " + flush.name);

const wheel = AK.evaluate5([C("A","spades"),C("2","hearts"),C("3","diamonds"),C("4","clubs"),C("5","spades")]);
assert(wheel.name === "Escalera", "escalera A-2-3-4-5 (rueda) -> " + wheel.name);

const quads = AK.evaluate5([C("9","spades"),C("9","hearts"),C("9","diamonds"),C("9","clubs"),C("2","spades")]);
assert(quads.name === "Póquer", "poquer detectado -> " + quads.name);

const a = AK.bestHand([C("A","hearts"),C("A","spades"),C("K","hearts"),C("K","spades"),C("2","clubs")]);
const b = AK.bestHand([C("Q","hearts"),C("Q","spades"),C("J","hearts"),C("J","spades"),C("3","clubs")]);
assert(a.score > b.score, "doble pareja A-K supera a Q-J");

/* ---- 3. Texas Hold'em MULTIJUGADOR (4 jugadores, IA vs IA) ---- */
function makePlayers(n, base) {
  return Array.from({ length: n }).map(function (_, i) {
    const prof = ["facil", "medio", "dificil", "agresivo"][i % 4];
    return { name: "Bot " + i, stack: base, profile: prof, isHuman: false, quips: { win: ["w"], lose: ["l"], bet: ["b"], allin: ["a"] } };
  });
}
const table = new AK.PokerTable({ players: makePlayers(4, 1500), smallBlind: 10, bigBlind: 20 });
const TOTAL = table.players.reduce(function (s, p) { return s + p.stack; }, 0);
let hands = 0, chipErrors = 0, sidePotSeen = false;

while (hands < 120 && table.playersWithChips().length >= 2) {
  if (!table.newHand()) break;
  let guard = 0, handResult = null;
  while (guard++ < 400) {
    /* Conservacion de fichas dentro de la mano */
    if (table.chipsInPlay() !== TOTAL) chipErrors++;

    const ev0 = table.advanceIfNeeded();
    if (ev0 && (ev0.type === "foldwin" || ev0.type === "showdown")) { handResult = ev0; break; }
    if (ev0 && ev0.type === "phase") continue;

    const p = table.currentPlayer();
    if (!p || p.folded || p.allIn || p.stack <= 0) continue;

    const prof = AK.AI_PROFILES[p.profile] || AK.AI_PROFILES.medio;
    const choice = AK.decideAction(table, prof);
    const ev = table.act(choice.type, choice.amount);
    if (ev && (ev.type === "foldwin" || ev.type === "showdown")) { handResult = ev; break; }
  }

  if (handResult && handResult.type === "showdown") {
    const committed = table.players.reduce(function (s, p) { return s + p.committed; }, 0);
    const potsSum = handResult.pots.reduce(function (s, p) { return s + p.amount; }, 0);
    if (handResult.pots.length > 1) sidePotSeen = true;
    if (potsSum !== committed) chipErrors++;
    if (table.chipsInPlay() !== TOTAL) chipErrors++;
  } else if (handResult && handResult.type === "foldwin") {
    if (table.chipsInPlay() !== TOTAL) chipErrors++;
  }
  hands++;
}
assert(chipErrors === 0, "conservacion de fichas en 4 jugadores durante " + hands + " manos (errores=" + chipErrors + ")");
assert(hands > 0, "se jugaron manos de poker multijugador: " + hands);
assert(table.players.every(function (p) { return p.stack >= 0; }), "ningun stack negativo");
console.log("   stacks finales -> " + table.players.map(function (p) { return p.name + ":" + p.stack; }).join(" "));
console.log("   manos=" + hands + " | side pots vistos=" + sidePotSeen);

/* Side pot real: jugador corto ALL-IN, dos largos siguen apostando */
(function () {
  const t2 = new AK.PokerTable({ players: makePlayers(3, 1000), smallBlind: 5, bigBlind: 10 });
  t2.newHand();
  const players = t2.players;
  /* Todos igualan la ciega, luego P0 apuesta 100 restantes (all-in corto) */
  const idx0 = t2.toAct;
  function actSeat(seat, type, amount) {
    while (t2.currentPlayer() && t2.currentPlayer().seat !== seat) t2.advanceIfNeeded();
    const ev = t2.act(type, amount);
    return ev;
  }
  /* Iguala la ciega grande P0 */
  actSeat(idx0, "call");
  actSeat(t2.currentPlayer().seat, "call");
  actSeat(t2.currentPlayer().seat, "call");
  /* P1 sube a 100 total, P2 paga, P0 all-in por 100 */
  actSeat(t2.currentPlayer().seat, "raise", 100);
  actSeat(t2.currentPlayer().seat, "call", 100);
  actSeat(t2.currentPlayer().seat, "allin", 0);
  while (t2.phase !== "showdown") {
    const ev0 = t2.advanceIfNeeded();
    if (ev0 && (ev0.type === "foldwin" || ev0.type === "showdown")) break;
    const p = t2.currentPlayer();
    if (!p || p.allIn || p.folded) continue;
    const acts = t2.availableActions();
    const r = acts.find(function (x) { return x.type === "raise"; });
    const ev = r ? t2.act("raise", r.min)
                 : (acts.find(function (x) { return x.type === "call"; }) ? t2.act("call", 0) : t2.act("check", 0));
    if (ev && (ev.type === "foldwin" || ev.type === "showdown")) break;
  }
  const sumAfter = t2.chipsInPlay();
  assert(sumAfter === 3000, "side pot: las fichas vuelven a repartirse (total=" + sumAfter + ")");
})();

/* ---- 4. Blackjack (motor v1 intacto, se comprueba re-registro) ---- */
const bj = new AK.BlackjackTable({ numDecks: 6 });
let wins = 0, losses = 0, pushes = 0, bjErrs = 0;
for (let i = 0; i < 200; i++) {
  bj.newRound(10);
  let guard = 0;
  while (bj.state === "player" && guard++ < 30) {
    const pv = bj.playerValue();
    if (pv.total < 17) { bj.hit(); }
    else if (pv.total === 17 || pv.total === 18) {
      if (Math.random() < 0.5 && bj.canDouble()) bj.double(); else bj.stand();
    } else { bj.stand(); }
  }
  if (bj.state !== "done") { bjErrs++; continue; }
  if (bj.result.outcome === "win" || bj.result.outcome === "blackjack") wins++;
  else if (bj.result.outcome === "lose") losses++;
  else pushes++;
  const dv = bj.result.dealer;
  const pvFinal = bj.result.player;
  const playerBust = pvFinal.total > 21;
  const playerNatural = pvFinal.isBlackjack;
  if (!playerBust && !playerNatural && !dv.isBlackjack && dv.total < 17) bjErrs++;
}
assert(bjErrs === 0, "200 rondas de blackjack sin estados invalidos (errores=" + bjErrs + ")");
console.log("   blackjack -> victorias " + wins + " | derrotas " + losses + " | empates " + pushes);

/* ---- 5. Progresion (ciudades, bots, guardado) ---- */
assert(AK.CITIES.length === 12, "doce ciudades en la ruta -> " + AK.CITIES.length);
assert(AK.CITIES[0].unlockGold === 0, "Villa Fichas empieza desbloqueada");
const st = AK.defaultPlayer();
assert(st.photo === "" && st.face === null, "defaultPlayer trae foto vacia y personaje por generar");
st.gold = 20000;
assert(AK.isCityUnlocked(st, AK.CITIES[0]) && AK.isCityUnlocked(st, AK.CITIES[4]) && !AK.isCityUnlocked(st, AK.CITIES[5]),
  "desbloqueo por oro: villa(0) y montecarlo(10000) si, tokio(30000) no");
const bots = AK.pickBots(3, 5);
assert(bots.length === 5, "pickBots devuelve 5 rivales para mesa de 6");
assert(bots.every(function (b) { return b.quips && b.quips.win && b.quips.lose && b.profile; }), "bots con personalidad y frases");
assert(bots.every(function (b) { return b.face && typeof b.face === "object" && b.face.skin && b.face.mouth; }), "bots con rostro (rasgos 3D)");
assert(AK.tableById("villa", "v1").table.game === "poker", "tableById encuentra la mesa del pozo");
assert(AK.tableById("villa", "v1").table.buyIn === 100, "entrada barata en Villa (100) -> " + AK.tableById("villa", "v1").table.buyIn);
assert(AK.CITIES.filter(function (c) { return c.casinos.length > 0; }).length === 12, "todas las ciudades con casino");

/* ---- 5b. Personajes (rostros SVG) ---- */
const face = AK.Characters.randomFace();
assert(face.skin && face.hair && face.mouth && face.eyes && face.brow, "randomFace genera rasgos completos");
assert(AK.Characters.DEFAULT_FACE() && AK.Characters.DEFAULT_FACE().skin, "DEFAULT_FACE util");
assert(AK.Characters.headHTML(face).indexOf("<svg") === 0, "headHTML genera un SVG con el rostro");
assert(AK.Characters.headHTML().indexOf("<svg") === 0, "headHTML funciona sin cara (usa la por defecto)");

/* ---- 6. UI (formato de oro) ---- */
assert(AK.UI.formatGold(1234567) === "1.234.567", "formatGold separa miles -> " + AK.UI.formatGold(1234567));
assert(AK.UI.formatGold(0) === "0", "formatGold con ceros -> " + AK.UI.formatGold(0));

console.log("\n" + (failures === 0 ? "TODO OK ✅" : failures + " FALLOS ❌"));
process.exit(failures === 0 ? 0 : 1);