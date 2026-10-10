/* ==========================================================================
 * ALL-IN KINGDOM  ·  progression.js
 * Ciudades casino, casinos, mesas, personajes (con rostro) y guardado.
 * ========================================================================== */
(function (global) {
  "use strict";

  const AK = (global.AK = global.AK || {});

  /* ------------------------------------------------------------------ *
   *  PERSONAJES (bots). Cada uno tiene CARA (rasgos dibujados), color,   *
   *  personalidad y frases.  tier = ciudad mínima donde aparece.        *
   * ------------------------------------------------------------------ */
  const CHARACTERS = [
    /* ---- tier 1 · Villa Fichas ---- */
    { id: "rusty", name: "Rusty", title: "El Aprendiz", tier: 1, profile: "facil", color: "#8d99a4",
      face: { skin: "#d8d2c8", hair: "buzz", hairColor: "#17140f", eyes: "#1c1c22", mouth: "smile", brow: "flat", facial: "none", acc: "headphones" },
      win: ["¡Hasta un reloj roto acierta dos veces al día!"], lose: ["Otra vez... ¡me falta práctica!"], bet: ["Voy con esta, valiente."], allin: ["¡AL TRAGAPERRAS! digo... ¡ALL-IN!"] },
    { id: "peta", name: "Doña Peta", title: "La Abuela del Farol", tier: 1, profile: "conservador", color: "#d98fb0",
      face: { skin: "#ecc398", hair: "bun", hairColor: "#d8d2c8", eyes: "#4a2e18", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["En mis tiempos también ganaba al mus, cielito."], lose: ["Ay, mi cadera... y mis fichas."], bet: ["Una apuestita suave, que hay que cuidar."], allin: ["¡Ni que fuera la lotería del pueblo!"] },
    { id: "tomas", name: "Tractor Tomás", title: "El Granjero", tier: 1, profile: "facil", color: "#7cab56",
      face: { skin: "#d9a273", hair: "short", hairColor: "#82491f", eyes: "#5a3a1c", mouth: "grin", brow: "flat", facial: "stubble", acc: "none" },
      win: ["¡Como cosechar en agosto!"], lose: ["Se me ha ido el tractor, digo el bote."], bet: ["Arriesgo un surquito de fichas."], allin: ["¡Todo el granero al bote!"] },

    /* ---- tier 2 · Puerto Azar / Madrid / Cartagena ---- */
    { id: "ancla", name: "Capitán Ancla", title: "El Lobo de Mar", tier: 2, profile: "medio", color: "#4e7fa8",
      face: { skin: "#cf8f5f", hair: "ponytail", hairColor: "#4a2c18", eyes: "#3a2416", mouth: "smirk", brow: "angled", facial: "beard", acc: "eyepatch" },
      win: ["¡Levo anclas con tu oro, grumete!"], lose: ["Abandonamos el barco... otra vez."], bet: ["Sube la marea de fichas."], allin: ["¡Nos hundimos o navegamos: ALL-IN!"] },
    { id: "lola", name: "Lola", title: "La Escandalosa", tier: 2, profile: "agresivo", color: "#e0568b",
      face: { skin: "#ecc398", hair: "long", hairColor: "#b23a48", eyes: "#241a12", mouth: "laugh", brow: "angled", facial: "none", acc: "earring" },
      win: ["¡Olé, olé y olé!"], lose: ["¡Qué desastre! ¡Que alguien me abanique!"], bet: ["¡Subo, que esto está muy soso!"], allin: ["¡ALL-IN, corazón! ¡Sin miedo!"] },
    { id: "simon", name: "Marino Simón", title: "El Tatuado", tier: 2, profile: "farolero", color: "#3f7d8c",
      face: { skin: "#c08248", hair: "short", hairColor: "#2c3e50", eyes: "#3a548a", mouth: "poker", brow: "flat", facial: "soulpatch", acc: "earring" },
      win: ["El pulpo veía tus cartas... y tu miedo."], lose: ["Me han leído el tentáculo."], bet: ["Esta mano huele a premio."], allin: ["¡Ocho brazos, ocho ALL-IN!"] },
    { id: "rosalia", name: "Rosa Lía", title: "La del Cante", tier: 2, profile: "dificil", color: "#b06fce",
      face: { skin: "#e3b184", hair: "long", hairColor: "#17140f", eyes: "#3a2416", mouth: "smirk", brow: "angled", facial: "none", acc: "earring" },
      win: ["El duende me lleva en volandas."], lose: ["El cante se me ha atragantado."], bet: ["Una bulería de apuesta."], allin: ["¡Alegrías y ALL-IN!"] },
    { id: "torero", name: "El Torero", title: "De Sevilla", tier: 2, profile: "agresivo", color: "#e8c15a",
      face: { skin: "#d9a273", hair: "curly", hairColor: "#17140f", eyes: "#3a2416", mouth: "serious", brow: "flat", facial: "mustache", acc: "none" },
      win: ["Olé, olé y olé, torerazo."], lose: ["Este farol me ha cogido el capote."], bet: ["Doy un pase de más."], allin: ["¡Al tendido con todo: ALL-IN!"] },
    { id: "loba", name: "La Loba", title: "De Barranquilla", tier: 2, profile: "agresivo", color: "#e0568b",
      face: { skin: "#ecc398", hair: "curly", hairColor: "#cf9238", eyes: "#3a548a", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["Las caderas mandan... y también mis cartas."], lose: ["Hasta las lobas muerden en falso."], bet: ["Esto me mueve las caderas."], allin: ["¡Rugido total: ALL-IN!"] },
    { id: "sofia", name: "Doña Sofía", title: "La Estrella de Hollywood", tier: 2, profile: "dificil", color: "#ef7bd0",
      face: { skin: "#e0a878", hair: "long", hairColor: "#e0aa3e", eyes: "#2a5a3a", mouth: "grin", brow: "soft", facial: "none", acc: "earring" },
      win: ["¡En la tele y en la mesa se triunfa!"], lose: ["¡Pero qué papelón!"], bet: ["Actúo, luego apuesto."], allin: ["¡A escena con todo: ALL-IN!"] },
    { id: "james", name: "James el 10", title: "El Mediocampista", tier: 2, profile: "medio", color: "#f5c542",
      face: { skin: "#d1956b", hair: "fade", hairColor: "#17140f", eyes: "#3a2416", mouth: "serious", brow: "flat", facial: "stubble", acc: "none" },
      win: ["Golazo de bote."], lose: ["Este partido se me fue a penaltis."], bet: ["Tiro a puerta."], allin: ["¡La final se juega con todo: ALL-IN!"] },

    /* ---- tier 3 · Monte Carlo ---- */
    { id: "colette", name: "Madame Colette", title: "La Condesa", tier: 3, profile: "dificil", color: "#b06fce",
      face: { skin: "#f3cfa6", hair: "bun", hairColor: "#d8d2c8", eyes: "#3a548a", mouth: "smirk", brow: "soft", facial: "none", acc: "earring" },
      win: ["En Montecarlo no se pierde, se aprende... yo ya sé."], lose: ["C'est impossible... ¡revancher!"], bet: ["Apostemos con elegancia, por favor."], allin: ["El buen gusto exige un ALL-IN."] },
    { id: "vincent", name: "Conde Vincent", title: "El Aristócrata", tier: 3, profile: "conservador", color: "#8ecae6",
      face: { skin: "#efd2b0", hair: "short", hairColor: "#17140f", eyes: "#4a2e18", mouth: "serious", brow: "flat", facial: "mustache", acc: "glasses" },
      win: ["La prudencia es la reina de las virtudes."], lose: ["Qué vulgar resultado..."], bet: ["Una cifra... comedida."], allin: ["No suelo, pero la sangre llama."] },
    { id: "cero", name: "Monsieur Cero", title: "El Banquero", tier: 3, profile: "medio", color: "#c9a227",
      face: { skin: "#e3b184", hair: "bald", hairColor: "#b9b4ad", eyes: "#241a12", mouth: "poker", brow: "angled", facial: "mustache", acc: "glasses" },
      win: ["Los intereses se pagan solos."], lose: ["Quiebra técnica, caballeros."], bet: ["Invierto una cantidad razonable."], allin: ["Todo al vacío financiero."] },
    { id: "canelo", name: "El Canelo", title: "El Campeón", tier: 3, profile: "agresivo", color: "#e76f51",
      face: { skin: "#c08248", hair: "short", hairColor: "#c1512b", eyes: "#4a2e18", mouth: "serious", brow: "angled", facial: "beard", acc: "none" },
      win: ["¡A la lona esa mano!"], lose: ["Este round lo pierdo yo."], bet: ["Directo al hígado del bote."], allin: ["¡Campana final: ALL-IN!"] },
    { id: "adele", name: "Adele G.", title: "La Voz de Londres", tier: 3, profile: "medio", color: "#b06fce",
      face: { skin: "#f3cfa6", hair: "curly", hairColor: "#cf9238", eyes: "#2c3a5a", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["Hello, bote."], lose: ["Somebody like you... me ganó."], bet: ["Rolling in the chips."], allin: ["¡We could have had it all: ALL-IN!"] },
    { id: "zizou", name: "Zizou", title: "El Maestro del Cabeceo", tier: 3, profile: "dificil", color: "#3f7d8c",
      face: { skin: "#d1956b", hair: "bald", hairColor: "#17140f", eyes: "#2c3a5a", mouth: "serious", brow: "flat", facial: "beard", acc: "none" },
      win: ["Una croqueta y a casita."], lose: ["Me expulsaron del bote."], bet: ["Tiro una falta de oro."], allin: ["¡Cabezazo final: ALL-IN!"] },

    /* ---- tier 4 · Tokio / Moscú / Dubái ---- */
    { id: "rashid", name: "Sheikh Al-Rashid", title: "El Magnate", tier: 4, profile: "agresivo", color: "#e8c15a",
      face: { skin: "#c99a6b", hair: "headwrap", hairColor: "#17140f", eyes: "#241a12", mouth: "smirk", brow: "angled", facial: "beard", acc: "none" },
      win: ["El desierto da y quita... hoy me dio."], lose: ["Buen negocio el tuyo, felicidades."], bet: ["Subo, el oro no me asusta."], allin: ["Compro la mano entera: ALL-IN."] },
    { id: "zafira", name: "Zafira", title: "La Joya del Golfo", tier: 4, profile: "dificil", color: "#f2b705",
      face: { skin: "#e0b083", hair: "long", hairColor: "#8a3620", eyes: "#6b4620", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["Brillante, ¿verdad? Como yo."], lose: ["Hasta una joya tiene un mal día."], bet: ["Apostar es un arte, y yo lo domino."], allin: ["El brillo de un ALL-IN no se apaga."] },
    { id: "hassan", name: "Hassan", title: "El Halcón", tier: 4, profile: "farolero", color: "#d4a24a",
      face: { skin: "#c08a55", hair: "fade", hairColor: "#17140f", eyes: "#3a2416", mouth: "serious", brow: "angled", facial: "stubble", acc: "none" },
      win: ["El halcón no pestañea."], lose: ["Buena presa eres, chamán."], bet: ["Mi halcón me dice que apueste."], allin: ["Vuela alto: ALL-IN."] },
    { id: "yuki", name: "Yuki", title: "La Señora del Neón", tier: 4, profile: "conservador", color: "#20a0d8",
      face: { skin: "#f3cfa6", hair: "bob", hairColor: "#17140f", eyes: "#3a2416", mouth: "smile", brow: "soft", facial: "none", acc: "headband" },
      win: ["El neón siempre me ilumina."], lose: ["Me apagaron la luz."], bet: ["Una apuesta kawaii."], allin: ["¡Todo el karaoke al bote: ALL-IN!"] },
    { id: "kenji", name: "Kenji", title: "El Samurái del Chip", tier: 4, profile: "dificil", color: "#e0568b",
      face: { skin: "#ecc398", hair: "bun", hairColor: "#17140f", eyes: "#241a12", mouth: "poker", brow: "angled", facial: "none", acc: "none" },
      win: ["El camino del farol es recto."], lose: ["La espada se me ha caído."], bet: ["Una katana por el bote."], allin: ["¡Seppuku de fichas: ALL-IN!"] },
    { id: "anna", name: "Anna K.", title: "La Perla del Tennis", tier: 4, profile: "facil", color: "#f5c542",
      face: { skin: "#f3cfa6", hair: "ponytail", hairColor: "#e0aa3e", eyes: "#3a548a", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["¡Match point ganado!"], lose: ["Double fault, menudo fallo."], bet: ["Saca ventaja."], allin: ["¡Gran Slam al bote: ALL-IN!"] },
    { id: "maria", name: "María S.", title: "La Sirena del Slam", tier: 4, profile: "dificil", color: "#8ecae6",
      face: { skin: "#f3cfa6", hair: "long", hairColor: "#cf9238", eyes: "#2c3a5a", mouth: "smirk", brow: "angled", facial: "none", acc: "headband" },
      win: ["El grito vencedor es mío."], lose: ["El grito... se volvió en mi contra."], bet: ["Servicio potente."], allin: ["¡Aces por todas partes: ALL-IN!"] },
    { id: "boris", name: "Zar Boris", title: "El Oso del All-In", tier: 4, profile: "agresivo", color: "#cf2534",
      face: { skin: "#f6d8bc", hair: "bald", hairColor: "#d8d2c8", eyes: "#3a548a", mouth: "serious", brow: "flat", facial: "beard", acc: "none" },
      win: ["El oso se come el bote."], lose: ["Un invierno duro, camarada."], bet: ["Se sube como el vodka."], allin: ["¡Toda la estepa al centro: ALL-IN!"] },

    /* ---- tier 5 · Nueva York / Vancouver / Macao ---- */
    { id: "wang", name: "Wang", title: "El Silencioso", tier: 5, profile: "dificil", color: "#e23b3b",
      face: { skin: "#f3cfa6", hair: "short", hairColor: "#17140f", eyes: "#3a2416", mouth: "poker", brow: "flat", facial: "none", acc: "glasses" },
      win: ["..."], lose: ["...respeto."], bet: ["..."], allin: ["...ALL-IN..."] },
    { id: "mei", name: "Mei", title: "La Flor de Macao", tier: 5, profile: "medio", color: "#ef7bd0",
      face: { skin: "#f3cfa6", hair: "ponytail", hairColor: "#17140f", eyes: "#3a2416", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["La flor se abre para quien la cuida."], lose: ["Pétalos al viento..."], bet: ["Una flor por cada ficha."], allin: ["¡Toda la primavera al bote!"] },
    { id: "triada", name: "Señor H", title: "El Triada", tier: 5, profile: "agresivo", color: "#b02a2a",
      face: { skin: "#d9a273", hair: "buzz", hairColor: "#17140f", eyes: "#1c1c22", mouth: "serious", brow: "angled", facial: "beard", acc: "shades" },
      win: ["En Macao, la suerte se compra."], lose: ["Alguien pagará por esto."], bet: ["Negocio es negocio."], allin: ["Rojo como el sobre: ALL-IN."] },
    { id: "reyna", name: "Reyna B.", title: "La Reina del Pop", tier: 5, profile: "dificil", color: "#f5c542",
      face: { skin: "#a66a35", hair: "curly", hairColor: "#17140f", eyes: "#4a2e18", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["El mundo es mío, bébete el bote."], lose: ["Aún yo compro el mundo."], bet: ["Flawless apuesta."], allin: ["¡I woke up like this: ALL-IN!"] },
    { id: "taima", name: "Taima Swift", title: "La Letrista del Farol", tier: 5, profile: "farolero", color: "#8ecae6",
      face: { skin: "#f3cfa6", hair: "curly", hairColor: "#c1512b", eyes: "#2c3a5a", mouth: "smirk", brow: "soft", facial: "none", acc: "none" },
      win: ["Esto es un escribiendo... un hit."], lose: ["Mi mejor letra la robó el bote."], bet: ["Apuesto en clave de coro."], allin: ["¡Un clásico de mi autoría: ALL-IN!"] },
    { id: "kobra", name: "Kobra", title: "La Mamba del Pívot", tier: 5, profile: "dificil", color: "#7b2ff7",
      face: { skin: "#b27a4a", hair: "fade", hairColor: "#17140f", eyes: "#241a12", mouth: "poker", brow: "angled", facial: "goatee", acc: "none" },
      win: ["El Mamba está siempre hambriento."], lose: ["Un sello más en la derrota."], bet: ["Irresponsablemente bueno."], allin: ["¡Mamba out... a por el bote: ALL-IN!"] },
    { id: "pool", name: "Pool", title: "El Chistoso Inmortal", tier: 5, profile: "farolero", color: "#cf2534",
      face: { skin: "#f3cfa6", hair: "short", hairColor: "#6b3d1f", eyes: "#2c3a5a", mouth: "smirk", brow: "soft", facial: "stubble", acc: "shades" },
      win: ["El que paga manda... o eso dice mi mánager."], lose: ["Ayer sí maté... al arrepentimiento."], bet: ["Apuesto como quien no quiere la cosa."], allin: ["¡Máxima locura: ALL-IN!"] },
    { id: "cuki", name: "Cuki", title: "El Pequeño del Pop", tier: 5, profile: "facil", color: "#20a0d8",
      face: { skin: "#f3cfa6", hair: "bob", hairColor: "#6b3d1f", eyes: "#3a548a", mouth: "grin", brow: "soft", facial: "none", acc: "none" },
      win: ["Uhh, otro día siguiente."], lose: ["Nobody pero al revés: me ganaron."], bet: ["Apuesta con la suerte de un single."], allin: ["¡Sorry, va con todo: ALL-IN!"] },
    { id: "celine", name: "Céline", title: "La Diva de la Voz", tier: 5, profile: "conservador", color: "#b06fce",
      face: { skin: "#f3cfa6", hair: "long", hairColor: "#e0aa3e", eyes: "#3a548a", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["My heart will go on... y el bote conmigo."], lose: ["Le grand amour se fue de la mesa."], bet: ["Una balada de apuesta."], allin: ["¡Va a nevar en Moscú antes de... ¡ALL-IN!"] },
    { id: "chen", name: "Chen", title: "La Estrella de Artes Marciales", tier: 5, profile: "agresivo", color: "#c9a227",
      face: { skin: "#ecc398", hair: "buzz", hairColor: "#17140f", eyes: "#3a2416", mouth: "laugh", brow: "flat", facial: "none", acc: "none" },
      win: ["¡Mierda... con sonrisa!"], lose: ["Este stunt salió mal."], bet: ["Una patada de fichas."], allin: ["¡Todo el estudio al cine: ALL-IN!"] },
    { id: "yao", name: "Yao", title: "El Gigante del Pívot", tier: 5, profile: "conservador", color: "#2f9d7a",
      face: { skin: "#ecc398", hair: "buzz", hairColor: "#17140f", eyes: "#3a2416", mouth: "serious", brow: "flat", facial: "stubble", acc: "none" },
      win: ["La torre mira desde arriba."], lose: ["Hasta las torres tambalean."], bet: ["Un mate suave."], allin: ["¡Ocho pies de ALL-IN!"] },
    { id: "bruce", name: "Bruce L.", title: "El Dragón del Farol", tier: 5, profile: "dificil", color: "#e23b3b",
      face: { skin: "#d9a273", hair: "buzz", hairColor: "#17140f", eyes: "#241a12", mouth: "poker", brow: "flat", facial: "none", acc: "none" },
      win: ["Be water, my friend."], lose: ["El agua también me rodea."], bet: ["Toma una gota de farol."], allin: ["¡Cómo el agua que todo lo llena: ALL-IN!"] },

    /* ---- tier 6 · Las Vegas ---- */
    { id: "elvis", name: "Elvis 'The King'", title: "El Rey del Show", tier: 6, profile: "farolero", color: "#f5c542",
      face: { skin: "#f0c9a0", hair: "short", hairColor: "#17140f", eyes: "#3a548a", mouth: "smirk", brow: "high", facial: "stubble", acc: "none" },
      win: ["Thank you, thank you very much."], lose: ["Vegas me dejó... todo sacudido."], bet: ["Uhn-chan-chun, apuesto mi amor."], allin: ["¡ALL-IN, baby! ¡Yeah!"] },
    { id: "missv", name: "Miss V", title: "La Croupier Estrella", tier: 6, profile: "dificil", color: "#9ad0ff",
      face: { skin: "#eec6a0", hair: "long", hairColor: "#e0aa3e", eyes: "#2c3a5a", mouth: "smile", brow: "soft", facial: "none", acc: "earring" },
      win: ["Las luces siempre apuntan a la casa."], lose: ["La casa... acaba de perder. Raro."], bet: ["Cariño, la ruleta no te salvará."], allin: ["Se abre el telón: ALL-IN."] },
    { id: "phil", name: "El Gran Phil", title: "La Leyenda", tier: 6, profile: "dificil", color: "#e8b04b",
      face: { skin: "#e6bb8b", hair: "short", hairColor: "#d8d2c8", eyes: "#4a2e18", mouth: "poker", brow: "flat", facial: "stubble", acc: "glasses" },
      win: ["La leyenda sigue intacta."], lose: ["Hoy escribiste una nueva leyenda."], bet: ["Lo he visto todo... pero sube."], allin: ["De leyenda a leyenda: ALL-IN."] },
    { id: "jack", name: "Bandido Jack", title: "El Forajido", tier: 6, profile: "agresivo", color: "#b5651d",
      face: { skin: "#c98b5e", hair: "ponytail", hairColor: "#221a11", eyes: "#3a2416", mouth: "smirk", brow: "angled", facial: "stubble", acc: "eyepatch" },
      win: ["¡Asalto perfecto!"], lose: ["Me dispararon al bote. ¡La próxima te pillo!"], bet: ["¡Manos arriba y apuesto!"], allin: ["¡El gran golpe: ALL-IN!"] },
    { id: "roca", name: "El Roca", title: "La Montaña del Ring", tier: 6, profile: "agresivo", color: "#7cab56",
      face: { skin: "#c08248", hair: "buzz", hairColor: "#17140f", eyes: "#4a2e18", mouth: "serious", brow: "flat", facial: "beard", acc: "shades" },
      win: ["¿Puedes sentir... al campeón?"], lose: ["El Roca se despide con cariño."], bet: ["Brutos pero cariñosos."], allin: ["¡Si hueles... lo que el Roca cocina: ALL-IN!"] },
    { id: "kobe", name: "Kobe", title: "La Mamba de los Lakers", tier: 6, profile: "dificil", color: "#9ad0ff",
      face: { skin: "#b27a4a", hair: "fade", hairColor: "#17140f", eyes: "#241a12", mouth: "poker", brow: "angled", facial: "goatee", acc: "none" },
      win: ["La Mamba nunca da por perdida una mano."], lose: ["Derrota = nueva historia."], bet: ["Irresponsable y genial."], allin: ["¡Los Lakers del farol: ALL-IN!"] }
  ];

  /* ------------------------------------------------------------------ *
   *  CIUDADES, CASINOS Y MESAS                                          *
   * ------------------------------------------------------------------ */
  const CITIES = [
    {
      id: "villa", index: 0, tier: 1, unlockGold: 0,
      name: "Villa Fichas", flag: "\uD83C\uDFE1", country: "Reino de los Naipes",
      tagline: "Un pueblito polvoriento donde todos farolean por un puñado de monedas.",
      sky: ["#f7c873", "#c9784f", "#6b3b2e"], ground: "#8a5a33", accent: "#e0a863",
      casinos: [
        { id: "saloon", name: "Salón del Ferrocarril", desc: "El único garito del pueblo. Cuidado con la puerta batiente.",
          tables: [
            { id: "v1", game: "poker", name: "Mesa del Pozo", seats: 4, smallBlind: 5, bigBlind: 10, buyIn: 100, desc: "Entrada humilde para empezar a foguearse." },
            { id: "v2", game: "poker", name: "Mesa Grande", seats: 6, smallBlind: 10, bigBlind: 20, buyIn: 200, desc: "Aquí se sientan los valientes del valle." },
            { id: "v3", game: "blackjack", name: "Mesa 21", minBet: 10, maxBet: 200, buyIn: 150, desc: "El croupier reparte cartas de madrugada." }
          ] }
      ]
    },
    {
      id: "puerto", index: 1, tier: 2, unlockGold: 1500,
      name: "Puerto Azar", flag: "\u2693", country: "Costa del Farol",
      tagline: "Muelle, ron y faroles. El dinero pasa de barco en barco.",
      sky: ["#5aa9c9", "#2c6f89", "#143a4a"], ground: "#1e4b5c", accent: "#63c2e0",
      casinos: [
        { id: "muelle", name: "Casino del Muelle", desc: "Sobre las olas, al son de acordeones y dados.",
          tables: [
            { id: "p1", game: "poker", name: "Mesa Tornado", seats: 6, smallBlind: 25, bigBlind: 50, buyIn: 500, desc: "Seis marineros con ganas de tormenta." },
            { id: "p2", game: "poker", name: "Gran Mesa del Puerto", seats: 8, smallBlind: 40, bigBlind: 80, buyIn: 800, desc: "Ocho sillas, una sola bolsa de oro." },
            { id: "p3", game: "blackjack", name: "Mesa del Farero", minBet: 25, maxBet: 1200, buyIn: 1000, desc: "El croupier no pierde el rumbo." }
          ] }
      ]
    },
    {
      id: "madrid", index: 2, tier: 2, unlockGold: 3500,
      name: "Madrid", flag: "\uD83C\uDFEB", country: "España",
      tagline: "Faroles, tapas y duende. Aquí el coraje se sirve en copas.",
      sky: ["#e8b861", "#c05b3a", "#4a1d1f"], ground: "#6e3b28", accent: "#e8c15a",
      casinos: [
        { id: "granvia", name: "Gran Vía del Farol", desc: "Neones de antaño y mesas de madera noble.",
          tables: [
            { id: "m1", game: "poker", name: "Mesa del Oso y el Madroño", seats: 6, smallBlind: 20, bigBlind: 40, buyIn: 400, desc: "Se apuesta con la gracia de un chotis." },
            { id: "m2", game: "blackjack", name: "Ventiquiuno Castizo", minBet: 20, maxBet: 900, buyIn: 700, desc: "El croupier tiene duende." }
          ] }
      ]
    },
    {
      id: "cartagena", index: 3, tier: 2, unlockGold: 6000,
      name: "Cartagena de Indias", flag: "\uD83C\uDEF5\uFE0F", country: "Colombia",
      tagline: "Murallas, brisa y cumbia. Aquí se juega con el sabor del Caribe.",
      sky: ["#ffd98a", "#f28c4f", "#3a2440"], ground: "#a5642f", accent: "#ffb54a",
      casinos: [
        { id: "portal", name: "Portal de los Dulces", desc: "Dulces de leche y apuestas de fuego.",
          tables: [
            { id: "c1", game: "poker", name: "Mesa de la Cumbia", seats: 6, smallBlind: 15, bigBlind: 30, buyIn: 350, desc: "Ritmo caribeño en cada farol." },
            { id: "c2", game: "blackjack", name: "Mesa del Farol de la Popa", minBet: 15, maxBet: 700, buyIn: 500, desc: "La torre vigila tus apuestas." }
          ] }
      ]
    },
    {
      id: "monaco", index: 4, tier: 3, unlockGold: 10000,
      name: "Monte Carlo", flag: "\uD83C\uDFF0", country: "Principado del Golfo",
      tagline: "Lujo, fracs y diamantes. Aquí se juega con elegancia mortal.",
      sky: ["#2b3a67", "#151d3b", "#080c1a"], ground: "#1a2340", accent: "#caa84a",
      casinos: [
        { id: "montecarlo", name: "Casino de Montecarlo", desc: "Mármol, lámparas de cristal y sonrisas falsas.",
          tables: [
            { id: "mc1", game: "poker", name: "Salle de Tartes", seats: 6, smallBlind: 100, bigBlind: 200, buyIn: 2000, desc: "Aristócratas que nunca dicen su cifra." },
            { id: "mc2", game: "poker", name: "Salón de Cristal", seats: 8, smallBlind: 150, bigBlind: 300, buyIn: 3000, desc: "La mesa más elegante del principado." },
            { id: "mc3", game: "blackjack", name: "Table du Roi", minBet: 100, maxBet: 4000, buyIn: 3500, desc: "Ruleta de terciopelo y croupiers impecables." }
          ] }
      ]
    },
    {
      id: "tokio", index: 5, tier: 4, unlockGold: 30000,
      name: "Tokio", flag: "\uD83C\uDF93", country: "Japón",
      tagline: "Neones, templos y shōgi. La precisión manda sobre la suerte.",
      sky: ["#2a1a4a", "#8b0f4a", "#ff4d6d"], ground: "#1a0b2e", accent: "#ff6bb0",
      casinos: [
        { id: "shibuya", name: "Shibuya Nights", desc: "Luces de neón y mesas que nunca duermen.",
          tables: [
            { id: "t1", game: "poker", name: "Mesa del Dragón de Neón", seats: 6, smallBlind: 200, bigBlind: 400, buyIn: 4000, desc: "La precisión del shōgi aplicada al farol." },
            { id: "t2", game: "blackjack", name: "Mesa Harajuku 21", minBet: 200, maxBet: 7000, buyIn: 6000, desc: "Moda, color y veintiún perfectos." }
          ] }
      ]
    },
    {
      id: "moscu", index: 6, tier: 4, unlockGold: 40000,
      name: "Moscú", flag: "\uD83D\uDD4B", country: "Rusia",
      tagline: "Nieve, acero y vodka. Apuestas que no perdonan.",
      sky: ["#3a4a6a", "#1a2440", "#0a0f1e"], ground: "#141c30", accent: "#cf3a4a",
      casinos: [
        { id: "rojo", name: "Rojo y Negro", desc: "Terciopelo, candelabros y negocios oscuros.",
          tables: [
            { id: "r1", game: "poker", name: "Mesa de la Estepa", seats: 8, smallBlind: 150, bigBlind: 300, buyIn: 3500, desc: "Ocho jugadores y una sola tormenta." },
            { id: "r2", game: "blackjack", name: "Mesa Matrioska", minBet: 150, maxBet: 5000, buyIn: 4500, desc: "Una sorpresa dentro de otra." }
          ] }
      ]
    },
    {
      id: "dubai", index: 7, tier: 4, unlockGold: 50000,
      name: "Dubái", flag: "\uD83C\uDFD9\uFE0F", country: "Emiratos del Golfo",
      tagline: "Rascacielos, oro y petrodólares. Todo brilla, todo se apuesta.",
      sky: ["#ffd98a", "#e08a3c", "#5a2d1a"], ground: "#a5642f", accent: "#ffcf5c",
      casinos: [
        { id: "royal", name: "Royal Dubai Casino", desc: "Fuentes de oro y vistas al desierto infinito.",
          tables: [
            { id: "d1", game: "poker", name: "Mesa del Petróleo", seats: 6, smallBlind: 250, bigBlind: 500, buyIn: 5000, desc: "Poetas que apuestan torres de fichas." },
            { id: "d2", game: "poker", name: "Mesa del Sultán", seats: 8, smallBlind: 400, bigBlind: 800, buyIn: 8000, desc: "El dinero aquí jamás duerme." },
            { id: "d3", game: "blackjack", name: "Mesa Mil y Una", minBet: 250, maxBet: 9000, buyIn: 7000, desc: "Cuentos de mil y una fichas." }
          ] }
      ]
    },
    {
      id: "newyork", index: 8, tier: 5, unlockGold: 90000,
      name: "Nueva York", flag: "\uD83D\uDD6E\uFE0F", country: "EE. UU.",
      tagline: "La ciudad que no duerme. Rascacielos, vientres y faroles brutales.",
      sky: ["#1c1c2e", "#3a3a58", "#111120"], ground: "#1a1a28", accent: "#e8c15a",
      casinos: [
        { id: "chinatown", name: "Manhattan Poker Club", desc: "Entre Wall Street y el show del farol.",
          tables: [
            { id: "n1", game: "poker", name: "Mesa Wall Street", seats: 6, smallBlind: 500, bigBlind: 1000, buyIn: 10000, desc: "Brokers del farol en plena burbuja." },
            { id: "n2", game: "blackjack", name: "Mesa Times Square", minBet: 500, maxBet: 12000, buyIn: 12000, desc: "Mil luces, una sola carta." }
          ] }
      ]
    },
    {
      id: "vancouver", index: 9, tier: 5, unlockGold: 110000,
      name: "Vancouver", flag: "\uD83C\uDDE8\uD83C\uDDE6", country: "Canadá",
      tagline: "Bosques, niebla y hockey. Cortesía extrema y faroles congelados.",
      sky: ["#7fb2c9", "#4a7a93", "#1c3a4a"], ground: "#27455c", accent: "#63c2e0",
      casinos: [
        { id: "harbor", name: "Gastown Casino", desc: "Ladrillos, reloj de vapor y elegancia tranquila.",
          tables: [
            { id: "g1", game: "poker", name: "Mesa del Oro de Klondike", seats: 8, smallBlind: 400, bigBlind: 800, buyIn: 9000, desc: "Fiebre del oro con modales." },
            { id: "g2", game: "blackjack", name: "Mesa del Reloj de Vapor", minBet: 400, maxBet: 10000, buyIn: 10000, desc: "Cada hora, un farol nuevo." }
          ] }
      ]
    },
    {
      id: "macao", index: 10, tier: 5, unlockGold: 150000,
      name: "Macao", flag: "\uD83C\uDFEE", country: "Costa Sur de China",
      tagline: "Neones, dragones rojos y apuestas que superan a Las Vegas.",
      sky: ["#ff4d6d", "#8b0f37", "#2a0413"], ground: "#3a0a1c", accent: "#ff6b8a",
      casinos: [
        { id: "lisboa", name: "Grand Lisboa Macao", desc: "Una flor de neón que nunca cierra.",
          tables: [
            { id: "l1", game: "poker", name: "Mesa del Dragón", seats: 8, smallBlind: 800, bigBlind: 1600, buyIn: 16000, desc: "Dragones que echan fuego por la boca." },
            { id: "l2", game: "blackjack", name: "Mesa de la Fortuna Roja", minBet: 800, maxBet: 18000, buyIn: 18000, desc: "Sobres rojos y suerte de dragón." }
          ] }
      ]
    },
    {
      id: "vegas", index: 11, tier: 6, unlockGold: 200000,
      name: "Las Vegas", flag: "\uD83C\uDFB0", country: "Nevada, USA",
      tagline: "La ciudad del pecado. El tope de All-In Kingdom. El sueño dorado.",
      sky: ["#7b2ff7", "#f107a3", "#1a0b2e"], ground: "#120822", accent: "#ff5ea8",
      casinos: [
        { id: "strip", name: "The Strip", desc: "Mil luces, un solo trono. La última frontera.",
          tables: [
            { id: "v1", game: "poker", name: "Mesa High Roller", seats: 6, smallBlind: 1000, bigBlind: 2000, buyIn: 20000, desc: "Los mejores del mundo apuestan aquí." },
            { id: "v2", game: "poker", name: "La Mesa del Rey", seats: 8, smallBlind: 1500, bigBlind: 3000, buyIn: 30000, desc: "El duelo final por el trono del reino." },
            { id: "v3", game: "blackjack", name: "Mesa de los Millones", minBet: 1000, maxBet: 30000, buyIn: 30000, desc: "Donde los sueños se compran y se pierden." }
          ] }
      ]
    }
  ];

  /* ------------------------------------------------------------------ *
   *  GENERADOR DE BOTS                                                  *
   * ------------------------------------------------------------------ */
  function charactersForTier(tier) {
    return CHARACTERS.filter(function (c) { return c.tier <= tier; });
  }

  /** Elige `count` bots concretos para una mesa de una ciudad. */
  function pickBots(cityTier, count, seed) {
    const pool = charactersForTier(cityTier).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    pool.sort(function (a, b) { return (b.tier === cityTier ? 1 : 0) - (a.tier === cityTier ? 1 : 0); });
    const bots = [];
    for (let i = 0; i < count; i++) {
      const c = pool[i % pool.length];
      bots.push({
        id: c.id + "_" + i,
        charId: c.id,
        name: c.name,
        title: c.title,
        face: c.face,
        color: c.color,
        skin: c.face.skin,
        profile: c.profile,
        cityTier: c.tier,
        quips: { win: c.win, lose: c.lose, bet: c.bet, allin: c.allin }
      });
    }
    return bots;
  }

  /* ------------------------------------------------------------------ *
   *  ESTADO / GUARDADO                                                  *
   * ------------------------------------------------------------------ */
  const SAVE_KEY = "allin_kingdom_save_v2";

  function defaultPlayer() {
    return {
      name: "Jugador",
      age: 18,
      photo: "",
      face: null,
      color: "#f5c542",
      gold: 500,
      city: "villa",
      visited: ["villa"],
      tablesWon: 0,
      loans: 0,
      stats: { handsPlayed: 0, handsWon: 0, biggestPot: 0, bestCity: "Villa Fichas" }
    };
  }

  function save(state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return Object.assign(defaultPlayer(), JSON.parse(raw));
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
  function cityById(id) { return CITIES.find(function (c) { return c.id === id; }) || CITIES[0]; }
  function tableById(cityId, tableId) {
    const city = cityById(cityId);
    for (const cas of city.casinos) {
      const t = cas.tables.find(function (x) { return x.id === tableId; });
      if (t) return { city: city, casino: cas, table: t };
    }
    return null;
  }
  function isCityUnlocked(state, city) { return state.gold >= city.unlockGold; }

  /* ------------------------------------------------------------------ *
   *  TEMAS DE MESA POR CIUDAD (cada casino, un color distinto)          *
   * ------------------------------------------------------------------ */
  const TABLE_THEMES = {
    villa:      { felt: "#0e3d2f", felt2: "#0a2c22", edge: "#061a13", rail: "#4a2f16", mark: "♠", markColor: "rgba(235,240,250,.05)" },
    puerto:     { felt: "#0c3a49", felt2: "#082b38", edge: "#051a24", rail: "#173b4a", mark: "⚓", markColor: "rgba(180,240,255,.05)" },
    madrid:     { felt: "#4a1414", felt2: "#360d0d", edge: "#200707", rail: "#6e3b1a", mark: "♠", markColor: "rgba(255,200,180,.06)" },
    cartagena:  { felt: "#1c4a2e", felt2: "#123a22", edge: "#0a2415", rail: "#7a5322", mark: "❦", markColor: "rgba(255,230,150,.06)" },
    monaco:     { felt: "#16264f", felt2: "#0f1c3d", edge: "#080f22", rail: "#28335c", mark: "♦", markColor: "rgba(200,220,255,.06)" },
    tokio:      { felt: "#2a1040", felt2: "#1e0a30", edge: "#12051d", rail: "#3d1450", mark: "❀", markColor: "rgba(255,120,220,.09)" },
    moscu:      { felt: "#3a0d14", felt2: "#2a080e", edge: "#160305", rail: "#4a1418", mark: "♠", markColor: "rgba(255,180,180,.06)" },
    dubai:      { felt: "#4a3410", felt2: "#372708", edge: "#201503", rail: "#6e5320", mark: "♠", markColor: "rgba(255,225,150,.07)" },
    newyork:    { felt: "#1a2233", felt2: "#121828", edge: "#080c16", rail: "#2b3550", mark: "★", markColor: "rgba(200,215,255,.06)" },
    vancouver:  { felt: "#1d3a44", felt2: "#153039", edge: "#0b1e25", rail: "#284c56", mark: "♠", markColor: "rgba(190,235,245,.06)" },
    macao:      { felt: "#4a0d1a", felt2: "#360810", edge: "#1e0409", rail: "#7a1424", mark: "龍", markColor: "rgba(255,170,170,.07)" },
    vegas:      { felt: "#241043", felt2: "#180a30", edge: "#0d041c", rail: "#3a1a5c", mark: "♠", markColor: "rgba(230,170,255,.09)" }
  };
  const DEFAULT_THEME = { felt: "#0e3d2f", felt2: "#0a2c22", edge: "#061a13", rail: "#4a2f16", mark: "♠", markColor: "rgba(235,240,250,.05)" };
  CITIES.forEach(function (city) { city.theme = TABLE_THEMES[city.id] || DEFAULT_THEME; });

  /* ------------------------------------------------------------------ *
   *  HIPODROMOS (apuestas de caballos) en varias ciudades               *
   * ------------------------------------------------------------------ */
  const RACETRACKS = {
    villa:     { minBet: 10,   maxBet: 300,   buyIn: 200,   horses: 6 },
    puerto:    { minBet: 25,   maxBet: 1000,  buyIn: 600,   horses: 6 },
    madrid:    { minBet: 20,   maxBet: 800,   buyIn: 500,   horses: 7 },
    monaco:    { minBet: 100,  maxBet: 5000,  buyIn: 3000,  horses: 8 },
    dubai:     { minBet: 250,  maxBet: 9000,  buyIn: 6000,  horses: 8 },
    macao:     { minBet: 800,  maxBet: 18000, buyIn: 15000, horses: 8 }
  };
  Object.keys(RACETRACKS).forEach(function (cid) {
    const city = cityById(cid);
    if (!city) return;
    const cfg = RACETRACKS[cid];
    city.casinos[0].tables.push({
      id: cid + "_hp", game: "horses",
      name: "Hipódromo " + city.name,
      minBet: cfg.minBet, maxBet: cfg.maxBet, buyIn: cfg.buyIn, numHorses: cfg.horses,
      desc: "Apuesta a tu caballo favorito y mira la carrera."
    });
  });

  AK.CHARACTERS = CHARACTERS;
  AK.CITIES = CITIES;
  AK.defaultPlayer = defaultPlayer;
  AK.saveGame = save;
  AK.loadGame = load;
  AK.clearSave = clearSave;
  AK.cityById = cityById;
  AK.tableById = tableById;
  AK.isCityUnlocked = isCityUnlocked;
  AK.pickBots = pickBots;
})(window);